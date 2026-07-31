# Project layout

```text
avatar-demo/src/
├── App.jsx                 Root component
├── main.jsx                Entry point
├── components/
│   ├── AvatarStage.jsx     Main stage & interaction
│   ├── avatar/
│   │   ├── VrmAvatar.jsx   VRM + VRMA + lip sync frame loop
│   │   └── MiniAvatar.jsx  Avatar picker preview
│   ├── panels/
│   │   ├── PalettePanel.jsx
│   │   └── CameraPanel.jsx
│   └── ui/
│       ├── AnimationSelector.jsx
│       ├── CameraController.jsx
│       └── PanelPrimitives.jsx
├── config/
│   ├── animations.js       VRMA + procedural catalog
│   ├── avatars.js          Model registry
│   ├── audioSources.js     Lip sync inputs
│   └── defaults.js         Theme & camera defaults
├── hooks/
│   ├── useVrmAnimation.js
│   ├── useAmplitudeLipSync.js
│   ├── useAudioSource.js
│   ├── useAudioAnalyser.js
│   └── useBlink.js
├── lib/
│   ├── proceduralAnimations.js
│   └── vrmAnimationAction.js
└── styles/
    ├── tokens.css          Pastel CSS variables
    ├── index.css           Base reset
    └── app.css             Component styles
```

## Conventions

- **Catalogs over magic strings** — UI reads from `config/`.
- **Hooks own side effects** — components stay declarative.
- **One avatar frame loop** — `VrmAvatar` coordinates mixer, procedural fallback, blink, and lip sync.

## Scripts

| Command | Action |
| :--- | :--- |
| `npm run dev` | Vite dev server |
| `npm run build` | Production bundle |
| `npm run preview` | Serve `dist/` |
| `npm run lint` | ESLint |
