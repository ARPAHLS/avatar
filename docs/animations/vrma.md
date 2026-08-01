# VRMA animation catalog

Animations are declared in `avatar-demo/src/config/animations.js`.

## Entry shape

Each catalog item includes:

| Field | Purpose |
| :--- | :--- |
| `id` | Internal key used by the dropdown and runtime |
| `label` | Human-readable name |
| `source` | `'procedural'`, `'vrma'`, or `'sequence'` |
| `vrmaUrl` | Bundled `.vrma` import when `source === 'vrma'` |
| `playback` | `'loop'` or `'once'` |
| `group` | Dropdown optgroup label |

## Bundled motion pack

The seven free Pixiv / VRoid Project VRMA files ship under `src/assets/avatars/VRMA/`. They were released on [BOOTH](https://booth.pm/) in 2024 with VRoid Hub Photo Booth.

| ID | Label |
| :--- | :--- |
| `vrma-01` | Show Full Body |
| `vrma-02` | Greeting |
| `vrma-03` | Peace Sign |
| `vrma-04` | Shoot |
| `vrma-05` | Spin |
| `vrma-06` | Model Pose |
| `vrma-07` | Squat |

**Licensing & credit:** see [Assets & credits](../assets-and-credits.md). Copyright remains with pixiv Inc. Public/commercial use requires:

> Animation credits to pixiv Inc.'s VRoid Project

Takedown / rights: **input@arpacorp.net**

## Adding a clip

1. Place the `.vrma` file under `src/assets/avatars/VRMA/` (or `public/assets/animations/` for URL-based loading).
2. Import it at the top of `animations.js`.
3. Append a catalog entry with `source: 'vrma'`.
4. Reload the dev server — the dropdown picks up new entries automatically.

Only add clips you have rights to redistribute.

## Playback pipeline

`useVrmAnimation` uses `VRMAnimationLoaderPlugin` and `createVRMAnimationClip` from `@pixiv/three-vrm-animation`.
