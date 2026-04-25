# 2026-04-26 — Hackathon MVP: end-to-end video from GitHub repo

## Overview

Single source-of-truth plan for the hackathon submission. Build the four screens from the
`docs/design/hack/` HTML/JSX specs, wire a one-shot backend pipeline (GitHub → Tavily → Gemini script
→ Remotion render → Gradium voiceover), and ship a polished demo that reads a public GitHub repo URL
and returns a 30–60s vertical MP4 with on-brand voiceover. Plans 03–05 are discarded; this plan owns
the surface and the wiring.

## Context

Files involved:
- `apps/web/src/index.css` (currently only imports tailwind + ui globals — tokens NOT yet added)
- `apps/web/src/app/layout.tsx` (Inter + JetBrains Mono fonts already wired — leave alone)
- `apps/web/src/app/page.tsx` (still Better-T ASCII placeholder)
- `apps/web/src/components/header.tsx` (still placeholder Home/AI Chat nav — replace)
- `apps/web/src/lib/` (does not exist — create with `brand-profile.ts`)
- `apps/web/src/app/{brand-setup,source,thinking,result}/page.tsx` (none exist yet — create all four)
- `apps/server/src/index.ts` (Hono + AI SDK `/ai` only — restructure under `/api/v1`)
- `packages/composer/src/{Root.tsx,index.ts,render.ts}` (only `hello-world` registered — add `script-video`)
- `packages/env/src/server.ts` (GEMINI/TAVILY/GRADIUM/HERA/PIONEER keys already declared + required)
- `docs/design/hack/project/{tokens.css, Brand Setup.html, brand-setup.jsx, Source Input.html, source-input.jsx, Agent Thinking.html, app.jsx, Result.html, result.jsx, icons.jsx, source-icons.jsx, result-icons.jsx}` (canonical design specs — read top-to-bottom before each screen)

Related patterns:
- Tailwind 4 CSS-first: tokens go in `apps/web/src/index.css` inside `@theme` block
- Hono + AI SDK already integrated; only add new route modules under `/api/v1/*`
- Remotion programmatic render via `renderVideo(opts)` already exported
- Brand profile persisted client-side in `localStorage` keyed `cf:brandProfile`
- shadcn components (Button, Card, Input, Label) already in `@content-factory/ui`; add Slider/Textarea/Badge via `pnpm dlx shadcn@latest add <name>` only if needed
- Design is fixed-width 1440px desktop — `mx-auto w-[1440px]` containers, no responsive breakpoints

Dependencies (no new top-level deps):
- AI SDK v6 (`ai`, `@ai-sdk/google`), Zod 4, Remotion 4, Hono 4 — already present
- GitHub REST API (no auth for public repos), Tavily REST `https://api.tavily.com/search`, Gradium TTS REST
- Aikido scan via web UI / `@aikidosec/mcp` CLI (one-shot, dev-only)
- Entire CLI hooks already capturing sessions

## Development Approach

- **Testing approach**: Regular — code first, then Playwright self-tests for UI + curl smokes for backend. No Vitest unit tests for hackathon scope; deadline is tomorrow morning.
- Complete each task fully before moving to the next.
- After every task: `pnpm lint && pnpm check-types`. After source-touching tasks: `pnpm -F web build` and/or `pnpm -F server build`.
- Use Playwright MCP to verify any `apps/web` change against the live dev server (`http://localhost:3001`). Save evidence screenshots to `.screenshots/`.
- No new ports, no new top-level deps, no auth. Disabled paths show "coming soon" — they don't error.
- Match design HTML/JSX exactly: dimensions, colors, mono labels, magenta accents. Do not screenshot to copy — read source.
- If Gemini/Tavily/Gradium are flaky, pipeline reports `failed` to SSE, UI shows retry. No silent hangs.

## Implementation Steps

### Task 1: Design tokens + permanent-dark theme

**Files:**
- Modify: `apps/web/src/index.css`

- [x] After existing `@import "@content-factory/ui/globals.css"` add `@theme inline { ... }` block exposing the tokens from `docs/design/hack/project/tokens.css` as Tailwind 4 design tokens: `--color-bg`, `--color-elev-1`, `--color-elev-2`, `--color-border`, `--color-border-soft`, `--color-border-strong`, `--color-text`, `--color-text-muted`, `--color-text-dim`, `--color-magenta`, `--color-magenta-soft`, `--color-magenta-bg`, `--color-green`, `--color-amber`, `--color-red`. Map `--color-background → --color-bg`, `--color-foreground → --color-text`, `--color-ring → --color-magenta`.
- [x] Override shadcn theme variables in `:root` and `.dark` so the app is permanently dark — set `--background`, `--foreground`, `--border`, `--ring`, `--card`, `--card-foreground`, `--input`, `--popover`, `--popover-foreground`, `--muted`, `--muted-foreground` to the design tokens.
- [x] Add a `body { background: var(--color-bg); color: var(--color-text); }` rule.
- [x] Add a utility class `.mono { font-family: var(--font-mono); }` for mono labels matching the design.
- [x] Verify: `pnpm -F web dev`, navigate `/`, screenshot to `.screenshots/01-tokens.png`, confirm bg is `#0A0A0B` and `body` text is light. `pnpm lint && pnpm check-types && pnpm -F web build` green.

### Task 2: Header + ScreenShell + OnboardingStrip components

**Files:**
- Modify: `apps/web/src/components/header.tsx`
- Create: `apps/web/src/components/onboarding-strip.tsx`
- Create: `apps/web/src/components/screen-shell.tsx`

- [x] `header.tsx`: replace placeholder with design `.top-header` (height 56px, border-b `var(--color-border)`, padding `0 24px`, flex space-between). Left: wordmark `Content Factory` with magenta period (`<span className="text-[14px] font-medium tracking-[-0.01em]">Content Factory<span className="text-[var(--color-magenta)]">.</span></span>`). Right: a `WorkspaceSwitcher`-style button (14×14 mark with letter "A", "Acme Co" label, chevron) and a 28×28 avatar circle with gradient `linear-gradient(135deg,#2E1F2A,#3A2533)` showing initials "MP". No nav links. Drop `ModeToggle` import.
- [x] `onboarding-strip.tsx`: matches design `.onb-strip` — height 32px, bg `#0E0E11`, border-b var(--color-border), flex space-between, padding `0 24px`, mono 12px text-muted. Props: `step: string`, `label: string`, `onSkip?: () => void`, `skipLabel?: string` (default "Skip for now"). Skip button is plain text muted, hover text + bg elev-1.
- [x] `screen-shell.tsx`: outer `mx-auto w-[1440px] min-h-[1024px] flex flex-col`. Renders the `Header`, then optional `topStrip` (e.g. OnboardingStrip), then either a single-column `children` (default) or three-column `grid grid-cols-[240px_1fr_320px] flex-1` when `sidebar` and `right` props are provided. Props: `sidebar?: ReactNode`, `right?: ReactNode`, `topStrip?: ReactNode`, `children: ReactNode`.
- [x] `pnpm lint && pnpm check-types && pnpm -F web build` green.

### Task 3: Brand profile lib + landing page rewrite

**Files:**
- Create: `apps/web/src/lib/brand-profile.ts`
- Modify: `apps/web/src/app/page.tsx`

- [x] `brand-profile.ts`: export `BrandProfileSchema` (Zod) `{ name: string, description?: string, voice: string, tone: { formalCasual: number, seriousPlayful: number, directStorytelling: number }, examples?: string[], rules?: { dos: string[], donts: string[] } }`. Export `type BrandProfile = z.infer<typeof BrandProfileSchema>`. Export `loadBrandProfile(): BrandProfile | null` (reads `localStorage["cf:brandProfile"]`, validates, returns null on miss / parse failure), `saveBrandProfile(p: BrandProfile): void`, `defaultBrandProfile(): BrandProfile` (returns `{ name: "Demo Brand", voice: "casual", tone: { formalCasual: 50, seriousPlayful: 50, directStorytelling: 50 } }`). All client-side, guarded with `typeof window !== "undefined"`.
- [x] `page.tsx` (`"use client"`): replace ASCII art with the landing screen. Use `ScreenShell` (no sidebars). Center a card: h1 "Turn anything into video", paragraph copy ("Drop a GitHub repo, Linear ticket, or PDF — get a 30-60s on-brand vertical video back."), magenta primary CTA `Set up your brand` linking to `/brand-setup`, ghost secondary `Skip — use defaults` that calls `saveBrandProfile(defaultBrandProfile())` and `router.push("/source")`.
- [x] Playwright self-test: navigate `/`, assert wordmark "Content Factory." and both CTAs present; click "Skip — use defaults", assert URL becomes `/source` and `localStorage.cf:brandProfile` is set. Screenshot `.screenshots/02-landing.png`. `pnpm lint && pnpm check-types && pnpm -F web build` green.

### Task 4: /brand-setup screen

**Files:**
- Create: `apps/web/src/app/brand-setup/page.tsx`
- Create: `apps/web/src/app/brand-setup/_components/brand-form.tsx`
- Create: `apps/web/src/app/brand-setup/_components/brand-preview.tsx`

- [x] Read `docs/design/hack/project/Brand Setup.html` and `brand-setup.jsx` top-to-bottom. Match the layout: `ScreenShell` with `topStrip={<OnboardingStrip step="Step 1 of 1" label="Set up your brand" onSkip={...} />}`. Below strip a `mx-auto max-w-[1280px] grid grid-cols-[720px_360px] gap-10 px-20 py-20` layout.
- [x] `brand-form.tsx` (`"use client"`): h1 "Set up your brand", sub "We use this to keep every video on-voice." Fields: `Brand name` input, `Voice description` textarea (placeholder mirroring design), three sliders (Formal↔Casual, Serious↔Playful, Direct↔Storytelling) — each rendered with shadcn `Slider` if available, otherwise a hand-rolled track + handle matching design (`.track`, `.track-fill`, `.track-handle` magenta). Field labels are mono uppercase 11px text-muted. Bottom: magenta primary `Save brand` (240px wide, 44px tall) and ghost `Cancel`. On submit: `saveBrandProfile(...)`, `router.push("/source")`.
- [x] `brand-preview.tsx` (`"use client"`): right column sticky preview card matching design `.preview-card` — bg elev-1, border, padding 24, mono "Brand preview" label + green "live" dot, fields populated reactively from form state (lifted via `useState` in `brand-form` and passed as a child or via context — use simple sibling state via parent wrapper component if cleaner). Show name, voice description, tone chips, do/don't placeholder rules, mono pulsing magenta "Synced" footer.
- [x] Page wires both as siblings under a single `useState<BrandProfile>` parent client component.
- [x] Playwright self-test: navigate `/brand-setup`, fill name + tone, click `Save brand`, assert redirect `/source`, assert `localStorage.cf:brandProfile` matches input. Screenshot `.screenshots/03-brand-setup.png`. `pnpm lint && pnpm check-types && pnpm -F web build` green.

### Task 5: /source screen — GitHub active, Linear/PDF disabled

**Files:**
- Create: `apps/web/src/app/source/page.tsx`
- Create: `apps/web/src/app/source/_components/source-form.tsx`

- [ ] Read `docs/design/hack/project/Source Input.html` and `source-input.jsx` top-to-bottom. Use `ScreenShell` (no sidebars for now — keep simple). Centered title h1 "Drop a source" + sub "We turn it into a 30-60 second on-brand video.".
- [ ] `source-form.tsx` (`"use client"`): three cards in a `grid grid-cols-3 gap-3` row matching design — GitHub (active, magenta accent on hover/focus), Linear (`opacity-50 cursor-not-allowed`, badge "Coming soon"), PDF (same disabled treatment). Active GitHub card holds an `Input` (placeholder `https://github.com/owner/repo`) Zod-validated against regex `^https?:\/\/github\.com\/[^\/]+\/[^\/]+\/?$` (also accept `gh:owner/repo`), and a magenta `Generate video` button (44px tall).
- [ ] On submit: read brand profile via `loadBrandProfile()` (redirect `/brand-setup` if missing); `POST ${NEXT_PUBLIC_SERVER_URL}/api/v1/video-jobs` with `{ kind: "git", ref, brand }`; on `{ jobId }` `router.push(\`/thinking?jobId=\${jobId}\`)`. Inline error red text on failure. Disabled cards no-op on click.
- [ ] Playwright self-test: navigate `/source`, type a repo URL, capture `browser_network_requests` to confirm POST went out, assert URL becomes `/thinking?jobId=...`. (Backend smoke gated until Task 7; if not yet running, document and re-run after Task 7.) Screenshot `.screenshots/04-source.png`. `pnpm lint && pnpm check-types && pnpm -F web build` green.

### Task 6: @content-factory/agent package — GitHub + Tavily + Gemini script writer

**Files:**
- Create: `packages/agent/package.json`, `packages/agent/tsconfig.json`, `packages/agent/src/index.ts`, `packages/agent/src/github.ts`, `packages/agent/src/tavily.ts`, `packages/agent/src/script.ts`, `packages/agent/src/schemas.ts`
- Modify: `apps/server/package.json` (add `"@content-factory/agent": "workspace:*"`)

- [ ] Package metadata: `name @content-factory/agent`, `type: "module"`, `private: true`, `exports."."`: `"./src/index.ts"`. Deps: `@content-factory/env workspace:*`, `ai` (catalog), `@ai-sdk/google` (catalog), `zod` (catalog). Dev: `@content-factory/config workspace:*`, `typescript` (catalog). Add `check-types: tsc --noEmit`. tsconfig extends `@content-factory/config/tsconfig.base.json`.
- [ ] `schemas.ts`: `RepoSnapshotSchema { owner, name, description, primaryLanguage, topics: [], stars, readme: string, recentCommits: [{ message, date }] }`, `MarketContextSchema { topic, results: array(8) of { title, url, snippet, score? } }`, `BrandProfileSchema` (mirror web shape), `VideoScriptSchema { hook, scenes: array(4..8) of { text, bullets?, durationSec: 2..8 }, closingCta }`. Export inferred TS types.
- [ ] `github.ts`: `parseRepoUrl(input)` (handles `https://github.com/o/r[/]` and `gh:o/r`); `fetchRepoSnapshot(input)` calls `GET https://api.github.com/repos/:o/:r`, `GET .../readme` (decode base64 from `content`), `GET .../commits?per_page=20`. Sets `User-Agent: content-factory-agent`. Truncates README to 12k chars. Validates against `RepoSnapshotSchema`.
- [ ] `tavily.ts`: `fetchMarketContext({ topic })` → POST `https://api.tavily.com/search` body `{ api_key: env.TAVILY_API_KEY, query: topic, max_results: 5, search_depth: "basic", include_answer: false }`. Maps response to `MarketContextSchema` (`result.title`/`url`/`content`→`snippet`/`score`). 6s `AbortController` timeout. On any failure log a single `console.warn` and return `{ topic, results: [] }`. Never throws.
- [ ] `script.ts`: `writeScriptFromRepo({ snapshot, brand, market })` uses `generateObject` from `ai` with model `google("gemini-2.5-flash")` and `schema: VideoScriptSchema`. System prompt encodes brand voice (interpolate tone sliders to adjectives). User prompt summarizes snapshot AND market bullets ("Competitors / similar projects in the wild: …") so script names a unique angle. If `market.results.length === 0`, omit market section silently. Require `sum(scenes.durationSec)` between 30 and 60 (re-prompt up to 1 retry if violated). On schema violation re-throw — server wraps in `failed` status.
- [ ] `index.ts` re-exports `parseRepoUrl`, `fetchRepoSnapshot`, `fetchMarketContext`, `writeScriptFromRepo`, all schemas, all types.
- [ ] `pnpm install` from repo root; `pnpm -F @content-factory/agent check-types` green.

### Task 7: Backend video-jobs route + SSE + Gradium voiceover + /api/v1 restructure

**Files:**
- Create: `apps/server/src/routes/video-jobs.ts`, `apps/server/src/routes/health.ts`, `apps/server/src/routes/ai.ts`
- Create: `apps/server/src/lib/jobs.ts`, `apps/server/src/lib/gradium.ts`
- Modify: `apps/server/src/index.ts`
- Modify: `apps/web/src/app/ai/page.tsx` (point at `/api/v1/ai`)

- [ ] `lib/jobs.ts`: `JobStatus = "pending"|"extracting"|"researching"|"scripting"|"rendering"|"voicing"|"done"|"failed"`. `Job = { id, status, progress: 0..100, message?, script?, videoPath?, audioPath?, error?, ref?, owner?, name? }`. Module-level `Map<string, Job>` plus `Map<string, Set<(j: Job) => void>>` listeners. Helpers `createJob`, `updateJob`, `subscribe(id, cb): unsubscribe`, `getJob`.
- [ ] `lib/gradium.ts`: `synthesizeVoice({ text, voiceId? })` POSTs Gradium TTS REST endpoint with `Authorization: Bearer ${env.GRADIUM_API_KEY}` (verify exact header/endpoint via Gradium docs at task time; leave a `TODO(plan):` only if docs unreachable). Default to a male/neutral Gradium voice id. Writes binary response to `path.join(os.tmpdir(), \`cf-${jobId}-voice.mp3\`)` and returns `{ audioPath }`. 60s `AbortController` timeout; on failure throw `Error("voiceover failed: " + reason)`.
- [ ] `routes/video-jobs.ts`:
  - `POST /` — Zod-validate body `{ kind: "git"|"linear"|"pdf", ref: string, brand: BrandProfile }`. Reject non-git with 400 "coming soon". Create job; respond `{ jobId }` immediately. Fire-and-forget pipeline:
    1. `extracting`/10 → `fetchRepoSnapshot(ref)` (also store `owner`, `name`)
    2. `researching`/25 → `fetchMarketContext({ topic: ... })` — never throws
    3. `scripting`/45 → `writeScriptFromRepo({ snapshot, brand, market })` (store on job)
    4. `rendering`/65 → `renderVideo({ compositionId: "script-video", inputProps: { script, brand }, outputLocation: tmpdir/cf-${jobId}.mp4, onProgress: p => updateJob({ progress: 65 + Math.round(p*25) }) })`
    5. `done`/100 with `videoPath`. On error: `updateJob({ status: "failed", error: e.message })`.
  - `GET /:id` — return current `Job` (no listeners), 404 if missing.
  - `GET /:id/events` — SSE; emit current state, push on every `subscribe` callback. Close on `done`/`failed` or client abort. `text/event-stream` headers via Hono stream helper.
  - `GET /:id/video` — stream `videoPath` as `video/mp4`. 404 if missing.
  - `POST /:id/voiceover` — idempotent: if `audioPath` set, return `{ audioUrl: \`/api/v1/video-jobs/${id}/audio\` }`. Else read job's `script` (404 if missing), build narration `[hook, ...scenes.text, closingCta].join(" ")`, await `synthesizeVoice`, set `audioPath`, return `{ audioUrl }`. Errors → 502 with `{ error }`.
  - `GET /:id/audio` — stream `audioPath` as `audio/mpeg`. 404 if missing.
- [ ] `routes/health.ts`: `GET /` → `{ ok: true, version: "0.1.0", uptime: process.uptime() }`.
- [ ] `routes/ai.ts`: move existing `/ai` POST handler verbatim.
- [ ] `index.ts`: mount `app.route("/api/v1/health", healthRoutes)`, `app.route("/api/v1/ai", aiRoutes)`, `app.route("/api/v1/video-jobs", videoJobRoutes)`. Keep CORS, logger, `serve(...)`.
- [ ] Update `apps/web/src/app/ai/page.tsx` to point at `${NEXT_PUBLIC_SERVER_URL}/api/v1/ai`.
- [ ] Smoke: `pnpm dev`; `curl -X POST http://localhost:3000/api/v1/video-jobs -H 'content-type: application/json' -d '{"kind":"git","ref":"https://github.com/honojs/hono","brand":{"name":"Demo","voice":"casual","tone":{"formalCasual":75,"seriousPlayful":60,"directStorytelling":25}}}'` → `{ jobId }`; `curl -N http://localhost:3000/api/v1/video-jobs/<id>/events` shows status progressing extracting → researching → scripting → rendering → done within ~3 min. `curl -X POST .../voiceover` returns `{ audioUrl }` and `curl -I` against it responds 200 `audio/mpeg`. `pnpm check-types` green.

### Task 8: Remotion `script-video` composition

**Files:**
- Create: `packages/composer/src/compositions/script-video.tsx`
- Modify: `packages/composer/src/Root.tsx`

- [ ] Schema: `scriptVideoSchema = z.object({ script: VideoScriptSchema, brand: z.object({ name: z.string(), tone: z.object({...}) }) })`. Export.
- [ ] Component computes per-scene frame ranges (fps 30) from `durationSec`. Renders `<Series>`: hook frame (~2.5s, big magenta gradient + h1 hook + brand wordmark), then one `<Series.Sequence>` per scene with `durationInFrames = round(durationSec*30)`, fading text + optional bullet list + magenta accent bar. Closing scene (~2s): brand wordmark + repo `owner/name` + magenta CTA "Generated by Content Factory".
- [ ] Background: `--color-bg` solid with subtle radial magenta wash. Text: `fontFamily: "Inter, system-ui, sans-serif"`. Code/snippet: `JetBrains Mono` fallback. No external font fetch.
- [ ] Register in `Root.tsx` with `id="script-video"`, `width={1080}`, `height={1920}`, `fps={30}`, `defaultProps` containing a small canned demo script (so `studio` and `selectComposition` work). Use `calculateMetadata` to derive `durationInFrames` from `inputProps`.
- [ ] Smoke: `pnpm -F @content-factory/composer studio` opens; `script-video` previews with default props (manual; do not block automation).
- [ ] `pnpm check-types` green.

### Task 9: /thinking screen — SSE-driven progress

**Files:**
- Create: `apps/web/src/app/thinking/page.tsx`
- Create: `apps/web/src/app/thinking/_components/progress-stream.tsx`

- [ ] Read `docs/design/hack/project/Agent Thinking.html` and `app.jsx` top-to-bottom.
- [ ] Page is a server component reading `?jobId=` (Next 16 dynamic search params), renders `ScreenShell` with the client `ProgressStream` mounted with that id.
- [ ] `ProgressStream` (`"use client"`): opens `new EventSource(${NEXT_PUBLIC_SERVER_URL}/api/v1/video-jobs/${jobId}/events)`. Renders six vertical pipeline rows matching design: Extracting facts, Researching context, Writing script, Rendering scenes, Synthesizing voice, Done. Map server statuses 1:1. Active step glows magenta with pulsing dot; completed green; pending muted. On `data.status === "done"` close source and `router.replace(\`/result?jobId=\${jobId}\`)`. On `failed` show error in red with `Try again` link to `/source`.
- [ ] Note: voiceover triggered from Result page (Task 10), not the SSE pipeline. "Synthesizing voice" row stays muted until result page kicks it off — keeps `done` from blocking on TTS.
- [ ] Cleanup: close `EventSource` on unmount.
- [ ] Playwright self-test: with server running, post a real job from Task 7 smoke, capture `jobId`, navigate `/thinking?jobId=<id>`, `browser_wait_for` text "Done" (timeout 240s), assert redirect to `/result?jobId=...`. Mid-progress screenshot `.screenshots/05-thinking.png`. `pnpm lint && pnpm check-types && pnpm -F web build` green.

### Task 10: /result screen — video player + Gradium voiceover + actions

**Files:**
- Create: `apps/web/src/app/result/page.tsx`
- Create: `apps/web/src/app/result/_components/video-card.tsx`
- Create: `apps/web/src/app/result/_components/voiceover-button.tsx`

- [ ] Read `docs/design/hack/project/Result.html` and `result.jsx` top-to-bottom.
- [ ] Server `page.tsx` reads `?jobId=`. `VideoCard` (`"use client"`) fetches `GET /api/v1/video-jobs/:id` once on mount. If `status !== "done"` shows muted state ("Still rendering — go back to /thinking"); otherwise renders `<video controls src={\`${NEXT_PUBLIC_SERVER_URL}/api/v1/video-jobs/${id}/video\`}/>` at `aspect-[9/16] w-[360px]` plus metadata column (brand name from `loadBrandProfile`, repo `owner/name` from job, generated-at).
- [ ] `VoiceoverButton` (`"use client"`): primary `Generate voiceover` button. On click POST `/api/v1/video-jobs/${id}/voiceover` → set local `audioUrl`. While pending: disabled + spinner + "Synthesizing with Gradium…". On success: render `<audio controls src={audioUrl} autoPlay />`. On error: inline `Voiceover failed — retry` (re-enables). No SpeechSynthesis fallback — partner-tech demo, button labelled "Powered by Gradium".
- [ ] Other buttons: `Download video` (anchor `download` attr → `/video`), `Download voiceover` (visible after audio generated), `Generate another` → `/source`.
- [ ] Playwright self-test: with completed job from Task 9, navigate `/result?jobId=<id>`, assert `<video>` element with non-empty `currentSrc`. Click `Generate voiceover`, `browser_wait_for` "Powered by Gradium" or `<audio>` with non-empty `currentSrc`. Screenshot `.screenshots/06-result.png`. Assert `browser_console_messages` zero errors. `pnpm lint && pnpm check-types && pnpm -F web build` green.

### Task 11: End-to-end smoke + screenshots

**Files:** none (Playwright + manual)

- [ ] With `pnpm dev` running (web + server), walk full flow via Playwright: `/` → `Set up your brand` → fill form → save → `/source` → submit `https://github.com/honojs/hono` → `/thinking` (watch progress) → `/result` (video plays) → click `Generate voiceover` (audio plays). Save `.screenshots/07a-thinking-final.png` and `.screenshots/07b-result-with-audio.png`.
- [ ] `browser_console_messages` snapshot — must be free of React/hydration errors across the full flow.
- [ ] If any external API fails during smoke, capture failure, fix or stub, re-run end to end before Task 12.

### Task 12: Aikido scan + README + finalize plan

**Files:**
- Modify: `README.md`, `.env.example`, `apps/web/.env.example`
- Move: `docs/plans/2026-04-26-hackathon-mvp.md` → `docs/plans/completed/`

- [ ] Diff `.env.example` against `packages/env/src/server.ts` schema; ensure `GEMINI_API_KEY`, `TAVILY_API_KEY`, `GRADIUM_API_KEY`, `HERA_API_KEY`, `PIONEER_API_KEY`, `DATABASE_URL`, `CORS_ORIGIN` are present with placeholder values + a one-line comment per key. Top comment: "Hackathon required: GEMINI_API_KEY, TAVILY_API_KEY, GRADIUM_API_KEY. Others can stay placeholder for the demo." Ensure `apps/web/.env.example` has `NEXT_PUBLIC_SERVER_URL=http://localhost:3000`.
- [ ] Run `npx -y @aikidosec/mcp scan` (or whichever CLI flag the package's `--help` advertises). If only an MCP entry point exists, fall back to Aikido web UI and download the report. Capture: pass/fail summary, count by severity, hosted report link.
- [ ] If high-severity findings introduced by us: fix and re-scan. Transitive-dep findings: note and move on.
- [ ] Update `README.md`:
  - Pitch: "Drop a GitHub repo URL → 30–60s on-brand vertical video with AI voiceover."
  - Screenshot row referencing `.screenshots/01-…` through `.screenshots/07b-…`.
  - Prereqs: Node 22/24, pnpm 10, Docker (only if using Postgres later).
  - Required env: `GEMINI_API_KEY`, `TAVILY_API_KEY`, `GRADIUM_API_KEY` (others optional for demo).
  - Run commands: `pnpm install`, copy `.env.example` → `.env`, `pnpm dev`.
  - Demo URL: `https://github.com/honojs/hono`.
  - Partner technologies: Gemini (script), Tavily (market context), Gradium (voiceover), Aikido (security scan + report link), Entire ("Every commit's AI agent session captured by Entire — `entire log` shows the recorded reasoning").
  - Add `## Security review` subsection: scan command, date, summary line ("0 high, 1 medium, 3 low — see Aikido report"), report URL.
- [ ] Final validation: `pnpm lint && pnpm check-types && pnpm build` (root) all green.
- [ ] `git mv docs/plans/2026-04-26-hackathon-mvp.md docs/plans/completed/`.

## Post-Completion (manual)

- Verify demo on a fresh clone with `GEMINI_API_KEY`, `TAVILY_API_KEY`, `GRADIUM_API_KEY` set.
- Submit hackathon entry with README screenshots, Aikido report link, and a 30s screen capture of the e2e flow.
- Confirm `entire log` shows nested AI sessions for each pipeline commit (demo asset).
