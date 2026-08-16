import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  AUDIO_PRIVACY_NOTE,
  formatAudioCaptureError,
  labelAudioCaptureStatus,
} from './audioCaptureCopy.js';

describe('labelAudioCaptureStatus', () => {
  it('maps known statuses to readable labels', () => {
    assert.equal(labelAudioCaptureStatus('idle'), 'Idle');
    assert.equal(labelAudioCaptureStatus('starting'), 'Starting capture…');
    assert.equal(labelAudioCaptureStatus('active'), 'Capturing (local)');
    assert.equal(labelAudioCaptureStatus('error'), 'Couldn’t start capture');
    assert.equal(labelAudioCaptureStatus('awaiting-window'), 'Pick a window or screen above');
    assert.equal(labelAudioCaptureStatus('awaiting-file'), 'Pick an audio file above');
  });
});

describe('formatAudioCaptureError', () => {
  it('turns NotAllowedError into an actionable permission message', () => {
    const error = new Error('Permission denied');
    error.name = 'NotAllowedError';
    const text = formatAudioCaptureError(error);
    assert.match(text, /Permission denied/i);
    assert.match(text, /Restart audio capture/);
    assert.match(text, /Windows/i);
  });

  it('passes through other messages', () => {
    assert.equal(formatAudioCaptureError(new Error('No audio track available.')), 'No audio track available.');
  });
});

describe('AUDIO_PRIVACY_NOTE', () => {
  it('states local-only analysis', () => {
    assert.match(AUDIO_PRIVACY_NOTE, /this device/i);
    assert.match(AUDIO_PRIVACY_NOTE, /Nothing is uploaded/i);
  });
});
