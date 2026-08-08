# Maintainer release checklist

One-page sanity list before tagging and publishing a GitHub Release. **Docs only** — not automation. For day-to-day contributor ripples, see [Contributing](../../CONTRIBUTING.md).

Typical flow (recent releases): bump + docs on `main` → build installer locally → create the GitHub Release by hand and attach `AVATAR-Setup-*.exe`.

---

## 1. Version bump (grep the old version)

Search the repo for the previous version string (e.g. `0.5.0` / `v0.5.0`) and update every **current** download / badge / template pointer. Leave historical changelog sections and old `docs/releases/v*.md` alone.

| Surface | Paths |
| :--- | :--- |
| App version | `avatar/package.json`, `avatar/package-lock.json` (root package version only) |
| Citation | `CITATION.cff` — `version`, `date-released`, `repository-artifact` |
| README | Version badge, Download / installer links, feature table download row |
| Docs | `docs/getting-started/installation.md`, `first-session.md`, `using-the-app.md`, `voice/audio-sources.md`, `development/project-layout.md`, `docs/README.md` releases line |
| Contributing | End-user installer link near the top of `CONTRIBUTING.md` |
| Issue templates | `.github/ISSUE_TEMPLATE/bug.yml`, `installer.yml` (add new version at the **top** of version dropdowns; keep a few prior releases) |

Confirm `npm run dist:win` / electron-builder will name the artifact `AVATAR-Setup-<version>.exe` from `package.json` `version` + `artifactName`.

---

## 2. Changelog and release docs

- [ ] Fold `[Unreleased]` into `## [X.Y.Z] — YYYY-MM-DD` (`Added` / `Changed` / `Fixed` / `Removed`). Prefer short *why* bullets with issue/PR numbers (`(#23, #45)`). Do **not** put `Closes` / `Fixes` in changelog text.
- [ ] Leave a fresh empty `## [Unreleased]` section at the top.
- [ ] Add `docs/releases/vX.Y.Z.md` (same shape as the previous release page: download link, highlights, requirements, docs links, unsigned note).
- [ ] Add a row at the top of [Releases index](../releases/README.md).
- [ ] Update [Roadmap](roadmap.md): move shipped items under a `vX.Y.Z — Shipped` section when they belong to this release.

---

## 3. Quality gates

From `avatar/`:

```bash
npm run lint
npm test
npm run build
```

Same sequence as CI ([Project layout → Continuous integration](project-layout.md#continuous-integration)). Fix failures before tagging.

Optional smoke: `npm run desktop` or `npm run dev:desktop` on the release candidate.

---

## 4. Windows installer

- [ ] Build on Windows: `cd avatar && npm run dist:win`.
- [ ] Prefer an output path **without spaces** if 7-Zip / electron-builder fails under a path like `Avatar Test` (e.g. override `directories.output` to something like `D:/ARPA/avatar-desktop-setup`, then copy the `.exe` into gitignored `desktop-setup/` at the repo root).
- [ ] Confirm artifact name: `AVATAR-Setup-X.Y.Z.exe`.
- [ ] Do **not** commit the `.exe` or `desktop-setup/` (gitignored).
- [ ] Remember: production builds omit `environments/custom/` trial media (see [Environments](../environments.md)); installer users use Settings → Directories.

Signing: the installer is currently **unsigned**. Note SmartScreen (“More info” → Run anyway) in the GitHub Release body and in `docs/releases/vX.Y.Z.md`. Code signing is still a roadmap item.

---

## 5. Credits and citation

- [ ] If bundled VRM / VRMA / env media changed: update [Assets & credits](../assets-and-credits.md).
- [ ] If authors or preferred citation changed: update `CITATION.cff` (already version-bumped in §1).
- [ ] Zenodo concept DOI badge on the README stays unless the DOI itself changes.

---

## 6. GitHub Release

- [ ] Push the version-bump commit to `ARPAHLS/avatar` `main` (or merge the release PR).
- [ ] Create a Release / tag `vX.Y.Z` on that commit.
- [ ] **Title:** short product line (e.g. `AVATAR v0.6.0 — …`).
- [ ] **Body:** highlights + download link; mention contributors with `@username` (not markdown links) so avatars show; use `start lang` / `end lang` instead of fenced code blocks if pasting through an assistant that nests markdown.
- [ ] Attach `AVATAR-Setup-X.Y.Z.exe`.
- [ ] After publish, spot-check README / install doc links resolve to the new asset.

---

## Quick grep hints

```bash
# From repo root — expect only historical hits after a clean bump
rg -n "0\\.5\\.0|v0\\.5\\.0|AVATAR-Setup-0\\.5\\.0" --glob '!CHANGELOG.md' --glob '!docs/releases/v0.5.0.md'
```

Replace `0.5.0` with the version you are leaving. Review leftovers in `CHANGELOG.md` / old release pages by eye; those should stay.

---

## Related

- [Releases](../releases/README.md) · [Changelog](../../CHANGELOG.md) · [Installation](../getting-started/installation.md)
- [Contributing](../../CONTRIBUTING.md) · [CITATION.cff](../../CITATION.cff)
- [Roadmap](roadmap.md) (code-signed installer still open)
