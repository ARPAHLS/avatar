# Installation

AVATAR’s **main product surface is the Electron desktop app**. Browser / localhost is for development and contributors.

## Requirements

- **Node.js 20+** and **npm**
- Windows recommended for the overlay companion (macOS/Linux Electron also builds)

## Desktop (recommended)

```bash
cd avatar-demo
npm install
npm run dev:desktop
```

Hot-reloads the UI inside a transparent always-on-top window.

### Production desktop window

```bash
npm run desktop
```

Builds Vite `dist/`, then launches Electron against it.

### Packaged `.exe`

A Windows installer is planned so end users can install without Node. Until then, use `npm run desktop` from a clone, or wait for release artifacts on GitHub Releases.

## Browser (dev)

```bash
cd avatar-demo
npm run dev
```

[http://localhost:5173](http://localhost:5173) — useful for UI work; system audio loopback is an Electron feature.

## Web production bundle

```bash
npm run build
npm run preview
```

## Troubleshooting

| Issue | Fix |
| :--- | :--- |
| Blank stage | Confirm `avatar1.vrm` (etc.) under `src/assets/avatars/` |
| New VRM missing | Match `avatarN.vrm` / `avatarNB.vrm` naming; restart Electron/Vite |
| VRMA fails | Check console; paths in `src/config/animations.js` |
| Desktop audio missing | Voice → **Device output** or pick a window |
| Tab audio (browser) | Share tab with **Share tab audio** enabled |
