# Handoff: Voyager Editorial Redesign

## Overview

This bundle contains a design direction for Voyager titled **"Field Notes."** It shifts the app from a utilitarian "task app in a travel costume" toward an editorial / travel-journal aesthetic, while keeping every existing feature intact.

The redesign is **not a product rewrite**. No new features, no removed features, no schema changes, no API changes. Everything lives inside `client/`.

Screens mocked:
- **Dashboard** (maps to current `Dashboard.tsx`)
- **Inspire** (maps to `Inspire.tsx` / `/inspire`)
- **Trip Planner** (maps to `TripPlanner.tsx` / `/planner/:id`)
- **The Atlas** (editorial rename for `PastJourneys.tsx` — **do not rename the route or feature in production**; keep it `Past Journeys`)

## About the Design Files

The HTML prototype in this bundle is a **design reference**, not production code.

Voyager's real codebase uses:
- React + TypeScript + Vite (client)
- Tailwind CSS v4 with CSS variables
- shadcn/ui (New York style) on Radix UI
- Wouter for routing
- TanStack React Query

The task is to **recreate these HTML designs in the existing React/Tailwind/shadcn codebase** using the established patterns. Do not port the raw HTML. Translate the tokens, primitives, and layouts into the real stack.

## Fidelity

**High fidelity.** Colors, type scale, spacing, and layouts are final-quality. Treat hex values and type sizes as pixel-targets.

## Recommended rollout

This is the low-risk path. Each step is independently revertable via `git revert`.

### PR 1 — Tokens only (~1 day)
Update CSS variables, Tailwind theme, and font imports. Every page inherits the new look automatically. No component changes.

Files touched:
- `client/src/index.css` (CSS custom properties)
- `client/tailwind.config.*` (theme extension)
- `client/index.html` (Google Fonts `<link>`)

### PR 2 — Typography primitives (~half day)
Add unused primitives nobody imports yet.
- `<Masthead>` — page header with rule, eyebrow, serif title
- `<Eyebrow>` — `font-mono` caps lockup
- `<DropCap>` — first-letter ornament for longform intros
- `<Kicker>` — small-caps section label
- `<EditorialCard>` — image-first card with numbered eyebrow

### PR 3+ — Migrate one page at a time
Dashboard → Inspire → Past Journeys → Trip Planner (most complex, last). Each PR is self-contained.

### PR N — Copy pass (optional)
Swap utilitarian labels for editorial voice ("Marco's morning dispatch" vs. "AI Assistant"). String-by-string, trivial revert.

---

## Design Tokens

Drop these into `client/src/index.css` at `:root`. Dark mode and the two aesthetic variants can live as `.aesthetic-minimal` and `.aesthetic-bold` class scopes (or map them into shadcn's existing `.light` / `.dark` if preferred).

### Colors

| Token | Value | Purpose |
|---|---|---|
| `--bg` | `#f5f1e8` | Page background (warm cream) |
| `--bg-raised` | `#fbf8f1` | Cards, modals |
| `--ink` | `#1f2722` | Primary text, primary button fill |
| `--ink-soft` | `#4a5249` | Secondary text |
| `--ink-muted` | `#7a8079` | Tertiary text, eyebrows |
| `--rule` | `#d9d2c0` | Dividers, borders |
| `--rule-soft` | `#e8e2d1` | Subtle dividers |
| `--forest` | `#2d4a3e` | Brand green (avatars, accents) |
| `--forest-deep` | `#1c3128` | Button hover |
| `--clay` | `#b86a48` | **Default accent** (links, pins) |
| `--golden` | `#c89442` | Accent swap |
| `--sky` | `#4a6b7a` | Accent swap |
| `--rose` | `#c4856b` | Accent swap |
| `--sand` | `#e8dcc0` | Chip backgrounds, sliders |
| `--cream` | `#faf6eb` | Text on dark ink |
| `--accent` | `var(--clay)` | Active accent (swappable) |

### Aesthetic variants

```css
.aesthetic-minimal {  /* Calm — lighter, greener accent */
  --bg: #f7f4ec;
  --bg-raised: #ffffff;
  --ink: #262b27;
  --accent: #6b7a5f;
}

.aesthetic-bold {  /* Expedition dark */
  --bg: #0f1511;
  --bg-raised: #181f1a;
  --ink: #efe8d4;
  --ink-soft: #c2bda9;
  --ink-muted: #8a8777;
  --rule: #2a3029;
  --rule-soft: #22281f;
  --forest: #78a37e;
  --cream: #1b221d;
  --sand: #2a2b24;
}
```

### Typography

**Font families:**
- Serif: `Fraunces` (Google Fonts, variable, opsz 9..144, weights 300–900) — display
- Sans: `Inter` (weights 300–700) — body/UI
- Mono: `JetBrains Mono` (weights 400/500) — eyebrows, metadata

**Note:** Voyager today loads **Playfair Display**. Fraunces is the upgrade target — it's a variable serif with better optical sizing and more character at display sizes. Keep Playfair as fallback in the stack.

```css
--serif: 'Fraunces', 'Playfair Display', Georgia, serif;
--sans: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
--mono: 'JetBrains Mono', ui-monospace, monospace;
```

**Google Fonts import:**
```html
<link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300..900;1,9..144,400;1,9..144,600&family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
```

**Scale:**

| Role | Family | Size | Weight | Tracking | Case |
|---|---|---|---|---|---|
| Display (masthead) | serif | 56–88px | 500 | -0.03em | — |
| H1 | serif | 44px | 500 | -0.02em | — |
| H2 | serif | 32px | 500 | -0.02em | — |
| H3 | serif | 22px | 500 | -0.02em | — |
| Body | sans | 15px | 400 | — | — |
| Body-lg (intro) | serif | 19px | 400 (italic opt.) | -0.01em | — |
| UI / button | sans | 13px | 500 | — | — |
| Eyebrow | sans | 10.5px | 500 | 0.2em | UPPER |
| Kicker | mono | 10.5px | 400 | 0.22em | UPPER |
| Metadata | mono | 11px | 400 | 0.02em | UPPER |
| Serif small-caps | serif | 14px | 500 italic | — | — |

**Defaults:**
```css
body { font-family: var(--sans); line-height: 1.5; -webkit-font-smoothing: antialiased; }
h1,h2,h3,h4 { font-family: var(--serif); font-weight: 500; letter-spacing: -0.02em; line-height: 1.05; }
```

### Spacing, radius, misc

- Base grid: 4px
- Card radius: `14px` (was likely smaller in current shadcn defaults)
- Button radius: `999px` (fully pill — a key editorial cue)
- Chip radius: `999px`
- Shadows: use sparingly. `0 1px 2px rgba(0,0,0,0.06)` for small lifts; no heavy drop shadows.
- Dividers: 1px `var(--rule)`, or `1px dashed var(--rule)` for editorial flavor
- Sidebar width: 240px fixed
- Main canvas: max-width 1280px, generous gutters (64–96px)

### Density tweak
A `--density` multiplier scales vertical padding globally. Default `1`, compact `0.78`, relaxed `1.18`. Apply as `padding-block: calc(var(--base-pad) * var(--density))`.

---

## Primitives

### `<Masthead>`
Top of every main page. Structure:

```
[eyebrow text]   ....................   [meta right]
[Serif Display Title — 56px, italic optional]
[optional dek: serif 19px italic, 1-2 lines, muted]
[1px rule, full width]
```

### `<Eyebrow>`
`font-family: var(--sans); font-size: 10.5px; font-weight: 500; letter-spacing: 0.2em; text-transform: uppercase; color: var(--ink-muted);`

### `<Kicker>`
`font-family: var(--mono); font-size: 10.5px; letter-spacing: 0.22em; text-transform: uppercase; color: var(--ink-muted);`

### `<DropCap>`
First letter of a paragraph: serif, 72px, `float: left`, line-height 0.85, margin-right 8px, padding-top 6px, color `var(--ink)`. Used on Trip Planner day chapters and Inspire lead stories.

### `<Button variant="ink">`
Pill, `var(--ink)` fill, `var(--cream)` text, `13px/500`, padding `10px 18px`. Hover → `var(--forest-deep)`.

### `<Button variant="ghost">`
Pill, transparent, 1px `var(--rule)` border, `var(--ink)` text. Hover → `var(--sand)` fill.

### `<Chip>`
Pill, `var(--sand)` fill, `var(--ink-soft)` text, `11.5px/500` mono-adjacent. Variants: `accent` (transparent, 1px `currentColor`, accent tint), `outline`.

### `<EditorialCard>`
Image-first card used in Inspire grid and Dashboard related list.
- Image top, 3:4 or 4:5 ratio
- Numbered eyebrow ("№ 03 · Culture")
- Serif title 22px
- 2-line dek (sans, ink-soft)
- Hover: image scales 1.02 over 400ms ease-out

---

## Screens

### Dashboard

**Layout:** Fixed sidebar (240px) + main canvas (flex, max-width 1280px).

**Sidebar (top to bottom):**
- Brand mark: serif italic "Voyager" 26px with accent `em` flourish, mono subtitle "FIELD NOTES · EST. 2025"
- Nav: Dashboard · Inspire · Planner · The Atlas · Journal — each row has a sans label and a mono day-count ("01", "14", "27"). Active = ink fill, cream text.
- Sidebar foot: avatar + name + "Member since 2024"

**Main canvas:**
1. **Masthead** — eyebrow "TODAY · [date]" / meta "ISSUE 47", serif title "Good morning, [name]"
2. **Hero journey card** — 16:9 image full bleed, overlay with kicker "IN PLANNING", serif 32px trip title, chip row (dates · destinations · budget), right side: "Open in Planner →"
3. **Marco's morning dispatch** — two-column block. Left: circular Marco avatar + name serif italic + time. Right: 19px serif italic body, 2–3 sentences, ends with 2 chip suggestions the user can tap.
4. **The Atlas strip** — 4 stat tiles: "COUNTRIES · 14", "NIGHTS · 203", "MILES · 48K", "PHOTOS · 1,247". Mono labels, serif numbers, 1px rules between.
5. **Related stories** — 3-up EditorialCard grid titled "From your library" (past trips).

### Inspire

**Layout:** Same shell. Main canvas:

1. **Masthead** — eyebrow "ISSUE 47 · INSPIRE", serif title "Dream a voyage"
2. **Triptych** — asymmetric 3-up:
   - Left (spans 2 cols vertically): **Lead story.** Full-bleed image + drop-cap intro (`serif 19px` body, `<DropCap>` on first letter), serif 36px title, "Read the dispatch →" link.
   - Top-right: **Editor's pick** card (EditorialCard, smaller)
   - Bottom-right: **Serendipity engine** — a card with kicker "FEELING LUCKY", serif 22px prompt ("Somewhere between Tbilisi and dawn."), a big pill button "Roll the dice".
3. **Curated grid** — 3 columns × N rows of EditorialCard. Each card: image, "№ NN · Category", serif title, country in italic, 2-line dek, budget chip + season chip.
4. **Filters rail (right, sticky)** — 200px. Kicker "FILTER". Sections: Category, Budget, Season, Mood (radio/checkbox lists, 13px sans, hand-tickable).

### Trip Planner

**Layout:** Sidebar + main. Main is 1fr (no right rail at page level — rails live per-day).

1. **Masthead** — eyebrow "JOURNEY №14 · 14 DAYS", serif title "Balkans in Autumn", dek italic "Belgrade → Sarajevo → the Adriatic"
2. **Ribbon** — 14 dotted-line segments, each with day number (mono 10px) + city initial. Active day highlighted with accent underline. Scroll to reveal full days.
3. **Day chapter** (repeating block — one per day):
   - 3 columns (`grid-template-columns: 240px 1fr 320px`):
     - **Left (timeline):** vertical dashed line, 3–5 time markers ("07:00", "11:30", "19:00") each with a kicker label ("DEPARTURE", "LUNCH", "SUNSET").
     - **Center (prose):** kicker "DAY 03 · BELGRADE", serif 32px title "A morning at Savamala", first paragraph with `<DropCap>`. 2–3 paragraphs of 15px sans. Inline chips for logistics (train time, neighborhood).
     - **Right (map rail):** 320px sticky map with accent pins, captions in mono 10.5px below.
4. **Chapter break** — dashed rule + ornament (small serif "※"). Between every day.

### The Atlas (Past Journeys)

> **Name only.** Route stays `/past-journeys`. Product label stays "Past Journeys". "The Atlas" is purely an editorial title shown *in* the masthead.

1. **Masthead** — eyebrow "LIFETIME · 2018 — TODAY", serif title "The Atlas"
2. **Stats band** — 6 tiles: Countries, Continents, Nights, Miles, Photos, Meals. Mono labels + serif numbers.
3. **Dotted world-plot** — full-width SVG world map, trips as accent dots with trip-name mono labels on hover. CartoDB tiles not required; static SVG is acceptable.
4. **Archive grid** — 4-col grid of past trip cards. Each: small square image, year (mono), country (italic serif), 1-line description.

---

## Interactions

- Nav active state: ink fill + cream text. Transition 150ms ease.
- Card hover: image `transform: scale(1.02)` 400ms ease-out, small lift shadow.
- Button hover: background color transition 150ms.
- Drop-cap: no interaction — purely ornamental.
- Ribbon day-click on Planner: smooth-scroll the main column to that day's chapter. Do **not** use `scrollIntoView`; use `window.scrollTo({top, behavior: 'smooth'})`.

No heavy animations. Everything under 400ms. Keep it calm.

---

## State management

The redesign introduces no new state. All data comes from existing queries:
- `useQuery(['/api/journeys'])`
- `useQuery(['/api/past-trips'])`
- `useQuery(['/api/auth/user'])`
- Existing Marco chat hooks on Dashboard

Optional additions:
- `UserContext.aesthetic: 'editorial' | 'minimal' | 'bold'` — persisted to user preferences. Maps to the three CSS scopes above.
- `UserContext.accent: 'clay' | 'golden' | 'sky' | 'rose'` — writes `--accent` on `:root` via useEffect.

---

## Assets

All image assets already exist in `client/src/assets/`:
`albania.png, belgrade-cafe.png, hero-travel.png, kotor.png, kyoto.png, patagonia.png, plovdiv.png, rila-hike.png, serbian-food.png, transylvania.png, tuscany.png`

No new assets required.

---

## Files in this bundle

- `Voyager Redesign.html` — the HTML prototype, runnable. Open in a browser to see every screen with Tweaks (aesthetic / density / accent swap).
- `src/app.jsx`, `src/Dashboard.jsx`, `src/Inspire.jsx`, `src/Planner.jsx`, `src/Past.jsx`, `src/shared.jsx` — the React components used by the prototype (JSX, non-TS, inline Babel). Treat as reference implementations of layout and composition — not production code.
- `assets/` — same image set as `client/src/assets/` for local preview.

## What NOT to do

- ❌ Don't rename the `past-journeys` route or feature. "The Atlas" is display copy only.
- ❌ Don't swap the auth flow. Replit Auth stays.
- ❌ Don't drop shadcn/ui. Extend it — override the theme tokens and restyle the specific primitives you need.
- ❌ Don't migrate all pages in one PR. One page at a time, tokens first.
- ❌ Don't port the raw HTML/JSX from this bundle. Rewrite in TS using existing patterns.

## What to do

- ✅ Start with PR 1 (tokens + fonts) and ship it on its own. Every page will feel fresher immediately.
- ✅ Add Fraunces alongside Playfair; don't remove Playfair until every display heading is visually verified.
- ✅ Keep the ink/cream/forest/clay palette — it's the soul of the direction.
- ✅ When in doubt, prefer whitespace over ornament.
