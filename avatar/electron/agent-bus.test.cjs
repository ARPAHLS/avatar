"use strict";

const assert = require("node:assert/strict");
const http = require("node:http");
const test = require("node:test");
const WebSocket = require("ws");
const {
  COMMAND_PATH,
  SOCKET_PATH,
  STATE_PATH,
  createAgentBusServer,
  hostAllowed,
} = require("./agent-bus.cjs");

// The renderer's own resolver, loaded exactly the way main.cjs loads it. If
// that import ever stops working from CommonJS, these tests are where it shows.
const resolverReady = import("../src/lib/stageCommands.js");

const CONTEXT = {
  animationCatalog: [
    { id: "vrma-03", label: "Peace Sign", source: "vrma", vrmaUrl: "/peace.vrma" },
    { id: "default", label: "Default", source: "sequence", sequence: ["vrma-03"] },
  ],
  avatarIds: ["avatar1", "avatar2"],
  environmentIds: ["env-forest"],
  audioSourceIds: ["system", "microphone"],
};

const STATE = {
  animations: [{ id: "vrma-03", label: "Peace Sign", playableOnce: true }],
  avatars: [{ id: "avatar1" }],
};

/**
 * @param {import('node:test').TestContext} context
 * @param {{ stageContext?: unknown, state?: unknown, token?: string | null }} [options]
 */
async function startServer(context, { stageContext = CONTEXT, state = STATE, token = null } = {}) {
  const { resolveStageCommand } = await resolverReady;
  const applied = [];
  const server = createAgentBusServer({
    port: 0,
    resolveCommand: resolveStageCommand,
    getContext: () => stageContext,
    getState: () => state,
    applyAction: (action) => applied.push(action),
    getToken: () => token,
  });
  const address = await server.listen();
  context.after(() => server.close());
  return { port: address.port, applied };
}

/**
 * @param {number} port
 * @param {{ method?: string, path?: string, body?: string, headers?: Record<string, string>,
 *   omitHost?: boolean }} [options]
 */
function request(port, { method = "POST", path = COMMAND_PATH, body, headers = {} } = {}) {
  return new Promise((resolve, reject) => {
    const outgoing = {
      "content-type": "application/json",
      ...headers,
    };
    if (body !== undefined && outgoing["content-length"] === undefined) {
      outgoing["content-length"] = String(Buffer.byteLength(body));
    }

    const req = http.request({ host: "127.0.0.1", port, path, method, headers: outgoing }, (response) => {
      const chunks = [];
      response.on("data", (chunk) => chunks.push(chunk));
      response.on("end", () => {
        const text = Buffer.concat(chunks).toString("utf8");
        let json = null;
        try {
          json = JSON.parse(text);
        } catch {
          // A few paths answer with no body at all.
        }
        resolve({ status: response.statusCode, body: json, text });
      });
    });
    req.on("error", reject);
    if (body !== undefined) req.write(body);
    req.end();
  });
}

/** @param {number} port */
function command(port, payload, options = {}) {
  return request(port, { body: JSON.stringify(payload), ...options });
}

test("hostAllowed accepts only loopback on the port we bound", () => {
  assert.equal(hostAllowed("127.0.0.1:47903", 47903), true);
  assert.equal(hostAllowed("localhost:47903", 47903), true);
  assert.equal(hostAllowed("[::1]:47903", 47903), true);
  assert.equal(hostAllowed("127.0.0.1:9999", 47903), false);
  assert.equal(hostAllowed("avatar.example:47903", 47903), false);
  assert.equal(hostAllowed("127.0.0.1:47903@evil.example", 47903), false);
  assert.equal(hostAllowed("", 47903), false);
  assert.equal(hostAllowed(undefined, 47903), false);
});

test("accepts a command and hands the resolved action to the window", async (t) => {
  const { port, applied } = await startServer(t);

  const { status, body } = await command(port, {
    command: "animation.play",
    payload: { id: "Peace Sign", mode: "once" },
  });

  assert.equal(status, 200);
  assert.equal(body.ok, true);
  // Resolved by label, answered by id — a custom folder hashes its ids from
  // file paths, so the label is all a caller can know.
  assert.deepEqual(applied, [{ kind: "animation.play", animationId: "vrma-03", mode: "once" }]);
});

test("an omitted mode still means select, and still reaches the window", async (t) => {
  const { port, applied } = await startServer(t);

  const { status } = await command(port, { command: "animation.play", payload: { id: "vrma-03" } });

  assert.equal(status, 200);
  assert.deepEqual(applied, [{ kind: "animation.play", animationId: "vrma-03", mode: "select" }]);
});

test("maps every stage error code onto its status, and applies nothing", async (t) => {
  const { port, applied } = await startServer(t);

  const cases = [
    [{ command: "animation.fly", payload: {} }, 400, "unknown-command"],
    [{ command: "animation.play", payload: {} }, 400, "bad-payload"],
    [{ command: "animation.play", payload: { id: "Nope" } }, 404, "unknown-animation"],
    [{ command: "avatar.set", payload: { id: "avatar9" } }, 404, "unknown-avatar"],
    [{ command: "environment.set", payload: { type: "env", id: "env-moon" } }, 404, "unknown-environment"],
    [{ command: "audio.source", payload: { id: "kazoo" } }, 404, "unknown-audio-source"],
    // The Default sequence loops for as long as it is selected, so it cannot
    // be a one-shot.
    [{ command: "animation.play", payload: { id: "default", mode: "once" } }, 409, "not-playable-once"],
  ];

  for (const [payload, status, code] of cases) {
    const response = await command(port, payload);
    assert.equal(response.status, status, `${payload.command} → ${code}`);
    assert.equal(response.body.code, code);
    assert.equal(response.body.ok, false);
  }

  assert.deepEqual(applied, []);
});

test("answers 503 until the window has reported a catalog", async (t) => {
  const { port } = await startServer(t, { stageContext: null, state: null });

  const posted = await command(port, { command: "animation.default" });
  assert.equal(posted.status, 503);
  assert.equal(posted.body.code, "not-ready");

  const state = await request(port, { method: "GET", path: STATE_PATH });
  assert.equal(state.status, 503);
  assert.equal(state.body.code, "not-ready");
});

test("GET /v1/state returns the catalog the window reported", async (t) => {
  const { port } = await startServer(t);

  const { status, body } = await request(port, { method: "GET", path: STATE_PATH });

  assert.equal(status, 200);
  assert.equal(body.ok, true);
  assert.deepEqual(body.animations, STATE.animations);
});

test("refuses anything that arrives with an Origin header", async (t) => {
  const { port, applied } = await startServer(t);

  const { status, body } = await command(
    port,
    { command: "animation.default" },
    { headers: { origin: "http://localhost:5173" } },
  );

  assert.equal(status, 403);
  assert.equal(body.code, "forbidden-origin");
  assert.deepEqual(applied, []);
});

test("refuses a Host that is not our own loopback port", async (t) => {
  const { port, applied } = await startServer(t);

  const { status, body } = await command(
    port,
    { command: "animation.default" },
    { headers: { host: "avatar.example" } },
  );

  assert.equal(status, 403);
  assert.equal(body.code, "forbidden-host");
  assert.deepEqual(applied, []);
});

test("requires the token when one is configured", async (t) => {
  const { port, applied } = await startServer(t, { token: "sekrit-token" });

  const missing = await command(port, { command: "animation.default" });
  assert.equal(missing.status, 401);
  assert.equal(missing.body.code, "unauthorized");

  const wrong = await command(
    port,
    { command: "animation.default" },
    { headers: { authorization: "Bearer nope" } },
  );
  assert.equal(wrong.status, 401);

  // Same length as the real one: the comparison is constant-time, not a
  // length check dressed up as one.
  const nearMiss = await command(
    port,
    { command: "animation.default" },
    { headers: { authorization: "Bearer sekrit-tokem" } },
  );
  assert.equal(nearMiss.status, 401);

  assert.deepEqual(applied, []);

  const accepted = await command(
    port,
    { command: "animation.default" },
    { headers: { authorization: "Bearer sekrit-token" } },
  );
  assert.equal(accepted.status, 200);
  assert.equal(applied.length, 1);
});

test("a token in the query string is not a substitute for the header", async (t) => {
  const { port } = await startServer(t, { token: "sekrit-token" });

  const { status } = await command(
    port,
    { command: "animation.default" },
    { path: `${COMMAND_PATH}?token=sekrit-token` },
  );

  assert.equal(status, 401);
});

test("rejects the wrong method, the wrong route and the wrong content type", async (t) => {
  const { port } = await startServer(t);

  const method = await request(port, { method: "GET", path: COMMAND_PATH });
  assert.equal(method.status, 405);

  const state = await request(port, { method: "POST", path: STATE_PATH, body: "{}" });
  assert.equal(state.status, 405);

  const route = await request(port, { method: "POST", path: "/v1/nope", body: "{}" });
  assert.equal(route.status, 404);

  const type = await request(port, {
    body: JSON.stringify({ command: "animation.default" }),
    headers: { "content-type": "text/plain" },
  });
  assert.equal(type.status, 415);
  assert.equal(type.body.code, "unsupported-media-type");
});

test("rejects malformed JSON and a body that is not an object", async (t) => {
  const { port } = await startServer(t);

  const malformed = await request(port, { body: "{not json" });
  assert.equal(malformed.status, 400);
  assert.equal(malformed.body.code, "bad-payload");

  const array = await request(port, { body: "[1,2,3]" });
  assert.equal(array.status, 400);
  assert.equal(array.body.code, "bad-payload");
});

test("rejects an oversized body with a reason rather than a reset", async (t) => {
  const { port } = await startServer(t);

  const { status, body } = await request(port, {
    body: JSON.stringify({ command: "animation.play", payload: { id: "x".repeat(32 * 1024) } }),
  });

  assert.equal(status, 413);
  assert.equal(body.code, "payload-too-large");
});

/**
 * @param {number} port
 * @param {Record<string, string>} [headers]
 */
function connect(port, headers = {}) {
  return new Promise((resolve, reject) => {
    const socket = new WebSocket(`ws://127.0.0.1:${port}${SOCKET_PATH}`, { headers });
    socket.once("open", () => resolve(socket));
    socket.once("error", reject);
  });
}

/** @param {import('ws')} socket */
function send(socket, frame) {
  return new Promise((resolve) => {
    socket.once("message", (data) => resolve(JSON.parse(data.toString())));
    // A string is sent as-is, so a test can hand the socket something that is
    // not JSON at all.
    socket.send(typeof frame === "string" ? frame : JSON.stringify(frame));
  });
}

test("the socket answers the same commands with the id echoed back", async (t) => {
  const { port, applied } = await startServer(t);
  const socket = await connect(port);
  t.after(() => socket.close());

  const reply = await send(socket, {
    id: "42",
    command: "animation.play",
    payload: { id: "Peace Sign", mode: "once" },
  });

  assert.equal(reply.id, "42");
  assert.equal(reply.ok, true);
  assert.deepEqual(applied, [{ kind: "animation.play", animationId: "vrma-03", mode: "once" }]);
});

test("the socket refuses frames it cannot answer, and never replies without an id", async (t) => {
  const { port } = await startServer(t);
  const socket = await connect(port);
  t.after(() => socket.close());

  const malformed = await send(socket, "{oops");
  assert.equal(malformed.ok, false);
  assert.equal(malformed.code, "bad-payload");

  const anonymous = await send(socket, { command: "animation.default" });
  assert.equal(anonymous.ok, false);
  assert.equal(anonymous.code, "bad-payload");
  assert.match(anonymous.error, /id/);
});

test("the socket handshake refuses a page origin and a missing token", async (t) => {
  const { port } = await startServer(t, { token: "sekrit-token" });

  await assert.rejects(
    connect(port, { authorization: "Bearer sekrit-token", origin: "http://localhost:5173" }),
    /403/,
  );
  await assert.rejects(connect(port), /401/);

  const socket = await connect(port, { authorization: "Bearer sekrit-token" });
  t.after(() => socket.close());
  assert.equal(socket.readyState, WebSocket.OPEN);
});
