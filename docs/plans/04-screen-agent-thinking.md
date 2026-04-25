# Plan: 04 — Screen: Agent Thinking

## Overview

Replace the `/thinking` placeholder with the Agent Thinking screen — the live
"agent at work" view shown while a video is being generated. Two-column
layout: agent reasoning cards on the left, live preview frame + scene timeline
on the right. Header has live progress bar; footer has live counters.

**Reference files**:
- `docs/design/hack/project/Agent Thinking.html` — canonical CSS for header,
  cards, preview frame, scene strip, footer
- `docs/design/hack/project/app.jsx` — DECISIONS array, useStreamingText hook,
  StatusDot, DecisionCard, live counters

This is the most visually animated screen — streaming text typewriter, pulsing
status dots, animated header progress, scene-strip with "next" indicator.

## Validation Commands
- `pnpm lint`
- `pnpm check-types`
- `pnpm -F web build`

## Notes for the agent

- Entire screen is a client component (lots of state and animation).
- Animations are CSS-driven where possible (pulse, shimmer). Streaming text
  is the only one that needs `useEffect` + `setTimeout`.
- This screen does NOT use `ScreenShell` — it has its own bespoke header and
  no left sidebar. Layout: `mx-auto w-[1440px] min-h-[1024px] flex flex-col`,
  with custom header, body grid, footer.
- Copy DECISIONS array verbatim from `app.jsx` lines 7–77 into
  `apps/web/src/app/thinking/_data.ts` with TypeScript types.

### Task 1: Custom header with live progress

- [ ] In `apps/web/src/app/thinking/page.tsx` (client component):
- [ ] Render a header that REPLACES the standard `Header` component:
  - Container: 56px height, border-bottom var(--color-border), padding 0 24px,
    flex items-center, three columns via grid `grid-cols-[1fr_1fr_1fr]`.
  - Left section: back button (chevron-left, ghost icon), `/` separator,
    "Videos", `/` separator, mono "webhook-retry-launch-week".
  - Center section: title row with red live-pulsing dot + "Generating video"
    text, then a progress track 200px wide × 4px tall, bg white/[.06],
    rounded. Inside: magenta fill width based on `progress` state.
  - Right section: mono `~{eta}s remaining` + ghost "Cancel" button.
- [ ] State: `progress`, `eta` (init 38, 45). `useEffect` setInterval 1s:
  `eta = max(28, eta - 1)`, `progress = min(62, progress + 0.4)`.
- [ ] Mark complete.

### Task 2: Body grid + agent reasoning column

- [ ] Below header, a body grid `grid grid-cols-[1fr_500px] gap-6 px-8 py-6
  flex-1` (left flex, right fixed 500px).
- [ ] Left column header:
  - `<h2>` "Agent reasoning" + a small mono `count` badge "{done}/{total}"
    (e.g., "5/8").
- [ ] Cards container `flex flex-col gap-2`.
- [ ] Implement `_components/decision-card.tsx`:
  - Card: bg elev-1 border var(--color-border) rounded-md p-4 flex column gap-2.
  - In-progress variant: border becomes magenta-soft and bg has subtle
    magenta-bg overlay.
  - Pending variant: opacity 0.5.
  - Card top: status dot (8×8 round, color depends on state — done=green,
    in-progress=magenta with pulse animation, pending=text-dim outline) +
    mono 12.5px `decision-name` + (when not pending) timestamp text-dim
    11px on the right.
  - Body paragraph 13px line-height 1.5.
  - Optional `chips`: array of `{k, v}` rendered as bg white/[.04] border
    var(--color-border) px-2 py-0.5 rounded mono 11px. `<strong>k</strong>` is
    text-[var(--color-text)], `v` is text-muted.
  - Optional `features`: same chip but mono 11px monospace, single string.
  - For the script card (id="script"): below body, render a `script-stream`
    div containing the streaming text + a magenta blinking caret.
- [ ] Render all 8 decisions from DECISIONS array.
- [ ] Mark complete.

### Task 3: Streaming text hook

- [ ] Create `apps/web/src/app/thinking/_hooks/use-streaming-text.ts`:
  ```ts
  export function useStreamingText(full: string, opts?: {
    charDelay?: number;
    startDelay?: number;
  }): { text: string; done: boolean }
  ```
- [ ] Port the React hook verbatim from `app.jsx` lines 89–110. Use
  TypeScript types. Whitespace runs slightly faster, regular chars get
  small jitter.
- [ ] Hard-code the SCRIPT_LINES array (same as `app.jsx` lines 6–11):
  three lines about retry libraries, joined by `\n`.
- [ ] In the page, call `useStreamingText(FULL_SCRIPT, { charDelay: 32,
  startDelay: 600 })` and pass `text` and `done` into the script
  DecisionCard.
- [ ] Mark complete.

### Task 4: Right column — live preview frame + scene timeline

- [ ] Right column has two sections separated by gap-6.
- [ ] **Live preview**:
  - `<h2>` "Live preview".
  - Preview frame: aspect-[9/16] max-h-[480px] mx-auto bg elev-1 border
    var(--color-border) rounded-md relative overflow-hidden.
  - Inside: a subtle shimmer overlay (linear-gradient sweeping across with
    1.6s infinite animation) and a centered empty state — film icon + text
    "Preview will appear when scenes start rendering" (text-muted 13px).
  - Below frame: meta row with three text-muted 12px items separated by
    middle-dots: "Will be 9:16 vertical · ~45 seconds · with cloned voice".
- [ ] **Scene timeline**:
  - Title row: "Scene timeline" 13px font-medium + mono `0/6 rendered` text-dim
    11px on right.
  - Strip: `grid grid-cols-6 gap-2`. Each scene cell: bg elev-1 border
    var(--color-border) rounded-md aspect-[16/9] flex items-end p-2.
    Cell label: mono 10.5px text-dim "Scene N".
  - Scene 1 has `next` variant: border becomes magenta with magenta-bg overlay,
    plus a small magenta dot in top-right (4×4 with 3px ring).
- [ ] Mark complete.

### Task 5: Footer with live counters

- [ ] Footer: full-width 48px height, border-top var(--color-border),
  padding 0 24px, flex items-center justify-between.
- [ ] Left: text 13px text-muted "Brand:" + text-[var(--color-text)] font-medium
  "Acme Engineering" + small pencil ghost icon.
- [ ] Right: mono 12px text-muted with three items separated by gap-6:
  "Time elapsed: **{elapsed}s**", "Tokens used: **{tokens.toLocaleString()}**",
  "Cost: **${cost.toFixed(2)}**".
- [ ] State: `elapsed=17`, `tokens=3402`, `cost=0.04`. Same setInterval that
  drives header progress also bumps these per second:
  - `elapsed += 1`
  - `tokens += 8 + Math.random()*22` floored
  - `cost += 0.0008 + Math.random()*0.0006`
- [ ] Mark complete.

### Task 6: CSS animations and helpers

- [ ] In `apps/web/src/index.css` (or a new `_components/styles.css` imported
  by the page), define:
  - `@keyframes magenta-pulse` (the same as design's `pulse` keyframes)
  - `@keyframes shimmer` (translateX -100% → 100% over 1.6s, used by preview
    shimmer overlay)
  - `@keyframes caret-blink` (opacity 1 → 0 → 1 over 1s)
- [ ] Apply via Tailwind's `animate-[magenta-pulse_1.6s_ease-out_infinite]`
  arbitrary values, or via small className helpers.
- [ ] Mark complete.

### Task 7: Validate + Playwright self-test

- [ ] `pnpm lint && pnpm check-types && pnpm -F web build` — green.
- [ ] Start dev server, navigate to `/thinking`.
- [ ] `browser_snapshot` and confirm:
  - "Generating video" text in header
  - "Agent reasoning" left column heading with "{n}/8" count
  - All 8 decision names rendered (`extract_user_facing_changes`,
    `fetch_market_context`, `select_features`, `write_hook`,
    `write_voiceover_script`, `generate_scene_visuals`, `synthesize_voiceover`,
    `compose_final_video`)
  - "Live preview" with empty-state text
  - Scene timeline with 6 scenes, Scene 1 marked next
  - Footer with "Brand:", "Acme Engineering", and the three live counters
- [ ] Wait 2 seconds (`browser_wait_for time=2`) and take a snapshot to
  confirm the streaming text in the script card is visibly progressing
  (text length > 10 chars).
- [ ] `browser_console_messages` level=error → zero errors.
- [ ] `browser_take_screenshot` to `.screenshots/04-agent-thinking.png`.
- [ ] Kill dev server.
- [ ] Mark complete.
