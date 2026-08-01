import * as yaml from 'js-yaml';
import { createDefaultUserSettings, LOCAL_SETTINGS_KEY, normalizeUserSettings } from '../config/userSettings';
import { getDesktopApi } from './desktopMode';

/**
 * @returns {Promise<ReturnType<typeof createDefaultUserSettings>>}
 */
export async function loadUserSettings() {
  const desktop = getDesktopApi();
  if (desktop?.loadSettings) {
    try {
      const raw = await desktop.loadSettings();
      return normalizeUserSettings(raw);
    } catch {
      return createDefaultUserSettings();
    }
  }

  try {
    const raw = localStorage.getItem(LOCAL_SETTINGS_KEY);
    if (!raw) return createDefaultUserSettings();
    return normalizeUserSettings(yaml.load(raw));
  } catch {
    return createDefaultUserSettings();
  }
}

/**
 * @param {ReturnType<typeof createDefaultUserSettings>} settings
 */
export async function saveUserSettings(settings) {
  const normalized = normalizeUserSettings(settings);
  const desktop = getDesktopApi();
  if (desktop?.saveSettings) {
    await desktop.saveSettings(normalized);
    return normalized;
  }

  try {
    localStorage.setItem(LOCAL_SETTINGS_KEY, yaml.dump(normalized, { indent: 2, lineWidth: 100, noRefs: true }));
  } catch {
    // ignore quota / private mode
  }
  return normalized;
}

/**
 * Clears persisted settings and returns factory defaults.
 * @returns {Promise<ReturnType<typeof createDefaultUserSettings>>}
 */
export async function resetUserSettings() {
  const desktop = getDesktopApi();
  if (desktop?.resetSettings) {
    await desktop.resetSettings();
  } else {
    try {
      localStorage.removeItem(LOCAL_SETTINGS_KEY);
    } catch {
      // ignore
    }
  }
  return createDefaultUserSettings();
}

/**
 * @returns {Promise<{ path?: string, exists?: boolean } | null>}
 */
export async function getUserSettingsInfo() {
  const desktop = getDesktopApi();
  if (!desktop?.getSettingsInfo) return null;
  try {
    return await desktop.getSettingsInfo();
  } catch {
    return null;
  }
}
