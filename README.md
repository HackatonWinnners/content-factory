# Content Factory

> Drop a GitHub repo URL → 30–60s on-brand vertical video with AI voiceover, karaoke captions, and embedded music.

Content Factory turns a public GitHub repo into a TikTok-ready short-form video.
Define your brand once, drop any repo URL — the agent extracts user-facing
commits, pulls competitive market context from Tavily, queries Peec AI for
distribution-gap intelligence (where the brand is invisible across ChatGPT /
Perplexity), writes the script with Gemini 2.5 Pro, voices each scene with
Gradium TTS, and renders one self-contained MP4 with the audio embedded and
karaoke captions burned in.

Built for the **AI Hackathon** (Berlin, April 2026).

---

## The pipeline

```
GitHub repo URL
   │
   ▼  fetch repo + README + recent commits           (GitHub REST)
extract user-facing facts
   │
   ▼  search competitors / similar projects          (Tavily)
   ▼  AI-search visibility + distribution gaps       (Peec AI Customer API)
market + distribution context
   │
   ▼  write hook + 3-6 scenes + closing CTA          (Gemini 2.5 Pro, AI SDK v6)
script (with type-tagged scenes: stat, fact, feature, comparison, quote)
   │
   ▼  per-scene TTS in parallel (concurrency=2)      (Gradium TTS)
audio assets (WAV per scene, durations measured)
   │
   ▼  render 1080×1920 MP4 with audio embedded       (Remotion 4)
   ▼  karaoke captions, animated backgrounds, music
final MP4 (single file, ready to upload anywhere)
```

Every commit on this repo is captured by [**Entire**](https://entire.io) — run
`entire log` to replay the full agent reasoning behind any line of code.

---

## Stack

| Layer            | Tech                                                     |
| ---------------- | -------------------------------------------------------- |
| Web              | Next.js 16, React 19, Tailwind 4, shadcn/ui (port 3001)  |
| API              | Hono on `@hono/node-server`, Node 22+ (port 3000)        |
| LLM              | Vercel AI SDK v6 + `@ai-sdk/google` (`gemini-2.5-pro`)   |
| Search           | Tavily REST                                              |
| AI-search intel  | Peec AI Customer API + project-level MCP                 |
| Voice            | Gradium TTS REST (per-scene, concurrency-limited)        |
| Composer         | Remotion 4 (`@content-factory/composer`)                 |
| Music            | Bundled royalty-free tracks (lofi/cinematic/ambient/upbeat) |
| Validation       | Zod 4 at all external boundaries                         |
| Build            | pnpm 10 workspaces, Turborepo, Biome 2, TypeScript strict|
| Session capture  | Entire CLI (post-commit hook)                            |
| Security         | Aikido (final scan before submit)                        |
| Dev orchestration| ralphex + Claude Code + Codex review                     |

### Partner technologies used

- **Google Gemini** — `gemini-2.5-pro` via AI SDK v6 `generateObject` with a
  Zod-typed `VideoScriptSchema` (hook + scenes + CTA, scenes typed as `stat`,
  `fact`, `feature`, `comparison`, or `quote` with type-specific layouts).
- **Tavily** — market context search powering the editorial step.
- **Peec AI** *(track: 0→1 AI Marketer)* — pulls own-brand visibility,
  competitor share-of-voice, and opportunity domains from
  `/customer/v1/reports/brands` and `/reports/domains`. Fed into the Gemini
  prompt so the script closes the brand's distribution gap. Project-level MCP
  registered in `.mcp.json` for dev workflows.
- **Gradium** — per-scene TTS. Each scene's voiceover is synthesised
  separately and the WAV duration becomes the actual scene length, so audio
  and visuals stay perfectly synced.
- **Aikido** — security scan and report before submission.
- **Entire** — every commit's AI agent session captured and pushed to
  `entire/checkpoints/v1`. Multi-agent review iterations (codex + 5 review
  sub-agents) all attached.

---

## Run it locally

### Prereqs

- Node 22.x or 24.x
- pnpm 10
- (Docker optional — Postgres is wired but unused in the demo flow)

### Required env

Copy `.env.example` to `.env` and fill in:

```bash
GEMINI_API_KEY=...        # required — script writer
TAVILY_API_KEY=...        # required — market context
GRADIUM_API_KEY=...       # required — voiceover

# Optional but recommended:
PEEC_API_KEY=skc-...      # Peec AI track integration; pipeline degrades gracefully if missing
GITHUB_TOKEN=ghp_...      # raises GitHub REST limit from 60 to 5000/hour
```

`HERA_API_KEY` and `PIONEER_API_KEY` are scaffolded in env but **not used**
in the current pipeline — leave them blank.

### Install + run

```bash
pnpm install
cp .env.example .env       # fill in keys
NODE_OPTIONS="--max-old-space-size=8192" pnpm dev
# web:    http://localhost:3001
# server: http://localhost:3000
```

> **Why the heap bump?** Remotion + Chromium during render peaks around
> 5-6 GB. The default 4 GB heap will OOM on the first render. 8 GB is safe.

### Demo

1. Open <http://localhost:3001> — landing page with animated 9:16 player tile
2. Click **Set up your brand** — fill in name + voice + tone sliders
3. **Source** screen — drop `https://github.com/honojs/hono`, watch the live
   commit list pull from GitHub REST, pick a time range
4. Click **Generate video** — redirected to **Thinking** with SSE-driven
   progress, 8 decision cards, streaming script with magenta caret, scene
   timeline filling up
5. **Result** — video plays with embedded voiceover and karaoke captions

---

## Screens (port 3001)

| Route          | Purpose                                                                                                              |
| -------------- | -------------------------------------------------------------------------------------------------------------------- |
| `/`            | Landing — animated hero with 9:16 player tile (karaoke demo), feature beats, agent reasoning teaser, partners        |
| `/brand-setup` | Brand profile form: name, voice description, three tone sliders, sticky live preview card                            |
| `/source`      | Three-zone shell: sidebar (recent projects from `localStorage`) · main (tabs / URL / time pills / live commit list) · right panel (Brand / Format-disabled / Voice / Generate CTA) |
| `/thinking`    | Header with magenta progress shimmer · 8 decision cards (`done`/`in-progress`/`pending`) with chips + features · streaming script with blinking caret · live preview frame with diagonal shimmer · 6-cell scene timeline with next-pulse · footer with elapsed/tokens/cost counters |
| `/result`      | Video player with embedded audio + karaoke; metadata grid; download button                                           |

The brand profile is persisted in browser `localStorage` under
`cf:brandProfile`. Recent projects (visible in `/source` sidebar) are stored
under `cf:recentProjects`.

## API (port 3000)

| Method | Path                              | Description                                       |
| ------ | --------------------------------- | ------------------------------------------------- |
| GET    | `/api/v1/health`                  | `{ ok, version, uptime }`                         |
| POST   | `/api/v1/ai`                      | AI SDK streaming chat (legacy `/ai` playground)   |
| GET    | `/api/v1/repos/preview`           | Repo metadata + filtered user-facing commit list (`?ref=&days=7\|30\|90`)  |
| POST   | `/api/v1/video-jobs`              | `{ kind:"git", ref, brand }` → `{ jobId }`        |
| GET    | `/api/v1/video-jobs/:id`          | Current job state JSON (sanitised — no fs paths) |
| GET    | `/api/v1/video-jobs/:id/events`   | SSE stream of pipeline status updates             |
| GET    | `/api/v1/video-jobs/:id/video`    | `video/mp4` (audio embedded — no separate stream needed) |

Only `kind: "git"` is accepted today; `linear` and `pdf` return `400 "coming soon"`.

SSE statuses: `pending → extracting → researching → scripting → voicing → rendering → done | failed`.

```bash
curl -X POST http://localhost:3000/api/v1/video-jobs \
  -H 'content-type: application/json' \
  -d '{"kind":"git","ref":"https://github.com/honojs/hono","brand":{"name":"Content-factory","voice":"casual technical, no marketing bullshit","tone":{"formalCasual":75,"seriousPlayful":60,"directStorytelling":30}}}'
```

End-to-end takes ~2-3 minutes on a fresh job (Gemini ~30s, Gradium per-scene
TTS ~30-45s with concurrency 2, Remotion render ~60-90s).

---

## Project layout

```
apps/
  web/              Next.js 16 — landing + 4 design screens (port 3001)
  server/           Hono — pipeline orchestration + SSE (port 3000)
packages/
  agent/            Editorial pipeline:
                      github.ts (REST + commit parsing)
                      tavily.ts (market context)
                      peec.ts   (Peec AI Customer API client)
                      script.ts (Gemini generateObject)
  composer/
    src/            Remotion compositions
      compositions/script-video.tsx (typed scene layouts + animated bg + karaoke)
      render.ts     bundle + selectComposition + renderMedia
    music-library/  Royalty-free tracks (copied into bundle on demand)
    public/         Bundle-time public/ — populated per render with audio + music
  db/               Drizzle schema + docker-compose (unused in demo)
  env/              T3-style typed env loaders (server / web)
  ui/               Shared shadcn/ui primitives
  config/           Shared tsconfig.base.json
docs/
  design/hack/      Handoff bundle from claude.ai/design (tokens + 5 screens)
  plans/            ralphex plan files (active + completed/)
.screenshots/       Per-screen UI evidence
.demo-output/       Local demo videos (gitignored)
.mcp.json           Project-level MCP servers (context7, shadcn, peec-ai)
```

---

## Scripts

| Command                                       | Description                            |
| --------------------------------------------- | -------------------------------------- |
| `pnpm dev`                                    | Run web + server in watch mode         |
| `pnpm dev:web`                                | Web only (port 3001)                   |
| `pnpm dev:server`                             | API only (port 3000)                   |
| `pnpm build`                                  | Production build of every workspace    |
| `pnpm lint`                                   | Biome check (no fixes)                 |
| `pnpm check`                                  | Biome check + auto-fix                 |
| `pnpm check-types`                            | TypeScript across the workspace        |
| `pnpm db:start`                               | Bring Postgres up (docker compose)     |
| `pnpm -F @content-factory/composer studio`    | Open Remotion Studio for previewing    |

---

## Troubleshooting

- **Server OOMs during render** → bump heap: `NODE_OPTIONS="--max-old-space-size=8192" pnpm dev`. Remotion + Chromium peaks around 5-6 GB.
- **`Generation failed: github /repos/X responded 403`** → unauthenticated GitHub REST is 60 req/hour. Add `GITHUB_TOKEN=ghp_...` to `.env` (no scopes needed for public repos) → 5000 req/hour.
- **`voiceover failed: gradium 500 ... Concurrency limit exceeded: 3 active sessions`** → per-scene TTS is throttled to 2 in parallel; if you see this, another job is already running. Wait or restart the server.
- **`No object generated: response did not match schema`** → Gemini occasionally overflows a max-length on a generated string. The schemas now use generous bounds; restart the server with `tsx watch` so the new schema reloads, then retry.
- **Stale port 3000/3001** → `lsof -ti:3000,3001 \| xargs -r kill -9`.
- **Result page shows 404 video** → the MP4 lives in `os.tmpdir()`; macOS clears tmpdir periodically. Re-render or use the saved copy in `.demo-output/`.

---

## Security review

- Tool: **Aikido** (`@aikidosec/mcp`) — scan run gated on `AIKIDO_API_KEY`.
- Date: 2026-04-26
- Status: **Run via Aikido web UI before final submission.** The CLI ships
  only an MCP entry point (no scan command) and aborts without an
  account-bound API key, so the hackathon scan + hosted report are produced
  via the web UI as a manual final step.

---

## License

[MIT](./LICENSE).
