# Plan: 01 — Design System Foundation

## Overview

Implement the design system from `docs/design/hack/` as the foundation for all four
screens (Brand Setup, Source Input, Agent Thinking, Result). The output is a
shared visual system (colors, typography, layout shell, common components) plus
empty route stubs for each screen. The screens themselves are built in plans
02–05.

**Reference files** (read these top-to-bottom before starting):
- `docs/design/hack/README.md` — how the bundle is intended to be consumed
- `docs/design/hack/chats/chat1.md` — designer intent and decision history
- `docs/design/hack/project/tokens.css` — color palette and typography tokens
- All four `docs/design/hack/project/*.html` files — the canonical visual reference;
  every layout rule lives in their inline `<style>` blocks

The design is a fixed 1440px width prototype. We replicate that fidelity exactly:
each screen uses a `mx-auto w-[1440px]` container. Do not introduce responsive
breakpoints — the design is desktop-only for the hackathon.

## Validation Commands
- `pnpm lint`
- `pnpm check-types`
- `pnpm -F web build`

## Notes for the agent
- Tailwind 4 uses CSS-first config. Tokens go into `apps/web/src/index.css`
  inside an `@theme` block — they become utility classes automatically.
- shadcn components (Button, Card, Input, Label, Slider, etc.) live in
  `packages/ui/src/components/`. Add new ones with `pnpm dlx shadcn@latest add <name>`.
  Always check the shadcn MCP (`mcp__shadcn__search_items_in_registries`) before
  hand-rolling.
- The existing `/ai` page (Gemini chat) stays as a dev-only smoke test. Do not
  remove it. Move its nav link out of the main header into a separate dev menu
  or just unlink it from `Header`.
- Tab indentation, double quotes, kebab-case file names.

### Task 1: Wire Inter + JetBrains Mono fonts

- [ ] Replace the Geist fonts in `apps/web/src/app/layout.tsx` with Inter (sans)
  and JetBrains Mono. Use `next/font/google` for both. Inter weights 400/500/600/700,
  JetBrains Mono weights 400/500/600. Expose them as CSS variables
  `--font-sans` and `--font-mono`.
- [ ] Apply `font-sans` to `<body>` and add `font-feature-settings:
  'cv02','cv03','cv04','cv11'` (matches design's antialiasing setup).
- [ ] Mark complete.

### Task 2: Port design tokens into Tailwind 4 theme

- [ ] Open `apps/web/src/index.css`. After the existing `@import "tailwindcss"`,
  add an `@theme` block that defines the color tokens from
  `docs/design/hack/project/tokens.css`:
  - `--color-bg: #0A0A0B`
  - `--color-elev-1: #111113`
  - `--color-elev-2: #16161A`
  - `--color-border: rgba(255,255,255,0.08)`
  - `--color-border-soft: rgba(255,255,255,0.06)`
  - `--color-border-strong: rgba(255,255,255,0.14)`
  - `--color-text: #ECECEE`
  - `--color-text-muted: #8A8A93`
  - `--color-text-dim: #5C5C66`
  - `--color-magenta: #E5267C`
  - `--color-magenta-soft: rgba(229,38,124,0.14)`
  - `--color-magenta-bg: rgba(229,38,124,0.08)`
  - `--color-green: #2D6A4F`
  - `--color-amber: #8B6B1F`
  - `--color-red: #7A2E2E`
  - `--font-mono: var(--font-mono), ui-monospace, monospace`
  - `--font-sans: var(--font-sans), -apple-system, BlinkMacSystemFont, sans-serif`
- [ ] Set `body { background: var(--color-bg); color: var(--color-text); }`
  in the same file (override the default light theme).
- [ ] Override the existing shadcn dark/light theme variables in `index.css`
  so the app is permanently dark — set `--background: var(--color-bg)`,
  `--foreground: var(--color-text)`, `--border: var(--color-border)`,
  `--ring: var(--color-magenta)`, and friends. Use the same approach for
  `:root` (and remove or override the `.dark` block if needed). Check
  `apps/web/src/index.css` for what shadcn shipped.
- [ ] In `apps/web/src/app/layout.tsx` ensure `<html className="dark">` so
  shadcn's `dark:` variants resolve correctly.
- [ ] Mark complete.

### Task 3: Build the top header

- [ ] Replace the existing `apps/web/src/components/header.tsx` with a new
  component that matches the design's `.top-header` (height 56px, bottom
  border, padding 0 24px, flex space-between).
- [ ] Left side: wordmark "Content Factory" with a magenta period.
  `<span className="text-[14px] font-medium tracking-[-0.01em]">Content Factory<span className="text-[var(--color-magenta)]">.</span></span>`.
- [ ] Right side, in order:
  - `WorkspaceSwitcher` button — shows a 14×14 rounded mark with letter "A",
    the text "Acme Co", and a chevron-down icon. Border 1px var(--border),
    padding 6px 10px 6px 12px, rounded-6, hover bg elev-1.
  - Avatar — 28×28 circle with gradient
    `linear-gradient(135deg,#2E1F2A,#3A2533)`, initials "MP" in pale pink.
- [ ] Remove the old `Home / AI Chat` nav links from the header. The
  multi-screen nav is rebuilt later in plan 03 as a sidebar.
- [ ] The `ModeToggle` component is no longer rendered (we are dark-only).
  Delete the import from header.tsx but leave the file in place.
- [ ] Mark complete.

### Task 4: Add an `OnboardingStrip` shared component

- [ ] Create `apps/web/src/components/onboarding-strip.tsx` matching the design's
  `.onb-strip` (32px height, bg `#0E0E11`, border-bottom var(--color-border),
  flex space-between, padding 0 24px, mono 12px text muted).
- [ ] Props: `step: string` (e.g., "Step 1 of 1"), `label: string`
  (e.g., "Set up your brand"), optional `onSkip?: () => void` and
  `skipLabel?: string` (default "Skip for now").
- [ ] The skip button is plain text muted, hover text + bg elev-1.
- [ ] Mark complete.

### Task 5: Add `Sidebar` and `RightPanel` shell components

These are used by Source Input (plan 03) and Result (plan 05). Build them now
as flexible shells that accept children; the screens fill them with content.

- [ ] Create `apps/web/src/components/app-sidebar.tsx`:
  - Width 240px, border-right var(--color-border), padding 16px,
    flex column, min-height calc(1024px - 56px).
  - Renders `children` directly so screens drop in their own contents
    (project list, search, etc.).
- [ ] Create `apps/web/src/components/right-panel.tsx`:
  - Width 320px, border-left var(--color-border), padding 16px,
    flex column.
  - Renders `children`.
- [ ] Create `apps/web/src/components/screen-shell.tsx`:
  - Composes header + a `grid grid-cols-[240px_1fr_320px] flex-1` layout.
  - Props: `sidebar: ReactNode`, `right: ReactNode`, `children: ReactNode`
    (main column).
  - Outer container: `mx-auto w-[1440px] min-h-[1024px] flex flex-col`.
- [ ] Mark complete.

### Task 6: Stub the four screen routes

- [ ] Create the following Next.js App Router pages, each rendering a single
  centered `<h1>` placeholder with the screen name (we fill them in later plans):
  - `apps/web/src/app/brand-setup/page.tsx` — placeholder "Brand Setup"
  - `apps/web/src/app/source/page.tsx` — placeholder "Source Input"
  - `apps/web/src/app/thinking/page.tsx` — placeholder "Agent Thinking"
  - `apps/web/src/app/result/page.tsx` — placeholder "Result"
- [ ] Each page is a server component (no `"use client"`) and uses the new
  `ScreenShell` for the two sidebar-bearing routes (`/source`, `/result`),
  or just the header + onboarding strip + content for `/brand-setup`,
  or just header + content for `/thinking`.
- [ ] Mark complete.

### Task 7: Replace landing page with a dev pages index

- [ ] Rewrite `apps/web/src/app/page.tsx` so it renders the standard header
  followed by a centered card listing four big links — "Brand Setup",
  "Source Input", "Agent Thinking", "Result", "AI Chat (dev)" — each linking
  to the corresponding route. Use shadcn `Card` and `Link` from `next/link`.
  This is a dev convenience until the real flow is wired.
- [ ] Mark complete.

### Task 8: Validate + Playwright self-test

- [ ] Run `pnpm lint`, `pnpm check-types`, `pnpm -F web build` — all green.
- [ ] Start `pnpm -F web dev` in background, wait for "Ready".
- [ ] With Playwright MCP, navigate to each of the five routes
  (`/`, `/brand-setup`, `/source`, `/thinking`, `/result`). For each:
  - `browser_snapshot` — confirm the header wordmark "Content Factory."
    is present and the page-specific placeholder/title is rendered.
  - `browser_console_messages` level error — confirm zero errors.
- [ ] Take a screenshot of `/` saved to `.screenshots/01-pages-index.png`.
- [ ] Kill dev server (`pkill -f 'next dev' || true`).
- [ ] Mark complete.
