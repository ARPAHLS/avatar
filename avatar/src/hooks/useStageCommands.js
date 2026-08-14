import { useCallback } from 'react';
import { defaultSkinId } from '../config/avatars';
import { resolveStageCommand } from '../lib/stageCommands';

/**
 * The only place a stage command is applied. Every trigger surface — the
 * picker, the bar menu, and later hotkeys and the local bus (Refs #6) — goes
 * through `runCommand`, so the multi-setter sequences below exist once.
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
          // Selecting the clip that is already playing has to restart it, and
          // the id alone cannot say that — VrmAvatar's effect keys off this
          // counter for exactly that case. Dropping it makes a repeated
          // command look like it did nothing.
          setAnimationRequest((count) => count + 1);
          break;

        case 'avatar.set':
          // Order matters: hiding the stage first is what stops the old model
          // showing through the load. Skipping it leaves the whole UI at
          // opacity 0 when the path does not change and `onLoaded` never
          // re-fires.
          setAvatarReady(false);
          // A VRoid Hub character outranks the catalog while it is active, so
          // it has to stand down or the selection would not take effect.
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
