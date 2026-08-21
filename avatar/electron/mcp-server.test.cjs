"use strict";

const assert = require("node:assert/strict");
const http = require("node:http");
const test = require("node:test");
const { Client } = require("@modelcontextprotocol/sdk/client/index.js");
const {
  StreamableHTTPClientTransport,
} = require("@modelcontextprotocol/sdk/client/streamableHttp.js");
const { MCP_PATH, createAgentBusServer } = require("./agent-bus.cjs");

// Same resolver the bus itself uses, loaded the way main.cjs loads it.
const resolverReady = import("../src/lib/stageCommands.js");

const CONTEXT = {
  animationCatalog: [
    { id: "vrma-03", label: "Peace Sign", source: "vrma", vrmaUrl: "/peace.vrma" },
    { id: "default", label: "Default", source: "sequence", sequence: ["vrma-03"] },
  ],
  avatarIds: ["avatar1", "avatar2"],
  environmentIds: ["env-forest"],
  audioSourceIds: ["system"],
};

const STATE = {
  runtime: { version: "9.9.9", mode: "desktop" },
  animations: [{ id: "vrma-03", label: "Peace Sign", playableOnce: true }],
  avatars: [{ id: "avatar1" }, { id: "avatar2" }],
  environments: [{ id: "env-forest", label: "Forest" }],
  audioSources: [{ id: "system", label: "Device output" }],
  current: { animationId: "default", avatarId: "avatar1" },
};

/**
 * @param {import('node:test').TestContext} context
 * @param {{ state?: unknown, token?: string | null }} [options]
 */
async function startServer(context, { state = STATE, token = null } = {}) {
  const { resolveStageCommand } = await resolverReady;
  const applied = [];
  const server = createAgentBusServer({
    port: 0,
    version: "9.9.9",
    resolveCommand: resolveStageCommand,
    getContext: () => CONTEXT,
    getState: () => state,
    applyAction: (action) => applied.push(action),
    getToken: () => token,
  });
  const address = await server.listen();
  context.after(() => server.close());
  return { port: address.port, applied };
}

/**
 * @param {import('node:test').TestContext} context
 * @param {number} port
 * @param {string | null} [token]
 */
async function connect(context, port, token = null) {
  const client = new Client({ name: "test", version: "0.0.0" });
  const transport = new StreamableHTTPClientTransport(
    new URL(`http://127.0.0.1:${port}${MCP_PATH}`),
    token ? { requestInit: { headers: { authorization: `Bearer ${token}` } } } : undefined,
  );
  await client.connect(transport);
  context.after(() => client.close());
  return client;
}

/** The tool result's JSON payload, whichever half of the result carries it. */
function payload(result) {
  if (result.structuredContent) return result.structuredContent;
  return JSON.parse(result.content[0].text);
}

/**
 * @param {number} port
 * @param {{ method?: string, headers?: Record<string, string>, body?: string }} [options]
 */
function raw(port, { method = "POST", headers = {}, body } = {}) {
  return new Promise((resolve, reject) => {
    const outgoing = { "content-type": "application/json", accept: "application/json, text/event-stream", ...headers };
    if (body !== undefined) outgoing["content-length"] = String(Buffer.byteLength(body));
    const request = http.request(
      { host: "127.0.0.1", port, path: MCP_PATH, method, headers: outgoing },
      (response) => {
        const chunks = [];
        response.on("data", (chunk) => chunks.push(chunk));
        response.on("end", () =>
          resolve({ status: response.statusCode, body: Buffer.concat(chunks).toString("utf8") }),
        );
      },
    );
    request.on("error", reject);
    if (body !== undefined) request.write(body);
    request.end();
  });
}

test("advertises the agent-facing tool surface", async (t) => {
  const { port } = await startServer(t);
  const client = await connect(t, port);

  const names = (await client.listTools()).tools.map((tool) => tool.name).sort();
  assert.deepEqual(names, [
    "get_status",
    "list_stage",
    "play_animation",
    "set_avatar",
    "set_environment",
    "stop_animation",
  ]);
});

test("does not expose the audio source, which is the user's setting", async (t) => {
  const { port } = await startServer(t);
  const client = await connect(t, port);

  const names = (await client.listTools()).tools.map((tool) => tool.name);
  assert.equal(
    names.some((name) => name.includes("audio")),
    false,
  );
});

test("play_animation plays once by default rather than changing the selection", async (t) => {
  const { port, applied } = await startServer(t);
  const client = await connect(t, port);

  const result = await client.callTool({
    name: "play_animation",
    arguments: { animation: "vrma-03" },
  });

  assert.equal(result.isError ?? false, false);
  assert.deepEqual(applied, [{ kind: "animation.play", animationId: "vrma-03", mode: "once" }]);
});

test("play_animation persists the selection only when asked", async (t) => {
  const { port, applied } = await startServer(t);
  const client = await connect(t, port);

  await client.callTool({
    name: "play_animation",
    arguments: { animation: "vrma-03", persist: true },
  });

  assert.deepEqual(applied, [{ kind: "animation.play", animationId: "vrma-03", mode: "select" }]);
});

test("play_animation accepts a label and reports the id it became", async (t) => {
  const { port, applied } = await startServer(t);
  const client = await connect(t, port);

  const result = await client.callTool({
    name: "play_animation",
    arguments: { animation: "Peace Sign" },
  });

  assert.equal(applied[0].animationId, "vrma-03");
  assert.equal(payload(result).action.animationId, "vrma-03");
});

test("a refused command is a tool error carrying a way out", async (t) => {
  const { port, applied } = await startServer(t);
  const client = await connect(t, port);

  const result = await client.callTool({
    name: "play_animation",
    arguments: { animation: "Peace Sing" },
  });

  assert.equal(result.isError, true);
  assert.match(result.content[0].text, /No animation matches/);
  assert.match(result.content[0].text, /list_stage/);
  assert.deepEqual(applied, []);
});

test("a looping sequence cannot be played once, and says what to do instead", async (t) => {
  const { port } = await startServer(t);
  const client = await connect(t, port);

  const result = await client.callTool({
    name: "play_animation",
    arguments: { animation: "default" },
  });

  assert.equal(result.isError, true);
  assert.match(result.content[0].text, /persist: true/);
});

test("set_environment takes each of the three shapes", async (t) => {
  const { port, applied } = await startServer(t);
  const client = await connect(t, port);

  await client.callTool({ name: "set_environment", arguments: { type: "env", id: "env-forest" } });
  await client.callTool({ name: "set_environment", arguments: { type: "color", color: "#e9e1fa" } });
  await client.callTool({ name: "set_environment", arguments: { type: "none" } });

  assert.deepEqual(
    applied.map((action) => action.selection),
    [{ type: "env", id: "env-forest" }, { type: "color", value: "#e9e1fa" }, { type: "none" }],
  );
});

test("set_avatar refuses an id this install does not have", async (t) => {
  const { port, applied } = await startServer(t);
  const client = await connect(t, port);

  const result = await client.callTool({ name: "set_avatar", arguments: { avatar: "avatar9" } });

  assert.equal(result.isError, true);
  assert.deepEqual(applied, []);
});

test("list_stage hands over the same catalog /v1/state does", async (t) => {
  const { port } = await startServer(t);
  const client = await connect(t, port);

  const result = await client.callTool({ name: "list_stage", arguments: {} });

  assert.deepEqual(payload(result), STATE);
});

test("before the window reports, list_stage refuses and get_status still answers", async (t) => {
  const { port } = await startServer(t, { state: null });
  const client = await connect(t, port);

  const listed = await client.callTool({ name: "list_stage", arguments: {} });
  assert.equal(listed.isError, true);
  assert.match(listed.content[0].text, /still starting up/);

  const status = await client.callTool({ name: "get_status", arguments: {} });
  assert.equal(status.isError ?? false, false);
  assert.equal(payload(status).ready, false);
});

test("the token gate is the bus's, not a second one", async (t) => {
  const { port } = await startServer(t, { token: "secret-token" });

  await assert.rejects(() => connect(t, port));

  const client = await connect(t, port, "secret-token");
  assert.equal((await client.listTools()).tools.length, 6);
});

test("a stateless endpoint turns away the GET and DELETE of older revisions", async (t) => {
  const { port } = await startServer(t);

  for (const method of ["GET", "DELETE"]) {
    const response = await raw(port, { method });
    assert.equal(response.status, 405, method);
    assert.equal(JSON.parse(response.body).error.message, "This MCP endpoint is stateless: use POST.");
  }
});

test("a web page is refused here too, in the shape MCP speaks", async (t) => {
  const { port } = await startServer(t);

  const response = await raw(port, {
    headers: { origin: "http://localhost:5173" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/list" }),
  });

  assert.equal(response.status, 403);
  const body = JSON.parse(response.body);
  assert.equal(body.jsonrpc, "2.0");
  assert.match(body.error.message, /web page/);
});

test("malformed JSON is a parse error, not a stage error", async (t) => {
  const { port } = await startServer(t);

  const response = await raw(port, { body: "{ not json" });

  assert.equal(response.status, 400);
  assert.equal(JSON.parse(response.body).error.code, -32700);
});
