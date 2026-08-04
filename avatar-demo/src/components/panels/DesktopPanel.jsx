import { useEffect, useState } from 'react';
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
  const [selectedSnap, setSelectedSnap] = useState(null);

  useEffect(() => {
    if (!desktop?.onManualMoved) return undefined;
    return desktop.onManualMoved(() => {
      setSelectedSnap(null);
    });
  }, [desktop]);

  async function handleSnap(corner) {
    setSelectedSnap(corner);
    const applied = await desktop?.snapToCorner?.(corner);
    if (applied && applied !== corner) {
      setSelectedSnap(applied);
    }
  }

  return (
    <>
      <div className="desktop-mode-pill">
        {overlayMode ? <Pin size={14} /> : <Layers size={14} />}
        <span>{overlayMode ? 'Overlay — transparent & on top' : 'Windowed — layered'}</span>
      </div>

      <p className="panel-note panel-note--compact">
        Drag the glass bar to move. Pin/layers on the bar toggles overlay mode.
      </p>

      <div className="desktop-toggle-row">
        <span className="settings-section-title">Overlay mode</span>
        <input
          type="checkbox"
          className="panel-checkbox"
          checked={overlayMode}
          onChange={() => onOverlayModeToggle()}
        />
      </div>

      <div className="panel-divider" />

      <p className="settings-section-title">Snap to screen</p>
      <div className="desktop-snap-pad" role="group" aria-label="Snap to screen position">
        {SNAP_CELLS.map((cell) => {
          const active = selectedSnap === cell.id;
          return (
            <button
              key={cell.id}
              type="button"
              className={`desktop-snap-pad__cell ${active ? 'desktop-snap-pad__cell--active' : ''}`}
              aria-label={cell.label}
              aria-pressed={active}
              title={cell.label}
              onClick={() => void handleSnap(cell.id)}
            />
          );
        })}
      </div>
    </>
  );
}
