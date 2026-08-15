/**
 * Resolves a request into an action, or into the reason it cannot be honoured.
 * `useStageCommands` is the only thing that applies one.
 *
 * Free of React and asset imports so `node --test` can load it — which is also
 * why the specifiers below carry `.js`: Vite resolves either way, node only
 * with.
 */

import {
  defaultAnimationId,
  findAnimation,
  resolveAnimationId,
} from '../config/animationLookup.js';
import { normalizeEnvironmentSelection } from '../config/environmentSelection.js';

/** @typedef {import('../config/animationLookup.js').AnimationEntry} AnimationEntry */
/** @typedef {import('../config/environmentSelection.js').EnvironmentSelection} EnvironmentSelection */

/**
 * What is currently valid. All four are runtime state: a custom folder replaces
 * the animation catalog wholesale, and desktop and browser expose different
 * capture sources.
 * @typedef {Object} StageCommandContext
 * @property {AnimationEntry[]} animationCatalog
 * @property {string[]} avatarIds
 * @property {string[]} environmentIds
 * @property {string[]} audioSourceIds
 */

/**
 * `select` changes what the stage is set to and is persisted; `once` overlays a
 * single pass and leaves the selection alone.
 * @typedef {'select' | 'once'} AnimationMode
 */

/**
 * @typedef {{ kind: 'animation.play', animationId: string, mode: AnimationMode }
 *   | { kind: 'animation.stop' }
 *   | { kind: 'avatar.set', avatarId: string }
 *   | { kind: 'environment.set', selection: EnvironmentSelection }
 *   | { kind: 'audio.source', audioSourceId: string }} StageAction
 */

/**
 * @typedef {{ ok: true, action: StageAction }
 *   | { ok: false, code: StageErrorCode, error: string }} StageCommandResult
 */

/**
 * @typedef {'unknown-command' | 'bad-payload' | 'unknown-animation'
 *   | 'unknown-avatar' | 'unknown-environment' | 'unknown-audio-source'
 *   | 'not-playable-once'} StageErrorCode
 */

export const STAGE_COMMANDS = Object.freeze([
  'animation.play',
  'animation.default',
  'animation.stop',
  'avatar.set',
  'environment.set',
  'audio.source',
]);

/**
 * @param {StageErrorCode} code
 * @param {string} error
 * @returns {StageCommandResult}
 */
function fail(code, error) {
  return { ok: false, code, error };
}

/**
 * @param {unknown} payload
 * @returns {string | null}
 */
function readId(payload) {
  if (!payload || typeof payload !== 'object') return null;
  const raw = /** @type {Record<string, unknown>} */ (payload).id;
  if (typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  return trimmed === '' ? null : trimmed;
}

/**
 * Absent means `select`, so every caller written before one-shots existed keeps
 * its meaning.
 * @param {unknown} payload
 * @returns {AnimationMode | null} null when present but not a known mode
 */
function readMode(payload) {
  if (!payload || typeof payload !== 'object') return 'select';
  const raw = /** @type {Record<string, unknown>} */ (payload).mode;
  if (raw === undefined || raw === null) return 'select';
  return raw === 'select' || raw === 'once' ? raw : null;
}

/**
 * Reports acceptance only: a VRM or an environment image may still be loading
 * when this returns.
 *
 * @param {unknown} command
 * @param {unknown} payload
 * @param {StageCommandContext} context
 * @returns {StageCommandResult}
 */
export function resolveStageCommand(command, payload, context) {
  // Not `= []` defaults: those cover a missing key but not a null one, and this
  // must never throw.
  const source = /** @type {Record<string, unknown>} */ (context ?? {});
  const animationCatalog = Array.isArray(source.animationCatalog) ? source.animationCatalog : [];
  const avatarIds = Array.isArray(source.avatarIds) ? source.avatarIds : [];
  const environmentIds = Array.isArray(source.environmentIds) ? source.environmentIds : [];
  const audioSourceIds = Array.isArray(source.audioSourceIds) ? source.audioSourceIds : [];

  switch (command) {
    case 'animation.play': {
      const query = readId(payload);
      if (!query) return fail('bad-payload', 'animation.play needs an id: { "id": "vrma-03" }.');

      const mode = readMode(payload);
      if (!mode) return fail('bad-payload', 'animation.play mode must be "select" or "once".');

      // Labels too: a custom folder hashes its ids from file paths, so the
      // label is the only name a caller can be expected to know.
      const entry = findAnimation(animationCatalog, query);
      if (!entry) return fail('unknown-animation', `No animation matches "${query}".`);

      // A one-shot has to end by itself for the selection to come back, and the
      // Default sequence loops for as long as it is selected.
      if (mode === 'once' && !(entry.source === 'vrma' && entry.vrmaUrl)) {
        return fail('not-playable-once', `"${entry.label}" is not a single clip; play it with mode "select".`);
      }

      return { ok: true, action: { kind: 'animation.play', animationId: entry.id, mode } };
    }

    case 'animation.default': {
      // A custom folder has no Default sequence; fall back rather than fail.
      const animationId = resolveAnimationId(animationCatalog, defaultAnimationId);
      return { ok: true, action: { kind: 'animation.play', animationId, mode: 'select' } };
    }

    case 'animation.stop':
      // Ends a one-shot early. Cancelling something already finished is not an
      // error, so this takes no payload and cannot fail.
      return { ok: true, action: { kind: 'animation.stop' } };

    case 'avatar.set': {
      // Ids only: bundled labels are "Avatar 1"…"Avatar 3" and a folder's are
      // filenames, so matching them buys ambiguity and no expressiveness.
      const avatarId = readId(payload);
      if (!avatarId) return fail('bad-payload', 'avatar.set needs an id: { "id": "avatar2" }.');
      if (!avatarIds.includes(avatarId)) {
        return fail('unknown-avatar', `No avatar with id "${avatarId}".`);
      }

      return { ok: true, action: { kind: 'avatar.set', avatarId } };
    }

    case 'environment.set': {
      const selection = normalizeEnvironmentSelection(payload);
      if (!selection) {
        return fail(
          'bad-payload',
          'environment.set needs { "type": "env", "id": … }, { "type": "color", "value": "#rrggbb" } or { "type": "none" }.',
        );
      }
      if (selection.type === 'env' && !environmentIds.includes(selection.id)) {
        return fail('unknown-environment', `No environment with id "${selection.id}".`);
      }

      return { ok: true, action: { kind: 'environment.set', selection } };
    }

    case 'audio.source': {
      const audioSourceId = readId(payload);
      if (!audioSourceId) {
        return fail('bad-payload', 'audio.source needs an id: { "id": "microphone" }.');
      }
      if (!audioSourceIds.includes(audioSourceId)) {
        return fail('unknown-audio-source', `No audio source "${audioSourceId}" in this runtime.`);
      }

      return { ok: true, action: { kind: 'audio.source', audioSourceId } };
    }

    default:
      return fail(
        'unknown-command',
        `Unknown command "${String(command)}". Known: ${STAGE_COMMANDS.join(', ')}.`,
      );
  }
}
