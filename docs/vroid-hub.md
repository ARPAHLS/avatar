# VRoid Hub connection

AVATAR can sign in to [VRoid Hub](https://hub.vroid.com) and use a character
its owner marked usable only through linked applications (no direct `.vrm`
download). This is **opt-in, off by default, and advanced**: you bring your
own registered OAuth app rather than sharing one built into AVATAR. It's an
Electron-only feature — it does nothing in the browser / `npm run dev`
preview.

Gear → **Settings** → **VRoid Hub**.

---

## Set up your own OAuth app

1. Register an application at
   [`hub.vroid.com/oauth/applications`](https://hub.vroid.com/oauth/applications).
2. Open Settings → VRoid Hub — it shows the exact redirect URI to register
   for the app: `http://127.0.0.1:47901/vroid-oauth-callback` by default (or
   the equivalent for a custom `AVATAR_VROID_OAUTH_PORT`). This is served by
   a small local loopback server, not the app's window, so sign-in works the
   same way from a dev build and an installed one.
3. Paste the app's client ID and secret into Settings and **Save**. They're
   encrypted at rest with Electron's `safeStorage` (OS keychain-backed) in
   `vroid-hub-credentials.json`, the same mechanism used for the resulting
   session tokens (`vroid-hub-auth.json`). If `safeStorage` isn't available
   on the current OS, the feature stays disabled rather than storing either
   in plaintext. On Linux specifically, this also covers Electron's
   `basic_text` fallback: if no keyring (GNOME Keyring/Secret Service or
   KWallet) is available, `safeStorage` reports itself as "available" but
   only encrypts with a hardcoded password — AVATAR treats that the same as
   no secure storage and disables saving rather than claim OS-backed
   protection it can't actually provide.

With no credentials configured, **Connect VRoid Hub account** stays disabled.

## Connect and pick a character

Once configured, **Connect VRoid Hub account** opens the VRoid Hub
authorization page in your system browser (PKCE + confidential client), then
lists characters the signed-in account owns or has hearted and marked
available to other users. Selecting one fetches its VRM bytes through VRoid
Hub's licensed `download_licenses` flow and holds them in memory for the
running session.

Selecting a **hearted** character (one you don't own) shows its conditions
of use — credit, commercial use, modification/redistribution, sexual/violent
expression — and its author's name before downloading it. Your own
characters skip this, since you already set those terms yourself.

AVATAR does **not** write a Hub-sourced model to disk as an ordinary, freely
reusable local file — it disappears on the next launch until reselected, and
it's kept out of `config.yaml` entirely (your built-in avatar/skin choice is
what's actually persisted). Switching to a built-in avatar and back to the
Hub character in the same session is instant — it's still in memory, so
nothing is re-downloaded.

**Disconnect** forgets the signed-in session (and the in-memory character)
but keeps your saved OAuth app credentials, so reconnecting doesn't require
re-entering them. **Remove app credentials** forgets the OAuth app itself and
implies a disconnect.

## Why it works this way

- **Loopback server, not the `avatar://` URL scheme.** Custom protocol
  registration isn't reliably testable across a dev checkout and a packaged
  install; a fixed local HTTP port is.
- **Session-only characters.** VRoid Hub's third-party integration rules
  gate linked-app-only characters on the connected session, not on
  unconditional local caching.
- **Own OAuth app per user.** Sharing one client secret across every AVATAR
  installation would mean every install could be revoked or rate-limited
  together; a per-user app avoids that and matches VRoid Hub's own
  developer-registration model.

See also: [Avatars & skins](avatars-and-skins.md) · [User settings](user-settings.md).
