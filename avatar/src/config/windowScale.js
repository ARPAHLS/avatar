/** Base Electron window size at ×1 (must match electron/main.cjs). */
export const DESKTOP_WINDOW_BASE = {
  width: 420,
  height: 560,
};

/** @typedef {0.5 | 1 | 2} WindowScaleFactor */

/** @type {{ factor: WindowScaleFactor, label: string }[]} */
export const windowScalePresets = [
  { factor: 0.5, label: '×0.5' },
  { factor: 1, label: '×1' },
  { factor: 2, label: '×2' },
];

export const defaultWindowScale = 1;

/** @param {number} factor */
export function normalizeWindowScale(factor) {
  if (factor === 0.5 || factor === 2) return factor;
  return 1;
}

/** @param {WindowScaleFactor} factor */
export function getScaledWindowSize(factor) {
  return {
    width: Math.round(DESKTOP_WINDOW_BASE.width * factor),
    height: Math.round(DESKTOP_WINDOW_BASE.height * factor),
  };
}
