import { useCallback, useEffect, useState } from 'react';
import { getVroidHubApi } from '../../lib/desktopMode';

function errorMessage(err) {
  return err instanceof Error ? err.message : String(err);
}

// Order and labels for VRM 0.0's license fields (CharacterModelLicenseSerializer).
// Shown before a hearted (someone else's) model can be selected, per VRoid
// Hub's third-party integration rules — own models skip this, the account
// already agreed to its own terms.
const LICENSE_FIELDS_V0 = [
  ['credit', 'Credit required'],
  ['personal_commercial_use', 'Personal commercial use'],
  ['corporate_commercial_use', 'Corporate commercial use'],
  ['modification', 'Modification'],
  ['redistribution', 'Redistribution'],
  ['characterization_allowed_user', 'Who can use it as an avatar'],
  ['sexual_expression', 'Sexual expression'],
  ['violent_expression', 'Violent expression'],
];

function formatLicenseValueV0(field, value) {
  if (value == null || value === 'default') return "Not set by the model's author";
  if (field === 'personal_commercial_use') {
    if (value === 'profit') return 'Allowed';
    if (value === 'nonprofit') return 'Non-profit only';
    return 'Not allowed';
  }
  if (field === 'credit') return value === 'necessary' ? 'Required' : 'Not required';
  if (field === 'characterization_allowed_user') {
    return value === 'everyone' ? 'Anyone' : "Model's author only";
  }
  return value === 'allow' ? 'Allowed' : 'Not allowed';
}

// VRM 1.0 exposes conditions of use as flat fields on vrm_meta (VRM1Meta) —
// a different shape and vocabulary than VRM 0.0's license object above. See
// node_modules/@pixiv/three-vrm-core/types/meta/VRM1Meta.d.ts.
const LICENSE_FIELDS_V1 = [
  ['creditNotation', 'Credit required'],
  ['commercialUsage', 'Commercial use'],
  ['modification', 'Modification'],
  ['allowRedistribution', 'Redistribution (unmodified)'],
  ['avatarPermission', 'Who can use it as an avatar'],
  ['allowExcessivelySexualUsage', 'Excessively sexual expression'],
  ['allowExcessivelyViolentUsage', 'Excessively violent expression'],
  ['allowPoliticalOrReligiousUsage', 'Political or religious usage'],
  ['allowAntisocialOrHateUsage', 'Antisocial or hate speech usage'],
];

function formatLicenseValueV1(field, value) {
  if (value == null) return "Not set by the model's author";
  if (field === 'creditNotation') return value === 'required' ? 'Required' : 'Not required';
  if (field === 'commercialUsage') {
    if (value === 'personalProfit') return 'Personal, for-profit allowed';
    if (value === 'personalNonProfit') return 'Personal, non-profit only';
    if (value === 'corporation') return 'Corporate use allowed';
    return 'Not allowed';
  }
  if (field === 'modification') {
    if (value === 'allowModificationRedistribution') return 'Allowed, including redistribution';
    if (value === 'allowModification') return 'Allowed (no redistribution)';
    return 'Not allowed';
  }
  if (field === 'avatarPermission') {
    if (value === 'everyone') return 'Anyone';
    if (value === 'onlySeparatelyLicensedPerson') return 'Requires a separate license';
    return "Model's author only";
  }
  return value === true ? 'Allowed' : 'Not allowed';
}

function licenseRows(license) {
  const isV1 = license?.spec_version === '1.0';
  const fields = isV1 ? LICENSE_FIELDS_V1 : LICENSE_FIELDS_V0;
  const format = isV1 ? formatLicenseValueV1 : formatLicenseValueV0;
  return fields.map(([field, label]) => ({ label, value: format(field, license?.[field]) }));
}

export function VroidHubPanel({
  onCharacterSelected,
  onReactivateHub,
  onHubCleared,
  loadedCharacterId,
  loadedCharacterActive,
}) {
  const vroidApi = getVroidHubApi();
  const [status, setStatus] = useState(null);
  const [credentials, setCredentials] = useState(null);
  const [clientIdInput, setClientIdInput] = useState('');
  const [clientSecretInput, setClientSecretInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [characters, setCharacters] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);
  const [redirectCopied, setRedirectCopied] = useState(false);
  const [pendingHeartedCharacter, setPendingHeartedCharacter] = useState(null);

  useEffect(() => {
    if (!vroidApi) return undefined;
    void vroidApi.getStatus().then(setStatus);
    void vroidApi.getCredentials().then((creds) => {
      setCredentials(creds);
      setClientIdInput(creds.clientId ?? '');
    });
    return vroidApi.subscribe(setStatus);
  }, [vroidApi]);

  const refreshCharacters = useCallback(async () => {
    if (!vroidApi) return;
    setLoading(true);
    setError(null);
    try {
      setCharacters(await vroidApi.listCharacters());
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [vroidApi]);

  useEffect(() => {
    if (status?.connected) void refreshCharacters();
    else setCharacters(null);
  }, [status?.connected, refreshCharacters]);

  if (!vroidApi) {
    return <p className="panel-note">VRoid Hub sign-in is available in the AVATAR desktop app.</p>;
  }

  async function saveCredentials() {
    const clientId = clientIdInput.trim();
    const clientSecret = clientSecretInput.trim();
    if (!clientId || !clientSecret) return;
    setSaving(true);
    setError(null);
    try {
      setStatus(await vroidApi.setCredentials(clientId, clientSecret));
      setCredentials(await vroidApi.getCredentials());
      setClientSecretInput('');
      setCharacters(null);
      onHubCleared();
      setNotice('VRoid Hub app credentials saved.');
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function clearCredentials() {
    setError(null);
    try {
      setStatus(await vroidApi.clearCredentials());
      setCredentials({ clientId: null, hasClientSecret: false });
      setClientIdInput('');
      setClientSecretInput('');
      setCharacters(null);
      onHubCleared();
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  async function copyRedirectUri() {
    if (!status?.redirect_uri) return;
    try {
      await navigator.clipboard.writeText(status.redirect_uri);
      setRedirectCopied(true);
      setTimeout(() => setRedirectCopied(false), 1500);
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  async function connect() {
    setError(null);
    try {
      setStatus(await vroidApi.connect());
      setNotice('Continue signing in to VRoid Hub in your browser.');
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  async function disconnect() {
    setError(null);
    try {
      setStatus(await vroidApi.disconnect());
      setCharacters(null);
      onHubCleared();
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  async function downloadCharacter(character) {
    try {
      const bytes = await vroidApi.selectCharacter(character.id);
      onCharacterSelected(bytes, character);
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  function selectCharacter(character) {
    setError(null);
    // Already downloaded and just not the active model (e.g. the user
    // switched to a built-in avatar and came back) — swap back to it
    // in-memory instead of re-downloading through VRoid Hub.
    if (character.id === loadedCharacterId && !loadedCharacterActive) {
      onReactivateHub();
      return;
    }
    if (character.id === loadedCharacterId && loadedCharacterActive) return;
    // A hearted model belongs to someone else — show its conditions of use
    // and attribution before downloading it, rather than fetching silently.
    if (character.source === 'hearted') {
      setPendingHeartedCharacter(character);
      return;
    }
    void downloadCharacter(character);
  }

  function confirmHeartedCharacter() {
    const character = pendingHeartedCharacter;
    setPendingHeartedCharacter(null);
    if (character) void downloadCharacter(character);
  }

  return (
    <>
      <p className="panel-note panel-note--compact">
        Advanced: use a character from your own VRoid Hub account without downloading it
        yourself. Off by default — bring your own registered OAuth app.
      </p>

      {error && <p className="panel-note vroid-hub-error">{error}</p>}
      {notice && <p className="panel-note panel-note--compact">{notice}</p>}

      {!status?.configured && (
        <>
          <p className="panel-hint">
            Register an application at <code>hub.vroid.com/oauth/applications</code>, then set
            its redirect URI to:
          </p>
          <p className="panel-note--mono">{status?.redirect_uri ?? '—'}</p>
          <div className="panel-actions">
            <button
              type="button"
              className="panel-button"
              disabled={!status?.redirect_uri}
              onClick={() => void copyRedirectUri()}
            >
              {redirectCopied ? 'Copied!' : 'Copy redirect URI'}
            </button>
          </div>

          <label className="field-label" htmlFor="vroid-client-id">
            Client ID
          </label>
          <input
            id="vroid-client-id"
            type="text"
            autoComplete="off"
            spellCheck={false}
            className="field-input"
            value={clientIdInput}
            onChange={(event) => setClientIdInput(event.target.value)}
          />

          <label className="field-label" htmlFor="vroid-client-secret">
            Client secret
          </label>
          <input
            id="vroid-client-secret"
            type="password"
            autoComplete="off"
            className="field-input"
            placeholder={credentials?.hasClientSecret ? '••••••••' : ''}
            value={clientSecretInput}
            onChange={(event) => setClientSecretInput(event.target.value)}
          />

          <button
            type="button"
            className="panel-button"
            disabled={saving || !clientIdInput.trim() || !clientSecretInput.trim()}
            onClick={() => void saveCredentials()}
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        </>
      )}

      {status?.configured && !status.connected && (
        <div className="panel-actions">
          <button type="button" className="panel-button" onClick={() => void connect()}>
            Connect VRoid Hub account
          </button>
        </div>
      )}

      {pendingHeartedCharacter && (
        <div className="vroid-hub-license-gate">
          <p className="panel-note panel-note--compact">
            <strong>{pendingHeartedCharacter.name}</strong> belongs to another VRoid Hub user
            {pendingHeartedCharacter.author_name ? ` (${pendingHeartedCharacter.author_name})` : ''}.
            Review its conditions of use before selecting it:
          </p>
          {pendingHeartedCharacter.license ? (
            <ul className="vroid-hub-license-list">
              {licenseRows(pendingHeartedCharacter.license).map((row) => (
                <li key={row.label}>
                  <span>{row.label}</span>
                  <span>{row.value}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="panel-note panel-note--compact">
              This model's author hasn't set explicit usage conditions in VRoid Hub.
            </p>
          )}
          <div className="panel-actions">
            <button type="button" className="panel-button" onClick={confirmHeartedCharacter}>
              Use this model
            </button>
            <button
              type="button"
              className="panel-button"
              onClick={() => setPendingHeartedCharacter(null)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {status?.connected && (
        <>
          {loading && <p className="panel-note panel-note--compact">Loading your characters…</p>}
          {!loading && characters?.length === 0 && (
            <p className="panel-note panel-note--compact">
              No usable characters found. Own a character on VRoid Hub, or heart one that's
              already marked available to other users.
            </p>
          )}
          {characters && characters.length > 0 && (
            <div className="vroid-hub-character-grid">
              {characters.map((character) => (
                <button
                  type="button"
                  key={character.id}
                  className={`vroid-hub-character-card ${
                    loadedCharacterActive && loadedCharacterId === character.id
                      ? 'vroid-hub-character-card--active'
                      : ''
                  }`}
                  onClick={() => selectCharacter(character)}
                  title={character.name}
                >
                  {character.portrait_url ? (
                    <img src={character.portrait_url} alt={character.name} />
                  ) : (
                    <span className="vroid-hub-character-card__placeholder" aria-hidden="true" />
                  )}
                  <span className="vroid-hub-character-card__name">{character.name}</span>
                </button>
              ))}
            </div>
          )}
          <div className="panel-actions">
            <button
              type="button"
              className="panel-button"
              disabled={loading}
              onClick={() => void refreshCharacters()}
            >
              Refresh
            </button>
            <button type="button" className="panel-button panel-button--danger" onClick={() => void disconnect()}>
              Disconnect
            </button>
          </div>
        </>
      )}

      {status?.configured && (
        <button type="button" className="panel-button panel-button--danger" onClick={() => void clearCredentials()}>
          Remove app credentials
        </button>
      )}
    </>
  );
}
