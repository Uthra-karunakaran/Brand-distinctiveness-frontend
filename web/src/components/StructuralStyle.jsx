import { useState } from "react";
import ExpandableCard from "./ExpandableCard";

/* Section 3 -- Writing Style & Tone -> Structural Style.
 *
 * evidence.style is a fixed set of six metrics, each already carrying
 * {input, brand_mean, z}. The z-score is the API's own measurement of how far
 * the input sits from the brand's envelope; the colour bands (green <1,
 * yellow 1-2, red >2) are the one interpretive rule this component adds, and
 * they are stated as such in the legend rather than left implicit.
 *
 * Renders through ExpandableCard -- the same full-width, click-to-expand row
 * chrome the per-layer cards use -- so this reads as one more row in the same
 * family rather than a narrower side panel. "View details" toggles the table
 * *inside* the expanded row, it does not control the row itself.
 */

const METRIC_META = {
  mean_sentence_len: { chip: "Sentence length", table: "Mean Sentence Length" },
  sentence_len_sd: { chip: "Sentence variation", table: "Sentence Length Variation" },
  flesch_kincaid: { chip: "Readability", table: "Readability (grade level)" },
  bullet_ratio: { chip: "Bullet usage", table: "Bullet Ratio" },
  passive_ratio: { chip: "Passive voice", table: "Passive Voice" },
  exclaim_per_100w: { chip: "Exclamations", table: "Exclamation Density" },
};

const METRIC_ORDER = [
  "mean_sentence_len", "sentence_len_sd", "flesch_kincaid",
  "bullet_ratio", "passive_ratio", "exclaim_per_100w",
];

function zColor(z) {
  if (z < 1) return "var(--positive)";
  if (z <= 2) return "var(--series-2)";
  return "var(--negative)";
}

function chipFor(key, f) {
  const meta = METRIC_META[key];
  if (f.z < 1) return { icon: "✓", text: `${meta.chip} matches brand`, tone: "ok" };
  const higher = f.input > f.brand_mean;
  const word = key === "flesch_kincaid"
    ? (higher ? "more complex" : "simpler")
    : (higher ? "higher" : "lower");
  return {
    icon: "⚠",
    text: `${meta.chip} is ${f.z > 2 ? "well " : "slightly "}${word} than brand`,
    tone: f.z > 2 ? "bad" : "warn",
  };
}

export default function StructuralStyle({ style }) {
  const [showTable, setShowTable] = useState(false);
  const entries = METRIC_ORDER.filter((k) => style?.[k]).map((k) => [k, style[k]]);
  if (!entries.length) return null;

  return (
    <>
    <ExpandableCard title={<span className="exp-title">Structural style</span>}>
      <div className="structural">
        <div className="chip-deck">
          {entries.map(([k, f]) => {
            const c = chipFor(k, f);
            const title = `Input ${f.input.toFixed(2)} vs brand ${f.brand_mean.toFixed(2)} (z=${f.z.toFixed(2)}).`;
            return (
              <span key={k} className={`dev-chip ${c.tone}`} title={title}>
                <span className="dev-icon">{c.icon}</span> {c.text}
              </span>
            );
          })}
        </div>

        <button className="ghost view-details" onClick={() => setShowTable((v) => !v)}>
          {showTable ? "Hide details" : "View details"}
        </button>

        {showTable && (
          <div className="scroll-x details-table">
            <table>
              <thead>
                <tr><th>Metric</th><th className="num">Input</th><th className="num">Brand</th><th className="num">Z-score</th></tr>
              </thead>
              <tbody>
                {entries.map(([k, f]) => (
                  <tr key={k}>
                    <td>{METRIC_META[k].table}</td>
                    <td className="num">{f.input.toFixed(2)}</td>
                    <td className="num">{f.brand_mean.toFixed(2)}</td>
                    <td className="num">
                      <span className="z-value">
                        <span className="z-dot" style={{ background: zColor(f.z) }} />
                        {f.z.toFixed(2)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="z-legend">
              <span><span className="z-dot" style={{ background: "var(--positive)" }} /> &lt; 1 matches</span>
              <span><span className="z-dot" style={{ background: "var(--series-2)" }} /> 1–2 differs</span>
              <span><span className="z-dot" style={{ background: "var(--negative)" }} /> &gt; 2 differs a lot</span>
            </div>
          </div>
        )}
      </div>
    </ExpandableCard>

    {/* Sibling of ExpandableCard, not inside its children -- children only
        mount while the row is open, so a <style> tag nested there would be
        removed from the DOM every time the row collapses. */}
      <style>{`
        .structural { display: flex; flex-direction: column; gap: 14px; }
        .chip-deck { display: flex; flex-wrap: wrap; gap: 8px; }
        .dev-chip {
          display: inline-flex; align-items: center; gap: 6px;
          font-size: var(--t-small); font-weight: 560; padding: 6px 12px;
          border-radius: var(--r-pill); border: 1px solid var(--line);
          background: var(--surface-sunken); color: var(--text-2);
        }
        .dev-chip.ok { border-color: color-mix(in srgb, var(--positive) 30%, transparent); color: var(--positive); background: color-mix(in srgb, var(--positive) 8%, transparent); }
        .dev-chip.warn { border-color: color-mix(in srgb, var(--series-2) 30%, transparent); color: var(--series-2); background: color-mix(in srgb, var(--series-2) 8%, transparent); }
        .dev-chip.bad { border-color: color-mix(in srgb, var(--negative) 30%, transparent); color: var(--negative); background: color-mix(in srgb, var(--negative) 8%, transparent); }
        .dev-icon { font-size: 12px; }

        .view-details { align-self: flex-start; }

        .z-value { display: inline-flex; align-items: center; gap: 6px; }
        .z-dot { width: 7px; height: 7px; border-radius: 50%; flex: none; }
        .z-legend {
          display: flex; gap: 16px; flex-wrap: wrap; margin-top: 10px;
          font-size: var(--t-tiny); color: var(--text-3);
        }
        .z-legend span { display: inline-flex; align-items: center; gap: 6px; }
      `}</style>
    </>
  );
}
