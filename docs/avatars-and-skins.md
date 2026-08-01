# Avatars

AVATAR loads character models from `avatar-demo/src/assets/avatars/`.

## Naming

| File | Meaning |
| :--- | :--- |
| `avatar1.vrm` | Avatar 1 — default skin |
| `avatar2.vrm` | Avatar 2 — default skin |
| `avatar3.vrm` | Avatar 3 — default skin |
| `avatar1B.vrm` | Avatar 1 — skin B |
| `avatar1C.vrm` | Avatar 1 — skin C |

Pattern: `avatar{N}.vrm` for the base character, `avatar{N}{Letter}.vrm` for alternate skins.

## In the app

Gear → **Appearance** → **Avatars** picks the character.  
Gear → **Appearance** → **Skins** picks a variant of the selected character (Default until you add `B` / `C` files).

## Adding your own models

1. Export or copy a `.vrm` into `src/assets/avatars/`.
2. Name it with the pattern above (e.g. `avatar4.vrm` or `avatar2B.vrm`).
3. Restart `npm run dev:desktop` (or refresh the Vite process) so the glob picks up the new file.
4. Select it under **Avatars** / **Skins**.

The catalog is built automatically via Vite `import.meta.glob` — no manual config edits required for standard names.

## Notes

- Bundled samples are free VRoid-based models. See [Assets & credits](../assets-and-credits.md).
- Only ship models you have rights to redistribute.
