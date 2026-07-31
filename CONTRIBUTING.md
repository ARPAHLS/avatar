# Contributing

Thanks for helping shape VOX Avatar. This repository is in private preview; these guidelines apply as we move toward a public release.

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

Do not commit copyrighted VRM/VRMA files without license documentation. See `docs/animations/vrma.md`.

## Questions

Open an issue in the repository once GitHub access is enabled, or contact the ARPA maintainers internally.
