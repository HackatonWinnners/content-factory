# Plan: 00 — Foundation Skeleton

## Overview

The Better-T scaffold is in place. This plan adds the project-specific skeleton on
top: DB schema for brand profiles + video jobs, a new `@content-factory/agent`
package, route structure in Hono, and a project-branded landing page.

End state: clean validation, db schema applied, server has a versioned API surface
ready for feature plans, web shows our brand instead of Better-T placeholder.

## Validation Commands

- `pnpm lint`
- `pnpm check-types`
- `pnpm build`

## Notes for the agent

- Do NOT install new top-level dependencies unless the task explicitly says so.
- Use catalog versions from `pnpm-workspace.yaml` for any shared deps.
- Tab indentation, double quotes, kebab-case file names.
- Re-read CLAUDE.md if any architectural question comes up.

### Task 1: Add DB schema for brand profiles and video jobs

- [ ] Edit `packages/db/src/schema/index.ts` to define two Drizzle tables:
  - `brandProfiles`: `id` (uuid pk, default `gen_random_uuid()`), `name` (text not null),
    `tone` (text not null), `do_list` (text array, default empty array), `dont_list`
    (text array, default empty array), `voice_sample_url` (text nullable),
    `gradium_voice_id` (text nullable), `created_at` (timestamptz default now()),
    `updated_at` (timestamptz default now()).
  - `videoJobs`: `id` (uuid pk), `brand_profile_id` (uuid, fk to brandProfiles.id,
    not null, on delete cascade), `source_kind` (text enum: `'git' | 'linear' | 'pdf'`),
    `source_ref` (text not null — URL or upload identifier),
    `status` (text enum: `'pending' | 'extracting' | 'researching' | 'scripting' |
    'rendering' | 'voicing' | 'composing' | 'done' | 'failed'`, default `'pending'`),
    `progress` (integer default 0), `error_message` (text nullable),
    `result_video_url` (text nullable), `created_at`, `updated_at`.
- [ ] Use `pgEnum` for `source_kind` and `status`.
- [ ] Re-export both tables and inferred types (`BrandProfile`, `NewBrandProfile`,
  `VideoJob`, `NewVideoJob`) from `packages/db/src/schema/index.ts`.
- [ ] Generate migration: `pnpm -F @content-factory/db db:generate`
  (assumes Postgres is running locally; if not, the agent should note this and
  proceed — `db:push` is a runtime concern, not a build concern).
- [ ] Commit the generated SQL file under `packages/db/drizzle/` if drizzle-kit
  produced one.
- [ ] Mark complete.

### Task 2: Create `@content-factory/agent` package skeleton

- [ ] Create `packages/agent/package.json` with:
  - name `@content-factory/agent`, `type: "module"`, private
  - exports `.` → `./src/index.ts`, `./*` → `./src/*.ts`
  - dependencies: `@content-factory/env` workspace, `ai` (catalog), `zod` (catalog)
  - devDependencies: `@content-factory/config` workspace, `typescript` (catalog),
    `@types/node` ^22
- [ ] Create `packages/agent/tsconfig.json` extending
  `@content-factory/config/tsconfig.base.json` with `outDir: "dist"`, `rootDir: "src"`,
  `noEmit: true`.
- [ ] Add `check-types` script: `tsc --noEmit`.
- [ ] Create `packages/agent/src/index.ts` with placeholder named exports for the
  pipeline boundaries (functions return `never` via `throw new Error("not implemented")`):
  `extractFacts`, `gatherMarketContext`, `decideEditorial`, `writeScript`,
  `generateScenes`, `synthesizeVoice`, `composeVideo`. Each function takes a typed
  input and returns a typed Promise — define the input/output Zod schemas in a sibling
  file `packages/agent/src/schemas.ts` and re-export inferred types from `index.ts`.
- [ ] Add the package to root deps: in `apps/server/package.json` add
  `"@content-factory/agent": "workspace:*"`.
- [ ] Run `pnpm install` (no lockfile drift expected — confirm green).
- [ ] Mark complete.

### Task 3: Restructure Hono server into versioned routes

- [ ] Create folder `apps/server/src/routes/` with files:
  - `health.ts` — exports a Hono sub-app with `GET /` returning
    `{ ok: true, version: "0.1.0", uptime: process.uptime() }` (Zod-validated).
  - `ai.ts` — move the existing `/ai` POST handler from `index.ts` into here
    unchanged.
  - `brand-profiles.ts` — exports an empty Hono sub-app (placeholder).
  - `video-jobs.ts` — exports an empty Hono sub-app (placeholder).
- [ ] Rewrite `apps/server/src/index.ts` so the root app mounts the sub-apps under
  `/api/v1`: `app.route("/api/v1/health", healthRoutes)`,
  `app.route("/api/v1/ai", aiRoutes)`, `app.route("/api/v1/brand-profiles", ...)`,
  `app.route("/api/v1/video-jobs", ...)`.
  Keep the existing CORS, logger, and `serve(...)` block.
- [ ] Update the web AI page to point to the new path:
  in `apps/web/src/app/ai/page.tsx`, change the `api` URL to
  `${env.NEXT_PUBLIC_SERVER_URL}/api/v1/ai`.
- [ ] Confirm `pnpm check-types` and `pnpm lint` are green.
- [ ] Mark complete.

### Task 4: Replace placeholder landing page with project landing

- [ ] Edit `apps/web/src/app/page.tsx` to:
  - Remove the BETTER STACK ASCII art and the "API Status" placeholder section.
  - Render a server-component (drop the `"use client"` directive — no client state
    needed yet) page with:
    - `<h1>Content Factory</h1>`
    - One paragraph: "Drop a GitHub repo, Linear export, or PDF. Get a 30-second
      on-brand video back."
    - A two-column grid (Tailwind: `grid-cols-1 md:grid-cols-2 gap-4`) with two
      shadcn `Card` blocks:
      - "Set up your brand" with a disabled `Button` labelled "Coming soon"
      - "Generate a video" with a disabled `Button` labelled "Coming soon"
  - Use `Card` and `Button` from `@content-factory/ui/components/*`.
- [ ] Update `metadata` in `apps/web/src/app/layout.tsx`:
  `title: "Content Factory"`,
  `description: "Source-to-video pipeline with brand-aware AI."`.
- [ ] Edit `apps/web/src/components/header.tsx` to display "Content Factory" as the
  logo text instead of the existing placeholder. Keep the existing mode-toggle.
- [ ] Confirm `pnpm -F web build` is green.
- [ ] **Playwright self-test**: start dev server in background
  (`pnpm -F web dev` via Bash with `run_in_background: true`), wait until the
  output contains "Ready" or `localhost:3001`, then with the Playwright MCP:
  - `browser_navigate` to `http://localhost:3001/`
  - `browser_snapshot` and assert the DOM contains "Content Factory" and both
    "Set up your brand" and "Generate a video" Card titles.
  - `browser_console_messages` and confirm no errors (warnings are fine).
  - `browser_take_screenshot` and save to `.screenshots/landing.png`.
  - Kill the dev server (`pkill -f 'next dev' || true`).
  Record a one-line note in the task output describing what was verified.
- [ ] Mark complete.

### Task 5: Wire env access from agent package

- [ ] In `packages/agent/src/index.ts`, import `env` from
  `@content-factory/env/server` and re-export it as `agentEnv` so any pipeline
  function can read `GEMINI_API_KEY`, `TAVILY_API_KEY`, etc., through this package.
- [ ] Add `@content-factory/env` to `packages/agent/package.json` dependencies if
  not already there.
- [ ] Confirm `pnpm check-types` is green.
- [ ] Mark complete.

### Task 6: Final validation pass

- [ ] Run `pnpm lint` — must exit 0.
- [ ] Run `pnpm check-types` — all packages green.
- [ ] Run `pnpm build` — all packages green (server tsdown, web next build,
  packages tsc).
- [ ] Update root `README.md`:
  - One-paragraph project description (use the elevator pitch from CLAUDE.md).
  - Prerequisites: Node 22+/24, pnpm 10, Docker.
  - Setup steps: `pnpm install`, copy `.env.example` → `.env` and fill keys,
    `pnpm db:start`, `pnpm db:push`, `pnpm dev`.
  - Available scripts list (from root `package.json`).
- [ ] Mark complete.
