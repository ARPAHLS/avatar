import { useCallback, useRef } from 'react';

const VISEMES = ['aa', 'ee', 'ih', 'oh', 'ou'];

/**
 * Amplitude-driven viseme cycling adapted for browser use.
 * Inspired by Persona's approach — maps audio level to mouth shapes without phoneme detection.
 *
 * @param {import('@pixiv/three-vrm').VRM | null} vrm
 */
export function useAmplitudeLipSync(vrm) {
  const smoothed = useRef(0);
  const phase = useRef(0);

  return useCallback(
    (delta, level, speaking) => {
      const manager = vrm?.expressionManager;
      if (!manager) return;

      const audible = speaking && level > 0.008;
      const normalized = audible ? Math.min(1, Math.max(0, level) * 2.8) : 0;
      const smoothing = 1 - Math.exp(-delta / (normalized > smoothed.current ? 0.055 : 0.1));
      smoothed.current += (normalized - smoothed.current) * smoothing;
      phase.current += delta * (8 + smoothed.current * 9);
      const active = Math.floor(phase.current) % VISEMES.length;

      for (let index = 0; index < VISEMES.length; index += 1) {
        const shape = Math.max(0, 1 - Math.abs(index - active) * 0.72);
        const flutter = 0.74 + Math.sin(phase.current * 5.7 + index) * 0.18;
        manager.setValue(VISEMES[index], Math.min(0.62, smoothed.current * shape * flutter));
      }
    },
    [vrm],
  );
}

/**
 * @param {import('@pixiv/three-vrm').VRM | null} vrm
 */
export function resetLipSyncExpressions(vrm) {
  const manager = vrm?.expressionManager;
  if (!manager) return;
  for (const viseme of VISEMES) {
    manager.setValue(viseme, 0);
  }
}
