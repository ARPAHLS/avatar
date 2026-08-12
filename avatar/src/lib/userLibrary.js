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
export function imageMime(fileName) {
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
 * Load `.vrma` entries from a user folder into AnimationEntry-shaped objects.
 * These replace the bundled catalog outright, so every entry has to stand on its
 * own as a selectable, looping clip.
 * @param {string} dirPath
 * @returns {Promise<{ animations: object[], error: string | null, notice?: string }>}
 */
export async function loadLibraryAnimations(dirPath) {
  const api = getLibraryApi();
  if (!api) return { animations: [], error: 'Library API unavailable.' };

  try {
    const exists = await api.pathExists(dirPath);
    if (!exists) {
      return {
        animations: [],
        error: 'Animation folder not found. Reset Directories or pick a new folder.',
      };
    }
    const scanned = await api.scanAnimations(dirPath);
    const animations = [];
    let skipped = 0;
    try {
      for (const entry of scanned) {
        let buffer;
        try {
          buffer = await api.readFile(entry.id);
        } catch {
          // The scan already stat'd this file, so it only fails here if it went
          // away in between — not a reason to lose the rest of the folder.
          skipped += 1;
          continue;
        }
        // .vrma is a glTF binary container, same as .vrm.
        const blobUrl = toBlobUrl('model/gltf-binary', buffer);
        animations.push({
          id: entry.id,
          label: entry.label,
          source: 'vrma',
          playback: 'loop',
          vrmaUrl: blobUrl,
          group: 'Custom',
          selectable: true,
        });
      }
    } catch (error) {
      // Bailing out with a partial list would drop the only references to the
      // urls already minted in this loop.
      revokeAnimationBlobUrls(animations);
      throw error;
    }

    if (skipped > 0 && animations.length === 0) {
      // Distinct from an empty folder: the clips are there, we just cannot read
      // them. Saying "no .vrma files" here would state the opposite.
      return {
        animations: [],
        error: `Could not read any of the ${skipped} .vrma ${
          skipped === 1 ? 'file' : 'files'
        } in that folder. Keeping the default animation list.`,
      };
    }
    if (skipped > 0) {
      return {
        animations,
        error: null,
        // Must name the kind: the Directories notice self-clears by keyword.
        notice: `Skipped ${skipped} unreadable animation ${skipped === 1 ? 'file' : 'files'}.`,
      };
    }
    return { animations, error: null };
  } catch (error) {
    return {
      animations: [],
      error: error instanceof Error ? error.message : 'Failed to load animation folder.',
    };
  }
}

/**
 * Load image entries from a user folder into EnvironmentEntry-shaped objects.
 *
 * This reads no image data. It used to pull every file in the folder fully into
 * renderer memory as a blob url the moment the folder was configured — before
 * the Custom expander had even been opened — and blob urls pin their bytes,
 * so Chromium could not discard and refetch them the way it can an ordinary
 * image. A folder of large gifs therefore held hundreds of MB resident for the
 * session. Entries now start with `src: null`; the picker draws a cached poster
 * (lib/environmentThumbnails.js) and only the environment actually selected
 * gets its bytes read, via loadEnvironmentSource.
 *
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
    const environments = scanned.map((entry) => ({
      id: entry.id,
      label: entry.label,
      // Kept so the poster and the on-demand source can both work out the mime
      // type without going back to the scan.
      fileName: entry.fileName,
      src: null,
      glow: customEnvGlow,
      custom: true,
      // Distinguishes these from bundled custom/ media, which carries a url from
      // the start. `src` cannot do that job: it fills in once this entry is the
      // one on stage, and the picker must not start showing the full image then.
      library: true,
    }));
    return { environments, error: null };
  } catch (error) {
    return {
      environments: [],
      error: error instanceof Error ? error.message : 'Failed to load environment folder.',
    };
  }
}

/**
 * Read one environment image and mint a blob url for it. Only ever called for
 * the environment currently on the stage: the picker uses posters instead, so
 * at most one full-size image is resident at a time.
 *
 * @param {{ id: string, fileName: string }} entry
 * @returns {Promise<string | null>}
 */
export async function loadEnvironmentSource(entry) {
  const api = getLibraryApi();
  if (!api) return null;

  try {
    const buffer = await api.readFile(entry.id);
    return toBlobUrl(imageMime(entry.fileName), buffer);
  } catch {
    // The file went away between the scan and here; the stage keeps its glow
    // and simply shows no image.
    return null;
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
 * @param {object[]} animations
 */
export function revokeAnimationBlobUrls(animations) {
  for (const entry of animations ?? []) {
    if (typeof entry.vrmaUrl === 'string' && entry.vrmaUrl.startsWith('blob:')) {
      URL.revokeObjectURL(entry.vrmaUrl);
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
