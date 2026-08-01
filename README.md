<div align="center">
  <img src="avatar-demo/public/AVATAR_SPLASH.png" alt="AVATAR" width="420" />
</div>

<p align="center">
  <em>Give a face to your AI — and anything else you listen to.</em>
</p>

<div align="center">
  <img src="https://img.shields.io/badge/License-MIT-efcefa?style=flat-square" alt="License" />
  <img src="https://img.shields.io/badge/Vite-7-bae6fd?style=flat-square" alt="Vite" />
  <img src="https://img.shields.io/badge/React-19-bbf7d0?style=flat-square" alt="React" />
  <img src="https://img.shields.io/badge/three--vrm-3.4-ffdac1?style=flat-square" alt="three-vrm" />
  <a href="https://booth.pm/"><img src="https://img.shields.io/badge/BOOTH-assets-fecdd3?style=flat-square" alt="BOOTH" /></a>
  <a href="https://vroid.com/"><img src="https://img.shields.io/badge/VRoid-compatible-e9d5ff?style=flat-square" alt="VRoid" /></a>
</div>

<p align="center">
  Animate cloud APIs, web apps, or local LLMs with a VRM character that lipsyncs and moves while you work.<br />
  Or keep a companion on screen while you study, watch a video, hear a podcast, speech, or audiobook — a character that follows the audio instead of a blank background.
</p>

<p align="center">
  <a href="#quick-start">Quick Start</a> ·
  <a href="docs/README.md">Documentation</a> ·
  <a href="docs/architecture/overview.md">Architecture</a> ·
  <a href="docs/animations/vrma.md">Animations</a> ·
  <a href="docs/voice/lip-sync.md">Lip Sync</a> ·
  <a href="docs/assets-and-credits.md">Assets & Credits</a> ·
  <a href="CHANGELOG.md">Changelog</a>
</p>

---

**AVATAR** is an open-source VRM character stage from ARPA — run it in the browser or as a local Electron desktop companion (including a packaged `.exe` installer for Windows). It renders `.vrm` models, plays `.vrma` motion, and drives mouth shapes from live audio.

## What this is

- **VRM avatars** — switch characters from Appearance
- **Environments** — Stars / Code / Bloom, color fade, none, plus a Custom GIF library
- **VRMA animations** — Default greeting + loop, plus individual clips
- **Lip sync** — mic, tab/window audio, file, or desktop device output
- **Desktop overlay** — transparent, always-on-top window with snap, pin/windowed, and ×0.5 / ×1 / ×2 scale

## Quick start

Requires **Node.js 20+** and **npm**.

### Browser

```bash
cd avatar-demo
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

### Desktop (Electron)

```bash
cd avatar-demo
npm install
npm run dev:desktop
```

Production desktop window (loads the built UI):

```bash
npm run desktop
```

A Windows **`.exe` installer** is planned for users who prefer a one-click install instead of running from source or the browser.

Gear menu: Appearance · Voice · Camera · Animations · Settings. Scale control sits next to the gear.

### Try lip sync

1. Gear → **Voice**
2. Pick an audio source (Device output on desktop; Microphone / Tab in the browser)
3. Green pulsating dot next to the gear = lip sync active

### Try animations

Gear → **Animations**. **Default** greets once, then loops model pose → full body → peace → squat → shoot.

## Documentation

| Topic | Links |
| :--- | :--- |
| **Getting started** | [Install](docs/getting-started/installation.md) · [First session](docs/getting-started/first-session.md) |
| **Architecture** | [Overview](docs/architecture/overview.md) · [Layout](docs/development/project-layout.md) |
| **Animations** | [VRMA](docs/animations/vrma.md) · [Manual testing](docs/animations/manual-testing.md) |
| **Voice** | [Lip sync](docs/voice/lip-sync.md) · [Audio sources](docs/voice/audio-sources.md) |
| **Assets** | [Assets & credits](docs/assets-and-credits.md) |

## Repository layout

```text
avatar/
├── docs/
├── avatar-demo/
│   ├── electron/
│   ├── public/
│   └── src/
├── CHANGELOG.md
└── README.md
```

## Assets & licensing (summary)

Sample characters are made in **VRoid Studio** / **VRoid Hub** with free, custom setups — **no paid models, wearables, or paid BOOTH items** are used in this repo.

Bundled motions are the **7 free VRMA files** released by the **VRoid Project** on [BOOTH](https://booth.pm/) (2024). Copyright remains with **pixiv Inc.** Commercial use requires the credit:

> Animation credits to pixiv Inc.'s VRoid Project  
> （キャラクターアニメーション: ピクシブ株式会社 VRoidプロジェクト）

Full terms, links, and takedown contact: **[docs/assets-and-credits.md](docs/assets-and-credits.md)**.  
Rights holders: **input@arpacorp.net**

## Privacy

Runs locally. Audio uses Web APIs / Electron loopback; nothing is uploaded.

---

<p align="center">
  <sub>Built & Maintained by <strong>ARPA Hellenic Logical Systems</strong></sub>
</p>
