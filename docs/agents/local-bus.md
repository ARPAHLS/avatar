# Local agent bus

A loopback-only command intake, so scripts and agent frameworks can drive the avatar without
scraping the UI: play an animation, swap the avatar, set the environment, switch the lip-sync
source.

It is the **same command layer** the gear menus and the animation hotkeys use — one set of
names, one set of error codes, whichever way a request arrives.

- **Desktop app only.** The browser build has no bus.
- **Off by default.** Turn it on in **Settings → Agents**.
- **127.0.0.1 only.** Nothing outside this machine can reach it, by design.

## Turning it on

Settings → **Agents** → *Enable local bus*.

| Control | |
| :--- | :--- |
| **Enable local bus** | Starts the server immediately — no restart |
| **Port** | `47903` by default. Fixed: if the port is taken the bus stays off and says so, rather than moving somewhere the examples do not point |
| **Require token** | On by default. A token is generated the first time you enable the bus and reused after that |
| **Copy token** / **Regenerate** | Regenerating invalidates the old one at once |
| **Copy example curl** | The command below, with your port and token filled in |

The token is **not** in `config.yaml` — it is encrypted with the OS keychain beside the VRoid Hub
credentials. On a machine with no keychain available the panel says so, and the token is kept in
memory only, which means it changes on every launch.

## Commands

`POST http://127.0.0.1:47903/v1/command`

```bash
curl -X POST http://127.0.0.1:47903/v1/command \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"command":"animation.play","payload":{"id":"Peace Sign","mode":"once"}}'
```

```json
{ "ok": true, "action": { "kind": "animation.play", "animationId": "vrma-03", "mode": "once" } }
```

| Command | Payload | |
| :--- | :--- | :--- |
| `animation.play` | `{ "id": …, "mode": "once" \| "select" }` | `id` matches an id **or a label** |
| `animation.default` | — | Back to the Default sequence |
| `animation.stop` | — | Ends a one-shot early; stopping nothing is not an error |
| `avatar.set` | `{ "id": "avatar2" }` | Ids only |
| `environment.set` | `{ "type": "env", "id": … }`, `{ "type": "color", "value": "#rrggbb" }` or `{ "type": "none" }` | |
| `audio.source` | `{ "id": "system" }` | Only sources this runtime has — see `/v1/state` |

> **`mode` is the one thing to get right.** Omitting it means `"select"`: the clip becomes the
> menu selection and is written to `config.yaml`, exactly as if you had picked it by hand. An
> agent reacting to something almost always wants `"once"`, which plays a single pass and leaves
> the selection alone.

A `200` means **accepted**, not finished: the VRM or the environment image may still be loading
when the response arrives. The last command wins, exactly as a hotkey does.

## What is on stage

`GET http://127.0.0.1:47903/v1/state`

```json
{
  "ok": true,
  "runtime": { "version": "0.7.0", "mode": "desktop" },
  "animations": [{ "id": "vrma-03", "label": "Peace Sign", "playableOnce": true }],
  "avatars": [{ "id": "avatar1" }, { "id": "avatar2" }],
  "environments": [{ "id": "stars", "label": "Stars" }],
  "audioSources": [{ "id": "system", "label": "Device output (auto)" }],
  "current": {
    "animationId": "default",
    "overlay": null,
    "avatarId": "avatar1",
    "environment": { "type": "env", "id": "stars" },
    "audioSourceId": "system"
  }
}
```

Ask for this before guessing ids. A custom animations folder derives its ids from file paths, so
`lib-anim-wave-4f2a9c1b7e03` is not something a caller can invent — but the label beside it,
`wave`, is a valid `animation.play` id. `playableOnce` tells you which clips accept
`"mode": "once"`. Avatars are ids only, deliberately.

`current` is there so an agent can toggle rather than only set.

## WebSocket

`ws://127.0.0.1:47903/v1/socket` — a peer of the HTTP route, not a wrapper around it. Same
commands, same errors, same token (as a header on the handshake).

```js
const socket = new WebSocket('ws://127.0.0.1:47903/v1/socket');
socket.send(JSON.stringify({ id: '1', command: 'animation.play', payload: { id: 'Greeting', mode: 'once' } }));
// { "id": "1", "ok": true, "action": { … } }
```

Every frame you send needs an `id`, and it comes back on the reply. **The server never sends a
frame without one.** Nothing is pushed today — if state events are added in a future version they
will arrive as id-less frames carrying a `type`, so a client written now can ignore them and keep
working.

## Errors

The body is the same shape the app uses internally:

```json
{ "ok": false, "code": "unknown-animation", "error": "No animation matches \"Peace Sing\"." }
```

| Status | Codes | |
| :--- | :--- | :--- |
| `400` | `bad-payload`, `unknown-command` | Malformed request or a command that does not exist |
| `401` | `unauthorized` | Missing or wrong token |
| `403` | `forbidden-host`, `forbidden-origin` | Not loopback, or sent by a web page |
| `404` | `unknown-animation`, `unknown-avatar`, `unknown-environment`, `unknown-audio-source`, `not-found` | The id — or the route — does not exist |
| `405` / `413` / `415` | | Wrong method, body over 16 KB, or not `application/json` |
| `409` | `not-playable-once` | That clip cannot be a one-shot; play it with `"select"` |
| `503` | `not-ready` | The window is still starting up, or reloading |

## Security

- Binds `127.0.0.1` only. **Remote binding is out of scope** — there is no setting for it, and
  exposing the port through a tunnel or reverse proxy is not supported.
- Any request carrying an `Origin` header is refused, on both the HTTP route and the WebSocket
  handshake. That keeps every web page out, including a local dev server you happen to have open.
- The `Host` header must name loopback and the port the bus is actually on.
- The token goes in `Authorization: Bearer …`. A token in the query string is refused on purpose —
  it would end up in shell history and logs.
- With **Require token** off, anything running on this machine can drive the avatar while the bus
  is on.

## Notes

- **MCP** is not part of this. An MCP server can sit on top of these HTTP commands; the bus stays
  the one control path underneath.
- Window control (move, scale, close) and loading a VRoid Hub character are not commands and are
  not planned to be.

## `config.yaml`

```yaml
agentBus:
  enabled: false
  port: 47903
  requireToken: true
```
