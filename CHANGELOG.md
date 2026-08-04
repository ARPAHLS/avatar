# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added

- GitHub issue templates (bug, feature, question, docs, installer, voice/lip-sync, avatar/VRMA, desktop window) and pastel label set with CI sync (`.github/labels.yml`).
- **VRoid Hub account connection**: bring your own OAuth app, sign in, and use a character you own or have hearted from Settings → VRoid Hub. Opt-in, off by default, Electron-only. See [VRoid Hub connection](docs/vroid-hub.md).

### Changed

- Expanded [CONTRIBUTING.md](CONTRIBUTING.md) with ripple-effect guidance (docs, changelog, catalogs, Electron vs browser, assets).

### Fixed

- Settings drawer no longer clips content taller than the visible window with no way to reach it (a `--stage-bar-height` CSS custom property wasn't inheriting to the drawer, so it never detected its own overflow).
- VRM 1.0 avatars no longer face away from the camera. The avatar's own transform was overwriting the per-model facing correction every frame, so every model got the 180° turn only VRM 0.0 needs. Existing `config.yaml` files are migrated automatically (settings version 2).

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
