import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, ChevronUp } from 'lucide-react';

export function AccordionSection({ open, onClick, label, children }) {
  return (
    <div className="accordion-section">
      <button type="button" className="accordion-section__header" onClick={onClick}>
        <span>{label}</span>
        {open ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
      </button>
      {open && <div className="accordion-section__body">{children}</div>}
    </div>
  );
}

export function Divider() {
  return <div className="panel-divider" />;
}

export function SliderRow({ label, min, max, step, value, onChange, onDoubleClick }) {
  return (
    <div className="slider-row">
      <span className="slider-row__label">{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(parseFloat(event.target.value))}
        onDoubleClick={onDoubleClick}
        className="slider-row__input"
      />
      <span className="slider-row__value">{typeof value === 'number' ? value.toFixed(2) : value}</span>
    </div>
  );
}

const SELECT_MENU_MAX_HEIGHT = 148;

/** App-themed select — portals a fixed popup so the drawer never gains scroll/width. */
export function PanelSelect({ id, value, onChange, options, placeholder = 'Select…' }) {
  const [open, setOpen] = useState(false);
  const [menuStyle, setMenuStyle] = useState(null);
  const rootRef = useRef(null);
  const triggerRef = useRef(null);
  const listRef = useRef(null);
  const listId = useId();
  const selected = options.find((option) => option.value === value);

  useLayoutEffect(() => {
    if (!open || !triggerRef.current) {
      setMenuStyle(null);
      return undefined;
    }

    const place = () => {
      const rect = triggerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom - 8;
      const spaceAbove = rect.top - 8;
      const openUp = spaceBelow < SELECT_MENU_MAX_HEIGHT && spaceAbove > spaceBelow;
      const maxHeight = Math.max(96, Math.min(SELECT_MENU_MAX_HEIGHT, openUp ? spaceAbove : spaceBelow));

      setMenuStyle({
        position: 'fixed',
        left: rect.left,
        width: rect.width,
        maxHeight,
        zIndex: 10000,
        ...(openUp
          ? { bottom: window.innerHeight - rect.top + 4, top: 'auto' }
          : { top: rect.bottom + 4, bottom: 'auto' }),
      });
    };

    place();
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, true);
    return () => {
      window.removeEventListener('resize', place);
      window.removeEventListener('scroll', place, true);
    };
  }, [open, options.length]);

  useEffect(() => {
    if (!open) return undefined;
    const onPointerDown = (event) => {
      const target = event.target;
      if (rootRef.current?.contains(target) || listRef.current?.contains(target)) return;
      setOpen(false);
    };
    const onKeyDown = (event) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const menu =
    open && menuStyle
      ? createPortal(
          <ul
            ref={listRef}
            id={listId}
            className="panel-select-menu__list"
            role="listbox"
            style={menuStyle}
            onPointerDown={(event) => {
              event.stopPropagation();
            }}
            onWheel={(event) => {
              event.stopPropagation();
            }}
          >
            {options.map((option) => {
              const active = option.value === value;
              return (
                <li key={option.value === '' ? '__empty' : option.value} role="presentation">
                  <button
                    type="button"
                    role="option"
                    aria-selected={active}
                    className={`panel-select-menu__option ${active ? 'panel-select-menu__option--active' : ''}`}
                    onPointerDown={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      onChange(option.value);
                      setOpen(false);
                    }}
                  >
                    {option.label}
                  </button>
                </li>
              );
            })}
          </ul>,
          document.body,
        )
      : null;

  return (
    <div
      ref={rootRef}
      className={`panel-select-menu ${open ? 'panel-select-menu--open' : ''}`}
    >
      <button
        ref={triggerRef}
        type="button"
        id={id}
        className="panel-select-menu__trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((prev) => !prev)}
      >
        <span>{selected?.label ?? placeholder}</span>
        <ChevronDown size={14} strokeWidth={2} />
      </button>
      {menu}
    </div>
  );
}

export function PanelShell({ title, onClose, className = '', children }) {
  return (
    <div className={`floating-panel ${className}`.trim()}>
      <div className="floating-panel__header">
        <b>{title}</b>
        <button type="button" className="floating-panel__close" onClick={onClose} aria-label="Close">
          ✕
        </button>
      </div>
      {children}
    </div>
  );
}
