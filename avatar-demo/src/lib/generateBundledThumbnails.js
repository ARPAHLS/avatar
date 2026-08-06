/**
 * Dev-only: renders a portrait for each bundled avatar and writes it into
 * `src/assets/avatars/thumbs/`, to be committed.
 *
 * This deliberately reuses the same renderer the app uses at runtime rather
 * than standing up a headless-GL or Puppeteer pipeline just for build assets —
 * one code path means the committed thumbnails cannot drift from the ones
 * generated for a user's own .vrm files.
 *
 * Run with: npm run thumbs
 *
 * Vite strips this module from production builds via the import.meta.env.DEV
 * guard at its only call site.
 */
import { avatars } from '../config/avatars';
import { getDesktopApi } from './desktopMode';
import { renderThumbnailBlob } from './thumbnails';

export async function generateBundledThumbnails() {
  const api = getDesktopApi();
  if (!api?.devWriteThumbnail) {
    console.error('[thumbs] dev write channel unavailable — run via npm run thumbs');
    return;
  }

  for (const entry of avatars) {
    const modelPath = entry.skins.find((skin) => skin.id === 'default')?.path ?? entry.skins[0]?.path;
    if (!modelPath) continue;

    try {
      const blob = await renderThumbnailBlob(modelPath);
      const written = await api.devWriteThumbnail(`${entry.id}.png`, await blob.arrayBuffer());
      console.log(`[thumbs] ${entry.id} -> ${written}`);
    } catch (error) {
      console.error(`[thumbs] ${entry.id} failed`, error);
    }
  }

  console.log('[thumbs] done');
  api.closeWindow?.();
}
