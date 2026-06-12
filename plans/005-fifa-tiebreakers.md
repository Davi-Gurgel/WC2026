# Plan 005: Implement FIFA-correct multi-team group tiebreakers

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat c34e838..HEAD -- lib/tournament/standings.ts lib/tournament/standings.test.ts`
> If `computeStandings`/`compareHeadToHead` no longer match the excerpts
> below, treat it as a STOP condition. (New tests added by plan 003 elsewhere
> are fine.)

## Status

- **Priority**: P2
- **Effort**: M
- **Risk**: MED (changes ranking outcomes in tied groups; mitigated by characterization tests from plan 003 and the suite in `standings.test.ts`)
- **Depends on**: plans/003-engine-unit-tests.md (recommended), none strictly
- **Category**: bug
- **Issue**: https://github.com/Davi-Gurgel/WC2026/issues/16
- **Planned at**: commit `c34e838`, 2026-06-11

## Why this matters

Group standings are sorted with a comparator that applies **pairwise** head-to-head criteria. Two problems:

1. **Wrong rule**: FIFA breaks ties among 3+ teams using a mini-table of the matches *among all tied teams* (points, then goal difference, then goals scored in those matches), not pairwise comparisons. With a result cycle (A beats B, B beats C, C beats A, all else equal) the pairwise comparator is non-transitive, which violates `Array.prototype.sort`'s contract — the resulting order is arbitrary and engine-version-dependent.
2. **Dead criterion**: the `"gd"` and `"gs"` branches of `compareHeadToHead` return the literally identical expression (`bGoals - aGoals`), so one of the three documented criteria does nothing.

This plan replaces the comparator chain with a partition-then-mini-table sort that is rule-correct and guaranteed transitive.

## Current state

- `lib/tournament/standings.ts:40-50` — the sort:

```ts
  return [...stats.values()].sort((a, b) => {
    return (
      b.points - a.points ||
      b.goalDifference - a.goalDifference ||
      b.goalsFor - a.goalsFor ||
      compareHeadToHead(a, b, matches, "points") ||
      compareHeadToHead(a, b, matches, "gd") ||
      compareHeadToHead(a, b, matches, "gs") ||
      (rank.get(a.teamName) ?? 999) - (rank.get(b.teamName) ?? 999)
    );
  });
```

- `lib/tournament/standings.ts:88-107` — the pairwise helper (note lines 105–106: `"gd"` and `"gs"` return the same value):

```ts
function compareHeadToHead(a, b, matches, criterion) {
  const h2h = matches.find(/* the single match between a and b */);
  if (!h2h) return 0;
  // ...
  if (criterion === "gd") return bGoals - aGoals;
  return bGoals - aGoals;
}
```

- `computeStandings(teams: Team[], matches: Match[])` builds a `Map<string, TeamGroupStats>` (zeroed per team), accumulates with `addResult`, and has a `rank` map of `team.fifaRanking`. Keep all of that — only the final ordering changes.
- `calculateQualifiedThirds` (`standings.ts:53-69`) compares thirds **across** groups (no head-to-head exists) by points/GD/GF/fifaRanking — correct as-is; do not change it.
- Callers of `computeStandings`: `lib/tournament/simulation.ts:21`, `lib/tournament/state.ts:41`, `lib/tournament/storage-codec.ts:47`. The signature must not change.
- Conventions: pure functions, named exports, no new dependencies. Exemplar tests: `lib/tournament/standings.test.ts` (invariant style).
- Rule reference (FIFA World Cup group-stage tiebreakers, in order): overall points; overall goal difference; overall goals scored; then, among the teams still tied: points in matches among them; goal difference among them; goals scored among them; then disciplinary/drawing of lots. This simulator has no bookings, so the final fallback stays `fifaRanking` (documented simplification, already the existing behavior).

## Commands you will need

| Purpose    | Command                                                 | Expected on success |
|------------|---------------------------------------------------------|---------------------|
| Unit tests | `pnpm exec vitest run lib/tournament/standings.test.ts` | all pass            |
| Full suite | `pnpm test`                                             | all pass            |
| Typecheck  | `pnpm typecheck`                                        | exit 0              |
| Lint       | `pnpm lint`                                             | exit 0              |

## Scope

**In scope** (the only files you should modify):
- `lib/tournament/standings.ts`
- `lib/tournament/standings.test.ts`
- `plans/README.md` (status row only)

**Out of scope** (do NOT touch):
- `calculateQualifiedThirds` — cross-group ranking has no head-to-head; correct as-is.
- `addResult`, the stats-accumulation loop, and the `TeamGroupStats` type — unchanged.
- Adding fair-play/booking tracking — the engine doesn't simulate cards; `fifaRanking` stays the final fallback.

## Git workflow

- Branch: `advisor/005-fifa-tiebreakers`
- Commits: `fix: apply FIFA mini-table tiebreakers among tied teams` then `test: cover multi-team tie scenarios`
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Replace the ordering logic in `computeStandings`

Delete `compareHeadToHead` entirely. Replace the `return [...stats.values()].sort(...)` block with a partition-then-refine approach:

```ts
  const overall = [...stats.values()].sort(
    (a, b) => b.points - a.points || b.goalDifference - a.goalDifference || b.goalsFor - a.goalsFor
  );

  const result: TeamGroupStats[] = [];
  let cluster: TeamGroupStats[] = [];
  for (const row of overall) {
    if (cluster.length && !isOverallTied(cluster[0], row)) {
      result.push(...orderTiedTeams(cluster, matches, rank));
      cluster = [];
    }
    cluster.push(row);
  }
  if (cluster.length) result.push(...orderTiedTeams(cluster, matches, rank));
  return result;
```

with two new private helpers in the same file:

```ts
function isOverallTied(a: TeamGroupStats, b: TeamGroupStats): boolean {
  return a.points === b.points && a.goalDifference === b.goalDifference && a.goalsFor === b.goalsFor;
}

function orderTiedTeams(cluster: TeamGroupStats[], matches: Match[], rank: Map<string, number>): TeamGroupStats[] {
  if (cluster.length === 1) return cluster;

  const tiedNames = new Set(cluster.map((row) => row.teamName));
  const mini = new Map<string, { points: number; gd: number; gf: number }>(
    cluster.map((row) => [row.teamName, { points: 0, gd: 0, gf: 0 }])
  );
  for (const match of matches) {
    if (!match.played || !tiedNames.has(match.homeTeam.name) || !tiedNames.has(match.awayTeam.name)) continue;
    // accumulate points/gd/gf for both sides into `mini` from match.homeScore/awayScore
  }

  return [...cluster].sort((a, b) => {
    const ma = mini.get(a.teamName)!;
    const mb = mini.get(b.teamName)!;
    return (
      mb.points - ma.points ||
      mb.gd - ma.gd ||
      mb.gf - ma.gf ||
      (rank.get(a.teamName) ?? 999) - (rank.get(b.teamName) ?? 999)
    );
  });
}
```

Why this is safe for `sort`: within a cluster, every team's mini-table values are fixed numbers, so the comparator is a key-based total preorder — transitive by construction. (FIFA technically re-applies the criteria recursively if a strict subset remains tied after the mini-table; with at most 4 teams per group and `fifaRanking` as a deterministic final key, one level is an acceptable, documented simplification — note it in a code comment.)

**Verify**: `pnpm typecheck` → exit 0; `pnpm exec vitest run lib/tournament/standings.test.ts` → existing tests pass.

### Step 2: Add scenario tests

In `lib/tournament/standings.test.ts`, add a `describe("multi-team tiebreakers")` block. Build deterministic played matches with `buildGroupMatch` from `@/lib/tournament/matches`, then spread to set scores: `{ ...buildGroupMatch(t0, t1, new Date("2026-06-11"), "A", 1, 1), played: true, homeScore: 1, awayScore: 0 }`. Use 4 teams from `getAllTeams().slice(0, 4)` (their real `fifaRanking` values give a deterministic final fallback — read them in the test rather than assuming).

Scenarios:

1. **Two-team tie decided by head-to-head**: A and B finish with equal points/GD/GF overall, A beat B directly → A ranks above B even if B's `fifaRanking` is better. (This is the case the old pairwise code also got right — it must keep working.)
2. **Three-team cycle, decided by mini-table goals**: A beats B 2-1, B beats C 1-0, C beats A 1-0 — construct the remaining matches against the 4th team so overall points/GD/GF are equal among A, B, C. Mini-table: all 3 points; GD: A 0, B -1... compute the actual expected order by hand in the test and assert it. The point: the result is deterministic and explainable, not sort-order luck.
3. **Fully tied cluster falls back to FIFA ranking**: no played matches → standings ordered by ascending `fifaRanking`.
4. **Determinism**: calling `computeStandings` twice with the same inputs returns the same order (`JSON.stringify` equality).

**Verify**: `pnpm exec vitest run lib/tournament/standings.test.ts` → all pass, including ≥4 new tests.

### Step 3: Full gate

**Verify**: `pnpm lint && pnpm typecheck && pnpm test` → exit 0. If plan 003's characterization tests pinned an ordering this change legitimately alters, update that specific assertion and say so in the commit message.

## Test plan

See Step 2. Structural exemplar: existing `describe("computeStandings")` in `lib/tournament/standings.test.ts`. The invariant tests there (points descending, GD as second key, totals) must keep passing unmodified — they encode rules this plan does not change.

## Done criteria

Machine-checkable. ALL must hold:

- [ ] `grep -n "compareHeadToHead" lib/tournament/standings.ts` → no matches
- [ ] `pnpm exec vitest run lib/tournament/standings.test.ts` → all pass with ≥4 new multi-team tie tests
- [ ] `pnpm test`, `pnpm typecheck`, `pnpm lint` all exit 0
- [ ] `computeStandings` signature unchanged (`grep -n "export function computeStandings(teams: Team\[\], matches: Match\[\])" lib/tournament/standings.ts` → 1 match)
- [ ] No files outside the in-scope list are modified (`git status`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- `standings.ts` no longer matches the excerpts (drifted).
- You cannot construct scenario 2 with equal overall points/GD/GF — report the constructed fixture and the blocker instead of weakening the test to a 2-team case.
- Any caller (`simulation.ts`, `state.ts`, `storage-codec.ts`) needs modification — the signature is unchanged, so they must not.

## Maintenance notes

- If the engine ever simulates bookings, insert a fair-play key between the mini-table criteria and `fifaRanking` in `orderTiedTeams` — that single comparator is now the only ranking authority.
- Reviewers: hand-check the expected order in scenario 2 against the FIFA criteria list in "Current state" — that test is the spec.
- Known simplification (documented in code comment): no recursive re-application of mini-table criteria to still-tied subsets; `fifaRanking` substitutes for fair-play points and drawing of lots.
