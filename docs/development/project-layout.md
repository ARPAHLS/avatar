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
    ├── App.jsx
    ├── main.jsx
    ├── assets/
    │   ├── avatars/          VRM + VRMA
    │   └── environments/     built-in GIFs + custom/
    ├── components/
    │   ├── AvatarStage.jsx
    │   ├── avatar/
    │   ├── panels/
    │   └── ui/
    ├── config/
    ├── hooks/
    ├── lib/
    └── styles/
```

Environment GIFs used by the app live under `src/assets/environments/` (Vite-bundled). Drop trial GIFs in `custom/`; promote keepers to the parent folder when ready.

## Conventions

- **Catalogs over magic strings** — UI reads from `config/`.
- **Hooks own side effects** — components stay declarative.
- **One avatar frame loop** — `VrmAvatar` coordinates mixer, blink, and lip sync.

## Scripts

| Command | Action |
| :--- | :--- |
| `npm run dev` | Vite browser dev server |
| `npm run dev:desktop` | Vite + Electron overlay |
| `npm run desktop` | Build + Electron against `dist/` |
| `npm run build` | Production web bundle |
| `npm run preview` | Serve `dist/` |
| `npm run lint` | ESLint |
