"use strict";

const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");

/**
 * Encrypted-at-rest storage for the local agent bus token (Refs #6).
 *
 * Deliberately not in `config.yaml`: that file is a snapshot of live stage
 * state, owned and rewritten by the renderer on every change, while this
 * secret has to be readable by the main process before a window exists. Same
 * on-disk shape and injected encrypt/decrypt callbacks as
 * vroid-hub-credentials.cjs.
 */

/** 32 bytes, URL-safe so it survives a copy-paste into a shell one-liner. */
function generateAgentBusToken() {
  return crypto.randomBytes(32).toString("base64url");
}

function readAgentBusToken({ tokenFilePath, decrypt }) {
  try {
    const parsed = JSON.parse(fs.readFileSync(tokenFilePath, "utf8"));
    if (typeof parsed?.encrypted !== "string") return null;
    const record = JSON.parse(decrypt(Buffer.from(parsed.encrypted, "base64")).toString("utf8"));
    return typeof record?.token === "string" && record.token !== "" ? record.token : null;
  } catch {
    return null;
  }
}

function writeAgentBusToken({ tokenFilePath, encrypt }, token) {
  if (typeof token !== "string" || token === "") {
    throw new Error("A token is required.");
  }
  const encrypted = encrypt(Buffer.from(JSON.stringify({ token }), "utf8")).toString("base64");
  fs.mkdirSync(path.dirname(tokenFilePath), { recursive: true });
  const temporaryPath = `${tokenFilePath}.tmp`;
  fs.writeFileSync(temporaryPath, JSON.stringify({ encrypted }), { mode: 0o600 });
  fs.renameSync(temporaryPath, tokenFilePath);
}

/**
 * Mint on first use, reuse thereafter — nobody should have to invent a token
 * before they can curl the bus, and a token that changed on every launch would
 * break every script that stored one.
 *
 * @returns {string}
 */
function ensureAgentBusToken({ tokenFilePath, encrypt, decrypt }) {
  const existing = readAgentBusToken({ tokenFilePath, decrypt });
  if (existing) return existing;
  const token = generateAgentBusToken();
  writeAgentBusToken({ tokenFilePath, encrypt }, token);
  return token;
}

/** Regenerate deliberately: the old token stops working immediately. */
function rotateAgentBusToken({ tokenFilePath, encrypt }) {
  const token = generateAgentBusToken();
  writeAgentBusToken({ tokenFilePath, encrypt }, token);
  return token;
}

function clearAgentBusToken({ tokenFilePath }) {
  try {
    fs.unlinkSync(tokenFilePath);
  } catch {
    // Already gone is the state we wanted.
  }
}

module.exports = {
  clearAgentBusToken,
  ensureAgentBusToken,
  generateAgentBusToken,
  readAgentBusToken,
  rotateAgentBusToken,
  writeAgentBusToken,
};
