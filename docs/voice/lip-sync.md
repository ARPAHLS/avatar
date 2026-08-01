# Lip sync

AVATAR drives mouth shapes from **audio amplitude**, not phoneme recognition.

## How it works

1. `useAudioSource` captures audio and attaches an `AnalyserNode`.
2. `useAudioAnalyser` computes RMS level each frame and detects speech vs silence.
3. `useAmplitudeLipSync` smooths the level and cycles through visemes: `aa`, `ee`, `ih`, `oh`, `ou`.
4. Values are written to `vrm.expressionManager`.

When lip sync is disabled, viseme weights reset to zero so expressions do not stick.

## When lip sync runs

Lip sync is active when:

- A non-`none` audio source is selected, **and**
- Capture status is `active`.

A **Live** indicator appears beside the animation dropdown.

## Tuning

Key constants live in `src/hooks/useAmplitudeLipSync.js`:

- Level multiplier (`* 2.8`) — overall mouth openness
- Attack / release smoothing — how quickly the mouth opens vs closes
- Phase speed — viseme cycling rate while speaking

Adjust these if the mouth feels too subtle or too jittery for your audio source.

## Limitations

- No phoneme accuracy — good for presence, not dubbing.
- Tab capture depends on browser/OS support for system or tab audio.
- Native process loopback (WASAPI / Core Audio taps) is out of scope for this web preview.
