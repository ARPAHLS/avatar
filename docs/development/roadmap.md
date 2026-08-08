# Roadmap

## v0.6.0 — Shipped

- [x] Broader CI (lint / test / build) (#4, #34, #35)
- [x] ESLint coverage for Electron + build scripts (#34)
- [x] Package directory rename `avatar-demo/` → `avatar/`
- [x] Desktop companion docs GIFs (`AVATAR_M5_*`) (#3, #32)
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

## Next

- [ ] Keyword → animation mapping table (#7)
- [ ] Agent/event bus hook for external triggers (#6)
- [ ] Optional idle VRMA loop
- [x] Custom animation directories (`.vrma`) — Settings → Directories → Animations (#23)
- [ ] Animation hotkeys / keybindings (#24)
- [ ] Avatar thumbnail follow-ups (pre-warm, sidecars, cache prune) (#21)
- [ ] Environments picker flicker / GIF size (#22)
- [ ] Code-signed Windows installer
- [ ] Asset license audit and manifest
- [ ] Security review for capture permissions copy
- [ ] Harden VRoid Hub VRM download for restrictive networks / CDN paths
- [ ] Docs visual overhaul (reshoot screenshots / GIFs, layout rules)
