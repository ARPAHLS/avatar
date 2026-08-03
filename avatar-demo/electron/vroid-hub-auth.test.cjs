"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");
const { createVroidHubAuth } = require("./vroid-hub-auth.cjs");

function fixture(context) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "avatar-vroid-auth-"));
  context.after(() => fs.rmSync(root, { force: true, recursive: true }));
  return { authFilePath: path.join(root, "vroid-hub-auth.json") };
}

// Not real encryption, just proves the store actually transforms bytes and
// round-trips through the injected callbacks rather than assuming identity.
function hexCodec() {
  return {
    encrypt: (buffer) => Buffer.from(buffer.toString("hex")),
    decrypt: (buffer) => Buffer.from(buffer.toString(), "hex"),
  };
}

function fakeFetch(handler) {
  const calls = [];
  const fetchImpl = async (url, init) => {
    const params = new URLSearchParams(init.body);
    calls.push({ url, headers: init.headers, params });
    return handler(params, url);
  };
  fetchImpl.calls = calls;
  return fetchImpl;
}

function jsonResponse(status, body) {
  return { ok: status >= 200 && status < 300, status, json: async () => body };
}

function createAuth(context, overrides = {}) {
  const { authFilePath } = fixture(context);
  const { encrypt, decrypt } = hexCodec();
  return createVroidHubAuth({
    clientId: "client-123",
    clientSecret: "secret-456",
    redirectUri: "http://127.0.0.1:47901/vroid-oauth-callback",
    authFilePath,
    encrypt,
    decrypt,
    ...overrides,
  });
}

test("builds an authorize URL with PKCE and state", (context) => {
  const auth = createAuth(context, { fetchImpl: async () => jsonResponse(200, {}) });
  const url = new URL(auth.buildAuthorizeUrl());

  assert.equal(url.origin + url.pathname, "https://hub.vroid.com/oauth/authorize");
  assert.equal(url.searchParams.get("response_type"), "code");
  assert.equal(url.searchParams.get("client_id"), "client-123");
  assert.equal(
    url.searchParams.get("redirect_uri"),
    "http://127.0.0.1:47901/vroid-oauth-callback",
  );
  assert.equal(url.searchParams.get("scope"), "default heart");
  assert.equal(url.searchParams.get("code_challenge_method"), "S256");
  assert.ok(url.searchParams.get("state"));
  assert.ok(url.searchParams.get("code_challenge"));
  assert.equal(auth.isConnected(), false);
});

test("completes sign-in and persists encrypted tokens that survive a reload", async (context) => {
  const { authFilePath } = fixture(context);
  const { encrypt, decrypt } = hexCodec();
  const fetchImpl = fakeFetch((params) => {
    assert.equal(params.get("grant_type"), "authorization_code");
    assert.equal(params.get("client_secret"), "secret-456");
    assert.equal(params.get("code"), "auth-code");
    return jsonResponse(200, {
      access_token: "access-1",
      refresh_token: "refresh-1",
      token_type: "Bearer",
      expires_in: 3600,
    });
  });
  const auth = createVroidHubAuth({
    clientId: "client-123",
    clientSecret: "secret-456",
    redirectUri: "http://127.0.0.1:47901/vroid-oauth-callback",
    authFilePath,
    encrypt,
    decrypt,
    fetchImpl,
  });
  const url = new URL(auth.buildAuthorizeUrl());
  const state = url.searchParams.get("state");

  await auth.exchangeCode("auth-code", state);

  assert.equal(auth.isConnected(), true);
  const token = await auth.getValidAccessToken();
  assert.deepEqual(token, { accessToken: "access-1", tokenType: "Bearer" });

  const onDisk = fs.readFileSync(authFilePath, "utf8");
  assert.equal(onDisk.includes("access-1"), false, "token must not be stored in plaintext");

  const reloaded = createVroidHubAuth({
    clientId: "client-123",
    clientSecret: "secret-456",
    redirectUri: "http://127.0.0.1:47901/vroid-oauth-callback",
    authFilePath,
    encrypt,
    decrypt,
    fetchImpl: async () => jsonResponse(500, {}),
  });
  assert.equal(reloaded.isConnected(), true);
  assert.deepEqual(await reloaded.getValidAccessToken(), {
    accessToken: "access-1",
    tokenType: "Bearer",
  });
});

test("rejects exchanging a code with no pending flow or a mismatched state", async (context) => {
  const auth = createAuth(context, { fetchImpl: async () => jsonResponse(200, {}) });

  await assert.rejects(() => auth.exchangeCode("code", "some-state"), /no pending/i);

  const url = new URL(auth.buildAuthorizeUrl());
  const state = url.searchParams.get("state");
  await assert.rejects(() => auth.exchangeCode("code", `not-${state}`), /state/i);
  assert.equal(auth.isConnected(), false);
});

test("surfaces a failed token exchange without persisting anything", async (context) => {
  const { authFilePath } = fixture(context);
  const auth = createAuth(context, {
    fetchImpl: async () => jsonResponse(400, { error: "invalid_grant" }),
  });
  const url = new URL(auth.buildAuthorizeUrl());
  const state = url.searchParams.get("state");

  await assert.rejects(() => auth.exchangeCode("bad-code", state), /sign-in failed/i);
  assert.equal(auth.isConnected(), false);
  assert.equal(fs.existsSync(authFilePath), false);
});

test("refreshes an access token automatically once it is close to expiring", async (context) => {
  let call = 0;
  const fetchImpl = fakeFetch((params) => {
    call += 1;
    if (call === 1) {
      assert.equal(params.get("grant_type"), "authorization_code");
      return jsonResponse(200, {
        access_token: "access-1",
        refresh_token: "refresh-1",
        token_type: "Bearer",
        expires_in: 0,
      });
    }
    assert.equal(params.get("grant_type"), "refresh_token");
    assert.equal(params.get("refresh_token"), "refresh-1");
    return jsonResponse(200, {
      access_token: "access-2",
      refresh_token: "refresh-2",
      token_type: "Bearer",
      expires_in: 3600,
    });
  });
  const auth = createAuth(context, { fetchImpl });
  const url = new URL(auth.buildAuthorizeUrl());
  await auth.exchangeCode("auth-code", url.searchParams.get("state"));

  const token = await auth.getValidAccessToken();
  assert.equal(token.accessToken, "access-2");
  assert.equal(call, 2);
});

test("clears the persisted session on disconnect", async (context) => {
  const { authFilePath } = fixture(context);
  const { encrypt, decrypt } = hexCodec();
  const fetchImpl = async () =>
    jsonResponse(200, {
      access_token: "access-1",
      refresh_token: "refresh-1",
      token_type: "Bearer",
      expires_in: 3600,
    });
  const auth = createVroidHubAuth({
    clientId: "client-123",
    clientSecret: "secret-456",
    redirectUri: "http://127.0.0.1:47901/vroid-oauth-callback",
    authFilePath,
    encrypt,
    decrypt,
    fetchImpl,
  });
  const url = new URL(auth.buildAuthorizeUrl());
  await auth.exchangeCode("auth-code", url.searchParams.get("state"));
  assert.equal(auth.isConnected(), true);

  auth.disconnect();

  assert.equal(auth.isConnected(), false);
  assert.equal(fs.existsSync(authFilePath), false);
  await assert.rejects(() => auth.getValidAccessToken(), /not connected/i);

  const reloaded = createVroidHubAuth({
    clientId: "client-123",
    clientSecret: "secret-456",
    redirectUri: "http://127.0.0.1:47901/vroid-oauth-callback",
    authFilePath,
    encrypt,
    decrypt,
    fetchImpl,
  });
  assert.equal(reloaded.isConnected(), false);
});
