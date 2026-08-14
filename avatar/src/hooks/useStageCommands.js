import { useCallback } from 'react';
import { defaultSkinId } from '../config/avatars';
import { resolveStageCommand } from '../lib/stageCommands';

/**
 * The only place a stage action is applied, so the multi-setter sequences below
 * exist once however the request arrived (Refs #6).
 *
 * @param {Object} args
 * @param {import('../lib/stageCommands').StageCommandContext} args.context
 * @param {{ selectedAvatarId: string, hubActive: boolean }} args.current What
 * is on stage now — needed to tell a real change from a no-op.
 * @param {Object} args.setters The stage's own `useState` setters.
 * @returns {(command: string, payload?: unknown) =>
 *   import('../lib/stageCommands').StageCommandResult}
 */
export function useStageCommands({ context, current, setters }) {
  const { selectedAvatarId, hubActive } = current;
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

        case 'avatar.set': {
          // Only hide the stage when the model actually reloads. Re-selecting
          // the avatar already on it leaves modelPath alone, so VrmAvatar's
          // load effect never re-runs, `onLoaded` never fires, and the stage
          // would stay hidden for good. A Hub character is the exception: it
          // owns modelPath while active, so standing it down is a real reload.
          if (hubActive || action.avatarId !== selectedAvatarId) {
            setAvatarReady(false);
          }
          setHubActive(false);
          setSelectedAvatarId(action.avatarId);
          setSelectedSkinId(defaultSkinId);
          break;
        }

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
      selectedAvatarId,
      hubActive,
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
