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
| **Copy MCP URL** | The MCP endpoint for this install — see [MCP](#mcp) |

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

Every frame you send needs an `id`, and it comes back on the reply — `null` only when the frame you
sent had none to echo. **Every reply carries the field.** Nothing is pushed today; if state events
are added in a future version they will carry no `id` at all and a `type` instead, so a client
written now can ignore them and keep working.

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
| `405` / `413` / `415` | | Wrong method, body over 16 KB (256 KB on `/mcp`, whose frames carry client metadata), or not `application/json` |
| `409` | `not-playable-once` | That clip cannot be a one-shot; play it with `"select"` |
| `500` | `internal-error` | The window could not be reached — it was closing as the request arrived |
| `503` | `not-ready` | The window is still starting up, or reloading |

## MCP

`POST http://127.0.0.1:47903/mcp` — a Streamable HTTP **MCP server**, so an agent in your editor
can drive the avatar without anyone hand-rolling HTTP calls. A peer of the routes above, not a
wrapper around them: same dispatch, same catalog, same refusals.

Register the endpoint with your client. Every client spells that differently, so the panel hands
over the two values they all need rather than one client's command line: **Copy MCP URL** and
**Copy token**, in the one block, because they are one server — same switch, same token, same
port. The token travels in an `Authorization: Bearer` header, as it does everywhere else here.

```bash
# Claude Code, for example
claude mcp add --transport http avatar http://127.0.0.1:47903/mcp \
  --header "Authorization: Bearer <token>"
```

The endpoint exists exactly while the bus is running. There is no separate MCP switch: **Enable
local bus** and **Require token** govern this route and the ones above together.

| Tool | Input | |
| :--- | :--- | :--- |
| `list_stage` | — | Everything `/v1/state` returns. Read-only |
| `get_status` | — | Ready or not, and what is on stage. Answers while the window is still starting |
| `play_animation` | `animation`, `persist?` | `animation` takes an id **or a label** |
| `stop_animation` | — | Ends a one-shot early |
| `set_avatar` | `avatar` | Ids only |
| `set_environment` | `type`, `id?`, `color?` | The three shapes `environment.set` takes |

> **`persist` is the `mode` question, asked the other way round.** This surface is read by a
> model, so its default is the one an agent almost always wants: `play_animation` plays **once**
> and leaves the selection alone. `persist: true` is the deliberate opt-in that changes the
> selection and writes it to `config.yaml`.

`audio.source` is not exposed. It is the user's lip-sync setting, and one fewer tool is one fewer
thing for a model to reach for by mistake.

A refused command comes back as a **tool error carrying the way out** — an unknown id says to call
`list_stage`, a looping sequence says to use `persist` — rather than as a protocol error, because
the model is the one who has to fix it.

**Stateless.** One server per request, no sessions, nothing pushed. `GET` and `DELETE` on `/mcp`
are answered `405`: clients written against protocol revisions before `2026-07-28` try both, and a
`405` tells them to stop rather than to retry.

### What breaks a registration

- **Changing the port**, or **Regenerate**: what you registered still names the old value. Copy it
  again and re-register.
- **No OS keychain**: the token changes every launch, so a registration made with one will not
  survive a restart.
- **Clients that send an `Origin` header** are refused, like every other route here — see
  Security. Command-line clients do not send one; a webview-based desktop client may, and is not
  supported in this version.

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

- Window control (move, scale, close) and loading a VRoid Hub character are not commands and are
  not planned to be.

## `config.yaml`

```yaml
agentBus:
  enabled: false
  port: 47903
  requireToken: true
```
