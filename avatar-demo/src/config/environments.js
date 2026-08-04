import starsGif from '../assets/environments/stars.gif';
import codeGif from '../assets/environments/code.gif';
import bloomGif from '../assets/environments/bloom.gif';

/** @typedef {{ strong: string, soft: string, highlight: string }} HoloGlow */

/** Default lavender fade used for Color mode. */
export const defaultHoloGlow = {
  strong: 'rgba(210, 185, 255, 0.62)',
  soft: 'rgba(175, 145, 230, 0.28)',
  highlight: 'rgba(255, 255, 255, 0.14)',
};

export const defaultColor = '#e9e1fa';

const customGlow = {
  strong: 'rgba(190, 175, 230, 0.52)',
  soft: 'rgba(150, 130, 200, 0.24)',
  highlight: 'rgba(255, 255, 255, 0.12)',
};

/**
 * @typedef {Object} EnvironmentEntry
 * @property {string} id
 * @property {string} label
 * @property {string} src Bundled GIF URL (Vite-resolved)
 * @property {HoloGlow} glow
 * @property {boolean} [custom]
 */

/** @type {EnvironmentEntry[]} */
export const environments = [
  {
    id: 'stars',
    label: 'Stars',
    src: starsGif,
    glow: {
      strong: 'rgba(130, 150, 230, 0.58)',
      soft: 'rgba(85, 105, 190, 0.26)',
      highlight: 'rgba(200, 210, 255, 0.12)',
    },
  },
  {
    id: 'code',
    label: 'Code',
    src: codeGif,
    glow: {
      strong: 'rgba(100, 220, 160, 0.45)',
      soft: 'rgba(40, 120, 80, 0.22)',
      highlight: 'rgba(180, 255, 210, 0.1)',
    },
  },
  {
    id: 'bloom',
    label: 'Bloom',
    src: bloomGif,
    glow: {
      strong: 'rgba(255, 190, 230, 0.58)',
      soft: 'rgba(210, 160, 245, 0.28)',
      highlight: 'rgba(255, 255, 255, 0.2)',
    },
  },
];

const customModules = import.meta.glob('../assets/environments/custom/*.{gif,png,jpg,jpeg}', {
  eager: true,
  import: 'default',
});

/** @param {string} path */
function labelFromPath(path) {
  const file = path.split('/').pop() ?? path;
  const base = file.replace(/\.[^.]+$/, '');
  const cleaned = base.replace(/[_-]+/g, ' ').trim();
  if (cleaned.length > 18) return `${cleaned.slice(0, 16)}…`;
  return cleaned || 'Custom';
}

/** @type {EnvironmentEntry[]} */
export const customEnvironments = Object.entries(customModules)
  .map(([path, src]) => {
    const file = path.split('/').pop() ?? path;
    const id = `custom-${file.replace(/\.[^.]+$/, '').replace(/[^a-zA-Z0-9_-]/g, '-')}`;
    return {
      id,
      label: labelFromPath(path),
      src: /** @type {string} */ (src),
      glow: customGlow,
      custom: true,
    };
  })
  .sort((a, b) => a.label.localeCompare(b.label));

/** Runtime custom envs from a user-picked folder (Electron). */
let libraryCustomEnvironments = /** @type {EnvironmentEntry[]} */ ([]);

/**
 * @param {EnvironmentEntry[]} entries
 */
export function setLibraryCustomEnvironments(entries) {
  libraryCustomEnvironments = Array.isArray(entries) ? entries : [];
}

/** @returns {EnvironmentEntry[]} */
export function getLibraryCustomEnvironments() {
  return libraryCustomEnvironments;
}

/** @param {string} id */
export function getEnvironmentById(id) {
  return (
    environments.find((entry) => entry.id === id) ??
    customEnvironments.find((entry) => entry.id === id) ??
    libraryCustomEnvironments.find((entry) => entry.id === id) ??
    environments[0]
  );
}

/**
 * @typedef {{ type: 'env', id: string } | { type: 'color', value: string } | { type: 'none' }} EnvironmentSelection
 */

/**
 * @param {EnvironmentSelection} selection
 * @returns {{ glow: HoloGlow | null, imageUrl: string | null, hidden: boolean }}
 */
export function resolveHoloTheme(selection) {
  if (selection.type === 'none') {
    return { glow: null, imageUrl: null, hidden: true };
  }

  if (selection.type === 'env') {
    const env = getEnvironmentById(selection.id);
    return { glow: env.glow, imageUrl: env.src, hidden: false };
  }

  const hex = selection.value.length === 4 ? defaultColor : selection.value;
  return { glow: glowFromHex(hex), imageUrl: null, hidden: false };
}

/** @param {string} hex */
function glowFromHex(hex) {
  const rgb = hexToRgb(hex);
  if (!rgb) return defaultHoloGlow;
  const { r, g, b } = rgb;
  return {
    strong: `rgba(${r}, ${g}, ${b}, 0.58)`,
    soft: `rgba(${r}, ${g}, ${b}, 0.26)`,
    highlight: 'rgba(255, 255, 255, 0.14)',
  };
}

/** @param {string} hex */
function hexToRgb(hex) {
  const normalized = hex.replace('#', '');
  if (normalized.length !== 6) return null;
  const value = Number.parseInt(normalized, 16);
  return {
    r: (value >> 16) & 255,
    g: (value >> 8) & 255,
    b: value & 255,
  };
}
