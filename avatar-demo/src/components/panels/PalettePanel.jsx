import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { environments, customEnvironments, defaultColor } from '../../config/environments';
import { avatars, listSkinsForAvatar } from '../../config/avatars';
import { MiniAvatar } from '../avatar/MiniAvatar';
import { AccordionSection, Divider } from '../ui/PanelPrimitives';

export function PalettePanel({
  openAccordion,
  setOpenAccordion,
  selectedAvatarId,
  onAvatarChange,
  selectedSkinId,
  onSkinChange,
  selectedBg,
  setSelectedBg,
}) {
  const [customOpen, setCustomOpen] = useState(
    () => selectedBg.type === 'env' && selectedBg.id?.startsWith('custom-'),
  );

  const skins = listSkinsForAvatar(selectedAvatarId);
  const selectedAvatar = avatars.find((entry) => entry.id === selectedAvatarId) ?? avatars[0];

  const colorValue =
    selectedBg.type === 'color'
      ? selectedBg.value.length === 4
        ? defaultColor
        : selectedBg.value
      : defaultColor;

  const customSelected =
    selectedBg.type === 'env' && customEnvironments.some((env) => env.id === selectedBg.id);

  return (
    <>
      <AccordionSection
        open={openAccordion === 'avatars'}
        onClick={() => setOpenAccordion(openAccordion === 'avatars' ? null : 'avatars')}
        label="Avatars"
      >
        <p className="panel-note panel-note--compact">Choose a character model.</p>
        <div className="avatar-picker">
          {avatars.map((entry) => {
            const previewPath =
              entry.skins.find((skin) => skin.id === 'default')?.path ?? entry.skins[0]?.path;
            return (
              <MiniAvatar
                key={entry.id}
                modelPath={previewPath}
                selected={selectedAvatarId === entry.id}
                onClick={() => onAvatarChange(entry.id)}
              />
            );
          })}
        </div>
      </AccordionSection>

      <Divider />

      <AccordionSection
        open={openAccordion === 'skins'}
        onClick={() => setOpenAccordion(openAccordion === 'skins' ? null : 'skins')}
        label="Skins"
      >
        <p className="panel-note panel-note--compact">
          Variants for {selectedAvatar?.label ?? 'this avatar'}. Name files like{' '}
          <code>avatar1B.vrm</code> to add more.
        </p>
        {skins.length === 0 ? (
          <p className="panel-note">No skins found.</p>
        ) : (
          <div className="skin-picker">
            {skins.map((skin) => (
              <div key={skin.id} className="skin-chip">
                <MiniAvatar
                  modelPath={skin.path}
                  selected={selectedSkinId === skin.id}
                  onClick={() => onSkinChange(skin.id)}
                />
                <span className="skin-chip__label">{skin.label}</span>
              </div>
            ))}
          </div>
        )}
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

        {customEnvironments.length > 0 && (
          <div className="environment-custom">
            <button
              type="button"
              className={`environment-custom__toggle ${customOpen ? 'environment-custom__toggle--open' : ''} ${
                customSelected ? 'environment-custom__toggle--active' : ''
              }`}
              onClick={() => setCustomOpen((open) => !open)}
              aria-expanded={customOpen}
            >
              <span>
                Custom
                <span className="environment-custom__count">{customEnvironments.length}</span>
              </span>
              <ChevronDown size={14} strokeWidth={2} />
            </button>

            {customOpen && (
              <div className="environment-custom__grid">
                {customEnvironments.map((env) => (
                  <button
                    type="button"
                    key={env.id}
                    className={`background-thumb ${
                      selectedBg.type === 'env' && selectedBg.id === env.id
                        ? 'background-thumb--selected'
                        : ''
                    }`}
                    onClick={() => setSelectedBg({ type: 'env', id: env.id })}
                    title={env.label}
                  >
                    <img src={env.src} alt={env.label} loading="lazy" />
                    <span className="background-thumb__label">{env.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

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
