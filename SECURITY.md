# Security policy

AVATAR is a **local-first** desktop companion (Electron). It does not require a cloud avatar service. This file explains how to report security issues and what is in scope.

## Supported versions

Security fixes are applied to:

| Version | Supported |
| :--- | :---: |
| Latest [GitHub Release](https://github.com/ARPAHLS/avatar/releases/latest) | ✅ |
| `main` on [ARPAHLS/avatar](https://github.com/ARPAHLS/avatar) | ✅ |
| Older releases | ❌ (please upgrade) |

Check your build: **Settings → System** shows the config path; the installer version matches the release tag (currently **0.7.0**).

## Reporting a vulnerability

**Do not** open a public GitHub issue for exploitable security problems.

Report privately to:

**input@arpacorp.net**

Subject line suggestion: `AVATAR security — short summary`.

You may also use [GitHub Security Advisories](https://github.com/ARPAHLS/avatar/security/advisories/new) on this repository if you prefer that workflow. Either path reaches the maintainers.

### What to include

- AVATAR version (installer tag or commit hash)
- OS and how you run it (Windows installer / `npm run dev:desktop` / browser dev)
- Clear steps to reproduce
- Expected vs actual behavior
- Impact (confidentiality, integrity, availability, local-only scope)
- Proof-of-concept if you have one (keep it minimal)

We will acknowledge receipt when we can and work on a fix on a best-effort basis. We do not operate a paid bug-bounty program.

## In scope

Issues we care about in this project:

| Area | Notes |
| :--- | :--- |
| **Desktop app & installer** | NSIS setup, Electron shell, IPC, file access under userData |
| **Local agent bus & MCP** | Loopback-only API (`127.0.0.1`), token handling, `/v1/command`, `/v1/socket`, `/mcp` — see [Local agent bus](docs/agents/local-bus.md#security) |
| **Audio capture & lip sync** | Microphone, window/tab capture, device loopback — permissions and local-only processing |
| **VRoid Hub OAuth** | Encrypted credentials/tokens in Electron userData, loopback callback, licensed model download |
| **Settings & persistence** | `config.yaml`, encrypted secrets (`safeStorage`), path handling for user Directories |
| **Dependencies** | Supply-chain issues in shipped runtime dependencies when they affect AVATAR users |

## Out of scope (usually)

These are intentional product boundaries or third-party scope:

- **Remote exposure of the agent bus** — binding beyond loopback, tunnels, or reverse proxies are unsupported; reports that require deliberately exposing the port are out of scope unless AVATAR itself enables it.
- **VRoid Hub / pixiv / BOOTH** — vulnerabilities in upstream services or in models you load from Hub; report those to the respective vendor.
- **User-supplied media** — malicious `.vrm`, `.vrma`, or environment files you placed in custom folders (use trusted assets only).
- **Social engineering** — phishing for your VRoid OAuth client secret or bus token.
- **Denial of service** from local processes when **Require token** is off and the bus is enabled — any local program can drive the avatar in that configuration by design.

## Product security notes (non-exhaustive)

- **No mandatory cloud.** Lip-sync analysis runs locally; audio is not uploaded for mouth movement. See [Privacy — what stays local](docs/voice/audio-sources.md#privacy-what-stays-local).
- **Agent bus is opt-in and off by default.** When enabled, it listens on loopback only. Keep **Require token** on unless you accept that any local process can control the stage while the bus runs.
- **VRoid Hub** uses your own OAuth app credentials, encrypted at rest. Hub model bytes stay in memory for the session and are not redistributed as repo assets.
- **Browser dev mode** (`npm run dev`) lacks desktop-only features (loopback capture, overlay, agent bus) and must not be treated as the production security surface.

For privacy and capture permissions (not always security bugs), see [CONTRIBUTING.md](CONTRIBUTING.md) or label `security-privacy` after coordinating with maintainers.

## Coordinated disclosure

We appreciate responsible disclosure. We will credit reporters in release notes when they agree, and we ask that you do not publish exploit details until a fix is available or we agree on a timeline.
