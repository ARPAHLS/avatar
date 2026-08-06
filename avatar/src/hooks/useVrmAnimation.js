import { useCallback, useEffect, useRef } from 'react';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import {
  VRMAnimationLoaderPlugin,
  createVRMAnimationClip,
} from '@pixiv/three-vrm-animation';
import * as THREE from 'three';
import {
  configureAnimationAction,
  crossFadeAnimationActions,
} from '../lib/vrmAnimationAction';

const DEFAULT_FADE = 0.65;

/**
 * @param {import('@pixiv/three-vrm').VRM | null} vrm
 */
export function useVrmAnimation(vrm) {
  const mixer = useRef(null);
  const currentAction = useRef(null);
  const cache = useRef(new Map());
  const requestGeneration = useRef(0);
  const fadeTimer = useRef(null);

  useEffect(() => {
    if (!vrm) return undefined;

    const animationMixer = new THREE.AnimationMixer(vrm.scene);
    mixer.current = animationMixer;

    return () => {
      if (fadeTimer.current) clearTimeout(fadeTimer.current);
      animationMixer.stopAllAction();
      mixer.current = null;
      currentAction.current = null;
    };
  }, [vrm]);

  const loadAnimation = useCallback(async (url) => {
    const cached = cache.current.get(url);
    if (cached) return cached;

    const loader = new GLTFLoader();
    loader.register((parser) => new VRMAnimationLoaderPlugin(parser));
    const gltf = await loader.loadAsync(url);
    const animation = gltf.userData.vrmAnimations?.[0];
    if (!animation) throw new Error(`No VRM animation found in ${url}`);

    cache.current.set(url, animation);
    return animation;
  }, []);

  const stop = useCallback((fadeSeconds = DEFAULT_FADE, onSettled) => {
    if (fadeTimer.current) {
      clearTimeout(fadeTimer.current);
      fadeTimer.current = null;
    }

    const action = currentAction.current;
    if (!action) {
      onSettled?.();
      return;
    }

    action.fadeOut(fadeSeconds);
    currentAction.current = null;

    if (onSettled) {
      fadeTimer.current = setTimeout(onSettled, fadeSeconds * 1000 + 20);
    }
  }, []);

  const play = useCallback(
    async (url, playback = 'loop', onComplete, sequenceGeneration) => {
      if (!vrm || !mixer.current || !url) {
        stop(undefined, onComplete);
        return;
      }

      const generation = sequenceGeneration ?? ++requestGeneration.current;

      try {
        const animation = await loadAnimation(url);
        if (generation !== requestGeneration.current || !mixer.current) return;

        const action = mixer.current.clipAction(createVRMAnimationClip(animation, vrm));
        action.reset();
        configureAnimationAction(action, playback);

        if (playback === 'once' && onComplete) {
          const handleFinished = ({ action: finishedAction }) => {
            if (finishedAction !== action) return;
            if (generation !== requestGeneration.current) return;
            mixer.current?.removeEventListener('finished', handleFinished);
            onComplete();
          };
          mixer.current.addEventListener('finished', handleFinished);
        }

        crossFadeAnimationActions(currentAction.current, action, DEFAULT_FADE);
        currentAction.current = action;
      } catch (error) {
        console.warn('[avatar] VRMA load failed', error);
        if (generation === requestGeneration.current) {
          onComplete?.();
        }
      }
    },
    [loadAnimation, stop, vrm],
  );

  const cancel = useCallback(() => {
    requestGeneration.current += 1;
    if (fadeTimer.current) {
      clearTimeout(fadeTimer.current);
      fadeTimer.current = null;
    }
    currentAction.current?.stop();
    currentAction.current = null;
  }, []);

  const playSequence = useCallback(
    (introIds, loopIds, resolveUrl) => {
      if (!vrm || !mixer.current) return cancel;

      const generation = ++requestGeneration.current;
      const introUrls = introIds.map(resolveUrl).filter(Boolean);
      const loopUrls = loopIds.map(resolveUrl).filter(Boolean);
      if (introUrls.length === 0 && loopUrls.length === 0) return cancel;

      const playStep = (urls, index, onFinished) => {
        if (generation !== requestGeneration.current) return;
        if (index >= urls.length) {
          onFinished?.();
          return;
        }

        void play(
          urls[index],
          'once',
          () => {
            if (generation !== requestGeneration.current) return;
            playStep(urls, index + 1, onFinished);
          },
          generation,
        );
      };

      const runLoop = () => {
        if (generation !== requestGeneration.current || loopUrls.length === 0) return;
        playStep(loopUrls, 0, runLoop);
      };

      playStep(introUrls, 0, runLoop);
      return cancel;
    },
    [cancel, play, vrm],
  );

  const returnToRest = useCallback(() => {
    stop(DEFAULT_FADE);
  }, [stop]);

  const update = useCallback((delta) => {
    mixer.current?.update(delta);
  }, []);

  return {
    play,
    playSequence,
    cancel,
    stop,
    returnToRest,
    update,
    isPlaying: () => Boolean(currentAction.current),
  };
}
