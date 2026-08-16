import { isDesktopMode } from '../lib/desktopMode';

/** @typedef {'none' | 'microphone' | 'tab' | 'file' | 'system' | 'window'} AudioSourceId */

const browserOptions = [
  {
    id: 'none',
    label: 'Off',
    description: 'Lip sync disabled.',
    requiresPermission: false,
  },
  {
    id: 'microphone',
    label: 'Microphone',
    description: 'Live mic input — useful for talking directly to the avatar.',
    requiresPermission: true,
  },
  {
    id: 'tab',
    label: 'Tab or window audio',
    description:
      'Share a browser tab or application window with audio (Chrome, Edge). Pick the tab playing AI speech or media.',
    requiresPermission: true,
  },
  {
    id: 'file',
    label: 'Audio file',
    description: 'Upload or pick a local recording to drive lip sync while it plays.',
    requiresPermission: false,
  },
];

const desktopOptions = [
  {
    id: 'none',
    label: 'Off',
    description: 'Lip sync disabled.',
    requiresPermission: false,
  },
  {
    id: 'system',
    label: 'Device output (auto)',
    description:
      'Captures whatever audio your PC is playing — music, Chrome, assistants, games. Uses OS loopback in the desktop app; levels stay on this device.',
    requiresPermission: true,
  },
  {
    id: 'window',
    label: 'Pick app window',
    description:
      'Choose a specific window (Chrome tab, Discord, etc.) when you only want one app’s audio.',
    requiresPermission: true,
  },
  {
    id: 'microphone',
    label: 'Microphone',
    description: 'Live mic input.',
    requiresPermission: true,
  },
  {
    id: 'file',
    label: 'Audio file',
    description: 'Upload a local recording to drive lip sync while it plays.',
    requiresPermission: false,
  },
];

/** @returns {typeof browserOptions} */
export function getAudioSourceOptions() {
  return isDesktopMode() ? desktopOptions : browserOptions;
}

/** @param {AudioSourceId} id */
export function getAudioSourceOption(id) {
  return getAudioSourceOptions().find((option) => option.id === id) ?? getAudioSourceOptions()[0];
}

/** Default lip-sync source for the current runtime. */
export function getDefaultAudioSourceId() {
  return isDesktopMode() ? 'system' : 'none';
}
