# Plan 001: Add a GitHub Actions CI pipeline that enforces the release gate

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat c34e838..HEAD -- .github package.json .node-version pnpm-workspace.yaml`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: dx
- **Issue**: https://github.com/Davi-Gurgel/WC2026/issues/15
- **Planned at**: commit `c34e838`, 2026-06-11

## Why this matters

The repo's release gate (`pnpm lint && pnpm typecheck && pnpm test && pnpm build`) is documented in README.md ("Checklist de release") but runs only when a human remembers to run it. There is no `.github/` directory and no CI config of any kind, so nothing protects `main` from a commit that breaks the build or the tests. A single workflow file closes that gap and gives every other plan in `plans/` an automated safety net.

## Current state

- No `.github/` directory exists at the repo root (verified at commit `c34e838`).
- `package.json` scripts (the exact gate commands):

```json
"scripts": {
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "eslint .",
  "typecheck": "tsc --noEmit",
  "test": "vitest run"
}
```

- `package.json` pins the package manager: `"packageManager": "pnpm@11.5.1+sha512..."` — `pnpm/action-setup@v4` reads this field automatically, so do **not** hardcode a pnpm version in the workflow.
- `.node-version` contains exactly `24.15.0`, and `.npmrc` sets `engine-strict=true` (`package.json#engines` requires `node >=24.15.0`). The workflow must use the version from `.node-version`.
- `pnpm-workspace.yaml` allowlists build scripts for `sharp` and `unrs-resolver` (pnpm `strictDepBuilds`); `pnpm install --frozen-lockfile` in CI needs no extra flags for this.

## Commands you will need

| Purpose   | Command                  | Expected on success |
|-----------|--------------------------|---------------------|
| Install   | `pnpm install`           | exit 0              |
| Lint      | `pnpm lint`              | exit 0              |
| Typecheck | `pnpm typecheck`         | exit 0, no errors   |
| Tests     | `pnpm test`              | all pass            |
| Build     | `pnpm build`             | exit 0              |

## Scope

**In scope** (the only files you should create or modify):
- `.github/workflows/ci.yml` (create)
- `plans/README.md` (status row only)

**Out of scope** (do NOT touch):
- `package.json` — the scripts are correct as-is; do not add new ones.
- Any deploy/release automation — this plan is verification only.
- Branch-protection settings — those are configured in the GitHub UI by the maintainer, not in this repo.

## Git workflow

- Branch: `advisor/001-ci-pipeline`
- Single commit, conventional style (matches repo history, e.g. `chore: migrate from npm to pnpm`): `chore: add CI workflow running the release gate`
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Create the workflow file

Create `.github/workflows/ci.yml` with exactly this content:

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:

permissions:
  contents: read

jobs:
  verify:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version-file: .node-version
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm lint
      - run: pnpm typecheck
      - run: pnpm test
      - run: pnpm build
```

Notes on why this shape: `pnpm/action-setup@v4` with no `version` input reads `packageManager` from `package.json` (keeping one source of truth); `node-version-file: .node-version` keeps Node pinned to the repo's declared version; `cache: pnpm` caches the pnpm store between runs.

**Verify**: `cat .github/workflows/ci.yml` → matches the content above. If `actionlint` is installed (`command -v actionlint`), run `actionlint .github/workflows/ci.yml` → no errors; if it is not installed, skip this check (do not install anything).

### Step 2: Prove the gate passes locally

Run the same commands the workflow runs, in order.

**Verify**: `pnpm lint && pnpm typecheck && pnpm test && pnpm build` → exit 0. (This confirms the workflow won't be born red.)

## Test plan

No new unit tests — the deliverable is the workflow itself. The local run in Step 2 is the executable verification. After the branch is pushed by the operator, the Actions tab should show the `CI / verify` job green; that final confirmation belongs to the operator, not this plan.

## Done criteria

Machine-checkable. ALL must hold:

- [ ] `.github/workflows/ci.yml` exists with the four gate commands in order (lint, typecheck, test, build)
- [ ] `pnpm lint && pnpm typecheck && pnpm test && pnpm build` exits 0 locally
- [ ] `git status` shows no modified files outside the in-scope list
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- A `.github/workflows/` directory already exists (someone added CI since this plan was written).
- Any of the four gate commands fails locally at the planned-at commit's descendant — the failure is a pre-existing break, not something this plan should fix.
- `pnpm install --frozen-lockfile` fails because the lockfile is out of sync — report it; do not regenerate the lockfile.

## Maintenance notes

- If a deploy step is added later, keep it in a separate workflow/job so the verification gate stays fast and read-only (`permissions: contents: read`).
- Plans 002–007 assume this CI exists; once it's green, the maintainer should consider requiring the `verify` check on `main` via branch protection.
- `pnpm test` includes jsdom component tests; if the suite ever grows slow, split `test` into a separate job before reaching for caching tricks.
