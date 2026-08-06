<div align="center">
  <img src="avatar-demo/public/AVATAR_SPLASH.png" alt="AVATAR" width="420" />
</div>

<p align="center">
  <b>Give a face to your AI — and anything else you listen to.</b>
</p>

<p align="center">&nbsp;</p>

<div align="center">
  <a href="https://github.com/ARPAHLS/avatar/releases/download/v0.4.0/AVATAR-Setup-0.4.0.exe"><img src="https://img.shields.io/badge/Version-0.4.0-b8d4f0?style=flat-square" alt="Version 0.4.0" /></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-ffb38a?style=flat-square" alt="License MIT" /></a>
  <a href="https://vrm.dev/ja/"><img src="https://img.shields.io/badge/BOOTH-VRM-f87171?style=flat-square" alt="BOOTH VRM" /></a>
  <a href="https://hub.vroid.com/en/"><img src="https://img.shields.io/badge/VRoid-Hub-f0d78c?style=flat-square" alt="VRoid Hub" /></a>
</div>

<p align="center">
  <a href="https://doi.org/10.5281/zenodo.21791157"><img src="https://img.shields.io/badge/DOI-10.5281%2Fzenodo.21791157-5b9fd4?style=flat-square" alt="DOI 10.5281/zenodo.21791157" /></a>
</p>

<p align="center">&nbsp;</p>

<p align="center">
  Animate cloud APIs, web apps, or local LLMs with a VRM character that lipsyncs and moves while you work.<br />
  Or keep a companion on screen while you study, watch a video, hear a podcast, speech, or audiobook — a character that follows the audio instead of a blank background.
</p>

<p align="center">
  <img src="docs/screenshots/91-multi-avatar-strip.png" alt="Avatar 1, 2, 3, and 4" height="260" />
</p>

<p align="center">
  <a href="#quick-start">Quick Start</a> ·
  <a href="https://github.com/ARPAHLS/avatar/releases/download/v0.4.0/AVATAR-Setup-0.4.0.exe">Download .exe</a> ·
  <a href="docs/using-the-app.md">User guide</a> ·
  <a href="docs/README.md">Documentation</a> ·
  <a href="docs/getting-started/installation.md">Install</a> ·
  <a href="docs/avatars.md">Avatars</a> ·
  <a href="docs/environments.md">Environments</a> ·
  <a href="docs/voice/audio-sources.md">Voice</a> ·
  <a href="docs/vroid-hub.md">VRoid Hub</a> ·
  <a href="docs/animations/vrma.md">Animations</a> ·
  <a href="docs/user-settings.md">Settings</a> ·
  <a href="docs/assets-and-credits.md">Assets & Credits</a> ·
  <a href="CHANGELOG.md">Changelog</a> ·
  <a href="CITATION.cff">Cite</a>
</p>

---

**AVATAR** is an open-source **desktop companion** from ARPA. The primary experience is the **Electron** transparent always-on-top overlay. A Windows **[`.exe` installer](https://github.com/ARPAHLS/avatar/releases/download/v0.4.0/AVATAR-Setup-0.4.0.exe)** is available for end users. The browser / localhost Vite app is for **development and contributors**.

It renders `.vrm` models, plays `.vrma` motion, and drives mouth shapes from live audio — including system / device output on desktop.

## What this is

- **Electron desktop overlay** — pin, snap, window scale, device loopback ([user guide](docs/using-the-app.md) · [settings](docs/user-settings.md))
- **VRM avatars** — bundled samples, plus your own `.vrm` folder from Settings → Directories ([avatars](docs/avatars.md))
- **VRoid Hub** — bring-your-own OAuth app; connect in Settings, pick characters in Appearance ([VRoid Hub](docs/vroid-hub.md))
- **Environments** — built-ins, Custom folder from Settings → Directories, color fade, or none ([environments](docs/environments.md))
- **Persistent settings** — `config.yaml` across launches ([user settings](docs/user-settings.md))
- **VRMA animations** — Default greeting + loop, plus clips ([VRMA](docs/animations/vrma.md))
- **Browser / localhost** — for contributors ([install](docs/getting-started/installation.md))

<p align="center">
  <img src="docs/screenshots/01-hero-overlay-dark-ide.png" alt="AVATAR overlay on a dark IDE" width="100%" />
</p>

## Quick start

### 1. Windows installer (easiest)

Download **[AVATAR-Setup-0.4.0.exe](https://github.com/ARPAHLS/avatar/releases/download/v0.4.0/AVATAR-Setup-0.4.0.exe)** — no Node.js. Run the installer, accept the EULA, launch **AVATAR**.

([All releases](https://github.com/ARPAHLS/avatar/releases) · [install notes](docs/getting-started/installation.md))

### 2. Desktop from source (Electron)

Requires **Node.js 20+** and **npm**:

```bash
cd avatar-demo
npm install
npm run desktop
```

### 3. Web app (browser)

```bash
cd avatar-demo
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173). Prefer Electron when testing lip sync against system audio.

---

Gear menu: Appearance (Avatars · Environments) · Voice · Camera · Animations · Settings. Scale control sits next to the gear.

**First launch behavior:** Greeting once, then a looping motion set; desktop audio defaults to device output; preferences restore from `config.yaml` on later launches. Full walkthrough: [Using the app](docs/using-the-app.md) · [First session](docs/getting-started/first-session.md).

<p align="center">
  <img src="docs/screenshots/20-gear-main.png" alt="Gear menu" height="220" />
  <img src="docs/screenshots/12-scale-menu.png" alt="Window scale menu" height="220" />
</p>

### Try lip sync

1. Gear → **Voice** → Device output (desktop) or Microphone / Tab (browser)
2. Green pulsating dot next to the gear = active

More: [Audio sources](docs/voice/audio-sources.md) · [Lip sync](docs/voice/lip-sync.md) · [Using the app → Voice](docs/using-the-app.md#4-voice--lip-sync)

<p align="center">
  <img src="docs/screenshots/50-voice-panel.png" alt="Voice panel" height="220" />
  <img src="docs/screenshots/11-bar-live-dot.png" alt="Lip sync live dot on the bar" height="220" />
</p>

### Try animations

Gear → **Animations** → **Default** (greeting, then motion loop). Catalog: [VRMA animations](docs/animations/vrma.md).

<p align="center">
  <img src="docs/screenshots/21-gear-animations.png" alt="Animations submenu" height="260" />
</p>

### Swap avatars

**Desktop / installer:** Gear → **Settings** → **Directories** → **Avatars** → **Custom**, pick a folder of `.vrm` files. Appearance then shows that list. You can also use **VRoid Hub** under Appearance. Guide: [Avatars](docs/avatars.md) · [VRoid Hub](docs/vroid-hub.md).

**From source (contributors):** drop `avatar4.vrm` into `avatar-demo/src/assets/avatars/` and restart — naming is covered in the avatars guide.

### Custom environments

**Desktop / installer:** Gear → **Settings** → **Directories** → **Environments** → **Custom**, pick a folder of `.gif` / `.png` / `.jpg` / `.jpeg`. Built-ins stay; Appearance → Environments gains a **Custom** expander. Guide: [Environments](docs/environments.md).

**From source (contributors):** trial files can also go in `avatar-demo/src/assets/environments/custom/` while Directories is Default (local only; not shipped in the installer).

## Documentation

| Topic | Links |
| :--- | :--- |
| **User guide** | [Using the app](docs/using-the-app.md) |
| **Getting started** | [Install](docs/getting-started/installation.md) · [First session](docs/getting-started/first-session.md) |
| **Download** | [AVATAR-Setup-0.4.0.exe](https://github.com/ARPAHLS/avatar/releases/download/v0.4.0/AVATAR-Setup-0.4.0.exe) · [v0.4.0 release](https://github.com/ARPAHLS/avatar/releases/tag/v0.4.0) |
| **Characters & stage** | [Avatars](docs/avatars.md) · [Environments](docs/environments.md) · [Camera & lighting](docs/camera-and-lighting.md) |
| **Motion & voice** | [VRMA](docs/animations/vrma.md) · [Audio sources](docs/voice/audio-sources.md) · [Lip sync](docs/voice/lip-sync.md) |
| **VRoid Hub** | [VRoid Hub connection](docs/vroid-hub.md) |
| **Settings** | [config.yaml & resets](docs/user-settings.md) |
| **Architecture** | [Overview](docs/architecture/overview.md) · [Layout](docs/development/project-layout.md) |
| **Assets** | [Assets & credits](docs/assets-and-credits.md) |
| **Cite** | [CITATION.cff](CITATION.cff) · [Changelog](CHANGELOG.md) |

## Repository layout

```text
avatar/
├── docs/
│   ├── using-the-app.md
│   ├── screenshots/
│   └── …
├── avatar-demo/
│   ├── electron/
│   ├── public/
│   └── src/
│       ├── assets/avatars/
│       └── assets/environments/
│           ├── stars.gif / code.gif / bloom.gif
│           └── custom/
├── CHANGELOG.md
├── CITATION.cff
└── README.md
```

## Assets & licensing (summary)

Sample characters are made in **VRoid Studio** / **VRoid Hub** with free setups — **no paid models or wearables** are used in this repo.

Bundled motions are the **7 free VRMA files** from the **VRoid Project** on [BOOTH](https://booth.pm/) (2024). Copyright remains with **pixiv Inc.** Commercial use requires:

> Animation credits to pixiv Inc.'s VRoid Project  
> （キャラクターアニメーション: ピクシブ株式会社 VRoidプロジェクト）

Built-in environment GIFs (Stars / Code / Bloom) are from [GIPHY](https://giphy.com/) — credits in [Assets & credits](docs/assets-and-credits.md#built-in-environment-gifs).

Full terms: **[docs/assets-and-credits.md](docs/assets-and-credits.md)** · Rights holders: **input@arpacorp.net**

Beyond the bundled samples, you can bring your own characters and backdrops: **Settings → Directories** (local `.vrm` / image folders) and **VRoid Hub** (linked characters, session-only). See [Avatars](docs/avatars.md) · [Environments](docs/environments.md) · [VRoid Hub](docs/vroid-hub.md) · [Using the app](docs/using-the-app.md).

## Privacy

Runs locally. Audio uses Web APIs / Electron loopback; nothing is uploaded. See [audio sources](docs/voice/audio-sources.md) for capture options.

---

<div align="center">
  <img src="https://raw.githubusercontent.com/ARPAHLS/.github/main/Group%202061.png" alt="ARPA Logo" width="50" />
  <br />
  <sub>Built & Maintained by <strong>ARPA Hellenic Logical Systems</strong></sub>
</div>
