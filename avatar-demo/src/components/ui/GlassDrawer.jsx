import { X } from 'lucide-react';

const TITLES = {
  palette: 'Appearance',
  voice: 'Voice',
  camera: 'Camera & Lighting',
  settings: 'Settings',
};

export function GlassDrawer({ open, panelId, onClose, drawerRef, children }) {
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
      <div className="glass-drawer__body">{children}</div>
    </aside>
  );
}
