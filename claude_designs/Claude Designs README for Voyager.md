# Claude Designs

This folder holds design prototypes, mockups, and handoff packages produced by **Claude (the design one, in Projects / claude.ai)**. It is **reference material, not production code**.

If you are **Claude Code**: read this file first. It tells you how to work with everything else in here.

---

## What lives here

Each subfolder is one design initiative. A typical folder contains:

- `README.md` — the spec: overview, fidelity, screen-by-screen layout, design tokens, recommended rollout plan
- `*.html` — runnable HTML prototype (open in a browser to see it live)
- `src/*.jsx` — React+JSX component files the prototype uses (inline Babel, not TypeScript)
- `assets/` — images used by the prototype

Current subfolders:
- `design_handoff_editorial_redesign/` — the "Field Notes" editorial redesign direction (Dashboard, Inspire, Trip Planner, Past Journeys)

New ones will be dropped in over time.

---

## How to work with these designs

### 1. Read the subfolder's own `README.md` first
Every design folder has its own README with:
- **Overview** — what it's for
- **Fidelity** — hi-fi (pixel-targets are real) vs lo-fi (wireframe-ish)
- **Screens** — per-screen layout, components, typography, spacing
- **Design tokens** — colors, fonts, spacing values
- **Recommended rollout** — the PR sequence the designer suggests

### 2. Treat the HTML/JSX as reference, not code to copy
The prototypes are written in **inline-Babel JSX with plain CSS variables**. Voyager's production stack is different:

| Prototype | Production |
|---|---|
| Inline `<script type="text/babel">` | Vite + React + TypeScript |
| CSS custom properties in `<style>` | Tailwind v4 + CSS variables in `client/src/index.css` |
| Hand-rolled components | shadcn/ui (New York style) on Radix UI |
| Plain `<a>` for nav | Wouter routing |
| Mock data inline | TanStack Query against `/api/*` endpoints |

**Do not port the JSX or raw HTML directly.** Recreate each design in the real stack using Voyager's existing patterns. The prototype tells you *what to build*; the existing codebase tells you *how to build it*.

### 3. Follow the rollout plan when one exists
Design README's usually propose a staged rollout — e.g. "PR 1: tokens only, PR 2: primitives, PR 3+: one page at a time." **Follow it.** It minimizes regression risk and keeps revert-paths clean. Don't try to migrate everything in one PR.

### 4. Preserve features
Designs here are **visual / IA redesigns**, not product redesigns. Unless the README explicitly says otherwise:
- **No new features** — don't invent functionality from the mockup
- **No removed features** — every existing feature must still work
- **No schema or API changes** — everything stays in `client/`
- **No route renames** — if a design calls "Past Journeys" something poetic like "The Atlas," that's display copy only; the route stays `/past-journeys`
- **No auth changes** — Replit Auth stays

### 5. Cite the design when you PR
Commit messages and PR descriptions should reference the design folder, e.g.:

> feat(tokens): adopt editorial token set from claude_designs/design_handoff_editorial_redesign (PR 1 of rollout)

---

## When the user points you at a specific design

Expect instructions like:

> Read `claude_designs/design_handoff_editorial_redesign/README.md` and implement PR 1.

Steps:
1. Read the subfolder README end-to-end.
2. Open the HTML prototype in a browser if you can, or read the JSX components to understand layout intent.
3. Read the relevant existing Voyager files you'll be modifying (don't guess — the codebase has real patterns and shadcn primitives to reuse).
4. Propose a plan before making changes if the scope is non-trivial.
5. Make the change on a new branch (e.g. `feat/editorial-tokens`). Don't commit directly to `main`.
6. Verify the app still runs (`npm run dev`) and no existing pages broke before claiming done.

---

## When the user asks a design question

If the user asks "why does X look like that" or "what was the designer thinking about Y," the answer is probably in the subfolder README. Read it before making something up.

---

## What *not* to do

- ❌ Don't ship the HTML prototype as-is into production
- ❌ Don't copy token values into a component; put them in the Tailwind theme or `index.css` so everything inherits
- ❌ Don't skip the rollout plan to "save time" — partial migrations look worse than either end state
- ❌ Don't delete files in this folder; treat it as append-only design history
- ❌ Don't rename features or routes to match poetic design labels

---

## What *to* do

- ✅ Read the relevant subfolder README before writing code
- ✅ Match production fidelity: types, colors, spacing, radii — copy the exact values
- ✅ Reuse shadcn primitives; extend the theme, don't replace the component library
- ✅ Migrate tokens first, then primitives, then pages — one PR each
- ✅ When in doubt about intent, prefer the subfolder README over the HTML file
