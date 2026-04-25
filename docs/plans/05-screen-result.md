# Plan: 05 — Screen: Result

## Overview

Replace the `/result` placeholder with the Result screen — what the user sees
when a video is finished. Uses the same shell as `/source` (sidebar with
project list + active pin, right panel). Main column has a hero player with
first-frame typography and corner glow, action row, 4-cell metadata grid.
Right panel recaps all 8 agent decisions plus quick-regenerate chips and a
voice picker.

**Reference files**:
- `docs/design/hack/project/Result.html` — canonical CSS for player, glow,
  controls, action row, metadata grid, right panel decisions/voices
- `docs/design/hack/project/result.jsx` — component structure, DECISIONS recap,
  VOICES array
- `docs/design/hack/project/result-icons.jsx` — additional icons used here

The sidebar reuses the `ProjectList` component built in plan 03. Same active
project (`webhook-retry-launch-week`).

## Validation Commands
- `pnpm lint`
- `pnpm check-types`
- `pnpm -F web build`

## Notes for the agent

- Reuse `ProjectList` from plan 03 — pull it out of `app/source/_components/`
  into `apps/web/src/components/project-list.tsx` if not already moved.
- Crumb row uses an "All projects" back button — link to `/source`.
- The video player is a static visual — no real `<video>` element. Just shows
  the first frame text + a play button. Real playback is wired later.
- DECISIONS array here is different from the Agent Thinking screen — it's a
  flat list of `{ name, result }` (8 items). Copy verbatim from
  `result.jsx` lines 37–46.

### Task 1: Page shell + sidebar reuse

- [ ] If `ProjectList` lives at `apps/web/src/app/source/_components/`, move it
  to `apps/web/src/components/project-list.tsx` so both pages can import it.
  Update plan-03 imports accordingly.
- [ ] In `apps/web/src/app/result/page.tsx` (server component possible —
  delegate state-bearing parts to client subcomponents):
  - `<ScreenShell sidebar={<ProjectList />} right={<ResultRight />}>
    <ResultMain /></ScreenShell>`
- [ ] Mark complete.

### Task 2: Main column — crumb row

- [ ] In `_components/result-main.tsx`:
- [ ] Crumb row: flex justify-between items-center, padding-bottom 12px,
  border-bottom var(--color-border).
- [ ] Left: "All projects" button (back arrow + text, ghost) +
  `/` separator + project name "webhook-retry-launch-week" +
  status pill: small green dot (6×6, 3px ring) + "Generated 12s ago" text-muted 12px.
- [ ] Right: text-muted 12.5px "Generated in **47s** · **4,892** tokens · **$0.06**"
  with bold values text-[var(--color-text)].
- [ ] Mark complete.

### Task 3: Hero video player

- [ ] Player wrap (mt-6 flex column gap-3):
- [ ] Player shell: relative max-w-[860px], aspect-[16/9].
  - Glow: absolute -inset-12 z-0, gradient
    `radial-gradient(closest-side at 30% 30%, rgba(229,38,124,0.16),
    transparent 70%)`, blur-3xl, pointer-events-none.
  - Player: relative z-10, full size, bg `#0E0E11`, border var(--color-border),
    rounded-md, overflow-hidden.
  - First-frame text (centered-left, padding 48px): two `<div>`s,
    line-height 1.1, font-size 56px, font-weight 700, tracking-[-0.02em]:
    - Line 1: "Most retry libraries" — text-[var(--color-text)]
    - Line 2: "make you write 40 lines." — text-[var(--color-magenta)]
  - Play button (centered absolute, w-16 h-16 rounded-full bg-white/[.06]
    backdrop-blur border var(--color-border) flex items-center justify-center,
    hover bg white/[.10]). Big play icon inside.
- [ ] Player controls (h-11 flex items-center gap-3 px-3 bg elev-1 border
  var(--color-border) rounded-md):
  - Timecode: mono 12px, "0:00 / 0:47" — first segment magenta.
  - Scrub track: flex-1 relative h-1.5 rounded-full bg white/[.08]. Inside:
    fill 0% wide (we're at 0:00), magenta thumb 12×12 at left edge.
  - Right icon group: 4 ghost icon buttons (Volume, CC, Fullscreen, More).
- [ ] Mark complete.

### Task 4: Actions row + metadata grid

- [ ] Actions row (mt-5 flex items-center gap-3):
  - Primary "Download MP4" button — bg magenta, white text, rounded-md, h-9
    px-4, with download icon. Hover bg #ED2F86.
  - Ghost "Copy share link" button — bg transparent border var(--color-border),
    hover bg elev-1.
  - Ghost "Regenerate" button — same style + chevron-down icon hinting at
    a dropdown (no menu wired yet).
- [ ] Metadata grid (mt-6 grid grid-cols-4 gap-4 bg elev-1 border rounded-md
  p-4):
  - Cell template: mono uppercase 11px tracking-[0.06em] text-muted label
    + 14px font-medium value (with optional inline icon).
  - Cells:
    1. Duration → mono "0:47"
    2. Resolution → mono "1920×1080"
    3. Voice → speaker icon + "Your cloned voice"
    4. Format → small ratio rectangle (16×9 px or 16:9 visual cue) +
       "16:9 horizontal"
- [ ] Mark complete.

### Task 5: Right panel — decisions recap

- [ ] In `_components/result-right.tsx`:
- [ ] Wrap in `RightPanel`, padding inside.
- [ ] Section h2 "What the agent decided" — 13px font-medium.
- [ ] Decisions list `flex flex-col` with each row hover bg elev-1.
- [ ] Each item: grid `grid-cols-[6px_1fr_12px] gap-3 items-start py-2.5`:
  - 6×6 magenta dot (top-aligned, mt-1.5).
  - Text block: name mono 12px text-[var(--color-text)], result 12px
    text-muted leading-snug.
  - Chevron-right icon text-dim, ghost button (clickable open hint).
- [ ] Render all 8 items from DECISIONS array.
- [ ] Mark complete.

### Task 6: Quick regenerate + voice picker

- [ ] Section label: "QUICK REGENERATE" mono uppercase 10.5px tracking-[0.08em]
  text-muted, mt-5.
- [ ] Three chip buttons: "Try a different hook", "Try a different tone",
  "Try different scene order". Each: refresh icon + text, full-width left-aligned,
  bg transparent border var(--color-border) rounded-md h-9 px-3 text-[13px],
  hover bg elev-1.
- [ ] Section label: "VOICE" same style, mt-5.
- [ ] Voice list: flex col gap-1.5.
- [ ] Each voice card: flex items-center gap-2 p-2 border var(--color-border)
  rounded-md cursor-pointer hover bg elev-1:
  - `MiniWave` SVG (port from `result.jsx` lines 59–76, accepts bars array
    and renders inline rects).
  - Voice name 13px, flex-1.
  - Play icon button (small, ghost).
- [ ] Selected voice variant: border becomes magenta + magenta-bg overlay.
- [ ] State: `useState("cloned")`. Click on a card sets selected, click on
  play button stops propagation.
- [ ] Render all 4 voices from VOICES array.
- [ ] Mark complete.

### Task 7: Validate + Playwright self-test

- [ ] `pnpm lint && pnpm check-types && pnpm -F web build` — green.
- [ ] Start dev server, navigate to `/result`.
- [ ] `browser_snapshot` and confirm:
  - Crumb has "webhook-retry-launch-week" and "Generated 12s ago"
  - Hero player shows "Most retry libraries" + "make you write 40 lines."
  - Action row has "Download MP4" button
  - Metadata grid has "Duration", "Resolution", "Voice", "Format" labels
  - Right panel has "What the agent decided" + all 8 decision names
  - "QUICK REGENERATE" section + 3 chip buttons
  - "VOICE" section with 4 voices, "Your cloned voice" appears selected
- [ ] `browser_click` on a different voice (e.g., "Formal narrator") and
  snapshot — confirm selected state moved.
- [ ] `browser_console_messages` level=error → zero errors.
- [ ] `browser_take_screenshot` to `.screenshots/05-result.png`.
- [ ] Kill dev server.
- [ ] Mark complete.
