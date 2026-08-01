<div align="center">
  <img src="avatar-demo/public/AVATAR_SPLASH.png" alt="AVATAR" width="420" />
</div>

<p align="center">
  <b>Give a face to your AI — and anything else you listen to.</b>
</p>

<p align="center">&nbsp;</p>

<div align="center">
  <img src="https://img.shields.io/badge/License-MIT-efcefa?style=flat-square" alt="License" />
  <img src="https://img.shields.io/badge/Electron-desktop-bae6fd?style=flat-square" alt="Electron" />
  <img src="https://img.shields.io/badge/Vite-7-bbf7d0?style=flat-square" alt="Vite" />
  <img src="https://img.shields.io/badge/React-19-ffdac1?style=flat-square" alt="React" />
  <img src="https://img.shields.io/badge/three--vrm-3.4-fecdd3?style=flat-square" alt="three-vrm" />
  <a href="https://booth.pm/"><img src="https://img.shields.io/badge/BOOTH-assets-e9d5ff?style=flat-square" alt="BOOTH" /></a>
  <a href="https://vroid.com/"><img src="https://img.shields.io/badge/VRoid-compatible-efcefa?style=flat-square" alt="VRoid" /></a>
</div>

<p align="center">&nbsp;</p>

<p align="center">
  Animate cloud APIs, web apps, or local LLMs with a VRM character that lipsyncs and moves while you work.<br />
  Or keep a companion on screen while you study, watch a video, hear a podcast, speech, or audiobook — a character that follows the audio instead of a blank background.
</p>

<p align="center">
  <a href="#quick-start">Quick Start</a> ·
  <a href="docs/README.md">Documentation</a> ·
  <a href="docs/getting-started/installation.md">Install</a> ·
  <a href="docs/avatars-and-skins.md">Avatars</a> ·
  <a href="docs/environments.md">Environments</a> ·
  <a href="docs/user-settings.md">Settings</a> ·
  <a href="docs/assets-and-credits.md">Assets & Credits</a> ·
  <a href="CHANGELOG.md">Changelog</a> ·
  <a href="CITATION.cff">Cite</a>
</p>

---

**AVATAR** is an open-source **desktop companion** from ARPA. The primary experience is the **Electron app** (transparent always-on-top overlay, with a Windows **`.exe`** installer planned). The browser / localhost Vite app is for **development and contributors**.

It renders `.vrm` models, plays `.vrma` motion, and drives mouth shapes from live audio — including system / device output on desktop.

## What this is

- **Electron desktop overlay** — main product surface (pin, snap, window scale, device loopback audio)
- **VRM avatars & skins** — `avatar1.vrm` … drop-in naming; skins as `avatar1B.vrm`, etc.
- **Environments** — built-in GIFs, Custom folder, color fade, or none
- **Persistent settings** — `config.yaml` remembers avatar, skin, camera, lighting, environment, and more
- **VRMA animations** — Default greeting + loop, plus individual clips
- **Browser / localhost** — optional for UI development (`npm run dev`)

## Quick start

Requires **Node.js 20+** and **npm**.

### Desktop (recommended)

```bash
cd avatar-demo
npm install
npm run dev:desktop
```

Production desktop window:

```bash
npm run desktop
```

A packaged Windows **`.exe`** installer is planned for end users who should not need Node.

Gear menu: Appearance (Avatars · Skins · Environments) · Voice · Camera · Animations · Settings. Scale control sits next to the gear.

### Browser (dev / contributors)

```bash
cd avatar-demo
npm run dev
```

Open [http://localhost:5173](http://localhost:5173). Prefer Electron when testing lip sync against system audio.

### Try lip sync

1. Gear → **Voice** → Device output (desktop) or Microphone / Tab (browser)
2. Green pulsating dot next to the gear = active

### Try animations

Gear → **Animations** → **Default** (greeting, then motion loop).

### Swap avatars

Drop `avatar4.vrm` (or `avatar1B.vrm` for a skin) into `avatar-demo/src/assets/avatars/`, restart desktop, pick it under Appearance. See [Avatars & skins](docs/avatars-and-skins.md).

## Documentation

| Topic | Links |
| :--- | :--- |
| **Getting started** | [Install](docs/getting-started/installation.md) · [First session](docs/getting-started/first-session.md) |
| **Characters** | [Avatars & skins](docs/avatars-and-skins.md) · [Environments](docs/environments.md) |
| **Architecture** | [Overview](docs/architecture/overview.md) · [Layout](docs/development/project-layout.md) |
| **Animations** | [VRMA](docs/animations/vrma.md) · [Manual testing](docs/animations/manual-testing.md) |
| **Voice** | [Lip sync](docs/voice/lip-sync.md) · [Audio sources](docs/voice/audio-sources.md) |
| **Assets** | [Assets & credits](docs/assets-and-credits.md) |
| **Cite** | [CITATION.cff](CITATION.cff) · [Changelog](CHANGELOG.md) |

## Repository layout

```text
avatar/
├── docs/
├── avatar-demo/
│   ├── electron/
│   ├── public/
│   └── src/
│       ├── assets/avatars/
│       └── assets/environments/
├── CHANGELOG.md
├── CITATION.cff
└── README.md
```

## Assets & licensing (summary)

Sample characters are made in **VRoid Studio** / **VRoid Hub** with free setups — **no paid models or wearables** are used in this repo.

Bundled motions are the **7 free VRMA files** from the **VRoid Project** on [BOOTH](https://booth.pm/) (2024). Copyright remains with **pixiv Inc.** Commercial use requires:

> Animation credits to pixiv Inc.'s VRoid Project  
> （キャラクターアニメーション: ピクシブ株式会社 VRoidプロジェクト）

Full terms: **[docs/assets-and-credits.md](docs/assets-and-credits.md)** · Rights holders: **input@arpacorp.net**

## Privacy

Runs locally. Audio uses Web APIs / Electron loopback; nothing is uploaded.

---

<div align="center">
  <img src="https://raw.githubusercontent.com/ARPAHLS/.github/main/Group%202061.png" alt="ARPA Logo" width="50" />
  <br />
  <sub>Built & Maintained by <strong>ARPA Hellenic Logical Systems</strong></sub>
</div>
