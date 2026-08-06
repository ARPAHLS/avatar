import { useEffect, useState } from 'react';
import {
  AppWindow,
  Camera,
  ChevronLeft,
  Clapperboard,
  Mic,
  Palette,
  Pin,
  Settings,
  X,
} from 'lucide-react';
import { getSelectableAnimations } from '../../config/animations';
import { isDesktopMode } from '../../lib/desktopMode';

const ICON = 15;
const STROKE = 2;

function CommandButton({ label, pressed, onClick, children, variant = 'default', style }) {
  return (
    <button
      type="button"
      className={`avatar-command-menu__btn ${variant === 'close' ? 'avatar-command-menu__btn--close' : ''} ${pressed ? 'avatar-command-menu__btn--active' : ''}`}
      aria-label={label}
      aria-pressed={pressed}
      onClick={onClick}
      style={style}
    >
      {children}
      <span className="avatar-command-menu__tooltip">{label}</span>
    </button>
  );
}

export function BarCommandMenu({
  open,
  openPanel,
  animationId,
  overlayMode,
  onOpenPanel,
  onAnimationChange,
  onOverlayModeToggle,
  onCloseWindow,
  onCloseMenu,
}) {
  const [view, setView] = useState('main');
  const desktopMode = isDesktopMode();
  const animations = getSelectableAnimations();

  useEffect(() => {
    if (!open) setView('main');
  }, [open]);

  if (!open) return null;

  function openDrawer(panelId) {
    onOpenPanel(panelId);
    onCloseMenu();
  }

  function runAndClose(action) {
    action();
    onCloseMenu();
  }

  if (view === 'animations') {
    return (
      <div className="avatar-command-menu avatar-command-menu--animations" role="menu">
        <CommandButton
          label="Back"
          onClick={() => setView('main')}
          style={{ animationDelay: '0ms' }}
        >
          <ChevronLeft size={ICON} strokeWidth={STROKE} />
        </CommandButton>
        {animations.map((entry, index) => (
          <button
            key={entry.id}
            type="button"
            role="menuitemradio"
            aria-checked={animationId === entry.id}
            className={`avatar-command-menu__anim ${animationId === entry.id ? 'avatar-command-menu__anim--active' : ''}`}
            style={{ animationDelay: `${(index + 1) * 35}ms` }}
            onClick={() => runAndClose(() => onAnimationChange(entry.id))}
          >
            {entry.label}
          </button>
        ))}
      </div>
    );
  }

  const pinLabel = overlayMode ? 'Pinned (Switch to Windowed)' : 'Windowed (Switch to Pinned)';

  const items = [
    {
      label: 'Appearance',
      icon: <Palette size={ICON} strokeWidth={STROKE} />,
      pressed: openPanel === 'palette',
      onClick: () => openDrawer('palette'),
    },
    {
      label: 'Voice',
      icon: <Mic size={ICON} strokeWidth={STROKE} />,
      pressed: openPanel === 'voice',
      onClick: () => openDrawer('voice'),
    },
    {
      label: 'Camera & Lighting',
      icon: <Camera size={ICON} strokeWidth={STROKE} />,
      pressed: openPanel === 'camera',
      onClick: () => openDrawer('camera'),
    },
    {
      label: 'Animations',
      icon: <Clapperboard size={ICON} strokeWidth={STROKE} />,
      pressed: false,
      onClick: () => setView('animations'),
    },
  ];

  if (desktopMode) {
    items.push({
      label: pinLabel,
      icon: overlayMode ? (
        <Pin size={ICON} strokeWidth={STROKE} />
      ) : (
        <AppWindow size={ICON} strokeWidth={STROKE} />
      ),
      pressed: overlayMode,
      onClick: () => onOverlayModeToggle(),
    });
  }

  items.push({
    label: 'Settings',
    icon: <Settings size={ICON} strokeWidth={STROKE} />,
    pressed: openPanel === 'settings',
    onClick: () => openDrawer('settings'),
  });

  if (desktopMode) {
    items.push({
      label: 'Close',
      icon: <X size={ICON} strokeWidth={STROKE} />,
      pressed: false,
      variant: 'close',
      onClick: () => runAndClose(onCloseWindow),
    });
  }

  return (
    <div className="avatar-command-menu" role="menu">
      {items.map((item, index) => (
        <CommandButton
          key={item.label}
          label={item.label}
          pressed={item.pressed}
          variant={item.variant}
          style={{ animationDelay: `${index * 40}ms` }}
          onClick={item.onClick}
        >
          {item.icon}
        </CommandButton>
      ))}
    </div>
  );
}
