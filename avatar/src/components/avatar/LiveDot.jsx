import { memo, useLayoutEffect, useRef } from 'react';
import { liveDotLabel, normalizeLiveLevel } from '../../lib/liveDot';

/**
 * Glass-bar lip-sync indicator (#42).
 *
 * Discrete mode comes from React (waiting / live / error). While `live`,
 * amplitude is written straight onto the span via rAF + a shared level ref so
 * the bar does not need a dedicated setState path for loudness.
 *
 * @param {Object} props
 * @param {import('../../lib/liveDot').LiveDotMode | null} props.mode
 * @param {{ current: number } | null} [props.levelRef]
 */
export const LiveDot = memo(function LiveDot({ mode, levelRef = null }) {
  const nodeRef = useRef(null);

  useLayoutEffect(() => {
    const node = nodeRef.current;
    if (!node) return undefined;

    if (mode !== 'live' || !levelRef) {
      node.style.setProperty('--live-level', '0');
      return undefined;
    }

    let raf = 0;
    let lastLabel = '';
    const tick = () => {
      const next = normalizeLiveLevel(levelRef.current);
      node.style.setProperty('--live-level', next.toFixed(3));
      const label = liveDotLabel('live', next);
      if (label !== lastLabel) {
        lastLabel = label;
        node.title = label;
        node.setAttribute('aria-label', label);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [mode, levelRef]);

  if (!mode) return null;

  const label = liveDotLabel(mode, 0);

  return (
    <span
      ref={nodeRef}
      className={`avatar-glass-bar__live-dot avatar-glass-bar__live-dot--${mode}`}
      title={label}
      aria-label={label}
    />
  );
});
