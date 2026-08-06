# User settings (`config.yaml`)

AVATAR remembers your preferences across launches.

## Where settings live

| Mode | Location |
| :--- | :--- |
| **Electron (desktop)** | `{userData}/config.yaml` — full path shown at the bottom of **Settings** (e.g. `C:\Users\…\AppData\Roaming\avatar\config.yaml` on Windows) |
| **Browser (dev)** | `localStorage` key `avatar.config.yaml` |

Electron `userData` is **app-owned** (not inside the git repo). Window **position/size bounds** also use a separate `window-state.json` beside it; scale and overlay are mirrored into `config.yaml` as well.

## What is saved

Autosave runs shortly after you change something (~400 ms debounce).

| Area | Fields |
| :--- | :--- |
| Character | `avatarId` (and reserved `skinId: default`) |
| Motion | `animationId` |
| Backdrop | `environment` (`env` + id, `color` + hex, or `none`) |
| Camera | `position`, `lookAt`, `fov` |
| Light | `intensity`, `color`, `position` |
| Avatar transform | `position`, `rotation` |
| Voice | `audioSourceId`, `windowSourceId` (when picking a window) |
| Desktop | `overlayMode`, `windowScale` |
| Directories (desktop) | `directories.avatars` / `environments` (`mode` + `path`); animations reserved as default-only |

### Not saved

- Uploaded **audio files** (re-pick after restart)
- Which snap-pad cell is highlighted
- Which drawer / accordion is open
- Transient UI (menus open/closed)
- **VRoid Hub characters** — session-only in memory; never written to `config.yaml` or as a local `.vrm` (see [VRoid Hub](vroid-hub.md))

### Related files in Electron `userData` (not `config.yaml`)

| File | Purpose |
| :--- | :--- |
| `vroid-hub-credentials.json` | Encrypted OAuth client ID / secret (`safeStorage`) |
| `vroid-hub-auth.json` | Encrypted access / refresh tokens |
| `window-state.json` | Window bounds (separate from YAML prefs) |

**Reset all settings** clears `config.yaml` preferences only. Use **Disconnect** / **Remove app credentials** in Settings for Hub session / OAuth app data.

## Factory defaults (after reset / first run)

| Setting | Default |
| :--- | :--- |
| Avatar | `avatar1` (**Avatar 1**) |
| Animation | `default` (Greeting once, then model pose → full body → peace → squat → shoot) |
| Environment | Color fade `#e9e1fa` |
| Camera | position `[-0.01, 0.59, 1.69]`, lookAt `[0, 0.5, 0]`, FOV `26.8` |
| Light | intensity `0.7`, color `#ffffff`, position `[1, 2, 2]` |
| Avatar transform | position `[0, -1.03, -1.48]` |
| Audio | Desktop: **Device output (auto)** (`system`); Browser: **Off** (`none`) |
| Overlay | On |
| Window scale | ×1 |
| Directories | Avatars / Animations / Environments → `default` (no custom paths) |

## How to reset

### Everything

**Settings → Reset all settings** deletes the YAML file (or clears localStorage) and reapplies the factory defaults above.

<p align="center">
  <img src="screenshots/AVATAR_M5_Settings_Scroll.gif" alt="Scrolling the Settings panel — Overlay, Snap, Directories" height="400" />
</p>

<p align="center">
  <img src="screenshots/82-settings-directories.png" alt="Settings Directories section" height="260" />
</p>

### One area only

| Goal | Action |
| :--- | :--- |
| Camera only | Camera & Lighting → **Reset Camera** (or double-click one slider) |
| Lights only | **Reset Light** |
| Avatar pose offset only | **Reset Avatar** |
| Environment color only | Appearance → Environments → **Reset** |
| Directories (desktop) | Reset that row to **Default**, or Reset all |

## Example `config.yaml` shape

```yaml
version: 2
avatarId: avatar1
skinId: default
animationId: default
environment:
  type: env
  id: code
camera:
  position:
    - -0.01
    - 0.59
    - 1.69
  lookAt:
    - 0
    - 0.5
    - 0
  fov: 26.8
light:
  intensity: 0.7
  color: '#ffffff'
  position:
    - 1
    - 2
    - 2
avatarTransform:
  position:
    - 0
    - -1.03
    - -1.48
  rotation:
    - 0
    - 0
    - 0
audioSourceId: system
windowSourceId: null
overlayMode: true
windowScale: 1
directories:
  avatars:
    mode: default
    path: null
  animations:
    mode: default
    path: null
  environments:
    mode: default
    path: null
```

You normally never edit this by hand — use the UI. Hand-edits are fine if the app is closed; invalid values fall back to defaults on load.

`skinId: default` is a reserved legacy field kept for config compatibility.
Newer installs should use `avatarId` (or `directories` custom avatar folders)
and leave `skinId` untouched.

`avatarTransform.rotation` is your own framing rotation only. Whether a model
needs turning to face the camera is decided per model from its VRM spec version
(VRM 0.0 faces away and is flipped automatically; VRM 1.0 already faces you), so
it is not — and must not be — part of this value. Version 1 configs did store
that flip here; they are converted automatically on first load under version 2.
