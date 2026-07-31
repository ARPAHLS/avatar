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
  const avatarPositionRef = useRef(avatarPosition);
  const avatarRotationRef = useRef(avatarRotation);

  avatarPositionRef.current = avatarPosition;
  avatarRotationRef.current = avatarRotation;

  const { play, playSequence, cancel, returnToRest, update: updateMixer } = useVrmAnimation(vrm);
  const updateLipSync = useAmplitudeLipSync(vrm);
  const updateBlink = useBlink(vrm);

  useEffect(() => {
    let disposed = false;

    loader.load(modelPath, (gltf) => {
      if (disposed) return;
      const vrmData = gltf.userData.vrm;
      VRMUtils.combineSkeletons(vrmData.scene);
      VRMUtils.rotateVRM0(vrmData);

      const position = avatarPositionRef.current ?? defaultAvatar.position;
      const rotation = avatarRotationRef.current ?? defaultAvatar.rotation;
      vrmData.scene.position.set(...position);
      vrmData.scene.rotation.set(...rotation);

      group.current?.add(vrmData.scene);
      setVrm(vrmData);
      onLoaded?.();
    });

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

    if (avatarPosition) {
      vrm.scene.position.set(...avatarPosition);
    }
    if (avatarRotation) {
      vrm.scene.rotation.set(...avatarRotation);
    }

    updateMixer(delta);
    updateBlink(delta);

    if (lipSyncEnabled) {
      updateLipSync(delta, audioLevel, speaking);
    } else {
      resetLipSyncExpressions(vrm);
    }

    vrm.update(delta);
  });

  return <group ref={group} />;
}
