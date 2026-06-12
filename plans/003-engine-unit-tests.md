# Plan 003: Add direct unit tests for the untested engine modules

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat c34e838..HEAD -- lib/tournament/simulation.ts lib/tournament/state.ts lib/tournament/matches.ts lib/tournament/scorers.ts`
> If any in-scope source file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition. Exception: changes from plan 002
> (an added `rng` parameter) are expected — this plan depends on them.

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: LOW
- **Depends on**: plans/002-rng-seam.md
- **Category**: tests
- **Issue**: https://github.com/Davi-Gurgel/WC2026/issues/14
- **Planned at**: commit `c34e838`, 2026-06-11

## Why this matters

Four engine modules — `simulation.ts` (209 lines, the core of the product), `state.ts`, `matches.ts`, `scorers.ts` — have no dedicated test file; they are covered only incidentally by one integration test (`lib/tournament.test.ts`). Plans 004–006 change simulation and standings rules; without characterization tests pinning today's invariants, those changes can't be reviewed with confidence. This plan adds the missing test files using the RNG seam from plan 002, asserting invariants (counts, structure, purity), never exact scorelines — per the repo's documented testing convention.

## Current state

- Existing engine tests: `lib/tournament/standings.test.ts`, `lib/tournament/bracket.test.ts`, `lib/tournament/selectors.test.ts`, `lib/tournament/storage.test.ts`, `lib/tournament/storage-codec.test.ts`, plus integration `lib/tournament.test.ts`. There is **no** `simulation.test.ts`, `state.test.ts`, `matches.test.ts`, or `scorers.test.ts`.
- Test conventions (see `lib/tournament/standings.test.ts` as the exemplar): Vitest, colocated `*.test.ts`, default `node` environment, imports via `@/` alias, `describe`/`it`, builds real state through `initializeTournament(getAllTeams())`.
- After plan 002, public simulation functions accept an optional `rng` and `lib/tournament/rng.ts` exports `mulberry32(seed)`.
- Key facts the tests will pin (from reading the source at `c34e838`):
  - `lib/tournament/state.ts:26-52` — `initializeTournament` throws unless exactly 48 teams; sorts `allTeams` by group then FIFA ranking; builds 12 groups of 4 teams with 6 matches each (rounds 1–3, two matches per round; match dates 2026-06-11 +3/+6 days); sets `phase: "GROUP_STAGE"`, `currentGroupMatchDay: 1`, `active: true`.
  - `lib/tournament/matches.ts:3-38` — `buildGroupMatch` ids are `` `${groupName}-${round}-${slot}` ``, dates `YYYY-MM-DD`; `buildKnockoutMatch` ids are `` `M${matchNumber}` ``, `knockout: true`; `scoreDisplay` returns `"vs"` unplayed, `"H - A"` played, appends `(pen: hp-ap)` for penalties, `(prorr.)` for extra time; `getWinner` returns `null` for unplayed or drawn non-penalty matches; `getLoser` derives from winner.
  - `lib/tournament/scorers.ts` — `topScorersToMap` keys are `` `${playerName}|${teamName}` ``; `scorerMapToTopScorers` sorts by goals desc, then `playerName.localeCompare`.
  - `lib/tournament/simulation.ts` — group scores capped at 7 (`countGoals(chance, 7)`); knockout draws get extra time (`countGoals(chance, 2)` more events, so max 9); penalties only when still tied; `simulateMatch` fills `goalScorers` with exactly `homeScore`/`awayScore` player names per team; `simulateCurrentGroupMatchDay` is a no-op (returns the same reference) when `phase !== "GROUP_STAGE"`; after match day 3 it sets `qualified3rd` (8 teams), `r32Matches` (16), `phase: "ROUND_OF_32"`.
  - All engine functions are documented as pure: `state in → new state out`, never mutating the input.

## Commands you will need

| Purpose      | Command                                                  | Expected on success |
|--------------|----------------------------------------------------------|---------------------|
| New tests    | `pnpm exec vitest run lib/tournament/simulation.test.ts lib/tournament/state.test.ts lib/tournament/matches.test.ts lib/tournament/scorers.test.ts` | all pass |
| Full suite   | `pnpm test`                                              | all pass            |
| Typecheck    | `pnpm typecheck`                                         | exit 0              |
| Lint         | `pnpm lint`                                              | exit 0              |

## Scope

**In scope** (the only files you should create or modify):
- `lib/tournament/simulation.test.ts` (create)
- `lib/tournament/state.test.ts` (create)
- `lib/tournament/matches.test.ts` (create)
- `lib/tournament/scorers.test.ts` (create)
- `plans/README.md` (status row only)

**Out of scope** (do NOT touch):
- Any non-test source file. If a test reveals a real bug, write the test to document **current** behavior with a comment naming the plan that fixes it (004/005/006), or skip that assertion — do not fix engine code here.
- `lib/tournament/guards.ts` — already exercised by `storage-codec.test.ts`/`storage.test.ts`; dedicated tests add little.
- UI/component tests — out of scope by audit verdict.

## Git workflow

- Branch: `advisor/003-engine-unit-tests`
- One commit per test file, conventional style: `test: cover simulation invariants`, `test: cover tournament state initialization`, etc.
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: `lib/tournament/scorers.test.ts` (smallest first)

Cover: round-trip (`scorerMapToTopScorers(topScorersToMap(list))` preserves entries), sort order (goals desc, then name asc — include two scorers with equal goals), key collision safety (same player name on two different teams stays two entries).

**Verify**: `pnpm exec vitest run lib/tournament/scorers.test.ts` → all pass.

### Step 2: `lib/tournament/matches.test.ts`

Cover: `buildGroupMatch` id/date/`knockout: false`/empty `goalScorers` arrays keyed by both team names; `buildKnockoutMatch` id `M{n}`, `matchNumber`, `knockoutRound`; `scoreDisplay` for each of the four display states (unplayed → `"vs"`, normal, extra time → contains `(prorr.)`, penalties → contains `(pen: `); `getWinner`/`getLoser` for: unplayed (null), home win, away win, group draw (null), penalties decided. Build `Match` literals by spreading `buildKnockoutMatch(...)` and overriding fields — avoid `as Match` casts where possible (the existing integration test uses casts; prefer the builder).

Use two real teams: `const [teamA, teamB] = getAllTeams();`.

**Verify**: `pnpm exec vitest run lib/tournament/matches.test.ts` → all pass.

### Step 3: `lib/tournament/state.test.ts`

Cover, using `getAllTeams()`:
- throws `"Exactly 48 teams"` for 47 teams (slice) and for 49 (concat one duplicate team object).
- 12 groups lettered A–L in order; each group has 4 teams all with `team.group === letter`; 6 matches; each team appears in exactly 3 of them; rounds are `[1,1,2,2,3,3]`; per round each team appears exactly once.
- match dates: round 1 → `"2026-06-11"`, round 2 → `"2026-06-14"`, round 3 → `"2026-06-17"`.
- initial `standings` exist with 4 zeroed rows; `phase === "GROUP_STAGE"`; `currentGroupMatchDay === 1`; `active === true`; knockout arrays empty; `champion`/`runnerUp` null.
- purity: `initializeTournament` does not mutate the input array (snapshot `JSON.stringify(teams)` before/after and compare).

**Verify**: `pnpm exec vitest run lib/tournament/state.test.ts` → all pass.

### Step 4: `lib/tournament/simulation.test.ts`

Use `mulberry32` seeds for determinism. Cover:

- **Purity**: `const before = JSON.stringify(state)` → run `simulateCurrentGroupMatchDay(state, mulberry32(1))` → `JSON.stringify(state) === before`. Same check for `simulateCurrentKnockoutRound` on a post-group state.
- **No-op guards**: calling `simulateCurrentGroupMatchDay` on a `createEmptyTournamentState()` returns the same reference; calling it on a state already past day 3 returns the same reference.
- **Score bounds**: simulate full group stage with several seeds (e.g. 1, 2, 3); every played group match has `0 <= score <= 7`; knockout matches `<= 9` (7 regular + 2 extra-time events).
- **Goal scorer integrity**: for every played match, `goalScorers[homeTeam.name].length === homeScore` and same for away; every scorer name belongs to that team's roster.
- **Knockout decisiveness**: simulate to `FINISHED` with a fixed seed; every knockout match has a non-null `getWinner`; `wentToPenalties` implies `wentToExtraTime`; `homePenalties !== awayPenalties` whenever `wentToPenalties`.
- **Penalty branch coverage** via the seam: with a scripted rng (an array-backed `Rng` you write inline: `const scripted = (values: number[]): Rng => { let i = 0; return () => values[i++] ?? 0.99; }`), drive `simulatePenalties` into (a) a 5-kick decision, (b) sudden death, and (c) the 20-round deadlock branch — assert it currently returns a home win (`home === away + 1`). Mark (c) with a comment: `// Deadlock fallback currently always favors home — changed by plan 004.`
- **Top scorer accumulation across phases**: after simulating to `FINISHED`, `state.topScorers.reduce((s, x) => s + x.goals, 0)` equals total goals across all played matches (group + knockout, counting regulation+ET goals only — penalties shoot-out goals are not in `homeScore`).

**Verify**: `pnpm exec vitest run lib/tournament/simulation.test.ts` → all pass.

### Step 5: Full gate

**Verify**: `pnpm lint && pnpm typecheck && pnpm test` → exit 0.

## Test plan

This plan *is* the test plan; structural exemplar is `lib/tournament/standings.test.ts`. Expected new test counts: scorers ≥3, matches ≥8, state ≥6, simulation ≥8. Assert invariants, never exact scorelines (repo convention from AGENTS.md) — seeds make runs reproducible but scoreline values are still implementation-defined and must not be pinned.

## Done criteria

Machine-checkable. ALL must hold:

- [ ] The four new test files exist and `pnpm test` exits 0
- [ ] `pnpm typecheck` and `pnpm lint` exit 0
- [ ] `grep -l "mulberry32" lib/tournament/simulation.test.ts` → matches (seam is actually used)
- [ ] No engine source file modified (`git status` shows only new test files + plans/README.md)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- Plan 002 has not landed (no `lib/tournament/rng.ts`) — this plan depends on it.
- A purity test fails — that means an engine function mutates its input, which is a real bug worth its own report, not a silent test adjustment.
- The deadlock test (Step 4c) finds behavior other than "home wins" — plan 004 may have landed first; adjust that one assertion to the new behavior and note it in your report.
- Any invariant test fails for multiple seeds — likely a real engine bug; report with the failing seed rather than loosening the assertion.

## Maintenance notes

- These are characterization tests: when plans 004/005/006 intentionally change rules, the executor of those plans must update the specific pinned assertion (each is marked with a comment naming the plan).
- Reviewers: check that no test asserts an exact simulated scoreline — those rot.
- Deferred: `guards.ts` dedicated tests (covered transitively), UI tests (audit verdict: not worth it at this size).
