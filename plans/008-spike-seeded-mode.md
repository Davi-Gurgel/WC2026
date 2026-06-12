# Plan 008: Spike — seeded, replayable tournament simulations

> **Executor instructions**: This is a **design spike**, not a build plan. The
> deliverable is a written design document plus a throwaway prototype proving
> the riskiest assumption. Do not ship UI or change engine behavior for
> default callers. Follow the steps, honor STOP conditions, and update the
> status row in `plans/README.md` when done.
>
> **Drift check (run first)**: `git diff --stat c34e838..HEAD -- lib/tournament components/TournamentProvider.tsx`
> Plans 002–006 are expected to have landed (this spike requires 002). If
> `lib/tournament/rng.ts` does not exist, STOP — plan 002 is a prerequisite.

## Status

- **Priority**: P3
- **Effort**: M (spike: ~half a day of investigation + writing)
- **Risk**: LOW (no production code changes)
- **Depends on**: plans/002-rng-seam.md
- **Category**: direction
- **Issue**: https://github.com/Davi-Gurgel/WC2026/issues/21
- **Planned at**: commit `c34e838`, 2026-06-11

## Why this matters

The engine is pure (`state in → new state out`) and, after plan 002, every random draw flows through an injectable `Rng`. That makes deterministic tournaments architecturally cheap: store a seed, and the same clicks reproduce the same World Cup. This unlocks "share this tournament as a seed" (a few bytes instead of the full state payload) and "replay my tournament", and it strengthens testing. The open questions are about *product and persistence semantics*, not feasibility — hence a spike.

## Current state

- `lib/tournament/rng.ts` (from plan 002) exports `type Rng = () => number` and `mulberry32(seed)`.
- All simulate functions accept an optional trailing `rng` (plan 002): `simulateCurrentGroupMatchDay`, `simulateAllGroupMatchDays`, `simulateCurrentKnockoutRound`, `simulatePenalties`.
- `components/TournamentProvider.tsx:72-78` — the only stateful layer; currently calls the engine with no `rng`, e.g.:

```ts
const simulateGroupDay = useCallback(() => setState((current) => simulateCurrentGroupMatchDay(current)), []);
```

- Persistence: `lib/tournament/storage-codec.ts` compacts state to country codes under `STORAGE_KEY = "wc26-tournament-state-v1"`, `STORAGE_VERSION = 3` (`lib/tournament/storage-schema.ts`). Guards (`storage-guards.ts`) reject unknown fields? — No: they check required fields only; **verify during the spike whether adding a field is backward compatible** (an old payload without the field must still load, and the guard must tolerate the new field).
- Key subtlety the design must resolve: determinism holds only if the *sequence* of RNG draws is identical. The same seed replays identically only when the user performs the same sequence of simulate actions (`simulateGroupDay` 3× vs `simulateAllGroups` 1× consume draws in the same order — verify; they should, since `simulateAllGroupMatchDays` just loops `simulateCurrentGroupMatchDay`). Mid-tournament restores are the hard case: after reload, the RNG object is gone; replaying from the seed requires re-running all past simulations (cheap — full tournament is ~104 matches) or persisting the RNG cursor.

## Commands you will need

| Purpose    | Command          | Expected on success |
|------------|------------------|---------------------|
| Tests      | `pnpm test`      | all pass            |
| Typecheck  | `pnpm typecheck` | exit 0              |

## Scope

**In scope**:
- `plans/spikes/seeded-mode.md` (create — the deliverable)
- A throwaway prototype, **either** as a Vitest file `lib/tournament/seeded-replay.spike.test.ts` (delete or keep as a regular test per the recommendation you write) **or** on a scratch branch — prototype code must not land in `main` paths.
- `plans/README.md` (status row only)

**Out of scope** (do NOT touch):
- Shipping any UI (buttons, seed display) — that's the follow-up build plan this spike specifies.
- Changing `STORAGE_VERSION` or the codec — the design proposes the change; it doesn't make it.
- `data/national_teams.json` — note in the design that determinism is also conditional on the dataset version.

## Steps

### Step 1: Prove replay determinism (the riskiest assumption)

Write a prototype test that: (a) simulates a full tournament step-by-step (`simulateGroupDay` ×3, then knockout rounds one by one) with `mulberry32(123)` **created once and shared across calls**; (b) simulates again with fresh `mulberry32(123)` using the bulk functions (`simulateAllGroupMatchDays` + rounds); (c) compares final states via `JSON.stringify`. Document whether step-wise and bulk paths consume draws identically (expected: yes). Also measure wall time of a full replay-from-seed (expected: a few ms).

**Verify**: the prototype test passes (or its failure is documented as the central design constraint).

### Step 2: Write the design doc

`plans/spikes/seeded-mode.md` must answer, with a recommendation each:

1. **State shape**: where the seed lives (proposal: `TournamentState.seed: number | null` set by `initializeTournament`-wrapper or provider at start) and how mid-tournament restores stay deterministic (proposal: persist seed + an action log or rely on full replay-from-seed at restore; pick one based on Step 1 timings).
2. **Storage**: new compact field(s), whether `STORAGE_VERSION` must bump to 4 (it must if guards reject unknown/missing fields — state what you verified), and the migration stance (repo convention: discard, don't migrate — note the user impact).
3. **API**: exact signatures, e.g. `startTournament(seed?: number)` in the provider; default = random seed (`Date.now() % 2**32` or `crypto.getRandomValues`), surfaced in UI later.
4. **Sharing semantics**: what a seed reproduces (same dataset version + same action availability) and what it doesn't; recommend pairing the seed with `STORAGE_VERSION` and a data hash, or explicitly documenting "same app version only".
5. **Non-goals**: replaying *partial* histories, seeding individual matches.
6. **Follow-up build plan outline**: ordered steps + test list, sized S/M/L.

**Verify**: the doc exists and answers all six numbered questions with a recommendation each (not just options).

### Step 3: Clean up

Remove prototype code from tracked paths unless you recommended keeping the determinism test permanently (if kept, rename to `lib/tournament/seeded-replay.test.ts` and say so in the doc).

**Verify**: `pnpm lint && pnpm typecheck && pnpm test` → exit 0; `git status` shows only in-scope files.

## Done criteria

- [ ] `plans/spikes/seeded-mode.md` exists, answers all 6 questions, each with a recommendation
- [ ] Step-1 determinism result (pass/fail + replay timing) is recorded in the doc
- [ ] `pnpm lint && pnpm typecheck && pnpm test` exit 0
- [ ] `plans/README.md` status row updated

## STOP conditions

- Plan 002 hasn't landed (`lib/tournament/rng.ts` missing).
- Step 1 reveals non-determinism with a shared seed (e.g. draw-order divergence between step-wise and bulk paths) that you cannot explain from the code — report the repro instead of designing around an ununderstood behavior.

## Maintenance notes

- If the engine ever gains new random draws (new features), seed-compatibility breaks across app versions — the design doc must state the versioning policy for that.
- This spike's output feeds a future build plan; do not start building without maintainer sign-off on the design.
