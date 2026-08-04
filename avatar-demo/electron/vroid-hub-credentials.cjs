"use strict";

const fs = require("node:fs");
const path = require("node:path");

/**
 * Encrypted-at-rest storage for a user-supplied VRoid Hub OAuth app's
 * client ID/secret (registered at hub.vroid.com/oauth/applications),
 * separate from the OAuth session tokens stored by vroid-hub-auth.cjs.
 * Same on-disk shape and injected encrypt/decrypt callbacks as that module.
 */

function requiredField(value, field) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`${field} is required.`);
  }
  return value.trim();
}

function readVroidHubCredentials({ credentialsFilePath, decrypt }) {
  try {
    const parsed = JSON.parse(fs.readFileSync(credentialsFilePath, "utf8"));
    if (typeof parsed?.encrypted !== "string") return null;
    const decrypted = decrypt(Buffer.from(parsed.encrypted, "base64"));
    const record = JSON.parse(decrypted.toString("utf8"));
    if (
      typeof record?.client_id !== "string" ||
      typeof record?.client_secret !== "string"
    ) {
      return null;
    }
    return { clientId: record.client_id, clientSecret: record.client_secret };
  } catch {
    return null;
  }
}

function writeVroidHubCredentials(
  { credentialsFilePath, encrypt },
  { clientId, clientSecret },
) {
  const record = {
    client_id: requiredField(clientId, "Client ID"),
    client_secret: requiredField(clientSecret, "Client secret"),
  };
  fs.mkdirSync(path.dirname(credentialsFilePath), { recursive: true });
  const encrypted = encrypt(Buffer.from(JSON.stringify(record), "utf8")).toString(
    "base64",
  );
  const temporaryPath = `${credentialsFilePath}.tmp`;
  fs.writeFileSync(temporaryPath, JSON.stringify({ encrypted }), {
    mode: 0o600,
  });
  fs.renameSync(temporaryPath, credentialsFilePath);
}

function clearVroidHubCredentials({ credentialsFilePath }) {
  try {
    fs.unlinkSync(credentialsFilePath);
  } catch {
    // Already absent.
  }
}

module.exports = {
  readVroidHubCredentials,
  writeVroidHubCredentials,
  clearVroidHubCredentials,
};
