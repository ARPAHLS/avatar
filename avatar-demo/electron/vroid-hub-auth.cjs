"use strict";

const nodeCrypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");

const AUTHORIZE_URL = "https://hub.vroid.com/oauth/authorize";
const TOKEN_URL = "https://hub.vroid.com/oauth/token";
// VRoid Hub's own API version header, unrelated to this app's version.
const API_VERSION = "11";
const PENDING_FLOW_TIMEOUT_MS = 10 * 60 * 1000;
const TOKEN_REFRESH_SKEW_MS = 60 * 1000;
const DEFAULT_EXPIRES_IN_SECONDS = 60 * 60;
const TOKEN_REQUEST_TIMEOUT_MS = 15 * 1000;

function base64UrlEncode(buffer) {
  return buffer
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function tokenRequestHeaders() {
  return {
    "content-type": "application/x-www-form-urlencoded",
    "X-Api-Version": API_VERSION,
  };
}

/**
 * OAuth2 Authorization Code + PKCE client for VRoid Hub
 * (https://hub.vroid.com), plus encrypted-at-rest token persistence.
 * Deliberately has no `require("electron")` so it can be unit tested with
 * plain fakes, matching the rest of this codebase's Electron-glue-in-main.cjs
 * convention.
 */
function createVroidHubAuth({
  clientId,
  clientSecret,
  redirectUri,
  fetchImpl = fetch,
  encrypt,
  decrypt,
  authFilePath,
}) {
  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error(
      "VRoid Hub auth requires clientId, clientSecret, and redirectUri.",
    );
  }
  if (typeof encrypt !== "function" || typeof decrypt !== "function") {
    throw new Error("VRoid Hub auth requires encrypt/decrypt callbacks.");
  }

  let pendingFlow = null; // { state, codeVerifier, expiresAt }
  let tokens = readTokens();

  function readTokens() {
    try {
      const parsed = JSON.parse(fs.readFileSync(authFilePath, "utf8"));
      if (typeof parsed?.encrypted !== "string") return null;
      const decrypted = decrypt(Buffer.from(parsed.encrypted, "base64"));
      const record = JSON.parse(decrypted.toString("utf8"));
      if (
        typeof record?.access_token !== "string" ||
        typeof record?.refresh_token !== "string" ||
        typeof record?.token_type !== "string" ||
        typeof record?.expires_at !== "number"
      ) {
        return null;
      }
      return record;
    } catch {
      return null;
    }
  }

  function writeTokens() {
    if (tokens == null) {
      try {
        fs.unlinkSync(authFilePath);
      } catch {
        // Already absent.
      }
      return;
    }
    fs.mkdirSync(path.dirname(authFilePath), { recursive: true });
    const encrypted = encrypt(
      Buffer.from(JSON.stringify(tokens), "utf8"),
    ).toString("base64");
    const temporaryPath = `${authFilePath}.tmp`;
    fs.writeFileSync(temporaryPath, JSON.stringify({ encrypted }), {
      mode: 0o600,
    });
    fs.renameSync(temporaryPath, authFilePath);
  }

  function storeTokenResponse(payload) {
    if (
      typeof payload?.access_token !== "string" ||
      typeof payload?.refresh_token !== "string"
    ) {
      throw new Error("VRoid Hub returned an unexpected token response.");
    }
    const expiresInSeconds = Number(payload.expires_in);
    tokens = {
      access_token: payload.access_token,
      refresh_token: payload.refresh_token,
      token_type: payload.token_type ?? "Bearer",
      expires_at:
        Date.now() +
        (Number.isFinite(expiresInSeconds)
          ? expiresInSeconds
          : DEFAULT_EXPIRES_IN_SECONDS) *
          1000,
    };
    writeTokens();
  }

  function buildAuthorizeUrl() {
    const codeVerifier = base64UrlEncode(nodeCrypto.randomBytes(32));
    const codeChallenge = base64UrlEncode(
      nodeCrypto.createHash("sha256").update(codeVerifier).digest(),
    );
    const state = base64UrlEncode(nodeCrypto.randomBytes(16));
    pendingFlow = {
      state,
      codeVerifier,
      expiresAt: Date.now() + PENDING_FLOW_TIMEOUT_MS,
    };

    const url = new URL(AUTHORIZE_URL);
    url.searchParams.set("response_type", "code");
    url.searchParams.set("client_id", clientId);
    url.searchParams.set("redirect_uri", redirectUri);
    // "default" alone grants read access to the account's own models; the
    // Hearts listing (getValidAccessToken via listCharacters) needs the
    // separate "heart" scope, or /api/hearts silently returns an empty list
    // instead of an error.
    url.searchParams.set("scope", "default heart");
    url.searchParams.set("state", state);
    url.searchParams.set("code_challenge", codeChallenge);
    url.searchParams.set("code_challenge_method", "S256");
    return url.toString();
  }

  async function exchangeCode(code, state) {
    const flow = pendingFlow;
    pendingFlow = null;
    if (!flow || flow.expiresAt < Date.now()) {
      throw new Error("No pending VRoid Hub sign-in, or it expired. Start again.");
    }
    if (typeof code !== "string" || code === "") {
      throw new Error("VRoid Hub did not return an authorization code.");
    }
    if (typeof state !== "string" || state !== flow.state) {
      throw new Error("VRoid Hub sign-in state did not match. Start again.");
    }

    const response = await fetchImpl(TOKEN_URL, {
      method: "POST",
      headers: tokenRequestHeaders(),
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        client_id: clientId,
        client_secret: clientSecret,
        code_verifier: flow.codeVerifier,
        redirect_uri: redirectUri,
      }),
      signal: AbortSignal.timeout(TOKEN_REQUEST_TIMEOUT_MS),
    });
    if (!response.ok) {
      throw new Error(`VRoid Hub sign-in failed (${response.status}).`);
    }
    storeTokenResponse(await response.json());
  }

  async function refreshTokens() {
    if (!tokens) throw new Error("VRoid Hub is not connected.");
    const response = await fetchImpl(TOKEN_URL, {
      method: "POST",
      headers: tokenRequestHeaders(),
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: tokens.refresh_token,
        client_id: clientId,
        client_secret: clientSecret,
      }),
      signal: AbortSignal.timeout(TOKEN_REQUEST_TIMEOUT_MS),
    });
    if (!response.ok) {
      tokens = null;
      writeTokens();
      throw new Error(
        `VRoid Hub session expired (${response.status}). Reconnect your account.`,
      );
    }
    storeTokenResponse(await response.json());
  }

  async function getValidAccessToken() {
    if (!tokens) throw new Error("VRoid Hub is not connected.");
    if (tokens.expires_at - TOKEN_REFRESH_SKEW_MS <= Date.now()) {
      await refreshTokens();
    }
    return { accessToken: tokens.access_token, tokenType: tokens.token_type };
  }

  function isConnected() {
    return tokens != null;
  }

  function disconnect() {
    pendingFlow = null;
    tokens = null;
    writeTokens();
  }

  return {
    buildAuthorizeUrl,
    disconnect,
    exchangeCode,
    getValidAccessToken,
    isConnected,
  };
}

module.exports = {
  AUTHORIZE_URL,
  TOKEN_URL,
  createVroidHubAuth,
};
