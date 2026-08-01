import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { fetchBrands, scoreCopy } from "./api";
import EvidenceCard from "./components/EvidenceCard";
import FinalSummary from "./components/FinalSummary";
import HeroSection from "./components/HeroSection";
import LayerCard from "./components/LayerCard";
import LayerComparison from "./components/LayerComparison";
import StructuralStyle from "./components/StructuralStyle";
import ToneAnalysis from "./components/ToneAnalysis";
import WarningsBanner from "./components/WarningsBanner";
import { DEMO_TEXTS } from "./lib/demo";

/* Every value on this page is either a field straight off the Report the
 * scoring API returns, or a presentation-only transform of one (a colour, a
 * percentage rounding, a fixed sentence keyed off a quadrant string). Nothing
 * is invented to fill a gap the API leaves, and there is no composite score:
 * the two axes the API actually reports -- consistency and distinctiveness --
 * are what every section shows. */

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
            <span className="mark" aria-hidden="true">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <circle cx="6" cy="6" r="4.6" stroke="#fff" strokeWidth="1.5" opacity=".45" />
                <circle cx="8.1" cy="3.9" r="2" fill="#fff" />
              </svg>
            </span>
            Loci
          </span>

          <span className="spacer" />

          <div className="control-group">
            <span className="field-label">Brand</span>
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
          </div>

          <select value={theme} onChange={(e) => setTheme(e.target.value)} aria-label="Theme">
            <option value="auto">Auto</option>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
        </div>
      </header>

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
                      {pending ? (<><span className="spinner" />Scoring…</>) : (<>Analyse<span className="kbd">⌘⏎</span></>)}
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
                  <h2 className="section-title"> Why it scored this way</h2>
                  <span className="section-sub">Per layer — identity, messaging, voice</span>
                </div>
                <div className="layer-list">
                  {(report.layers ?? []).map((l) => (
                    <LayerCard key={l.layer} layer={l} evidence={evidence} />
                  ))}
                </div>
              </div>

              {/* ─────────────────────────────────── 3. writing style & tone */}
              <div className="col-6 rise rise-3">
                <div className="card">
                  <div className="card-head"><h2>Structural style</h2></div>
                  <StructuralStyle style={evidence.style} />
                </div>
              </div>

              <div className="col-6 rise rise-3">
                <div className="card">
                  <div className="card-head"><h2>Tone analysis</h2></div>
                  <ToneAnalysis
                    toneInput={evidence.tone_input}
                    toneBrand={evidence.tone_brand}
                    biggestGap={evidence.tone_biggest_gap}
                    alignmentScore={toneAlignment}
                    judge={evidence.tone_judge}
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
