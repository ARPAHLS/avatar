import { useEffect, useRef, useState } from 'react';
import { Cog } from 'lucide-react';
import { STAGE } from '../../config/defaults';
import { resolveChromeTone, resolveChromeToneSync, toneFromLuma } from '../../lib/chromeTone';
import {
  getHoloFieldStyle,
  getHoloImageUrl,
  isHoloFieldHidden,
  isHoloFieldPending,
} from '../../lib/holoField';
import { getDesktopApi, isDesktopMode } from '../../lib/desktopMode';
import { BarCommandMenu } from '../ui/BarCommandMenu';
import { WindowScaleMenu } from '../ui/WindowScaleMenu';

export function AvatarStageShell({
  environmentSelection,
  commandMenuOpen,
  onCommandMenuChange,
  commandMenuRef,
  scaleMenuOpen,
  onScaleMenuChange,
  scaleMenuRef,
  windowScale,
  onWindowScaleChange,
  onOpenPanel,
  openPanel,
  animationId,
  animationCatalog,
  onAnimationChange,
  overlayMode,
  onOverlayModeToggle,
  onCloseWindow,
  lipSyncLive,
  children,
}) {
  const { barHeight, canvasOverflowTop, canvasOverflowSide } = STAGE;
  const desktopMode = isDesktopMode();
  // A custom-folder environment is read from disk only once selected, so its
  // image arrives a moment after the selection does. Rather than blank the
  // stage for that moment, hold the last background that was ready — glow
  // included, so the whole field changes at once instead of in two steps.
  const holoPending = isHoloFieldPending(environmentSelection);
  const lastReadyHoloStyle = useRef(null);
  const resolvedHoloStyle = getHoloFieldStyle(environmentSelection);
  if (!holoPending) lastReadyHoloStyle.current = resolvedHoloStyle;
  const holoStyle = holoPending ? (lastReadyHoloStyle.current ?? resolvedHoloStyle) : resolvedHoloStyle;

  // Tone is sampled from the image, which resolves after the selection for the
  // same reason — so the selection alone is not enough to know when to sample.
  const holoImageUrl = getHoloImageUrl(environmentSelection);
  const [chromeTone, setChromeTone] = useState(() => resolveChromeToneSync(environmentSelection));

  useEffect(() => {
    let cancelled = false;
    const desktopApi = getDesktopApi();
    const useDesktopSample = desktopMode && overlayMode && typeof desktopApi?.sampleDesktopLuma === 'function';

    async function applyEnvironmentTone() {
      const sync = resolveChromeToneSync(environmentSelection);
      if (!cancelled) setChromeTone(sync);
      const tone = await resolveChromeTone(environmentSelection);
      if (!cancelled) setChromeTone(tone);
    }

    async function applyDesktopTone() {
      try {
        const luma = await desktopApi.sampleDesktopLuma();
        if (cancelled || typeof luma !== 'number') return;
        setChromeTone((previous) => {
          const next = toneFromLuma(luma, previous);
          return next === previous ? previous : next;
        });
      } catch {
        // keep last tone
      }
    }

    if (!useDesktopSample) {
      // Hold the current tone while the image is still being read: there is
      // nothing to sample yet, and resolving now would flip the bar to its
      // default and back a moment later.
      if (!holoPending) void applyEnvironmentTone();
      return () => {
        cancelled = true;
      };
    }

    // Overlay: sample on demand only (no continuous screen capture).
    // CSS crossfades chrome vars (~0.85s) when tone flips.
    void applyDesktopTone();

    const unsubSettled = desktopApi.onPositionSettled?.(() => {
      void applyDesktopTone();
    });

    function onFocus() {
      void applyDesktopTone();
    }
    window.addEventListener('focus', onFocus);

    return () => {
      cancelled = true;
      unsubSettled?.();
      window.removeEventListener('focus', onFocus);
    };
  }, [environmentSelection, holoImageUrl, holoPending, desktopMode, overlayMode]);

  function toggleMenu(event) {
    event.stopPropagation();
    onCommandMenuChange(!commandMenuOpen);
  }

  return (
    <div
      className="avatar-stage-shell"
      data-chrome={chromeTone}
      style={{
        '--stage-bar-height': `${barHeight}px`,
        '--stage-canvas-overflow-top': `${canvasOverflowTop}px`,
        '--stage-canvas-overflow-side': `${canvasOverflowSide}px`,
      }}
    >
      <div
        className={`avatar-holo-field ${isHoloFieldHidden(environmentSelection) ? 'avatar-holo-field--none' : ''}`}
        style={holoStyle}
        aria-hidden="true"
      >
        <div className="avatar-holo-field__fade" />
        <div className="avatar-holo-field__theme" />
      </div>

      <div className="avatar-stage-canvas">{children}</div>

      <div className="avatar-glass-bar-wrap" ref={commandMenuRef}>
        <div className={`avatar-glass-bar ${desktopMode ? 'avatar-glass-bar--desktop' : ''}`}>
          <div className="avatar-glass-bar__line" aria-hidden="true" />

          <div className="avatar-glass-bar__end">
            <WindowScaleMenu
              open={scaleMenuOpen}
              scale={windowScale}
              onOpenChange={onScaleMenuChange}
              onSelectScale={onWindowScaleChange}
              menuRef={scaleMenuRef}
            />
            {lipSyncLive && (
              <span className="avatar-glass-bar__live-dot" title="Lip sync active" aria-label="Lip sync active" />
            )}
            <button
              type="button"
              className={`avatar-glass-bar__gear ${commandMenuOpen ? 'avatar-glass-bar__gear--open' : ''}`}
              aria-label="Menu"
              aria-expanded={commandMenuOpen}
              onClick={toggleMenu}
            >
              <Cog size={14} strokeWidth={2.25} />
            </button>
          </div>
        </div>

        <BarCommandMenu
          open={commandMenuOpen}
          openPanel={openPanel}
          animationId={animationId}
          animations={animationCatalog}
          overlayMode={overlayMode}
          onOpenPanel={onOpenPanel}
          onAnimationChange={onAnimationChange}
          onOverlayModeToggle={onOverlayModeToggle}
          onCloseWindow={onCloseWindow}
          onCloseMenu={() => onCommandMenuChange(false)}
        />
      </div>
    </div>
  );
}
