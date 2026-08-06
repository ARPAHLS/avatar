import { useCallback, useRef } from 'react';

const MIN_INTERVAL = 2;
const MAX_INTERVAL = 6;
const DURATION = 0.24;

function nextInterval() {
  return MIN_INTERVAL + Math.random() * (MAX_INTERVAL - MIN_INTERVAL);
}

/**
 * @param {import('@pixiv/three-vrm').VRM | null} vrm
 */
export function useBlink(vrm) {
  const next = useRef(nextInterval());
  const progress = useRef(0);

  return useCallback(
    (delta) => {
      const manager = vrm?.expressionManager;
      if (!manager) return;

      if (progress.current > 0) {
        progress.current += delta / DURATION;
        if (progress.current >= 1) {
          progress.current = 0;
          next.current = nextInterval();
          manager.setValue('blink', 0);
        } else {
          manager.setValue('blink', Math.sin(progress.current * Math.PI));
        }
        return;
      }

      next.current -= delta;
      if (next.current <= 0) progress.current = Number.EPSILON;
    },
    [vrm],
  );
}
