# Content Factory

> Drop a GitHub repo, Linear export, or PDF. Get a 30-second on-brand video back.

Content Factory turns any source into a vertical or horizontal short-form video
with AI voiceover. Define your brand once, then aim it at a changelog, a launch
ticket, or a whitepaper — the agent picks what matters, writes a hook, composes
scenes, voices it in your cloned voice, and renders an MP4.

Built for the **AI Hackathon** (Berlin, April 2026).

---

## The pipeline

```
source        →   user-facing facts   →   market context   →   editorial
(GitHub/         (Pioneer GLiNER2)       (Tavily search)       (Gemini 2.5)
 Linear/PDF)
                                                                    ↓
output       ←   composition       ←   voiceover        ←   script + scenes
(MP4 9:16        (Remotion)            (Gradium voice         (Gemini)
 or 16:9)                                clone)
```

Every commit and AI session is captured by **Entire** so the agent's reasoning
becomes part of the artifact, not just the artifact's history.

---

## Stack

| Layer        | Tech                                                        |
| ------------ | ----------------------------------------------------------- |
| Web          | Next.js 16, React 19, Tailwind 4, shadcn/ui                 |
| API          | Hono on `@hono/node-server`, Node 22+                       |
| LLM          | Vercel AI SDK + `@ai-sdk/google` (`gemini-2.5-flash`)       |
| Search       | Tavily REST                                                 |
| Extraction   | Pioneer / Fastino (GLiNER2)                                 |
| Voice        | Gradium (TTS + voice cloning)                               |
| Video gen    | Hera REST                                                   |
| Composer     | Remotion 4                                                  |
| Persistence  | PostgreSQL 16, Drizzle ORM                                  |
| Validation   | Zod 4 at all external boundaries                            |
| Build        | pnpm 10 workspaces, Turborepo, Biome 2, TypeScript strict   |
| Session capture | Entire CLI (post-commit hook)                            |
| Security     | Aikido (final scan before submit)                           |

**Three+ partner technologies used**: Google Gemini, Tavily, Pioneer, Hera,
Gradium, Aikido, Entire.

---

## Design

The UI was prototyped in [claude.ai/design](https://claude.ai/design) — a dark,
magenta-accented, Linear-density visual system. Four screens drive the flow:

1. **Brand Setup** (`/brand-setup`) — define voice, paste examples, tune tone sliders
2. **Source Input** (`/source`) — pick repo/ticket/PDF, see filtered commits, set format
3. **Agent Thinking** (`/thinking`) — watch the agent reason live, 8 decisions, streaming script
4. **Result** (`/result`) — finished video, decision recap, voice picker, regenerate options

The handoff bundle lives at [`docs/design/hack/`](docs/design/hack/). Read it
top-to-bottom — `tokens.css`, four `.html` prototypes, four `.jsx` components,
and the designer's intent in `chats/chat1.md`.

---

## Build process

This repo is itself an experiment in agent-driven development:

- The plan files in [`docs/plans/`](docs/plans/) are executed by
  [**ralphex**](https://ralphex.com), which spawns Claude Code per task and
  Codex for external review.
- [**Entire**](https://entire.io) captures every Claude Code session as a
  searchable record attached to the commit it produced.
- [**Aikido**](https://aikido.dev) scans the result before submission.

Every commit on this branch has its full agent reasoning attached.

---

## Run it locally

```bash
# 1. Prereqs: Node 22+, pnpm 10+, Docker
node --version && pnpm --version && docker --version

# 2. Install
pnpm install

# 3. Env
cp .env.example .env
# fill in: GEMINI_API_KEY, TAVILY_API_KEY, HERA_API_KEY, PIONEER_API_KEY, GRADIUM_API_KEY

# 4. Database
pnpm db:start    # docker compose up postgres
pnpm db:push     # apply schema

# 5. Dev
pnpm dev         # web on :3001, api on :3000
```

Open [http://localhost:3001](http://localhost:3001).

---

## Project layout

```
apps/
  web/          Next.js 16 — the four design screens (port 3001)
  server/       Hono — pipeline orchestration (port 3000)
packages/
  agent/        Editorial pipeline: Gemini, Tavily, Pioneer
  composer/     Remotion compositions + programmatic render API
  db/           Drizzle schema, migrations, docker-compose
  env/          T3-style typed env loaders (server / web)
  ui/           Shared shadcn/ui primitives
  config/       Shared tsconfig.base.json
docs/
  design/       Handoff bundle from claude.ai/design
  plans/        ralphex plan files (00-foundation through 05-result)
.codex/         Codex CLI hooks + MCP servers
.entire/        Entire session capture config
.ralphex/       ralphex local config (sandbox: read-only codex review)
```

---

## Scripts

| Command              | Description                            |
| -------------------- | -------------------------------------- |
| `pnpm dev`           | Run web + server in watch mode         |
| `pnpm dev:web`       | Web only                               |
| `pnpm dev:server`    | API only                               |
| `pnpm build`         | Production build of everything         |
| `pnpm lint`          | Biome check (no fixes)                 |
| `pnpm check`         | Biome check + auto-fix                 |
| `pnpm check-types`   | TypeScript across the workspace        |
| `pnpm db:start`      | Bring Postgres up (docker compose)     |
| `pnpm db:push`       | Apply Drizzle schema                   |
| `pnpm db:studio`     | Open Drizzle Studio                    |

Composer-specific:

```bash
pnpm -F @content-factory/composer studio   # Remotion Studio for previewing
```

---

## License

Hackathon-only. Not for redistribution.
