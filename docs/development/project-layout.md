# Project layout

```text
avatar-demo/
├── electron/
│   ├── main.cjs
│   └── preload.cjs
├── public/
│   ├── AVATAR_LOGO_150.png
│   └── AVATAR_SPLASH.png
└── src/
    ├── assets/
    │   ├── avatars/           avatar1.vrm, avatar2.vrm, avatar3.vrm, VRMA/
    │   └── environments/      stars/code/bloom + custom/
    ├── components/
    ├── config/
    │   ├── avatars.js         glob catalog (avatars + skins)
    │   ├── environments.js
    │   ├── animations.js
    │   └── …
    ├── hooks/
    ├── lib/
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
