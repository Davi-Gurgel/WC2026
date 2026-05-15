# WC26 Simulator — Design System

The homepage uses a **Festival / Pop Poster** visual language: cream paper backgrounds, bold Archivo Black type, hard ink borders, and the three host-nation flag colours. This document captures every pattern so the other pages can be migrated to match.

---

## Colours

All tokens live in the `@theme` block in `globals.css`.

| Token | Hex | Usage |
|---|---|---|
| `--color-wc-ink` | `#0d0d10` | All borders, dark text, nav bar, dark BGs |
| `--color-wc-cream` | `#fefaf0` | Page/card background |
| `--color-wc-paper` | `#f7f1e3` | Slightly warmer cream (alternate card) |
| `--color-wc-can-red` | `#D52B1E` | Canada / primary accent (CTAs, active nav, pill BGs) |
| `--color-wc-mex-green` | `#006847` | Mexico / Group Stage accent |
| `--color-wc-usa-blue` | `#002868` | USA / Knockout accent |
| `--color-wc-mex-red` | `#CE1126` | Secondary Mexico accent |
| `--color-wc-usa-red` | `#BF0A30` | Secondary USA accent |

The old `navy*` and `glass*` tokens remain for any components not yet migrated — remove them as each page is ported.

**Hard shadows** replace box shadows everywhere: always `N px N px 0 0 #D52B1E` (no blur). Sizes used:
- `8px 8px` — primary CTA buttons
- `6px 6px` — secondary CTAs
- `4px 4px` — compact / inline buttons
- `8px 8px` — modals / dialogs

---

## Typography

| Variable | Font | Usage |
|---|---|---|
| `--font-archivo-black` | Archivo Black 400 | All display: headings, stat numbers, button labels, country names |
| `--font-space-grotesk` | Space Grotesk 400–700 | Body copy, descriptions, nav links |
| `--font-jetbrains-mono` | JetBrains Mono 400–700 | Eyebrows, micro-labels, badges, stat labels, ticker |

### Scale reference

| Role | Font | Size | Letter-spacing | Line-height |
|---|---|---|---|---|
| Hero number (`26`) | Archivo Black | `clamp(88px,13vw,170px)` | `-0.05em` | `0.8` |
| Hero word (`WORLD`) | Archivo Black | `clamp(64px,9vw,116px)` | `-0.04em` | `0.82` |
| Host name (`MÉXICO`) | Archivo Black | `clamp(40px,5vw,64px)` | `-0.02em` | `0.85` |
| Section heading (h1) | Archivo Black | `32px–48px` | `-0.02em` | `1` |
| Subheading / card title | Archivo Black | `20px–28px` | `-0.01em` | `1.1` |
| CTA button | Archivo Black | `16px–22px` | `0.04em` | `1` |
| Stat number | Archivo Black | `56px` | `-0.04em` | `0.9` |
| Body copy | Space Grotesk 500–600 | `13px–14px` | `0.01em` | `1.45–1.6` |
| Eyebrow / badge | JetBrains Mono | `10px–11px` | `0.22em–0.24em` | — |
| Nav links | Space Grotesk 600 | `11px` | `0.18em` | — |

---

## Borders & Structure

- **Card border**: `3px solid #0d0d10` — used on cream cards (hero, stats, modals)
- **Inner border**: `2px solid #0d0d10` — secondary cards, bordered buttons
- **No border-radius** anywhere. All corners are sharp.
- **Gap between grid cells**: `8px` everywhere.

---

## Components

### Page wrapper

All simulator pages that need the full-height layout should use a `<main>` with `background: #fefaf0` and `min-height: calc(100dvh - 48px)` (48px = nav).

Pages with a scrollable content area use a top `<header>` section + `<div class="content-area">` body, both on a cream background.

### Page header

```tsx
<header style={{ background: "#fefaf0", borderBottom: "3px solid #0d0d10", padding: "24px 32px" }}>
  {/* Eyebrow */}
  <div style={{ fontFamily: "var(--font-jetbrains-mono)", fontSize: "10px", letterSpacing: "0.24em", color: "#0d0d10", opacity: 0.55, marginBottom: "8px" }}>
    PHASE · 01  {/* or whatever label */}
  </div>

  {/* Title */}
  <h1 style={{ fontFamily: "var(--font-archivo-black)", fontSize: "48px", lineHeight: 1, letterSpacing: "-0.02em", color: "#0d0d10" }}>
    GROUP STAGE
  </h1>
</header>
```

### Status pill

Small inline badge for phase/state feedback.

```tsx
<div style={{
  display: "inline-flex", alignItems: "center", gap: "6px",
  fontFamily: "var(--font-jetbrains-mono)", fontSize: "11px", letterSpacing: "0.14em",
  padding: "5px 10px", border: "1px solid #0d0d10", background: "#fefaf0", color: "#0d0d10",
}}>
  <span style={{ color: "#00853F", fontSize: "12px", lineHeight: 1 }}>●</span>
  GROUP STAGE ACTIVE
</div>
```

For warning/destructive: swap the dot colour to `#D52B1E`.

### Accent label (eyebrow / section label)

```tsx
<div style={{
  fontFamily: "var(--font-jetbrains-mono)", fontSize: "10px",
  letterSpacing: "0.24em", color: "#0d0d10", opacity: 0.55,
}}>
  BY THE NUMBERS
</div>
```

### Buttons

**Primary (black + red shadow)**
```tsx
<button style={{
  background: "#0d0d10", color: "#fff",
  fontFamily: "var(--font-archivo-black)", fontSize: "16px", letterSpacing: "0.04em",
  border: "none", padding: "14px 24px", cursor: "pointer",
  boxShadow: "6px 6px 0 0 #D52B1E",
}}>
  SIMULATE DAY
</button>
```

**Secondary (white + ink border)**
```tsx
<button style={{
  background: "#fff", color: "#0d0d10",
  fontFamily: "var(--font-archivo-black)", fontSize: "14px", letterSpacing: "0.04em",
  border: "2px solid #0d0d10", padding: "12px 20px", cursor: "pointer",
}}>
  VIEW RESULTS
</button>
```

**Danger (red label + red shadow)**
```tsx
<button style={{
  background: "#fff", color: "#D52B1E",
  fontFamily: "var(--font-archivo-black)", fontSize: "14px", letterSpacing: "0.04em",
  border: "2px solid #0d0d10", padding: "12px 20px", cursor: "pointer",
  boxShadow: "4px 4px 0 0 #D52B1E",
}}>
  RESET
</button>
```

All buttons get: `transition: transform 120ms ease-out` + `hover: translateY(-2px)`.

### Stat card

```tsx
<div style={{ border: "2px solid #0d0d10", background: "#fff", padding: "10px 12px" }}>
  <div style={{ fontFamily: "var(--font-archivo-black)", fontSize: "56px", lineHeight: 0.9, letterSpacing: "-0.04em", color: "#0d0d10" }}>
    48
  </div>
  <div style={{ fontFamily: "var(--font-jetbrains-mono)", fontSize: "10px", letterSpacing: "0.22em", color: "#0d0d10", opacity: 0.55, marginTop: "4px" }}>
    NATIONS
  </div>
</div>
```

Use inside a `display: grid; grid-template-columns: 1fr 1fr; gap: 12px` container.

### Data card (group, match, team)

```tsx
<div style={{ background: "#fff", border: "2px solid #0d0d10", padding: "16px 20px" }}>
  {/* Eyebrow */}
  <div style={{ fontFamily: "var(--font-jetbrains-mono)", fontSize: "10px", letterSpacing: "0.22em", opacity: 0.5, marginBottom: "8px" }}>
    GROUP A
  </div>
  {/* Content */}
</div>
```

Cards on a cream page should use `background: #fff`. Cards on a white section may use `background: #fefaf0`.

### Red accent pill (badge / tag)

```tsx
<div style={{
  background: "#D52B1E", color: "#fff",
  fontFamily: "var(--font-archivo-black)", fontSize: "12px", letterSpacing: "0.06em",
  padding: "5px 10px",
}}>
  ROUND OF 32
</div>
```

### Section divider rule

A `6px`-tall black horizontal rule, used alongside text (e.g. the SIMULATOR lockup):

```tsx
<div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
  <div style={{ height: "6px", flex: 1, background: "#0d0d10" }} />
  <span style={{ fontFamily: "var(--font-archivo-black)", fontSize: "14px", letterSpacing: "0.22em", whiteSpace: "nowrap" }}>
    SECTION TITLE
  </span>
  <div style={{ height: "6px", flex: 1, background: "#0d0d10" }} />
</div>
```

### Coloured accent bar (left border on body copy)

```tsx
<div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
  <div style={{ width: "3px", alignSelf: "stretch", background: "#D52B1E", flexShrink: 0 }} />
  <p style={{ fontFamily: "var(--font-space-grotesk)", fontWeight: 600, fontSize: "13px", lineHeight: 1.45, color: "#0d0d10", opacity: 0.75 }}>
    Body copy here.
  </p>
</div>
```

Swap bar colour to `#006847` (green) for group stage context, `#002868` (blue) for knockout.

### Modal / dialog

```tsx
<div style={{ background: "#fff", border: "3px solid #0d0d10", boxShadow: "8px 8px 0 0 #D52B1E", padding: "24px" }}>
  <p style={{ fontFamily: "var(--font-jetbrains-mono)", fontSize: "10px", letterSpacing: "0.24em", color: "#D52B1E", marginBottom: "8px" }}>
    DESTRUCTIVE ACTION
  </p>
  <h2 style={{ fontFamily: "var(--font-archivo-black)", fontSize: "28px", lineHeight: 1.1, color: "#0d0d10" }}>
    MODAL TITLE
  </h2>
</div>
```

### Empty state / not-started gate

Replace the existing dark glassmorphism "System Offline" with:

```tsx
<main style={{ background: "#fefaf0", minHeight: "calc(100dvh - 48px)", display: "flex", alignItems: "center", justifyContent: "center" }}>
  <div style={{ border: "3px solid #0d0d10", background: "#fff", padding: "40px 48px", maxWidth: "440px", textAlign: "center", boxShadow: "8px 8px 0 0 #D52B1E" }}>
    <div style={{ fontFamily: "var(--font-jetbrains-mono)", fontSize: "10px", letterSpacing: "0.24em", color: "#D52B1E", marginBottom: "12px" }}>
      NOT STARTED
    </div>
    <h2 style={{ fontFamily: "var(--font-archivo-black)", fontSize: "32px", lineHeight: 1, letterSpacing: "-0.02em", color: "#0d0d10", marginBottom: "16px" }}>
      NO SIMULATION ACTIVE
    </h2>
    <p style={{ fontFamily: "var(--font-space-grotesk)", fontSize: "14px", lineHeight: 1.6, color: "#0d0d10", opacity: 0.6, marginBottom: "28px" }}>
      Start the tournament from the overview page.
    </p>
    {/* Primary button */}
  </div>
</main>
```

---

## Page-by-page migration guide

### Groups `/groups`

**Header**: cream bg, `3px` bottom border, eyebrow `PHASE · 01`, h1 `GROUP STAGE` in Archivo Black 48px.

**Phase status**: status pill row (active/completed/pending) using the JetBrains Mono pill pattern above.

**Stat row**: 4-column `StatCard` strip (matches simulated, total goals, avg goals/match, active groups), with ink border wrapping the whole strip.

**Simulate controls**: Primary black button `SIMULATE DAY`, secondary white button `SIMULATE ALL`. Stack them when narrow.

**Group cards**: white cards, `2px solid #0d0d10`, eyebrow `GROUP A` in JetBrains Mono. Team rows with flag, name, and standing columns in Space Grotesk. Qualified teams get a `#006847` left accent bar or green dot. Eliminated teams get `opacity: 0.4`.

**Phase completed banner**: cream card with `3px` ink border + `6px 6px` green shadow (`#006847`). Eyebrow `COMPLETED`, body copy in Space Grotesk.

---

### Bracket `/bracket`

**Accent colour for knockout**: `#002868` (USA navy).

**Header**: eyebrow `KNOCKOUT STAGE`, h1 `BRACKET` in 48px Archivo Black.

**Round labels**: JetBrains Mono 10px eyebrows above each column (`ROUND OF 32`, `ROUND OF 16`, etc.).

**Match cards**: white cards `2px solid #0d0d10`. Team name in Space Grotesk 600, score in Archivo Black 20px. Winner row: ink background `#0d0d10`, white text. Pending match: cream `#fefaf0` bg, dimmed text `opacity: 0.5`.

**Connector lines**: keep existing SVG connectors; change stroke to `#0d0d10` at `opacity: 0.3`.

**Champion block**: cream card with `3px` ink border + `8px 8px #D52B1E` hard shadow. Eyebrow `CHAMPION` in red. Winner name in Archivo Black 40px.

---

### Matches `/matches`

**Header**: eyebrow `MATCH LOG`, h1 `MATCHES`.

**Filter row**: white cards with `2px solid #0d0d10` for each filter/tab (All, Group Stage, Knockout). Active tab: `background: #0d0d10; color: #fff`. JetBrains Mono 11px labels.

**Match row**: full-width row card, `1px solid #0d0d10` bottom divider. Home team left, score centre (Archivo Black 20px), away team right. Completed: score visible. Pending: score replaced by `VS` in JetBrains Mono, opacity 0.4.

**Round group header**: full-width `background: #0d0d10` strip, white text, JetBrains Mono 10px `MATCHDAY 1 · GROUP STAGE`.

---

### Stats `/stats`

**Header**: eyebrow `ANALYTICS`, h1 `STATISTICS`.

**Top scorer card**: white card `2px solid #0d0d10`. Rank number in Archivo Black 40px, name in Space Grotesk 600 18px, goals badge in red pill.

**Confederation breakdown**: use the section divider rule pattern. Bars: `height: 8px; background: #0d0d10` for value, `background: #e5e5e5` for track. No border-radius.

**Distribution table**: zebra rows alternating `#fff` / `#fefaf0`, ink border around the whole table.

---

### Teams `/teams` and `/teams/[code]`

**Teams list**: 3–4 column grid of team cards. Each card: white bg `2px solid #0d0d10`, flag top, country name in Archivo Black 18px, confederation eyebrow in JetBrains Mono 10px, group badge (red pill `GROUP A`).

**Team detail `/teams/[code]`**: large flag on left (rotated 4–6deg, `4px solid #fff`, shadow), name as Archivo Black display type on right. Stats column in `StatCard` pattern. Match history table in standard card with divider rows.

---

## Patterns to retire

When migrating each page, replace these old patterns:

| Old | New |
|---|---|
| `bg-navy-panel`, `bg-navy` | `background: #fefaf0` or `background: #fff` |
| `border-glass-border` | `border: 1px solid #0d0d10` or `2px solid #0d0d10` |
| `backdrop-blur-md` | Remove entirely (no frosted glass) |
| `font-outfit` | `fontFamily: var(--font-archivo-black)` for headings |
| `text-white`, `text-white/60` | `color: #0d0d10` or `color: #0d0d10; opacity: 0.55` |
| `text-wc-red` accent colors | `color: #D52B1E` |
| `text-success-bright` / `text-danger-bright` | `color: #00853F` / `color: #D52B1E` |
| Rounded corners (`rounded-*`) | Remove (sharp corners only) |
| Gradient overlays | Remove |
| Dark glassmorphism empty states | Use ink-bordered cream card with hard shadow |

---

## Checklist per page

- [ ] Page background is `#fefaf0` (not navy)
- [ ] Nav is already correct — no changes needed
- [ ] Headings use Archivo Black
- [ ] Eyebrows / labels use JetBrains Mono 10px, `letter-spacing: 0.24em`
- [ ] Body copy uses Space Grotesk
- [ ] All borders are solid ink, no radius
- [ ] CTAs follow button patterns above
- [ ] Empty state uses ink-bordered cream card
- [ ] No `backdrop-blur`, `glass`, or navy tokens remain
- [ ] `npm run lint && npm run typecheck` passes
