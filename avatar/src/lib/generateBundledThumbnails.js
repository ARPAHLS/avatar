/**
 * Dev-only: renders the picker artwork for each bundled avatar and environment
 * and writes it into `src/assets/avatars/thumbs/` and
 * `src/assets/environments/thumbs/`, to be committed.
 *
 * This deliberately reuses the same renderers the app uses at runtime rather
 * than standing up a headless-GL or Puppeteer pipeline just for build assets —
 * one code path means the committed thumbnails cannot drift from the ones
 * generated for a user's own .vrm files or custom environment folder.
 *
 * Run with: npm run thumbs
 *
 * Vite strips this module from production builds via the import.meta.env.DEV
 * guard at its only call site.
 */
import { avatars } from '../config/avatars';
import { environments } from '../config/environments';
import { getDesktopApi } from './desktopMode';
import { renderThumbnailBlob } from './thumbnails';
import { renderEnvironmentThumbnailBlob } from './environmentThumbnails';

/**
 * Frame to sample per bundled environment, where the default lands on a fade-in
 * or an otherwise unrepresentative frame. Keyed by environment id.
 * @type {Record<string, number>}
 */
const ENVIRONMENT_FRAME_OVERRIDES = {};

async function generateAvatarThumbnails(api) {
  for (const entry of avatars) {
    const modelPath = entry.skins.find((skin) => skin.id === 'default')?.path ?? entry.skins[0]?.path;
    if (!modelPath) continue;

    try {
      const blob = await renderThumbnailBlob(modelPath);
      const written = await api.devWriteThumbnail(
        'avatars',
        `${entry.id}.png`,
        await blob.arrayBuffer(),
      );
      console.log(`[thumbs] ${entry.id} -> ${written}`);
    } catch (error) {
      console.error(`[thumbs] ${entry.id} failed`, error);
    }
  }
}

async function generateEnvironmentThumbnails(api) {
  for (const entry of environments) {
    try {
      // The bundled GIFs are Vite-resolved urls, so this is the same fetch the
      // stage does — no filesystem access from the renderer.
      const response = await fetch(entry.src);
      if (!response.ok) throw new Error(`fetch ${entry.src} -> ${response.status}`);

      const blob = await renderEnvironmentThumbnailBlob(await response.blob(), {
        frameIndex: ENVIRONMENT_FRAME_OVERRIDES[entry.id],
      });
      const written = await api.devWriteThumbnail(
        'environments',
        `${entry.id}.png`,
        await blob.arrayBuffer(),
      );
      console.log(`[thumbs] env ${entry.id} -> ${written}`);
    } catch (error) {
      console.error(`[thumbs] env ${entry.id} failed`, error);
    }
  }
}

export async function generateBundledThumbnails() {
  const api = getDesktopApi();
  if (!api?.devWriteThumbnail) {
    console.error('[thumbs] dev write channel unavailable — run via npm run thumbs');
    return;
  }

  await generateAvatarThumbnails(api);
  await generateEnvironmentThumbnails(api);

  console.log('[thumbs] done');
  api.closeWindow?.();
}
