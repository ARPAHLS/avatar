import { useLayoutEffect } from 'react';
import { containNestedWheel } from './containNestedWheel.js';

/**
 * While the pointer is over `hostRef`, wheel moves `scrollerRef` (or the host
 * itself when `scrollerRef` is omitted) until that scroller hits an edge —
 * same Electron/drag-region pattern as PalettePanel's environment list, with
 * edge release so GlassDrawer can keep scrolling the settings body.
 *
 * @param {import('react').RefObject<HTMLElement | null>} hostRef
 * @param {import('react').RefObject<HTMLElement | null>} [scrollerRef]
 * @param {boolean} [enabled=true]
 */
export function useContainNestedWheel(hostRef, scrollerRef, enabled = true) {
  useLayoutEffect(() => {
    if (!enabled) return undefined;
    const host = hostRef.current;
    if (!host) return undefined;

    const onWheel = (event) => {
      const scroller = scrollerRef?.current ?? host;
      containNestedWheel(event, scroller);
    };

    host.addEventListener('wheel', onWheel, { passive: false });
    return () => host.removeEventListener('wheel', onWheel);
  }, [enabled, hostRef, scrollerRef]);
}
