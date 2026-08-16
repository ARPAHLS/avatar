/**
 * User-facing copy for Voice capture status and errors.
 * Kept free of React so `node --test` can load it.
 */

/** @typedef {'idle' | 'starting' | 'active' | 'error' | 'awaiting-window' | 'awaiting-file' | string} AudioCaptureStatus */

/**
 * @param {AudioCaptureStatus} status
 * @returns {string}
 */
export function labelAudioCaptureStatus(status) {
  switch (status) {
    case 'idle':
      return 'Idle';
    case 'starting':
      return 'Starting capture…';
    case 'active':
      return 'Capturing (local)';
    case 'error':
      return 'Couldn’t start capture';
    case 'awaiting-window':
      return 'Pick a window or screen above';
    case 'awaiting-file':
      return 'Pick an audio file above';
    default:
      return typeof status === 'string' && status.trim() !== '' ? status : 'Unknown';
  }
}

/**
 * Turn a raw capture failure into short, actionable copy.
 * @param {unknown} cause
 * @returns {string}
 */
export function formatAudioCaptureError(cause) {
  const name = cause && typeof cause === 'object' && 'name' in cause ? String(cause.name) : '';
  const raw =
    cause instanceof Error
      ? cause.message
      : typeof cause === 'string'
        ? cause
        : 'Could not start the selected audio source.';

  const folded = `${name} ${raw}`.toLowerCase();

  if (
    name === 'NotAllowedError' ||
    folded.includes('permission') ||
    folded.includes('not allowed') ||
    folded.includes('denied')
  ) {
    return 'Permission denied. Allow microphone or screen/audio capture for AVATAR, then use Restart audio capture. On Windows: Settings → Privacy & security → Microphone (and Screen and voice recording if listed).';
  }

  if (folded.includes('could not start') || folded.includes('failed to get')) {
    return `${raw} Try Restart audio capture, or pick another source.`;
  }

  return raw;
}

/** One-line privacy promise shown in the Voice panel. */
export const AUDIO_PRIVACY_NOTE =
  'AVATAR measures audio levels on this device for lip sync. Nothing is uploaded or sent to a server.';
