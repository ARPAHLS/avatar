# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added

- **Settings → Directories** (Electron): choose **Default** or **Custom** folders for avatars (`.vrm`, replaces built-in list) and environments (`.gif` / `.png` / `.jpg` / `.jpeg`, additive Custom expander). Animations Custom is reserved as coming soon. Empty folders are rejected with an in-panel error (defaults stay). Choices persist in `config.yaml` under `directories`. See [User settings](docs/user-settings.md).
- Zenodo concept DOI [`10.5281/zenodo.21791157`](https://doi.org/10.5281/zenodo.21791157) in [`CITATION.cff`](CITATION.cff) and README badge.

### Changed

- End-user personalization path: bundled samples → VRoid Hub and/or local directories (dev `environments/custom/` remains contributor-only).
- Settings layout: shared section titles (**Overlay mode**, **Snap to screen**, **Directories**, **VRoid Hub**, **System**); Appearance Hub block labeled **VRoid Hub** (no “(optional)”).
- Docs and screenshots updated for Directories, custom avatar/env folders, and a four-avatar strip (`91-multi-avatar-strip.png`).

### Removed

- Appearance → **Skins** (lettered `avatarNB.vrm` variants). Extra characters come from Settings → Directories or VRoid Hub instead.

## [0.3.0] — 2026-08-04

### Added

- GitHub issue templates (bug, feature, question, docs, installer, voice/lip-sync, avatar/VRMA, desktop window) and pastel label set with CI sync (`.github/labels.yml`).
- **VRoid Hub account connection** (Electron-only, opt-in): bring your own OAuth app, connect in **Settings**, browse/select characters under **Appearance → Avatars**. Hearted models show conditions of use before load. Hub VRMs stay **session-only** (not written to disk / `config.yaml`). See [VRoid Hub connection](docs/vroid-hub.md).
- Step-by-step VRoid Hub docs (OAuth app fields, redirect URI, connect flow, Appearance picker, storage, troubleshooting) plus dedicated screenshots under `docs/screenshots/70-*.png`.

### Changed

- Expanded [CONTRIBUTING.md](CONTRIBUTING.md) with ripple-effect guidance (docs, changelog, catalogs, Electron vs browser, assets).
- VRoid Hub UX: Settings is account/credentials only; character grid and selection live in Appearance → Avatars (with connect deep-link when not set up).
- Hub model download path: clearer in-app loading/error status, transient-network retries, and terminal `[vroid]` progress logs.
- Windows installer art is unversioned (generic **AVATAR Installer** header / sidebar) so assets can ship across releases until a major redesign.
- Installer wizard welcome/finish copy branded as **AVATAR Installer**.

### Fixed

- Settings drawer no longer clips content taller than the visible window with no way to reach it (a `--stage-bar-height` CSS custom property wasn't inheriting to the drawer, so it never detected its own overflow).
- VRM 1.0 avatars no longer face away from the camera. The avatar's own transform was overwriting the per-model facing correction every frame, so every model got the 180° turn only VRM 0.0 needs. Existing `config.yaml` files are migrated automatically (settings version 2).
- Appearance mini-avatar thumbnails faced the wrong way after the VRM facing fix; preview rotation corrected so thumbs and stage both face forward.

## [0.2.0] — 2026-08-01

### Added

- Windows **NSIS installer** (`npm run dist:win`).
- Installer branding: `installer_side.png`, `installer_top.png`, logo, and EULA (`build/installer-license.txt`).
- Product screenshots under `docs/screenshots/` embedded in README and feature guides.
- `custom/` environment media is local-only (not committed); folder kept with `.gitkeep`.
- Electron desktop companion as the primary product surface (transparent overlay, always-on-top).
- Window scale presets (×0.5 / ×1 / ×2); pin / windowed mode; **3×3 snap pad**.
- Gear command menu with Appearance, Voice, Camera, Animations, Settings, and Close.
- Appearance → Avatars / Skins / Environments (built-ins, Custom, color fade, none).
- Persistent **`config.yaml`** preferences with **Reset all settings**.
- Default animation sequence and individual VRMA clips.
- Voice panel with desktop device/window loopback lip sync; live green bar dot.
- Overlay chrome adaptation (on-demand desktop luma sampling).
- End-user docs suite + [`CITATION.cff`](CITATION.cff).

### Changed

- Rebranded from VOX Avatar to **AVATAR**; README focuses on Electron.
- Environments UI: Custom scroll block with pinned Color fade (**Use color** / **Reset**).
- Voice audio source uses a themed portaled select (no OS blue highlight / drawer jump).
- Glass bar/button contrast pairing for dark vs light backdrops.
- Removed unused early-iteration assets and dead UI code.
- Installer EULA is ASCII-only (NSIS license page encoding).
- `dist:win` ships with empty Custom environments (local trial GIFs not packaged).
- Windows `.exe` / shortcuts embed the AVATAR mark (post-pack icon write).
- Removed launch splash window (show companion when ready).

## [0.1.0] — 2026-07-31

- Initial scaffold: VRM stage, VRMA motion pack, browser lip sync, Electron overlay shell.
