# Assets & credits

This document covers third-party character and animation assets shipped with AVATAR. **AVATAR** (this software) is MIT-licensed; **bundled media retain their original rights holders’ terms**.

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
| Status | Sample avatars for testing lip sync and motion |

Users who ship their own builds **must** use only assets they have rights to, and must obey each creator’s BOOTH / VRoid Hub terms of use (credit, redistribution, commercial use, streaming, etc.). Policies vary per item — always check the product page.

Relevant links:

- [VRoid](https://vroid.com/)
- [BOOTH](https://booth.pm/)
- [VRoid Hub Photo Booth / .vrma FAQ](https://vroid.pixiv.help/hc/en-us/articles/28973617114777-How-to-Use-the-Photo-Booth)

---

## VRMA animations (7 free motion pack)

Bundled under `avatar-demo/src/assets/avatars/VRMA/`.

These are the **seven free VRM Animation (`.vrma`) files** distributed by the **VRoid Project** on **BOOTH** (announced February 2024 with VRoid Hub Photo Booth / `.vrma` support). See:

- [VRoid news — Photo Booth, BOOTH .vrma, 7 free animations](https://vroid.com/en/news/6HozzBIV0KkcKf9dc1fZGW)
- [BOOTH](https://booth.pm/) — search the official VRoid Project shop / `#VRMA`
- Local terms copy: [`Readme_VRMA_MotionPack_EN.txt`](../avatar-demo/src/assets/avatars/VRMA/Readme_VRMA_MotionPack_EN.txt)

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

## Runtime libraries (not BOOTH assets)

| Package | Role |
| :--- | :--- |
| [`@pixiv/three-vrm`](https://github.com/pixiv/three-vrm) | VRM loading / rendering |
| [`@pixiv/three-vrm-animation`](https://github.com/pixiv/three-vrm) | `.vrma` playback |

These are open-source libraries under their own licenses (see each package).

---

## Disclaimer

AVATAR is an independent open-source ARPA project. It is **not** affiliated with, endorsed by, or sponsored by pixiv Inc., VRoid Project, or BOOTH, except that it uses publicly distributed free assets and open-source libraries according to their stated terms.

Sample assets may be replaced at any time. Do not treat bundled characters or motions as permanent product branding.
