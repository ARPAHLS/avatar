import { useEffect, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { VRMLoaderPlugin, VRMUtils } from '@pixiv/three-vrm';
import { defaultAvatar } from '../../config/defaults';
import {
  animationCatalog as bundledAnimations,
  createVrmaResolver,
  findAnimation,
  getAnimationById,
} from '../../config/animations';
import { useAmplitudeLipSync, resetLipSyncExpressions } from '../../hooks/useAmplitudeLipSync';
import { useBlink } from '../../hooks/useBlink';
import { useVrmAnimation } from '../../hooks/useVrmAnimation';

const loader = new GLTFLoader();
loader.register((parser) => new VRMLoaderPlugin(parser));

export function VrmAvatar({
  modelPath,
  animationId = 'rest',
  animationCatalog = bundledAnimations,
  animationRequest = 0,
  motionOverlay = null,
  onMotionOverlayEnd,
  avatarPosition,
  avatarRotation,
  audioLevel = 0,
  lipSyncEnabled = false,
  speaking = false,
  onLoaded,
}) {
  const group = useRef(null);
  const [vrm, setVrm] = useState(null);
  const activeAnimationRef = useRef(animationId);
  // What the selection was when a one-shot took the stage, so the effect can
  // tell "the gesture ended" from "the selection changed" once it clears.
  const resumeRef = useRef(null);
  const overlayId = motionOverlay?.animationId ?? null;
  // Read only by the effect's dependency list: it is what re-fires the same clip.
  const overlayToken = motionOverlay?.token ?? 0;

  const { play, playSequence, cancel, returnToRest, update: updateMixer } = useVrmAnimation(vrm);
  const updateLipSync = useAmplitudeLipSync(vrm);
  const updateBlink = useBlink(vrm);

  useEffect(() => {
    let disposed = false;
    let loaded = null;

    if (!modelPath) {
      setVrm(null);
      return undefined;
    }

    // Captured once so the cleanup detaches from the same group this run
    // attached to, even if the ref has been repointed by the time it fires.
    const container = group.current;

    loader.load(
      modelPath,
      (gltf) => {
        const vrmData = gltf.userData.vrm;
        if (disposed) {
          // Unmounted mid-parse: this model was never attached, so the cleanup
          // below has already run and nothing else will ever free it.
          VRMUtils.deepDispose(vrmData.scene);
          return;
        }
        VRMUtils.combineSkeletons(vrmData.scene);
        // Owns vrm.scene.rotation outright: it flips VRM 0.0 models (which face
        // -Z) by 180° and leaves VRM 1.0 (already +Z) alone. Nothing else may
        // write vrm.scene's transform, or that per-model correction is lost and
        // one of the two spec versions ends up facing away from the camera —
        // the user's framing transform lives on the wrapper group below instead.
        VRMUtils.rotateVRM0(vrmData);

        loaded = vrmData;
        container?.add(vrmData.scene);
        setVrm(vrmData);
        onLoaded?.();
      },
      undefined,
      () => {
        // Keep the shell usable if a library/bundled file fails to parse.
        if (!disposed) onLoaded?.();
      },
    );

    return () => {
      disposed = true;
      setVrm(null);
      if (container) {
        while (container.children.length > 0) {
          container.remove(container.children[0]);
        }
      }
      // Detaching a scene leaves its geometries, materials and textures on the
      // GPU. Nothing else holds a reference once this effect re-runs, so every
      // avatar swap used to strand a whole model's worth of VRAM.
      if (loaded) VRMUtils.deepDispose(loaded.scene);
    };
  }, [modelPath, onLoaded]);

  useEffect(() => {
    if (!vrm) return undefined;

    if (overlayId) {
      // Set before the bail-out below: the previous run's cleanup has already
      // cancelled the sequence either way, so both paths are a resume.
      resumeRef.current = { animationId, animationRequest };

      // Exact, unlike the selection below: `getAnimationById` falls back to the
      // first clip, and a gesture should end rather than become another one.
      const overlayEntry = findAnimation(animationCatalog, overlayId);
      if (overlayEntry?.source !== 'vrma' || !overlayEntry.vrmaUrl) {
        onMotionOverlayEnd?.();
        return undefined;
      }

      void play(overlayEntry.vrmaUrl, 'once', () => onMotionOverlayEnd?.());
      return undefined;
    }

    // A pick made while a gesture was running is a fresh start, not a resume.
    const resume = resumeRef.current;
    resumeRef.current = null;
    const resuming =
      resume?.animationId === animationId && resume?.animationRequest === animationRequest;

    const entry = getAnimationById(animationId, animationCatalog);
    activeAnimationRef.current = animationId;

    if (entry.source === 'sequence') {
      const stopSequence = playSequence(
        // The intro is a greeting. Playing it every time a gesture hands the
        // stage back would have the avatar say hello after each hotkey.
        resuming ? [] : (entry.intro ?? []),
        entry.sequence ?? [],
        createVrmaResolver(animationCatalog),
      );
      return () => stopSequence?.();
    }

    if (entry.source === 'vrma' && entry.vrmaUrl) {
      const playback = entry.playback ?? 'loop';
      void play(entry.vrmaUrl, playback);
      return undefined;
    }

    returnToRest();
    return undefined;
  }, [
    animationCatalog,
    animationId,
    animationRequest,
    cancel,
    onMotionOverlayEnd,
    overlayId,
    overlayToken,
    play,
    playSequence,
    returnToRest,
    vrm,
  ]);

  useFrame((_, delta) => {
    if (!vrm) return;

    updateMixer(delta);
    updateBlink(delta);

    if (lipSyncEnabled) {
      updateLipSync(delta, audioLevel, speaking);
    } else {
      resetLipSyncExpressions(vrm);
    }

    vrm.update(delta);
  });

  // The user's framing transform belongs here, not on vrm.scene, so it can
  // never clobber rotateVRM0's per-spec-version facing correction. Declaring
  // it as props also means a settings change (or the async settings hydrate
  // completing after the model has already loaded) reapplies on its own.
  return (
    <group
      ref={group}
      position={avatarPosition ?? defaultAvatar.position}
      rotation={avatarRotation ?? defaultAvatar.rotation}
    />
  );
}
