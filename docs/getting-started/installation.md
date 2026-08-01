# Installation

## Requirements

- **Node.js 20 or newer**
- **npm**
- Chrome or Edge recommended (WebGL + Web Audio; tab capture on browser)

## Browser

```bash
cd avatar-demo
npm install
npm run dev
```

Dev server: [http://localhost:5173](http://localhost:5173).

## Desktop (Electron)

```bash
cd avatar-demo
npm install
npm run dev:desktop
```

Hot-reload UI with a transparent overlay window.

### Production desktop build

```bash
npm run desktop
```

Builds the Vite app, then opens Electron against `dist/`.

A packaged Windows **`.exe` installer** will be published for users who do not want to run from Node or the browser.

## Web production bundle

```bash
npm run build
npm run preview
```

Output: `avatar-demo/dist/`.

## Troubleshooting

| Issue | Fix |
| :--- | :--- |
| Blank stage | Confirm `.vrm` files under `src/assets/avatars/` |
| VRMA clip fails | Check console; verify paths in `src/config/animations.js` |
| Tab audio silent | Re-share the tab with **Share tab audio** enabled (Chrome) |
| Lip sync never activates | Gear → **Voice**, pick a source, wait for status `active` |
| Desktop audio missing | Use **Device output** (loopback) or pick a specific window |
