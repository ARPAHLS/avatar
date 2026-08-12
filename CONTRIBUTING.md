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
| Unit tests (Electron + renderer modules) | `npm test` |
| Vite production build | `npm run build` |
| Windows installer (local output under `desktop-setup/`) | `npm run dist:win` |
| Regenerate bundled avatar thumbnails | `npm run thumbs` |

Pull requests and pushes to `main` run the same **lint → test → build** sequence in GitHub Actions (see [Continuous integration](#continuous-integration)). Run those three locally before opening a PR.

End users can use [AVATAR-Setup-0.6.0.exe](https://github.com/ARPAHLS/avatar/releases/download/v0.6.0/AVATAR-Setup-0.6.0.exe) without Node.

### Where tests go

`npm test` is the plain Node test runner — there is no bundler or DOM in the loop.

| Location | For |
| :--- | :--- |
| `electron/*.test.cjs` | Main-process modules (CommonJS, real `fs` against a `mkdtemp` fixture) |
| `src/**/*.test.mjs` | Renderer modules that are **pure** — no React, no DOM, no asset imports |
| `scripts/*.test.mjs` | Build tooling (these run real `vite build`s) |

A `src/` module is only testable if nothing in its import graph reaches a Vite-resolved asset (`.vrma`, `.vrm`, images) — plain Node throws `ERR_UNKNOWN_FILE_EXTENSION` on those. When logic worth testing sits behind such an import, split the module: assets in one file, pure logic in another, and a composing entry point that re-exports both. `src/config/animations.js` → `vrmaAssets.js` + `animationLookup.js` is the reference example.

Anything needing React, the DOM, or `URL.createObjectURL` has **no** automated coverage today and is verified by hand (`npm run dev:desktop`) — say so in the PR rather than leaving it implied.

### Bundled picker thumbnails

The Appearance picker draws avatars as static images, not live VRM previews, and environments as still posters, not the animated stage GIFs. Both are **committed**: portraits under `avatar/src/assets/avatars/thumbs/` (`avatar1.png` … `avatar3.png`), environment posters under `avatar/src/assets/environments/thumbs/` (one PNG per id in `src/config/environments.js`).

Run `npm run thumbs` and commit the result if you change a bundled `.vrm` or `.gif`, or add or remove an entry in `src/config/avatars.js` or `src/config/environments.js` — the picker will otherwise show a stale or missing thumbnail. The command opens Electron briefly, renders both sets with the same code the app uses at runtime, writes the PNGs into the source tree, and exits. It is dev-only: the write channel is registered only for that run, so a packaged app cannot write into the source tree.

Both sets are globbed rather than imported by name, so a missing file degrades (the avatar picker renders one on the spot; the environment picker falls back to the GIF) instead of breaking the build. That matters because the generator itself imports those config modules — a named import for a poster that does not exist yet would stop the run that was meant to create it.

Thumbnails for a user's own custom folders are **not** committed — they are generated on demand and cached under Electron `userData/thumbnails/`.

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
| User Directories (avatars / animations / envs) | Settings Directories in [Using the app](docs/using-the-app.md), [Avatars](docs/avatars.md), [VRMA](docs/animations/vrma.md), [Environments](docs/environments.md), `user-library.cjs` + `directories` in [User settings](docs/user-settings.md) |
| Settings schema or defaults | [User settings](docs/user-settings.md), `config/userSettings.js`, Electron `settingsStore.cjs` **and** browser `userSettingsStore` if both apply |
| Window / overlay / snap / scale | Using-the-app Settings section, Electron `main.cjs` IPC + preload API |
| Installer / packaging | [Installation](docs/getting-started/installation.md), [releases](docs/releases/README.md) if user-facing, `avatar/build/` assets, `package.json` `build` field |
| Public API of preload / IPC | Every `window.voxDesktop` (or equivalent) caller; keep `preload.cjs` and `main.cjs` in sync |
| Labels or issue forms | [`.github/labels.yml`](.github/labels.yml) (CI syncs labels) — do not invent one-off label names in templates |
| Lint / ESLint scope | `avatar/eslint.config.js` (renderer `src/`, Electron `electron/**/*.cjs`, scripts) — keep Node vs browser globals correct |
| CI workflow | [`.github/workflows/ci.yml`](.github/workflows/ci.yml), [Project layout](docs/development/project-layout.md#continuous-integration) |
| Package scripts / Node engines | `avatar/package.json`, install docs if contributors must change Node version |
| Roadmap item shipped | [Roadmap](docs/development/roadmap.md) checkboxes |

### Docs, changelog, and README

For **user-visible** or **contributor-visible** changes (behavior, install, CI, lint gates):

1. **`CHANGELOG.md`** — add a bullet under `[Unreleased]` (`Added` / `Changed` / `Fixed` / `Removed`). Keep it short; say *why it matters*, not every file touched. Prefer **issue and PR numbers** when known, matching the style under published releases (e.g. `(#4, #35)`). Do not use `Closes`/`Fixes` keywords inside changelog text.
2. **Feature docs** — update the guide that describes the behavior (see table above). Do not leave docs describing the old path.
3. **`docs/using-the-app.md`** — update if menus, defaults, or the main walkthrough change.
4. **`README.md`** — only if Quick start, install order, badges/links, or high-level “what this is” change. Keep README lite; deep detail stays in `docs/`.
5. **Screenshots** — replace or add under `docs/screenshots/` when the UI in docs would mislead; keep filenames stable when replacing in place.
6. **`CITATION.cff` / release notes** — only when versioning or release messaging changes (maintainers).
7. **`docs/development/roadmap.md`** — mark shipped items when a tracked milestone lands.

Docs-only PRs still need a clear description; changelog entry optional unless the doc fix is user-facing correction of wrong instructions.

### Continuous integration

- Workflow: [`.github/workflows/ci.yml`](.github/workflows/ci.yml) on every pull request and on pushes to `main`.
- Steps (in `avatar/`): `npm ci` → `npm run lint` → `npm test` → `npm run build`.
- Node **22** (Vite 7 compatible). Electron’s binary is **not** downloaded in CI (`ELECTRON_SKIP_BINARY_DOWNLOAD`); unit tests must not `require('electron')` at load time.
- Windows installer (`dist:win`) is **not** run in CI — too heavy and Windows-specific; verify locally when you touch packaging.
- A failing CI check blocks confidence for merge; fix lint/tests/build in the same PR when you introduce the breakage.

### Desktop vs browser parity

- If a feature is **Electron-only**, say so in UI copy and docs; do not silently no-op in a confusing way when possible.
- If you fix something in the renderer, smoke-test **`dev:desktop`** for overlay/audio when the area touches those systems.
- Every production build (`build`, `desktop`, `dist:win`) drops local `custom/` environment media from the bundle; only the dev server keeps it. Use `npx cross-env AVATAR_INCLUDE_CUSTOM=1 npm run build` if you deliberately want trial media in a production build — and do not “fix” shipping by committing trial media into `custom/`.

### Settings and persistence

- Schema and defaults: `src/config/userSettings.js`.
- Browser: local store helpers under `src/lib/`.
- Desktop: `electron/settingsStore.cjs` → `config.yaml` in userData.
- Changing keys or defaults can break existing user configs — prefer migrations or tolerant reads; document resets in [User settings](docs/user-settings.md).

### For AI coding agents (and humans using them)

Treat the repo as a **product + docs** unit, not a single-folder code patch:

1. **Read before editing** — [Using the app](docs/using-the-app.md), the feature doc for the area, and this ripple table.
2. **Electron vs browser** — do not claim desktop-only behavior works in `npm run dev` without checking.
3. **Complementary files in the same PR** — code + catalogs + preload/main + docs + `CHANGELOG.md` `[Unreleased]` + screenshots when the UI story changes. Avoid “follow-up later” for obvious ripples (changelog, user guide line, roadmap checkbox).
4. **Changelog** — Keep a Changelog sections; short *why*; include `#issue` / `#PR` when known (see [0.5.0](CHANGELOG.md) entries).
5. **Do not commit** secrets, `desktop-setup/*.exe`, or gitignored `custom/` media.
6. **Verify** — `npm run lint`, `npm test`, and `npm run build` in `avatar/` (same as CI). Use `dev:desktop` for overlay/audio smoke tests.
7. **PR description** — what / why / how tested / leftover follow-ups that are genuinely optional.

---

## Assets and licensing

- **Do not** commit VRM/VRMA (or other media) you do not have rights to redistribute.
- Bundled samples and the free VRMA pack have specific terms — read [Assets & credits](docs/assets-and-credits.md) before adding or replacing media.
- Built-in environments belong next to `stars.gif` / `code.gif` / `bloom.gif` and in `config/environments.js`. Trial GIFs stay in `custom/` (gitignored media; folder kept with `.gitkeep`).
- Installer art / EULA live under `avatar/build/` and `public/` — keep NSIS sizes and ASCII license constraints in mind if you touch packaging.

---

## Pull request checklist

Before you open a PR:

- [ ] `npm run lint`, `npm test`, and `npm run build` pass in `avatar/`
- [ ] Smoke-tested the path you changed (`dev:desktop` and/or `dev` as appropriate)
- [ ] Catalogs / config updated if you added assets or options
- [ ] Electron preload ↔ main IPC still aligned (if you touched desktop APIs)
- [ ] `CHANGELOG.md` `[Unreleased]` updated for user- or contributor-visible changes (with issue/PR numbers when known)
- [ ] Relevant docs (and screenshots if needed) updated; roadmap touched if a listed item shipped
- [ ] No secrets, local `custom/` media, or `desktop-setup/` installer binaries committed
- [ ] PR description states **what** changed, **why**, how you **tested**, and any **follow-ups**

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

## Releasing (maintainers)

Version bumps touch many files. Use the one-page [release checklist](docs/development/release-checklist.md) before tagging and attaching `AVATAR-Setup-*.exe` — bump surfaces, changelog / `docs/releases/`, lint·test·build, local `dist:win`, GitHub Release body (`@` contributors), unsigned SmartScreen note.

---

## Roadmap

Larger ideas (agent bus, keyword → animation, code signing, etc.) are tracked in [docs/development/roadmap.md](docs/development/roadmap.md). Feel free to open a feature issue first so we can align on scope before a large PR.
