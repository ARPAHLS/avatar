const path = require('path');
const fs = require('fs');
const yaml = require('js-yaml');

const SETTINGS_FILE = 'config.yaml';
// Fallback only when the renderer omits version. Prefer the schema version
// from normalizeUserSettings / snapshotUserSettings (currently 3).
const SETTINGS_VERSION = 3;

/**
 * @param {import('electron').App} app
 */
function getSettingsPath(app) {
  return path.join(app.getPath('userData'), SETTINGS_FILE);
}

/**
 * @param {import('electron').App} app
 * @returns {object | null}
 */
function loadSettings(app) {
  try {
    const raw = fs.readFileSync(getSettingsPath(app), 'utf8');
    const parsed = yaml.load(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    return parsed;
  } catch {
    return null;
  }
}

/**
 * @param {import('electron').App} app
 * @param {object} settings
 */
function saveSettings(app, settings) {
  const incoming = settings && typeof settings === 'object' ? { ...settings } : {};
  const parsedVersion = Number(incoming.version);
  const version =
    Number.isFinite(parsedVersion) && parsedVersion >= 1 ? parsedVersion : SETTINGS_VERSION;
  const doc = { ...incoming, version };
  const text = yaml.dump(doc, {
    indent: 2,
    lineWidth: 100,
    noRefs: true,
    sortKeys: false,
  });
  const filePath = getSettingsPath(app);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, text, 'utf8');
  return doc;
}

/**
 * @param {import('electron').App} app
 */
function resetSettings(app) {
  const filePath = getSettingsPath(app);
  try {
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  } catch {
    // ignore
  }
  return null;
}

/**
 * @param {import('electron').App} app
 */
function getSettingsInfo(app) {
  return {
    path: getSettingsPath(app),
    exists: fs.existsSync(getSettingsPath(app)),
  };
}

module.exports = {
  SETTINGS_FILE,
  SETTINGS_VERSION,
  getSettingsPath,
  loadSettings,
  saveSettings,
  resetSettings,
  getSettingsInfo,
};
