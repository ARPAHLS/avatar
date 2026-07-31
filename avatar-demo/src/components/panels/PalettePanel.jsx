import { environments, defaultColor } from '../../config/environments';
import { avatarModels } from '../../config/avatars';
import { MiniAvatar } from '../avatar/MiniAvatar';
import { AccordionSection, Divider } from '../ui/PanelPrimitives';

export function PalettePanel({
  openAccordion,
  setOpenAccordion,
  selectedAvatar,
  setSelectedAvatar,
  selectedBg,
  setSelectedBg,
}) {
  const colorValue =
    selectedBg.type === 'color'
      ? selectedBg.value.length === 4
        ? defaultColor
        : selectedBg.value
      : defaultColor;

  return (
    <>
      <AccordionSection
        open={openAccordion === 'avatar'}
        onClick={() => setOpenAccordion(openAccordion === 'avatar' ? null : 'avatar')}
        label="Avatar"
      >
        <div className="avatar-picker">
          {avatarModels.map((model) => (
            <MiniAvatar
              key={model.id}
              modelPath={model.path}
              selected={selectedAvatar === model.path}
              onClick={() => setSelectedAvatar(model.path)}
            />
          ))}
        </div>
      </AccordionSection>

      <Divider />

      <AccordionSection
        open={openAccordion === 'env'}
        onClick={() => setOpenAccordion(openAccordion === 'env' ? null : 'env')}
        label="Environments"
      >
        <p className="panel-note panel-note--compact">
          Pick an animated environment, a color fade, or no background.
        </p>

        <div className="environment-row">
          {environments.map((env) => (
            <button
              type="button"
              key={env.id}
              className={`background-thumb ${
                selectedBg.type === 'env' && selectedBg.id === env.id ? 'background-thumb--selected' : ''
              }`}
              onClick={() => setSelectedBg({ type: 'env', id: env.id })}
              title={env.label}
            >
              <img src={env.src} alt={env.label} />
              <span className="background-thumb__label">{env.label}</span>
            </button>
          ))}
          <button
            type="button"
            className={`background-thumb ${
              selectedBg.type === 'none' ? 'background-thumb--selected' : ''
            }`}
            onClick={() => setSelectedBg({ type: 'none' })}
            title="No background"
          >
            <span className="background-thumb__none" aria-hidden="true" />
            <span className="background-thumb__label">None</span>
          </button>
        </div>

        <div className="environment-color-row">
          <label className="environment-color-picker">
            <input
              type="color"
              value={colorValue}
              onChange={(event) => setSelectedBg({ type: 'color', value: event.target.value })}
            />
            <span>Color fade</span>
          </label>
          <button
            type="button"
            className={`panel-button environment-color-select ${
              selectedBg.type === 'color' ? 'environment-color-select--active' : ''
            }`}
            onClick={() => setSelectedBg({ type: 'color', value: colorValue })}
          >
            Use color
          </button>
        </div>

        <div className="panel-actions">
          <button
            type="button"
            className="panel-button"
            onClick={() => setSelectedBg({ type: 'color', value: defaultColor })}
          >
            Reset to Default
          </button>
        </div>
      </AccordionSection>
    </>
  );
}
