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
    │       └── custom/
    ├── components/
    ├── config/             # catalogs + userSettings schema
    ├── hooks/
    ├── lib/                # chromeTone, userSettingsStore, …
    └── styles/
```

## Scripts

| Command | Audience | Action |
| :--- | :--- | :--- |
| `npm run dev:desktop` | Default | Vite + Electron overlay |
| `npm run desktop` | Packaging check | Build + Electron on `dist/` |
| `npm run dev` | Contributors | Browser localhost only |
| `npm run build` | CI / web | Production bundle |
| `npm run lint` | Contributors | ESLint |
