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
