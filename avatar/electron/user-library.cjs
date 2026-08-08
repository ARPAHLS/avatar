'use strict';

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const AVATAR_EXT = new Set(['.vrm']);
const ANIM_EXT = new Set(['.vrma']);
const ENV_EXT = new Set(['.gif', '.png', '.jpg', '.jpeg']);

/** @type {Map<string, string>} id → absolute file path */
const fileIndex = new Map();

/**
 * @param {string} absolutePath
 */
function makeId(kind, absolutePath) {
  const hash = crypto.createHash('sha1').update(absolutePath).digest('hex').slice(0, 12);
  const base = path.basename(absolutePath).replace(/\.[^.]+$/, '').replace(/[^a-zA-Z0-9_-]/g, '-');
  return `lib-${kind}-${base}-${hash}`;
}

/**
 * @param {string} filePath
 */
function labelFromFile(filePath) {
  const base = path.basename(filePath).replace(/\.[^.]+$/, '');
  const cleaned = base.replace(/[_-]+/g, ' ').trim();
  if (cleaned.length > 24) return `${cleaned.slice(0, 22)}…`;
  return cleaned || 'Untitled';
}

/**
 * @param {unknown} dirPath
 * @returns {string | null}
 */
function normalizeDir(dirPath) {
  if (typeof dirPath !== 'string' || dirPath.trim() === '') return null;
  const resolved = path.resolve(dirPath.trim());
  try {
    if (!fs.statSync(resolved).isDirectory()) return null;
  } catch {
    return null;
  }
  return resolved;
}

/**
 * @param {string} dirPath
 * @param {Set<string>} allowedExt
 * @param {'avatar' | 'anim' | 'env'} kind
 */
function scanDirectory(dirPath, allowedExt, kind) {
  const dir = normalizeDir(dirPath);
  if (!dir) return [];

  let names;
  try {
    names = fs.readdirSync(dir);
  } catch {
    return [];
  }

  const entries = [];
  for (const name of names) {
    const ext = path.extname(name).toLowerCase();
    if (!allowedExt.has(ext)) continue;
    const absolutePath = path.join(dir, name);
    try {
      if (!fs.statSync(absolutePath).isFile()) continue;
    } catch {
      continue;
    }
    const id = makeId(kind, absolutePath);
    fileIndex.set(id, absolutePath);
    entries.push({
      id,
      label: labelFromFile(absolutePath),
      fileName: name,
    });
  }

  return entries.sort((a, b) => a.label.localeCompare(b.label));
}

/**
 * @param {unknown} dirPath
 */
function scanAvatars(dirPath) {
  return scanDirectory(dirPath, AVATAR_EXT, 'avatar');
}

/**
 * @param {unknown} dirPath
 */
function scanAnimations(dirPath) {
  return scanDirectory(dirPath, ANIM_EXT, 'anim');
}

/**
 * @param {unknown} dirPath
 */
function scanEnvironments(dirPath) {
  return scanDirectory(dirPath, ENV_EXT, 'env');
}

/**
 * @param {unknown} id
 * @returns {Buffer}
 */
function readLibraryFile(id) {
  if (typeof id !== 'string' || id.trim() === '') {
    throw new Error('Missing library file id.');
  }
  const absolutePath = fileIndex.get(id);
  if (!absolutePath) {
    throw new Error('Unknown library file. Refresh the directory and try again.');
  }
  // Ensure the indexed path still exists and is a regular file.
  const stat = fs.statSync(absolutePath);
  if (!stat.isFile()) {
    throw new Error('Library path is not a file.');
  }
  return fs.readFileSync(absolutePath);
}

/**
 * @param {unknown} dirPath
 */
function pathExists(dirPath) {
  return normalizeDir(dirPath) != null;
}

/**
 * The absolute path behind a scanned id, for callers that need to stat the
 * file rather than read it (the thumbnail cache keys on mtime and size).
 * @param {unknown} id
 * @returns {string | null}
 */
function resolveLibraryPath(id) {
  if (typeof id !== 'string' || id.trim() === '') return null;
  return fileIndex.get(id) ?? null;
}

module.exports = {
  scanAvatars,
  scanAnimations,
  scanEnvironments,
  readLibraryFile,
  resolveLibraryPath,
  pathExists,
  normalizeDir,
};
