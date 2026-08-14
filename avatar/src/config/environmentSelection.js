/**
 * The environment selection shape and its validator, free of asset imports so
 * `node --test` can load them — `environments.js` pulls in the bundled GIFs.
 *
 * Shape only: a custom folder is scanned long after settings are read, so an
 * `env` id cannot be checked here and has to survive to be matched later.
 */

/** @typedef {{ type: 'env', id: string } | { type: 'color', value: string } | { type: 'none' }} EnvironmentSelection */

export const defaultColor = '#e9e1fa';

/** `#rgb` stays accepted because `resolveHoloTheme` already has a branch for it. */
const HEX_COLOR = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i;

/**
 * @param {unknown} raw
 * @returns {EnvironmentSelection | null} null lets a caller choose between
 * falling back and reporting an error.
 */
export function normalizeEnvironmentSelection(raw) {
  if (!raw || typeof raw !== 'object') return null;

  const data = /** @type {Record<string, unknown>} */ (raw);

  if (data.type === 'none') return { type: 'none' };

  if (data.type === 'env') {
    const id = typeof data.id === 'string' ? data.id.trim() : '';
    return id === '' ? null : { type: 'env', id };
  }

  if (data.type === 'color') {
    const value = typeof data.value === 'string' ? data.value.trim().toLowerCase() : '';
    return HEX_COLOR.test(value) ? { type: 'color', value } : null;
  }

  return null;
}
