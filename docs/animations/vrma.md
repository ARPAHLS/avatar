# VRMA animations

Gear → **Animations**.

Motions are `.vrma` clips — either the bundled VRMA motion pack under
`src/assets/avatars/VRMA/`, or your own folder
([Bring your own `.vrma`](#bring-your-own-vrma)).

---

## Default sequence

Menu label: **Default** (`id: default`). This is what runs on first launch.

<p align="center">
  <img src="../screenshots/AVATAR_M5_Animations_Select_Greeting.gif" alt="Selecting Greeting from the Animations menu" height="400" />
</p>

<p align="center">
  <img src="../screenshots/AVATAR_M5_loop.gif" alt="Default greeting and loop playing on the stage" height="400" />
</p>

| Phase | Clip label | File / id |
| :--- | :--- | :--- |
| Intro (once) | **Greeting** | `vrma-02` |
| Loop 1 | **Model Pose** | `vrma-06` |
| Loop 2 | **Show Full Body** | `vrma-01` |
| Loop 3 | **Peace Sign** | `vrma-03` |
| Loop 4 | **Squat** | `vrma-07` |
| Loop 5 | **Shoot** | `vrma-04` |
| → back to Loop 1 | … | forever |

**Spin** (`vrma-05`) is **not** in this loop — pick it manually if you want it.

---

## All selectable clips (bundled pack)

| Label | id | In Default? |
| :--- | :--- | :--- |
| Default | `default` | — (the sequence itself) |
| Show Full Body | `vrma-01` | Yes (loop) |
| Greeting | `vrma-02` | Yes (intro once) |
| Peace Sign | `vrma-03` | Yes (loop) |
| Shoot | `vrma-04` | Yes (loop) |
| Spin | `vrma-05` | No |
| Model Pose | `vrma-06` | Yes (loop) |
| Squat | `vrma-07` | Yes (loop) |

Internal **Rest** (`rest`) is not shown in the menu (bind pose for systems that need it).

---

## How to use

1. Gear → **Animations** (submenu expands upward; no scrollbar).  
2. Tap **Back** (circular) to return to the main gear.  
3. Choosing a clip starts it immediately; choosing **Default** restarts greeting + loop.  
4. Selection is stored in `config.yaml` as `animationId`.

---

## Bring your own `.vrma`

Desktop only. **Settings → Directories → Animations → Custom**, pick a folder,
and Gear → **Animations** lists that folder instead of the table above.

### Using the folder

- **Flat scan** — top level only; subfolders are ignored.
- **`.vrma` only** — everything else in the folder is skipped.
- **File name → menu label** — `my_wave.vrma` shows as **My Wave**
  (`_` and `-` become spaces, the menu title-cases them, and labels longer than
  24 characters are ellipsized). Sorted alphabetically by label.
- **Edits on disk are not live** — the scan is keyed on the folder path, so
  adding or renaming a clip while Custom is active needs a different folder (or a
  restart) to show up. Re-picking the same folder does nothing.
- Every custom clip **loops**. The bundled **Default** sequence is not
  rebuildable from a custom folder — it is a fixed intro-plus-loop list in code.
- **Replaces, does not add**: with Custom active, the **Default** sequence and
  the whole VRMA Motion Pack are hidden from the menu.
- An **empty folder**, or one with no `.vrma` files, is **not applied** — you get
  an error notice and the previous source is kept.
- A single bad clip never costs you the folder. One that **fails to parse** is
  skipped at playback time (console: `[avatar] VRMA load failed`); one that
  **disappears or locks** between the scan and the load is skipped and counted in
  the notice. The rest still work.
- A clip the app cannot even read attributes for (denied by file permissions) is
  invisible to the scan, so a folder of only those reads as **empty** and is not
  applied. Fix the permissions, or move the clips somewhere readable.
- Row **Reset** (or **System → Reset all settings**) returns to the bundled pack.

Row behavior and persistence: [Using the app → Directories](../using-the-app.md#directories-desktop)
· [User settings](../user-settings.md).

### Where to get or make them

AVATAR is the **player**, not an authoring tool — it ships none of the following
and takes no position on which you use:

| Route | What it gives you |
| :--- | :--- |
| [VRoid Hub Photo Booth](https://vroid.pixiv.help/hc/en-us/articles/28973617114777-How-to-Use-the-Photo-Booth) | Pixiv's own `.vrma` motions and the format's reference docs |
| [BOOTH](https://booth.pm/) | Motion packs from creators; check each listing for `.vrma` (not only `.fbx` / `.vmd`) |
| [Blender](https://www.blender.org/) + a VRMA exporter, or any DCC tool that writes VRMA | Full authoring — animate a VRM humanoid rig and export `.vrma` |
| Text-to-motion research pipelines, e.g. [Kimodo](https://github.com/nv-tlabs/kimodo) or [ARDY](https://github.com/nv-tlabs/ardy) | Generated motion — usable **only** if you retarget the output to a VRM humanoid and export `.vrma` |

Format reference: the [VRMA specification](https://github.com/vrm-c/vrm-specification/tree/master/specification/VRMC_vrm_animation-1.0)
(`VRMC_vrm_animation`). Clips drive the **VRM humanoid bone map**, not one
specific model — so a clip authored against any VRM humanoid plays on your
avatar. Expression and look-at tracks are optional and may be ignored.

### Licensing is on you

Rights to the clips you drop in that folder are **your responsibility** — same
as custom `.vrm` avatars. Check each pack's terms before using it, especially
for streaming or commercial work, and check the VRM model's own terms too: some
models restrict which kinds of motion may be applied to them. Nothing in that
folder is copied, bundled, or redistributed by AVATAR; it is read from where it
sits. See [Assets and credits](../assets-and-credits.md).

---

Manual QA checklist: [Manual testing](manual-testing.md).
