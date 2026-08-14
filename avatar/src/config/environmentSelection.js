/**
 * The environment selection shape and its validator, kept free of asset imports
 * so `node --test` can load them — `environments.js` pulls in the bundled GIFs.
 *
 * Shape only. Whether an `env` id actually exists cannot be decided here: the
 * custom-folder catalog is scanned at runtime and is still empty when settings
 * are read at launch, so a saved id has to survive normalization to be matched
 * against the catalog later.
 */

/** @typedef {{ type: 'env', id: string } | { type: 'color', value: string } | { type: 'none' }} EnvironmentSelection */

/** Lavender used for Color mode and as the fallback for anything unreadable. */
export const defaultColor = '#e9e1fa';

/** `#rgb` stays accepted because `resolveHoloTheme` already has a branch for it. */
const HEX_COLOR = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i;

/**
 * @param {unknown} raw
 * @returns {EnvironmentSelection | null} null when the shape is unusable, so
 * callers can choose between falling back (settings) and reporting an error.
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
