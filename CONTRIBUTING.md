# Contributing

Thanks for helping shape AVATAR.

## Run locally

1. Windows end users: [AVATAR-Setup-0.2.0.exe](https://github.com/ARPAHLS/avatar/releases/download/v0.2.0/AVATAR-Setup-0.2.0.exe)  
2. Desktop from source: `cd avatar-demo && npm install && npm run desktop`  
3. Web app: `npm run dev`  

Details: [Installation](docs/getting-started/installation.md).

## Before you open a PR

1. Run `npm run lint` and `npm run build` inside `avatar-demo/`.
2. Keep changes scoped — one feature or fix per PR when possible.
3. Update `CHANGELOG.md` under `[Unreleased]` for user-visible changes.
4. Add or adjust docs when behavior changes.

## Code style

- Match existing patterns in `config/`, `hooks/`, and `components/`.
- Prefer catalog entries over hard-coded animation paths.
- Avoid drive-by refactors outside the task scope.

## Assets

Do not commit copyrighted VRM/VRMA files without license documentation. See `docs/assets-and-credits.md` and `docs/animations/vrma.md`.

## Questions

Open an issue in the repository, or contact the ARPA maintainers.
