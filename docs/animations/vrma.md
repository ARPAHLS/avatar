# VRMA animation catalog

Animations are declared in `avatar-demo/src/config/animations.js`.

## Entry shape

Each catalog item includes:

| Field | Purpose |
| :--- | :--- |
| `id` | Internal key used by the dropdown and runtime |
| `label` | Human-readable name |
| `source` | `'procedural'` or `'vrma'` |
| `vrmaUrl` | Bundled `.vrma` import when `source === 'vrma'` |
| `playback` | `'loop'` or `'once'` |
| `group` | Dropdown optgroup label |

## Bundled motion pack

The Pixiv VRMA Motion Pack ships under `src/assets/avatars/VRMA/`:

| ID | Label |
| :--- | :--- |
| `vrma-01` | Show Full Body |
| `vrma-02` | Greeting |
| `vrma-03` | Peace Sign |
| `vrma-04` | Shoot |
| `vrma-05` | Spin |
| `vrma-06` | Model Pose |
| `vrma-07` | Squat |

See `Readme_VRMA_MotionPack_EN.txt` for license terms. Include Pixiv credit in public releases that ship these files.

## Adding a clip

1. Place the `.vrma` file under `src/assets/avatars/VRMA/` (or `public/assets/animations/` for URL-based loading).
2. Import it at the top of `animations.js`.
3. Append a catalog entry with `source: 'vrma'`.
4. Reload the dev server — the dropdown picks up new entries automatically.

## Playback pipeline

`useVrmAnimation` uses `VRMAnimationLoaderPlugin` and `createVRMAnimationClip` from `@pixiv/three-vrm-animation`, matching the approach used by production VRM tooling rather than manual bone rotation.
