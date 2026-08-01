import { useState } from "react";
import ExpandableCard from "./ExpandableCard";
import { quadrantMeta, quadrantSoft } from "../lib/quadrant";
import { layerLabel } from "../lib/layerLabels";

/* Section 2 -- Why It Scored This Way.
 *
 * One card per Report layer (identity / messaging / voice), each expandable
 * into five tabs. Every number here is read straight from that layer's own
 * `contributions` block -- the recipe percentages ARE the API's renormalised
 * weights, not something computed on this side. The two "global" tabs
 * (Signature Language, Category Clichés, Lexical Diversity) show the same
 * evidence.* term lists in every layer's tab, because the API only detects
 * them once per document -- what differs per layer is how much weight that
 * layer's own recipe puts on the corresponding metric, which is what the
 * score bar underneath the chips shows.
 *
 * The expand/collapse chrome itself lives in ExpandableCard, shared with the
 * Structural Style row so both read as one family.
 */

const AXIS_META = {
  centroid_consistency: {
    label: "Meaning Match",
    tooltip: "Cosine similarity of this copy's meaning to the brand's own writing.",
  },
  lexical_sig: {
    label: "Brand Phrases",
    tooltip: "Use of words and phrases this brand disproportionately uses.",
  },
  tone: {
    label: "Tone Match",
    tooltip: "Match to the brand's tone profile across five axes (see Personality Sliders).",
  },
  structural: {
    label: "Writing Style",
    tooltip: "Match to the brand's sentence length, readability and punctuation patterns.",
  },
  centroid_distinctiveness: {
    label: "Generic Score",
    tooltip: "Cosine distance from generic category / competitor writing.",
  },
  lexical_cliche: {
    label: "Originality",
    tooltip: "Absence of stock category phrases (\"cutting-edge\", \"unlock your potential\", ...).",
  },
  lexical_div: {
    label: "Word Variety",
    tooltip: "Vocabulary range — how repetitive the word choice is.",
  },
};

function recipeRows(contributions, axis) {
  return Object.entries(contributions ?? {})
    .map(([metric, d]) => {
      const key = metric === "centroid" ? `centroid_${axis}` : metric;
      const meta = AXIS_META[key] ?? { icon: "•", label: metric, tooltip: "" };
      return { key: metric, icon: meta.icon, label: meta.label, tooltip: meta.tooltip, weight: d.weight, value: d.value };
    })
    .sort((a, b) => b.weight - a.weight);
}

const TABS = ["Overview", "Meaning Match", "Brand Phrases", "Industry Buzzwords", "Word Variety"];

function Recipe({ title, rows }) {
  return (
    <div className="recipe">
      <h4>{title}</h4>
      {rows.map((r) => (
        <div className="recipe-row" key={r.key} title={r.tooltip}>
          <span className="recipe-icon">{r.icon}</span>
          <span className="recipe-label">{r.label}</span>
          <span className="recipe-dots" aria-hidden="true" />
          <span className="recipe-pct">{Math.round(r.weight * 100)}%</span>
        </div>
      ))}
    </div>
  );
}

function SemanticsTab({ vsBrand, vsGeneric }) {
  const brand = vsBrand ?? 0;
  const generic = vsGeneric ?? 0;
  // Bars are scaled to whichever value is larger so the comparison reads —
  // the raw cosine similarities are tiny numbers by nature of this encoder.
  // The exact figure is always printed alongside, so the scaling never hides
  // the real value.
  const scale = Math.max(brand, generic, 0.02);
  return (
    <div className="tab-panel">
      <div className="sim-row">
        <div className="sim-head"><span>Similarity to Brand</span><span className="sim-value">{brand.toFixed(4)}</span></div>
        <div className="sim-track"><div className="sim-fill" style={{ width: `${Math.min(100, (brand / scale) * 100)}%`, background: "var(--series-1)" }} /></div>
      </div>
      <div className="sim-row">
        <div className="sim-head"><span>Similarity to Generic</span><span className="sim-value">{generic.toFixed(4)}</span></div>
        <div className="sim-track"><div className="sim-fill" style={{ width: `${Math.min(100, (generic / scale) * 100)}%`, background: "var(--text-3)" }} /></div>
      </div>
      <p className="helper">
        Bars are scaled to the larger of the two values so the comparison reads
        clearly; the numbers on the right are the exact cosine similarities.
        Higher brand similarity increases consistency. Lower generic similarity
        increases distinctiveness.
      </p>
    </div>
  );
}

function TermsTab({ terms, empty, score, scoreLabel }) {
  const list = terms ?? [];
  return (
    <div className="tab-panel">
      <div className="chip-row">
        {list.length
          ? list.map((t) => <span className="chip" key={t}>{t}</span>)
          : <span className="empty-note">✅ {empty}</span>}
      </div>
      {score !== null && score !== undefined && (
        <div className="score-row">
          <span className="score-label">{scoreLabel}</span>
          <div className="score-track"><div className="score-fill" style={{ width: `${score}%` }} /></div>
          <span className="score-value">{Math.round(score)}</span>
        </div>
      )}
    </div>
  );
}

function DiversityTab({ overall }) {
  const pct = overall ?? 0;
  return (
    <div className="tab-panel diversity">
      <div className="diversity-cluster">
        <span className="diversity-title">Vocabulary Richness</span>
        <span className="diversity-value">{Math.round(pct)}</span>
      </div>
      <p className="helper">Higher diversity generally indicates more original language.</p>
    </div>
  );
}

export default function LayerCard({ layer, evidence }) {
  const [tab, setTab] = useState(TABS[0]);
  const q = quadrantMeta(layer.quadrant);

  const consRows = recipeRows(layer.contributions?.consistency, "consistency");
  const distRows = recipeRows(layer.contributions?.distinctiveness, "distinctiveness");
  const raw = layer.contributions?.raw_cosine ?? {};
  const sigScore = layer.contributions?.consistency?.lexical_sig?.value ?? null;
  const clicheScore = layer.contributions?.distinctiveness?.lexical_cliche?.value ?? null;

  return (
    <>
    <ExpandableCard
      title={
        <>
          <span className="exp-title">{layerLabel(layer.layer)}</span>
          <span
            className="layer-quadrant-chip"
            style={{ "--q": q.color, "--q-soft": quadrantSoft(q.color) }}
          >
            {q.icon} {q.label}
          </span>
        </>
      }
      headerRight={
        <>
          <div className="mini-metric">
            <span className="mini-label" title={`How closely this ${layerLabel(layer.layer)} copy sounds like the brand.`}>On-Brand Score</span>
            <div className="mini-track"><div className="mini-fill" style={{ width: `${layer.consistency}%`, background: "var(--series-1)" }} /></div>
            <span className="mini-value">{layer.consistency}</span>
          </div>
          <div className="mini-metric">
            <span className="mini-label" title={`How far this ${layerLabel(layer.layer)} copy sits from category boilerplate.`}>Stand-Out Score</span>
            <div className="mini-track"><div className="mini-fill" style={{ width: `${layer.distinctiveness}%`, background: "var(--series-3)" }} /></div>
            <span className="mini-value">{layer.distinctiveness}</span>
          </div>
        </>
      }
    >
      <div className="tabs" role="tablist">
        {TABS.map((t) => (
          <button
            key={t} role="tab" aria-selected={tab === t}
            className={`tab${tab === t ? " active" : ""}`}
            onClick={() => setTab(t)}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "Overview" && (
        <div className="tab-panel">
          <div className="overview-quadrant">
            <span className="overview-quadrant-label">Verdict</span>
            <p className="quadrant-note">{layer.quadrant_note}</p>
          </div>
          <div className="recipes">
            <Recipe title="How Much It Sounds Like You" rows={consRows} />
            <Recipe title="How Much It Stands Out" rows={distRows} />
          </div>
        </div>
      )}
      {tab === "Meaning Match" && <SemanticsTab vsBrand={raw.vs_brand} vsGeneric={raw.vs_generic} />}
      {tab === "Brand Phrases" && (
        <TermsTab
          terms={evidence.signature_terms_used}
          empty="No brand phrases detected."
          score={sigScore}
          scoreLabel="This layer's weight on brand phrases"
        />
      )}
      {tab === "Industry Buzzwords" && (
        <TermsTab
          terms={evidence.cliches_detected}
          empty="No industry buzzwords detected."
          score={clicheScore}
          scoreLabel="This layer's weight on originality"
        />
      )}
      {tab === "Word Variety" && <DiversityTab overall={evidence.lexical_diversity} />}
    </ExpandableCard>

    {/* Rendered as a sibling of ExpandableCard, not inside its children --
        children only mount into the DOM while the row is open, so a <style>
        tag nested there would vanish every time the row collapses, taking
        the always-visible header badge and mini-metric styling with it. */}
      <style>{`
        .layer-quadrant-chip {
          font-size: var(--t-tiny); font-weight: 560; color: var(--q);
          background: var(--q-soft); border-radius: var(--r-pill);
          padding: 3px 10px; white-space: nowrap;
        }
        .mini-metric { display: flex; align-items: center; gap: 8px; }
        .mini-label {
          font-size: var(--t-lead); font-weight: 620; color: var(--text);
          white-space: nowrap;
        }
        .mini-track {
          width: 64px; height: 6px; border-radius: var(--r-pill);
          background: var(--seq-track); overflow: hidden;
        }
        .mini-fill { height: 100%; border-radius: var(--r-pill); transition: width 600ms var(--ease); }
        .mini-value {
          font-size: var(--t-small); font-weight: 620; color: var(--text);
          font-variant-numeric: tabular-nums; width: 30px; text-align: right;
        }

        .tabs { display: flex; gap: 4px; flex-wrap: wrap; margin-bottom: 16px; }
        .tab {
          background: transparent; color: var(--text-3); border: 1px solid transparent;
          height: 30px; padding: 0 12px; font-size: var(--t-small); font-weight: 560;
          border-radius: var(--r-pill);
        }
        .tab:hover:not(.active) { background: var(--surface-hover); color: var(--text-2); }
        .tab.active { background: var(--series-1-soft); color: var(--series-1); border-color: color-mix(in srgb, var(--series-1) 30%, transparent); }

        .tab-panel { display: flex; flex-direction: column; gap: 14px; }
        .overview-quadrant { display: flex; align-items: baseline; gap: 10px; flex-wrap: wrap; }
        .overview-quadrant-label {
          font-size: var(--t-micro); font-weight: 660; letter-spacing: 0.07em;
          text-transform: uppercase; color: var(--text-3); flex: none;
        }
        .quadrant-note { margin: 0; font-size: var(--t-small); color: var(--text-2); }

        .recipes { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        @media (max-width: 720px) { .recipes { grid-template-columns: 1fr; } }
        .recipe h4 {
          margin: 0 0 10px; font-size: var(--t-micro); font-weight: 660;
          letter-spacing: 0.07em; text-transform: uppercase; color: var(--text-3);
        }
        .recipe-row {
          display: flex; align-items: baseline; gap: 8px; padding: 5px 0;
          font-size: var(--t-small); color: var(--text-2);
        }
        .recipe-icon { flex: none; }
        .recipe-label { flex: none; white-space: nowrap; }
        .recipe-dots {
          flex: 1 1 auto; border-bottom: 1px dotted var(--line-strong);
          margin: 0 4px; transform: translateY(-4px);
        }
        .recipe-pct { flex: none; font-weight: 620; color: var(--text); font-variant-numeric: tabular-nums; }

        .sim-row { display: flex; flex-direction: column; gap: 6px; }
        .sim-head {
          display: flex; justify-content: space-between; font-size: var(--t-small);
          color: var(--text-2);
        }
        .sim-value { font-weight: 620; color: var(--text); font-variant-numeric: tabular-nums; }
        .sim-track {
          height: 8px; border-radius: var(--r-pill); background: var(--seq-track); overflow: hidden;
        }
        .sim-fill { height: 100%; border-radius: var(--r-pill); transition: width 700ms var(--ease); }
        .helper { margin: 0; font-size: var(--t-tiny); color: var(--text-3); line-height: 1.55; }

        .chip-row { display: flex; flex-wrap: wrap; gap: 7px; }
        .chip {
          font-size: var(--t-tiny); font-weight: 560; padding: 4px 11px;
          border-radius: var(--r-pill); background: var(--surface-sunken);
          border: 1px solid var(--line); color: var(--text-2);
        }
        .empty-note { font-size: var(--t-small); color: var(--text-3); }

        .score-row { display: flex; align-items: center; gap: 10px; }
        .score-label { font-size: var(--t-tiny); color: var(--text-3); flex: none; }
        .score-track {
          flex: 1 1 auto; height: 6px; border-radius: var(--r-pill);
          background: var(--seq-track); overflow: hidden;
        }
        .score-fill { height: 100%; border-radius: var(--r-pill); background: var(--series-1); transition: width 600ms var(--ease); }
        .score-value { font-size: var(--t-small); font-weight: 620; color: var(--text); font-variant-numeric: tabular-nums; flex: none; }

        .diversity { align-items: center; text-align: center; gap: 10px; padding: 6px 0 4px; }
        .diversity-cluster {
          display: flex; flex-direction: column; align-items: center; gap: 6px;
        }
        .diversity-title {
          font-size: var(--t-micro); font-weight: 660; letter-spacing: 0.07em;
          text-transform: uppercase; color: var(--text-3);
        }
        .diversity-value {
          font-size: 34px; font-weight: 640; color: var(--text); line-height: 1;
          font-variant-numeric: tabular-nums;
        }
        .diversity .helper { max-width: 38ch; margin: 0 auto; }
      `}</style>
    </>
  );
}
