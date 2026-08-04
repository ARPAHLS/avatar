import { useEffect, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { VRMLoaderPlugin, VRMUtils } from '@pixiv/three-vrm';
import { defaultAvatar } from '../../config/defaults';
import { getAnimationById, resolveVrmaUrl } from '../../config/animations';
import { useAmplitudeLipSync, resetLipSyncExpressions } from '../../hooks/useAmplitudeLipSync';
import { useBlink } from '../../hooks/useBlink';
import { useVrmAnimation } from '../../hooks/useVrmAnimation';

const loader = new GLTFLoader();
loader.register((parser) => new VRMLoaderPlugin(parser));

export function VrmAvatar({
  modelPath,
  animationId = 'rest',
  animationRequest = 0,
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

  const { play, playSequence, cancel, returnToRest, update: updateMixer } = useVrmAnimation(vrm);
  const updateLipSync = useAmplitudeLipSync(vrm);
  const updateBlink = useBlink(vrm);

  useEffect(() => {
    let disposed = false;

    if (!modelPath) {
      setVrm(null);
      return undefined;
    }

    loader.load(
      modelPath,
      (gltf) => {
        if (disposed) return;
        const vrmData = gltf.userData.vrm;
        VRMUtils.combineSkeletons(vrmData.scene);
        // Owns vrm.scene.rotation outright: it flips VRM 0.0 models (which face
        // -Z) by 180° and leaves VRM 1.0 (already +Z) alone. Nothing else may
        // write vrm.scene's transform, or that per-model correction is lost and
        // one of the two spec versions ends up facing away from the camera —
        // the user's framing transform lives on the wrapper group below instead.
        VRMUtils.rotateVRM0(vrmData);

        group.current?.add(vrmData.scene);
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
      if (group.current) {
        while (group.current.children.length > 0) {
          group.current.remove(group.current.children[0]);
        }
      }
    };
  }, [modelPath, onLoaded]);

  useEffect(() => {
    if (!vrm) return undefined;

    const entry = getAnimationById(animationId);
    activeAnimationRef.current = animationId;

    if (entry.source === 'sequence') {
      const stopSequence = playSequence(entry.intro ?? [], entry.sequence ?? [], resolveVrmaUrl);
      return () => stopSequence?.();
    }

    if (entry.source === 'vrma' && entry.vrmaUrl) {
      const playback = entry.playback ?? 'loop';
      void play(entry.vrmaUrl, playback);
      return undefined;
    }

    returnToRest();
    return undefined;
  }, [animationId, animationRequest, cancel, play, playSequence, returnToRest, vrm]);

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
