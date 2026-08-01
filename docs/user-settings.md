# User settings (`config.yaml`)

AVATAR persists preferences across sessions in a YAML file.

## Where it lives

| Mode | Location |
| :--- | :--- |
| **Electron (desktop)** | `{userData}/config.yaml` — shown under **Settings** |
| **Browser (dev)** | `localStorage` key `avatar.config.yaml` |

Electron `userData` is app-owned (not inside the git repo). Window bounds stay in a separate `window-state.json` next to it.

## What is saved

- Avatar + skin
- Environment (built-in / custom / color / none)
- Camera, lighting, and avatar transform
- Selected animation
- Voice source preference (not uploaded audio files)
- Overlay vs windowed mode
- Window scale (×0.5 / ×1 / ×2)

## Reset

**Settings → Reset all settings** deletes the saved file (or clears local storage) and restores factory defaults, including the default camera framing (`X = -0.01`, `Y = 0.59`).

Changes autosave shortly after you adjust anything.
