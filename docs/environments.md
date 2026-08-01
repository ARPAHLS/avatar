# Environments

Backgrounds live under `avatar-demo/src/assets/environments/`.

## Built-in

| Id | File | Notes |
| :--- | :--- | :--- |
| Stars | `stars.gif` | Dark starfield |
| Code | `code.gif` | Code rain |
| Bloom | `bloom.gif` | Pastel bloom |
| None | — | No holo / GIF |
| Color fade | — | Solid pastel glow from a color picker |

Open Gear → **Appearance** → **Environments**.

## Custom GIFs

Drop trial media into `src/assets/environments/custom/` (`.gif`, `.webp`, `.png`, `.jpg`, …).

They appear under the **Custom** expander in the Environments panel. Use this to test candidates; promote keepers by moving them next to `stars.gif` / `code.gif` / `bloom.gif` and registering them in `src/config/environments.js` if you want them in the top row.

Restart the Electron/Vite process after adding files.

## Contrast

Glass bar and gear buttons stay **whitish** on dark scenes (Stars, Code, none, dark colors). They switch to **silver / greyscale** only when the backdrop behind the bar is clearly light (e.g. Bloom, pale color fades, bright custom GIFs). Custom images are sampled from the lower strip of the frame.

## Asset location

Do **not** put environment GIFs only in `public/` — the app imports from `src/assets/environments/` so Vite can bundle them.
