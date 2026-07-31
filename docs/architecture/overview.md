# Architecture overview

```mermaid
flowchart TB
    UI[AvatarStage UI] --> Config[config catalogs]
    UI --> Audio[useAudioSource]
    Audio --> Analyser[useAudioAnalyser]
    UI --> Avatar[VrmAvatar]
    Avatar --> VRM[VRM loader]
    Avatar --> VRMA[useVrmAnimation]
    Avatar --> Lip[useAmplitudeLipSync]
    Avatar --> Blink[useBlink]
    VRMA --> Pixiv[@pixiv/three-vrm-animation]
    Lip --> Expressions[VRM expressionManager]
```

## Layers

### Presentation (`components/`)

`AvatarStage` owns viewport interaction, floating panels, and menus. Panels: `PalettePanel` (Avatar + Environments), `VoicePanel`, `CameraPanel`.

### Configuration (`config/`)

Declarative catalogs for avatars, animations, audio sources, and visual defaults. Adding a VRMA clip means extending `animationCatalog` — no scattered hard-coded paths.

### Runtime hooks (`hooks/`)

| Hook | Role |
| :--- | :--- |
| `useVrmAnimation` | Loads `.vrma`, builds clips, cross-fades actions |
| `useAmplitudeLipSync` | Maps audio level → cycling visemes |
| `useAudioSource` | Browser capture lifecycle |
| `useBlink` | Idle blink on expression manager |

### Fallback motion (`lib/proceduralAnimations.js`)

Procedural bone posing remains for built-in test states until dedicated idle VRMA loops are assigned.

## Design notes

- **VRMA first** — skeletal clips override procedural posing while active.
- **Browser-only audio** — unlike [Persona](https://github.com/xikhar/persona), this preview uses Web Audio APIs rather than native process loopback.
- **Future triggers** — keyword/event mapping will hook into the same animation catalog without changing the loader.
