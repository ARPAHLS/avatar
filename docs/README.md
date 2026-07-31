# VOX Avatar — Documentation

Welcome to the VOX Avatar docs. This guide covers installation, animation testing, lip sync, and how the codebase is organized.

## Start here

| Section | Description |
| :--- | :--- |
| [Getting started](getting-started/installation.md) | Install dependencies and run the dev server |
| [First session](getting-started/first-session.md) | Avatar, environments, voice, camera, animations |
| [Architecture overview](architecture/overview.md) | How rendering, VRMA, and audio fit together |

## Animations

| Doc | Description |
| :--- | :--- |
| [VRMA catalog](animations/vrma.md) | Motion pack entries and how clips are registered |
| [Manual testing](animations/manual-testing.md) | Dropdown workflow and adding new clips |

## Voice & lip sync

| Doc | Description |
| :--- | :--- |
| [Lip sync](voice/lip-sync.md) | Amplitude viseme model and tuning notes |
| [Audio sources](voice/audio-sources.md) | Microphone, tab capture, and file playback |

## Development

| Doc | Description |
| :--- | :--- |
| [Project layout](development/project-layout.md) | Folders, config files, and conventions |
| [Roadmap](development/roadmap.md) | Near-term milestones |

## Media placeholders

Screenshot and GIF slots are reserved for upcoming releases. Suggested captures:

- Default avatar viewport (circular frame, pastel chrome)
- Palette panel with Avatar picker and environments
- VRMA motion mid-playback
- Lip sync active indicator with tab audio

Store assets under `docs/assets/` when ready and link them from the relevant pages.
