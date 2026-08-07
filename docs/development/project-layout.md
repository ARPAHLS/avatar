# Project layout

```text
avatar/
├── electron/
│   ├── main.cjs
│   ├── preload.cjs
│   ├── settingsStore.cjs
│   ├── thumbnails.cjs
│   ├── user-library.cjs
│   ├── vroid-oauth-server.cjs
│   ├── vroid-hub-auth.cjs
│   ├── vroid-hub-credentials.cjs
│   └── vroid-hub-client.cjs
├── public/
│   ├── AVATAR_LOGO_150.png
│   └── AVATAR_SPLASH.png
└── src/
    ├── assets/
    │   ├── avatars/
    │   │   ├── thumbs/          # committed picker portraits (npm run thumbs)
    │   │   └── VRMA/
    │   └── environments/
    │       ├── stars.gif / code.gif / bloom.gif
    │       └── custom/
    ├── components/
    ├── config/
    ├── hooks/
    ├── lib/
    └── styles/
```

End users personalize via **Settings → Directories** and **VRoid Hub** (see [Using the app](../using-the-app.md)). The `environments/custom/` folder is a contributor convenience when Directories is still Default.

## Scripts

| Command | Audience | Action |
| :--- | :--- | :--- |
| Windows [`.exe`](https://github.com/ARPAHLS/avatar/releases/download/v0.6.0/AVATAR-Setup-0.6.0.exe) | End users | Installer — no Node |
| `npm run desktop` | From source | Build + Electron on `dist/` |
| `npm run dev` | Contributors | Browser localhost only |
| `npm run dev:desktop` | Contributors | Vite + Electron (hot reload) |
| `npm run dist:win` | Contributors | Build Windows NSIS installer (local `desktop-setup/` output) |
| `npm run build` | CI / web | Production Vite bundle |
| `npm run lint` | Contributors / CI | ESLint (`src/`, `electron/**/*.cjs`, scripts; `--max-warnings=0`) |
| `npm test` | Contributors / CI | Electron unit tests (`electron/*.test.cjs`) and build-tooling tests (`scripts/*.test.mjs`, two of which run a real `vite build`, so the suite takes ~10s) |
| `npm run thumbs` | Contributors | Re-render committed avatar portraits into `src/assets/avatars/thumbs/` |

### Continuous integration

Pull requests and pushes to `main` run [`.github/workflows/ci.yml`](../../.github/workflows/ci.yml): install → lint → test → production build in `avatar/` on Ubuntu (Node 22). The workflow does **not** build the Windows installer (`dist:win`) and skips downloading the Electron binary (`ELECTRON_SKIP_BINARY_DOWNLOAD`) because unit tests do not launch Electron. Label sync remains a separate workflow (`.github/workflows/sync-labels.yml`).

Run `npm run thumbs` whenever a bundled `.vrm` or the `config/avatars.js` catalog changes, and commit the PNGs — the Appearance picker reads those files rather than rendering a live preview. Custom-folder avatars are cached at runtime under Electron `userData/thumbnails/` instead. See [Contributing](../../CONTRIBUTING.md#bundled-avatar-thumbnails).
