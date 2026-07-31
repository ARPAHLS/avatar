import { useEffect, useState } from 'react';
import { getAudioSourceOptions } from '../../config/audioSources';
import { getDesktopApi } from '../../lib/desktopMode';

export function VoicePanel({
  audioSourceId,
  setAudioSourceId,
  audioFile,
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
      <select
        id="audio-source-select"
        className="panel-select"
        value={audioSourceId}
        onChange={(event) => setAudioSourceId(event.target.value)}
      >
        {audioSourceOptions.map((option) => (
          <option key={option.id} value={option.id}>
            {option.label}
          </option>
        ))}
      </select>
      <p className="panel-hint">
        {audioSourceOptions.find((option) => option.id === audioSourceId)?.description}
      </p>

      {audioSourceId === 'window' && (
        <>
          <label className="field-label" htmlFor="window-source-select">
            Window or screen
          </label>
          <select
            id="window-source-select"
            className="panel-select"
            value={windowSourceId ?? ''}
            onChange={(event) => setWindowSourceId(event.target.value || null)}
          >
            <option value="">Select a window…</option>
            {windowSources.map((source) => (
              <option key={source.id} value={source.id}>
                {source.name}
              </option>
            ))}
          </select>
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
