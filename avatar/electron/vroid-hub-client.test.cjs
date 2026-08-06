"use strict";

const assert = require("node:assert/strict");
const http = require("node:http");
const test = require("node:test");
const { createVroidHubClient } = require("./vroid-hub-client.cjs");

const TOKEN = { accessToken: "access-1", tokenType: "Bearer" };

function startFakeHub(context, { onRequest }) {
  const server = http.createServer((request, response) => {
    // IncomingMessage's fields (headers included) aren't own-enumerable, so
    // build an explicit plain object rather than `{ ...request }`, which
    // would silently drop `headers`.
    const chunks = [];
    request.on("data", (chunk) => chunks.push(chunk));
    request.on("end", () => {
      onRequest(
        {
          url: request.url,
          method: request.method,
          headers: request.headers,
          body: Buffer.concat(chunks).toString("utf8"),
        },
        response,
      );
    });
  });
  context.after(() => new Promise((resolve) => server.close(resolve)));
  return new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => resolve(server));
  });
}

function json(response, status, body) {
  response.writeHead(status, { "content-type": "application/json" });
  response.end(JSON.stringify(body));
}

function characterModel(overrides = {}) {
  return {
    id: "model-1",
    name: "My Character",
    is_downloadable: false,
    is_other_users_available: true,
    portrait_image: { q75: { url: "https://hub.vroid.com/portrait.png" } },
    ...overrides,
  };
}

test("lists the account's own models and eligible hearted models, filtering ineligible hearts", async (context) => {
  let heartsUrl = null;
  const server = await startFakeHub(context, {
    onRequest(request, response) {
      if (request.url.startsWith("/api/account/character_models")) {
        assert.equal(request.headers.authorization, "Bearer access-1");
        assert.equal(request.headers["x-api-version"], "11");
        return json(response, 200, {
          data: [characterModel({ id: "own-1", name: "Owned" })],
        });
      }
      if (request.url.startsWith("/api/hearts")) {
        heartsUrl = request.url;
        // /api/hearts' data entries are the character models themselves,
        // not a heart record wrapping one under a character_model key.
        return json(response, 200, {
          data: [
            characterModel({
              id: "hearted-allowed",
              name: "Hearted, allowed",
              is_other_users_available: true,
              character: { id: "char-9", user: { name: "Some Author" } },
              license: { credit: "necessary" },
            }),
            characterModel({
              id: "hearted-blocked",
              name: "Hearted, blocked",
              is_other_users_available: false,
            }),
          ],
        });
      }
      response.writeHead(404);
      response.end();
    },
  });
  const client = createVroidHubClient({
    baseUrl: `http://127.0.0.1:${server.address().port}`,
    clientId: "app-client-id",
  });

  const characters = await client.listCharacters(TOKEN);

  assert.deepEqual(
    characters.map((character) => character.id).sort(),
    ["hearted-allowed", "own-1"],
  );
  assert.ok(
    new URL(heartsUrl, "http://localhost").searchParams.get("application_id") === "app-client-id",
    "/api/hearts must be called with the app's application_id",
  );

  const own = characters.find((character) => character.id === "own-1");
  const hearted = characters.find((character) => character.id === "hearted-allowed");
  assert.equal(own.source, "own");
  assert.equal(hearted.source, "hearted");
  assert.equal(hearted.author_name, "Some Author");
  assert.deepEqual(hearted.license, { spec_version: "0.0", credit: "necessary" });
  assert.equal(hearted.hub_url, "https://hub.vroid.com/characters/char-9/models/hearted-allowed");
  // No character.id in this fixture, so there's no page to link to.
  assert.equal(own.hub_url, null);
});

test("extracts VRM 0.0 and VRM 1.0 conditions of use in their own native shapes", async (context) => {
  const server = await startFakeHub(context, {
    onRequest(request, response) {
      if (request.url.startsWith("/api/account/character_models")) {
        return json(response, 200, {
          data: [
            characterModel({
              id: "vrm0-model",
              license: { credit: "necessary", personal_commercial_use: "profit" },
            }),
            characterModel({
              id: "vrm1-model",
              latest_character_model_version: {
                spec_version: "1.0",
                vrm_meta: {
                  commercialUsage: "personalProfit",
                  creditNotation: "required",
                  allowRedistribution: false,
                },
              },
            }),
            characterModel({ id: "no-license-model" }),
          ],
        });
      }
      if (request.url.startsWith("/api/hearts")) {
        return json(response, 200, { data: [] });
      }
      response.writeHead(404);
      response.end();
    },
  });
  const client = createVroidHubClient({
    baseUrl: `http://127.0.0.1:${server.address().port}`,
    clientId: "app-client-id",
  });

  const characters = await client.listCharacters(TOKEN);
  const byId = Object.fromEntries(characters.map((c) => [c.id, c.license]));

  assert.deepEqual(byId["vrm0-model"], {
    spec_version: "0.0",
    credit: "necessary",
    personal_commercial_use: "profit",
  });
  assert.deepEqual(byId["vrm1-model"], {
    spec_version: "1.0",
    avatarPermission: undefined,
    allowExcessivelyViolentUsage: undefined,
    allowExcessivelySexualUsage: undefined,
    commercialUsage: "personalProfit",
    allowPoliticalOrReligiousUsage: undefined,
    allowAntisocialOrHateUsage: undefined,
    creditNotation: "required",
    allowRedistribution: false,
    modification: undefined,
  });
  assert.equal(byId["no-license-model"], null);
});

test("follows _links.next.href to collect every page instead of stopping at the first", async (context) => {
  const server = await startFakeHub(context, {
    onRequest(request, response) {
      if (request.url === `/api/account/character_models?count=${100}`) {
        return json(response, 200, {
          data: [characterModel({ id: "own-1" }), characterModel({ id: "own-2" })],
          _links: { next: { href: "/api/account/character_models?count=100&max_id=own-2" } },
        });
      }
      if (request.url === "/api/account/character_models?count=100&max_id=own-2") {
        return json(response, 200, {
          data: [characterModel({ id: "own-3" })],
        });
      }
      if (request.url.startsWith("/api/hearts")) {
        return json(response, 200, { data: [] });
      }
      response.writeHead(404);
      response.end();
    },
  });
  const client = createVroidHubClient({
    baseUrl: `http://127.0.0.1:${server.address().port}`,
    clientId: "app-client-id",
  });

  const characters = await client.listCharacters(TOKEN);

  assert.deepEqual(
    characters.map((character) => character.id).sort(),
    ["own-1", "own-2", "own-3"],
  );
});

test("stops paginating at a safety cap even if _links.next never runs out", async (context) => {
  const server = await startFakeHub(context, {
    onRequest(request, response) {
      if (request.url.startsWith("/api/account/character_models")) {
        const url = new URL(request.url, "http://localhost");
        const page = Number(url.searchParams.get("page") ?? "0");
        return json(response, 200, {
          data: [characterModel({ id: `own-${page}` })],
          _links: { next: { href: `/api/account/character_models?count=100&page=${page + 1}` } },
        });
      }
      if (request.url.startsWith("/api/hearts")) {
        return json(response, 200, { data: [] });
      }
      response.writeHead(404);
      response.end();
    },
  });
  const client = createVroidHubClient({
    baseUrl: `http://127.0.0.1:${server.address().port}`,
    clientId: "app-client-id",
  });

  const characters = await client.listCharacters(TOKEN);

  assert.equal(characters.length, 20);
});

test("requires a client id to list hearted models", async () => {
  const client = createVroidHubClient({ baseUrl: "http://127.0.0.1:1" });
  await assert.rejects(() => client.listCharacters(TOKEN), /application_id/i);
});

test("downloads a licensed character model through the redirect flow", async (context) => {
  const fileBytes = Buffer.from("glTFmodelbytes");
  const server = await startFakeHub(context, {
    onRequest(request, response) {
      if (request.method === "POST" && request.url === "/api/download_licenses") {
        assert.equal(request.headers.authorization, "Bearer access-1");
        assert.deepEqual(JSON.parse(request.body), { character_model_id: "model-1" });
        return json(response, 200, { data: { id: "license-1" } });
      }
      if (request.url === "/api/download_licenses/license-1/download") {
        response.writeHead(302, {
          location: `http://127.0.0.1:${server.address().port}/files/model.vrm`,
        });
        return response.end();
      }
      if (request.url === "/files/model.vrm") {
        response.writeHead(200, { "content-type": "model/gltf-binary" });
        return response.end(fileBytes);
      }
      response.writeHead(404);
      response.end();
    },
  });
  const client = createVroidHubClient({
    baseUrl: `http://127.0.0.1:${server.address().port}`,
  });

  const buffer = await client.loadCharacterModel(TOKEN, "model-1");

  assert.equal(Buffer.isBuffer(buffer), true);
  assert.equal(buffer.equals(fileBytes), true);
});

test("surfaces a denied download license instead of guessing a URL", async (context) => {
  const server = await startFakeHub(context, {
    onRequest(_request, response) {
      json(response, 403, { error: "forbidden" });
    },
  });
  const client = createVroidHubClient({
    baseUrl: `http://127.0.0.1:${server.address().port}`,
  });

  await assert.rejects(
    () => client.loadCharacterModel(TOKEN, "model-1"),
    /declined to license/i,
  );
});

test("rejects a redirect response with no Location header", async (context) => {
  const server = await startFakeHub(context, {
    onRequest(request, response) {
      if (request.url === "/api/download_licenses") {
        return json(response, 200, { data: { id: "license-1" } });
      }
      response.writeHead(302);
      response.end();
    },
  });
  const client = createVroidHubClient({
    baseUrl: `http://127.0.0.1:${server.address().port}`,
  });

  await assert.rejects(
    () => client.loadCharacterModel(TOKEN, "model-1"),
    /download URL/i,
  );
});

test("requires a character id", async () => {
  const client = createVroidHubClient({ baseUrl: "http://127.0.0.1:1" });
  await assert.rejects(
    () => client.loadCharacterModel(TOKEN, ""),
    /character id is required/i,
  );
});
