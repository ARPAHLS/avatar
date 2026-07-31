import { Cog } from 'lucide-react';
import { STAGE } from '../../config/defaults';
import { getHoloFieldStyle, isHoloFieldHidden } from '../../lib/holoField';
import { isDesktopMode } from '../../lib/desktopMode';
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
  onAnimationChange,
  overlayMode,
  onOverlayModeToggle,
  onCloseWindow,
  lipSyncLive,
  children,
}) {
  const { barHeight, canvasOverflowTop, canvasOverflowSide } = STAGE;
  const desktopMode = isDesktopMode();
  const holoStyle = getHoloFieldStyle(environmentSelection);

  function toggleMenu(event) {
    event.stopPropagation();
    onCommandMenuChange(!commandMenuOpen);
  }

  return (
    <div
      className="avatar-stage-shell"
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
              <Cog size={14} strokeWidth={2} />
            </button>
          </div>
        </div>

        <BarCommandMenu
          open={commandMenuOpen}
          openPanel={openPanel}
          animationId={animationId}
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
