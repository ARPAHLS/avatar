"use strict";

const DEFAULT_BASE_URL = "https://hub.vroid.com";
// VRoid Hub's own API version header, unrelated to this app's version.
const API_VERSION = "11";
const PAGE_SIZE = 100; // VRoid Hub's documented max per page
// Safety cap against an unbounded loop if VRoid Hub's `_links.next` ever
// pointed back at an earlier page; 20 pages * 100 = 2000 models is already
// far beyond what any account plausibly owns/hearts.
const MAX_PAGES = 20;
const API_REQUEST_TIMEOUT_MS = 15 * 1000;
// The actual VRM binary can be up to MAX_ASSET_BYTES (200 MB, enforced by the
// caller before it's held in memory) and is fetched from a presigned storage
// URL, not hub.vroid.com's own API, so it gets a longer allowance than the
// JSON calls.
const DOWNLOAD_TIMEOUT_MS = 120 * 1000;

function authorizedHeaders({ accessToken, tokenType = "Bearer" } = {}, extra = {}) {
  if (typeof accessToken !== "string" || accessToken === "") {
    throw new Error("A VRoid Hub access token is required.");
  }
  return {
    Authorization: `${tokenType} ${accessToken}`,
    "X-Api-Version": API_VERSION,
    ...extra,
  };
}

// VRoid Hub's conditions-of-use fields live at different paths *and use
// different vocabularies* depending on which VRM spec version the model was
// exported with:
//   - VRM 1.0: flat fields directly on the latest version's vrm_meta
//     (VRM1Meta — camelCase, e.g. commercialUsage/modification/
//     creditNotation), not nested under any `.license` key. See
//     node_modules/@pixiv/three-vrm-core/types/meta/VRM1Meta.d.ts.
//   - VRM 0.0: a separate top-level `license` object (snake_case, VRoid
//     Hub's own vocabulary), per developer.vroid.com's
//     CharacterModelSerializer reference.
// The two share no field names or value vocabularies, so this returns each
// version's native shape tagged with spec_version rather than merging them.
function characterLicense(model) {
  const specVersion = model.latest_character_model_version?.spec_version;
  if (specVersion === "1.0") {
    const vrmMeta = model.latest_character_model_version?.vrm_meta;
    if (vrmMeta == null || typeof vrmMeta !== "object") return null;
    return {
      spec_version: "1.0",
      avatarPermission: vrmMeta.avatarPermission,
      allowExcessivelyViolentUsage: vrmMeta.allowExcessivelyViolentUsage,
      allowExcessivelySexualUsage: vrmMeta.allowExcessivelySexualUsage,
      commercialUsage: vrmMeta.commercialUsage,
      allowPoliticalOrReligiousUsage: vrmMeta.allowPoliticalOrReligiousUsage,
      allowAntisocialOrHateUsage: vrmMeta.allowAntisocialOrHateUsage,
      creditNotation: vrmMeta.creditNotation,
      allowRedistribution: vrmMeta.allowRedistribution,
      modification: vrmMeta.modification,
    };
  }
  if (model.license == null || typeof model.license !== "object") return null;
  return { spec_version: "0.0", ...model.license };
}

function toCharacterSummary(model, source) {
  return {
    id: model.id,
    name:
      typeof model.name === "string" && model.name.trim() !== ""
        ? model.name
        : "Untitled character",
    is_downloadable: Boolean(model.is_downloadable),
    portrait_url:
      model.portrait_image?.q75?.url ?? model.portrait_image?.original?.url ?? null,
    // "own" models need no gate; "hearted" ones belong to someone else and
    // must show their conditions of use / attribution before selection, per
    // VRoid Hub's third-party integration rules.
    source,
    author_name: model.character?.user?.name ?? null,
    license: characterLicense(model),
  };
}

/**
 * Thin client for the parts of VRoid Hub's API
 * (https://hub.vroid.com, documented at developer.vroid.com) this app needs:
 * list the connected account's own and hearted character models, and fetch
 * one model's VRM bytes through the license-gated download flow. No
 * `require("electron")`, so it can be unit tested against a plain fake HTTP
 * server instead of mocking Electron.
 */
function createVroidHubClient({ baseUrl = DEFAULT_BASE_URL, fetchImpl = fetch, clientId } = {}) {
  async function fetchJson(pathnameOrUrl, token) {
    const url = new URL(pathnameOrUrl, baseUrl);
    const response = await fetchImpl(url.toString(), {
      headers: authorizedHeaders(token),
      signal: AbortSignal.timeout(API_REQUEST_TIMEOUT_MS),
    });
    if (!response.ok) {
      throw new Error(`VRoid Hub API request failed (${response.status}).`);
    }
    return response.json();
  }

  // A single `count`-sized request only ever returns one page; an account
  // with more models/hearts than that had the rest silently missing from
  // the list, with no way to reach them (there's nothing further to scroll
  // to — they were never fetched). Follow `_links.next.href` until VRoid
  // Hub stops returning one, per its documented pagination shape.
  async function fetchAllPages(initialPathname, token) {
    const items = [];
    let next = initialPathname;
    for (let page = 0; next && page < MAX_PAGES; page += 1) {
      const body = await fetchJson(next, token);
      if (Array.isArray(body?.data)) items.push(...body.data);
      next = typeof body?._links?.next?.href === "string" ? body._links.next.href : null;
    }
    return items;
  }

  async function listCharacters(token) {
    if (typeof clientId !== "string" || clientId === "") {
      throw new Error("A VRoid Hub application_id (client id) is required to list hearted models.");
    }
    const [ownModels, heartsData] = await Promise.all([
      fetchAllPages(`/api/account/character_models?count=${PAGE_SIZE}`, token),
      // application_id is a required query parameter for /api/hearts, not
      // optional — omitting it doesn't error, it just silently scopes the
      // response to VRoid Hub's own default (unapproved-app) restrictions.
      fetchAllPages(
        `/api/hearts?count=${PAGE_SIZE}&application_id=${encodeURIComponent(clientId)}`,
        token,
      ),
    ]);
    // Only the connected account unconditionally owns its own models; a
    // hearted model created by someone else must be explicitly marked
    // available to other users before this app is allowed to use it, per
    // VRoid Hub's third-party integration rules. /api/hearts' data entries
    // are the character models themselves, not a heart record wrapping one.
    const heartedModels = heartsData.filter((model) => model?.is_other_users_available === true);

    const byId = new Map();
    // Own models are applied last so that, in the unlikely case the account
    // hearted its own model, it's still tagged "own" (no gate needed).
    for (const model of heartedModels) {
      if (typeof model?.id === "string") byId.set(model.id, toCharacterSummary(model, "hearted"));
    }
    for (const model of ownModels) {
      if (typeof model?.id === "string") byId.set(model.id, toCharacterSummary(model, "own"));
    }
    return [...byId.values()];
  }

  async function loadCharacterModel(token, characterId) {
    if (typeof characterId !== "string" || characterId === "") {
      throw new Error("A character id is required.");
    }
    const licenseResponse = await fetchImpl(
      new URL("/api/download_licenses", baseUrl).toString(),
      {
        method: "POST",
        headers: authorizedHeaders(token, { "content-type": "application/json" }),
        body: JSON.stringify({ character_model_id: characterId }),
        signal: AbortSignal.timeout(API_REQUEST_TIMEOUT_MS),
      },
    );
    if (!licenseResponse.ok) {
      throw new Error(
        `VRoid Hub declined to license this model for download (${licenseResponse.status}).`,
      );
    }
    const license = await licenseResponse.json();
    const licenseId = license?.data?.id;
    if (typeof licenseId !== "string" || licenseId === "") {
      throw new Error("VRoid Hub did not return a download license id.");
    }

    // The download endpoint 302s to a presigned, time-limited URL for the
    // actual VRM binary; Node's fetch (unlike browser fetch) exposes the
    // redirect Location header under redirect: "manual" instead of an
    // opaque-redirect response, which is what makes this two-step flow work.
    const downloadResponse = await fetchImpl(
      new URL(`/api/download_licenses/${licenseId}/download`, baseUrl).toString(),
      {
        method: "GET",
        redirect: "manual",
        headers: authorizedHeaders(token),
        signal: AbortSignal.timeout(API_REQUEST_TIMEOUT_MS),
      },
    );
    const downloadUrl = downloadResponse.headers.get("location");
    if (typeof downloadUrl !== "string" || downloadUrl === "") {
      throw new Error("VRoid Hub did not return a model download URL.");
    }

    const fileResponse = await fetchImpl(downloadUrl, {
      signal: AbortSignal.timeout(DOWNLOAD_TIMEOUT_MS),
    });
    if (!fileResponse.ok) {
      throw new Error(`Downloading the VRM file failed (${fileResponse.status}).`);
    }
    return Buffer.from(await fileResponse.arrayBuffer());
  }

  return { listCharacters, loadCharacterModel };
}

module.exports = {
  DEFAULT_BASE_URL,
  createVroidHubClient,
};
