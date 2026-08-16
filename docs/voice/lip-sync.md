# Lip sync

AVATAR drives VRM mouth blendshapes from **audio amplitude** (how loud the signal is), not from speech-to-text phonemes.

Pick the input first: [Audio sources](audio-sources.md). Everyday steps: [Using the app → Voice](../using-the-app.md#4-voice--lip-sync).

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

Glass-bar **live dot** (left of the gear) reflects capture status and loudness — not a binary “on” light:

| Dot | Meaning |
| :--- | :--- |
| Hidden | Audio source **Off** |
| Soft amber | Source selected; waiting / starting |
| Soft mint → brighter green | Capturing; green tracks analyser level |
| Soft coral | Capture error — check Gear → **Voice** |

Voice drawer shows a **plain-language status** (for example **Capturing (local)** or **Starting capture…**), a short **local-only privacy** note, and **Restart audio capture**. Permission failures include actionable copy (desktop can open system privacy settings). Details: [Audio sources → Privacy](audio-sources.md#privacy-what-stays-local).

<p align="center">
  <img src="../screenshots/11-bar-live-dot.png" alt="Live dot" height="100" />
  <img src="../screenshots/54-voice-active-lipsync.png" alt="Active lip sync" height="200" />
</p>

## Tips

- Prefer **Device output** on desktop when watching videos or chatting with an AI that plays audio through the system.  
- If the mouth never moves, confirm the live dot is mint/green (not amber waiting or coral error), OS mute, and that the selected window (if any) is actually producing sound.  
- Extremely quiet sources may need higher OS volume or a closer mic.
