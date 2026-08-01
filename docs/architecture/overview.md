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
    Electron[Electron shell] --> UI
    Electron --> Loopback[displayMedia loopback]
```

## Layers

### Presentation (`components/`)

`AvatarStage` owns the stage, gear menus, glass drawers, and window scale. Panels:

| Panel | Contents |
| :--- | :--- |
| `PalettePanel` | Avatar picker + Environments (built-in, Custom, color, none) |
| `VoicePanel` | Audio source / lip sync controls |
| `CameraPanel` | Camera, light, avatar transform |
| `DesktopPanel` | Snap corners, overlay vs windowed |

### Configuration (`config/`)

Catalogs for avatars, animations (including the Default sequence), audio sources, environments, window scale, and visual defaults.

### Runtime hooks (`hooks/`)

| Hook | Role |
| :--- | :--- |
| `useVrmAnimation` | Loads `.vrma`, sequences, cross-fades |
| `useAmplitudeLipSync` | Maps audio level → cycling visemes |
| `useAudioSource` | Capture lifecycle (browser + Electron) |
| `useBlink` | Idle blink on expression manager |

### Desktop (`electron/`)

Frameless transparent window, always-on-top overlay, snap, scale presets, and system audio loopback via `setDisplayMediaRequestHandler`.

## Design notes

- **Electron first** — desktop overlay, scale, and device loopback are the primary product path; browser is for development.
- **VRMA first** — skeletal clips (and sequences) drive the body while active.
- **Drop-in avatars** — `avatarN.vrm` / `avatarNB.vrm` naming auto-registers models and skins.
- **Future triggers** — keyword/event mapping will reuse the same animation catalog.
