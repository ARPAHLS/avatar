"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");
const {
  ensureAgentBusToken,
  readAgentBusToken,
  rotateAgentBusToken,
} = require("./agent-bus-token.cjs");

// Stands in for safeStorage: reversible, and nothing here is asserting that
// the bytes on disk are unreadable — only that they round-trip.
const CIPHER = {
  encrypt: (buffer) => Buffer.from(buffer.toString("utf8").split("").reverse().join(""), "utf8"),
  decrypt: (buffer) => Buffer.from(buffer.toString("utf8").split("").reverse().join(""), "utf8"),
};

function store(t) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "avatar-bus-"));
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  return { tokenFilePath: path.join(directory, "agent-bus.json"), ...CIPHER };
}

test("mints on first use and reuses it thereafter", (t) => {
  const options = store(t);

  const first = ensureAgentBusToken(options);
  assert.match(first, /^[\w-]{20,}$/);
  // A token that changed on every launch would break every script that saved
  // one, which is the whole reason it is persisted.
  assert.equal(ensureAgentBusToken(options), first);
  assert.equal(readAgentBusToken(options), first);
});

test("regenerating replaces the stored token", (t) => {
  const options = store(t);
  const first = ensureAgentBusToken(options);

  const second = rotateAgentBusToken(options);

  assert.notEqual(second, first);
  assert.equal(readAgentBusToken(options), second);
});

test("a missing, empty or corrupt file reads as no token rather than throwing", (t) => {
  const options = store(t);

  assert.equal(readAgentBusToken(options), null);

  fs.writeFileSync(options.tokenFilePath, "");
  assert.equal(readAgentBusToken(options), null);

  fs.writeFileSync(options.tokenFilePath, JSON.stringify({ encrypted: "not-base64-of-anything" }));
  assert.equal(readAgentBusToken(options), null);

  // …and the next enable simply mints a fresh one over the top.
  assert.match(ensureAgentBusToken(options), /^[\w-]{20,}$/);
});
