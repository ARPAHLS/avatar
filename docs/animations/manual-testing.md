# Manual animation testing

## Gear → Animations

All motions are selected from the gear **Animations** submenu:

- Change selection → clip or sequence starts immediately.
- Re-selecting the same entry increments a request counter to replay it.
- **Default** plays Greeting once, then loops Model Pose → Show Full Body → Peace Sign → Squat → Shoot.

## Individual VRMA clips

Selectable motion-pack entries loop while selected. Prefer **Default** for the companion idle show.

## Custom animations folder (desktop)

Settings → Directories → Animations → **Custom**. See
[Bring your own `.vrma`](vrma.md#bring-your-own-vrma).

- Pick a folder with `.vrma` files → Gear → Animations lists **only** those,
  sorted by label; **Default** and the VRMA pack are gone.
- Pick a folder with no `.vrma` → error notice, folder **not** applied, previous
  source still selected in the row.
- Subfolder-only `.vrma` files count as empty (flat scan). So do clips the app
  cannot stat — a permission-denied `.vrma` is skipped by the scan itself, so a
  folder of only those reports "no `.vrma` files" rather than a read error.
- **Change folder** → selection moves to the first clip of the new folder.
- **Reset** on the row → bundled pack returns and **Default** replays.
- Restart the app → the same custom clip is selected. Delete that file, restart →
  first remaining clip is selected instead.
- **System → Reset all settings** → row returns to Default, `directories.animations`
  path cleared in `config.yaml`.
- Add, rename, or delete a `.vrma` while Custom is active → the menu does **not**
  change. The scan is keyed on the folder path, so re-picking the *same* folder is
  a no-op; pick a different folder and back, or restart. (Same for custom avatars
  and environments.) Renames read as a new clip, since ids hash the path.

## Debugging tips

- Open the console — VRMA load failures log as `[avatar] VRMA load failed`.
- Confirm the model’s humanoid rig matches the clip.
- Use **Camera & Lighting** to frame full-body clips like `vrma-01`.

## Next: automated triggers

Future work will map keywords and agent events to catalog `id` values. Manual selection is the reference path for validating clips first.
