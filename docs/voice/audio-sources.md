# Audio sources

Configure sources in **Voice** (gear → microphone).

## Browser

| Source | API | Best for |
| :--- | :--- | :--- |
| **Off** | — | Animation-only testing |
| **Microphone** | `getUserMedia` | Live speech |
| **Tab or window audio** | `getDisplayMedia` | AI assistants, YouTube, shared tabs |
| **Audio file** | `HTMLAudioElement` + Web Audio | Recordings, TTS exports |

## Desktop (Electron)

| Source | Best for |
| :--- | :--- |
| **Device output** | Auto-capture of system / loopback audio |
| **Window** | One app (browser, Discord, player, etc.) |
| **Microphone** / **File** | Same as browser where available |

### Tab / window capture (browser)

1. Choose **Tab or window audio**.
2. Pick the tab or window that is **playing** speech.
3. Enable **Share tab audio** (Chrome) or the equivalent.
4. Video tracks are stopped — only audio is analyzed.

### Device output (desktop)

Uses Electron’s display-media handler with audio loopback so the avatar can follow whatever is playing on the machine without picking a tab each time.

## Microphone

The analyser does **not** route mic audio to speakers (no monitoring) to avoid feedback.

## Audio file

Select a local `.mp3`, `.wav`, or other supported format. The file loops while lip sync runs.

## Permissions & privacy

- Processing stays on device (browser tab or Electron app).
- No audio is uploaded or stored.
- Use **Restart audio capture** after changing sources.

## Status values

| Status | Meaning |
| :--- | :--- |
| `idle` | Lip sync off |
| `starting` | Opening audio context / awaiting permission |
| `active` | Analyser receiving samples |
| `awaiting-file` | File source selected but no file chosen |
| `error` | Permission denied or unsupported capture |
