# Motion Deck

A short, user-built list of clips that can be fired — by key or by click —
without changing what Gear → **Animations** is set to. Each fires once and hands
the stage back to the selection. Settings → **Animation hotkeys**. (#24)

## What is in here

| File | |
| :--- | :--- |
| `chords.js` | keyboard chords as text, keyed off `event.code` |
| `motionDeck.js` | the deck itself: normalize, resolve, bind, heal |
| `useMotionDeck.js` | the one key listener, plus the panel's actions |
| `MotionDeckPanel.jsx` | Settings → Animation hotkeys |
| `containNestedWheel.js` / `useContainNestedWheel.js` | nested list wheel vs GlassDrawer |
| `motionDeck.css` | imported by the panel, not by the global stylesheet |

`chords.js`, `motionDeck.js`, and `containNestedWheel.js` are pure and covered by
`node --test`.

## What it is built on, and what it is not

The deck does not touch the mixer. It resolves a card to an id and calls one
stage command:

```js
runCommand('animation.play', { id, mode: 'once' })
```

`mode: 'once'` and `animation.stop` live in `src/lib/stageCommands.js`, and the
transient `motionOverlay` state they drive lives in `AvatarStage`. **That layer
is not part of this feature** — it is what the local agent bus (#6) and keyword
triggers (#7) are meant to use as well, and it stays if the deck goes.

## Removing it

Delete this folder, then remove:

- `src/config/userSettings.js` — the `motion-deck` import, `motionDeck` in
  `createDefaultUserSettings`, `normalizeUserSettings` and
  `snapshotUserSettings` (4 lines).
- `src/components/AvatarStage.jsx` — the three `motion-deck` imports, the
  `motionDeck` state, `useMotionDeck(...)`, `motionDeck` in the autosave
  snapshot and its dependency list, and the Animation hotkeys block in the
  settings drawer.

`grep -rn "motion-deck\|motionDeck" src` finds every one of them. A leftover
`motionDeck:` key in someone's `config.yaml` is ignored by
`normalizeUserSettings`, so nothing has to be migrated.

## Decisions worth not re-litigating

- **A card is never dropped because the catalog changed.** Pointing Directories
  → Animations at another folder replaces the catalog wholesale; the autosave in
  `AvatarStage` would persist a pruned deck within its debounce, so switching
  back would restore nothing. Cards resolve at draw and at fire time, and an
  unresolved one is shown as unavailable. `clearUnavailable` is the only sweep
  and only the user calls it.
- **Ids heal by label, uniquely or not at all.** A custom folder's ids hash the
  absolute path, so moving or renaming the folder changes every id while the
  file names do not. `healDeckIds` re-points a card when exactly one clip
  matches its remembered label — two folders can each hold `wave.vrma`, and a
  silent re-point would be worse than a dead card.
- **Binding steals the chord.** Two cards holding one chord has no defined
  behaviour, and refusing the binding throws away what the user just pressed.
  The card that lost it is named in the panel.
- **Only single clips can be added.** The Default sequence loops for as long as
  it is selected, so there is no frame at which the selection could come back.
  `stageCommands` rejects it too, with `not-playable-once`.
- **Keys work only while the window has focus.** No Electron `globalShortcut` in
  v1.
- **The deck is not capped.** A card costs nothing — clips resolve when drawn or
  fired — and the deck accumulates across animation folders on purpose, so a cap
  would refuse cards a user has every reason to keep. `MAX_CARDS` exists only so
  a mangled `config.yaml` cannot hand the panel an absurd list.
