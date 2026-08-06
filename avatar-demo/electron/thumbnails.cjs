'use strict';

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const CACHE_DIR_NAME = 'thumbnails';
// A 112x112 RGBA PNG of a character portrait; anything far past this is not a
// thumbnail we wrote, so refuse to serve or store it.
const MAX_THUMBNAIL_BYTES = 512 * 1024;

/** @type {string | null} */
let cacheDir = null;

/**
 * @param {string} userDataPath
 */
function configureThumbnailCache(userDataPath) {
  cacheDir = path.join(userDataPath, CACHE_DIR_NAME);
  try {
    fs.mkdirSync(cacheDir, { recursive: true });
  } catch {
    // A cache we cannot create is not fatal — callers fall back to rendering.
    cacheDir = null;
  }
  return cacheDir;
}

/**
 * Two files can share a name across folders, and the same file can be replaced
 * in place, so the identity of a thumbnail is the path *and* what the file
 * looked like when we rendered it. Swapping in a new .vrm under the same name
 * changes mtime and size, which misses the cache and regenerates.
 *
 * @param {string} absolutePath
 * @returns {string | null}
 */
function cacheKey(absolutePath) {
  let stat;
  try {
    stat = fs.statSync(absolutePath);
  } catch {
    return null;
  }
  if (!stat.isFile()) return null;

  const pathHash = crypto.createHash('sha1').update(absolutePath).digest('hex').slice(0, 16);
  const stamp = `${Math.round(stat.mtimeMs)}-${stat.size}`;
  return `${pathHash}-${stamp}`;
}

/**
 * @param {string} absolutePath
 * @returns {Buffer | null}
 */
function readThumbnail(absolutePath) {
  if (!cacheDir) return null;
  const key = cacheKey(absolutePath);
  if (!key) return null;

  const file = path.join(cacheDir, `${key}.png`);
  try {
    const stat = fs.statSync(file);
    if (!stat.isFile() || stat.size > MAX_THUMBNAIL_BYTES) return null;
    return fs.readFileSync(file);
  } catch {
    return null;
  }
}

/**
 * @param {string} absolutePath
 * @param {Buffer} png
 * @returns {boolean}
 */
function writeThumbnail(absolutePath, png) {
  if (!cacheDir) return false;
  if (!Buffer.isBuffer(png) || png.length === 0 || png.length > MAX_THUMBNAIL_BYTES) return false;
  const key = cacheKey(absolutePath);
  if (!key) return false;

  const pathHash = key.slice(0, 16);
  try {
    // Drop older renders of this same file, or every edit of a .vrm the user
    // keeps tweaking would leave another orphan behind forever.
    for (const name of fs.readdirSync(cacheDir)) {
      if (name.startsWith(`${pathHash}-`) && name !== `${key}.png`) {
        fs.rmSync(path.join(cacheDir, name), { force: true });
      }
    }
    fs.writeFileSync(path.join(cacheDir, `${key}.png`), png);
    return true;
  } catch {
    return false;
  }
}

module.exports = {
  configureThumbnailCache,
  readThumbnail,
  writeThumbnail,
};
