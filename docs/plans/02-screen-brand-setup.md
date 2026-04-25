# Plan: 02 — Screen: Brand Setup

## Overview

Replace the `/brand-setup` placeholder with the full Brand Setup screen from the
design. Two-column layout: a form on the left (brand name, voice description,
example zones, tone sliders) and a sticky live "compiled brand profile" preview
on the right.

**Reference files** (read fully before each task that touches the relevant section):
- `docs/design/hack/project/Brand Setup.html` — canonical CSS for every
  section (form fields, zones, sliders, preview card)
- `docs/design/hack/project/brand-setup.jsx` — React structure, state, sample copy

This screen has **no backend dependency** — all data is local component state.
We wire it to the database in a later plan.

## Validation Commands
- `pnpm lint`
- `pnpm check-types`
- `pnpm -F web build`

## Notes for the agent

- This page is a client component (`"use client"`) because of state and slider
  interactions.
- Use existing shadcn `Input`, `Label` from `@content-factory/ui/components/*`.
  Add `textarea` if it's not already present:
  `pnpm dlx shadcn@latest add textarea`.
- For sliders, the design's slider is custom (3-column grid: left label, track,
  right label) with magenta thumb. Implement it as a small client component in
  `apps/web/src/app/brand-setup/_components/tone-slider.tsx` rather than reaching
  for shadcn `Slider` — the visual is too custom and hand-rolling is faster.
- Drop-zone "examples" are visual-only for now (no upload handler).
  `<input type="file" hidden>` not required. The third zone is in empty state.

### Task 1: Layout and onboarding strip

- [ ] In `apps/web/src/app/brand-setup/page.tsx`:
  - Render `Header` + `OnboardingStrip step="Step 1 of 1" label="Set up your brand"`.
  - Below that, a content container `mx-auto max-w-[1280px] px-20 pt-20 pb-24
    grid grid-cols-[720px_360px] gap-10`.
  - Left column placeholder, right column placeholder for now.
- [ ] Mark complete.

### Task 2: Brand name + voice description fields

- [ ] Convert the page's content into a small client component
  `apps/web/src/app/brand-setup/_components/brand-form.tsx`.
- [ ] At top of left column, render:
  - `<h1>` — text-[24px] font-semibold tracking-[-0.012em]: "Define your brand"
  - `<p>` — text-[14px] text-muted-foreground: "We'll use this every time we
    generate. You can edit it later."
- [ ] Below, a `flex flex-col gap-8 mt-10` containing field wrappers.
- [ ] Field 1 — Brand name:
  - Mono uppercase 11px label (text-muted, letter-spacing 0.08em): "BRAND NAME"
  - shadcn `Input` styled to height 44px, bg `var(--color-elev-1)`, border
    `var(--color-border)`, rounded-md, font 14px. On focus border becomes
    `var(--color-border-strong)` and bg `var(--color-elev-2)`.
  - Default value: `"Acme Engineering"` (state).
  - Helper text below — text-[11px] text-[var(--color-text-dim)]:
    "This is how we'll refer to your brand internally."
- [ ] Field 2 — Voice description:
  - Same label style, text "VOICE DESCRIPTION".
  - shadcn `Textarea` (or native `textarea`) — same border/bg, min-h 140px,
    padding 12px 14px, line-height 1.55, resize vertical.
  - Default value: the verbose placeholder from `brand-setup.jsx` line 50–52
    ("Technical but with humor…").
  - Helper text: "The more specific, the better. We'll learn from your tone."
- [ ] Mark complete.

### Task 3: Example zones (3 cards)

- [ ] Field 3 wrapper: label "OR PASTE EXAMPLES" + helper-top
  text-[12px] text-muted "Show us a few pieces of content that already feel
  like your brand. Optional but recommended."
- [ ] Below, `grid grid-cols-3 gap-3`.
- [ ] Zone component (`_components/example-zone.tsx`) with two variants:
  - **filled** — bg `rgba(229,38,124,0.05)`, border 1px solid
    `rgba(229,38,124,0.45)`, padding 14px, rounded-md, h-[100px], flex column
    space-between.
    Top row: small magenta icon + name (truncate) + close button.
    Bottom row: meta line, mono 11px, text-muted.
  - **empty** — transparent bg, dashed border 1px `rgba(255,255,255,0.18)`,
    centered column with upload icon, "Add landing page text" title, mono 11px
    sub "Drop file or paste text".
- [ ] Render the three zones with the data from `brand-setup.jsx` lines 110–132:
  1. filled — Twitter icon, "3 tweets uploaded", meta "@acmehq · Sept 2024"
  2. filled — Video icon, "1 existing video script", meta "launch-week-day-3.txt"
  3. empty — upload zone
- [ ] Use Lucide icons (`twitter`, `video`, `upload`, `x`) from `lucide-react`.
- [ ] Mark complete.

### Task 4: Tone sliders

- [ ] Field 4 wrapper: label "TONE" + helper-top "Three knobs that shape how we write."
- [ ] Create `_components/tone-slider.tsx`:
  - Props: `leftLabel`, `rightLabel`, `value` (0–100), `onChange?`.
  - 3-column grid `grid-cols-[90px_1fr_90px] gap-4 items-center`.
  - Left/right labels — text-[12px], text-muted by default. Active side
    (value >= 50 → right, else left) becomes text-[var(--color-text)].
  - Track — `relative h-[6px] rounded-[3px] bg-white/[.08]`. Inside:
    - fill: `absolute left-0 top-0 bottom-0 rounded-[3px] bg-[rgba(229,38,124,0.30)]`
      with `width: ${value}%`.
    - handle: `absolute top-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4
      rounded-full bg-[var(--color-magenta)]` with shadow
      `0 0 0 4px rgba(229,38,124,0.18), 0 2px 6px rgba(0,0,0,0.35)` and
      `left: ${value}%`. Cursor grab.
- [ ] Implement drag with a single mousedown/mousemove/mouseup handler. Pure
  React state. No 3rd-party slider library.
- [ ] Render 3 sliders with starting values:
  - Formal ↔ Casual = 75
  - Serious ↔ Playful = 60
  - Direct ↔ Storytelling = 25
- [ ] Mark complete.

### Task 5: Form actions row

- [ ] Below the fields stack, `mt-10 flex items-center gap-4`.
- [ ] Primary button — width 240px, height 44px, bg `var(--color-magenta)`,
  text white, rounded-md, hover bg `#ED2F86`. Label "Save brand profile".
  Use shadcn `Button` with custom className overrides.
- [ ] Ghost button — height 44px, bg transparent, border `var(--color-border)`,
  text `var(--color-text)`, padding 0 18px. Label "Skip for now".
- [ ] No real submit handler — just `console.log` on click for now.
- [ ] Mark complete.

### Task 6: Right preview card (live profile)

- [ ] In a sibling component `_components/profile-preview.tsx`:
- [ ] Sticky container `sticky top-6 self-start`.
- [ ] Card: bg `var(--color-elev-1)` border `var(--color-border)` rounded-md
  padding 24px flex column.
- [ ] Header rows:
  - "COMPILED BRAND PROFILE" — mono 11px uppercase tracking 0.08em text-muted.
  - "● Live preview" — green dot 6×6 with 3px green ring; mono 11px text-muted.
- [ ] Fields grid `flex flex-col gap-4 mt-5`. Each field has:
  - mono 11px uppercase tracking 0.06em text-muted key
  - 13px text value
- [ ] Render fields exactly as in `brand-setup.jsx` lines 162–206:
  - `name` → bound to brand-name state
  - `tone` → static "casual, slightly playful, direct"
  - `voice_traits` → 3 chips (technical, skeptical of hype, engineer humor) —
    chip = text-[11.5px] bg white/[.03] border var(--color-border) px-2 py-[3px]
    rounded-[4px]
  - `writing_rules` → 4 rules: 2 DO (green tag) + 2 DON'T (red tag).
    Tag column 36px wide, mono 10.5px font-semibold tracking 0.06em.
    DO tag color #6FBF95, DON'T tag color #C97C7C.
  - `signature_phrases` → 2 mono chips: `ship_with_retry`, `we cut ___ by 6×`
  - `example_calibration` → text-[12px] text-muted: "Calibrated from 4
    uploaded examples"
- [ ] Footer: top border, mt-5 pt-3.5, mono 11px text-muted with magenta
  pulsing dot (6×6) + "Updates as you type".
  Pulse animation: keyframes 1.6s infinite — start `box-shadow: 0 0 0 0
  rgba(229,38,124,0.55)`, 70% `0 0 0 6px rgba(229,38,124,0)`. Define keyframes
  in the component via `<style jsx>` or in `apps/web/src/index.css`.
- [ ] Hook the `name` field — pass current brand-name down so it re-renders
  live. The other fields are static for now (would be derived from voice text
  in a later plan).
- [ ] Mark complete.

### Task 7: Validate + Playwright self-test

- [ ] `pnpm lint && pnpm check-types && pnpm -F web build` — all green.
- [ ] Start dev server in background, wait for "Ready".
- [ ] Navigate to `http://localhost:3001/brand-setup`.
- [ ] `browser_snapshot` and confirm:
  - "Define your brand" h1 present
  - All 4 field labels visible: "BRAND NAME", "VOICE DESCRIPTION",
    "OR PASTE EXAMPLES", "TONE"
  - "Save brand profile" button present
  - Right side: "COMPILED BRAND PROFILE" + "Acme Engineering" name field
- [ ] `browser_console_messages` level=error → zero errors.
- [ ] Type "TestCorp" into the brand name input, then `browser_snapshot` and
  confirm the right-side preview now shows "TestCorp".
- [ ] `browser_take_screenshot` to `.screenshots/02-brand-setup.png`.
- [ ] Kill dev server.
- [ ] Mark complete.
