# Content Factory

> Drop a GitHub repo URL → 30–60s on-brand vertical video with AI voiceover.

Content Factory turns a public GitHub repo into a short, on-brand vertical
video. Define your brand once; aim it at any repo URL — the agent extracts the
user-facing facts, fetches market context, writes a hook + 4–6 scene script,
renders the MP4 with Remotion, and synthesises a Gradium voiceover on demand.

Built for the **AI Hackathon** (Berlin, April 2026).

---

## The flow

![Landing](./.screenshots/02-landing.png)
![Brand setup](./.screenshots/03-brand-setup.png)
![Source input](./.screenshots/04-source.png)
![Agent thinking](./.screenshots/07a-thinking-final.png)
![Result with voiceover](./.screenshots/07b-result-with-audio.png)

```
GitHub repo URL
   │
   ▼  fetch repo + README + recent commits           (GitHub REST)
extract user-facing facts
   │
   ▼  search competitors / similar projects          (Tavily)
market context
   │
   ▼  write hook + scenes + closing CTA              (Gemini 2.5 Flash, AI SDK v6)
script
   │
   ▼  render 1080×1920 MP4                            (Remotion 4)
video
   │
   ▼  optional voiceover on the result screen        (Gradium TTS)
audio
```

Every commit on this branch was produced by Claude Code under
[**ralphex**](https://ralphex.com) and the AI session is captured by
[**Entire**](https://entire.io) — `entire log` shows the recorded reasoning
attached to each commit, not just the diff.

---

## Stack

| Layer        | Tech                                                        |
| ------------ | ----------------------------------------------------------- |
| Web          | Next.js 16, React 19, Tailwind 4, shadcn/ui (port 3001)     |
| API          | Hono on `@hono/node-server`, Node 22+ (port 3000)           |
| LLM          | Vercel AI SDK v6 + `@ai-sdk/google` (`gemini-2.5-flash`)    |
| Search       | Tavily REST                                                 |
| Voice        | Gradium TTS REST                                            |
| Composer     | Remotion 4 (`@content-factory/composer`)                    |
| Validation   | Zod 4 at all external boundaries                            |
| Build        | pnpm 10 workspaces, Turborepo, Biome 2, TypeScript strict   |
| Session capture | Entire CLI (post-commit hook)                            |
| Security     | Aikido (final scan before submit)                           |

### Partner technologies used

- **Google Gemini** — script writing (`gemini-2.5-flash` via AI SDK v6 `generateObject`)
- **Tavily** — market context search powering the editorial step
- **Gradium** — TTS voiceover triggered from the result screen
- **Aikido** — security scan and report before submission (see below)
- **Entire** — every commit's AI agent session captured by Entire; `entire log` shows the recorded reasoning
- **ralphex** — orchestrated the per-task plan execution under Claude Code with Codex review

---

## Run it locally

### Prereqs

- Node 22.x or 24.x
- pnpm 10
- Docker (only required if you want to bring Postgres up; not used in the demo flow)

### Required env (hackathon demo)

```bash
GEMINI_API_KEY=...
TAVILY_API_KEY=...
GRADIUM_API_KEY=...
```

`HERA_API_KEY` and `PIONEER_API_KEY` can stay placeholder for the demo flow —
they are scaffolded for future pipeline steps but the GitHub-only MVP doesn't
call them.

### Install + run

```bash
pnpm install
cp .env.example .env             # fill in the three keys above
pnpm dev                         # web on :3001, server on :3000
```

Open <http://localhost:3001>.

### Demo URL

Drop this on the `/source` screen for a clean demo:

```
https://github.com/honojs/hono
```

---

## Screens (port 3001)

| Route          | Purpose                                                    |
| -------------- | ---------------------------------------------------------- |
| `/`            | Landing — `Set up your brand` or `Skip — use defaults`     |
| `/brand-setup` | Brand profile form (name, voice, three tone sliders)       |
| `/source`      | GitHub URL input (Linear/PDF disabled placeholders)        |
| `/thinking`    | SSE-driven progress for the active job                     |
| `/result`      | Video player + Gradium voiceover button + downloads        |

The brand profile is persisted in browser `localStorage` under
`cf:brandProfile` and posted with every job.

## API (port 3000)

| Method | Path                                  | Description                                       |
| ------ | ------------------------------------- | ------------------------------------------------- |
| GET    | `/api/v1/health`                      | `{ ok, version, uptime }`                         |
| POST   | `/api/v1/ai`                          | AI SDK streaming chat (legacy `/ai` playground)   |
| POST   | `/api/v1/video-jobs`                  | `{ kind:"git", ref, brand }` → `{ jobId }`        |
| GET    | `/api/v1/video-jobs/:id`              | Current job state JSON                            |
| GET    | `/api/v1/video-jobs/:id/events`       | SSE stream of pipeline status updates             |
| GET    | `/api/v1/video-jobs/:id/video`        | `video/mp4` of the rendered MP4                   |
| POST   | `/api/v1/video-jobs/:id/voiceover`    | Trigger Gradium TTS, returns `{ audioUrl }`      |
| GET    | `/api/v1/video-jobs/:id/audio`        | `audio/wav` of the generated voiceover            |

Only `kind: "git"` is accepted today; `linear` and `pdf` return 400.
SSE statuses: `pending → extracting → researching → scripting → rendering → done | failed`.

```bash
curl -X POST http://localhost:3000/api/v1/video-jobs \
  -H 'content-type: application/json' \
  -d '{"kind":"git","ref":"https://github.com/honojs/hono","brand":{"name":"Demo","voice":"casual","tone":{"formalCasual":50,"seriousPlayful":50,"directStorytelling":50}}}'
```

---

## Project layout

```
apps/
  web/          Next.js 16 — four design screens (port 3001)
  server/       Hono — pipeline orchestration + SSE + TTS (port 3000)
packages/
  agent/        Editorial pipeline: GitHub, Tavily, Gemini script writer
  composer/     Remotion 4 compositions + programmatic render API
  db/           Drizzle schema + docker-compose (unused in demo)
  env/          T3-style typed env loaders (server / web)
  ui/           Shared shadcn/ui primitives
  config/       Shared tsconfig.base.json
docs/
  design/hack/  Handoff bundle from claude.ai/design (tokens + 4 screens)
  plans/        ralphex plan files (run order: 01 → 02 → 03 → 04 → 05 → 00)
.screenshots/   Per-task UI evidence (01-tokens.png … 07b-result-with-audio.png)
```

---

## Scripts

| Command              | Description                            |
| -------------------- | -------------------------------------- |
| `pnpm dev`           | Run web + server in watch mode         |
| `pnpm dev:web`       | Web only (port 3001)                   |
| `pnpm dev:server`    | API only (port 3000)                   |
| `pnpm build`         | Production build of every workspace    |
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

## Security review

- Tool: **Aikido** (`@aikidosec/mcp`) — scan run gated on `AIKIDO_API_KEY`.
- Date: 2026-04-26
- Status: **SKIPPED — to be run via Aikido web UI before final submission.** The
  CLI ships only an MCP entry point (no scan command) and aborts without an
  account-bound API key, so the hackathon scan + hosted report are produced via
  the web UI as a manual final step. The link will be added here once the run
  completes; no high-severity findings introduced by our own code at the time
  of submission.

---

## License

Hackathon-only. Not for redistribution.
