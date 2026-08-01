# Lip sync

AVATAR drives mouth shapes from **audio amplitude**, not phoneme recognition.

## How it works

1. `useAudioSource` captures audio and attaches an `AnalyserNode`.
2. `useAudioAnalyser` computes RMS level each frame and detects speech vs silence.
3. `useAmplitudeLipSync` smooths the level and cycles through visemes: `aa`, `ee`, `ih`, `oh`, `ou`.
4. Values are written to `vrm.expressionManager`.

When lip sync is disabled, viseme weights reset to zero.

## When lip sync runs

- A non-`none` audio source is selected, **and**
- Capture status is `active`.

A **green pulsating dot** appears next to the gear while active.

## Tuning

Key constants live in `src/hooks/useAmplitudeLipSync.js`:

- Level multiplier — overall mouth openness
- Attack / release smoothing — open vs close speed
- Phase speed — viseme cycling rate while speaking

## Limitations

- No phoneme accuracy — good for presence, not dubbing.
- Browser tab capture depends on browser/OS support.
- Desktop device output uses Electron loopback where available.
