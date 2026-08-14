/**
 * The stage's command vocabulary: one validated description of every state
 * change a trigger surface is allowed to ask for.
 *
 * The picker is not the only thing that drives the avatar any more — hotkeys,
 * a local bus and keyword matching all want the same actions (Refs #6). Each of
 * them arrives with input nobody has checked, and each of them needs an answer,
 * so this module resolves a request into an action without touching state, and
 * `useStageCommands` is the only thing that applies one.
 *
 * Kept free of React and of asset imports so `node --test` can load it. Import
 * specifiers carry their `.js` extension for the same reason: Vite resolves
 * them either way, node only with.
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
 * @typedef {Object} StageCommandContext
 * @property {AnimationEntry[]} animationCatalog The live catalog — a custom
 * folder replaces the bundled list wholesale, so ids are not fixed.
 * @property {string[]} avatarIds
 * @property {string[]} environmentIds Every id `getEnvironmentById` can answer.
 * @property {string[]} audioSourceIds Runtime-dependent: desktop and browser
 * offer different capture sources.
 */

/**
 * @typedef {{ kind: 'animation.play', animationId: string }
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
 *   | 'unknown-avatar' | 'unknown-environment' | 'unknown-audio-source'} StageErrorCode
 */

/** Every command a trigger surface may send. */
export const STAGE_COMMANDS = Object.freeze([
  'animation.play',
  'animation.default',
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
 * Validate a request and say what it means, or why it cannot be honoured.
 * Nothing here mutates, so a caller can resolve first and decide separately
 * whether to apply — which is what makes an error reportable to an agent
 * instead of a silent no-op.
 *
 * Resolution is synchronous and says only that the request was *accepted*: a
 * VRM or an environment image may still be loading when this returns.
 *
 * @param {unknown} command
 * @param {unknown} payload
 * @param {StageCommandContext} context
 * @returns {StageCommandResult}
 */
export function resolveStageCommand(command, payload, context) {
  const {
    animationCatalog = [],
    avatarIds = [],
    environmentIds = [],
    audioSourceIds = [],
  } = context ?? {};

  switch (command) {
    case 'animation.play': {
      const query = readId(payload);
      if (!query) return fail('bad-payload', 'animation.play needs an id: { "id": "vrma-03" }.');

      // Matches a label too, so a caller can ask for "Peace Sign" without
      // knowing that a custom folder hashes its ids from file paths.
      const entry = findAnimation(animationCatalog, query);
      if (!entry) return fail('unknown-animation', `No animation matches "${query}".`);

      return { ok: true, action: { kind: 'animation.play', animationId: entry.id } };
    }

    case 'animation.default': {
      // A custom folder has no bundled Default sequence, so this lands on that
      // catalog's first selectable clip rather than failing.
      const animationId = resolveAnimationId(animationCatalog, defaultAnimationId);
      return { ok: true, action: { kind: 'animation.play', animationId } };
    }

    case 'avatar.set': {
      // Ids only. Bundled labels are just "Avatar 1"…"Avatar 3", and a custom
      // folder's labels are filenames that can collide, so matching them would
      // buy ambiguity and no expressiveness.
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
        // Desktop and browser expose different sources, so this is a normal
        // miss rather than a malformed request.
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
