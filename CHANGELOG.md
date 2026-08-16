# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added

- **Reactive glass-bar live dot** — when an audio source is selected, the 8px indicator shows waiting (amber), live quiet→loud (mint→green from analyser level), or error (coral), instead of a binary always-green pulse. Amplitude updates via a level ref on the dot node so the bar does not take an extra React state path for loudness. (#42)

### Changed

- README Animations sample uses `AVATAR_31_speak.gif` (lip-sync / speak loop) instead of the older default-loop clip.
- Settings section **Motion** is now **Animation hotkeys** (same `motionDeck` settings). The Add-animation picker and the deck list keep the mouse wheel until they hit the end of their own scroll, then the Settings drawer scrolls again.
- **Voice panel and docs spell out capture status and privacy.** Gear → **Voice** shows plain-language status (`Starting capture…`, `Capturing (local)`, …) instead of raw tokens, keeps a local-only privacy note next to the source picker, and turns permission failures into actionable copy (with a desktop button into system privacy settings on Windows/macOS). [Audio sources](docs/voice/audio-sources.md) expands permissions troubleshooting and a short “what stays local” section; the README privacy line matches. (#12)

### Fixed

- Custom environment tiles in Appearance stay one size (portrait 3∶4): long filenames truncate with an ellipsis on a single line under the thumb.

## [0.7.0] — 2026-08-16

### Added

- **Motion Deck** — Settings → **Motion**. Build a shortlist of clips and fire one with a key (`F3`, `Ctrl+Shift+P`, …) or by clicking its name in the deck. It plays **once** and then the Gear → **Animations** selection comes back; `animationId` in `config.yaml` is never touched, so a gesture cannot cost you the Default sequence you were running. Deliberately a shortlist rather than a bind control on every row of the catalog: hotkeys are as many as you have fingers, while a custom `.vrma` folder can hold hundreds of clips. Switching Directories → **Animations** to another folder does **not** delete cards — ones it cannot resolve are marked unavailable and keep their keys reserved, and come back when the folder does; **Clear unavailable** is the only sweep. Cards remember the clip's name, so moving or renaming the folder (which changes every id, since custom ids are derived from the file path) re-points them instead of orphaning them, provided exactly one clip still matches the name. Keys are live only while the AVATAR window has focus. See [User settings](docs/user-settings.md#motion-deck-motiondeck). (#24, #51)
- Maintainer [release checklist](docs/development/release-checklist.md) for version bumps, installer build, and GitHub Release publish. (#28, #47)
- **Custom animations folder** — Settings → Directories → **Animations** is no longer greyed out. Point it at a folder of `.vrma` files and Gear → **Animations** lists those clips instead of the bundled catalog (**replace** semantics, like Avatars; flat top-level scan, file names become labels). A folder with no `.vrma` is not applied, an unreadable clip is skipped and counted rather than costing you the folder, and the selection is matched by file path so it survives restarts and rescans. Licensing for your own clips is yours — authoring routes and the VRMA spec are linked from [VRMA](docs/animations/vrma.md#bring-your-own-vrma). (#23, #45)

### Changed

- Reorganize [Roadmap](docs/development/roadmap.md): grouped **Next** work, add **Later / vision** (local AI, hardware, personalization, social), and list landings on `main` since v0.6.0.
- **Environment pickers draw still posters, not the stage assets.** Opening Gear → **Appearance** → **Environments** used to hand the compositor the three bundled GIFs — ~32MB and ~480 frames between them — to play inside 40px boxes, and it loaded all three whether or not one was selected. Built-ins now ship a committed 192×112 poster (`src/assets/environments/thumbs/`, regenerate with `npm run thumbs`), so a GIF is loaded only for the environment actually on stage. Custom-folder tiles get the same treatment at runtime: a poster is generated once per file and cached under Electron `userData/thumbnails/`, alongside avatar portraits. Only the picker changes — the stage still animates. (#22, #49)
- **A custom environments folder is no longer read into memory up front.** Configuring the folder used to pull every file in it fully into the renderer as a blob URL, before the Custom expander had even been opened; blob URLs pin their bytes, so a folder of large GIFs stayed resident for the session. Files are now read one at a time, only for the environment being selected. The stage holds the current background until the new one is ready rather than blanking, and the read moved off the Electron main process so a large image no longer stalls the window. (#22, #49)
- **The stage has a command layer.** Every state change a trigger can ask for — `animation.play`, `animation.default`, `avatar.set`, `environment.set`, `audio.source` — now goes through one validated entry point instead of the panels receiving `AvatarStage`'s `useState` setters directly. `resolveStageCommand` (pure, unit-tested) turns a request into an action or an error code; `useStageCommands` is the only thing that applies one, so the sequences that are easy to get wrong exist once: the replay counter that makes re-selecting the current clip restart it, and the ordering that keeps an avatar swap from stalling the stage. Animations match by label as well as id, so a caller can ask for `Peace Sign` without knowing that a custom folder hashes ids from file paths. Groundwork for the local agent bus, animation hotkeys, and keyword triggers, which should all drive the same actions rather than reimplement them (#6, #24, #7, #50). No user-visible change, with one exception: a hand-edited `config.yaml` whose `environment` is malformed (an `env` with no `id`, a non-hex colour, a value with no `type`) now falls back to the default colour instead of being half-accepted, matching how every other unreadable field is treated.
- **The stage command layer can play a clip without selecting it.** `animation.play` takes a `mode` — `select` (the default, and what the Animations menu sends) or `once`, which overlays a single pass and leaves the selection, and therefore `config.yaml`, alone; `animation.stop` ends one early. `once` is refused for anything that cannot end on its own, such as the looping Default sequence. This is the layer the Motion Deck sits on, and is meant to be the same one the local agent bus and keyword triggers use. Resuming after a one-shot skips the Default sequence's greeting, so a gesture does not make the avatar say hello each time. Interrupting a one-shot also no longer strands its `finished` listener on the mixer for the life of the model — harmless when the only way to reach it was the Animations menu, less so now that a key press can. (#6, #7, #24, #51)
- `npm test` now also runs renderer unit tests (`src/**/*.test.mjs`), starting with the animation catalog lookups. To make them loadable by plain Node, `src/config/animations.js` is split into `vrmaAssets.js` (Vite-resolved `.vrma` imports), `animationLookup.js` (pure lookups), and a composing entry point that re-exports both — the public API is unchanged. See [Contributing → Where tests go](CONTRIBUTING.md#where-tests-go). (#23, #45)
- Remove the README CI status badge; workflow status stays on the Actions tab.
- README badge: replace misleading **BOOTH VRM** (linked to vrm.dev) with **VRM Docs** → https://vrm.dev/en/.

### Fixed

- **Clicking the avatar already on stage no longer hides it.** Appearance → **Avatars** cleared the ready flag on every click, but re-picking the current character does not change the model path, so the VRM never reloaded and the callback that brings the stage back never fired — the companion vanished until you picked a different avatar or restarted. The flag is now cleared only when the model actually reloads; a loaded VRoid Hub character still counts as one, since it owns the model path while active. (#6, #50)
- Local `custom/` environment media is dropped from **every** production build, not just `dist:win` — `npm run build` and `npm run desktop` no longer hash contributor trial GIFs into `dist/`. Only the dev server reads the folder; `AVATAR_INCLUDE_CUSTOM=1` opts a production build back in. Replaces the `AVATAR_SHIP=1` flag, which is removed. A reformat or rename of the glob now fails the build instead of silently bundling the folder, and `npm test` covers the embargo (`scripts/custom-envs.test.mjs`) — a clean checkout has an empty `custom/`, so a green build proves nothing on its own. (#13, #44)

## [0.6.0] — 2026-08-07

### Added

- GitHub Actions CI on pull requests and `main`: `npm ci` → `lint` → `test` → `build` in `avatar/` (Node 22; Electron binary download skipped). See [Contributing](CONTRIBUTING.md#continuous-integration) and [Project layout](docs/development/project-layout.md). (#4, #35)
- README CI status badge.

### Changed

- Rename the app package directory from `avatar-demo/` to `avatar/`. Contributor paths (`cd avatar`, docs, `.gitignore`) updated; the Windows installer is unchanged.
- Docs and README: add desktop companion GIFs (`AVATAR_M5_*`) for overlay, Settings scroll, animations, custom environments, and Camera & Lighting. (#3, #32)
- ESLint covers `src/`, `electron/**/*.cjs`, and build scripts (`scripts/`, config files); `npm run lint` enforces `--max-warnings=0`. (#34)
- Expand [Contributing](CONTRIBUTING.md) for ripple effects, changelog style with issue/PR numbers, CI expectations, and guidance for human and AI contributors.
- Add Heng-Cheng Hsu (許恒誠) to [`CITATION.cff`](CITATION.cff) authors and preferred citation. (#41)

### Fixed

- Capture the Three.js group once in `VrmAvatar` so effect cleanup detaches from the same container the model was attached to (avoids orphan scenes on avatar swap). (#34)
- Drop unused `audioFile` prop from `VoicePanel` (file input is uncontrolled). (#34)
- `npm run dev:desktop` now passes `concurrently -k` so closing the Electron window (or killing Vite) tears down both processes and frees port 5173. (#37, #38)
- Custom environment library blob URLs are revoked only after the replacement list is in state, so the stage/picker never briefly reference dead `blob:` URLs while a Directories folder switch loads. (#39, #40)

## [0.5.0] — 2026-08-06

### Added

- **View on VRoid Hub** link in the hearted-model conditions-of-use gate (Electron): the terms are the author's, so the gate now points back to the model's own Hub page instead of stating them with no traceable source. Omitted for models whose Hub response carries no character id. See [VRoid Hub connection](docs/vroid-hub.md). (#18, #19)
- Issue reporting checklist in `CONTRIBUTING.md` (templates, version/OS/run mode, bug vs feature framing, screenshots). (#27, #30)

### Changed

- **Appearance picker performance**: avatar thumbnails are static images instead of live VRM previews, so opening Appearance no longer stands up a 3D scene per card. Bundled avatars ship pre-rendered portraits (`src/assets/avatars/thumbs/`, regenerate with `npm run thumbs`); custom-folder avatars render once and are cached under Electron `userData/thumbnails/`, keyed by path plus file mtime and size so a replaced `.vrm` regenerates. First scan of a new custom folder still fills in progressively. (#10, #20)
- Document credits for built-in environment GIFs (GIPHY: Stars / Lemat Works, Code / Justin, Bloom).
- Rename the avatars guide to `docs/avatars.md` and document `skinId: default` as a reserved legacy field. (#25, #31)

### Fixed

- Swapping avatars released the model from the scene graph but never disposed it, stranding each previous model's geometries, materials, and textures in VRAM for the rest of the session. (#20)
- `npm run dev:desktop` waited on `127.0.0.1` while Vite bound `localhost` (`::1` on Windows), so Electron never launched and the script silently left a bare Vite server running. The dev port is now pinned with `--strictPort`. (#20)

## [0.4.0] — 2026-08-04

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
