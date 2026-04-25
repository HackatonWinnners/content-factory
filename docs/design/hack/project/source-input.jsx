// Content Factory — Source Input screen
const { useState } = React;

// ----- Project list -----
const PROJECTS = [
  { name: "resend-changelog-week-42", src: "github", time: "3h ago" },
  { name: "linear-q3-shipped", src: "linear", time: "yesterday" },
  { name: "webhook-retry-launch-week", src: "github", time: "now", active: true },
  { name: "dashboard-redesign-recap", src: "linear", time: "2d ago" },
  { name: "cli-v2-migration-guide", src: "pdf", time: "4d ago" },
  { name: "attio-quarterly-update", src: "pdf", time: "1w ago" },
];

// Tiny abstract thumbnail (deterministic by index)
function Thumb({ i }) {
  const palettes = [
    ["#1F2A2E", "#2A3F44"],
    ["#241F2E", "#3A2F49"],
    ["#2E1F26", "#49303B"],
    ["#1F2E29", "#2F4940"],
    ["#2E281F", "#494030"],
    ["#1F232E", "#303949"],
  ];
  const [a, b] = palettes[i % palettes.length];
  return (
    <svg viewBox="0 0 40 24" preserveAspectRatio="none">
      <rect width="40" height="24" fill={a} />
      <rect x={4 + i * 3} y={4} width={16} height={2} fill={b} />
      <rect x={4 + i * 2} y={9} width={24} height={1.5} fill={b} opacity="0.7" />
      <rect x={4} y={14} width={10 + i * 2} height={1.5} fill={b} opacity="0.5" />
      <circle cx={34} cy={18} r={2} fill={b} opacity="0.8" />
    </svg>
  );
}

function SrcIcon({ src }) {
  if (src === "github") return <IconGitHub size={11} />;
  if (src === "linear") return <IconLinear size={11} />;
  return <IconPdf size={11} />;
}

// ----- Author avatars -----
const AUTHORS = {
  "Maxim Petrov":    { initials: "MP", bg: "linear-gradient(135deg,#3A2A4A,#4D2E5C)" },
  "Sarah Chen":      { initials: "SC", bg: "linear-gradient(135deg,#1F3A4A,#2C4F61)" },
  "Tom Wilson":      { initials: "TW", bg: "linear-gradient(135deg,#3A2A1F,#5C4530)" },
  "dependabot":      { initials: "D",  bg: "linear-gradient(135deg,#2A2A33,#3F3F4A)" },
};

function Avatar({ author }) {
  const a = AUTHORS[author] || { initials: "?", bg: "#222" };
  return <span className="author-avatar" style={{ background: a.bg }}>{a.initials}</span>;
}

// ----- Commits -----
const COMMITS = [
  { sha: "f4a8c2e", uf: true,  msg: ["feat(cli):", " add ship_with_retry one-liner"], author: "Maxim Petrov", time: "2h ago", hovered: true },
  { sha: "e9b1d83", uf: true,  msg: ["feat(cli):", " three new flags for retry config"], author: "Sarah Chen", time: "4h ago" },
  { sha: "a72f0c1", uf: false, msg: ["chore:", " bump dependency versions"], author: "dependabot", time: "5h ago" },
  { sha: "8c4e6b2", uf: true,  msg: ["perf(migrate):", " cut migration time by 6×"], author: "Sarah Chen", time: "6h ago" },
  { sha: "b193fa7", uf: false, msg: ["refactor:", " extract retry executor into separate module"], author: "Maxim Petrov", time: "8h ago" },
  { sha: "5d8a201", uf: false, msg: ["test:", " add integration tests for retry edge cases"], author: "Sarah Chen", time: "11h ago" },
  { sha: "03f7e9d", uf: true,  msg: ["feat(audit):", " export audit logs as CSV"], author: "Tom Wilson", time: "14h ago" },
  { sha: "91c5ab4", uf: false, msg: ["docs:", " update internal architecture doc"], author: "Maxim Petrov", time: "1d ago" },
  { sha: "6e2d0fc", uf: true,  msg: ["feat(webhook):", " add exponential backoff option"], author: "Sarah Chen", time: "1d ago" },
  { sha: "d40b8e7", uf: false, msg: ["chore:", " bump @types/node to 22.13"], author: "dependabot", time: "1d ago" },
  { sha: "f8a3c91", uf: true,  msg: ["fix(cli):", " retry flag now respects timeout"], author: "Tom Wilson", time: "2d ago" },
  { sha: "2b91e44", uf: false, msg: ["refactor:", " simplify error handling in executor"], author: "Maxim Petrov", time: "2d ago" },
];

// ----- Voice waveform -----
function Waveform() {
  const bars = [3,5,7,11,8,14,10,16,12,18,14,15,11,8,12,7,9,5,4,6,9,7,4,3];
  return (
    <svg className="wave" viewBox="0 0 64 22" preserveAspectRatio="none">
      {bars.map((h, i) => (
        <rect key={i}
          x={i * (64 / bars.length) + 0.5}
          y={(22 - h) / 2}
          width={(64 / bars.length) - 1}
          height={h}
          rx="0.5"
          fill="currentColor"
          opacity={0.45 + (h / 22) * 0.55}
        />
      ))}
    </svg>
  );
}

// ----- App -----
function App() {
  const [tab, setTab] = useState("github");
  const [range, setRange] = useState("30");
  const [format, setFormat] = useState("horizontal");
  const [showAll, setShowAll] = useState(false);

  const visibleCommits = showAll ? COMMITS : COMMITS;
  const ufCount = COMMITS.filter(c => c.uf).length;

  return (
    <div className="app">
      {/* TOP HEADER */}
      <header className="top-header">
        <div className="wordmark">Content Factory<span className="dot">.</span></div>
        <div className="top-header-right">
          <button className="ws-btn">
            <span className="ws-mark">A</span>
            <span>Acme Co</span>
            <IconChevDown size={12} />
          </button>
          <span className="avatar">MP</span>
        </div>
      </header>

      {/* SHELL */}
      <div className="shell">
        {/* SIDEBAR */}
        <aside className="sidebar">
          <button className="new-btn">
            <span className="plus">+</span>
            <span>New project</span>
          </button>

          <div className="section-label">Recent projects</div>
          <div className="proj-list">
            {PROJECTS.map((p, i) => (
              <div key={p.name} className={`proj-row${p.active ? " active" : ""}`}>
                <div className="thumb"><Thumb i={i} /></div>
                <div className="proj-meta">
                  <div className="proj-name mono">{p.name}</div>
                  <div className="proj-sub">
                    <span className="src-icon"><SrcIcon src={p.src} /></span>
                    <span className="time">{p.time}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="sidebar-bottom">
            <div className="settings-row">
              <IconSettings size={14} />
              <span>Settings</span>
            </div>
          </div>
        </aside>

        {/* MAIN */}
        <main className="main">
          <h1 className="page-title">New project</h1>
          <p className="page-sub">Pick a source. We'll handle the rest.</p>

          <div className="tabs">
            <button className={`tab${tab === "github" ? " active" : ""}`} onClick={() => setTab("github")}>GitHub</button>
            <button className={`tab${tab === "linear" ? " active" : ""}`} onClick={() => setTab("linear")}>Linear</button>
            <button className={`tab${tab === "pdf" ? " active" : ""}`} onClick={() => setTab("pdf")}>PDF</button>
          </div>

          {/* URL input */}
          <div className="url-row">
            <div className="url-input">
              <span style={{ color: "var(--text-muted)" }}><IconGitHub size={14} /></span>
              <input defaultValue="github.com/acme/webhook-retry" spellCheck="false" />
            </div>
            <div className="conn-pill">
              <span className="gd" />
              <span>Connected as <span className="who">@maxim</span></span>
            </div>
          </div>

          {/* Pills */}
          <div className="pills">
            {[
              { id: "7",  label: "Last 7 days" },
              { id: "30", label: "Last 30 days" },
              { id: "90", label: "Last 90 days" },
              { id: "custom", label: "Custom range" },
            ].map(p => (
              <button key={p.id} className={`pill${range === p.id ? " active" : ""}`} onClick={() => setRange(p.id)}>
                {p.label}
              </button>
            ))}
          </div>

          {/* Repo metadata */}
          <div className="meta-card">
            <div className="meta-cell">
              <div className="lbl">Repo</div>
              <div className="val mono"><IconGitHub size={13} /> acme/webhook-retry</div>
            </div>
            <div className="meta-cell">
              <div className="lbl">Commits in range</div>
              <div className="val mono">47</div>
            </div>
            <div className="meta-cell">
              <div className="lbl">Languages</div>
              <div className="val">
                <span className="lang-chips">
                  <span className="lang-chip"><span className="ldot" style={{ background: "#3178C6" }} />TypeScript</span>
                  <span className="lang-chip"><span className="ldot" style={{ background: "#00ADD8" }} />Go</span>
                </span>
              </div>
            </div>
            <div className="meta-cell">
              <div className="lbl">Last activity</div>
              <div className="val mono">2h ago</div>
            </div>
          </div>

          {/* Filter strip */}
          <div className="filter-row">
            <div className="filter-text">
              Showing <span className="accent">{ufCount}</span> user-facing changes from 47 commits
            </div>
            <button className="show-all-btn" onClick={() => setShowAll(s => !s)}>
              <IconEye size={13} />
              {showAll ? "Hide non-user-facing" : "Show all 47"}
            </button>
          </div>

          {/* Commits */}
          <div className="commits">
            {visibleCommits.map((c, i) => (
              <div key={c.sha} className={`commit${c.uf ? "" : " dim"}${c.hovered ? " hovered" : ""}`}>
                <div className={`uf-dot${c.uf ? "" : " empty"}`} />
                <span className="sha">{c.sha}</span>
                <span className="msg">
                  <span className="scope">{c.msg[0]}</span>{c.msg[1]}
                </span>
                <div className="commit-author">
                  <Avatar author={c.author} />
                  <span className="name">{c.author}</span>
                  <span className="ago">· {c.time}</span>
                </div>
              </div>
            ))}
          </div>
        </main>

        {/* RIGHT PANEL */}
        <aside className="rpanel">
          {/* Brand profile */}
          <div className="rcard">
            <div className="rcard-title-row">
              <span className="rcard-title">Brand</span>
              <button className="ghost-icon-btn" aria-label="Edit brand"><IconPencil size={12} /></button>
            </div>
            <div className="brand-name">Acme Engineering</div>
            <div className="brand-pills">
              <span className="brand-pill">Technical</span>
              <span className="brand-pill">Direct</span>
              <span className="brand-pill">Engineering humor</span>
            </div>
            <div className="brand-meta">
              <span className="check"><IconCheck size={9} /></span>
              5 example pieces uploaded
            </div>
          </div>

          {/* Format */}
          <div className="rcard">
            <div className="rcard-title-row">
              <span className="rcard-title">Format</span>
            </div>
            <div className="fmt-list">
              <button className={`fmt-opt${format === "vertical" ? " selected" : ""}`} onClick={() => setFormat("vertical")}>
                <span className="fmt-preview vertical" />
                <span className="fmt-opt-text">
                  <span className="fmt-label">Vertical · 9:16</span>
                  <span className="fmt-sub">For Twitter, TikTok, Reels</span>
                </span>
                <span className="fmt-radio" />
              </button>
              <button className={`fmt-opt${format === "horizontal" ? " selected" : ""}`} onClick={() => setFormat("horizontal")}>
                <span className="fmt-preview horizontal" />
                <span className="fmt-opt-text">
                  <span className="fmt-label">Horizontal · 16:9</span>
                  <span className="fmt-sub">For YouTube, blog embeds</span>
                </span>
                <span className="fmt-radio" />
              </button>
            </div>
          </div>

          {/* Voice */}
          <div className="rcard">
            <div className="rcard-title-row">
              <span className="rcard-title">Voice</span>
            </div>
            <div className="voice-row">
              <Waveform />
              <span className="voice-name">Your cloned voice</span>
              <button className="play-btn" aria-label="Preview voice"><IconPlay size={10} /></button>
            </div>
            <div className="voice-more">
              <span>4 voices available</span>
              <IconChevRight size={14} />
            </div>
          </div>

          {/* CTA */}
          <div className="cta-area">
            <button className="cta-btn">
              Generate video
              <IconArrowRight size={14} />
            </button>
            <div className="cta-sub">Estimated 45–60s · ~$0.04 in tokens</div>
          </div>
        </aside>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
