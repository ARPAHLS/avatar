import { FolderOpen } from 'lucide-react';
import { PanelSelect } from '../ui/PanelPrimitives';

const SOURCE_OPTIONS = [
  { value: 'default', label: 'Default' },
  { value: 'custom', label: 'Custom' },
];

const ANIMATION_OPTIONS = [
  { value: 'default', label: 'Default' },
  { value: 'custom', label: 'Custom (coming soon)', disabled: true },
];

/**
 * @param {{
 *   directories: {
 *     avatars: { mode: string, path: string | null },
 *     animations: { mode: string, path: string | null },
 *     environments: { mode: string, path: string | null },
 *   },
 *   onChange: (next: object) => void,
 *   onBrowse: (kind: 'avatars' | 'environments') => void | Promise<void>,
 *   onOpenFolder: (kind: 'avatars' | 'environments') => void | Promise<void>,
 *   onClear: (kind: 'avatars' | 'environments') => void,
 *   notice?: string | null,
 * }} props
 */
export function DirectoriesPanel({
  directories,
  onBrowse,
  onOpenFolder,
  onClear,
  notice = null,
}) {
  function setMode(kind, mode) {
    if (kind === 'animations') return;
    if (mode === 'default') {
      onClear(kind);
      return;
    }
    void onBrowse(kind);
  }

  return (
    <div className="directories-panel">
      <p className="panel-note panel-note--compact">
        Point AVATAR at your own folders. Avatars replace the built-in list; environments stay additive
        beside Stars / Code / Bloom.
      </p>

      {notice && <p className="panel-note directories-panel__notice">{notice}</p>}

      <DirectoryRow
        label="Avatars"
        hint=".vrm files only"
        source={directories.avatars}
        onModeChange={(mode) => setMode('avatars', mode)}
        onBrowse={() => void onBrowse('avatars')}
        onOpen={() => void onOpenFolder('avatars')}
        onClear={() => onClear('avatars')}
      />

      <DirectoryRow
        label="Animations"
        hint=".vrma — coming soon"
        source={directories.animations}
        options={ANIMATION_OPTIONS}
        disabled
        comingSoon
      />

      <DirectoryRow
        label="Environments"
        hint=".gif / .png / .jpg / .jpeg"
        source={directories.environments}
        onModeChange={(mode) => setMode('environments', mode)}
        onBrowse={() => void onBrowse('environments')}
        onOpen={() => void onOpenFolder('environments')}
        onClear={() => onClear('environments')}
      />
    </div>
  );
}

function DirectoryRow({
  label,
  hint,
  source,
  onModeChange,
  onBrowse,
  onOpen,
  onClear,
  options = SOURCE_OPTIONS,
  disabled = false,
  comingSoon = false,
}) {
  const isCustom = source?.mode === 'custom' && Boolean(source?.path);

  return (
    <div className={`directories-row ${disabled ? 'directories-row--disabled' : ''}`}>
      <div className="directories-row__head">
        <span className="directories-row__label">{label}</span>
        <span className="directories-row__hint">{hint}</span>
      </div>

      <PanelSelect
        value={comingSoon ? 'default' : source?.mode === 'custom' && source?.path ? 'custom' : 'default'}
        disabled={disabled || comingSoon}
        onChange={(value) => {
          if (disabled || comingSoon) return;
          onModeChange?.(value);
        }}
        options={options.map((option) => ({
          value: option.value,
          label: option.label,
          disabled: Boolean(option.disabled),
        }))}
        placeholder="Source"
      />

      {comingSoon && (
        <p className="panel-note panel-note--compact directories-row__soon">Custom animations — coming soon</p>
      )}

      {!comingSoon && isCustom && (
        <>
          <p className="panel-note panel-note--compact panel-note--mono directories-row__path" title={source.path}>
            {source.path}
          </p>
          <div className="panel-actions directories-row__actions">
            <button type="button" className="panel-button" onClick={onBrowse}>
              Change folder
            </button>
            <button type="button" className="panel-button" onClick={onOpen} title="Open folder">
              <FolderOpen size={15} />
              Open
            </button>
            <button type="button" className="panel-button panel-button--danger" onClick={onClear}>
              Reset
            </button>
          </div>
        </>
      )}
    </div>
  );
}
