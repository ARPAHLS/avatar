# Audio sources

Configure sources in **Voice** (gear → microphone).

| Source | API | Best for |
| :--- | :--- | :--- |
| **Off** | — | Animation-only testing |
| **Microphone** | `getUserMedia` | Live speech, room audio |
| **Tab or window audio** | `getDisplayMedia` | AI assistants, YouTube, meetings in a shared tab |
| **Audio file** | `HTMLAudioElement` + Web Audio | Recordings, TTS exports |

## Tab / window capture

1. Choose **Tab or window audio**.
2. When prompted, pick the tab or window that is **playing** speech.
3. Enable **Share tab audio** (Chrome) or the equivalent checkbox.
4. Video tracks are stopped immediately — only audio is analyzed.

This is the closest browser equivalent to Persona's automatic voice-output listener. It does not require a backend.

## Microphone

Useful for direct interaction. The analyser does **not** route mic audio to speakers (no monitoring) to avoid feedback.

## Audio file

Select a local `.mp3`, `.wav`, or other browser-supported format. The file loops while lip sync runs and is audible through the default output.

## Permissions & privacy

- All processing stays in the browser tab.
- No audio is uploaded or stored.
- Restart capture after changing sources using **Restart audio capture**.

## Status values

| Status | Meaning |
| :--- | :--- |
| `idle` | Lip sync off |
| `starting` | Opening audio context / awaiting permission |
| `active` | Analyser receiving samples |
| `awaiting-file` | File source selected but no file chosen |
| `error` | Permission denied or unsupported capture |
