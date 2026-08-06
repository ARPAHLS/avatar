"use strict";

const http = require("node:http");

// Arbitrary, just needs to not collide with anything else this app (or a
// sibling Electron app also using a loopback port, e.g. Persona's 47831)
// might be running locally.
const DEFAULT_VROID_OAUTH_PORT = 47901;
const OAUTH_CALLBACK_PATH = "/vroid-oauth-callback";
const LOOPBACK_HOSTS = new Set(["127.0.0.1", "localhost", "[::1]"]);

function oauthCallbackPage(success) {
  const title = success ? "AVATAR is connected" : "Sign-in failed";
  const message = success
    ? "You can close this tab and return to AVATAR."
    : "Something went wrong connecting your VRoid Hub account. Close this tab and try again from AVATAR's Settings.";
  return (
    "<!doctype html><html><head><meta charset=\"utf-8\">" +
    `<title>${title}</title></head>` +
    '<body style="font-family: sans-serif; text-align: center; padding: 4rem 1rem;">' +
    `<h1>${title}</h1><p>${message}</p></body></html>`
  );
}

function hostAllowed(hostHeader) {
  if (typeof hostHeader !== "string" || hostHeader.length === 0) return false;
  try {
    const url = new URL(`http://${hostHeader}`);
    return (
      url.username === "" &&
      url.password === "" &&
      url.pathname === "/" &&
      LOOPBACK_HOSTS.has(url.hostname.toLowerCase())
    );
  } catch {
    return false;
  }
}

/**
 * Minimal loopback-only HTTP server whose sole purpose is to receive VRoid
 * Hub's OAuth redirect. Unlike Persona (which already runs a bridge server
 * for MCP/`/events` and adds this as one more route), this app has no other
 * HTTP surface, so this stays deliberately tiny: one route, no MCP, no event
 * ingestion.
 */
function createVroidOauthServer({
  host = "127.0.0.1",
  port = DEFAULT_VROID_OAUTH_PORT,
  onOauthCallback,
} = {}) {
  if (typeof onOauthCallback !== "function") {
    throw new Error("createVroidOauthServer requires an onOauthCallback function.");
  }

  const server = http.createServer((request, response) => {
    if (!hostAllowed(request.headers.host)) {
      response.writeHead(403);
      response.end();
      return;
    }

    const url = new URL(request.url, "http://localhost");
    if (request.method !== "GET" || url.pathname !== OAUTH_CALLBACK_PATH) {
      response.writeHead(404);
      response.end();
      return;
    }

    void Promise.resolve(
      onOauthCallback({
        code: url.searchParams.get("code"),
        state: url.searchParams.get("state"),
        error: url.searchParams.get("error"),
      }),
    )
      .then(() => {
        response.writeHead(200, { "content-type": "text/html; charset=utf-8" });
        response.end(oauthCallbackPage(true));
      })
      .catch(() => {
        response.writeHead(200, { "content-type": "text/html; charset=utf-8" });
        response.end(oauthCallbackPage(false));
      });
  });

  return {
    listen: () =>
      new Promise((resolve, reject) => {
        server.once("error", reject);
        server.listen(port, host, () => {
          server.off("error", reject);
          resolve(server.address());
        });
      }),
    close: () =>
      new Promise((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      }),
  };
}

module.exports = {
  DEFAULT_VROID_OAUTH_PORT,
  OAUTH_CALLBACK_PATH,
  createVroidOauthServer,
  hostAllowed,
};
