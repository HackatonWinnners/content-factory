# Content Factory — Project Constitution

> Read at start of every session. These are hard constraints.
> When unsure, stop and ask via the plan. Do not improvise.

## What we are building

Content Factory turns a source (GitHub repo URL, Linear ticket export, or PDF) into a
30–60 second on-brand vertical/horizontal video with AI voiceover. The user sets up
a brand profile once, then drops sources to generate videos in that brand's voice.

Pipeline:
1. Source ingest — git via Entire CLI / Linear API / PDF upload
2. Extract user-facing facts — Pioneer fine-tuned model
3. Market context — Tavily search for competitor angles, trending hooks
4. Editorial decisions + script — Gemini (selects 3–5 facts, hook, narrative)
5. Visuals — Hera API (scene generation)
6. Voiceover — Gradium TTS (with team voice cloning for demo)
7. Composition — Remotion (final cut, brand layers, sync)
8. Output — MP4 with chosen aspect ratio

## Stack — DO NOT deviate without an explicit plan task

This repo was scaffolded by Better-T-Stack. Respect the existing structure.

- Package manager: **pnpm 10** with workspaces. Never npm or yarn.
- Task runner: **Turborepo** (`pnpm dev`, `pnpm build`, `pnpm check-types`).
- Language: **TypeScript strict** everywhere. No `.js` files except configs.
- Node: **22.x or 24.x**.
- Frontend (`apps/web`): **Next.js 16 App Router** (port 3001), **React 19**,
  **Tailwind 4** (CSS-first config — see `apps/web/src/index.css`),
  shadcn/ui via `@content-factory/ui` package.
- Backend (`apps/server`): **Hono 4** on `@hono/node-server` (port 3000).
  Build via **tsdown**, dev via `tsx watch`. No Express, no NestJS.
- LLM: **AI SDK v6** with `@ai-sdk/google` (model: `gemini-2.5-flash`).
  Already wired in `apps/server/src/index.ts`. Streaming via `streamText`.
  Talk to Tavily/Hera/Gradium/Pioneer over their REST APIs.
- Validation: **Zod 4** at all external boundaries (HTTP req/resp, env, external APIs).
- DB: **Postgres 16** via `packages/db` docker-compose. ORM: **Drizzle**.
  Connection: `postgresql://postgres:password@localhost:5432/content-factory`.
- Env: **@t3-oss/env-core** (server) and **env-nextjs** (web), defined in
  `packages/env/src/{server,web}.ts`. Catalog deps from `pnpm-workspace.yaml`.
- Linter/formatter: **Biome 2.4** with **tab** indentation and **double** quotes.
  See `biome.json`. Single tool, no ESLint, no Prettier.
- Video composer: **Remotion 4** in `packages/composer/`.
  Entry `src/index.ts` calls `registerRoot(RemotionRoot)`.
  Compositions live in `src/compositions/`. Each composition exports both
  the React component and a Zod schema for its props.
  Programmatic render API: `import { renderVideo } from "@content-factory/composer"`
  (see `packages/composer/src/render.ts`). Remotion Studio: `pnpm -F @content-factory/composer studio`.
- Tests: **Vitest** for unit tests when needed. **Playwright** for E2E (later).

## External integrations — transport reference

Each third-party service has a single canonical way to talk to it from this
codebase. Do not invent a different transport; do not bolt on an MCP server
when the table says "REST".

| Service       | Transport in our code              | Notes                                                                |
| ------------- | ---------------------------------- | -------------------------------------------------------------------- |
| Google Gemini | AI SDK (`@ai-sdk/google`)          | Streaming via `streamText`. Already wired in server.                 |
| Tavily        | REST via `fetch` (no extra dep)    | Official `tavily-mcp` exists but only for agent tooling, not runtime |
| Hera          | REST via `fetch`                   | No SDK, no MCP. `x-api-key` header. See docs.hera.video               |
| Gradium       | REST via `fetch`                   | No SDK, no MCP. Voice cloning + TTS                                  |
| Pioneer       | REST via `fetch` (Fastino API)     | No SDK, no MCP. Use `PIONEER_API_KEY`                                |
| Entire        | CLI hooks (already installed)      | Captures sessions per commit. No SDK, no MCP                         |
| Aikido        | Final scan via web UI before submit| `@aikidosec/mcp` exists for dev tooling but not used at runtime      |
| Lovable       | n/a                                | Lovable was for prototyping the Better-T scaffold; not a runtime dep |

## Workspace layout

```
apps/
  web/        Next.js 16 (port 3001)
  server/    Hono (port 3000)
packages/
  config/     Shared tsconfig.base.json
  env/        T3 env loaders (server.ts, web.ts)
  db/         Drizzle schema + migrations + docker-compose.yml
  ui/         shadcn/ui components shared between web and server
  composer/   Remotion project — compositions + programmatic render API
  agent/      Editorial pipeline: Gemini calls, Tavily, Pioneer (TO ADD)
docs/
  plans/      Ralph plan files
```

## Hard rules — never break these

- ❌ Do not add LangChain, LlamaIndex, or any LLM framework. Use AI SDK directly.
- ❌ Do not add Express/NestJS/Fastify routes alongside Hono.
- ❌ Do not add Prisma. Drizzle is the ORM.
- ❌ Do not commit secrets. `.env` is gitignored. Read env only via
  `@content-factory/env/server` or `@content-factory/env/web`. Never sprinkle
  `process.env.X` through business logic.
- ❌ Do not add a top-level dependency without a task in the plan saying so.
  If you think one is needed, stop and add a task to the plan first.
- ❌ Do not add user authentication. There is no auth in MVP.
- ❌ Do not invent new ports. Web=3001, Server=3000, Postgres=5432.
- ❌ Do not change Better-T's package names (`@content-factory/*`) or the apps
  named `web` and `server`.
- ❌ Do not edit catalog versions in `pnpm-workspace.yaml` mid-task.
  If a version bump is required, add an explicit plan task.
- ❌ Do not write Tailwind config in JS. Tailwind 4 is CSS-first;
  use `@import` + `@theme` in `apps/web/src/index.css`.

## Adding shadcn components

Use the shadcn MCP server (already configured in `.mcp.json` and `.codex/config.toml`).
Components install into `@content-factory/ui`.

```
# from anywhere in the repo
pnpm dlx shadcn@latest add <component>
```

## Conventions

- File names: **kebab-case** (`brand-profile.ts`).
- Exports: named exports preferred. Default exports only for Next.js
  pages/components/layouts where the framework requires it.
- Errors: throw `Error` subclasses with descriptive names. Never throw strings.
- Async: native promises with `await`. No callbacks, no `.then()` chains.
- HTTP responses: validate with Zod before returning. JSON only.
- Logs: `console.log` with structured JSON for now. No logger library.
- Indent: **tab**. Quotes: **double**. Don't argue with Biome.

## Design system

The visual design lives in `docs/design/hack/` — a handoff bundle from
claude.ai/design containing four screens (Brand Setup, Source Input, Agent
Thinking, Result) as HTML/CSS/JS prototypes plus a shared `tokens.css`.

- `docs/design/hack/README.md` — designer's handoff instructions
- `docs/design/hack/chats/chat1.md` — designer's intent and iteration trail
- `docs/design/hack/project/tokens.css` — color palette + typography
- `docs/design/hack/project/*.html` — canonical CSS for each screen
- `docs/design/hack/project/*.jsx` — React structure + sample data

When implementing a screen, **read its HTML and JSX top-to-bottom first**.
Do not screenshot the prototypes — every dimension, color, and rule is in
the source. Match the visual output exactly; do not copy the prototype's
internal structure (window globals, inline `<script type="text/babel">`)
unless it happens to fit our React/Next.js architecture.

The design is fixed-width 1440px desktop. Use `mx-auto w-[1440px]` and do not
introduce responsive breakpoints — the hackathon target is desktop only.

## Plan execution order

Plans live in `docs/plans/`. Execute in order; each plan ends with the
validation commands green.

1. `00-foundation.md` — backend foundation (DB schema, agent package, route
   restructure). **Optional/deferrable**: design plans 01–05 do not depend
   on this. Run when backend wiring begins.
2. `01-design-system.md` — design tokens, app shell, route stubs.
3. `02-screen-brand-setup.md` — `/brand-setup` page.
4. `03-screen-source-input.md` — `/source` page.
5. `04-screen-agent-thinking.md` — `/thinking` page.
6. `05-screen-result.md` — `/result` page.

For the hackathon demo, run 01 → 02 → 03 → 04 → 05 first (the visual surface),
then 00 + later plans for backend wiring.

## Plugins and skills auto-loaded in this session

User-level plugins (enabled in `~/.claude/settings.json`) and project-level skills
(in `.agents/skills/` and `.claude/skills/` from Better-T-Stack) are loaded
automatically. Examples: `next-best-practices`, `hono`, `shadcn`, `ai-sdk`,
`turborepo`, `vercel-react-best-practices`, `frontend-design`, `superpowers:*`.

When a task touches a covered area, invoke the matching skill via the `Skill`
tool BEFORE writing code. For example:
- Writing Next.js code → invoke `next-best-practices`.
- Adding a Hono route → invoke `hono`.
- Designing a UI component → invoke `frontend-design` and `shadcn`.
- Working on the AI SDK pipeline → invoke `ai-sdk`.

If a project-level skill conflicts with a rule in this CLAUDE.md, this file wins.

## MCP tools available in this session

You (the agent running tasks) have access to the following MCP servers. Use them
proactively — they exist to save you time and reduce hallucination.

- **Playwright** (`mcp__plugin_playwright_playwright__*`) — drive a real browser.
  Use to verify any change to `apps/web` actually renders correctly.
  Key tools: `browser_navigate`, `browser_snapshot` (DOM tree, NOT a screenshot —
  prefer this to verify content), `browser_take_screenshot` (visual proof for
  the user), `browser_click`, `browser_type`, `browser_console_messages`,
  `browser_network_requests`, `browser_close`.
- **Context7** (`mcp__context7__*`) — fetch live docs for any library.
  Use BEFORE writing code against an API you're unsure about, especially for
  Next.js 16, React 19, Tailwind 4, Hono, AI SDK v6, Drizzle, Remotion.
  Flow: `resolve-library-id "next.js"` → `query-docs <libId> "App Router metadata"`.
- **shadcn** (`mcp__shadcn__*`) — add, search, audit shadcn components.
  Use `search_items_in_registries` before guessing prop names.
  Use `get_add_command_for_items` instead of recalling the install CLI from memory.
- **Linear / Notion / Drive / Amplitude** — only if a task explicitly references them.

## UI verification workflow with Playwright

When a task touches `apps/web`, verify with Playwright before marking complete:

1. Make sure dev server is up. From repo root, in a separate shell:
   `pnpm -F web dev`
   It binds to `http://localhost:3001`. If the port is busy, kill the previous
   process first; do not invent a new port.
2. Wait for "Ready" line in the dev server output (usually 3–6 seconds).
3. Use `browser_navigate` to `http://localhost:3001/<route>`.
4. Use `browser_snapshot` to read the rendered DOM and assert the expected text /
   elements are present.
5. If the change is visual (layout, colors, shadcn component), also call
   `browser_take_screenshot` and reference the file in your task output for the
   reviewer to inspect.
6. Use `browser_console_messages` to confirm no React/hydration errors.

If `pnpm -F web build` fails, fix the build first. There is no point validating a
broken build in a browser.

## Validation commands — must be green after every task

Run from repo root:

- `pnpm lint` (alias for `biome check .`)
- `pnpm check-types`
- `pnpm build` (only when source files in apps/ or packages/ changed)

Optional during dev:
- `pnpm dev` (runs both web and server via Turbo)

## Database workflow

- Start Postgres: `pnpm db:start` (docker compose up -d)
- Apply schema: `pnpm db:push`
- New migration: edit `packages/db/src/schema/index.ts`, run `pnpm db:generate`
- Open Studio: `pnpm db:studio`

## Running ralphex

`.ralphex/config` is set up for hackathon throughput:

- **Executor**: Claude Code (`claude_command = claude`).
- **External review**: codex enabled, model `gpt-5.4`, reasoning `high`,
  sandbox `read-only`. Codex auth via ChatGPT login at `~/.codex/auth.json`
  (verify with `codex login status`).
- **Patience**: `review_patience = 3` so Claude/codex disagreements terminate.
- **Timeouts**: session 45m, idle 5m. Rate-limit retry: 1h.
- **Plans dir**: `docs/plans/`. Completed plans auto-move to
  `docs/plans/completed/`.

Run a single plan once:

```bash
ralphex docs/plans/01-design-system.md
ralphex --serve docs/plans/01-design-system.md   # with web dashboard on :8080
```

Run the next pending plan in the directory (the wrapper at
`scripts/ralph-next.sh` picks the lowest-numbered uncompleted plan and
delegates to ralphex):

```bash
./scripts/ralph-next.sh
```

Hourly cron — keeps progressing through plans until everything is in
`completed/`:

```cron
0 * * * * cd /Users/madvil2/Projects/content-factory && ./scripts/ralph-next.sh >> .ralphex/cron.log 2>&1
```

Resumability: re-running the same command picks up at the next unchecked
`- [ ]` task. No need to clear `.ralphex/progress/`.

## Ralph + Entire integration

This repo uses Entire CLI to capture AI agent sessions on every commit.
- Entire is enabled (`entire status` confirms). Hooks live in `.git/hooks/`.
- When Ralph spawns Claude Code sub-sessions for review, Entire captures them
  as nested sessions tied to the parent session. This is the demo asset:
  every coded feature has reasoning attached.
- Do not disable Entire mid-project. Do not bypass git hooks with `--no-verify`.

## When you are unsure

If the plan does not specify which library to use for a sub-task, prefer the
smallest solution that works. Do not introduce new dependencies. Re-read this
file. Stop and leave a `TODO(plan):` comment if a real decision is needed —
do not silently choose.
