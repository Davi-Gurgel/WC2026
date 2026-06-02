<!-- BEGIN:nextjs-agent-rules -->

# Next.js: ALWAYS read docs before coding

Before any Next.js work, find and read the relevant doc in `node_modules/next/dist/docs/`. Your training data is outdated — the docs are the source of truth.

<!-- END:nextjs-agent-rules -->

# Repository Guidelines

This is the canonical agent guide for this repository. `CLAUDE.md` imports this file, so Claude
Code, Cursor, Copilot, and other agents all read the same instructions — **edit this file, not a
copy.**

## What this is

A 2026 FIFA World Cup simulator: 48 teams, 12 groups (A–L), full group stage + knockout bracket
through the final, with simulated scorelines, extra time, penalties, and top scorers. Next.js 16
(App Router) + React 19 + TypeScript (strict) + Tailwind v4 + Zod v4. UI locale is **pt-BR**
(`lang="pt-BR"`, phase labels default to pt-BR).

The codebase is two largely independent halves:
1. **Tournament engine** — pure simulation logic in `lib/tournament/`, driven through React
   context, persisted to `localStorage`.
2. **Final team data** — `data/national_teams.json` is the committed roster/ratings dataset the
   app consumes directly.

## Build, Test, and Development Commands

```bash
pnpm install         # install from pnpm-lock.yaml
pnpm dev             # local dev server at http://localhost:3000
pnpm build           # production build
pnpm lint            # ESLint (next core-web-vitals) — the enforced lint gate
pnpm typecheck       # tsc --noEmit, strict
pnpm test            # Vitest, run once
```

Run a single test file or filter:
```bash
pnpm exec vitest run lib/tournament/standings.test.ts
pnpm exec vitest run -t "qualified thirds"
```

Release / pre-PR gate (see README "Checklist de release"):
```bash
pnpm lint && pnpm typecheck && pnpm test && pnpm build
```

Use the Node version declared in `.node-version` / `package.json#engines`.

## Tournament engine (`lib/tournament/`)

- **`lib/tournament.ts` is a barrel** re-exporting every submodule (`bracket`, `constants`,
  `matches`, `scorers`, `selectors`, `simulation`, `standings`, `state`). Import from
  `@/lib/tournament`, not the individual files, in app code.
- **`TournamentState` is one immutable object** (`lib/types/tournament.ts`) holding all teams,
  groups, every knockout round, scorers, phase, and result. **All simulation functions are pure:
  `state in → new state out`** — they never mutate. Keep them that way; the React layer owns all
  side effects.
- **Phase flow:** `NOT_STARTED → GROUP_STAGE → ROUND_OF_32 → ROUND_OF_16 → QUARTERFINAL →
  SEMIFINAL → FINAL → FINISHED`. After three group match days, `calculateQualifiedThirds` picks the **8
  best third-placed teams** to fill the Round of 32 (32 = 24 group qualifiers + 8 best thirds).
- **Scoring model** (`simulation.ts > simulateMatch`): goal chance ≈ `strength * luck / 380`
  (luck ∈ [0.85, 1.15]), capped at 7 goals/team. Knockout draws → extra time (2 extra events) →
  penalties at 70% conversion. Scorers are weighted by position (forward-heavy) and player
  strength. Uses `Math.random()` — simulations are **non-deterministic**, so tests assert
  invariants (counts, phase transitions, structure), not exact scorelines.

### State management & persistence

- `components/TournamentProvider.tsx` (`"use client"`) is the only stateful wrapper. It exposes
  `start/reset/simulateGroupDay/simulateAllGroups/simulateKnockoutRound` via `useTournament()`.
  Pages read state through this hook; they don't call the engine directly.
- The `(simulator)` route group's layout mounts `TournamentProvider`, so all simulator pages
  share one tournament.
- **Persistence is compacted, not raw.** `lib/tournament/storage-codec.ts` strips full `Team`
  objects down to country codes before writing to `localStorage`, then re-expands them against
  `getAllTeams()` on load. Don't `JSON.stringify` `TournamentState` directly into storage —
  always go through the codec. Stored payloads are validated by `storage-guards.ts` /
  `storage-schema.ts` (`STORAGE_KEY = "wc26-tournament-state-v1"`); anything that fails the guard
  is discarded, not migrated.
- Hydration is deliberately deferred to a `setTimeout(0)` (avoids cascading-update warnings) and
  persistence runs in `requestIdleCallback`. Preserve this timing if you touch the provider.

### Team data loading

`lib/teams.ts > getAllTeams()` parses `data/national_teams.json` through a strict **Zod** schema
at runtime (exactly 48 teams, 4 per group, unique country codes, ≥1 player each), then caches and
**deep-freezes** the result. Treat the returned teams as immutable. Look teams up via
`getTeamByCodeOrName` (handles URL-encoded names and code/name matching).

## Team Data

`data/national_teams.json` is the final committed dataset. The old scraping, SQL, SQLite, and CSV
rating pipeline has been removed intentionally. If a roster, position, or strength must change,
edit the JSON directly and run the release gate. The runtime Zod schema in `lib/teams.ts` validates
that there are exactly 48 teams, 12 groups of 4, unique country codes, and at least one player per
team.

## Coding Style & Naming Conventions

- **Path alias `@/*`** maps to repo root (e.g. `@/lib/tournament`). Configured in both
  `tsconfig.json` and `vitest.config.ts` — keep them in sync.
- Use TypeScript for all app logic. Prefer **named exports**, PascalCase for React components,
  camelCase for functions/variables, and UPPERCASE enum-like strings for tournament phases and
  positions.
- Keep components small and compose shared presentation elements from `components/ui/`.
- Styling is Tailwind v4 utility classes; keep class lists readable and consistent with nearby
  components. Prettier with the Tailwind plugin is available, but **ESLint is the enforced gate**,
  not Prettier.
- `next.config.mjs` sets a strict CSP and security headers. New external connections (scripts,
  fonts, `connect-src`) must be added there or they'll be blocked.

## Testing Guidelines

Vitest is the test runner. Tests are colocated `*.test.ts(x)`. Pure tournament logic uses the
default `node` environment; component tests opt into jsdom with a top-of-file
`// @vitest-environment jsdom` and use Testing Library. Add or update colocated tests when
changing tournament rules, persistence, routing assumptions, or shared UI behavior. Because the
simulation is `Math.random`-driven, assert invariants (counts, phase transitions, structure)
rather than exact scorelines.

## Commit & Pull Request Guidelines

Use short conventional-style commits — `fix:`, `feat:`, `chore:`, `test:`, or `docs:` plus an
imperative summary (e.g. `fix: harden tournament hydration`). Keep commits atomic: each commit
should capture one coherent change that can be reviewed, reverted, and tested independently; split
unrelated cleanup, behavior changes, tests, and docs into separate commits. Pull requests should
include a description, a linked issue when applicable, screenshots for UI changes, and the
verification commands run.

## Security & Configuration

Do not commit local environment files, generated `.next/` output, or `node_modules/`. Validate
imported JSON data with the existing typed Zod helpers in `lib/` rather than bypassing them.
