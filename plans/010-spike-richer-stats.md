# Plan 010: Spike — richer statistics from existing match data

> **Executor instructions**: This is a **design spike**. The deliverable is a
> design document defining the new selectors and stats UI, plus prototype
> selector signatures proven by types (no UI work). Honor STOP conditions;
> update the status row in `plans/README.md` when done.
>
> **Drift check (run first)**: `git diff --stat c34e838..HEAD -- lib/tournament/selectors.ts lib/types/tournament.ts app/(simulator)/stats/page.tsx`
> If the excerpts below no longer match the live code, re-read those files
> before designing; on contradiction with this plan's premises, STOP.

## Status

- **Priority**: P3
- **Effort**: M (spike: ~half a day)
- **Risk**: LOW (additive selectors; no engine changes)
- **Depends on**: none
- **Category**: direction
- **Issue**: https://github.com/Davi-Gurgel/WC2026/issues/17
- **Planned at**: commit `c34e838`, 2026-06-11

## Why this matters

The state already records everything needed for real analytics — every match with scores, extra time, penalties, and per-player `goalScorers` — but the stats page surfaces only four global numbers, a top-20 scorer list, and the last 8 matches. Questions a tournament simulator obviously invites ("best defense?", "most clean sheets?", "who scored in the knockouts?") are answerable today with pure selectors over existing data. No new simulation features are required, which makes this the lowest-risk direction item.

## Current state

- `app/(simulator)/stats/page.tsx` — current page: `StatBox` row (`totalMatches`, `totalGoals`, `averageGoals`), champion banner, TOP SCORERS table (`state.topScorers.slice(0, 20)`), RECENT ACTIVITY table (last 8 played matches by `getMatchActivityTime`).
- `lib/tournament/selectors.ts` — existing pure selectors: `collectTournamentMatches(state)` returns `{ groupMatches, knockoutMatches, playedGroupMatches, playedKnockoutMatches, playedMatches }`; `getTournamentStats(state, matches?)` returns the global numbers; `getMatchesForTeam(state, teamName)`. New selectors belong here, following these signatures (pure, `state`-first).
- Data available per match (`lib/types/tournament.ts:41-60`): `homeScore`, `awayScore`, `wentToExtraTime`, `wentToPenalties`, `homePenalties`, `awayPenalties`, `goalScorers: Record<string, string[]>` (team name → scorer names, one entry per goal), `knockoutRound`, `groupName`.
- Data **not** available (do not design features needing it): assists, cards, minutes, shots, lineups, match timeline. `Scorer` is `{ playerName, teamName, goals }` only.
- UI conventions: pt-BR locale (`phaseLabel` from `lib/tournament/constants.ts` — note the page currently renders English headings like "TOP SCORERS"; flag this inconsistency in the doc but don't resolve it), Bright Broadcast styling with `StatBox`/`PageHeader` primitives from `components/ui/`, tables styled like the TOP SCORERS table.
- Existing test exemplar for selectors: `lib/tournament/selectors.test.ts`.

## Commands you will need

| Purpose    | Command          | Expected on success |
|------------|------------------|---------------------|
| Tests      | `pnpm test`      | all pass            |
| Typecheck  | `pnpm typecheck` | exit 0              |

## Scope

**In scope**:
- `plans/spikes/richer-stats.md` (create — the deliverable)
- Optionally, type-only prototypes (selector signatures + return types) inside the doc as code blocks — **not** committed to `lib/`.
- `plans/README.md` (status row only)

**Out of scope** (do NOT touch):
- `lib/tournament/simulation.ts` or any engine change (e.g. simulating cards/assists) — that's a different, much bigger feature; the doc may list it under "rejected alternatives".
- `app/(simulator)/stats/page.tsx` — the follow-up build plan changes it, not this spike.
- `TournamentState` shape and the storage codec — derived stats must stay derived; nothing new gets persisted.

## Steps

### Step 1: Inventory derivable metrics

From the `Match` fields above, enumerate which metrics are computable, marking each cheap/medium. Must cover at least: per-team played/W/D/L/GF/GA/GD across the whole tournament (not just group); clean sheets; biggest win; highest-scoring match; extra-time and penalty-shootout counts; goals by knockout round vs group stage; per-player group-vs-knockout goal split (derivable by walking `goalScorers` per match, since `topScorers` has no phase split); team "form" (last N results).

**Verify**: the inventory section of the doc lists ≥10 metrics each annotated with its source fields.

### Step 2: Design the selectors

For the 4–6 highest-value metrics (your pick, justified), write exact TypeScript signatures and return types in the doc, following the existing pattern, e.g.:

```ts
export type TeamTournamentRecord = {
  team: Team;
  played: number; wins: number; draws: number; losses: number;
  goalsFor: number; goalsAgainst: number; cleanSheets: number;
};
export function getTeamRecords(state: TournamentState, matches?: TournamentMatchCollections): TeamTournamentRecord[];
```

State where each lives (`lib/tournament/selectors.ts`), the memoization point (page-level `useMemo`, matching `stats/page.tsx:24-38` — no new state library), and the test list per selector (invariants: e.g. sum of all `goalsFor` equals `totalGoals`; clean sheets ≤ played).

**Verify**: doc contains compilable-looking signatures (paste them into a scratch file and run `pnpm typecheck` if unsure, then delete the scratch file).

### Step 3: Design the UI extension

Specify what the stats page gains, using existing primitives: recommended shape is two new tables in the existing two-column grid ("TEAM RECORDS" sortable-by-column is **not** required — static GD-descending order is fine for v1) plus 2–3 new `StatBox` values. Include the empty-state behavior (the page's `AWAITING DATA` pattern). Note language consistency (pt-BR vs the current English headings) as an open question for the maintainer.

**Verify**: doc has a section per UI block with the data source selector named.

### Step 4: Write the follow-up build plan outline

Ordered steps (selectors + tests first, UI second), sized S/M/L, with done criteria mirroring this repo's gate.

**Verify**: `pnpm lint && pnpm typecheck && pnpm test` → exit 0 (nothing should have changed); `git status` shows only in-scope files.

## Done criteria

- [ ] `plans/spikes/richer-stats.md` exists with: metric inventory (≥10), 4–6 selector designs with exact signatures, UI section, build-plan outline
- [ ] No changes to `lib/`, `app/`, or `components/` (`git status`)
- [ ] `pnpm test` exits 0
- [ ] `plans/README.md` status row updated

## STOP conditions

- `Match.goalScorers` turns out not to contain one entry per goal (check `lib/tournament/simulation.ts > assignGoalScorers` — at `c34e838` it pushes exactly `goals` names) — several designs depend on that invariant.
- The selectors file has been significantly restructured since `c34e838`.

## Maintenance notes

- All proposed stats are derived; if a future plan persists any of them, that's a design smell — recompute from matches instead.
- If plan 008 (seeded mode) lands, stats tables become shareable/reproducible automatically; no coupling needed.
