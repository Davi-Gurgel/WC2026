# Plan 006: Prevent same-group rematches in the Round of 32

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat c34e838..HEAD -- lib/tournament/bracket.ts lib/tournament/bracket.test.ts lib/tournament/standings.ts`
> If `generateR32Bracket` no longer matches the excerpt below, treat it as a
> STOP condition. (Plan 005 touching `standings.ts` is expected and fine.)

## Status

- **Priority**: P2
- **Effort**: M
- **Risk**: MED (changes which opponent a third-place team draws; mitigated by an invariant test over many seeded simulations)
- **Depends on**: plans/002-rng-seam.md and plans/003-engine-unit-tests.md (the invariant test uses seeded simulation)
- **Category**: bug
- **Issue**: https://github.com/Davi-Gurgel/WC2026/issues/20
- **Planned at**: commit `c34e838`, 2026-06-11

## Why this matters

The Round-of-32 bracket fills its eight "group winner vs third-place" slots positionally: slot *i* gets `qualified3rd[i]`, the *i*-th best third overall. Nothing prevents `qualified3rd[0]` from being group E's third — in which case match 74 is **winner E vs third E**, a rematch of a group-stage game. FIFA's 2026 regulations explicitly allocate thirds so a team never meets its own group winner in the Round of 32. The fix is a small assignment function that keeps rank order as closely as possible while forbidding same-group pairings.

## Current state

- `lib/tournament/bracket.ts:4-43` — `generateR32Bracket(groups, qualified3rd)`. The eight winner-vs-third matches and their slot indices:

```ts
buildKnockoutMatch(team(winners, "E"), third(0), 74, "ROUND_OF_32"),
buildKnockoutMatch(team(winners, "I"), third(1), 77, "ROUND_OF_32"),
buildKnockoutMatch(team(winners, "A"), third(2), 79, "ROUND_OF_32"),
buildKnockoutMatch(team(winners, "L"), third(3), 80, "ROUND_OF_32"),
buildKnockoutMatch(team(winners, "D"), third(4), 81, "ROUND_OF_32"),
buildKnockoutMatch(team(winners, "G"), third(5), 82, "ROUND_OF_32"),
buildKnockoutMatch(team(winners, "B"), third(6), 85, "ROUND_OF_32"),
buildKnockoutMatch(team(winners, "K"), third(7), 87, "ROUND_OF_32"),
```

  where `third(i)` is `qualified3rd[i]` (throws if missing). So the third-slot opponent groups, in slot order 0–7, are: **E, I, A, L, D, G, B, K**.
- The other eight R32 matches pair winners/runners from different groups by construction (e.g. `runners A` vs `runners B`) and can never be same-group; only the third-place slots can clash.
- `lib/tournament/standings.ts:53-69` — `calculateQualifiedThirds` ranks each group's `standings[2]` team by points/GD/GF/fifaRanking and returns the top 8 `Team`s (each from a distinct group, since one third per group).
- `Team.group` (see `lib/types/tournament.ts:19`) holds the group letter; `generateR32Bracket` is called from `lib/tournament/simulation.ts:37`.
- Conventions: pure functions, named exports, no new deps. Test exemplar: `lib/tournament/bracket.test.ts` (builds real state via `simulateAllGroupMatchDays(initializeTournament(getAllTeams()))`).
- **Feasibility fact for the algorithm**: the 8 slot groups (E, I, A, L, D, G, B, K) are distinct, and the 8 thirds come from 8 distinct groups, so each third is forbidden in **at most one** slot. A perfect assignment therefore always exists, and a depth-first search over slots (trying remaining thirds in rank order) finds one without deep backtracking.

## Commands you will need

| Purpose    | Command                                               | Expected on success |
|------------|-------------------------------------------------------|---------------------|
| Unit tests | `pnpm exec vitest run lib/tournament/bracket.test.ts` | all pass            |
| Full suite | `pnpm test`                                           | all pass            |
| Typecheck  | `pnpm typecheck`                                      | exit 0              |
| Lint       | `pnpm lint`                                           | exit 0              |

## Scope

**In scope** (the only files you should modify):
- `lib/tournament/bracket.ts`
- `lib/tournament/bracket.test.ts`
- `plans/README.md` (status row only)

**Out of scope** (do NOT touch):
- `calculateQualifiedThirds` — *which* 8 thirds qualify is correct; only *where they slot* changes.
- The 16-match structure, match numbers, and winner/runner pairings — unchanged.
- Implementing FIFA's full published allocation table (the 495-combination annex) — disproportionate for this simulator; the rank-preserving no-rematch assignment below is the documented simplification.

## Git workflow

- Branch: `advisor/006-r32-third-allocation`
- Commits: `fix: keep third-place teams away from their group winners in R32` then `test: assert no same-group rematches in round of 32`
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Add the assignment function

In `lib/tournament/bracket.ts`, add (exported, so it's directly testable):

```ts
const THIRD_SLOT_GROUPS = ["E", "I", "A", "L", "D", "G", "B", "K"] as const;

/**
 * Assigns ranked third-place teams to bracket slots so no team faces its own
 * group winner. Prefers rank order; a depth-first search resolves conflicts.
 * Simplification vs FIFA's published allocation annex, which fixes pairings
 * per combination of qualified groups.
 */
export function assignThirdsToSlots(
  qualified3rd: Team[],
  slotGroups: readonly string[] = THIRD_SLOT_GROUPS
): Team[] {
  const assignment: Team[] = [];
  const used = new Array<boolean>(qualified3rd.length).fill(false);

  const place = (slot: number): boolean => {
    if (slot === slotGroups.length) return true;
    for (let i = 0; i < qualified3rd.length; i += 1) {
      if (used[i] || qualified3rd[i].group.toUpperCase() === slotGroups[slot]) continue;
      used[i] = true;
      assignment[slot] = qualified3rd[i];
      if (place(slot + 1)) return true;
      used[i] = false;
    }
    return false;
  };

  if (!place(0)) throw new Error("No valid third-place allocation exists");
  return assignment;
}
```

(The throw is unreachable when thirds come from 8 distinct groups — see the feasibility fact — but it guards against malformed input.)

**Verify**: `pnpm typecheck` → exit 0.

### Step 2: Use it in `generateR32Bracket`

At the top of `generateR32Bracket`, after the `winners`/`runners` maps are built, add:

```ts
const slottedThirds = assignThirdsToSlots(qualified3rd);
```

and change the `third` helper to read from `slottedThirds` instead of `qualified3rd` (keep the missing-index throw). The 16-match list itself is untouched.

**Verify**: `pnpm exec vitest run lib/tournament/bracket.test.ts` → existing tests pass (they assert structure, not specific third placements).

### Step 3: Tests

In `lib/tournament/bracket.test.ts` add a `describe("assignThirdsToSlots")` block plus one integration invariant:

1. **Conflict case**: take `getAllTeams()`, pick the third-place candidates as the actual teams from groups E, I, A, L, D, G, B, K (so `qualified3rd[0]` is from group E — conflicting with slot 0). Assert: result has 8 distinct teams, `result[0].group !== "E"`, and for every slot `result[i].group !== THIRD_SLOT_GROUPS[i]`.
2. **No-conflict case keeps rank order**: thirds from groups C, F, H, J + any 4 others none of which collide with their slot → assert `result` equals input order. (Choose the input groups deliberately so no index collides; compute by hand against `["E","I","A","L","D","G","B","K"]`.)
3. **Malformed input throws**: 8 copies of teams all from group E → expect `toThrow("No valid third-place allocation")`.
4. **Integration invariant** (uses the plan-002 seam): for seeds 1..25, `simulateAllGroupMatchDays(initializeTournament(getAllTeams()), mulberry32(seed))` then assert every match in `state.r32Matches` has `match.homeTeam.group !== match.awayTeam.group`.

**Verify**: `pnpm exec vitest run lib/tournament/bracket.test.ts` → all pass.

### Step 4: Full gate

**Verify**: `pnpm lint && pnpm typecheck && pnpm test` → exit 0.

## Test plan

See Step 3; structural exemplar is the existing `describe("generateR32Bracket")` block in `lib/tournament/bracket.test.ts`. Cases: forced conflict resolved, rank order preserved when conflict-free, malformed input, and the cross-seed integration invariant (the regression net for the original bug).

## Done criteria

Machine-checkable. ALL must hold:

- [ ] `grep -n "assignThirdsToSlots" lib/tournament/bracket.ts` → definition + 1 use in `generateR32Bracket`
- [ ] `pnpm exec vitest run lib/tournament/bracket.test.ts` → all pass with ≥4 new tests including the 25-seed invariant
- [ ] `pnpm test`, `pnpm typecheck`, `pnpm lint` all exit 0
- [ ] No files outside the in-scope list are modified (`git status`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- `generateR32Bracket` no longer matches the excerpt (drifted).
- Plan 002's `mulberry32` is unavailable — the integration test depends on it; land 002 first.
- The 25-seed invariant test fails even after Step 2 — that means a same-group pairing escapes through a non-third slot, which contradicts the analysis in "Current state"; report which match number and teams.

## Maintenance notes

- If someone later implements FIFA's official allocation annex, `assignThirdsToSlots` is the single replacement point; its contract (8 thirds in, 8 slot-ordered thirds out, no slot conflicts) stays.
- Reviewers: scrutinize test 2's hand-computed expectation — it encodes the "prefer rank order" property.
- Deferred deliberately: venue/scheduling fidelity for R32 matches; the simulator doesn't model venues for knockout rounds.
