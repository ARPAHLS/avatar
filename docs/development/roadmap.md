# Roadmap

AVATAR is a **local-first** VRM companion: thin presenter first, then adapters (agents, local inference, hardware). Open issues in brackets; vision items may not have tickets yet.

---

## Next

Near-term product work on the desktop companion.

### Motion & triggers

- [ ] Local agent/event bus so external tools can drive the avatar (#6)
- [ ] Keyword → animation mapping table (#7) — thin consumer of the bus; intent detection stays pluggable
- [ ] Additive Animations menu — keep bundled clips, append custom, scroll + search (#46)
- [ ] Optional idle VRMA loop (#8)
- [ ] VRM facial expressions (presets + triggers) (#43)

### Voice & presence

- [ ] Reactive glass-bar live dot (amplitude + capture status) (#42)
- [ ] Improve lip-sync beyond amplitude cycling (#9)
- [x] Clearer capture-permission and privacy copy (#12)

### Appearance & performance

- [ ] Avatar thumbnail follow-ups (pre-warm, sidecars, cache prune) (#21)
- [ ] Cap stage WebGL DPR + low-power preference (#48)
- [ ] Environments accordion flicker (still open after picker posters) (#22)
- [ ] Optionally re-encode / shorten bundled stage env GIFs (Code / Bloom) — stage RAM follow-up from #22 / #49

### Quality & docs

- [ ] Docs visual overhaul (reshoot screenshots / GIFs, layout rules) (#33)
- [ ] Editorial pass — consistency, install path, dead ends (#14)
- [ ] Label usage guide for triage (#29)
- [ ] SECURITY.md vulnerability reporting (#26)
- [x] Asset license audit + machine-readable manifest (#11)
- [ ] Harden VRoid Hub VRM download for restrictive networks / CDN paths

### Distribution

- [ ] Code-signed Windows installer (#5)
- [ ] Public product site + launch / coverage push
- [ ] Microsoft Store packaging (after signing)

---

## Later / vision

Longer arc — plug-and-play adapters, not hard-coded models. See also [Your AI Needs a Physical Social Life](https://substack.com/@rosspeili/p-193057407).

### Local AI interface

- [ ] Ollama adapter (local LLM) as a first-class “brain” source
- [ ] Local voice-model adapter (TTS/STT pipeline beyond system audio capture)
- [ ] Pluggable Ollama → voice → avatar → optional local DB pipeline
- [ ] Parse local inference streams for keywords / tones → mapped events (anim / expression)
- [ ] Optional semantic / embedding triggers on top of the bus (#7 follow-up)

### Hardware / edge

- [ ] Slim / compact build path for low-resource devices
- [ ] Raspberry Pi / edge Linux companion (offline-capable)
- [ ] ESP32 + CYD (or similar) display mode — UI on device, inference on host first
- [ ] Fully edge offline path when the board can run the stack

### Personalization ecosystem

- [ ] Cosmetics / skins layer beyond current VRM samples
- [ ] Shareable customization packs (avatars, expressions, animations, cosmetics)
- [ ] “Companion gadget” framing: collect, customize, carry

### Social / ALS

- [ ] Social layer for autonomous logical systems (physical / social presence)

---

## Landed on main since v0.7.0

- [x] Clearer Voice capture-permission and privacy copy (#12)

## v0.7.0 — Shipped

- [x] Motion Deck — one-shot hotkeys without changing Animations selection (#24, #51)
- [x] Stage command layer + `animation.play` `mode: once` (#6, #50, #51)
- [x] Custom animations folder — Settings → Directories → Animations (#23, #45)
- [x] Production builds omit `custom/` env media by default (#13, #44)
- [x] Maintainer release checklist (#28, #47)
- [x] Environment picker still posters + lazy custom folder reads (#22 related, #49)
- [x] README badge cleanup (drop CI badge; VRM Docs → vrm.dev/en)
- [x] Avatar re-select no longer hides the stage (#6, #50)

## v0.6.0 — Shipped

- [x] Broader CI (lint / test / build) (#4, #34, #35)
- [x] ESLint coverage for Electron + build scripts (#34)
- [x] Package directory rename `avatar-demo/` → `avatar/`
- [x] Desktop companion GIFs (`AVATAR_M5_*`) (#3, #32)
- [x] `dev:desktop` concurrently `-k` teardown (#37, #38)
- [x] Custom environment library blob revoke-after-replace (#39, #40)
- [x] Citation: Heng-Cheng Hsu in `CITATION.cff` (#41)

## v0.5.0 — Shipped

- [x] Static Appearance avatar thumbnails (bundled + custom-folder cache) (#10, #20)
- [x] View on VRoid Hub from hearted-model conditions gate (#18, #19)
- [x] Avatars guide rename (`docs/avatars.md`) + issue-reporting checklist (#25, #27, #30, #31)
- [x] VRM dispose on swap + `dev:desktop` localhost fix (#20)

## v0.4.0 — Shipped

- [x] User Directories for avatars / environments (issue #2 redesign)
- [x] Appearance Skins removed (Directories / VRoid Hub instead)
- [x] Zenodo concept DOI + README citation badge

## v0.3.0 — Shipped

- [x] VRoid Hub bring-your-own OAuth + Appearance picker (session-only models)
- [x] VRM 1.0 facing fix + settings version 2 migration
- [x] Issue templates + label sync CI
- [x] Unversioned AVATAR Installer branding art

## v0.2.0 — Shipped

- [x] Electron desktop overlay (snap, pin/windowed, window scale, device loopback)
- [x] VRMA playback + Default greeting/loop sequence
- [x] Gear menus: Appearance / Voice / Camera / Animations / Settings
- [x] Drop-in `avatarN.vrm` catalog
- [x] Persisted `config.yaml` settings + reset
- [x] Documentation, screenshots, asset credits
- [x] Windows NSIS installer (`npm run dist:win`)
- [x] GitHub Release download path for `AVATAR-Setup-0.2.0.exe`
