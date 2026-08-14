/**
 * Catalog lookups, kept free of asset imports so `node --test` can load them.
 * A custom animations folder replaces the bundled list at runtime
 * (Settings → Directories), so every function here takes its catalog.
 */

/** @typedef {'rest' | 'vrma' | 'sequence'} AnimationSource */
/** @typedef {'loop' | 'once'} AnimationPlayback */

/**
 * @typedef {Object} AnimationEntry
 * @property {string} id
 * @property {string} label
 * @property {AnimationSource} source
 * @property {AnimationPlayback} [playback]
 * @property {string} [vrmaUrl]
 * @property {string[]} [intro]
 * @property {string[]} [sequence]
 * @property {string} [description]
 * @property {string} [group]
 * @property {boolean} [selectable]
 */

export const defaultAnimationId = 'default';

/**
 * Neutral bind pose. Needs no asset, so it doubles as the last-resort entry when
 * a catalog is empty — callers dereference `.source` unconditionally.
 * @type {AnimationEntry}
 */
export const restAnimation = {
  id: 'rest',
  label: 'Rest',
  source: 'rest',
  playback: 'loop',
  group: 'Default',
  description: 'Neutral bind pose with blink and optional lip sync.',
  selectable: false,
};

/**
 * @param {string} id
 * @param {AnimationEntry[]} catalog
 */
export function getAnimationById(id, catalog) {
  return catalog.find((entry) => entry.id === id) ?? catalog[0] ?? restAnimation;
}

/**
 * Exact lookup for callers that have to know when a query *misses*: a trigger
 * arriving from outside the picker (hotkey, local bus, keyword match) must be
 * able to report an unknown clip rather than play something else.
 *
 * `getAnimationById` cannot serve that — it falls back to a real entry on
 * purpose, so a typo there silently plays the catalog's first clip.
 *
 * Ids are matched before labels so a custom folder holding a file named after
 * a bundled label can never shadow an exact id. `rest` is returned like any
 * other entry; hiding it from the picker is `getSelectableAnimations`'s job,
 * and holding a neutral pose is a legitimate thing to ask for.
 * @param {AnimationEntry[]} catalog
 * @param {unknown} query id, or label (trimmed, case-insensitive)
 * @returns {AnimationEntry | null}
 */
export function findAnimation(catalog, query) {
  if (!Array.isArray(catalog) || typeof query !== 'string') return null;

  const trimmed = query.trim();
  if (trimmed === '') return null;

  const byId = catalog.find((entry) => entry.id === trimmed);
  if (byId) return byId;

  const folded = trimmed.toLowerCase();
  return (
    catalog.find(
      (entry) => typeof entry.label === 'string' && entry.label.trim().toLowerCase() === folded,
    ) ?? null
  );
}

/**
 * @param {string} id
 * @param {AnimationEntry[]} catalog
 */
export function resolveVrmaUrl(id, catalog) {
  const entry = getAnimationById(id, catalog);
  return entry.source === 'vrma' && entry.vrmaUrl ? entry.vrmaUrl : null;
}

/**
 * Bind a catalog into a single-argument resolver. `playSequence` maps the
 * resolver over an id array, so passing `resolveVrmaUrl` itself would hand the
 * array index in as the catalog.
 * @param {AnimationEntry[]} catalog
 */
export function createVrmaResolver(catalog) {
  return (id) => resolveVrmaUrl(id, catalog);
}

/**
 * Animations shown in the dropdown.
 * @param {AnimationEntry[]} catalog
 */
export function getSelectableAnimations(catalog) {
  return catalog.filter((entry) => entry.selectable !== false);
}

/**
 * The id to show for `catalog` when `preferredId` is not in it — first
 * selectable clip, or the bundled default when the catalog is empty.
 * @param {AnimationEntry[]} catalog
 * @param {string} preferredId
 */
export function resolveAnimationId(catalog, preferredId) {
  if (catalog.some((entry) => entry.id === preferredId && entry.selectable !== false)) {
    return preferredId;
  }
  return getSelectableAnimations(catalog)[0]?.id ?? defaultAnimationId;
}
