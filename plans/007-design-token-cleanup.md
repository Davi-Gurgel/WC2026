# Plan 007: Replace hardcoded brand hex values with design-token CSS variables

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat c34e838..HEAD -- app components`
> If the files changed since this plan was written, re-run the inventory
> command in Step 1 and work from its fresh output; if `app/globals.css` no
> longer defines the tokens listed below, treat it as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: M
- **Risk**: LOW (mechanical substitution; identical computed colors)
- **Depends on**: none (001 recommended first so CI guards the refactor)
- **Category**: tech-debt
- **Issue**: https://github.com/Davi-Gurgel/WC2026/issues/19
- **Planned at**: commit `c34e838`, 2026-06-11

## Why this matters

The repo has a real design system: `app/globals.css` defines `@theme` tokens for the "Bright Broadcast" palette (`--color-wc-ink`, `--color-wc-can-red`, `--color-wc-cream`, …). But the pages and components hardcode the raw hex values in inline `style` objects — `#0d0d10` appears ~25 times in the home page alone, ~150+ across the app. A palette change today requires editing dozens of files and will miss sites. Replacing the raw hexes with `var(--color-*)` references makes the tokens the single source of truth without restructuring any component.

## Current state

- `app/globals.css` `@theme` block defines (relevant subset, with exact values):

```css
--color-wc-mex-green: #006847;
--color-wc-can-red:   #D52B1E;
--color-wc-cream:     #fefaf0;
--color-wc-paper:     #f7f1e3;
--color-wc-ink:       #0d0d10;
```

- The duplication shape (exemplar, `components/ui/Button.tsx:17-40`):

```ts
const VARIANT_STYLE: Record<ButtonVariant, React.CSSProperties> = {
  primary: {
    background: "#0d0d10",
    color: "#fff",
    border: "none",
    boxShadow: "6px 6px 0 0 #D52B1E",
  },
  ...
```

- Highest-count files (from `grep -o '#[0-9a-fA-F]\{6\}' ... | sort | uniq -c` at `c34e838`): `app/(simulator)/page.tsx` (25× `#0d0d10`, 12× `#D52B1E`), `components/simulator/TeamDetailSections.tsx` (20× ink), `app/(simulator)/stats/page.tsx` (18× ink), `components/simulator/GroupCard.tsx` (14× ink), `app/(simulator)/bracket/page.tsx` (12× red, 10× ink), plus `matches/page.tsx`, `groups/page.tsx`, `app/teams/page.tsx`, `components/ui/*`, `components/Nav.tsx`.
- These hexes appear inside inline `style={{ ... }}` objects and `React.CSSProperties` constants. CSS `var()` works in all of these positions at runtime; the tokens are global because Tailwind v4's `@theme` emits them as CSS custom properties on `:root`.
- Repo conventions: Tailwind v4 utilities for layout; the inline-style objects are the established pattern for the Bright Broadcast look — **keep them**, only swap the color literals. ESLint is the gate; Prettier exists but is not enforced.

## Commands you will need

| Purpose    | Command          | Expected on success |
|------------|------------------|---------------------|
| Typecheck  | `pnpm typecheck` | exit 0              |
| Lint       | `pnpm lint`      | exit 0              |
| Tests      | `pnpm test`      | all pass            |
| Build      | `pnpm build`     | exit 0              |
| Dev server | `pnpm dev`       | serves on :3000     |

## Scope

**In scope** (the only files you should modify — all `.tsx` under these dirs that contain the target hexes):
- `app/**/*.tsx`
- `components/**/*.tsx`
- `plans/README.md` (status row only)

**Out of scope** (do NOT touch):
- `app/globals.css` — tokens already exist; nothing to add. (If you *were* to edit it: the project has a known Turbopack issue where stale `@theme` CSS requires `rm -rf .next` — but you should not need this.)
- `lib/flagColors.ts` — per-country flag colors, not design tokens.
- `data/national_teams.json`, anything in `lib/`.
- `rgba(...)` values (e.g. `rgba(13,13,16,0.3)`) — alpha variants have no tokens; converting them needs a design decision. Leave them.
- `#fff` / `#ffffff` / `#000` — plain white/black, not brand colors; leave them.
- Any layout, spacing, font-size, or structural change — colors only.

## Git workflow

- Branch: `advisor/007-design-token-cleanup`
- One commit per directory cluster is fine, conventional style: `refactor: use design tokens for brand colors in simulator pages`
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Inventory the exact sites

Run:

```bash
grep -rn --include='*.tsx' -E '#(0d0d10|D52B1E|006847|fefaf0|f7f1e3)' app components
```

Record the count (expect roughly 150–200 matches). This list is your worklist; nothing outside it changes.

**Verify**: command outputs a non-empty list; note the total with `| wc -l`.

### Step 2: Substitute, file by file

In every matched file, replace the string literals (case-sensitive as they appear; `#D52B1E` is uppercase in this codebase, `#0d0d10` lowercase):

| Literal     | Replacement                  |
|-------------|------------------------------|
| `#0d0d10`   | `var(--color-wc-ink)`        |
| `#D52B1E`   | `var(--color-wc-can-red)`    |
| `#006847`   | `var(--color-wc-mex-green)`  |
| `#fefaf0`   | `var(--color-wc-cream)`      |
| `#f7f1e3`   | `var(--color-wc-paper)`      |

This includes occurrences embedded in longer values, e.g. `boxShadow: "6px 6px 0 0 #D52B1E"` → `boxShadow: "6px 6px 0 0 var(--color-wc-can-red)"` and `border: "2px solid #0d0d10"` → `border: "2px solid var(--color-wc-ink)"`. A `sed`-style bulk replace per file is acceptable; review each diff hunk afterward.

One special case: if a hex appears in a **non-CSS context** (none are known at `c34e838` — canvas-confetti colors in `components/simulator/useChampionCelebration.ts` would be one if present; check it), leave it and note it in your report, because `var()` only resolves in CSS.

**Verify** after each file: `pnpm typecheck` → exit 0 (catches a broken string quickly).

### Step 3: Confirm zero remaining brand hexes

```bash
grep -rn --include='*.tsx' -E '#(0d0d10|D52B1E|006847|fefaf0|f7f1e3)' app components
```

**Verify**: no matches (except any documented non-CSS contexts from Step 2).

### Step 4: Full gate + visual smoke test

Run the gate, then start the dev server and load `/`, `/groups`, `/bracket`, `/stats`, `/teams` — the pages must look identical (same cream background, ink borders, red shadows). The colors are byte-identical values resolved through variables, so any visible difference means a typo'd variable name (an unresolved `var()` falls back to nothing — backgrounds would render transparent/default, which is easy to spot).

**Verify**: `pnpm lint && pnpm typecheck && pnpm test && pnpm build` → exit 0; manual smoke check shows no visual change.

## Test plan

No new unit tests — this is a value-identical refactor verified by the grep done-criterion, the existing suite (jsdom component tests in `components/TournamentProvider.test.tsx` still pass), and the visual smoke test in Step 4. If the repo later adds visual regression testing, this plan is the kind of change it would cover.

## Done criteria

Machine-checkable. ALL must hold:

- [ ] `grep -rn --include='*.tsx' -E '#(0d0d10|D52B1E|006847|fefaf0|f7f1e3)' app components` → 0 matches (or only documented non-CSS contexts)
- [ ] `grep -rn "var(--color-wc-ink)" app components | wc -l` → roughly the former `#0d0d10` count (sanity check the substitution actually happened)
- [ ] `pnpm lint && pnpm typecheck && pnpm test && pnpm build` exits 0
- [ ] `git diff --stat` touches only `.tsx` files under `app/`/`components/` plus `plans/README.md`
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- `app/globals.css` does not define one of the five tokens in the mapping table (token names drifted) — do not invent a token name.
- You find a brand hex whose value does **not** exactly match a token (e.g. `#d52b1f`) — that's either a bug or an intentional variant; list it, don't guess.
- More than ~250 matches appear in Step 1 — the codebase grew significantly; re-confirm scope before a much larger mechanical change.

## Maintenance notes

- New components must use `var(--color-wc-*)` (or Tailwind utilities like `bg-wc-cream`, which Tailwind v4 generates from `@theme`) — reviewers should reject new raw brand hexes in `.tsx`.
- The `rgba(13,13,16,*)` alpha variants remain hardcoded; if the ink color ever changes, those need a follow-up (consider `color-mix(in srgb, var(--color-wc-ink) 30%, transparent)`).
- A future deeper cleanup could lift the repeated style objects (`SECTION_TITLE`, `PILL_BASE`, card borders) into shared constants or Tailwind utilities — deliberately out of scope here to keep this change mechanically reviewable.
