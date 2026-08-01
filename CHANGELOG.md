# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

## [0.2.0] — 2026-08-01

### Added

- Windows **NSIS installer** (`npm run dist:win`) writing artifacts to gitignored `desktop-setup/`.
- Installer branding: `installer_side.png`, `installer_top.png`, logo, and EULA (`build/installer-license.txt`).
- App launch **splash**: transparent AVATAR mark with physics-style spin (accelerate → cruise → brake → fade) until the companion is ready.
- Product screenshots under `docs/screenshots/` embedded in README and feature guides.
- `custom/` environment media is local-only (gitignored); folder kept with `.gitkeep`.
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

## [0.1.0] — 2026-07-31

- Initial scaffold: VRM stage, VRMA motion pack, browser lip sync, Electron overlay shell.
