import { createDefaultAgentBus, normalizeAgentBus } from './agentBus';
import { defaultAnimationId } from './animations';
import { getDefaultAudioSourceId } from './audioSources';
import { defaultAvatarId, defaultSkinId } from './avatars';
import { defaultAvatar, defaultCamera, defaultLight } from './defaults';
import { defaultColor, normalizeEnvironmentSelection } from './environmentSelection';
import { defaultWindowScale, normalizeWindowScale } from './windowScale';
import { createEmptyDeck, normalizeMotionDeck } from '../motion-deck/motionDeck';

// 2: avatarTransform.rotation is the user's framing rotation only. Version 1
// seeded it from a default that had the VRM 0.0 180° facing flip baked in, so
// a v1 value carries that flip and must have it removed on read — otherwise
// it now compounds with the per-model flip and every avatar faces backwards.
// 3: adds the agentBus section. Nothing to migrate — an older file simply has
// no section, and an absent one means the bus is off.
export const SETTINGS_VERSION = 3;
export const LOCAL_SETTINGS_KEY = 'avatar.config.yaml';

/** @returns {{ mode: 'default' | 'custom', path: string | null }} */
export function createDefaultDirectorySource() {
  return { mode: 'default', path: null };
}

/** @returns {{ avatars: ReturnType<typeof createDefaultDirectorySource>, animations: ReturnType<typeof createDefaultDirectorySource>, environments: ReturnType<typeof createDefaultDirectorySource> }} */
export function createDefaultDirectories() {
  return {
    avatars: createDefaultDirectorySource(),
    animations: createDefaultDirectorySource(),
    environments: createDefaultDirectorySource(),
  };
}

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
    directories: createDefaultDirectories(),
    motionDeck: createEmptyDeck(),
    agentBus: createDefaultAgentBus(),
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

/**
 * Strip the VRM 0.0 facing flip that version 1 stored inside the user's own
 * rotation. Deliberately narrow: it only fires for a file that both declares
 * a pre-2 version and actually carries a stored rotation, so a fresh config
 * (which already uses the new flip-free default) and a live snapshot (which
 * passes the current version) are never shifted.
 * @param {number[]} rotation
 * @param {unknown} rawVersion
 * @param {unknown} rawRotation
 */
function migrateAvatarRotation(rotation, rawVersion, rawRotation) {
  const version = Number(rawVersion);
  if (!Number.isFinite(version) || version < 1 || version >= 2) return rotation;
  if (!Array.isArray(rawRotation)) return rotation;
  return [rotation[0], rotation[1] - Math.PI, rotation[2]];
}

/**
 * The UI currently has no avatar rotation controls; the only "rotated to back"
 * state we see in practice is stale persisted data from older builds. Normalize
 * that known-facing inversion to the default forward-facing orientation.
 * @param {number[]} rotation
 */
function normalizeFacingRotation(rotation) {
  const epsilon = 0.01;
  const y = rotation[1];
  const isInvertedY = Math.abs(Math.abs(y) - Math.PI) < epsilon;
  const hasNoOtherTilt = Math.abs(rotation[0]) < epsilon && Math.abs(rotation[2]) < epsilon;
  if (isInvertedY && hasNoOtherTilt) {
    return [...defaultAvatar.rotation];
  }
  return rotation;
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
 * @returns {ReturnType<typeof createDefaultDirectorySource>}
 */
function normalizeDirectorySource(raw) {
  const defaults = createDefaultDirectorySource();
  if (!raw || typeof raw !== 'object') return defaults;
  const data = /** @type {Record<string, unknown>} */ (raw);
  const mode = data.mode === 'custom' ? 'custom' : 'default';
  const pathValue = typeof data.path === 'string' && data.path.trim() !== '' ? data.path.trim() : null;
  if (mode === 'custom' && pathValue) {
    return { mode: 'custom', path: pathValue };
  }
  return defaults;
}

/**
 * @param {unknown} raw
 * @returns {ReturnType<typeof createDefaultDirectories>}
 */
function normalizeDirectories(raw) {
  const defaults = createDefaultDirectories();
  if (!raw || typeof raw !== 'object') return defaults;
  const data = /** @type {Record<string, unknown>} */ (raw);
  return {
    avatars: normalizeDirectorySource(data.avatars),
    animations: normalizeDirectorySource(data.animations),
    environments: normalizeDirectorySource(data.environments),
  };
}

/**
 * @param {unknown} raw
 * @returns {ReturnType<typeof createDefaultUserSettings>}
 */
export function normalizeUserSettings(raw) {
  const defaults = createDefaultUserSettings();
  if (!raw || typeof raw !== 'object') return defaults;

  const data = /** @type {Record<string, unknown>} */ (raw);
  // Same validator the stage uses, so config.yaml and a runtime selection
  // cannot disagree about what is usable.
  const environment = normalizeEnvironmentSelection(data.environment) ?? defaults.environment;

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
    // Skins UI removed; always the default skin for path resolution.
    skinId: defaultSkinId,
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
      rotation: normalizeFacingRotation(
        migrateAvatarRotation(
          asNumberArray(avatarRaw.rotation, defaults.avatarTransform.rotation),
          data.version,
          avatarRaw.rotation,
        ),
      ),
    },
    audioSourceId: asString(data.audioSourceId, defaults.audioSourceId),
    windowSourceId: typeof data.windowSourceId === 'string' ? data.windowSourceId : null,
    overlayMode: data.overlayMode !== false,
    windowScale: normalizeWindowScale(asNumber(data.windowScale, defaults.windowScale)),
    directories: normalizeDirectories(data.directories),
    // Shape only: cards are deliberately not checked against the animation
    // catalog. See src/motion-deck/motionDeck.js.
    motionDeck: normalizeMotionDeck(data.motionDeck),
    agentBus: normalizeAgentBus(data.agentBus),
  };
}

/**
 * Build a persistable snapshot from live stage state.
 * @param {object} state
 */
export function snapshotUserSettings(state) {
  return normalizeUserSettings({
    // Live state is already in the current schema — say so explicitly, so the
    // rotation migration can never mistake a save for a legacy read and shift
    // the value again on every write.
    version: SETTINGS_VERSION,
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
    directories: state.directories,
    motionDeck: state.motionDeck,
    agentBus: state.agentBus,
  });
}
