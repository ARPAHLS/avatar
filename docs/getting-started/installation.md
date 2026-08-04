# Installation

Three ways to run AVATAR, simplest first.

## 1. Windows installer (easiest)

No Node.js. Download and run:

**[AVATAR-Setup-0.4.0.exe](https://github.com/ARPAHLS/avatar/releases/download/v0.4.0/AVATAR-Setup-0.4.0.exe)**

Also listed on [Releases](https://github.com/ARPAHLS/avatar/releases/tag/v0.4.0). Accept the EULA, finish the wizard, launch **AVATAR**.

<p align="center">
  <img src="../screenshots/installer.png" alt="AVATAR Windows installer — license agreement" width="100%" />
</p>

> Unsigned build: SmartScreen may warn — **More info** → **Run anyway**.

## 2. Desktop from source (Electron)

Requires **Node.js 20+** and **npm**. Builds the app, then opens the Electron companion:

```bash
cd avatar-demo
npm install
npm run desktop
```

For hot-reload while developing the UI:

```bash
npm run dev:desktop
```

## 3. Web app (browser)

Contributors / UI work in the browser (no system-audio loopback):

```bash
cd avatar-demo
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

---

## Build the Windows installer (from source)

```bash
cd avatar-demo
npm run dist:win
```

Produces `AVATAR-Setup-*.exe` under `desktop-setup/` at the repo root (local build output; not committed). Production packaging omits local `custom/` environment trials.

## Troubleshooting

| Issue | Fix |
| :--- | :--- |
| SmartScreen warning | Unsigned installer — More info → Run anyway |
| Blank stage | Confirm `avatar1.vrm` (etc.) under `src/assets/avatars/` |
| New VRM missing | Match `avatarN.vrm` naming; restart |
| Desktop audio missing | Voice → **Device output** or pick a window |
| Tab audio (browser) | Share tab with **Share tab audio** enabled |
