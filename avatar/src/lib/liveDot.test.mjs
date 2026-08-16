import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  liveDotLabel,
  normalizeLiveLevel,
  resolveLiveDotMode,
} from './liveDot.js';

describe('resolveLiveDotMode', () => {
  it('hides the dot when the source is Off', () => {
    assert.equal(
      resolveLiveDotMode({ audioSourceId: 'none', audioStatus: 'idle' }),
      null,
    );
  });

  it('shows waiting while a source is selected but not yet capturing', () => {
    assert.equal(
      resolveLiveDotMode({ audioSourceId: 'system', audioStatus: 'starting' }),
      'waiting',
    );
    assert.equal(
      resolveLiveDotMode({ audioSourceId: 'microphone', audioStatus: 'idle' }),
      'waiting',
    );
  });

  it('shows live once capture is active', () => {
    assert.equal(
      resolveLiveDotMode({ audioSourceId: 'system', audioStatus: 'active' }),
      'live',
    );
  });

  it('shows error from status or error payload', () => {
    assert.equal(
      resolveLiveDotMode({ audioSourceId: 'system', audioStatus: 'error' }),
      'error',
    );
    assert.equal(
      resolveLiveDotMode({
        audioSourceId: 'system',
        audioStatus: 'idle',
        audioError: 'denied',
      }),
      'error',
    );
  });
});

describe('normalizeLiveLevel', () => {
  it('clamps and scales RMS into 0…1', () => {
    assert.equal(normalizeLiveLevel(0), 0);
    assert.equal(normalizeLiveLevel(-1), 0);
    assert.ok(normalizeLiveLevel(0.02) > 0);
    assert.equal(normalizeLiveLevel(0.08), 1);
    assert.equal(normalizeLiveLevel(1), 1);
  });
});

describe('liveDotLabel', () => {
  it('picks quiet vs active copy from level while live', () => {
    assert.match(liveDotLabel('live', 0), /listening/);
    assert.match(liveDotLabel('live', 0.05), /active/);
    assert.match(liveDotLabel('waiting', 0), /waiting/);
    assert.match(liveDotLabel('error', 0), /error/);
  });
});
