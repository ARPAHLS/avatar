import { useEffect, useState } from 'react';
import { getAudioSourceOptions } from '../../config/audioSources';
import { getDesktopApi } from '../../lib/desktopMode';
import { PanelSelect } from '../ui/PanelPrimitives';

export function VoicePanel({
  audioSourceId,
  onAudioSourceChange,
  setAudioFile,
  windowSourceId,
  setWindowSourceId,
  audioStatus,
  audioError,
  onRestartAudio,
}) {
  const [windowSources, setWindowSources] = useState([]);
  const audioSourceOptions = getAudioSourceOptions();
  const desktopApi = getDesktopApi();

  useEffect(() => {
    if (audioSourceId !== 'window' || !desktopApi?.getDesktopSources) return;
    void desktopApi.getDesktopSources(['window', 'screen']).then(setWindowSources);
  }, [audioSourceId, desktopApi]);

  const sourceOptions = audioSourceOptions.map((option) => ({
    value: option.id,
    label: option.label,
  }));

  const windowOptions = [
    { value: '', label: 'Select a window…' },
    ...windowSources.map((source) => ({ value: source.id, label: source.name })),
  ];

  return (
    <>
      <p className="panel-note">
        {desktopApi
          ? 'Device output captures all PC audio automatically. Pick a window when you only want one app (Chrome, Discord, etc.).'
          : 'Choose an audio source to drive real-time lip sync. Tab capture works best for AI assistants or media in the browser.'}
      </p>

      <label className="field-label" htmlFor="audio-source-select">
        Audio source
      </label>
      <PanelSelect
        id="audio-source-select"
        value={audioSourceId}
        onChange={onAudioSourceChange}
        options={sourceOptions}
      />
      <p className="panel-hint">
        {audioSourceOptions.find((option) => option.id === audioSourceId)?.description}
      </p>

      {audioSourceId === 'window' && (
        <>
          <label className="field-label" htmlFor="window-source-select">
            Window or screen
          </label>
          <PanelSelect
            id="window-source-select"
            value={windowSourceId ?? ''}
            onChange={(next) => setWindowSourceId(next || null)}
            options={windowOptions}
            placeholder="Select a window…"
          />
        </>
      )}

      {audioSourceId === 'file' && (
        <div className="file-picker-row">
          <input
            type="file"
            accept="audio/*"
            onChange={(event) => setAudioFile(event.target.files?.[0] ?? null)}
          />
        </div>
      )}

      <div className="voice-status-row">
        <span className={`voice-status voice-status--${audioStatus}`}>{audioStatus}</span>
        {audioError && <span className="voice-error">{audioError}</span>}
      </div>

      <button type="button" className="panel-button" onClick={onRestartAudio}>
        Restart audio capture
      </button>
    </>
  );
}
