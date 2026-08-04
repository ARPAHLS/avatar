import { useLayoutEffect, useRef } from 'react';
import { X } from 'lucide-react';

const TITLES = {
  palette: 'Appearance',
  voice: 'Voice',
  camera: 'Camera & Lighting',
  settings: 'Settings',
};

export function GlassDrawer({ open, panelId, onClose, drawerRef, children }) {
  const bodyRef = useRef(null);

  // Electron drag-region parents often drop wheel events (same reason
  // PalettePanel's environment list drives scrollTop directly); without
  // this, any panel whose content is taller than the drawer — like Settings
  // once VRoid Hub was added — is unreachably clipped instead of scrollable.
  useLayoutEffect(() => {
    const scrollEl = bodyRef.current;
    if (!open || !scrollEl) return undefined;

    const onWheel = (event) => {
      if (scrollEl.scrollHeight <= scrollEl.clientHeight + 1) return;
      scrollEl.scrollTop += event.deltaY;
      event.preventDefault();
      event.stopPropagation();
    };

    scrollEl.addEventListener('wheel', onWheel, { passive: false });
    return () => scrollEl.removeEventListener('wheel', onWheel);
  }, [open, panelId, children]);

  if (!panelId) return null;

  return (
    <aside
      ref={drawerRef}
      className={`glass-drawer ${open ? 'glass-drawer--open' : ''}`}
      aria-hidden={!open}
    >
      <div className="glass-drawer__header">
        <h2 className="glass-drawer__title">{TITLES[panelId] ?? 'Panel'}</h2>
        <button type="button" className="glass-drawer__close" onClick={onClose} aria-label="Close">
          <X size={16} strokeWidth={2} />
        </button>
      </div>
      <div className="glass-drawer__body" ref={bodyRef}>
        {children}
      </div>
    </aside>
  );
}
