// Content Factory — Brand Setup screen
const { useState } = React;

// Lightweight icons specific to this screen
const BIcon = ({ children, size = 16 }) => (
  <svg className="lucide" viewBox="0 0 24 24" width={size} height={size}>{children}</svg>
);
const IconX = ({ size = 12 }) => (
  <BIcon size={size}><path d="M18 6L6 18" /><path d="M6 6l12 12" /></BIcon>
);
const IconTwitter = ({ size = 14 }) => (
  <BIcon size={size}>
    <path d="M22 5.8a8.5 8.5 0 0 1-2.4.7 4.2 4.2 0 0 0 1.8-2.3 8.4 8.4 0 0 1-2.6 1A4.2 4.2 0 0 0 11.5 9a11.9 11.9 0 0 1-8.6-4.3 4.2 4.2 0 0 0 1.3 5.6 4.2 4.2 0 0 1-1.9-.5v.05a4.2 4.2 0 0 0 3.4 4.1 4.2 4.2 0 0 1-1.9.07 4.2 4.2 0 0 0 3.9 2.9A8.4 8.4 0 0 1 2 18.5 11.9 11.9 0 0 0 8.5 20.5c7.7 0 11.9-6.4 11.9-11.9v-.5A8.5 8.5 0 0 0 22 5.8z" />
  </BIcon>
);
const IconVideo = ({ size = 14 }) => (
  <BIcon size={size}>
    <rect x="2" y="6" width="14" height="12" rx="2" />
    <polygon points="22 8 16 12 22 16 22 8" />
  </BIcon>
);
const IconUpload = ({ size = 18 }) => (
  <BIcon size={size}>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <path d="M17 8l-5-5-5 5" />
    <path d="M12 3v12" />
  </BIcon>
);
const IconCheckSm = ({ size = 14 }) => (
  <BIcon size={size}><path d="M20 6L9 17l-5-5" /></BIcon>
);

function Slider({ leftLabel, rightLabel, value }) {
  const activeSide = value >= 50 ? "r" : "l";
  return (
    <div className="slider">
      <div className={`lbl-l${activeSide === "l" ? " active" : ""}`}>{leftLabel}</div>
      <div className="track">
        <div className="track-fill" style={{ width: `${value}%` }} />
        <div className="track-handle" style={{ left: `${value}%` }} />
      </div>
      <div className={`lbl-r${activeSide === "r" ? " active" : ""}`}>{rightLabel}</div>
    </div>
  );
}

function App() {
  const [name, setName] = useState("Acme Engineering");
  const [voice, setVoice] = useState(
    "Technical but with humor. We hate marketing bullshit and write like engineers talk on Twitter — direct, slightly sarcastic, never corporate. We're skeptical of hype and love showing real numbers. When we ship something, we explain it like we're explaining to a friend who codes."
  );

  return (
    <div className="app">
      {/* Top header */}
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

      {/* Onboarding strip */}
      <div className="onb-strip">
        <span><span className="step">Step 1 of 1</span> · Set up your brand</span>
        <button className="onb-skip">Skip for now</button>
      </div>

      {/* Layout */}
      <div className="layout">
        {/* FORM */}
        <div className="form-col">
          <h1 className="form-h1">Define your brand</h1>
          <p className="form-sub">We'll use this every time we generate. You can edit it later.</p>

          <div className="fields">
            {/* Brand name */}
            <div>
              <label className="field-label">Brand name</label>
              <input
                className="input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                spellCheck="false"
              />
              <div className="field-helper">This is how we'll refer to your brand internally.</div>
            </div>

            {/* Voice description */}
            <div>
              <label className="field-label">Voice description</label>
              <textarea
                className="textarea"
                rows={5}
                value={voice}
                onChange={(e) => setVoice(e.target.value)}
              />
              <div className="field-helper">The more specific, the better. We'll learn from your tone.</div>
            </div>

            {/* Examples */}
            <div>
              <label className="field-label">Or paste examples</label>
              <div className="field-helper-top">Show us a few pieces of content that already feel like your brand. Optional but recommended.</div>
              <div className="zones">
                <div className="zone filled">
                  <div className="zone-top">
                    <span className="icn"><IconTwitter size={14} /></span>
                    <span className="name">3 tweets uploaded</span>
                    <button className="zone-x" aria-label="Remove"><IconX size={12} /></button>
                  </div>
                  <div className="zone-meta">@acmehq · Sept 2024</div>
                </div>
                <div className="zone filled">
                  <div className="zone-top">
                    <span className="icn"><IconVideo size={14} /></span>
                    <span className="name">1 existing video script</span>
                    <button className="zone-x" aria-label="Remove"><IconX size={12} /></button>
                  </div>
                  <div className="zone-meta">launch-week-day-3.txt</div>
                </div>
                <div className="zone empty">
                  <span className="empty-icon"><IconUpload size={20} /></span>
                  <span className="empty-title">Add landing page text</span>
                  <span className="empty-sub">Drop file or paste text</span>
                </div>
              </div>
            </div>

            {/* Tone sliders */}
            <div>
              <label className="field-label">Tone</label>
              <div className="field-helper-top">Three knobs that shape how we write.</div>
              <div className="sliders">
                <Slider leftLabel="Formal" rightLabel="Casual" value={75} />
                <Slider leftLabel="Serious" rightLabel="Playful" value={60} />
                <Slider leftLabel="Direct" rightLabel="Storytelling" value={25} />
              </div>
            </div>
          </div>

          <div className="form-actions">
            <button className="btn btn-primary">Save brand profile</button>
            <button className="btn btn-ghost">Skip for now</button>
          </div>
        </div>

        {/* PREVIEW */}
        <div className="preview-col">
          <div className="preview-card">
            <div className="pc-label">Compiled brand profile</div>
            <div className="pc-live">
              <span className="gd" />
              <span>Live preview</span>
            </div>

            <div className="pc-fields">
              <div className="pc-field">
                <div className="pc-key">name</div>
                <div className="pc-val">{name}</div>
              </div>

              <div className="pc-field">
                <div className="pc-key">tone</div>
                <div className="pc-val">casual, slightly playful, direct</div>
              </div>

              <div className="pc-field">
                <div className="pc-key">voice_traits</div>
                <div className="pc-chips">
                  <span className="pc-chip">technical</span>
                  <span className="pc-chip">skeptical of hype</span>
                  <span className="pc-chip">engineer humor</span>
                </div>
              </div>

              <div className="pc-field">
                <div className="pc-key">writing_rules</div>
                <div className="pc-rules">
                  <div className="pc-rule do"><span className="tag">DO</span><span>show real numbers</span></div>
                  <div className="pc-rule do"><span className="tag">DO</span><span>write like talking to a friend who codes</span></div>
                  <div className="pc-rule dont"><span className="tag">DON'T</span><span>use marketing language</span></div>
                  <div className="pc-rule dont"><span className="tag">DON'T</span><span>claim breakthroughs</span></div>
                </div>
              </div>

              <div className="pc-field">
                <div className="pc-key">signature_phrases</div>
                <div className="pc-chips">
                  <span className="pc-chip mono">ship_with_retry</span>
                  <span className="pc-chip mono">we cut ___ by 6×</span>
                </div>
              </div>

              <div className="pc-field">
                <div className="pc-key">example_calibration</div>
                <div className="pc-val" style={{ color: "var(--text-muted)", fontSize: 12 }}>
                  Calibrated from 4 uploaded examples
                </div>
              </div>
            </div>

            <div className="pc-foot">
              <span className="pulse" />
              <span>Updates as you type</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
