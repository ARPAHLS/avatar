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
