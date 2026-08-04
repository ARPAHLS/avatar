# Project layout

```text
avatar-demo/
├── electron/
│   ├── main.cjs
│   ├── preload.cjs
│   ├── settingsStore.cjs
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
| Windows [`.exe`](https://github.com/ARPAHLS/avatar/releases/download/v0.3.0/AVATAR-Setup-0.3.0.exe) | End users | Installer — no Node |
| `npm run desktop` | From source | Build + Electron on `dist/` |
| `npm run dev` | Contributors | Browser localhost only |
| `npm run dev:desktop` | Contributors | Vite + Electron (hot reload) |
| `npm run dist:win` | Contributors | Build Windows NSIS installer (local `desktop-setup/` output) |
| `npm run build` | CI / web | Production Vite bundle |
| `npm run lint` | Contributors | ESLint |
| `npm test` | Contributors | Electron unit tests |
