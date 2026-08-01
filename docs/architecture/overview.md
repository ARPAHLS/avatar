# Architecture overview

```mermaid
flowchart TB
    UI[AvatarStage UI] --> Config[config catalogs]
    UI --> Persist[config.yaml settings]
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
    Electron --> Persist
    Electron --> Loopback[displayMedia loopback]
```

## Layers

### Presentation (`components/`)

`AvatarStage` owns the stage, gear menus, glass drawers, window scale, and settings hydration. Panels:

| Panel | Contents |
| :--- | :--- |
| `PalettePanel` | Avatar picker + Environments (built-in, Custom, color, none) |
| `VoicePanel` | Audio source / lip sync controls |
| `CameraPanel` | Camera, light, avatar transform |
| `DesktopPanel` | Snap corners, overlay vs windowed |
| Settings drawer | Desktop controls + **Reset all settings** |

### Configuration (`config/`)

Catalogs for avatars, animations (including the Default sequence), audio sources, environments, window scale, visual defaults, and the `userSettings` schema.

### Runtime hooks (`hooks/`)

| Hook | Role |
| :--- | :--- |
| `useVrmAnimation` | Loads `.vrma`, sequences, cross-fades |
| `useAmplitudeLipSync` | Maps audio level → cycling visemes |
| `useAudioSource` | Capture lifecycle (browser + Electron) |
| `useBlink` | Idle blink on expression manager |

### Desktop (`electron/`)

Frameless transparent window, always-on-top overlay, snap, scale presets, system audio loopback via `setDisplayMediaRequestHandler`, and **`config.yaml`** persistence in Electron `userData` (`settingsStore.cjs`).

## Design notes

- **Electron first** — desktop overlay, scale, and device loopback are the primary product path; browser is for development.
- **VRMA first** — skeletal clips (and sequences) drive the body while active.
- **Drop-in avatars** — `avatarN.vrm` / `avatarNB.vrm` naming auto-registers models and skins.
- **Persistent prefs** — avatar, skin, camera, lighting, environment, animation, audio source, overlay, and scale survive restarts; reset from Settings.
- **Chrome contrast** — whitish bar/buttons on dark backdrops; silver only when the region behind the bar is clearly light.
- **Future triggers** — keyword/event mapping will reuse the same animation catalog.
