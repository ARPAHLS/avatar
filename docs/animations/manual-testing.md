# Manual animation testing

## Gear → Animations

All motions are selected from the gear **Animations** submenu:

- Change selection → clip or sequence starts immediately.
- Re-selecting the same entry increments a request counter to replay it.
- **Default** plays Greeting once, then loops Model Pose → Show Full Body → Peace Sign → Squat → Shoot.

## Individual VRMA clips

Selectable motion-pack entries loop while selected. Prefer **Default** for the companion idle show.

## Debugging tips

- Open the console — VRMA load failures log as `[avatar] VRMA load failed`.
- Confirm the model’s humanoid rig matches the clip.
- Use **Camera & Lighting** to frame full-body clips like `vrma-01`.

## Next: automated triggers

Future work will map keywords and agent events to catalog `id` values. Manual selection is the reference path for validating clips first.
