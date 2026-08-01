import { Layers, Pin } from 'lucide-react';
import { getDesktopApi } from '../../lib/desktopMode';

/** 3×3 screen positions — row-major, top → bottom, left → right. */
const SNAP_CELLS = [
  { id: 'top-left', label: 'Top left' },
  { id: 'top-center', label: 'Top center' },
  { id: 'top-right', label: 'Top right' },
  { id: 'center-left', label: 'Center left' },
  { id: 'center', label: 'Center' },
  { id: 'center-right', label: 'Center right' },
  { id: 'bottom-left', label: 'Bottom left' },
  { id: 'bottom-center', label: 'Bottom center' },
  { id: 'bottom-right', label: 'Bottom right' },
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

      <p className="panel-note panel-note--compact">Snap to screen</p>
      <div className="desktop-snap-pad" role="group" aria-label="Snap to screen position">
        {SNAP_CELLS.map((cell) => (
          <button
            key={cell.id}
            type="button"
            className="desktop-snap-pad__cell"
            aria-label={cell.label}
            title={cell.label}
            onClick={() => handleSnap(cell.id)}
          />
        ))}
      </div>
    </>
  );
}
