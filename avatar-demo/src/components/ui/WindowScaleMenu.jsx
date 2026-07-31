import { Scaling } from 'lucide-react';
import { windowScalePresets } from '../../config/windowScale';
import { isDesktopMode } from '../../lib/desktopMode';

export function WindowScaleMenu({ open, scale, onOpenChange, onSelectScale, menuRef }) {
  const desktopMode = isDesktopMode();

  if (!desktopMode) return null;

  function toggleMenu(event) {
    event.stopPropagation();
    onOpenChange(!open);
  }

  function pickScale(factor) {
    onSelectScale(factor);
    onOpenChange(false);
  }

  return (
    <div className="avatar-window-scale-wrap" ref={menuRef}>
      <button
        type="button"
        className={`avatar-glass-bar__scale ${open ? 'avatar-glass-bar__scale--open' : ''}`}
        aria-label="Window size"
        aria-expanded={open}
        title="Window size"
        onClick={toggleMenu}
      >
        <Scaling size={14} strokeWidth={2} />
      </button>

      {open && (
        <div className="avatar-window-scale-menu" role="menu">
          {windowScalePresets.map((preset, index) => (
            <button
              key={preset.factor}
              type="button"
              role="menuitemradio"
              aria-checked={scale === preset.factor}
              className={`avatar-window-scale-menu__btn ${
                scale === preset.factor ? 'avatar-window-scale-menu__btn--active' : ''
              }`}
              style={{ animationDelay: `${index * 35}ms` }}
              onClick={() => pickScale(preset.factor)}
            >
              {preset.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
