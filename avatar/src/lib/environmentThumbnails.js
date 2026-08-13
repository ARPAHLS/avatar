/**
 * Still posters for environment pickers.
 *
 * The picker used to point at the same asset as the stage, so opening
 * Appearance handed the compositor three full animated GIFs — ~32MB and ~480
 * frames between them — to play inside 40px boxes. A poster is what the picker
 * actually needs; the stage keeps the animation.
 *
 * Bundled environments carry a committed poster (npm run thumbs). A user's own
 * folder cannot, so those are generated here on demand and cached to disk, the
 * same arrangement avatar portraits use — see lib/thumbnails.js.
 *
 * Nothing here touches three.js: unlike an avatar portrait, an environment
 * thumbnail is a decode and a downscale, both of which run off the main thread.
 */
import { getLibraryApi } from './desktopMode';
import { imageMime } from './userLibrary';

// Wider than tall because the picker lays these out in a 3-up grid at 40px
// high, and 2x covers HiDPI. `object-fit: cover` still does the final crop, so
// this only has to be big enough, not exactly the displayed shape.
const THUMB_W = 192;
const THUMB_H = 112;

/**
 * GIFs commonly fade in, and frame 0 of a fade is a black rectangle that tells
 * the user nothing about the environment. Sampling a little way in costs one
 * extra decoded frame and avoids that.
 */
const PREFERRED_FRAME = 8;

/**
 * @param {Blob} source
 * @returns {Promise<{ frame: ImageBitmap | VideoFrame, close: () => void }>}
 */
async function decodeStill(source, frameIndex) {
  // ImageDecoder is the only way to ask a GIF for a specific frame;
  // createImageBitmap always hands back frame 0.
  if (source.type === 'image/gif' && typeof ImageDecoder === 'function') {
    const decoder = new ImageDecoder({ data: await source.arrayBuffer(), type: source.type });
    try {
      await decoder.tracks.ready;
      // frameCount climbs as the track is parsed and reads 0 before it starts,
      // so clamping against it too early would silently ask for frame 0 — the
      // fade-in frame this is here to skip. The whole file is already in hand,
      // so waiting for the true count costs nothing.
      await decoder.completed;
      const available = decoder.tracks.selectedTrack?.frameCount ?? 0;
      const wanted = available > 0 ? Math.min(frameIndex, available - 1) : frameIndex;
      const { image } = await decoder.decode({ frameIndex: wanted });
      return { frame: image, close: () => image.close() };
    } finally {
      decoder.close();
    }
  }

  // Stills, and the fallback if ImageDecoder is unavailable. Resizing at decode
  // time is what keeps a 6000x4000 photo dropped into a custom folder from ever
  // materialising at full size.
  let bitmap = await createImageBitmap(source, {
    resizeHeight: THUMB_H,
    resizeQuality: 'high',
  });

  // Height alone leaves anything narrower than the box short on width, and the
  // cover scale below would then stretch a source that had pixels to spare.
  // Which axis needs constraining is only knowable once one decode has run.
  if (bitmap.width < THUMB_W) {
    const byWidth = await createImageBitmap(source, {
      resizeWidth: THUMB_W,
      resizeQuality: 'high',
    });
    bitmap.close();
    bitmap = byWidth;
  }

  return { frame: bitmap, close: () => bitmap.close() };
}

/**
 * Render a still poster for an environment image.
 *
 * @param {Blob} source A `.gif` / `.png` / `.jpg` blob.
 * @param {{ frameIndex?: number }} [options]
 * @returns {Promise<Blob>} A PNG sized {@link THUMB_W}x{@link THUMB_H}.
 */
export async function renderEnvironmentThumbnailBlob(source, options = {}) {
  const { frame, close } = await decodeStill(source, options.frameIndex ?? PREFERRED_FRAME);

  try {
    const width = frame.displayWidth ?? frame.width;
    const height = frame.displayHeight ?? frame.height;
    if (!width || !height) throw new Error('Environment image has no dimensions.');

    const canvas = new OffscreenCanvas(THUMB_W, THUMB_H);
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get a 2d context for the thumbnail.');

    // `cover`: fill the box on both axes and centre the overflow, matching how
    // the picker's CSS crops these.
    const scale = Math.max(THUMB_W / width, THUMB_H / height);
    const drawW = width * scale;
    const drawH = height * scale;
    ctx.drawImage(frame, (THUMB_W - drawW) / 2, (THUMB_H - drawH) / 2, drawW, drawH);

    return await canvas.convertToBlob({ type: 'image/png' });
  } finally {
    close();
  }
}

/** @type {Map<string, string>} library entry id → object URL, for this session. */
const urlCache = new Map();
/** @type {Map<string, Promise<string | null>>} in-flight work, so two mounts share one decode. */
const pending = new Map();

/**
 * Unlike a VRM portrait, which blocks the main thread for a second and so has
 * to be generated strictly one at a time, this is decode work that Chromium
 * runs off-thread. The cap is here to bound how many source files are held in
 * memory at once, not to protect the frame rate.
 */
const MAX_CONCURRENT = 3;
let active = 0;
/** @type {(() => void)[]} */
const waiting = [];

/**
 * @template T
 * @param {() => Promise<T>} job
 * @returns {Promise<T>}
 */
async function runBounded(job) {
  if (active >= MAX_CONCURRENT) {
    await new Promise((resolve) => waiting.push(resolve));
  }
  active += 1;
  try {
    return await job();
  } finally {
    active -= 1;
    waiting.shift()?.();
  }
}

/**
 * @param {{ id: string, fileName: string }} entry
 * @returns {Promise<Blob>}
 */
async function generateThumbnail(entry) {
  const api = getLibraryApi();
  if (!api) throw new Error('Library API unavailable.');

  const buffer = await api.readFile(entry.id);
  // Deliberately not a blob url: those pin their bytes until revoked, and the
  // whole point of this path is that the full-size file does not stay resident
  // once the poster exists. A Blob is collectable as soon as this returns.
  const source = new Blob([buffer], { type: imageMime(entry.fileName) });
  return renderEnvironmentThumbnailBlob(source);
}

/**
 * A cached poster for a user-library environment, generating and storing one if
 * this is the first time we have seen the file.
 *
 * @param {{ id: string, fileName: string }} entry
 * @returns {Promise<string | null>} object URL, or null if unavailable
 */
export function getEnvironmentThumbnail(entry) {
  const cached = urlCache.get(entry.id);
  if (cached) return Promise.resolve(cached);

  const inFlight = pending.get(entry.id);
  if (inFlight) return inFlight;

  const work = (async () => {
    const api = getLibraryApi();
    if (!api) return null;

    try {
      const stored = await api.getThumbnail(entry.id);
      if (stored) {
        const url = URL.createObjectURL(new Blob([stored], { type: 'image/png' }));
        urlCache.set(entry.id, url);
        return url;
      }

      const blob = await runBounded(() => generateThumbnail(entry));

      // Best-effort, and it has to actually behave that way: a cache that
      // refuses the write must not cost us the poster we just generated.
      try {
        await api.putThumbnail(entry.id, await blob.arrayBuffer());
      } catch {
        // Falls back to regenerating next launch.
      }

      const url = URL.createObjectURL(blob);
      urlCache.set(entry.id, url);
      return url;
    } catch {
      return null;
    } finally {
      pending.delete(entry.id);
    }
  })();

  pending.set(entry.id, work);
  return work;
}

/**
 * Drop this session's poster urls. Must be called whenever the environment
 * library is rescanned: ids are derived from the file path alone, so without
 * this an image replaced in place keeps serving its old poster for the rest of
 * the session — urlCache would answer before the disk cache's mtime/size check
 * ever got a chance to miss.
 */
export function revokeEnvironmentThumbnailUrls() {
  for (const url of urlCache.values()) URL.revokeObjectURL(url);
  urlCache.clear();
}
