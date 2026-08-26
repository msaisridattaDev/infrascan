# Contributing

InfraScan uses trunk-based development: short-lived feature branches merged into `main` via PR. No gitflow, no long-lived staging branch — `main` is always deployable, and Vercel/Render auto-deploy on every merge.

## Branch naming

`<type>/<short-description>`, e.g. `feat/observation-ingest`, `fix/dedupe-race`, `chore/update-deps`.

## Commit convention

Conventional commits:

- `feat:` — new functionality
- `fix:` — bug fix
- `chore:` — tooling, deps, non-functional housekeeping
- `docs:` — documentation only
- `test:` — adding or fixing tests

## Workflow

1. Branch off `main`
2. Commit with conventional messages
3. Open a PR against `main` (template auto-fills)
4. `main` is protected — merging requires an open PR (and, once Phase 13 lands, a passing CI check)
5. Merge → Vercel/Render auto-deploy
