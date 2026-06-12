# Plan 009: Spike — export, import, and share tournament states

> **Executor instructions**: This is a **design spike with one small hardening
> deliverable**. The design document is the main output; the only production
> code change allowed is the storage-guard hardening in Step 1 (it is a
> prerequisite for any import feature and is independently valuable). Honor
> STOP conditions; update the status row in `plans/README.md` when done.
>
> **Drift check (run first)**: `git diff --stat c34e838..HEAD -- lib/tournament/storage-guards.ts lib/tournament/storage-codec.ts lib/tournament/storage.ts lib/teams.ts`
> If the guard/codec excerpts below no longer match the live code, treat it as
> a STOP condition.

## Status

- **Priority**: P3
- **Effort**: M (S for the hardening + half a day of design)
- **Risk**: LOW
- **Depends on**: none (pairs well with plans/008-spike-seeded-mode.md — read its output if it exists)
- **Category**: direction
- **Issue**: https://github.com/Davi-Gurgel/WC2026/issues/18
- **Planned at**: commit `c34e838`, 2026-06-11

## Why this matters

A simulated tournament lives in one browser's `localStorage` and dies with it. The compact storage codec already does the hard part of sharing — it strips full `Team` objects to country codes, producing a small JSON payload — but there is no way to export it, load it on another device, or share a result. Import also raises the bar on input validation: today the guards accept any string as a country code and rely on a codec `throw` for unknown codes. That's fine for self-written `localStorage`, but an import feature makes payloads adversarial-by-default, so the guards should validate codes properly first.

## Current state

- `lib/tournament/storage-codec.ts:6-29` — `toStoredTournamentState(state)` produces `{ version: 3, state: CompactTournamentState }`; `expandCompactTournamentState(compact, teams)` (lines 31-68) re-expands, throwing `` `Missing team for country code ${code}` `` on unknown codes (line 35).
- `lib/tournament/storage-guards.ts:41-65` — `isCompactMatch` checks `isString(value.h) && isString(value.a)` (any string passes); same for `championCode`, `runnerUpCode`, `qualified3rdCodes` (lines 31-33).
- `lib/tournament/storage.ts:8-27` — `loadStoredTournamentState(storage)`: JSON.parse → guard → dynamic-import `getAllTeams()` → expand. Failures before expand remove the key and return null; expand-failures propagate (caught by the provider, which removes the key — `components/TournamentProvider.tsx:36-44`).
- `lib/teams.ts` — `getAllTeams()` returns the deep-frozen 48-team dataset; team codes are unique (Zod-enforced).
- Tests exist: `lib/tournament/storage.test.ts`, `lib/tournament/storage-codec.test.ts` — use them as exemplars.
- `STORAGE_KEY = "wc26-tournament-state-v1"`, `STORAGE_VERSION = 3` (`lib/tournament/storage-schema.ts:3-4`).

## Commands you will need

| Purpose    | Command                                                                  | Expected on success |
|------------|--------------------------------------------------------------------------|---------------------|
| Storage tests | `pnpm exec vitest run lib/tournament/storage.test.ts lib/tournament/storage-codec.test.ts` | all pass |
| Full suite | `pnpm test`                                                              | all pass            |
| Typecheck  | `pnpm typecheck`                                                         | exit 0              |
| Lint       | `pnpm lint`                                                              | exit 0              |

## Scope

**In scope**:
- `lib/tournament/storage-guards.ts` (hardening only)
- `lib/tournament/storage.ts` (pass the valid-code set to the guard, if that's the design you choose in Step 1)
- `lib/tournament/storage.test.ts` and/or `lib/tournament/storage-codec.test.ts` (tests for the hardening)
- `plans/spikes/export-share.md` (create — the design deliverable)
- `plans/README.md` (status row only)

**Out of scope** (do NOT touch):
- Any UI (export buttons, file pickers, share links) — the design doc specifies them; a follow-up plan builds them.
- `STORAGE_VERSION`, the compact schema shape, `expandCompactTournamentState`.
- URL/routing changes.

## Steps

### Step 1: Harden country-code validation (small, real change)

Make the guard layer validate country codes against the known team set instead of accepting any string. Recommended design (adjust if the code argues otherwise, and say why in the commit):

- Change `isStoredTournamentState(value)` to `isStoredTournamentState(value, validCodes: ReadonlySet<string>)` (uppercase codes), threading the set down to `isCompactMatch` (`h`, `a`) and the `championCode`/`runnerUpCode`/`qualified3rdCodes` checks. Comparison: `validCodes.has(code.toUpperCase())` — the codec already uppercases on lookup (`storage-codec.ts:32-34`).
- In `loadStoredTournamentState`, move the `getAllTeams()` dynamic import **before** the guard call and build the set: `new Set(teams.map((t) => t.countryCode.toUpperCase()))`. On guard failure the key is removed and `null` returned — same as today, but now unknown codes are a clean rejection instead of a thrown-and-caught error.

Add tests (exemplar: existing cases in `lib/tournament/storage.test.ts`): a payload that is structurally valid but has `h: "XXX"` → `loadStoredTournamentState` returns `null` and removes the key; a round-trip of a real simulated state still loads.

**Verify**: `pnpm exec vitest run lib/tournament/storage.test.ts lib/tournament/storage-codec.test.ts` → all pass including new tests; `pnpm typecheck && pnpm lint` → exit 0.

### Step 2: Measure payload sizes

In a scratch script or test, simulate a full tournament, run `JSON.stringify(toStoredTournamentState(state))`, and record: raw bytes, and base64 length (for URL-fragment feasibility; URLs are practically capped ~2k–8k chars). Record numbers for an empty, mid-group, and finished tournament in the design doc.

**Verify**: numbers recorded in `plans/spikes/export-share.md`.

### Step 3: Write the design doc

`plans/spikes/export-share.md` must answer, with a recommendation each:

1. **Transport**: file download/upload (`Blob` + `<input type="file">`) vs URL fragment (`#state=<base64>`) vs both — decide using Step 2 sizes (if a finished tournament exceeds ~2KB base64, recommend file-first, seed-link later via plan 008's seed design).
2. **API surface**: e.g. `exportTournament(state): string` and `importTournament(json: string, teams: Team[]): TournamentState | null` in a new `lib/tournament/transfer.ts`, reusing `toStoredTournamentState`/guards/`expandCompactTournamentState` — no new serialization format.
3. **Validation stance**: imports go through the *same* guard path as `localStorage` (now hardened by Step 1); invalid imports show a pt-BR error message (UI copy is Portuguese — repo convention), never a crash.
4. **Versioning**: imports with a different `version` are rejected with a clear message (repo convention: discard, don't migrate) — state the user impact and the alternative considered.
5. **Provider integration**: new `loadTournament(state: TournamentState)` action on `TournamentProvider` vs routing through `localStorage` + reload — recommend one.
6. **Follow-up build plan outline**: ordered steps + test list, sized S/M/L; note interaction with plan 008 (a seed is the cheaper share format when both exist).

**Verify**: the doc exists and answers all six numbered questions with recommendations.

## Done criteria

- [ ] Guards reject unknown country codes: a structurally-valid payload with code `"XXX"` makes `loadStoredTournamentState` return `null` (test exists and passes)
- [ ] `pnpm lint && pnpm typecheck && pnpm test` exit 0
- [ ] `plans/spikes/export-share.md` exists with payload-size data and all 6 answers
- [ ] No files outside the in-scope list are modified (`git status`)
- [ ] `plans/README.md` status row updated

## STOP conditions

- The guard/codec/storage excerpts don't match the live code (drifted).
- Threading `validCodes` through the guards forces a change to `storage-codec.ts` or the schema types — that suggests a different design is needed; report instead of expanding scope.
- Existing storage tests break in ways unrelated to the new validation — report.

## Maintenance notes

- After Step 1, the guard layer is the single validation authority for *any* future untrusted payload (import, URL, sync) — keep new entry points behind `isStoredTournamentState`.
- The hardening slightly changes failure UX for corrupted `localStorage`: clean discard instead of console error + discard. Reviewers should confirm `TournamentProvider`'s catch path still covers codec throws (it does at `c34e838`; the throw path remains as a second line of defense).
