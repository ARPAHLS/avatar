"use strict";

const assert = require("node:assert/strict");
const http = require("node:http");
const test = require("node:test");
const { createVroidOauthServer, hostAllowed, OAUTH_CALLBACK_PATH } = require("./vroid-oauth-server.cjs");

function request(port, path, { host } = {}) {
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        host: "127.0.0.1",
        port,
        path,
        method: "GET",
        headers: host ? { host } : undefined,
      },
      (response) => {
        const chunks = [];
        response.on("data", (chunk) => chunks.push(chunk));
        response.on("end", () =>
          resolve({
            status: response.statusCode,
            body: Buffer.concat(chunks).toString("utf8"),
          }),
        );
      },
    );
    req.on("error", reject);
    req.end();
  });
}

async function startServer(context, onOauthCallback) {
  const server = createVroidOauthServer({ port: 0, onOauthCallback });
  const address = await server.listen();
  context.after(() => server.close());
  return address.port;
}

test("hostAllowed only accepts bare loopback hosts", () => {
  assert.equal(hostAllowed("127.0.0.1:47901"), true);
  assert.equal(hostAllowed("localhost:47901"), true);
  assert.equal(hostAllowed("evil.example:47901"), false);
  assert.equal(hostAllowed("127.0.0.1:47901@evil.example"), false);
  assert.equal(hostAllowed(""), false);
  assert.equal(hostAllowed(undefined), false);
});

test("parses code/state from the callback URL and returns a success page", async (context) => {
  let received = null;
  const port = await startServer(context, async (params) => {
    received = params;
  });

  const { status, body } = await request(
    port,
    `${OAUTH_CALLBACK_PATH}?code=auth-code&state=abc123`,
  );

  assert.equal(status, 200);
  assert.match(body, /connected/i);
  assert.deepEqual(received, { code: "auth-code", state: "abc123", error: null });
});

test("returns a failure page and does not throw when the callback handler rejects", async (context) => {
  const port = await startServer(context, async () => {
    throw new Error("state mismatch");
  });

  const { status, body } = await request(port, `${OAUTH_CALLBACK_PATH}?error=access_denied`);

  assert.equal(status, 200);
  assert.match(body, /sign-in failed/i);
});

test("404s on any path other than the callback route", async (context) => {
  const port = await startServer(context, async () => {});

  const { status } = await request(port, "/not-the-callback");
  assert.equal(status, 404);
});

test("rejects requests with a non-loopback Host header", async (context) => {
  const port = await startServer(context, async () => {});

  const { status } = await request(port, `${OAUTH_CALLBACK_PATH}?code=x&state=y`, {
    host: "evil.example",
  });
  assert.equal(status, 403);
});
