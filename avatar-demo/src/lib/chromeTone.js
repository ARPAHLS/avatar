import { defaultColor, getEnvironmentById } from '../config/environments';

/** @typedef {'dark' | 'light'} ChromeTone */

/** White chrome is the default. Silver only when the backdrop is clearly light. */
const IMAGE_LUMA_CACHE = new Map();
const LIGHT_LUMA_THRESHOLD = 0.72;

/** Built-in environments with known tone (do not trust glow color alone). */
const BUILTIN_CHROME = {
  stars: 'dark',
  code: 'dark',
  bloom: 'light',
};

/** @param {string} hex */
export function hexLuminance(hex) {
  const normalized = hex.replace('#', '');
  if (normalized.length !== 6) return 0.5;
  const value = Number.parseInt(normalized, 16);
  const r = ((value >> 16) & 255) / 255;
  const g = ((value >> 8) & 255) / 255;
  const b = (value & 255) / 255;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Sync tone — defaults to dark (whitish bar/buttons).
 * @param {import('../config/environments').EnvironmentSelection} selection
 * @returns {ChromeTone}
 */
export function resolveChromeToneSync(selection) {
  if (!selection || selection.type === 'none') {
    return 'dark';
  }

  if (selection.type === 'color') {
    const hex = selection.value?.length === 4 ? defaultColor : selection.value;
    return hexLuminance(hex ?? defaultColor) >= LIGHT_LUMA_THRESHOLD ? 'light' : 'dark';
  }

  if (selection.type === 'env') {
    if (BUILTIN_CHROME[selection.id]) {
      return BUILTIN_CHROME[selection.id];
    }

    const env = getEnvironmentById(selection.id);
    if (env?.src && IMAGE_LUMA_CACHE.has(env.src)) {
      return IMAGE_LUMA_CACHE.get(env.src) >= LIGHT_LUMA_THRESHOLD ? 'light' : 'dark';
    }
  }

  return 'dark';
}

/**
 * @param {string} src
 * @returns {Promise<number>}
 */
export function sampleImageLuminance(src) {
  if (IMAGE_LUMA_CACHE.has(src)) {
    return Promise.resolve(IMAGE_LUMA_CACHE.get(src));
  }

  return new Promise((resolve) => {
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => {
      try {
        const size = 32;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) {
          resolve(0.35);
          return;
        }
        ctx.drawImage(img, 0, 0, size, size);
        // Sample the lower strip — closest to the glass bar / chrome buttons.
        const yStart = Math.floor(size * 0.72);
        const { data } = ctx.getImageData(0, yStart, size, size - yStart);
        let total = 0;
        let count = 0;
        for (let i = 0; i < data.length; i += 4) {
          const a = data[i + 3] / 255;
          if (a < 0.2) continue;
          const r = data[i] / 255;
          const g = data[i + 1] / 255;
          const b = data[i + 2] / 255;
          total += (0.2126 * r + 0.7152 * g + 0.0722 * b) * a;
          count += a;
        }
        const luma = count > 0 ? total / count : 0.35;
        IMAGE_LUMA_CACHE.set(src, luma);
        resolve(luma);
      } catch {
        resolve(0.35);
      }
    };
    img.onerror = () => resolve(0.35);
    img.src = src;
  });
}

/**
 * @param {import('../config/environments').EnvironmentSelection} selection
 * @returns {Promise<ChromeTone>}
 */
export async function resolveChromeTone(selection) {
  if (!selection || selection.type !== 'env') {
    return resolveChromeToneSync(selection);
  }

  if (BUILTIN_CHROME[selection.id]) {
    return BUILTIN_CHROME[selection.id];
  }

  const env = getEnvironmentById(selection.id);
  if (!env?.src) return 'dark';

  const luma = await sampleImageLuminance(env.src);
  return luma >= LIGHT_LUMA_THRESHOLD ? 'light' : 'dark';
}
