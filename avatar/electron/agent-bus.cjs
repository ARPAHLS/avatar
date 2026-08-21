"use strict";

const crypto = require("node:crypto");
const http = require("node:http");
const { WebSocketServer } = require("ws");
const { MAX_MCP_BODY_BYTES, MCP_PATH, createMcpHandler } = require("./mcp-server.cjs");

/**
 * The local agent bus (Refs #6): a loopback-only command intake so agents and
 * scripts can drive the stage without scraping the UI.
 *
 * HTTP and WebSocket are peers here, not one wrapped in the other — both call
 * `dispatch` below, which is itself only a thin shell around the renderer's own
 * `resolveStageCommand`. That is the whole point: one set of command names, one
 * set of error codes, whether a request arrived from a panel, a hotkey, or a
 * curl.
 *
 * Everything this module needs from the app is injected, so the tests can run
 * it under plain `node --test` with no Electron and no window.
 */

// Same family as the VRoid Hub OAuth listener on 47901, and far from the
// ephemeral range so a fixed port stays free in practice.
const DEFAULT_AGENT_BUS_PORT = 47903;

const COMMAND_PATH = "/v1/command";
const STATE_PATH = "/v1/state";
const SOCKET_PATH = "/v1/socket";

// A stage command is a few hundred bytes at most; the cap exists so a stray
// upload cannot buffer unboundedly in the main process.
const MAX_BODY_BYTES = 16 * 1024;

const LOOPBACK_HOSTS = new Set(["127.0.0.1", "localhost", "[::1]"]);

/**
 * Stage error codes keep the meaning they have in the UI; the mapping only
 * decides how each one looks over HTTP.
 */
const STATUS_BY_CODE = Object.freeze({
  "bad-payload": 400,
  // The route exists and the request is well-formed JSON — the command name is
  // the thing that is wrong, so this is a 400 rather than a 404.
  "unknown-command": 400,
  "unknown-animation": 404,
  "unknown-avatar": 404,
  "unknown-environment": 404,
  "unknown-audio-source": 404,
  "not-playable-once": 409,
  // Not a stage code: the window has not reported a catalog yet.
  "not-ready": 503,
});

/**
 * @param {string | undefined} hostHeader
 * @param {number} port
 */
function hostAllowed(hostHeader, port) {
  if (typeof hostHeader !== "string" || hostHeader === "") return false;
  try {
    const url = new URL(`http://${hostHeader}`);
    if (url.username !== "" || url.password !== "" || url.pathname !== "/") return false;
    if (!LOOPBACK_HOSTS.has(url.hostname.toLowerCase())) return false;
    // A local client names the port it connected to. Anything else was
    // rewritten on the way in, which is not a path this bus supports.
    return url.port === "" || Number(url.port) === port;
  } catch {
    return false;
  }
}

/**
 * Constant-time so a wrong token cannot be narrowed down by timing. Length is
 * compared first because `timingSafeEqual` throws on a mismatch, which would
 * leak it anyway.
 * @param {string} expected
 * @param {string} received
 */
function tokenMatches(expected, received) {
  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(received, "utf8");
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

/** @param {import('node:http').IncomingMessage} request */
function bearerToken(request) {
  const header = request.headers.authorization;
  if (typeof header !== "string") return null;
  const match = /^Bearer\s+(\S+)$/i.exec(header.trim());
  return match ? match[1] : null;
}

function readBody(request, limit = MAX_BODY_BYTES) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    request.on("data", (chunk) => {
      size += chunk.length;
      if (size > limit) {
        // Stop reading but leave the socket alone: destroying it here would
        // race the 413 and the caller would see a reset instead of a reason.
        request.pause();
        reject(Object.assign(new Error("Body too large."), { tooLarge: true }));
        return;
      }
      chunks.push(chunk);
    });
    request.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    request.on("error", reject);
  });
}

/**
 * Answer first, then swallow the rest of what the caller is still sending.
 * Destroying the socket instead would reach the client before the response
 * did, and a 413 nobody can read is just a connection reset.
 * @param {import('node:http').IncomingMessage} request
 */
function drainAndDiscard(request, limit = MAX_BODY_BYTES) {
  let seen = 0;
  request.on("data", (chunk) => {
    seen += chunk.length;
    // A caller determined to keep talking is hung up on eventually.
    if (seen > limit * 8) request.destroy();
  });
  request.resume();
}

function sendJson(response, status, body) {
  const text = JSON.stringify(body);
  response.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "content-length": Buffer.byteLength(text),
    // Nothing here is cacheable, and an agent retrying a play must not be
    // served a stale 200 by anything sitting in between.
    "cache-control": "no-store",
  });
  response.end(text);
}

function failure(code, error) {
  return { ok: false, code, error };
}

/**
 * The bus's `{ ok: false, code, error }` means nothing to an MCP client, so
 * everything refused on `/mcp` — including the shared transport checks — is
 * answered in the shape that transport speaks.
 * @param {import('node:http').ServerResponse} response
 * @param {number} status
 * @param {number} code JSON-RPC error code.
 * @param {string} message
 */
function sendJsonRpcError(response, status, code, message) {
  // No `id`: these are refused before anything is parsed, so there is no
  // request id to echo. The spec allows an error response without one.
  sendJson(response, status, { jsonrpc: "2.0", error: { code, message } });
}

/** JSON-RPC codes used for the transport-level refusals above. */
const JSON_RPC_INVALID_REQUEST = -32600;
const JSON_RPC_PARSE_ERROR = -32700;
const JSON_RPC_SERVER_ERROR = -32000;

/**
 * The one place that decides a request is MCP's, so the error shape a failure
 * comes back in cannot disagree with the route that handled it.
 * @param {import('node:http').IncomingMessage} request
 */
function isMcpRequest(request) {
  try {
    return new URL(request.url ?? "/", "http://localhost").pathname === MCP_PATH;
  } catch {
    return false;
  }
}

/**
 * @param {Object} options
 * @param {string} [options.host]
 * @param {number} [options.port]
 * @param {(command: unknown, payload: unknown, context: unknown) => any} options.resolveCommand
 *   Normally `resolveStageCommand`; injected so this file stays loadable
 *   without the renderer's ESM modules.
 * @param {() => unknown} options.getContext The stage snapshot the window last
 *   reported, or null while it has not reported one.
 * @param {() => unknown} options.getState Body for `GET /v1/state`, or null for
 *   the same reason.
 * @param {(action: unknown) => void} options.applyAction Hands the resolved
 *   action to the window. One-way on purpose: a 200 means accepted, not that
 *   the model has finished loading.
 * @param {() => string | null} options.getToken Null when the user has turned
 *   `requireToken` off.
 * @param {string} [options.version] Reported to MCP clients as the server
 *   version; the app's own.
 */
function createAgentBusServer({
  host = "127.0.0.1",
  port = DEFAULT_AGENT_BUS_PORT,
  resolveCommand,
  getContext,
  getState,
  applyAction,
  getToken,
  version = "0.0.0",
}) {
  if (typeof resolveCommand !== "function") {
    throw new Error("createAgentBusServer requires a resolveCommand function.");
  }

  // The Host check compares against the port actually bound, not the one asked
  // for: port 0 (the tests) only resolves to a real number once listening.
  let boundPort = port;

  /**
   * The one place a request becomes a stage action, shared by both transports.
   * @param {unknown} command
   * @param {unknown} payload
   */
  function dispatch(command, payload) {
    const context = getContext();
    if (!context) {
      return failure("not-ready", "The avatar window is still starting up. Try again shortly.");
    }

    const result = resolveCommand(command, payload, context);
    // Last command wins, exactly as a hotkey does — no queue, no debounce.
    if (result?.ok) applyAction(result.action);
    return result;
  }

  const mcp = createMcpHandler({ dispatch, getState, version });

  /**
   * Transport-level checks, before anything is parsed. Returns null when the
   * request may proceed.
   * @param {import('node:http').IncomingMessage} request
   */
  function refuse(request) {
    if (!hostAllowed(request.headers.host, boundPort)) {
      return { status: 403, body: failure("forbidden-host", "This bus only answers on loopback.") };
    }

    // A browser attaches Origin to every cross-origin fetch and to every
    // WebSocket handshake, so refusing the header outright keeps web pages —
    // including a local dev server the user happens to have open — from
    // driving the avatar behind their back. Nothing that should reach this
    // bus sends one.
    if (typeof request.headers.origin === "string" && request.headers.origin !== "") {
      return {
        status: 403,
        body: failure("forbidden-origin", "Requests from a web page are not accepted."),
      };
    }

    const token = getToken();
    if (token) {
      const presented = bearerToken(request);
      if (!presented || !tokenMatches(token, presented)) {
        return {
          status: 401,
          body: failure("unauthorized", "Send the bus token as: Authorization: Bearer <token>."),
        };
      }
    }

    return null;
  }

  /**
   * `POST /mcp`. The MCP surface is a peer of the two routes below, sharing
   * their transport checks and their `dispatch` — see mcp-server.cjs.
   * @param {import('node:http').IncomingMessage} request
   * @param {import('node:http').ServerResponse} response
   */
  async function handleMcp(request, response) {
    if (request.method !== "POST") {
      // Protocol revision 2026-07-28 dropped the GET stream and DELETE
      // teardown, and this server is stateless besides. Clients written against
      // an older revision still try both, and a 405 is what tells them to stop
      // rather than to retry.
      response.setHeader("allow", "POST");
      sendJsonRpcError(
        response,
        405,
        JSON_RPC_INVALID_REQUEST,
        "This MCP endpoint is stateless: use POST.",
      );
      return;
    }

    const declared = Number(request.headers["content-length"]);
    if (Number.isFinite(declared) && declared > MAX_MCP_BODY_BYTES) {
      sendJsonRpcError(response, 413, JSON_RPC_INVALID_REQUEST, "Request body is too large.");
      drainAndDiscard(request, MAX_MCP_BODY_BYTES);
      return;
    }

    let raw;
    try {
      raw = await readBody(request, MAX_MCP_BODY_BYTES);
    } catch (error) {
      if (error && error.tooLarge) {
        sendJsonRpcError(response, 413, JSON_RPC_INVALID_REQUEST, "Request body is too large.");
        drainAndDiscard(request, MAX_MCP_BODY_BYTES);
      }
      return;
    }

    let frame;
    try {
      frame = JSON.parse(raw);
    } catch {
      sendJsonRpcError(response, 400, JSON_RPC_PARSE_ERROR, "Request body must be JSON.");
      return;
    }

    await mcp(request, response, frame);
  }

  async function handleRequest(request, response) {
    const url = new URL(request.url ?? "/", "http://localhost");
    const isMcp = isMcpRequest(request);

    const rejection = refuse(request);
    if (rejection) {
      if (isMcp) {
        sendJsonRpcError(response, rejection.status, JSON_RPC_INVALID_REQUEST, rejection.body.error);
      } else {
        sendJson(response, rejection.status, rejection.body);
      }
      return;
    }

    if (isMcp) {
      await handleMcp(request, response);
      return;
    }

    if (url.pathname === STATE_PATH) {
      if (request.method !== "GET") {
        sendJson(response, 405, failure("method-not-allowed", "Use GET for /v1/state."));
        return;
      }
      const state = getState();
      if (!state) {
        sendJson(
          response,
          503,
          failure("not-ready", "The avatar window is still starting up. Try again shortly."),
        );
        return;
      }
      sendJson(response, 200, { ok: true, ...state });
      return;
    }

    if (url.pathname !== COMMAND_PATH) {
      sendJson(response, 404, failure("not-found", `No route ${url.pathname}.`));
      return;
    }

    if (request.method !== "POST") {
      sendJson(response, 405, failure("method-not-allowed", "Use POST for /v1/command."));
      return;
    }

    const contentType = String(request.headers["content-type"] ?? "");
    if (!contentType.toLowerCase().includes("application/json")) {
      sendJson(
        response,
        415,
        failure("unsupported-media-type", "Send Content-Type: application/json."),
      );
      return;
    }

    const declared = Number(request.headers["content-length"]);
    if (Number.isFinite(declared) && declared > MAX_BODY_BYTES) {
      sendJson(response, 413, failure("payload-too-large", "Request body is too large."));
      drainAndDiscard(request);
      return;
    }

    let raw;
    try {
      raw = await readBody(request);
    } catch (error) {
      if (error && error.tooLarge) {
        sendJson(response, 413, failure("payload-too-large", "Request body is too large."));
        drainAndDiscard(request);
      }
      // Anything else is the caller hanging up mid-request; there is nobody
      // left to answer.
      return;
    }

    let frame;
    try {
      frame = JSON.parse(raw);
    } catch {
      sendJson(response, 400, failure("bad-payload", "Request body must be JSON."));
      return;
    }

    if (!frame || typeof frame !== "object" || Array.isArray(frame)) {
      sendJson(
        response,
        400,
        failure("bad-payload", 'Send { "command": …, "payload": … }.'),
      );
      return;
    }

    const result = dispatch(frame.command, frame.payload);
    sendJson(response, result.ok ? 200 : (STATUS_BY_CODE[result.code] ?? 400), result);
  }

  const server = http.createServer((request, response) => {
    // Nothing above is meant to throw, but `applyAction` reaches a window that
    // can be torn down mid-request. Unhandled, that would leave the caller
    // holding a socket which is never answered.
    handleRequest(request, response).catch(() => {
      if (response.headersSent) {
        response.destroy();
        return;
      }
      const message = "The avatar window could not be reached.";
      if (isMcpRequest(request)) {
        sendJsonRpcError(response, 500, JSON_RPC_SERVER_ERROR, message);
        return;
      }
      sendJson(response, 500, failure("internal-error", message));
    });
  });

  // Malformed HTTP never reaches the handler above, and the default behaviour
  // is to log to stderr — noise the user cannot act on.
  server.on("clientError", (_error, socket) => {
    if (socket.writable) socket.end("HTTP/1.1 400 Bad Request\r\n\r\n");
    socket.destroy();
  });

  const sockets = new WebSocketServer({ noServer: true });

  server.on("upgrade", (request, socket, head) => {
    const url = new URL(request.url ?? "/", "http://localhost");
    if (url.pathname !== SOCKET_PATH) {
      socket.end("HTTP/1.1 404 Not Found\r\n\r\n");
      return;
    }

    // Same three checks as HTTP, before the handshake completes: an upgrade
    // that succeeds and is then closed still tells a web page the bus is here.
    const rejection = refuse(request);
    if (rejection) {
      socket.end(`HTTP/1.1 ${rejection.status} ${rejection.status === 401 ? "Unauthorized" : "Forbidden"}\r\n\r\n`);
      return;
    }

    sockets.handleUpgrade(request, socket, head, (ws) => {
      sockets.emit("connection", ws, request);
    });
  });

  sockets.on("connection", (ws) => {
    ws.on("message", (data) => {
      let frame;
      try {
        frame = JSON.parse(data.toString());
      } catch {
        ws.send(JSON.stringify({ id: null, ...failure("bad-payload", "Each frame must be JSON.") }));
        return;
      }

      if (!frame || typeof frame !== "object" || Array.isArray(frame)) {
        ws.send(
          JSON.stringify({ id: null, ...failure("bad-payload", 'Send { "id": …, "command": … }.') }),
        );
        return;
      }

      // Every reply carries an `id`: the one that was sent, or null when the
      // frame had none to echo. That is the v1 contract — if outbound state
      // events arrive in a later version they will carry no `id` at all and a
      // `type` instead, so a client written today can ignore them.
      const id = typeof frame.id === "string" || typeof frame.id === "number" ? frame.id : null;
      if (id === null) {
        ws.send(
          JSON.stringify({ id: null, ...failure("bad-payload", "Each frame needs an id.") }),
        );
        return;
      }

      let reply;
      try {
        reply = dispatch(frame.command, frame.payload);
      } catch {
        reply = failure("internal-error", "The avatar window could not be reached.");
      }
      ws.send(JSON.stringify({ id, ...reply }));
    });
  });

  return {
    /** @returns {Promise<import('node:net').AddressInfo | string | null>} */
    listen: () =>
      new Promise((resolve, reject) => {
        server.once("error", reject);
        server.listen(port, host, () => {
          server.off("error", reject);
          const address = server.address();
          if (address && typeof address === "object") boundPort = address.port;
          resolve(address);
        });
      }),
    close: () =>
      new Promise((resolve, reject) => {
        // Open sockets would otherwise hold the port past the user turning the
        // bus off in Settings.
        for (const client of sockets.clients) client.terminate();
        sockets.close(() => {
          server.close((error) => (error ? reject(error) : resolve()));
        });
      }),
  };
}

module.exports = {
  COMMAND_PATH,
  DEFAULT_AGENT_BUS_PORT,
  MCP_PATH,
  SOCKET_PATH,
  STATE_PATH,
  createAgentBusServer,
  hostAllowed,
};
