import { useCallback } from 'react';
import { defaultSkinId } from '../config/avatars';
import { resolveStageCommand } from '../lib/stageCommands';

/**
 * The only place a stage action is applied, so the multi-setter sequences below
 * exist once however the request arrived (Refs #6).
 *
 * @param {Object} args
 * @param {import('../lib/stageCommands').StageCommandContext} args.context
 * @param {Object} args.setters The stage's own `useState` setters.
 * @returns {(command: string, payload?: unknown) =>
 *   import('../lib/stageCommands').StageCommandResult}
 */
export function useStageCommands({ context, setters }) {
  const {
    setAnimationId,
    setAnimationRequest,
    setAvatarReady,
    setHubActive,
    setSelectedAvatarId,
    setSelectedSkinId,
    setSelectedBg,
    setAudioSourceId,
  } = setters;

  return useCallback(
    (command, payload) => {
      const result = resolveStageCommand(command, payload, context);
      if (!result.ok) return result;

      const { action } = result;

      switch (action.kind) {
        case 'animation.play':
          setAnimationId(action.animationId);
          // Re-selecting the clip already playing has to restart it, which the
          // id alone cannot express; VrmAvatar's effect keys off this counter.
          setAnimationRequest((count) => count + 1);
          break;

        case 'avatar.set':
          // Precedes the id change so the outgoing model does not show through
          // the load; the stage comes back on VrmAvatar's `onLoaded`.
          setAvatarReady(false);
          // An active Hub character outranks the catalog, so it stands down.
          setHubActive(false);
          setSelectedAvatarId(action.avatarId);
          setSelectedSkinId(defaultSkinId);
          break;

        case 'environment.set':
          setSelectedBg(action.selection);
          break;

        case 'audio.source':
          setAudioSourceId(action.audioSourceId);
          break;

        default:
          break;
      }

      return result;
    },
    [
      context,
      setAnimationId,
      setAnimationRequest,
      setAvatarReady,
      setHubActive,
      setSelectedAvatarId,
      setSelectedSkinId,
      setSelectedBg,
      setAudioSourceId,
    ],
  );
}
