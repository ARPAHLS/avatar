# Using AVATAR — complete user guide

This guide walks through every control in the **Electron desktop companion**. Prefer the [Windows installer](https://github.com/ARPAHLS/avatar/releases/download/v0.4.0/AVATAR-Setup-0.4.0.exe) when you can. From source: `npm run desktop`. Browser / localhost (`npm run dev`) is for contributors; some desktop-only features (overlay, device loopback, window scale, snap pad) are unavailable or limited there.

**Related:** [Installation](getting-started/installation.md) · [User settings / config.yaml](user-settings.md)

---

## 1. What you see on launch

1. A transparent **always-on-top** window appears (overlay mode).
2. The avatar loads (**Avatar 1** by default).
3. Motion starts on **Default**:
   - **Greeting** plays once
   - Then a loop forever: **Model Pose → Show Full Body → Peace Sign → Squat → Shoot**
4. On desktop, **audio** defaults to **Device output (auto)** so lip sync can follow system sound when capture is active.
5. Environment defaults to a soft **lavender color fade** (`#e9e1fa`).
6. Preferences from a previous session load from **`config.yaml`** if present (see [User settings](user-settings.md)).

Glass **bar** at the bottom: drag handle (line), **window scale**, optional green **live** dot, **gear** menu.

<p align="center">
  <img src="screenshots/01-hero-overlay-dark-ide.png" alt="Overlay on a dark IDE" width="100%" />
</p>

<p align="center">
  <img src="screenshots/02-hero-overlay-light-page.png" alt="Overlay on a light page" width="100%" />
</p>

<p align="center">
  <img src="screenshots/10-bar-idle.png" alt="Glass bar idle" height="100" />
  <img src="screenshots/11-bar-live-dot.png" alt="Glass bar with live lip-sync dot" height="100" />
</p>

---

## 2. Glass bar

### Move the window

- Drag the **horizontal glass line**.
- Or open **Settings** and use the **3×3 snap pad** to jump to a screen position.

### Window scale (desktop)

Tap the **Scaling** control (left of the live dot / gear). Choose:

| Preset | Effect |
| :--- | :--- |
| **×0.5** | Half size |
| **×1** | Default (~420×560 logical) |
| **×2** | Double size |

Scale is remembered in `config.yaml`.

<p align="center">
  <img src="screenshots/12-scale-menu.png" alt="Scale menu" height="200" />
</p>

<p align="center">
  <img src="screenshots/13-scale-x0.5.png" alt="Companion at half scale" width="100%" />
</p>

<p align="center">
  <img src="screenshots/14-scale-x1.png" alt="Companion at default scale" width="100%" />
</p>

<p align="center">
  <img src="screenshots/15-scale-x2.png" alt="Companion at double scale" width="100%" />
</p>

### Live lip-sync dot

A **green pulsing dot** appears when lip sync is actively capturing (`Audio source` not Off, status `active`). Hover title: *Lip sync active*.

### Gear menu

| Item | Opens / does |
| :--- | :--- |
| **Appearance** | Avatars (built-ins or custom folder + VRoid Hub), environments |
| **Voice** | Audio source / lip sync |
| **Camera & Lighting** | Camera, lights, avatar transform |
| **Animations** | Submenu of clips (no drawer) |
| **Pinned / Windowed** | Toggle overlay vs opaque window (desktop) |
| **Settings** | Overlay mode, Snap to screen, **Directories**, **VRoid Hub**, **System** (reset / config path) |
| **Close** | Quit the companion window (desktop) |

<p align="center">
  <img src="screenshots/20-gear-main.png" alt="Main gear menu" height="240" />
  <img src="screenshots/21-gear-animations.png" alt="Animations submenu" height="240" />
</p>

---

## 3. Appearance

Gear → **Appearance**.

### Avatars

Pick **Avatar 1 / 2 / 3** when Directories → Avatars is **Default**.  
On desktop you can point Settings → Directories → Avatars at a folder of `.vrm` files — Appearance then shows **those instead** of the bundled list. **VRoid Hub** stays under Avatars either way. Details: [Avatars](avatars-and-skins.md).

On **desktop**, when VRoid Hub is connected, a **VRoid Hub** block appears
under the built-in thumbnails so you can pick Hub characters here (setup
still lives under Settings). See [VRoid Hub connection](vroid-hub.md).

<p align="center">
  <img src="screenshots/30-appearance-avatars.png" alt="Appearance Avatars section" height="240" />
  <img src="screenshots/31-appearance-avatars-custom-dir.png" alt="Appearance Avatars from a custom folder" height="240" />
</p>

<p align="center">
  <img src="screenshots/74-vroid-appearance-avatars-hub.png" alt="Appearance with VRoid Hub list" height="280" />
</p>

<p align="center">
  <img src="screenshots/75-vroid-appearance-loading.png" alt="Hub character loading" height="200" />
  <img src="screenshots/76-vroid-license-gate.png" alt="Hearted model conditions of use" height="240" />
</p>

### Environments

| Option | What you get |
| :--- | :--- |
| **Stars** | Dark starfield GIF |
| **Code** | Code-rain GIF |
| **Bloom** | Bright pastel GIF (bar often switches to “light” chrome) |
| **None** | No stage backdrop — desktop shows through (overlay) |
| **Custom** | Desktop: Settings → Directories → Environments (`.gif` / `.png` / `.jpg` / `.jpeg`). Dev with Directories Default: also `src/assets/environments/custom/`. Opening Custom hides built-ins until closed; Color fade stays pinned under the list |
| **Color fade** | Soft glow from a color you pick → **Use color** |
| **Reset** | Back to lavender `#e9e1fa` |

<p align="center">
  <img src="screenshots/32-appearance-env-builtin.png" alt="Built-in environments" height="220" />
  <img src="screenshots/33-appearance-env-custom.png" alt="Custom environments open" height="220" />
  <img src="screenshots/34-appearance-env-custom-dir.png" alt="Custom environments from Directories folder" height="220" />
</p>

Full detail: [Environments](environments.md).

### Bar & button colors (chrome)

The bar and circular controls adapt to what sits **behind** the bar:

| Backdrop | Bar | Buttons |
| :--- | :--- | :--- |
| **Dark** | Whitish | Darker grey glass + **white** icons |
| **Light** | Grey | Lighter grey glass + **dark** icons |

In overlay mode the app samples the desktop near the window **after you finish moving** (and on focus), then crossfades bar/button colors. Environment GIFs themselves never change. In browser / windowed mode chrome follows the chosen environment.

<p align="center">
  <img src="screenshots/40-chrome-dark-backdrop.png" alt="Bar on dark backdrop" height="110" />
  <img src="screenshots/41-chrome-light-backdrop.png" alt="Bar on light backdrop" height="110" />
</p>

---

## 4. Voice & lip sync

Gear → **Voice**.

**Go deeper:** [Audio sources](voice/audio-sources.md) (every input) · [Lip sync](voice/lip-sync.md) (how the mouth moves).

### Desktop defaults

| Source | When to use |
| :--- | :--- |
| **Device output (auto)** | *(Default)* Follow speakers / system audio via loopback |
| **Pick app window** | Lip sync to one app/window’s audio |
| **Microphone** | Your mic |
| **Audio file** | Play a local file into the analyser |
| **Off** | No lip sync |

### Browser (dev) sources

**Off** *(default)*, **Microphone**, **Tab or window audio**, **Audio file**.

### Tips

- Status line shows `idle` / `starting` / `active` / `error` / …
- Use **Restart audio capture** if OS permissions or devices change.
- Mouth shapes are **amplitude-based** (not phoneme ASR). See [Lip sync](voice/lip-sync.md) and [Audio sources](voice/audio-sources.md).

<p align="center">
  <img src="screenshots/50-voice-panel.png" alt="Voice panel" height="200" />
  <img src="screenshots/51-voice-window-pick.png" alt="Pick app window" height="200" />
</p>

<p align="center">
  <img src="screenshots/52-voice-microphone.png" alt="Microphone selected" height="200" />
  <img src="screenshots/53-voice-file.png" alt="Audio file source" height="200" />
</p>

<p align="center">
  <img src="screenshots/54-voice-active-lipsync.png" alt="Active lip sync on desktop" width="100%" />
</p>

---

## 5. Camera & Lighting

Gear → **Camera & Lighting**. Three sections:

### Camera

| Control | Default | Notes |
| :--- | :--- | :--- |
| **X** | `-0.01` | Horizontal framing |
| **Y** | `0.59` | Height (heads stay in frame) |
| **Z** | `1.69` | Distance |
| **Look Y** | `0.5` | Look-at height |
| **FOV** | `26.8` | Field of view |

- **Reset Camera** — restore all camera defaults.
- **Double-click** a slider — reset **that** control only.

### Lighting

| Control | Default |
| :--- | :--- |
| **Intensity** | `0.7` |
| **X / Y / Z** | `1, 2, 2` |
| **Color** | `#ffffff` |

- **Reset Light** — full lighting defaults.
- Double-click sliders for per-axis / intensity reset.

### Avatar transform

Position **X / Y / Z** (default `0, -1.03, -1.48`).  
**Reset Avatar** restores position and default facing.

See [Camera & lighting](camera-and-lighting.md).

<p align="center">
  <img src="screenshots/60-camera-panel.png" alt="Camera panel" height="200" />
  <img src="screenshots/61-lighting-panel.png" alt="Lighting panel" height="200" />
  <img src="screenshots/62-avatar-transform-panel.png" alt="Avatar transform panel" height="200" />
</p>

<p align="center">
  <img src="screenshots/63-camera-framed-bust.png" alt="Default camera framing" height="220" />
  <img src="screenshots/64-camera-full-body-hint.png" alt="Fuller body framing" height="220" />
</p>

---

## 6. Animations

Gear → **Animations**.

### Default (recommended)

1. **Greeting** once  
2. Loop: **Model Pose → Show Full Body → Peace Sign → Squat → Shoot**

**Spin** is available as a one-off clip but is **not** in the Default loop.

### Individual clips

Pick any listed VRMA clip to play that motion only. Choosing **Default** again restarts the greeting + loop.

Catalog: [VRMA](animations/vrma.md).

<p align="center">
  <img src="screenshots/21-gear-animations.png" alt="Animations menu" height="260" />
</p>

---

## 7. Settings

Gear → **Settings**. Section titles share one style: **Overlay mode**, **Snap to screen**, **Directories**, **VRoid Hub**, **System**.

### Overlay mode (desktop)

- **On (Pinned):** Transparent, always on top — companion over your apps.
- **Off (Windowed):** Opaque lavender window, normal stacking.

Also toggle from the gear **Pinned / Windowed** item.

### Snap to screen

Tap a cell in the **3×3 pad** (divider separates this from Overlay mode):

```text
Top left     | Top center     | Top right
Center left  | Center         | Center right
Bottom left  | Bottom center  | Bottom right
```

The active cell stays **highlighted**. If you **drag** the glass bar by hand, the highlight clears (no cell selected).

<p align="center">
  <img src="screenshots/80-settings-panel.png" alt="Settings — Overlay, Snap, Directories, VRoid Hub, System" height="260" />
  <img src="screenshots/82-settings-directories.png" alt="Settings Directories section" height="260" />
  <img src="screenshots/81-snap-pad-selected.png" alt="Snap pad with a cell selected" height="240" />
  <img src="screenshots/85-windowed-mode.png" alt="Windowed mode" height="240" />
</p>

### Directories (desktop)

Three rows — **Avatars**, **Animations**, **Environments**:

| Row | Behavior |
| :--- | :--- |
| **Avatars** | `Default` (bundled) or `Custom` folder of `.vrm` files — **replaces** the Appearance avatar strip |
| **Environments** | `Default` or `Custom` folder of images — **adds** the Appearance Custom expander; built-ins stay |
| **Animations** | `Default` only; Custom is greyed out (*coming soon*) |

A folder with no matching files is **not** applied (error notice; previous source kept). Reset a row (or **System → Reset all settings**) returns that source to Default. Choices persist in `config.yaml` under `directories` (mode + path).

### VRoid Hub (desktop)

Register your own VRoid Hub OAuth app, paste Client ID / secret,
then **Connect VRoid Hub account**. After connecting, pick characters under
**Appearance → Avatars**. Hub models are **not** stored on disk — they last
for the current session only.

Full steps (redirect URI, app form fields, hearted-model license gate,
troubleshooting): [VRoid Hub connection](vroid-hub.md).

<p align="center">
  <img src="screenshots/70-vroid-settings-setup.png" alt="VRoid Hub setup in Settings" height="240" />
  <img src="screenshots/71-vroid-settings-connect.png" alt="Connect VRoid Hub account" height="240" />
</p>

<p align="center">
  <img src="screenshots/72-vroid-browser-authorize.png" alt="Browser connected page and Settings connected state" width="100%" />
</p>

### System

**Reset all settings** wipes saved preferences (including Directories paths) and restores factory defaults (avatar, animation, environment, camera, light, avatar transform, audio source, overlay, window scale, directories). It does **not** remove encrypted VRoid Hub credentials — use **Remove app credentials** / **Disconnect** in the VRoid Hub block for that.

### Per-control resets (not “all”)

| Where | Control |
| :--- | :--- |
| Appearance → Environments | **Reset** (color fade) |
| Camera & Lighting → Camera | **Reset Camera** / double-click slider |
| Camera & Lighting → Lighting | **Reset Light** / double-click slider |
| Camera & Lighting → Avatar | **Reset Avatar** / double-click slider |
| Voice | **Restart audio capture** (does not change which source is selected) |

Persistence details: [User settings](user-settings.md).

---

## 8. Everyday workflow (quick)

1. Place the companion with drag or the snap pad.  
2. Set scale ×0.5 / ×1 / ×2.  
3. Appearance → pick avatar and environment. Optional: Settings → Directories for local folders, and/or Settings → connect VRoid Hub then Appearance → pick a Hub character.  
4. Voice → Device output (or window/mic) until the green dot appears when sound plays.  
5. Leave **Default** animation running, or pick a single clip.  
6. Nudge Camera if framing feels off; use section resets or **Reset all** if you want a clean slate.

---

## 9. Keyboard / mouse notes

- There is no global hotkey set yet — all actions are pointer-driven.  
- Click outside a drawer/menu (or blur the window on desktop) to dismiss menus.  
- The 3D canvas does not steal drag — move via the glass bar.
