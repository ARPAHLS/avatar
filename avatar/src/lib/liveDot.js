/**
 * Discrete glass-bar live-dot mode from capture state (#42).
 * Amplitude (quiet ↔ loud green) is applied continuously while mode is `live`.
 *
 * @typedef {'waiting' | 'live' | 'error'} LiveDotMode
 */

/**
 * @param {Object} args
 * @param {string} args.audioSourceId
 * @param {string} args.audioStatus
 * @param {unknown} [args.audioError]
 * @returns {LiveDotMode | null} null = hidden
 */
export function resolveLiveDotMode({ audioSourceId, audioStatus, audioError }) {
  if (!audioSourceId || audioSourceId === 'none') return null;
  if (audioStatus === 'error' || audioError) return 'error';
  if (audioStatus === 'active') return 'live';
  // idle / starting (and any other pre-active status)
  return 'waiting';
}

/** Map analyser RMS into 0…1 for CSS `--live-level`. */
export function normalizeLiveLevel(level) {
  if (typeof level !== 'number' || !(level > 0)) return 0;
  // Same ballpark as speaking threshold (~0.012); speech often sits under ~0.1.
  return Math.min(1, level / 0.08);
}

export const LIVE_DOT_LABELS = {
  waiting: 'Lip sync waiting for audio',
  liveQuiet: 'Lip sync listening',
  liveActive: 'Lip sync active',
  error: 'Lip sync error — open Voice',
};

/**
 * @param {LiveDotMode} mode
 * @param {number} level
 */
export function liveDotLabel(mode, level) {
  if (mode === 'waiting') return LIVE_DOT_LABELS.waiting;
  if (mode === 'error') return LIVE_DOT_LABELS.error;
  return normalizeLiveLevel(level) < 0.15
    ? LIVE_DOT_LABELS.liveQuiet
    : LIVE_DOT_LABELS.liveActive;
}
