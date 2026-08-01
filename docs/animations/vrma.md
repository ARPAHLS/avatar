# VRMA animations

Gear → **Animations**.

Motions are `.vrma` clips from the bundled VRMA motion pack under `src/assets/avatars/VRMA/`.

---

## Default sequence

Menu label: **Default** (`id: default`). This is what runs on first launch.

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

## All selectable clips

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

Manual QA checklist: [Manual testing](manual-testing.md).
