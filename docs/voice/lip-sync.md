# Lip sync

AVATAR drives VRM mouth blendshapes from **audio amplitude** (how loud the signal is), not from speech-to-text phonemes.

## Pipeline

1. You choose an [audio source](audio-sources.md).  
2. `useAudioSource` captures a stream (mic, loopback, file, …).  
3. An analyser produces a level each frame.  
4. `useAmplitudeLipSync` maps level → viseme weights on the VRM `expressionManager` while the character is “speaking.”  
5. Blinking continues via `useBlink` in parallel.

## What you’ll notice

- Louder audio → wider / more active mouth.  
- Silence → mouth returns toward rest.  
- Works with any language or non-speech audio (music, UI beeps) because it is level-based.  
- It will **not** perfectly match every syllable like a dedicated phoneme lip-sync product.

## Live UI

Glass bar **green pulsing dot** = capture active and lip sync enabled.  
Voice drawer shows status text (`idle`, `starting`, `active`, `error`, …) and **Restart audio capture**.

<p align="center">
  <img src="../screenshots/11-bar-live-dot.png" alt="Live dot" height="100" />
  <img src="../screenshots/54-voice-active-lipsync.png" alt="Active lip sync" height="200" />
</p>

## Tips

- Prefer **Device output** on desktop when watching videos or chatting with an AI that plays audio through the system.  
- If the mouth never moves, confirm the green dot, OS mute, and that the selected window (if any) is actually producing sound.  
- Extremely quiet sources may need higher OS volume or a closer mic.
