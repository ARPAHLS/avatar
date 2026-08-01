# Project layout

```text
avatar-demo/
├── electron/
│   ├── main.cjs
│   ├── preload.cjs
│   └── settingsStore.cjs   # config.yaml in userData
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
    ├── lib/                # chromeTone, userSettingsStore, …
    └── styles/
```

## Scripts

| Command | Audience | Action |
| :--- | :--- | :--- |
| Windows [`.exe`](https://github.com/ARPAHLS/avatar/releases/download/v0.2.0/AVATAR-Setup-0.2.0.exe) | End users | Installer — no Node |
| `npm run desktop` | From source | Build + Electron on `dist/` |
| `npm run dev` | Contributors | Browser localhost only |
| `npm run dev:desktop` | Contributors | Vite + Electron (hot reload) |
| `npm run dist:win` | Contributors | Build Windows NSIS installer (local `desktop-setup/` output) |
| `npm run build` | CI / web | Production Vite bundle |
| `npm run lint` | Contributors | ESLint |
