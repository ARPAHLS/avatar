import { useEffect, useState } from 'react';
import { normalizeAgentBusPort } from '../../config/agentBus';

/**
 * Settings → Agents: the opt-in for the local agent bus (Refs #6).
 *
 * @param {{
 *   settings: import('../../config/agentBus').AgentBusSettings,
 *   status: {
 *     running: boolean, token: string | null,
 *     tokenPersisted: boolean, error: string | null,
 *   } | null,
 *   onChange: (next: import('../../config/agentBus').AgentBusSettings) => void,
 *   onRotateToken: () => Promise<unknown>,
 * }} props
 */
export function AgentBusPanel({ settings, status, onChange, onRotateToken }) {
  // Held as text while it is being typed: the server only rebinds once the
  // field is committed, not on every keystroke.
  const [portDraft, setPortDraft] = useState(String(settings.port));
  const [copied, setCopied] = useState(null);

  useEffect(() => {
    setPortDraft(String(settings.port));
  }, [settings.port]);

  useEffect(() => {
    if (!copied) return undefined;
    const timer = window.setTimeout(() => setCopied(null), 1600);
    return () => window.clearTimeout(timer);
  }, [copied]);

  const token = status?.token ?? null;
  const example = [
    `curl -X POST http://127.0.0.1:${settings.port}/v1/command \\`,
    '  -H "Content-Type: application/json" \\',
    ...(settings.requireToken ? [`  -H "Authorization: Bearer ${token ?? '<token>'}" \\`] : []),
    // Without a mode this would *select* the clip and persist it, so the
    // example that gets copied is the one an agent almost always wants.
    `  -d '{"command":"animation.play","payload":{"id":"Peace Sign","mode":"once"}}'`,
  ].join('\n');

  async function copy(what, text) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(what);
    } catch {
      setCopied(null);
    }
  }

  function commitPort() {
    const next = normalizeAgentBusPort(portDraft);
    setPortDraft(String(next));
    if (next !== settings.port) onChange({ ...settings, port: next });
  }

  return (
    <div className="agent-bus-panel">
      <p className="panel-note panel-note--compact">
        Lets local scripts and agents play animations, swap avatars and set the environment over
        127.0.0.1 — the same commands the menus and hotkeys use. Nothing outside this machine can
        reach it.
      </p>

      <div className="desktop-toggle-row">
        <span className="settings-section-title">Enable local bus</span>
        <input
          type="checkbox"
          className="panel-checkbox"
          checked={settings.enabled}
          onChange={() => onChange({ ...settings, enabled: !settings.enabled })}
        />
      </div>

      <p className="panel-note panel-note--compact">{describe(settings, status)}</p>

      <label className="field-label" htmlFor="agent-bus-port">
        Port
      </label>
      <input
        id="agent-bus-port"
        className="field-input"
        type="number"
        min={1024}
        max={65535}
        value={portDraft}
        onChange={(event) => setPortDraft(event.target.value)}
        onBlur={commitPort}
        onKeyDown={(event) => {
          if (event.key === 'Enter') event.currentTarget.blur();
        }}
      />

      <div className="desktop-toggle-row">
        <span className="settings-section-title">Require token</span>
        <input
          type="checkbox"
          className="panel-checkbox"
          checked={settings.requireToken}
          onChange={() => onChange({ ...settings, requireToken: !settings.requireToken })}
        />
      </div>

      {settings.requireToken ? (
        <>
          {token ? (
            <p className="panel-note--mono agent-bus-panel__token">{token}</p>
          ) : (
            <p className="panel-note panel-note--compact">Generated when you enable the bus.</p>
          )}
          {status && !status.tokenPersisted && (
            <p className="panel-note panel-note--compact">
              No OS keychain available, so this token is kept in memory and changes every launch.
            </p>
          )}
          <div className="panel-actions">
            <button
              type="button"
              className="panel-button"
              disabled={!token}
              onClick={() => void copy('token', token ?? '')}
            >
              {copied === 'token' ? 'Copied' : 'Copy token'}
            </button>
            <button
              type="button"
              className="panel-button panel-button--danger"
              onClick={() => void onRotateToken()}
            >
              Regenerate
            </button>
          </div>
        </>
      ) : (
        <p className="panel-note panel-note--compact">
          Anything on this machine can drive the avatar while the bus is on.
        </p>
      )}

      <div className="panel-actions panel-actions--wide">
        <button type="button" className="panel-button" onClick={() => void copy('curl', example)}>
          {copied === 'curl' ? 'Copied' : 'Copy example curl'}
        </button>
      </div>
    </div>
  );
}

/**
 * @param {import('../../config/agentBus').AgentBusSettings} settings
 * @param {{ running: boolean, error: string | null } | null} status
 */
function describe(settings, status) {
  if (!settings.enabled) return 'Off. Nothing is listening.';
  // A port that is already taken is not worked around: the copied curl above
  // names a port, and moving would make it point at the wrong one.
  if (status?.error) return status.error;
  if (!status?.running) return 'Starting…';
  // Just the address: the routes would wrap to three lines in a column this
  // narrow, and Copy example curl hands over a working one anyway.
  return `Listening on 127.0.0.1:${settings.port}.`;
}
