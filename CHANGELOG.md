# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added

- Electron desktop companion as the primary product surface (transparent overlay, always-on-top).
- Window scale presets (×0.5 / ×1 / ×2) via bar control; snap corners; pin / windowed mode.
- Gear command menu with Appearance, Voice, Camera, Animations, Settings, and Close.
- Appearance → **Avatars** and **Skins** (separate sections); drop-in `avatarN.vrm` / `avatarNB.vrm` catalog via Vite glob.
- Bundled characters as `avatar1.vrm`, `avatar2.vrm`, `avatar3.vrm`.
- Environments: Stars / Code / Bloom, None, color fade, and expandable **Custom** GIF library (`src/assets/environments/custom/`).
- Auto-contrast glass bar chrome (whitish on dark scenes; silver/greyscale only on clearly light backdrops).
- Persistent **`config.yaml`** preferences (Electron `userData`; browser localStorage fallback) with **Reset all settings**.
- Default animation sequence (Greeting once, then model pose → full body → peace → squat → shoot loop).
- Voice panel with browser capture and Electron device/window loopback lip sync; live indicator as pulsating bar dot.
- AVATAR branding assets (`AVATAR_SPLASH`, `AVATAR_LOGO_150` as Electron / favicon icon).
- Docs: Electron-first install & first session, [avatars & skins](docs/avatars-and-skins.md), [environments](docs/environments.md), [user settings](docs/user-settings.md), [assets & credits](docs/assets-and-credits.md) (VRoid / BOOTH / Pixiv terms, `input@arpacorp.net`).
- [`CITATION.cff`](CITATION.cff) for software citation.

### Changed

- Rebranded from VOX Avatar to **AVATAR**; README narrative focuses on Electron (browser = dev/contributors).
- Gear glass drawers replace the old hover options bar.
- Voice moved out of Appearance into its own gear item (microphone).
- Default camera Y lowered (`0.76` → `0.59`) so avatar heads stay in frame.
- Animations menu expands fully (no scrollbar); back control is circular like other gear buttons.
- Environment GIFs sourced only from `src/assets/environments/` (duplicates removed from `public/`).
- Public OSS wording across README and docs (no “private preview” framing).

## [0.1.0] — 2026-07-31

- Initial scaffold: VRM stage, VRMA motion pack, browser lip sync, Electron overlay shell.
