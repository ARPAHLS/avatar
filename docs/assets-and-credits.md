# Assets & credits

This document covers third-party character, animation, and environment assets shipped with AVATAR. **AVATAR** (this software) is MIT-licensed; **bundled media retain their original rights holders’ terms**.

## Contact for rights / takedown

If you are a rights holder and believe any bundled asset should be removed or attributed differently, contact:

**input@arpacorp.net**

We will respond and remove or replace the asset promptly.

---

## VRM characters

| Item | Notes |
| :--- | :--- |
| Source | Created / customized in [VRoid Studio](https://vroid.com/en/studio) and [VRoid Hub](https://hub.vroid.com/) |
| Cost | **Free only** — no paid VRoid / BOOTH models, wearables, hair, clothes, or textures are used in this repository |
| Status | Sample files named `avatar1.vrm`, `avatar2.vrm`, `avatar3.vrm` for testing |

Users who ship their own builds **must** use only assets they have rights to, and must obey each creator’s BOOTH / VRoid Hub terms of use (credit, redistribution, commercial use, streaming, etc.). Policies vary per item — always check the product page.

### VRoid Hub linked characters (optional)

When a user connects their own Hub OAuth app, AVATAR may load characters through
VRoid Hub’s licensed download flow. Those bytes stay **in memory for the
session only** and are not redistributed as repo assets. Hearted models show
their Hub conditions of use in-app before selection. See
[VRoid Hub connection](vroid-hub.md).

### Your own files (self-serve)

Beyond bundled samples, desktop users can point **Settings → Directories** at local folders (`.vrm` avatars; `.gif` / `.png` / `.jpg` / `.jpeg` environments) or connect **VRoid Hub**. You are responsible for rights to any files or Hub characters you load. Guides: [Avatars](avatars.md) · [Environments](environments.md) · [Using the app](using-the-app.md).

Relevant links:

- [VRoid](https://vroid.com/)
- [BOOTH](https://booth.pm/)
- [VRoid Hub Photo Booth / .vrma FAQ](https://vroid.pixiv.help/hc/en-us/articles/28973617114777-How-to-Use-the-Photo-Booth)

---

## VRMA animations (7 free motion pack)

Bundled under `avatar/src/assets/avatars/VRMA/`.

These are the **seven free VRM Animation (`.vrma`) files** distributed by the **VRoid Project** on **BOOTH** (announced February 2024 with VRoid Hub Photo Booth / `.vrma` support). See:

- [VRoid news — Photo Booth, BOOTH .vrma, 7 free animations](https://vroid.com/en/news/6HozzBIV0KkcKf9dc1fZGW)
- [BOOTH](https://booth.pm/) — search the official VRoid Project shop / `#VRMA`
- Local terms copy: [`Readme_VRMA_MotionPack_EN.txt`](../avatar/src/assets/avatars/VRMA/Readme_VRMA_MotionPack_EN.txt)

### Clips included

| File | Label |
| :--- | :--- |
| `VRMA_01.vrma` | Show full body |
| `VRMA_02.vrma` | Greeting |
| `VRMA_03.vrma` | Peace sign |
| `VRMA_04.vrma` | Shoot |
| `VRMA_05.vrma` | Spin |
| `VRMA_06.vrma` | Model pose |
| `VRMA_07.vrma` | Squat |

### Official terms (summary)

By using these files you agree to the distributor’s terms (full text in the Readme above). Key points:

1. **Copyright** — Remains with **pixiv Inc.**, whether or not the data is modified.
2. **No warranty** — The distributor is not liable for damage or loss from use.
3. **Terms may change**; distribution may be updated or suspended without notice.
4. **Governing law** — Japan.
5. **Prohibited** (non-exhaustive): redistributing motions/alterations in a form that can be re-rigged or extracted without permission; religious/political use as defined in the terms; denigrating third parties; illegal use; infringing third-party rights; sexual or significantly violent content.
6. **Allowed** (when not prohibited): customize; personal and commercial use by individuals or corporations **with required credit**.

### Required credit (commercial / public use)

English:

> **Animation credits to pixiv Inc.'s VRoid Project**

Japanese:

> **キャラクターアニメーション: ピクシブ株式会社 VRoidプロジェクト**

Usage questions (official): [pixiv / VRoid support inquiry](https://www.pixiv.net/support?type=45&mode=inquiry&service=vroid-feedback)

Project contact for this repository’s use of the pack: **input@arpacorp.net**

---

## Built-in environment GIFs

Path: `avatar/src/assets/environments/`. Sourced from [GIPHY](https://giphy.com/) as free / publicly shared backgrounds for sample stage backdrops.

| File | Label | Source / credit |
| :--- | :--- | :--- |
| `stars.gif` | Stars | [Stars Background](https://giphy.com/gifs/stars-U3qYN8S0j3bpK) — watermark **Lemat Works**; treated as copyright-free on GIPHY |
| `code.gif` | Code | [Background Code](https://giphy.com/gifs/justin-hSLDN6zfh2Yy4ekMWi) by **Justin** (@justin) |
| `bloom.gif` | Bloom | From GIPHY (copyright-free); original page link not recovered |

Custom environment folders (Settings → Directories or `custom/`) are the user’s responsibility — see [Environments](environments.md).

---

## Runtime libraries (not BOOTH assets)

| Package | Role |
| :--- | :--- |
| [`@pixiv/three-vrm`](https://github.com/pixiv/three-vrm) | VRM loading / rendering |
| [`@pixiv/three-vrm-animation`](https://github.com/pixiv/three-vrm) | `.vrma` playback |

These are open-source libraries under their own licenses (see each package).

---

## Disclaimer

AVATAR is an independent open-source ARPA project. It is **not** affiliated with, endorsed by, or sponsored by pixiv Inc., VRoid Project, BOOTH, or GIPHY, except that it uses publicly distributed free assets and open-source libraries according to their stated terms.

Sample assets may be replaced at any time. Do not treat bundled characters, motions, or environment GIFs as permanent product branding.
