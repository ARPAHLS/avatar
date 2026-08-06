/**
 * Avatar catalog.
 *
 * Drop `.vrm` files in `src/assets/avatars/` using:
 *   avatar1.vrm      → Avatar 1
 *   avatar2.vrm      → Avatar 2
 *
 * Letter suffixes like `avatar1B.vrm` are ignored (no separate Skins UI).
 * Restart / refresh after adding files so imports are picked up.
 * Desktop users can also point Settings → Directories at any folder of `.vrm` files.
 */

const vrmModules = import.meta.glob('../assets/avatars/avatar*.vrm', {
  eager: true,
  import: 'default',
});

// Portraits generated ahead of time (see scripts/README or npm run thumbs), so
// opening Appearance never has to parse a bundled model just to draw a 56px
// circle. A missing file is not an error: the picker falls back to rendering
// one on the spot.
const thumbnailModules = import.meta.glob('../assets/avatars/thumbs/avatar*.png', {
  eager: true,
  import: 'default',
});

/** @param {number} index */
function bundledThumbnail(index) {
  const match = Object.entries(thumbnailModules).find(([modulePath]) =>
    modulePath.endsWith(`/avatar${index}.png`),
  );
  return match ? /** @type {string} */ (match[1]) : null;
}

/**
 * @typedef {Object} AvatarSkin
 * @property {string} id
 * @property {string} label
 * @property {string} file
 * @property {string} path
 */

/**
 * @typedef {Object} AvatarEntry
 * @property {string} id
 * @property {string} label
 * @property {number} index
 * @property {string | null} [thumbnail]
 * @property {AvatarSkin[]} skins
 */

/** @type {Map<number, AvatarEntry>} */
const byIndex = new Map();

for (const [modulePath, src] of Object.entries(vrmModules)) {
  const file = modulePath.split('/').pop() ?? '';
  const match = /^avatar(\d+)\.vrm$/i.exec(file);
  if (!match) continue;

  const index = Number.parseInt(match[1], 10);
  const id = `avatar${index}`;

  byIndex.set(index, {
    id,
    label: `Avatar ${index}`,
    index,
    thumbnail: bundledThumbnail(index),
    skins: [
      {
        id: 'default',
        label: 'Default',
        file,
        path: /** @type {string} */ (src),
      },
    ],
  });
}

/** @type {AvatarEntry[]} */
export const avatars = [...byIndex.values()].sort((a, b) => a.index - b.index);

export const defaultAvatarId = avatars[0]?.id ?? 'avatar1';
export const defaultSkinId = 'default';

/** @param {string} avatarId */
export function getAvatarById(avatarId) {
  return avatars.find((entry) => entry.id === avatarId) ?? avatars[0] ?? null;
}

/**
 * @param {string} avatarId
 * @param {string} [skinId]
 */
export function getSkin(avatarId, skinId = defaultSkinId) {
  const avatar = getAvatarById(avatarId);
  if (!avatar) return null;
  return avatar.skins.find((skin) => skin.id === skinId) ?? avatar.skins[0] ?? null;
}

/**
 * @param {string} avatarId
 * @param {string} [skinId]
 */
export function resolveAvatarPath(avatarId, skinId = defaultSkinId) {
  return getSkin(avatarId, skinId)?.path ?? null;
}
