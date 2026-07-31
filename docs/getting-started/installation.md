# Installation

## Requirements

- **Node.js 20 or newer**
- **npm**
- A desktop browser with WebGL and Web Audio support (Chrome or Edge recommended for tab audio capture)

## Steps

```bash
cd avatar-demo
npm install
npm run dev
```

The dev server starts at [http://localhost:5173](http://localhost:5173).

## Production build

```bash
npm run build
npm run preview
```

Output is written to `avatar-demo/dist/`.

## Troubleshooting

| Issue | Fix |
| :--- | :--- |
| Blank avatar circle | Confirm `.vrm` files exist under `src/assets/avatars/` |
| VRMA clip fails | Check browser console; verify `.vrma` paths in `src/config/animations.js` |
| Tab audio silent | Re-share the tab with **Share tab audio** enabled (Chrome) |
| Lip sync never activates | Open **Voice**, pick a source, wait for status `active` |
