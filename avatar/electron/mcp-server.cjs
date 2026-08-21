"use strict";

const { McpServer } = require("@modelcontextprotocol/sdk/server/mcp.js");
const {
  StreamableHTTPServerTransport,
} = require("@modelcontextprotocol/sdk/server/streamableHttp.js");
const { z } = require("zod");

/**
 * An MCP adapter over the stage command layer (Refs #6, #61).
 *
 * A peer of `/v1/command` and `/v1/socket`, not a wrapper around either: the
 * tools below call the same `dispatch` those routes do, so one set of stage
 * names and one set of error codes serve every caller. Nothing here talks HTTP
 * to the bus it is part of.
 *
 * The surface is deliberately *not* a mirror of the HTTP API. It is read by a
 * model, so it is smaller, it is named for what the model is trying to do, and
 * its defaults are the ones an agent almost always wants — see `persist` below.
 *
 * Every dependency is injected, as in agent-bus.cjs, so `node --test` can run
 * this with no Electron and no window.
 */

const MCP_PATH = "/mcp";

/**
 * MCP frames carry a `_meta` block with client info and capabilities, so the
 * bus's stage-command ceiling is too tight here. Still bounded: this buffers in
 * the main process.
 */
const MAX_MCP_BODY_BYTES = 256 * 1024;

const SERVER_INSTRUCTIONS = [
  "AVATAR shows a VRM character on the user's desktop.",
  "Use play_animation when the user asks for a visible reaction, or when a gesture clearly fits what they asked for.",
  "Call list_stage before naming an animation, avatar, or environment you have not seen in this session: a custom library derives its ids from file paths and cannot be guessed.",
  "list_stage and get_status are read-only. Everything else changes what is on the user's screen, so do not call them speculatively.",
  "A successful call means the request was accepted, not that the model has finished loading.",
].join(" ");

/** Stage failures a model can act on, plus the two this layer adds. */
const RECOVERY_HINT = Object.freeze({
  "unknown-animation": "Call list_stage for the animations this library actually has.",
  "unknown-avatar": "Call list_stage for the avatar ids this library actually has.",
  "unknown-environment": "Call list_stage for the environment ids this library actually has.",
  "not-playable-once": "Play it with persist: true, or pick a single clip instead.",
  "not-ready": "AVATAR is still starting up. Try again shortly.",
});

/**
 * @param {unknown} value
 * @returns {{ content: { type: 'text', text: string }[], structuredContent?: Record<string, unknown>, isError?: boolean }}
 */
function ok(value) {
  return {
    content: [{ type: "text", text: JSON.stringify(value, null, 2) }],
    structuredContent: value && typeof value === "object" ? value : { value },
  };
}

/**
 * A refused command is a tool error, not a protocol error: the model asked for
 * something reasonable and needs to be told what to do instead.
 * @param {{ code?: string, error?: string }} result
 */
function refused(result) {
  const hint = RECOVERY_HINT[result?.code ?? ""];
  const text = [result?.error ?? "The command was refused.", hint].filter(Boolean).join(" ");
  return {
    content: [{ type: "text", text }],
    structuredContent: { ok: false, code: result?.code ?? "bad-payload", error: text },
    isError: true,
  };
}

/**
 * @param {(command: string, payload: unknown) => { ok: boolean, action?: unknown, code?: string, error?: string }} dispatch
 * @param {string} command
 * @param {unknown} payload
 */
function run(dispatch, command, payload) {
  let result;
  try {
    result = dispatch(command, payload);
  } catch {
    return refused({ code: "internal-error", error: "The avatar window could not be reached." });
  }
  if (!result?.ok) return refused(result ?? {});
  // The accepted action comes back so the model can see what its request became
  // — play_animation matches labels as well as ids, so the two can differ.
  return ok({ ok: true, action: result.action });
}

/**
 * @param {Object} options
 * @param {(command: string, payload: unknown) => any} options.dispatch The bus's
 *   own dispatch: resolves against the window's catalog and applies the action.
 * @param {() => unknown} options.getState Body of `GET /v1/state`, or null while
 *   the window has not reported one.
 * @param {string} options.version
 */
function createMcpServer({ dispatch, getState, version }) {
  const server = new McpServer(
    { name: "avatar", version },
    { capabilities: { tools: {} }, instructions: SERVER_INSTRUCTIONS },
  );

  server.registerTool(
    "list_stage",
    {
      title: "List what is on stage",
      description:
        "The animations, avatars, environments and audio sources this AVATAR install actually has, plus what is currently selected. Read-only. Ask for this before naming anything you have not seen: a custom library derives its ids from file paths, and `playableOnce` says which clips can be played without changing the selection.",
      inputSchema: {},
      annotations: { readOnlyHint: true },
    },
    async () => {
      const state = getState();
      if (!state) return refused({ code: "not-ready" });
      return ok(state);
    },
  );

  server.registerTool(
    "get_status",
    {
      title: "Get AVATAR status",
      description:
        "Whether AVATAR is ready to take commands, and what is on stage right now. Read-only, and answers even while the window is still starting up.",
      inputSchema: {},
      annotations: { readOnlyHint: true },
    },
    async () => {
      const state = getState();
      if (!state) {
        return ok({
          ready: false,
          detail: "AVATAR is running but its window has not reported a catalog yet.",
        });
      }
      return ok({ ready: true, runtime: state.runtime ?? null, current: state.current ?? null });
    },
  );

  server.registerTool(
    "play_animation",
    {
      title: "Play an animation",
      description:
        "Play one of the avatar's animations. `animation` takes an id or a label from list_stage. By default the clip plays once and the avatar returns to whatever was selected before, which is almost always what you want. Set persist to true only when the user asks to *change* the avatar's animation rather than react with one.",
      inputSchema: {
        // Deliberately an open string, not an enum: a custom animations folder
        // derives ids from file paths, so the set changes while the app runs
        // and a client holding a stale tool list still has to work. The live
        // catalog is what validates this, at call time.
        animation: z
          .string()
          .min(1)
          .describe("An animation id or label, as listed by list_stage."),
        persist: z
          .boolean()
          .optional()
          .describe(
            "Leave unset to play once and return. True makes it the avatar's selected animation and writes it to the user's config.",
          ),
      },
    },
    async ({ animation, persist }) =>
      run(dispatch, "animation.play", { id: animation, mode: persist ? "select" : "once" }),
  );

  server.registerTool(
    "stop_animation",
    {
      title: "Stop the current one-shot",
      description:
        "End a one-shot animation early and return to the selected one. Stopping when nothing is playing is not an error.",
      inputSchema: {},
    },
    async () => run(dispatch, "animation.stop", null),
  );

  server.registerTool(
    "set_avatar",
    {
      title: "Switch avatar",
      description:
        "Switch to a different avatar model. Takes an id from list_stage — ids only, labels are not accepted here.",
      inputSchema: {
        avatar: z.string().min(1).describe("An avatar id, as listed by list_stage."),
      },
    },
    async ({ avatar }) => run(dispatch, "avatar.set", { id: avatar }),
  );

  server.registerTool(
    "set_environment",
    {
      title: "Set the environment",
      description:
        "Change what is behind the avatar: a named environment, a flat colour, or nothing at all.",
      inputSchema: {
        type: z
          .enum(["env", "color", "none"])
          .describe("`env` for a listed environment, `color` for a flat colour, `none` to clear."),
        id: z
          .string()
          .min(1)
          .optional()
          .describe("Required for type `env`: an environment id from list_stage."),
        color: z
          .string()
          .regex(/^#[0-9a-f]{6}$/i)
          .optional()
          .describe("Required for type `color`: a hex colour such as #e9e1fa."),
      },
    },
    async ({ type, id, color }) => {
      if (type === "env") return run(dispatch, "environment.set", { type: "env", id });
      if (type === "color") return run(dispatch, "environment.set", { type: "color", value: color });
      return run(dispatch, "environment.set", { type: "none" });
    },
  );

  return server;
}

/**
 * A handler for `POST /mcp`, stateless: one server and one transport per
 * request, both closed when the response ends.
 *
 * Sessions are what the SDK offers instead, and they are what this does not
 * want. Every tool here is a single round trip and nothing is pushed, so a
 * session would only add state that a client which is killed — or that
 * reconnects without saying goodbye — leaves behind on an endpoint reachable by
 * anything on this machine. Protocol revision 2026-07-28 removes sessions for
 * much the same reason.
 *
 * @param {Object} options
 * @param {(command: string, payload: unknown) => any} options.dispatch
 * @param {() => unknown} options.getState
 * @param {string} [options.version]
 */
function createMcpHandler({ dispatch, getState, version = "0.0.0" }) {
  if (typeof dispatch !== "function") {
    throw new Error("createMcpHandler requires a dispatch function.");
  }

  /**
   * @param {import('node:http').IncomingMessage} request
   * @param {import('node:http').ServerResponse} response
   * @param {unknown} parsedBody Already read by the bus, which enforces the size cap.
   */
  return async function handleMcpRequest(request, response, parsedBody) {
    const server = createMcpServer({ dispatch, getState, version });
    const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });

    response.on("close", () => {
      void transport.close();
      void server.close();
    });

    await server.connect(transport);
    await transport.handleRequest(request, response, parsedBody);
  };
}

module.exports = {
  MAX_MCP_BODY_BYTES,
  MCP_PATH,
  SERVER_INSTRUCTIONS,
  createMcpHandler,
  createMcpServer,
};
