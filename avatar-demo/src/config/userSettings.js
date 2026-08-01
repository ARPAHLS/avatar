import { defaultAnimationId } from './animations';
import { getDefaultAudioSourceId } from './audioSources';
import { defaultAvatarId, defaultSkinId } from './avatars';
import { defaultAvatar, defaultCamera, defaultLight } from './defaults';
import { defaultColor } from './environments';
import { defaultWindowScale, normalizeWindowScale } from './windowScale';

export const SETTINGS_VERSION = 1;
export const LOCAL_SETTINGS_KEY = 'avatar.config.yaml';

/** @returns {object} */
export function createDefaultUserSettings() {
  return {
    version: SETTINGS_VERSION,
    avatarId: defaultAvatarId,
    skinId: defaultSkinId,
    animationId: defaultAnimationId,
    environment: { type: 'color', value: defaultColor },
    camera: {
      position: [...defaultCamera.position],
      lookAt: [...defaultCamera.lookAt],
      fov: defaultCamera.fov,
    },
    light: {
      intensity: defaultLight.intensity,
      color: defaultLight.color,
      position: [...defaultLight.position],
    },
    avatarTransform: {
      position: [...defaultAvatar.position],
      rotation: [...defaultAvatar.rotation],
    },
    audioSourceId: getDefaultAudioSourceId(),
    windowSourceId: null,
    overlayMode: true,
    windowScale: defaultWindowScale,
  };
}

/** @param {unknown} value */
function asNumberArray(value, fallback) {
  if (!Array.isArray(value) || value.length !== fallback.length) return [...fallback];
  return value.map((entry, index) => {
    const num = Number(entry);
    return Number.isFinite(num) ? num : fallback[index];
  });
}

/** @param {unknown} value */
function asNumber(value, fallback) {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

/** @param {unknown} value */
function asString(value, fallback) {
  return typeof value === 'string' && value.length > 0 ? value : fallback;
}

/**
 * @param {unknown} raw
 * @returns {ReturnType<typeof createDefaultUserSettings>}
 */
export function normalizeUserSettings(raw) {
  const defaults = createDefaultUserSettings();
  if (!raw || typeof raw !== 'object') return defaults;

  const data = /** @type {Record<string, unknown>} */ (raw);
  const envRaw = data.environment && typeof data.environment === 'object'
    ? /** @type {Record<string, unknown>} */ (data.environment)
    : null;

  let environment = defaults.environment;
  if (envRaw) {
    const type = asString(envRaw.type, 'color');
    if (type === 'none') {
      environment = { type: 'none' };
    } else if (type === 'env') {
      environment = { type: 'env', id: asString(envRaw.id, 'stars') };
    } else if (type === 'color') {
      environment = { type: 'color', value: asString(envRaw.value, defaultColor) };
    }
  }

  const cameraRaw = data.camera && typeof data.camera === 'object'
    ? /** @type {Record<string, unknown>} */ (data.camera)
    : {};
  const lightRaw = data.light && typeof data.light === 'object'
    ? /** @type {Record<string, unknown>} */ (data.light)
    : {};
  const avatarRaw = data.avatarTransform && typeof data.avatarTransform === 'object'
    ? /** @type {Record<string, unknown>} */ (data.avatarTransform)
    : {};

  return {
    version: SETTINGS_VERSION,
    avatarId: asString(data.avatarId, defaults.avatarId),
    skinId: asString(data.skinId, defaults.skinId),
    animationId: asString(data.animationId, defaults.animationId),
    environment,
    camera: {
      position: asNumberArray(cameraRaw.position, defaults.camera.position),
      lookAt: asNumberArray(cameraRaw.lookAt, defaults.camera.lookAt),
      fov: asNumber(cameraRaw.fov, defaults.camera.fov),
    },
    light: {
      intensity: asNumber(lightRaw.intensity, defaults.light.intensity),
      color: asString(lightRaw.color, defaults.light.color),
      position: asNumberArray(lightRaw.position, defaults.light.position),
    },
    avatarTransform: {
      position: asNumberArray(avatarRaw.position, defaults.avatarTransform.position),
      rotation: asNumberArray(avatarRaw.rotation, defaults.avatarTransform.rotation),
    },
    audioSourceId: asString(data.audioSourceId, defaults.audioSourceId),
    windowSourceId: typeof data.windowSourceId === 'string' ? data.windowSourceId : null,
    overlayMode: data.overlayMode !== false,
    windowScale: normalizeWindowScale(asNumber(data.windowScale, defaults.windowScale)),
  };
}

/**
 * Build a persistable snapshot from live stage state.
 * @param {object} state
 */
export function snapshotUserSettings(state) {
  return normalizeUserSettings({
    avatarId: state.avatarId,
    skinId: state.skinId,
    animationId: state.animationId,
    environment: state.environment,
    camera: state.camera,
    light: state.light,
    avatarTransform: state.avatarTransform,
    audioSourceId: state.audioSourceId,
    windowSourceId: state.windowSourceId ?? null,
    overlayMode: state.overlayMode,
    windowScale: state.windowScale,
  });
}
