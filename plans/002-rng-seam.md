# Plan 002: Thread an injectable RNG through the simulation engine

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat c34e838..HEAD -- lib/tournament/simulation.ts lib/tournament.ts lib/tournament.test.ts`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: tests
- **Issue**: https://github.com/Davi-Gurgel/WC2026/issues/12
- **Planned at**: commit `c34e838`, 2026-06-11

## Why this matters

Every random decision in the engine calls `Math.random()` directly (7 call sites in `lib/tournament/simulation.ts`), so the rare branches — extra time, penalty shootouts, sudden-death deadlock — cannot be exercised deterministically. The one existing test that needs determinism resorts to `vi.spyOn(Math, "random")`, a global mock that can leak across tests. Adding an optional `rng` parameter (defaulting to `Math.random`) makes every branch unit-testable, unblocks plans 003–006, and is the same plumbing a future seeded/replayable mode (plan 008) needs. Runtime behavior is unchanged: no caller passes the new parameter yet.

## Current state

- `lib/tournament/simulation.ts` — the only file with randomness. `Math.random()` appears at lines 101, 102, 107, 108 (`simulatePenalties`), 168 (`countGoals`), 174 (`randomLuck`), 192 (`selectScorer`), 202–203 (`selectPlayerWeightedByStrength`).
- Public exports of `simulation.ts`: `simulateCurrentGroupMatchDay(state)`, `simulateAllGroupMatchDays(state)`, `simulateCurrentKnockoutRound(state)`, `simulatePenalties()`. Private helpers: `simulateRound`, `simulateMatch`, `countGoals`, `randomLuck`, `assignGoalScorers`, `selectScorer`, `selectPlayerWeightedByStrength`.
- `lib/tournament.ts` is a barrel; app code imports from `@/lib/tournament`:

```ts
// lib/tournament.ts (entire file)
export * from "@/lib/tournament/bracket";
export * from "@/lib/tournament/constants";
export * from "@/lib/tournament/matches";
export * from "@/lib/tournament/scorers";
export * from "@/lib/tournament/selectors";
export * from "@/lib/tournament/simulation";
export * from "@/lib/tournament/standings";
export * from "@/lib/tournament/state";
```

- Representative current code (`lib/tournament/simulation.ts:96-117`):

```ts
export function simulatePenalties(): [number, number] {
  const conversionRate = 0.7;
  let home = 0;
  let away = 0;
  for (let index = 0; index < 5; index += 1) {
    if (Math.random() < conversionRate) home += 1;
    if (Math.random() < conversionRate) away += 1;
  }

  let suddenDeath = 0;
  while (home === away && suddenDeath < 20) {
    const homeScores = Math.random() < conversionRate;
    const awayScores = Math.random() < conversionRate;
    if (homeScores && !awayScores) home += 1;
    if (!homeScores && awayScores) away += 1;
    suddenDeath += 1;
  }
  if (home === away) {
    home += 1;
  }
  return [home, away];
}
```

- The fragile global-mock pattern this plan replaces lives in `lib/tournament.test.ts:103-117` (`vi.spyOn(Math, "random").mockReturnValue(0.01)` inside `it("adds top scorer goals when matches are simulated")`).
- Repo conventions: TypeScript strict, named exports, pure engine functions (`state in → new state out`), path alias `@/*`. Engine functions never touch React.

## Commands you will need

| Purpose   | Command                                        | Expected on success |
|-----------|------------------------------------------------|---------------------|
| Typecheck | `pnpm typecheck`                               | exit 0              |
| All tests | `pnpm test`                                    | all pass            |
| One file  | `pnpm exec vitest run lib/tournament.test.ts`  | all pass            |
| Lint      | `pnpm lint`                                    | exit 0              |

## Scope

**In scope** (the only files you should modify):
- `lib/tournament/rng.ts` (create)
- `lib/tournament/simulation.ts`
- `lib/tournament.ts` (add one barrel export line)
- `lib/tournament.test.ts` (replace the global `Math.random` mock)
- `plans/README.md` (status row only)

**Out of scope** (do NOT touch, even though they look related):
- `components/TournamentProvider.tsx` — callers keep using the default RNG; no UI change.
- `lib/tournament/standings.ts`, `bracket.ts`, `matches.ts`, `state.ts` — no randomness there.
- The penalty deadlock branch's *behavior* (`home += 1`) — that fix is plan 004; here you only thread the parameter through unchanged logic.

## Git workflow

- Branch: `advisor/002-rng-seam`
- Commits, conventional style: `refactor: thread injectable rng through simulation` then `test: replace global Math.random mock with seeded rng`
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Create `lib/tournament/rng.ts`

```ts
export type Rng = () => number;

/** Deterministic PRNG (mulberry32). Returns floats in [0, 1) like Math.random. */
export function mulberry32(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a += 0x6d2b79f5;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
```

No new dependency — this is ~10 lines and the repo's pnpm config blocks unvetted postinstall scripts anyway.

**Verify**: `pnpm typecheck` → exit 0.

### Step 2: Thread `rng` through `simulation.ts`

Import the type: `import type { Rng } from "@/lib/tournament/rng";`

Add an optional trailing parameter `rng: Rng = Math.random` to the three public functions, and a required trailing `rng: Rng` to the private helpers (the public layer supplies the default once, so helpers don't each re-default):

- `simulateCurrentGroupMatchDay(state: TournamentState, rng: Rng = Math.random)` — pass `rng` to `simulateMatch(match, scorerMap, false, rng)`.
- `simulateAllGroupMatchDays(state: TournamentState, rng: Rng = Math.random)` — pass `rng` to each `simulateCurrentGroupMatchDay(next, rng)`.
- `simulateCurrentKnockoutRound(state: TournamentState, rng: Rng = Math.random)` — pass `rng` to every `simulateRound(..., rng)` and `simulateMatch(..., true, rng)` call.
- `simulatePenalties(rng: Rng = Math.random)` — replace its four `Math.random()` calls with `rng()`. (Keep it defaulted: it's exported and called from tests.)
- `simulateRound(matches, scorerMap, rng)`, `simulateMatch(match, scorerMap, knockout, rng)`, `countGoals(chance, events, rng)`, `randomLuck(rng)`, `assignGoalScorers(team, goals, scorerMap, rng)`, `selectScorer(team, rng)`, `selectPlayerWeightedByStrength(players, rng)` — replace every `Math.random()` with `rng()` and forward the parameter down the call chain. `simulateMatch` forwards to `simulatePenalties(rng)`.

After this step, `grep -n "Math.random" lib/tournament/simulation.ts` must match **only** the default-parameter positions (`= Math.random`), never a call `Math.random()`.

**Verify**: `grep -cn "Math.random()" lib/tournament/simulation.ts` → `0`; `pnpm typecheck` → exit 0; `pnpm test` → all pass (behavior with the default is identical).

### Step 3: Export from the barrel

In `lib/tournament.ts`, add (alphabetical position, after the `matches` line):

```ts
export * from "@/lib/tournament/rng";
```

**Verify**: `pnpm typecheck` → exit 0.

### Step 4: Replace the global mock in `lib/tournament.test.ts`

In the test `"adds top scorer goals when matches are simulated"` (currently lines 103-117), delete `vi.spyOn(Math, "random").mockReturnValue(0.01)`, the `try/finally`, and `vi.restoreAllMocks()`. Instead:

```ts
import { mulberry32 } from "@/lib/tournament/rng";
// ...
const state = simulateCurrentGroupMatchDay(initializeTournament(getAllTeams()), mulberry32(42));
```

The invariant assertions (total scorer goals === total match goals) stay unchanged; with `mulberry32(42)` goals are guaranteed to exist across a full match day, but keep the `toBeGreaterThan(0)` assertion — if it fails with seed 42, try seed 1 and report if no small seed produces goals (it will; expected goals per match day ≈ 60+). Remove the now-unused `vi` import if nothing else uses it.

**Verify**: `pnpm exec vitest run lib/tournament.test.ts` → all pass. `grep -n "spyOn(Math" lib/tournament.test.ts` → no matches.

## Test plan

- This plan converts one existing test (Step 4) and adds one new test in `lib/tournament.test.ts`:
  - `"same seed produces identical simulations"`: run `simulateAllGroupMatchDays(initializeTournament(getAllTeams()), mulberry32(7))` twice and `expect(JSON.stringify(a.groups)).toBe(JSON.stringify(b.groups))`. This pins the seam's whole point — determinism under a fixed seed.
- Model structure after the existing `describe("tournament rules")` block in `lib/tournament.test.ts`.
- Verification: `pnpm test` → all pass, including the new determinism test.

## Done criteria

Machine-checkable. ALL must hold:

- [ ] `pnpm typecheck` exits 0
- [ ] `pnpm lint` exits 0
- [ ] `pnpm test` exits 0, including the new `"same seed produces identical simulations"` test
- [ ] `grep -c "Math.random()" lib/tournament/simulation.ts` → 0 (only `= Math.random` defaults remain)
- [ ] `grep -rn "spyOn(Math" lib components` → no matches
- [ ] No files outside the in-scope list are modified (`git status`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- `simulation.ts` no longer matches the excerpt above (drifted since `c34e838`).
- You find `Math.random` usage in engine files other than `simulation.ts` — the audit found none; if one appears, scope changed.
- Adding the parameter forces a change to any file in `components/` or `app/` — it must not; optional trailing parameters are backward compatible. If the compiler says otherwise, report.

## Maintenance notes

- All future randomness in the engine must accept and forward `Rng` instead of calling `Math.random()` directly — reviewers should reject new bare `Math.random()` calls in `lib/tournament/`.
- Plans 003 (engine unit tests), 004 (penalty fix), 005/006 (rule fixes) and 008 (seeded-mode spike) all build on this seam.
- `mulberry32` is for tests and replay only; do not let UI code construct seeds implicitly.
