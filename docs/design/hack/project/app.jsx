// Content Factory — Agent Thinking screen
const { useState, useEffect, useRef } = React;

// ---------- Decision card data ----------
const SCRIPT_LINES = [
  "Most retry libraries make you write 40 lines.",
  "We do it in one. ship_with_retry, three flags, done.",
  "And in the new release we cut migration time by 6\u00d7\u2014",
];
const FULL_SCRIPT = SCRIPT_LINES.join("\n");

const DECISIONS = [
  {
    id: "extract",
    name: "extract_user_facing_changes",
    state: "done",
    timestamp: "12s ago",
    body: "Found 6 user-facing changes. Filtered out 41 internal commits — refactors, dependency bumps, test reorganization.",
    chips: [
      { k: "47", v: "commits scanned" },
      { k: "6", v: "user-facing" },
      { k: "41", v: "dropped" },
    ],
  },
  {
    id: "market",
    name: "fetch_market_context",
    state: "done",
    timestamp: "9s ago",
    body: "Searched what 12 competing dev tools led with this month. Most pushed “security” or “reliability”. We'll lead with speed instead — it's the white space.",
    chips: [
      { k: "12", v: "competitors" },
      { k: "8", v: "led with security" },
      { k: "4", v: "led with reliability" },
    ],
  },
  {
    id: "select",
    name: "select_features",
    state: "done",
    timestamp: "6s ago",
    body: "Picked the 3 features most likely to land for technical readers. Ordered by emotional weight: lightest hook first, biggest payoff last.",
    features: ["webhook-retry-cli", "migration-perf", "audit-log-export"],
  },
  {
    id: "hook",
    name: "write_hook",
    state: "done",
    timestamp: "3s ago",
    body: "“Most retry libraries make you write 40 lines. We do it in one.” This hook leads with a developer pain everyone has felt.",
  },
  {
    id: "script",
    name: "write_voiceover_script",
    state: "in-progress",
    timestamp: "now",
    body: "Drafting the 45-second script. Keeping it conversational, no marketing voice — three beats: pain, fix, payoff.",
  },
  {
    id: "visuals",
    name: "generate_scene_visuals",
    state: "pending",
    body: "Will compose 5–7 scenes from the script and brand visual tokens.",
  },
  {
    id: "voiceover",
    name: "synthesize_voiceover",
    state: "pending",
    body: "Will generate audio with your cloned voice profile.",
  },
  {
    id: "compose",
    name: "compose_final_video",
    state: "pending",
    body: "Will mix scenes, voiceover, and brand framing into the final MP4.",
  },
];

// ---------- Status dot ----------
function StatusDot({ state }) {
  const cls =
    state === "done" ? "status-dot done"
    : state === "in-progress" ? "status-dot progress"
    : "status-dot pending";
  return <span className={cls} aria-hidden="true" />;
}

// ---------- Streaming text hook ----------
function useStreamingText(full, { charDelay = 28, startDelay = 400 } = {}) {
  const [text, setText] = useState("");
  const [done, setDone] = useState(false);
  useEffect(() => {
    let i = 0;
    let cancelled = false;
    const tick = () => {
      if (cancelled) return;
      if (i >= full.length) { setDone(true); return; }
      // accelerate slightly on whitespace runs
      const ch = full[i];
      const next = full.slice(0, i + 1);
      setText(next);
      i += 1;
      const delay = ch === " " ? charDelay * 0.6 : charDelay + (Math.random() * 18 - 6);
      setTimeout(tick, delay);
    };
    const t = setTimeout(tick, startDelay);
    return () => { cancelled = true; clearTimeout(t); };
  }, [full, charDelay, startDelay]);
  return { text, done };
}

// ---------- Card ----------
function DecisionCard({ d, streamingText, isStreamDone }) {
  const cls = `card ${d.state === "in-progress" ? "in-progress" : d.state === "done" ? "done" : "pending"}`;
  return (
    <div className={cls}>
      <div className="card-top">
        <StatusDot state={d.state} />
        <span className="decision-name mono">{d.name}</span>
        {d.state !== "pending" && (
          <span className={`timestamp${d.timestamp === "now" ? " now" : ""}`}>{d.timestamp}</span>
        )}
      </div>
      <p className="card-body">{d.body}</p>

      {d.chips && (
        <div className="chips">
          {d.chips.map((c, i) => (
            <span key={i} className="chip mono"><strong>{c.k}</strong> {c.v}</span>
          ))}
        </div>
      )}

      {d.features && (
        <div className="chips">
          {d.features.map((f, i) => (
            <span key={i} className="chip feature mono">{f}</span>
          ))}
        </div>
      )}

      {d.id === "script" && (
        <div className="script-stream">
          {streamingText}
          {!isStreamDone && <span className="caret" />}
        </div>
      )}
    </div>
  );
}

// ---------- App ----------
function App() {
  // Live counters
  const [elapsed, setElapsed] = useState(17);
  const [tokens, setTokens] = useState(3402);
  const [cost, setCost] = useState(0.04);
  const [eta, setEta] = useState(45);
  const [progress, setProgress] = useState(38);

  useEffect(() => {
    const t = setInterval(() => {
      setElapsed((e) => e + 1);
      setTokens((t) => t + Math.floor(8 + Math.random() * 22));
      setCost((c) => +(c + 0.0008 + Math.random() * 0.0006).toFixed(4));
      setEta((e) => Math.max(28, e - 1));
      setProgress((p) => Math.min(62, p + 0.4));
    }, 1000);
    return () => clearInterval(t);
  }, []);

  const { text: streamText, done: streamDone } = useStreamingText(FULL_SCRIPT, {
    charDelay: 32,
    startDelay: 600,
  });

  const fmtCost = (n) => `$${n.toFixed(2)}`;
  const fmtTokens = (n) => n.toLocaleString();

  const doneCount = DECISIONS.filter((d) => d.state === "done").length;
  const totalCount = DECISIONS.length;

  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <div className="header-left">
          <button className="back-btn" aria-label="Back">
            <IconChevronLeft />
          </button>
          <span className="crumb-sep">/</span>
          <span>Videos</span>
          <span className="crumb-sep">/</span>
          <span className="project-crumb mono">webhook-retry-launch-week</span>
        </div>

        <div className="header-center">
          <div className="header-title-row">
            <span className="live-dot" />
            <span>Generating video</span>
          </div>
          <div className="progress-track" aria-label="Generation progress">
            <div className="progress-fill" style={{ width: `${progress}%` }} />
          </div>
        </div>

        <div className="header-right">
          <span className="eta mono">~{eta}s remaining</span>
          <button className="ghost-btn">Cancel</button>
        </div>
      </header>

      {/* Body */}
      <div className="body-grid">
        {/* LEFT — Agent reasoning */}
        <section className="col-left">
          <h2 className="col-title">
            Agent reasoning
            <span className="count mono">{doneCount}/{totalCount}</span>
          </h2>
          <div className="cards">
            {DECISIONS.map((d) => (
              <DecisionCard
                key={d.id}
                d={d}
                streamingText={streamText}
                isStreamDone={streamDone}
              />
            ))}
          </div>
        </section>

        {/* RIGHT — Live preview */}
        <section className="col-right">
          <div className="right-section">
            <h2 className="col-title">Live preview</h2>
            <div className="preview-frame">
              <div className="preview-shimmer" />
              <div className="preview-empty">
                <div className="icon-wrap">
                  <IconFilm size={18} />
                </div>
                <div>Preview will appear when scenes start rendering</div>
              </div>
            </div>
            <div className="preview-meta">
              <span>Will be 9:16 vertical</span>
              <span className="dot-sep">·</span>
              <span>~45 seconds</span>
              <span className="dot-sep">·</span>
              <span>with cloned voice</span>
            </div>
          </div>

          <div className="right-section">
            <div className="scene-strip-title">
              <span>Scene timeline</span>
              <span className="mono" style={{ fontSize: 11, color: "var(--text-dim)" }}>0/6 rendered</span>
            </div>
            <div className="scene-strip">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <div key={n} className={`scene${n === 1 ? " next" : ""}`}>
                  {n === 1 && <span className="next-dot" aria-label="next" />}
                  <span className="scene-label mono">Scene {n}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-left">
          <span>Brand:</span>
          <span className="brand-name">Resend Engineering</span>
          <button className="edit-btn" aria-label="Edit brand">
            <IconPencil size={12} />
          </button>
        </div>
        <div className="footer-right mono">
          <span>Time elapsed: <strong>{elapsed}s</strong></span>
          <span>Tokens used: <strong>{fmtTokens(tokens)}</strong></span>
          <span>Cost: <strong>{fmtCost(cost)}</strong></span>
        </div>
      </footer>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
