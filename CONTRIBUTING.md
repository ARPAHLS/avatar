# Contributing

Thanks for helping shape **AVATAR** — an open-source VRM desktop companion (Electron overlay first; browser/localhost for development).

Please follow the [Code of Conduct](CODE_OF_CONDUCT.md).

---

## Before you start

1. **Prefer an issue** — open or claim one via [issue templates](https://github.com/ARPAHLS/avatar/issues/new/choose) so scope is clear. Labels live in [`.github/labels.yml`](.github/labels.yml).
2. **Read the surface you are changing** — start from [Using the app](docs/using-the-app.md) and the deep link for that area (Voice, Environments, VRMA, Settings, etc. in [docs/](docs/README.md)).
3. **Know the product split:**
   - **Electron** (`npm run desktop` / `dev:desktop` / Windows installer) — overlay, snap, scale, device-output loopback, `config.yaml` in userData.
   - **Browser** (`npm run dev`) — UI and VRM work; no system loopback / overlay / snap / scale. Do not assume browser behavior equals desktop.

Details: [Installation](docs/getting-started/installation.md) · [Architecture](docs/architecture/overview.md) · [Project layout](docs/development/project-layout.md).

---

## Run locally

```bash
cd avatar
npm install
```

| Goal | Command |
| :--- | :--- |
| Hot-reload desktop (recommended for most UI work) | `npm run dev:desktop` |
| Production-like Electron on `dist/` | `npm run desktop` |
| Browser only | `npm run dev` → http://localhost:5173 |
| Lint | `npm run lint` |
| Vite production build | `npm run build` |
| Windows installer (local output under `desktop-setup/`) | `npm run dist:win` |
| Regenerate bundled avatar thumbnails | `npm run thumbs` |

End users can use [AVATAR-Setup-0.5.0.exe](https://github.com/ARPAHLS/avatar/releases/download/v0.5.0/AVATAR-Setup-0.5.0.exe) without Node.

### Bundled avatar thumbnails

The Appearance picker draws avatars as static images, not live VRM previews. Portraits for the bundled avatars are **committed** under `avatar/src/assets/avatars/thumbs/` (`avatar1.png` … `avatar3.png`).

If you change a bundled `.vrm`, or add or remove an entry in `src/config/avatars.js`, run `npm run thumbs` and commit the result — the picker will otherwise show a stale or missing portrait. The command opens Electron briefly, renders each avatar with the same renderer the app uses at runtime, writes the PNGs into the source tree, and exits. It is dev-only: the write channel is registered only for that run, so a packaged app cannot write into the source tree.

Thumbnails for a user's own custom folder are **not** committed — they are rendered on demand and cached under Electron `userData/thumbnails/`.

---

## How to approach a change

### Keep PRs focused

- One concern per PR when possible (bugfix, feature, docs-only).
- No drive-by refactors outside the task.
- Match existing patterns in `src/config/`, `src/hooks/`, `src/components/`, and `electron/`.

### Prefer catalogs over hard-coding

Avatars, animations, audio sources, environments, and defaults live in **`avatar/src/config/`**. If you add a clip, source, or built-in environment, register it in the catalog — do not scatter paths in components.

### Think about ripple effects

AVATAR is small but cross-cutting. When you change behavior, ask what else must move with it:

| If you change… | Also check / update… |
| :--- | :--- |
| Gear panel or glass-bar UX | [Using the app](docs/using-the-app.md), relevant feature doc, screenshots under `docs/screenshots/` if the UI shifted |
| Voice / capture / lip sync | [Audio sources](docs/voice/audio-sources.md), [Lip sync](docs/voice/lip-sync.md), Electron vs browser notes, live-dot behavior |
| Environments / chrome contrast | [Environments](docs/environments.md), `chromeTone` / luma sampling on desktop |
| Camera, lighting, transform | [Camera & lighting](docs/camera-and-lighting.md), reset-section behavior |
| Animations / Default sequence | [VRMA](docs/animations/vrma.md), `config/animations.js`, manual testing notes if the Default loop changes |
| Avatars / drop-in naming | [Avatars](docs/avatars.md), README “Swap avatars” if user-facing, `npm run thumbs` if a bundled avatar or the catalog changed |
| VRoid Hub OAuth / Hub characters | [VRoid Hub](docs/vroid-hub.md), Appearance + Settings sections in [Using the app](docs/using-the-app.md), Electron `vroid-*.cjs` + preload `voxVroidHub`, session-only storage notes in [User settings](docs/user-settings.md) |
| User Directories (avatars / envs) | Settings Directories in [Using the app](docs/using-the-app.md), [Avatars](docs/avatars.md), [Environments](docs/environments.md), `user-library.cjs` + `directories` in [User settings](docs/user-settings.md) |
| Settings schema or defaults | [User settings](docs/user-settings.md), `config/userSettings.js`, Electron `settingsStore.cjs` **and** browser `userSettingsStore` if both apply |
| Window / overlay / snap / scale | Using-the-app Settings section, Electron `main.cjs` IPC + preload API |
| Installer / packaging | [Installation](docs/getting-started/installation.md), [releases](docs/releases/README.md) if user-facing, `avatar/build/` assets, `package.json` `build` field |
| Public API of preload / IPC | Every `window.voxDesktop` (or equivalent) caller; keep `preload.cjs` and `main.cjs` in sync |
| Labels or issue forms | [`.github/labels.yml`](.github/labels.yml) (CI syncs labels) — do not invent one-off label names in templates |

### Docs, changelog, and README

For **user-visible** changes:

1. **`CHANGELOG.md`** — add a bullet under `[Unreleased]` (`Added` / `Changed` / `Fixed` / `Removed`). Keep it short; say *why it matters*, not every file touched.
2. **Feature docs** — update the guide that describes the behavior (see table above). Do not leave docs describing the old path.
3. **`docs/using-the-app.md`** — update if menus, defaults, or the main walkthrough change.
4. **`README.md`** — only if Quick start, install order, badges/links, or high-level “what this is” change. Keep README lite; deep detail stays in `docs/`.
5. **Screenshots** — replace or add under `docs/screenshots/` when the UI in docs would mislead; keep filenames stable when replacing in place.
6. **`CITATION.cff` / release notes** — only when versioning or release messaging changes (maintainers).

Docs-only PRs still need a clear description; changelog entry optional unless the doc fix is user-facing correction of wrong instructions.

### Desktop vs browser parity

- If a feature is **Electron-only**, say so in UI copy and docs; do not silently no-op in a confusing way when possible.
- If you fix something in the renderer, smoke-test **`dev:desktop`** for overlay/audio when the area touches those systems.
- Shipping builds use `AVATAR_SHIP=1` on `dist:win` so local `custom/` environment GIFs are **not** packaged — do not “fix” shipping by committing trial media into `custom/`.

### Settings and persistence

- Schema and defaults: `src/config/userSettings.js`.
- Browser: local store helpers under `src/lib/`.
- Desktop: `electron/settingsStore.cjs` → `config.yaml` in userData.
- Changing keys or defaults can break existing user configs — prefer migrations or tolerant reads; document resets in [User settings](docs/user-settings.md).

---

## Assets and licensing

- **Do not** commit VRM/VRMA (or other media) you do not have rights to redistribute.
- Bundled samples and the free VRMA pack have specific terms — read [Assets & credits](docs/assets-and-credits.md) before adding or replacing media.
- Built-in environments belong next to `stars.gif` / `code.gif` / `bloom.gif` and in `config/environments.js`. Trial GIFs stay in `custom/` (gitignored media; folder kept with `.gitkeep`).
- Installer art / EULA live under `avatar/build/` and `public/` — keep NSIS sizes and ASCII license constraints in mind if you touch packaging.

---

## Pull request checklist

Before you open a PR:

- [ ] `npm run lint` and `npm run build` pass in `avatar/`
- [ ] Smoke-tested the path you changed (`dev:desktop` and/or `dev` as appropriate)
- [ ] Catalogs / config updated if you added assets or options
- [ ] Electron preload ↔ main IPC still aligned (if you touched desktop APIs)
- [ ] `CHANGELOG.md` `[Unreleased]` updated for user-visible changes
- [ ] Relevant docs (and screenshots if needed) updated
- [ ] No secrets, local `custom/` media, or `desktop-setup/` installer binaries committed
- [ ] PR description states **what** changed, **why**, and any **follow-ups**

---

## Issues and communication

- Bugs / features / docs / installer / voice / VRM / desktop window → use the matching [template](https://github.com/ARPAHLS/avatar/issues/new/choose).
- Questions → **Question / support** template, or **input@arpacorp.net**.
- Security / privacy concerns around capture → label `security-privacy` or email maintainers; do not file exploit detail in public issues if unsure.

### Reporting issues

- Search [open issues](https://github.com/ARPAHLS/avatar/issues) first and use the matching template from [issue templates](https://github.com/ARPAHLS/avatar/issues/new/choose).
- Include the AVATAR version (installer version or commit), your OS, and how you run it (installer / desktop dev / browser dev).
- For bugs: numbered repro steps, expected vs actual behavior, and redact any local paths or personal data before pasting logs.
- For features: describe the problem, the proposed behavior, and the primary surface (renderer, Electron, voice, settings, etc.).
- Attach screenshots or short clips when the issue is visual.

---

## Roadmap

Larger ideas (agent bus, keyword → animation, code signing, etc.) are tracked in [docs/development/roadmap.md](docs/development/roadmap.md). Feel free to open a feature issue first so we can align on scope before a large PR.
