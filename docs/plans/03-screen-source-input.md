# Plan: 03 — Screen: Source Input

## Overview

Replace the `/source` placeholder with the full Source Input screen. Three-zone
layout: sidebar with project list, center main with source picker (tabs, URL
field, time pills, repo metadata, commit list), right panel with brand/format/
voice + Generate CTA.

**Reference files**:
- `docs/design/hack/project/Source Input.html` — canonical CSS for sidebar,
  main, right panel, all sub-components
- `docs/design/hack/project/source-input.jsx` — React structure, sample data
  arrays (PROJECTS, COMMITS, AUTHORS), state hooks
- `docs/design/hack/project/source-icons.jsx` — GitHub/Linear/PDF/etc icons

This screen is fully **mock data** — no backend wiring. The Generate button
just `console.log`s.

## Validation Commands
- `pnpm lint`
- `pnpm check-types`
- `pnpm -F web build`

## Notes for the agent

- Screen uses `ScreenShell` (built in plan 01) which provides Header + 3-col grid.
- `apps/web/src/app/source/page.tsx` is a server component. Client interactions
  (tab switching, pill selection, format toggle) live in nested client
  components under `apps/web/src/app/source/_components/`.
- Use `lucide-react` for icons: `Github`, `Linear` (does not exist — use a
  simple custom SVG matching `IconLinear` from source-icons.jsx),
  `FileText`, `Settings`, `Eye`, `Pencil`, `Play`, `ChevronRight`,
  `ArrowRight`, `Plus`, `Check`, `ChevronDown`.
- Copy sample data arrays (PROJECTS, COMMITS, AUTHORS) verbatim from
  `source-input.jsx` into a constants file
  `apps/web/src/app/source/_data.ts`. Convert to TypeScript types as you
  paste — define `Project`, `Commit`, `Author` interfaces.

### Task 1: Sidebar with project list

- [ ] Create `_components/project-list.tsx` (client component, manages active
  state via prop or local).
- [ ] At top: a magenta "+ New project" button — full width, 36px height,
  bg magenta, text white, rounded-md, hover bg #ED2F86.
- [ ] Below: mono uppercase 10px label "RECENT PROJECTS", margin 24px top, 8px bottom.
- [ ] Project list rows (gap 2px). Each row:
  - Container: flex items-center gap-2.5, padding 8px, rounded-md, min-h 52px,
    cursor pointer.
  - Hover bg `rgba(255,255,255,0.025)`.
  - Active variant: bg `var(--color-elev-2)` AND a magenta 2px vertical bar
    at left -16px (use `::before` via inline className with `before:` Tailwind
    arbitrary or just a separate `<div>` positioned absolute).
  - Thumb: 40×24 div with rounded-[3px] border, containing an inline
    `<svg>` deterministic abstract pattern (port the `Thumb({ i })` function
    from `source-input.jsx` lines 14–35 verbatim).
  - Meta: project name (mono 13px text-[var(--color-text)], ellipsis) +
    sub row with source icon + mono time (text-dim).
- [ ] Bottom of sidebar: top border + a "Settings" row with gear icon,
  text-muted, hover text + bg.
- [ ] In `app/source/page.tsx`, render `<AppSidebar><ProjectList /></AppSidebar>`.
- [ ] Mark complete.

### Task 2: Main column header + tabs + URL row

- [ ] In `_components/source-main.tsx` (client):
  - `<h1>` "New project" — 20px font-semibold tracking-[-0.01em].
  - `<p>` "Pick a source. We'll handle the rest." — 13px text-muted.
- [ ] Tabs row (mt-6, border-bottom var(--color-border), flex gap-8):
  - Three tab buttons: GitHub (active), Linear, PDF.
  - Each: padding 10px 0, text-muted by default, hover text-[var(--color-text)].
  - Active tab text-[var(--color-text)] AND a magenta 2px underline
    positioned at bottom -1px.
  - State: `useState("github")`.
- [ ] URL row (mt-5, flex items-center gap-3):
  - URL input: flex-1 h-11 bg elev-1 border var(--color-border) rounded
    flex items-center px-3.5. Inside: a small icon (GitHub for github tab,
    etc.) + transparent input mono 13px. Default value
    "github.com/acme/webhook-retry".
  - Connection pill: flex-0 inline-flex items-center gap-1.5 px-3 h-11
    text-muted text-[11px]. Green dot (6×6) with 3px green ring.
    "Connected as @maxim" (the @maxim is mono text-[var(--color-text)]).
- [ ] Mark complete.

### Task 3: Time pills + repo metadata card

- [ ] Pills row (mt-3, flex gap-1):
  - Four buttons: "Last 7 days", "Last 30 days", "Last 90 days", "Custom range".
  - Each: h-[30px] px-3 border var(--color-border) rounded text-muted
    text-[12.5px], hover border-strong + text.
  - Active: text-magenta, bg `var(--color-magenta-bg)`, border
    `rgba(229,38,124,0.35)`. State `useState("30")`.
- [ ] Metadata card (mt-6, bg elev-1 border rounded-md p-4 grid grid-cols-4 gap-4):
  - Cell template: mono 11px uppercase tracking-[0.06em] text-muted label
    + 14px font-medium value (with optional inline icon).
  - Cells:
    1. "REPO" → `[github icon] acme/webhook-retry` (mono)
    2. "COMMITS IN RANGE" → `47` (mono)
    3. "LANGUAGES" → two chips with colored dots:
       TypeScript (#3178C6), Go (#00ADD8). Chip = mono 11px
       bg white/[.025] border var(--color-border) px-2 py-0.5 rounded.
    4. "LAST ACTIVITY" → `2h ago` (mono)
- [ ] Mark complete.

### Task 4: Filter strip + commit list

- [ ] Filter row (mt-6, flex items-center justify-between, padding-bottom 8px):
  - Left text: 13px text-muted, "Showing N user-facing changes from 47 commits"
    where N is magenta+font-semibold and equals
    `COMMITS.filter(c => c.uf).length`.
  - Right "Show all 47" button: 12.5px text-muted, eye icon left, hover
    text + bg elev-1.
- [ ] Commits container: top border `rgba(255,255,255,0.06)`.
- [ ] Each commit row: grid `grid-cols-[16px_80px_1fr_auto] gap-4
  items-center h-14 px-3 border-b border-white/[.06]`:
  - uf-dot: 8×8 rounded-full magenta with 3px magenta ring (or
    transparent + dim border for non-user-facing rows).
  - sha: mono 12px text-muted.
  - msg: 13px ellipsis. Has a mono scope prefix (text-muted, 12.5px) +
    rest of message (text). E.g., `feat(cli):` (muted) ` add ship_with_retry…`.
  - author: flex gap-2 with avatar (20×20 round, gradient bg from AUTHORS
    map, 9px font-semibold initials), name (text-muted 12px), `· time` (mono
    11px text-dim).
- [ ] Non-user-facing (`uf: false`) rows have opacity 0.4 and no hover bg.
- [ ] One row in the COMMITS data array has `hovered: true` — render that
  with bg elev-1 to demonstrate hover state.
- [ ] Mark complete.

### Task 5: Right panel — Brand, Format, Voice, CTA

- [ ] In `_components/source-right.tsx` (client):
- [ ] Wrap in `RightPanel`. Right panel has gap-3 between cards.
- [ ] **Brand card**: bg elev-1 border rounded-md p-3.5 flex column gap-2.
  - Title row: "Brand" (text 13px font-medium) + a small pencil ghost icon
    button on the right.
  - "Acme Engineering" — text-[var(--color-text)] 14px font-semibold mt-1.
  - 3 chips row: "Technical", "Direct", "Engineering humor" — chip = 11px
    bg white/[.03] border var(--color-border) px-2 py-0.5 rounded.
  - Bottom meta: small green check icon + "5 example pieces uploaded"
    (text-muted 12px).
- [ ] **Format card**: same shell.
  - Title: "Format".
  - Two `fmt-opt` buttons (vertical 9:16 and horizontal 16:9), full-width
    grid: thumbnail preview, label + sub, radio circle on right.
  - Selected variant: border becomes magenta + magenta-bg overlay.
  - Vertical preview: small 16×28 rectangle. Horizontal: 28×16 rectangle.
    Both rounded-sm border var(--color-border) bg elev-2.
  - State: `useState<"vertical"|"horizontal">("horizontal")`.
- [ ] **Voice card**:
  - Title: "Voice".
  - Voice row: flex items-center gap-2 — `Waveform` SVG (port from
    `source-input.jsx` lines 72–89), "Your cloned voice" text 13px,
    play button (small circular bg elev-2, hover bg magenta).
  - "4 voices available" + chevron-right — text-muted 12px in flex justify-between.
- [ ] **CTA**: padding-top 16px, top border.
  - Big magenta button: full width h-11, bg magenta hover #ED2F86,
    "Generate video" + arrow-right icon.
  - Sub-text: 11.5px text-muted "Estimated 45–60s · ~$0.04 in tokens".
  - onClick handler: `console.log("generate", { format, range, tab })`.
- [ ] Mark complete.

### Task 6: Wire screen page

- [ ] In `apps/web/src/app/source/page.tsx`:
  - Use `ScreenShell sidebar={<ProjectList />} right={<SourceRight />}>
    <SourceMain /></ScreenShell>`.
- [ ] Mark complete.

### Task 7: Validate + Playwright self-test

- [ ] `pnpm lint && pnpm check-types && pnpm -F web build` — green.
- [ ] Start dev server, navigate to `/source`.
- [ ] `browser_snapshot` and confirm:
  - Sidebar contains "+ New project" and at least 6 project names from PROJECTS
  - Main has "New project" h1 and a "GitHub" tab marked active
  - "Showing 6 user-facing changes from 47 commits" is rendered
  - Right panel has "Acme Engineering" and "Generate video" CTA
- [ ] `browser_click` on the "Linear" tab — confirm it becomes active
  (snapshot or screenshot).
- [ ] `browser_console_messages` level=error → zero errors.
- [ ] `browser_take_screenshot` to `.screenshots/03-source-input.png`.
- [ ] Kill dev server.
- [ ] Mark complete.
