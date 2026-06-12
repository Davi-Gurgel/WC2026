# Plan 004: Make the penalty-shootout deadlock fallback fair

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat c34e838..HEAD -- lib/tournament/simulation.ts lib/tournament/simulation.test.ts lib/tournament.test.ts`
> Plans 002/003 are expected to have touched these files (rng parameter, new
> tests). Beyond that, if `simulatePenalties` no longer matches the excerpt
> below, treat it as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: S
- **Risk**: LOW
- **Depends on**: plans/002-rng-seam.md (plans/003 recommended first — it pins the current behavior)
- **Category**: bug
- **Issue**: https://github.com/Davi-Gurgel/WC2026/issues/13
- **Planned at**: commit `c34e838`, 2026-06-11

## Why this matters

When a penalty shootout is still tied after 5 kicks plus 20 sudden-death rounds (~0.002% of shootouts), the engine unconditionally awards the win to the home team: `if (home === away) { home += 1; }`. That is a silent home-side bias in a simulator whose whole job is fair randomness. The fix is a coin flip from the injected RNG — two lines, fully testable through the seam from plan 002.

## Current state

- `lib/tournament/simulation.ts:96-117` at `c34e838` (after plan 002, the function signature is `simulatePenalties(rng: Rng = Math.random)` and internal calls use `rng()`):

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
    home += 1;        // ← the bug: deterministic home win on deadlock
  }
  return [home, away];
}
```

- Callers rely on the invariant that the returned tuple is never tied (`getWinner` in `lib/tournament/matches.ts:28` picks home iff `homePenalties > awayPenalties`). The fix must preserve "never tied".
- If plan 003 landed, `lib/tournament/simulation.test.ts` contains a deadlock test marked with `// Deadlock fallback currently always favors home — changed by plan 004.` — you will update it.
- Existing invariant test: `lib/tournament.test.ts` has `"penalties never finish tied"` (100 iterations). Keep it passing.

## Commands you will need

| Purpose    | Command                                                   | Expected on success |
|------------|-----------------------------------------------------------|---------------------|
| Unit tests | `pnpm exec vitest run lib/tournament/simulation.test.ts`  | all pass            |
| Full suite | `pnpm test`                                               | all pass            |
| Typecheck  | `pnpm typecheck`                                          | exit 0              |
| Lint       | `pnpm lint`                                               | exit 0              |

## Scope

**In scope** (the only files you should modify):
- `lib/tournament/simulation.ts` (the deadlock branch only)
- `lib/tournament/simulation.test.ts` (update the pinned deadlock test; add the fairness test)
- `plans/README.md` (status row only)

**Out of scope** (do NOT touch):
- The 5-kick and sudden-death logic — correct as-is; this plan changes only the post-loop fallback.
- `lib/tournament/matches.ts` (`getWinner`) — unchanged; the no-tie invariant is preserved.
- Implementing real ABAB kick alternation or unlimited sudden death — over-engineering for an unreachable-in-practice branch; the bounded loop also guards against non-terminating loops under scripted test RNGs.

## Git workflow

- Branch: `advisor/004-penalty-deadlock-fairness`
- One commit, conventional style: `fix: decide penalty deadlocks with a coin flip`
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Replace the fallback

In `lib/tournament/simulation.ts`, change:

```ts
  if (home === away) {
    home += 1;
  }
```

to:

```ts
  if (home === away) {
    if (rng() < 0.5) home += 1;
    else away += 1;
  }
```

(`rng` is the parameter introduced by plan 002.)

**Verify**: `pnpm typecheck` → exit 0.

### Step 2: Update and add tests

In `lib/tournament/simulation.test.ts`:

1. Update the pinned deadlock test from plan 003: with a scripted RNG that forces 5 tied kicks + 20 tied sudden-death rounds and then returns a value `< 0.5`, expect home to win by exactly 1; with a final value `>= 0.5`, expect away to win by exactly 1. (Scripted RNG: every paired draw returning equal outcomes — e.g. values that are both `< 0.7` — keeps the score tied; count the calls: 10 for kicks, 40 for sudden death, then 1 for the coin flip.)
2. Keep/confirm the no-tie invariant: 200 runs of `simulatePenalties(mulberry32(seed))` across seeds never return a tie.

**Verify**: `pnpm exec vitest run lib/tournament/simulation.test.ts` → all pass.

### Step 3: Full gate

**Verify**: `pnpm lint && pnpm typecheck && pnpm test` → exit 0.

## Test plan

Covered in Step 2; structural exemplar is the existing `simulatePenalties` tests in `lib/tournament/simulation.test.ts` (plan 003) or, if 003 hasn't landed, `lib/tournament.test.ts`'s `"penalties never finish tied"`. New/updated cases: deadlock→home (flip < 0.5), deadlock→away (flip ≥ 0.5), no-tie invariant.

## Done criteria

Machine-checkable. ALL must hold:

- [ ] `grep -n "home += 1;" lib/tournament/simulation.ts` shows the unconditional deadlock increment is gone (the only `home += 1` sites are inside the kick/sudden-death/coin-flip conditionals)
- [ ] `pnpm test` exits 0, including a test where the deadlock coin flip awards **away**
- [ ] `pnpm typecheck` and `pnpm lint` exit 0
- [ ] No files outside the in-scope list are modified (`git status`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- Plan 002 has not landed (`simulatePenalties` has no `rng` parameter) — implement 002 first or report.
- The function body no longer matches the excerpt (someone already fixed or restructured it).
- Any test outside `simulation.test.ts` starts failing — the change must be invisible to everything but the deadlock branch.

## Maintenance notes

- The deadlock branch is now random; any future "replay" feature (plan 008) automatically reproduces it because it draws from the same seeded RNG stream.
- Reviewers: confirm the scripted-RNG test really reaches the fallback (41st call) rather than exiting sudden death early.
