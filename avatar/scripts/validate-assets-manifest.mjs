/**
 * Validates docs/assets-manifest.yml: schema, unique ids, on-disk paths,
 * and parent_id references. Invoked from npm test.
 */
import { readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as yaml from 'js-yaml';

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const MANIFEST_PATH = join(REPO_ROOT, 'docs/assets-manifest.yml');

const PATH_SCOPES = new Set(['ships_in_app', 'derived', 'branding', 'documentation', 'license_reference']);

/** @returns {{ ok: true } | { ok: false, errors: string[] }} */
export function validateAssetsManifest(manifestPath = MANIFEST_PATH, repoRoot = REPO_ROOT) {
  const errors = [];

  let doc;
  try {
    doc = yaml.load(readFileSync(manifestPath, 'utf8'));
  } catch (error) {
    return { ok: false, errors: [`Failed to parse manifest: ${error}`] };
  }

  if (!doc || typeof doc !== 'object') {
    return { ok: false, errors: ['Manifest root must be an object.'] };
  }

  if (typeof doc.schema_version !== 'number') {
    errors.push('schema_version must be a number.');
  }

  if (!Array.isArray(doc.assets)) {
    errors.push('assets must be an array.');
    return { ok: false, errors };
  }

  /** @type {Map<string, { path: string | null | undefined }>} */
  const byId = new Map();

  for (const [index, entry] of doc.assets.entries()) {
    const label = `assets[${index}]`;

    if (!entry || typeof entry !== 'object') {
      errors.push(`${label}: must be an object.`);
      continue;
    }

    if (typeof entry.id !== 'string' || entry.id.trim() === '') {
      errors.push(`${label}: missing id.`);
      continue;
    }

    if (byId.has(entry.id)) {
      errors.push(`Duplicate id: ${entry.id}`);
    } else {
      byId.set(entry.id, entry);
    }

    if (typeof entry.scope !== 'string' || entry.scope.trim() === '') {
      errors.push(`${entry.id}: missing scope.`);
    }

    if (PATH_SCOPES.has(entry.scope)) {
      if (typeof entry.path !== 'string' || entry.path.trim() === '') {
        errors.push(`${entry.id}: path required for scope ${entry.scope}.`);
      } else {
        const absolute = join(repoRoot, entry.path.replace(/\//g, '\\'));
        const normalized = join(repoRoot, entry.path);
        if (!existsSync(normalized) && !existsSync(absolute)) {
          errors.push(`${entry.id}: file not found at ${entry.path}`);
        }
      }
    }

    if (entry.parent_id != null) {
      if (typeof entry.parent_id !== 'string') {
        errors.push(`${entry.id}: parent_id must be a string.`);
      } else if (!byId.has(entry.parent_id) && !doc.assets.some((a) => a?.id === entry.parent_id)) {
        // parent may appear later in file — second pass below
      }
    }
  }

  for (const entry of doc.assets) {
    if (entry?.parent_id && !byId.has(entry.parent_id)) {
      errors.push(`${entry.id}: parent_id ${entry.parent_id} not found.`);
    }
  }

  const needsReview = doc.assets.filter(
    (entry) => entry?.scope === 'ships_in_app' && entry?.audit_status === 'needs_review',
  );
  if (needsReview.length > 0) {
    // Warning only — do not fail CI; listed for release audit visibility.
    console.warn(
      `[assets-manifest] ${needsReview.length} ships_in_app asset(s) marked needs_review:`,
      needsReview.map((e) => e.id).join(', '),
    );
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  return { ok: true };
}

function main() {
  const result = validateAssetsManifest();
  if (!result.ok) {
    console.error('[assets-manifest] validation failed:');
    for (const error of result.errors) {
      console.error(`  - ${error}`);
    }
    process.exit(1);
  }
  console.log('[assets-manifest] OK');
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main();
}
