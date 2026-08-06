import { getLibraryApi } from './desktopMode';

const customEnvGlow = {
  strong: 'rgba(190, 175, 230, 0.52)',
  soft: 'rgba(150, 130, 200, 0.24)',
  highlight: 'rgba(255, 255, 255, 0.12)',
};

/**
 * @param {string} mime
 * @param {ArrayBuffer} buffer
 */
function toBlobUrl(mime, buffer) {
  return URL.createObjectURL(new Blob([buffer], { type: mime }));
}

/**
 * @param {string} fileName
 */
function imageMime(fileName) {
  const lower = fileName.toLowerCase();
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg';
  return 'image/gif';
}

/**
 * Load `.vrm` entries from a user folder into AvatarEntry-shaped objects with blob URLs.
 * @param {string} dirPath
 * @returns {Promise<{ avatars: object[], error: string | null }>}
 */
export async function loadLibraryAvatars(dirPath) {
  const api = getLibraryApi();
  if (!api) return { avatars: [], error: 'Library API unavailable.' };

  try {
    const exists = await api.pathExists(dirPath);
    if (!exists) {
      return { avatars: [], error: 'Avatar folder not found. Reset Directories or pick a new folder.' };
    }
    const scanned = await api.scanAvatars(dirPath);
    const avatars = [];
    for (const [index, entry] of scanned.entries()) {
      const buffer = await api.readFile(entry.id);
      const blobUrl = toBlobUrl('model/gltf-binary', buffer);
      avatars.push({
        id: entry.id,
        label: entry.label,
        index,
        skins: [
          {
            id: 'default',
            label: 'Default',
            file: entry.fileName,
            path: blobUrl,
          },
        ],
      });
    }
    return { avatars, error: null };
  } catch (error) {
    return {
      avatars: [],
      error: error instanceof Error ? error.message : 'Failed to load avatar folder.',
    };
  }
}

/**
 * Load image entries from a user folder into EnvironmentEntry-shaped objects.
 * @param {string} dirPath
 * @returns {Promise<{ environments: object[], error: string | null }>}
 */
export async function loadLibraryEnvironments(dirPath) {
  const api = getLibraryApi();
  if (!api) return { environments: [], error: 'Library API unavailable.' };

  try {
    const exists = await api.pathExists(dirPath);
    if (!exists) {
      return {
        environments: [],
        error: 'Environment folder not found. Reset Directories or pick a new folder.',
      };
    }
    const scanned = await api.scanEnvironments(dirPath);
    const environments = [];
    for (const entry of scanned) {
      const buffer = await api.readFile(entry.id);
      const blobUrl = toBlobUrl(imageMime(entry.fileName), buffer);
      environments.push({
        id: entry.id,
        label: entry.label,
        src: blobUrl,
        glow: customEnvGlow,
        custom: true,
      });
    }
    return { environments, error: null };
  } catch (error) {
    return {
      environments: [],
      error: error instanceof Error ? error.message : 'Failed to load environment folder.',
    };
  }
}

/**
 * @param {object[]} avatars
 */
export function revokeAvatarBlobUrls(avatars) {
  for (const entry of avatars ?? []) {
    for (const skin of entry.skins ?? []) {
      if (typeof skin.path === 'string' && skin.path.startsWith('blob:')) {
        URL.revokeObjectURL(skin.path);
      }
    }
  }
}

/**
 * @param {object[]} environments
 */
export function revokeEnvironmentBlobUrls(environments) {
  for (const entry of environments ?? []) {
    if (typeof entry.src === 'string' && entry.src.startsWith('blob:')) {
      URL.revokeObjectURL(entry.src);
    }
  }
}
