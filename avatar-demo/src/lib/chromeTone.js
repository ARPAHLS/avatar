import { defaultColor, getEnvironmentById, resolveHoloTheme } from '../config/environments';

/** @typedef {'dark' | 'light'} ChromeTone */

const IMAGE_LUMA_CACHE = new Map();
const LIGHT_LUMA_THRESHOLD = 0.62;

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

/** @param {string} color */
export function cssColorLuminance(color) {
  const rgba = color.match(/rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)/i);
  if (rgba) {
    const r = Number(rgba[1]) / 255;
    const g = Number(rgba[2]) / 255;
    const b = Number(rgba[3]) / 255;
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }
  if (color.startsWith('#')) return hexLuminance(color);
  return 0.5;
}

/**
 * Sync best-effort tone from selection (color / glow / none).
 * @param {import('../config/environments').EnvironmentSelection} selection
 * @returns {ChromeTone}
 */
export function resolveChromeToneSync(selection) {
  if (selection.type === 'none') {
    // Transparent / no holo — silver stays visible on both light and dark desktops.
    return 'light';
  }

  if (selection.type === 'color') {
    const hex = selection.value.length === 4 ? defaultColor : selection.value;
    return hexLuminance(hex) >= LIGHT_LUMA_THRESHOLD ? 'light' : 'dark';
  }

  const env = getEnvironmentById(selection.id);
  if (IMAGE_LUMA_CACHE.has(env.src)) {
    return IMAGE_LUMA_CACHE.get(env.src) >= LIGHT_LUMA_THRESHOLD ? 'light' : 'dark';
  }

  const { glow } = resolveHoloTheme(selection);
  if (!glow) return 'dark';
  return cssColorLuminance(glow.strong) >= LIGHT_LUMA_THRESHOLD ? 'light' : 'dark';
}

/**
 * Sample average luminance of an image URL (cached).
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
        const size = 24;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) {
          resolve(0.5);
          return;
        }
        ctx.drawImage(img, 0, 0, size, size);
        const { data } = ctx.getImageData(0, 0, size, size);
        let total = 0;
        let count = 0;
        for (let i = 0; i < data.length; i += 4) {
          const a = data[i + 3] / 255;
          if (a < 0.15) continue;
          const r = data[i] / 255;
          const g = data[i + 1] / 255;
          const b = data[i + 2] / 255;
          total += (0.2126 * r + 0.7152 * g + 0.0722 * b) * a;
          count += a;
        }
        const luma = count > 0 ? total / count : 0.5;
        IMAGE_LUMA_CACHE.set(src, luma);
        resolve(luma);
      } catch {
        resolve(0.5);
      }
    };
    img.onerror = () => resolve(0.5);
    img.src = src;
  });
}

/**
 * @param {import('../config/environments').EnvironmentSelection} selection
 * @returns {Promise<ChromeTone>}
 */
export async function resolveChromeTone(selection) {
  if (selection.type !== 'env') {
    return resolveChromeToneSync(selection);
  }

  const env = getEnvironmentById(selection.id);
  const luma = await sampleImageLuminance(env.src);
  return luma >= LIGHT_LUMA_THRESHOLD ? 'light' : 'dark';
}
