// Content Factory — Result screen
const { useState } = React;

// ----- Project list (matches Source Input) -----
const PROJECTS = [
  { name: "resend-changelog-week-42", src: "github", time: "3h ago" },
  { name: "linear-q3-shipped", src: "linear", time: "yesterday" },
  { name: "webhook-retry-launch-week", src: "github", time: "now", active: true },
  { name: "dashboard-redesign-recap", src: "linear", time: "2d ago" },
  { name: "cli-v2-migration-guide", src: "pdf", time: "4d ago" },
  { name: "attio-quarterly-update", src: "pdf", time: "1w ago" },
];

function Thumb({ i }) {
  const palettes = [
    ["#1F2A2E", "#2A3F44"], ["#241F2E", "#3A2F49"], ["#2E1F26", "#49303B"],
    ["#1F2E29", "#2F4940"], ["#2E281F", "#494030"], ["#1F232E", "#303949"],
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

// ----- Decisions (recap) -----
const DECISIONS = [
  { name: "extract_user_facing_changes", result: "Found 6 user-facing changes. Filtered out 41 internal commits." },
  { name: "fetch_market_context",        result: "12 competitors searched. We chose to lead with speed instead of security." },
  { name: "select_features",             result: "Picked 3 features, ordered by emotional weight." },
  { name: "write_hook",                  result: "“Most retry libraries make you write 40 lines. We do it in one.”" },
  { name: "write_voiceover_script",      result: "Wrote 142 words across 6 scenes." },
  { name: "generate_scene_visuals",      result: "Composed 6 scenes from script and brand tokens." },
  { name: "synthesize_voiceover",        result: "Generated 47s of audio with cloned voice." },
  { name: "compose_final_video",         result: "Mixed scenes, voiceover, and brand framing." },
];

// ----- Voices -----
const VOICES = [
  { id: "cloned",   name: "Your cloned voice",  selected: true,
    bars: [3,5,7,11,8,14,10,16,12,18,14,15,11,8,12,7] },
  { id: "formal",   name: "Formal narrator",
    bars: [4,5,6,7,8,9,10,11,10,9,8,7,6,5,4,3] },
  { id: "casual",   name: "Casual host",
    bars: [3,7,4,9,5,11,6,13,8,11,5,9,4,7,3,5] },
  { id: "dramatic", name: "Dramatic",
    bars: [2,3,8,14,5,16,3,18,4,16,5,14,8,3,2,3] },
];
function MiniWave({ bars, w = 24, h = 16 }) {
  const bw = w / bars.length;
  return (
    <svg className="vc-wave" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" width={w} height={h}>
      {bars.map((b, i) => (
        <rect key={i}
          x={i * bw + 0.4}
          y={(h - b) / 2}
          width={bw - 0.8}
          height={b}
          rx="0.4"
          fill="currentColor"
          opacity={0.4 + (b / 18) * 0.6}
        />
      ))}
    </svg>
  );
}

// ----- App -----
function App() {
  const [voice, setVoice] = useState("cloned");

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
          {/* Crumb row */}
          <div className="crumb-row">
            <div className="crumb-left">
              <button className="all-projects-btn">
                <IconArrowLeft size={13} />
                <span>All projects</span>
              </button>
              <span className="crumb-sep">/</span>
              <span className="crumb-name">webhook-retry-launch-week</span>
              <span className="crumb-status">
                <span className="gd" />
                <span>Generated 12s ago</span>
              </span>
            </div>
            <div className="crumb-right">
              Generated in <strong>47s</strong> · <strong>4,892</strong> tokens · <strong>$0.06</strong>
            </div>
          </div>

          {/* Player */}
          <div className="player-wrap">
            <div className="player-shell">
              <div className="player-glow" />
              <div className="player">
                <div className="player-frame-bg" />
                <div className="first-frame">
                  <div className="ff-line-1">Most retry libraries</div>
                  <div className="ff-line-2">make you write 40 lines.</div>
                </div>
                <button className="play-button" aria-label="Play">
                  <IconBigPlay size={28} />
                </button>
              </div>
            </div>

            <div className="player-controls">
              <span className="timecode"><span className="now">0:00</span> / 0:47</span>
              <div className="scrub">
                <div className="scrub-fill" />
                <div className="scrub-thumb" />
              </div>
              <div className="ctrl-icons">
                <button className="ctrl-icon-btn" aria-label="Volume"><IconVolume size={14} /></button>
                <button className="ctrl-icon-btn" aria-label="Captions"><IconCC size={14} /></button>
                <button className="ctrl-icon-btn" aria-label="Fullscreen"><IconFullscreen size={14} /></button>
                <button className="ctrl-icon-btn" aria-label="More"><IconMore size={14} /></button>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="actions">
            <button className="btn btn-primary">
              <IconDownload size={14} />
              Download MP4
            </button>
            <button className="btn btn-ghost">
              <IconLink size={14} />
              Copy share link
            </button>
            <button className="btn btn-ghost">
              <IconRefresh size={14} />
              Regenerate
              <IconChevDown size={12} />
            </button>
          </div>

          {/* Metadata grid */}
          <div className="meta-grid">
            <div className="meta-cell-r">
              <div className="lbl">Duration</div>
              <div className="val mono">0:47</div>
            </div>
            <div className="meta-cell-r">
              <div className="lbl">Resolution</div>
              <div className="val mono">1920×1080</div>
            </div>
            <div className="meta-cell-r">
              <div className="lbl">Voice</div>
              <div className="val">
                <IconSpeaker size={13} />
                <span>Your cloned voice</span>
              </div>
            </div>
            <div className="meta-cell-r">
              <div className="lbl">Format</div>
              <div className="val">
                <span className="ratio-rect" />
                <span>16:9 horizontal</span>
              </div>
            </div>
          </div>
        </main>

        {/* RIGHT PANEL */}
        <aside className="rpanel">
          <h2 className="rpanel-h">What the agent decided</h2>

          <div className="decisions">
            {DECISIONS.map((d) => (
              <div key={d.name} className="decision-item">
                <span className="di-dot" />
                <div className="di-text">
                  <div className="di-name">{d.name}</div>
                  <div className="di-result">{d.result}</div>
                </div>
                <span className="di-chev"><IconChevRight size={12} /></span>
              </div>
            ))}
          </div>

          <div className="rsection-label">Quick regenerate</div>
          <div className="quick-list">
            <button className="chip-btn">
              <span className="ic"><IconRefresh size={13} /></span>
              Try a different hook
            </button>
            <button className="chip-btn">
              <span className="ic"><IconRefresh size={13} /></span>
              Try a different tone
            </button>
            <button className="chip-btn">
              <span className="ic"><IconRefresh size={13} /></span>
              Try different scene order
            </button>
          </div>

          <div className="rsection-label">Voice</div>
          <div className="voice-list">
            {VOICES.map((v) => (
              <div
                key={v.id}
                className={`voice-card${voice === v.id ? " selected" : ""}`}
                onClick={() => setVoice(v.id)}
              >
                <MiniWave bars={v.bars} />
                <span className="vc-name">{v.name}</span>
                <button className="vc-play" aria-label={`Preview ${v.name}`} onClick={(e) => e.stopPropagation()}>
                  <IconPlay size={9} />
                </button>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
