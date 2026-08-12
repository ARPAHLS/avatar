import { resolveHoloTheme } from '../config/environments';

/**
 * @param {import('../config/environments').EnvironmentSelection} selection
 */
export function getHoloFieldStyle(selection) {
  const { glow, imageUrl, hidden } = resolveHoloTheme(selection);

  if (hidden) {
    return {};
  }

  return {
    '--holo-glow-strong': glow.strong,
    '--holo-glow-soft': glow.soft,
    '--holo-glow-highlight': glow.highlight,
    '--holo-image': imageUrl ? `url("${imageUrl}")` : 'none',
  };
}

/** @param {import('../config/environments').EnvironmentSelection} selection */
export function isHoloFieldHidden(selection) {
  return selection.type === 'none';
}

/**
 * The image url a selection currently resolves to, or null.
 *
 * A custom-folder environment loads its bytes only once it is the one on stage,
 * so the same selection resolves to null and then to a url. Anything deriving
 * from the image rather than from the selection has to watch this instead.
 *
 * @param {import('../config/environments').EnvironmentSelection} selection
 * @returns {string | null}
 */
export function getHoloImageUrl(selection) {
  return resolveHoloTheme(selection).imageUrl;
}

/**
 * Whether this selection is waiting on an image that is still being read, as
 * opposed to one that has no image at all. Callers hold what they are already
 * showing while this is true: swapping to a blank stage and back reads as a
 * fault, and bridging with the low-resolution poster reads as one too.
 *
 * @param {import('../config/environments').EnvironmentSelection} selection
 */
export function isHoloFieldPending(selection) {
  return resolveHoloTheme(selection).pending;
}
