<p align="center">
  <img src="avatar-demo/public/vite.svg" alt="VOX Avatar" width="72" />
</p>

<h1 align="center">VOX Avatar</h1>

<p align="center">
  <strong>Expressive VRM characters with VRMA motion and real-time lip sync.</strong>
</p>

<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-9b87de?style=for-the-badge" alt="License: MIT" /></a>
  <a href="https://vitejs.dev"><img src="https://img.shields.io/badge/Vite-7-646cff?style=for-the-badge&logo=vite&logoColor=white" alt="Vite" /></a>
  <a href="https://react.dev"><img src="https://img.shields.io/badge/React-19-61dafb?style=for-the-badge&logo=react&logoColor=white" alt="React" /></a>
  <a href="https://github.com/pixiv/three-vrm"><img src="https://img.shields.io/badge/three--vrm-3.4-e9e1fa?style=for-the-badge" alt="three-vrm" /></a>
</p>

<p align="center">
  <a href="#quick-start">Quick Start</a> ·
  <a href="docs/README.md">Documentation</a> ·
  <a href="docs/architecture/overview.md">Architecture</a> ·
  <a href="docs/animations/vrma.md">Animations</a> ·
  <a href="docs/voice/lip-sync.md">Lip Sync</a> ·
  <a href="CHANGELOG.md">Changelog</a>
</p>

---

**VOX Avatar** is a VRM character stage for ARPA projects — browser and Electron desktop overlay. It renders `.vrm` models, plays `.vrma` motion clips, and drives mouth shapes from live audio.

> Private repo: [ARPAHLS/avatar](https://github.com/ARPAHLS/avatar)

## What this is

- **VRM rendering** — switch avatars from Appearance
- **VRMA animations** — default greeting + loop, plus individual clips
- **Lip sync** — microphone, tab audio, file, or desktop device output
- **Desktop overlay** — transparent, always-on-top companion window

## Quick start

Requires **Node.js 20+** and **npm**.

```bash
cd avatar-demo
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

### Desktop overlay

```bash
cd avatar-demo
npm install
npm run dev:desktop
```

Production overlay: `npm run desktop`

Gear menu: Appearance (Avatar + Environments), Voice, Camera, Animations, Settings. Scale button for ×0.5 / ×1 / ×2.

### Try lip sync

1. Gear → **Voice**.
2. Pick an audio source (Device output on desktop, or Tab / Microphone in browser).
3. Green dot next to the gear = lip sync active.

### Try animations

Gear → **Animations**. **Default** greets once, then loops the motion pack sequence.

## Documentation

| Topic | Links |
| :--- | :--- |
| **Getting started** | [Install](docs/getting-started/installation.md) · [First session](docs/getting-started/first-session.md) |
| **Architecture** | [Overview](docs/architecture/overview.md) · [Layout](docs/development/project-layout.md) |
| **Animations** | [VRMA](docs/animations/vrma.md) · [Manual testing](docs/animations/manual-testing.md) |
| **Voice** | [Lip sync](docs/voice/lip-sync.md) · [Audio sources](docs/voice/audio-sources.md) |

## Repository layout

```text
avatar/
├── docs/
├── avatar-demo/          Vite + React (+ Electron)
│   ├── electron/
│   └── src/
├── CHANGELOG.md
└── README.md
```

## Assets & licensing

Bundled VRM/VRMA are for local development. VRMA Motion Pack follows [Pixiv's terms](avatar-demo/src/assets/avatars/VRMA/Readme_VRMA_MotionPack_EN.txt).

## Privacy

Runs locally. Audio uses Web APIs / Electron loopback; nothing is uploaded.

---

<p align="center">
  <sub>Built & Maintained by <strong>ARPA Hellenic Logical Systems</strong></sub>
</p>
