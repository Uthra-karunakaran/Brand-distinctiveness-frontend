import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { fetchBrands, scoreCopy } from "./api";
import EvidenceCard from "./components/EvidenceCard";
import FinalSummary from "./components/FinalSummary";
import HeroSection from "./components/HeroSection";
import ImageClassifier from "./components/ImageClassifier";
import LayerCard from "./components/LayerCard";
import LayerComparison from "./components/LayerComparison";
import StructuralStyle from "./components/StructuralStyle";
import ToneAnalysis from "./components/ToneAnalysis";
import WarningsBanner from "./components/WarningsBanner";
import OnboardingFlow from "./components/onboarding/OnboardingFlow";
import { DEMO_TEXTS } from "./lib/demo";
import { layerLabel } from "./lib/layerLabels";

/* Every value on this page is either a field straight off the Report the
 * scoring API returns, or a presentation-only transform of one (a colour, a
 * percentage rounding, a fixed sentence keyed off a quadrant string). Nothing
 * is invented to fill a gap the API leaves, and there is no composite score:
 * the two axes the API actually reports -- consistency and distinctiveness --
 * are what every section shows. */

const THEMES = [
  {
    value: "auto",
    label: "System",
    icon: (
      <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <rect x="1.9" y="2.6" width="12.2" height="8.6" rx="1.6" stroke="currentColor" strokeWidth="1.3" />
        <path d="M5.5 13.6h5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    value: "light",
    label: "Light",
    icon: (
      <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <circle cx="8" cy="8" r="3.1" stroke="currentColor" strokeWidth="1.3" />
        <path
          d="M8 1.4v1.5M8 13.1v1.5M1.4 8h1.5M13.1 8h1.5M3.3 3.3l1.1 1.1M11.6 11.6l1.1 1.1M12.7 3.3l-1.1 1.1M4.4 11.6l-1.1 1.1"
          stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    value: "dark",
    label: "Dark",
    icon: (
      <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <path
          d="M13.4 9.9A5.9 5.9 0 0 1 6.1 2.6a5.9 5.9 0 1 0 7.3 7.3z"
          stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"
        />
      </svg>
    ),
  },
];

export default function App() {
  const [text, setText] = useState(DEMO_TEXTS[0].text);
  const [preset, setPreset] = useState("0");
  const [brandId, setBrandId] = useState(null);
  const [brands, setBrands] = useState([]);

  const [report, setReport] = useState(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(null);
  const [editing, setEditing] = useState(true);
  const [theme, setTheme] = useState("auto");

  // Two screens, one shell. Onboarding is a full-page task, so it replaces the
  // scorer rather than opening in a modal over it -- a nine-field form in a
  // dialog is a form you cannot leave and come back to.
  const [view, setView] = useState("scorer");

  useEffect(() => {
    fetchBrands().then((list) => {
      setBrands(list);
      if (list.length) setBrandId(list[0].id);
    });
  }, []);

  const brand = useMemo(() => brands.find((b) => b.id === brandId), [brands, brandId]);

  useEffect(() => {
    if (theme === "auto") document.documentElement.removeAttribute("data-theme");
    else document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  const run = useCallback(async () => {
    if (!text.trim() || !brand) return;
    setPending(true);
    setError(null);
    try {
      const result = await scoreCopy({ slug: brand.slug, text });
      setReport(result);
      setEditing(false);
    } catch (e) {
      setError(e.message);
    } finally {
      setPending(false);
    }
  }, [text, brand]);

  // Scope changed while a result is showing -- re-score automatically. Without
  // this the input has already collapsed to one line, so there is no visible
  // Analyse button to press after switching brands.
  const firstRender = useRef(true);
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    if (report) run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [brandId]);

  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        run();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [run]);

  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  const evidence = report?.evidence ?? {};

  // "Overall tone alignment" is the API's own tone contribution value, not a
  // number computed here -- it is identical across layers (tone is scored
  // once per document), so any layer that carries it is the source.
  const toneAlignment = report?.layers?.find((l) => l.contributions?.consistency?.tone)
    ?.contributions.consistency.tone.value ?? null;

  return (
    <>
      <header className="topbar">
        <div className="topbar-inner">
          <span className="wordmark">
            {/* Same geometry as public/favicon.svg -- keep the two in sync. */}
            <span className="mark" aria-hidden="true">
              <svg width="15" height="15" viewBox="0 0 32 32" fill="none">
                <mask id="wordmark-cut">
                  <rect width="32" height="32" fill="#fff" />
                  <circle cx="22.4" cy="9.6" r="5.9" fill="#000" />
                </mask>
                <g mask="url(#wordmark-cut)">
                  <circle cx="16" cy="16" r="9" stroke="#fff" strokeOpacity=".52" strokeWidth="2.6" />
                  <circle cx="16" cy="16" r="2.5" fill="#fff" fillOpacity=".38" />
                </g>
                <circle cx="22.4" cy="9.6" r="4.1" fill="#fff" />
              </svg>
            </span>
            Locify
          </span>

          <span className="spacer" />

          {/* The brand picker belongs to the scorer; during onboarding there
              is nothing to pick between yet. */}
          {view === "scorer" && (
            <>
              {/* Brand: a native select kept for keyboard and mobile behaviour,
                  wearing a leading icon so it reads as "which brand" without a
                  separate uppercase label taking up the bar. */}
              <label className="field" title="Brand to score against">
                <span className="field-icon" aria-hidden="true">
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                    <circle cx="8" cy="8" r="5.4" stroke="currentColor" strokeWidth="1.4" />
                    <circle cx="8" cy="8" r="1.7" fill="currentColor" />
                  </svg>
                </span>
                <select
                  value={brandId ?? ""}
                  onChange={(e) => setBrandId(Number(e.target.value))}
                  aria-label="Brand"
                  disabled={!brands.length}
                >
                  {!brands.length && <option value="">Loading…</option>}
                  {brands.map((b) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </label>

              <button className="ghost" onClick={() => setView("onboard")}>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                  <path d="M6 2.2v7.6M2.2 6h7.6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                </svg>
                Add brand
              </button>

              <button className="ghost" onClick={() => setView("classifier")}>
                <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <rect x="2" y="2" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="1.4" />
                  <circle cx="6" cy="6.5" r="1.3" stroke="currentColor" strokeWidth="1.2" />
                  <path d="M3.4 12.2 7 8.4l2 2 2.3-2.6 1.3 1.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Image classifier
              </button>
            </>
          )}

          {/* {view === "classifier" && (
            <button className="ghost" onClick={() => setView("scorer")}>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                <path d="M7.5 2.5 3 6l4.5 3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Back to scorer
            </button>
          )} */}

          {/* Theme: three states, all visible at once. A dropdown hid two of
              them behind a click for a control people flip constantly. */}
          <div className="seg" role="group" aria-label="Theme">
            {THEMES.map(({ value, label, icon }) => (
              <button
                key={value}
                type="button"
                className="seg-btn"
                aria-pressed={theme === value}
                aria-label={`${label} theme`}
                title={`${label} theme`}
                onClick={() => setTheme(value)}
              >
                {icon}
              </button>
            ))}
          </div>
        </div>
      </header>

      {view === "onboard" && (
        <main className="page">
          <OnboardingFlow
            onCancel={() => setView("scorer")}
            /* No backend yet, so a finished onboarding cannot appear in the
               brand catalog. Returning to the scorer is the honest end of the
               flow until POST /brands/onboard exists. */
            onDone={() => setView("scorer")}
          />
        </main>
      )}

      {view === "classifier" && (
        <main className="page">
          <ImageClassifier />
        </main>
      )}

      {view === "scorer" && (
      <main className="page">
        <div className="grid">
          {/* ─────────────────────────────────────────────── input */}
          <div className="col-12">
            <div className="card">
              <div className="card-head">
                <h2>Text to Evaluate</h2>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span className="sub">{words} words</span>
                  <select
                    value={preset}
                    onChange={(e) => {
                      setPreset(e.target.value);
                      const p = DEMO_TEXTS[Number(e.target.value)];
                      if (p) {
                        setText(p.text);
                        setEditing(true);
                      }
                    }}
                    aria-label="Demo content"
                  >
                    {DEMO_TEXTS.map((d, i) => (
                      <option key={d.label} value={i}>{d.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {editing || !report ? (
                <>
                  <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Paste marketing copy…"
                    aria-label="Copy to analyse"
                  />
                  <div className="run-row">
                    <button onClick={run} disabled={pending || !text.trim() || !brand}>
                      {pending ? (<><span className="spinner" />Scoring…</>) : "Analyse"}
                    </button>
                    {report && (
                      <button className="quiet" onClick={() => setEditing(false)}>Cancel</button>
                    )}
                  </div>
                </>
              ) : (
                <button className="collapsed" onClick={() => setEditing(true)}>
                  <span className="collapsed-text">{text}</span>
                  <span className="collapsed-edit">Edit</span>
                </button>
              )}

              {error && (
                <p className="error"><strong>Couldn't score that.</strong> {error}</p>
              )}
            </div>
          </div>

          {!report && !error && (
            <div className="col-12">
              <div className="card">
                <div className="empty">
                  <span className="empty-art" aria-hidden="true">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                      <path d="M3 10h5l2-5 3 10 2-5h2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                  <span>
                    <strong>Nothing scored yet</strong>
                    Pick a sample above or paste your own, then press Analyse.
                  </span>
                </div>
              </div>
            </div>
          )}

          {report && (
            <>
              {/* ─────────────────────────────────────── 1. at a glance */}
              <div className="col-12 rise rise-1">
                <HeroSection report={report} />
              </div>

              <div className="col-12 rise rise-1">
                <WarningsBanner warnings={report.warnings} />
              </div>

              {/* ─────────────────────────────────── 2. why it scored this way */}
              <div className="col-12 rise rise-2">
                <div className="section-head">
                  <h2 className="section-title">What's Driving This Score</h2>
                  <span className="section-sub">
                    Per layer — {layerLabel("identity")}, {layerLabel("messaging")}, {layerLabel("voice")}
                  </span>
                </div>
                <div className="layer-list">
                  {(report.layers ?? []).map((l) => (
                    <LayerCard key={l.layer} layer={l} evidence={evidence} />
                  ))}
                </div>
              </div>

              {/* ─────────────────────────────────── 3. writing style & tone */}
              <div className="col-12 rise rise-3">
                <StructuralStyle style={evidence.style} />
              </div>

              <div className="col-12 rise rise-3">
                <div className="card">
                  <div className="card-head">
                    <h2>Personality Profile</h2>
                    <span className="sub">Your copy vs. the brand profile</span>
                  </div>
                  <ToneAnalysis
                    toneInput={evidence.tone_input}
                    toneBrand={evidence.tone_brand}
                    biggestGap={evidence.tone_biggest_gap}
                    alignmentScore={toneAlignment}
                  />
                </div>
              </div>

              {/* ─────────────────────────────────── 4. supporting evidence */}
              <div className="col-12 rise rise-4">
                <div className="card">
                  <EvidenceCard
                    nearestBrand={evidence.nearest_brand_chunk}
                    nearestGeneric={evidence.nearest_generic_chunk}
                  />
                </div>
              </div>

              {/* ─────────────────────────────────── layer comparison */}
              <div className="col-12 rise">
                <div className="card">
                  <div className="card-head"><h2>Layer comparison</h2></div>
                  <LayerComparison layers={report.layers} />
                </div>
              </div>

              {/* ─────────────────────────────────── final summary */}
              <div className="col-12 rise">
                <FinalSummary report={report} />
              </div>
            </>
          )}
        </div>
      </main>
      )}

      <style>{`
        .run-row { display: flex; align-items: center; gap: 8px; margin-top: 12px; }

        .collapsed {
          white-space: normal;
          display: flex; align-items: flex-start; gap: 14px; width: 100%;
          min-height: 0;
          text-align: left; background: var(--surface-sunken);
          border: 1px solid var(--line); border-radius: var(--r-md);
          padding: 13px 14px; height: auto; color: var(--text-2);
          font: 400 var(--t-body)/1.6 var(--font);
        }
        .collapsed:hover { background: var(--surface-hover); filter: none; }
        .collapsed-text {
          flex: 1 1 auto; min-width: 0;
          display: -webkit-box; -webkit-line-clamp: 2;
          -webkit-box-orient: vertical; overflow: hidden;
        }
        .collapsed-edit {
          flex: none; font-size: var(--t-tiny); font-weight: 560;
          color: var(--series-1);
        }

        .section-head { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; margin-bottom: 14px; flex-wrap: wrap; }
        .section-title { margin: 0; font-size: var(--t-h3); font-weight: 640; color: var(--text); }
        .section-sub { font-size: var(--t-small); color: var(--text-3); }
        .layer-list { display: flex; flex-direction: column; gap: 12px; }
      `}</style>
    </>
  );
}
