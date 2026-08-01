/**
 * Avatar + skin catalog.
 *
 * Drop `.vrm` files in `src/assets/avatars/` using this naming:
 *   avatar1.vrm      → Avatar 1, default skin
 *   avatar1B.vrm     → Avatar 1, skin B
 *   avatar1C.vrm     → Avatar 1, skin C
 *   avatar2.vrm      → Avatar 2, default skin
 *
 * Restart / refresh the Vite/Electron process after adding files so imports are picked up.
 */

const vrmModules = import.meta.glob('../assets/avatars/avatar*.vrm', {
  eager: true,
  import: 'default',
});

/**
 * @typedef {Object} AvatarSkin
 * @property {string} id          e.g. 'default' | 'B' | 'C'
 * @property {string} label
 * @property {string} file        Filename on disk
 * @property {string} path        Vite-resolved URL
 */

/**
 * @typedef {Object} AvatarEntry
 * @property {string} id          e.g. 'avatar1'
 * @property {string} label
 * @property {number} index
 * @property {AvatarSkin[]} skins
 */

/** @type {Map<number, AvatarEntry>} */
const byIndex = new Map();

for (const [modulePath, src] of Object.entries(vrmModules)) {
  const file = modulePath.split('/').pop() ?? '';
  const match = /^avatar(\d+)([A-Za-z])?\.vrm$/i.exec(file);
  if (!match) continue;

  const index = Number.parseInt(match[1], 10);
  const skinKey = match[2] ? match[2].toUpperCase() : 'default';
  const id = `avatar${index}`;

  if (!byIndex.has(index)) {
    byIndex.set(index, {
      id,
      label: `Avatar ${index}`,
      index,
      skins: [],
    });
  }

  byIndex.get(index).skins.push({
    id: skinKey,
    label: skinKey === 'default' ? 'Default' : `Skin ${skinKey}`,
    file,
    path: /** @type {string} */ (src),
  });
}

/** @type {AvatarEntry[]} */
export const avatars = [...byIndex.values()]
  .sort((a, b) => a.index - b.index)
  .map((entry) => ({
    ...entry,
    skins: entry.skins.sort((a, b) => {
      if (a.id === 'default') return -1;
      if (b.id === 'default') return 1;
      return a.id.localeCompare(b.id);
    }),
  }));

/** @deprecated Use `avatars` — kept for brief compatibility */
export const avatarModels = avatars.flatMap((avatar) =>
  avatar.skins.map((skin) => ({
    id: `${avatar.id}-${skin.id}`,
    label: `${avatar.label} · ${skin.label}`,
    path: skin.path,
    avatarId: avatar.id,
    skinId: skin.id,
  })),
);

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

/** @param {string} avatarId */
export function listSkinsForAvatar(avatarId) {
  return getAvatarById(avatarId)?.skins ?? [];
}
