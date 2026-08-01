# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added

- Product screenshots under `docs/screenshots/` embedded in README and feature guides (full-width for desktop heroes; fixed height for window/drawer rows). Animation stills (H) deferred.
- `custom/` environment media is local-only (gitignored); folder kept with `.gitkeep`. Docs explain drop-in workflow.
- Electron desktop companion as the primary product surface (transparent overlay, always-on-top).
- Window scale presets (×0.5 / ×1 / ×2) via bar control; pin / windowed mode.
- Gear command menu with Appearance, Voice, Camera, Animations, Settings, and Close.
- Appearance → **Avatars** and **Skins** (separate sections); drop-in `avatarN.vrm` / `avatarNB.vrm` catalog via Vite glob.
- Bundled characters as `avatar1.vrm`, `avatar2.vrm`, `avatar3.vrm`.
- Environments: Stars / Code / Bloom, None, color fade, and local **Custom** trial folder (`src/assets/environments/custom/` — media not in git).
- Persistent **`config.yaml`** preferences (Electron `userData`; browser localStorage fallback) with **Reset all settings**.
- Default animation sequence (Greeting once, then model pose → full body → peace → squat → shoot loop).
- Voice panel with browser capture and Electron device/window loopback lip sync; live indicator as pulsating bar dot.
- AVATAR branding assets (`AVATAR_SPLASH`, `AVATAR_LOGO_150` as Electron / favicon icon).
- **3×3 snap pad** in Settings (nine screen anchors) with a highlighted selected cell; highlight clears after a manual drag so the pad reflects “snapped” vs free placement.
- Overlay chrome adaptation: bar/buttons follow light vs dark content **behind** the glass bar (environment GIFs themselves are unchanged). Sampling runs **on demand** (window settled after move/snap, focus, overlay start)—not on a continuous screen-capture timer—so drag stays responsive while CSS still crossfades colors (~0.85s).
- End-user docs: [using the app](docs/using-the-app.md), [camera & lighting](docs/camera-and-lighting.md), expanded first session / voice / animations / environments / [user settings](docs/user-settings.md), plus [assets & credits](docs/assets-and-credits.md) (`input@arpacorp.net`).
- [`CITATION.cff`](CITATION.cff) for software citation.

### Changed

- Rebranded from VOX Avatar to **AVATAR**; README narrative focuses on Electron (browser = dev/contributors).
- Gear glass drawers replace the old hover options bar.
- Voice moved out of Appearance into its own gear item (microphone).
- Default camera framing tuned (`X = -0.01`, `Y = 0.59`) so avatars sit centered with heads in frame.
- Animations menu expands fully (no scrollbar); back control is circular like other gear buttons.
- Environment GIFs sourced only from `src/assets/environments/` (duplicates removed from `public/`).
- Five text snap buttons replaced by a **smaller 3×3 pad** so Settings (including Reset all + config path) fits without losing footer content.
- Appearance → Environments: Custom scrolls in the upper block; Color fade row keeps **Use color** + **Reset** on one visible line under it (no clipped second button).
- Voice audio source uses a small portaled lilac popup (scroll stays inside the menu; drawer width/text no longer jump).
- Glass **bar** contrast kept as whitish-on-dark / grey-on-light (readable on both desktops). **Buttons only** use the inverted pairing: darker glass + white icons on dark backdrops, lighter glass + dark icons on light backdrops—so controls stay visible without fighting the bar look.
- Continuous desktop luma polling removed after it made window dragging laggy (repeated `desktopCapturer` thumbnails). Same chrome goal kept via settle/focus sampling + existing color-variable transitions.
- Remove unused iteration leftovers: `model.vroid`, public FBX/GLB/`vite.svg`, scaffold `react.svg`, dead `proceduralAnimations` / `AnimationSelector`, unused `react-icons`, and orphaned CSS/exports.

## [0.1.0] — 2026-07-31

- Initial scaffold: VRM stage, VRMA motion pack, browser lip sync, Electron overlay shell.
