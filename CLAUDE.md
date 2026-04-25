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
- Video composer: **Remotion** — to be added in `packages/composer`.
- Tests: **Vitest** for unit tests when needed. **Playwright** for E2E (later).

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
  composer/   Remotion project (TO ADD)
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
