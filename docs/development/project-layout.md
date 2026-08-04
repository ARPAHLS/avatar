# Project layout

```text
avatar-demo/
├── electron/
│   ├── main.cjs
│   ├── preload.cjs
│   ├── settingsStore.cjs          # config.yaml in userData
│   ├── vroid-oauth-server.cjs     # loopback OAuth callback
│   ├── vroid-hub-auth.cjs         # PKCE + token persistence
│   ├── vroid-hub-credentials.cjs  # encrypted client id/secret
│   └── vroid-hub-client.cjs       # list + licensed VRM download
├── public/
│   ├── AVATAR_LOGO_150.png
│   └── AVATAR_SPLASH.png
└── src/
    ├── assets/
    │   ├── avatars/
    │   │   └── VRMA/
    │   └── environments/
    │       ├── stars.gif / code.gif / bloom.gif   # bundled built-ins
    │       └── custom/                            # local trials only (.gitkeep; media gitignored)
    ├── components/
    ├── config/             # catalogs + userSettings schema
    ├── hooks/
    ├── lib/                # chromeTone, userSettingsStore, desktopMode, …
    └── styles/
```

## Scripts

| Command | Audience | Action |
| :--- | :--- | :--- |
| Windows [`.exe`](https://github.com/ARPAHLS/avatar/releases/download/v0.3.0/AVATAR-Setup-0.3.0.exe) | End users | Installer — no Node |
| `npm run desktop` | From source | Build + Electron on `dist/` |
| `npm run dev` | Contributors | Browser localhost only |
| `npm run dev:desktop` | Contributors | Vite + Electron (hot reload) |
| `npm run dist:win` | Contributors | Build Windows NSIS installer (local `desktop-setup/` output) |
| `npm run build` | CI / web | Production Vite bundle |
| `npm run lint` | Contributors | ESLint |

Optional env: `AVATAR_VROID_OAUTH_PORT` overrides the default VRoid loopback port (`47901`). The redirect URI shown in Settings always reflects the port actually in use.
