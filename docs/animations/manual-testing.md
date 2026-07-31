# Manual animation testing

## Dropdown workflow

The **Animation** control below the avatar replaces the old separate Idle / Laugh / Test buttons. All motions live in one grouped `<select>`:

- Change selection → clip or procedural state starts immediately.
- Re-selecting the same one-shot VRMA increments an internal request counter to replay it.
- When a one-shot VRMA finishes, the stage returns to **Idle**.

## Built-in procedural states

| ID | Purpose |
| :--- | :--- |
| `idle` | Default breathing idle |
| `laugh` | Exaggerated laugh for expression sanity checks |
| `test` | Hand-on-hip subtle idle |

These are useful when iterating on lip sync without fighting a skeletal clip.

## Debugging tips

- Open the browser console — VRMA load failures log as `[avatar] VRMA load failed`.
- Confirm the model's humanoid rig is compatible with the clip (mixing unrelated VRM/VRMA pairs can look wrong).
- Use **Camera & Lighting** to frame full-body clips like `vrma-01`.

## Next: automated triggers

Future work will map keywords and agent events to catalog `id` values. The manual dropdown is the reference path for validating clips before wiring automation.
