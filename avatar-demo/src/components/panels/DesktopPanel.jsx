import { Layers, Pin } from 'lucide-react';
import { getDesktopApi } from '../../lib/desktopMode';

const SNAP_OPTIONS = [
  { id: 'bottom-left', label: 'Bottom left' },
  { id: 'bottom-right', label: 'Bottom right' },
  { id: 'bottom-center', label: 'Bottom center' },
  { id: 'top-left', label: 'Top left' },
  { id: 'top-right', label: 'Top right' },
];

export function DesktopPanel({ overlayMode, onOverlayModeToggle }) {
  const desktop = getDesktopApi();

  function handleSnap(corner) {
    void desktop?.snapToCorner?.(corner);
  }

  return (
    <>
      <div className="desktop-mode-pill">
        {overlayMode ? <Pin size={14} /> : <Layers size={14} />}
        <span>{overlayMode ? 'Overlay — transparent & on top' : 'Windowed — layered'}</span>
      </div>

      <p className="panel-note">
        Drag the glass bar to reposition. Use the pin/layers button on the bar for a quick mode switch,
        or toggle below.
      </p>

      <div className="desktop-toggle-row">
        <span>Overlay mode</span>
        <input type="checkbox" checked={overlayMode} onChange={() => onOverlayModeToggle()} />
      </div>

      <p className="panel-note panel-note--compact">Snap to screen edge</p>
      <div className="desktop-snap-grid">
        {SNAP_OPTIONS.map((option) => (
          <button
            key={option.id}
            type="button"
            className="panel-button"
            onClick={() => handleSnap(option.id)}
          >
            {option.label}
          </button>
        ))}
      </div>
    </>
  );
}
