import * as THREE from 'three';

/** @typedef {'loop' | 'once'} AnimationPlayback */

/**
 * @param {THREE.AnimationAction} action
 * @param {AnimationPlayback} playback
 */
export function configureAnimationAction(action, playback) {
  if (playback === 'once') {
    action.setLoop(THREE.LoopOnce, 1);
    action.clampWhenFinished = true;
  } else {
    action.setLoop(THREE.LoopRepeat, Infinity);
    action.clampWhenFinished = false;
  }
  return action;
}

/**
 * @param {THREE.AnimationAction | null} previous
 * @param {THREE.AnimationAction} next
 * @param {number} duration
 */
export function crossFadeAnimationActions(previous, next, duration) {
  previous?.fadeOut(duration);
  next.setEffectiveWeight(1).fadeIn(duration).play();
}
