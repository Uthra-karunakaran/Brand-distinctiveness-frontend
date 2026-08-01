import ExpandableCard from "./ExpandableCard";

/* Section 3 -- Writing Style & Tone -> Structural Style.
 *
 * evidence.style is a fixed set of six metrics, each already carrying
 * {input, brand_mean, z}. The z-score is the API's own measurement of how far
 * the input sits from the brand's envelope; the colour bands (green <1,
 * yellow 1-2, red >2) are the one interpretive rule this component adds, and
 * each chip states its result in words rather than leaving the band implicit.
 *
 * Renders through ExpandableCard -- the same full-width, click-to-expand row
 * chrome the per-layer cards use -- so this reads as one more row in the same
 * family rather than a narrower side panel. The underlying numbers stay
 * reachable on hover; there is deliberately no second nested toggle here.
 */

const METRIC_META = {
  mean_sentence_len: { chip: "Sentence length" },
  sentence_len_sd: { chip: "Sentence variation" },
  flesch_kincaid: { chip: "Readability" },
  bullet_ratio: { chip: "Bullet usage" },
  passive_ratio: { chip: "Passive voice" },
  exclaim_per_100w: { chip: "Exclamations" },
};

const METRIC_ORDER = [
  "mean_sentence_len", "sentence_len_sd", "flesch_kincaid",
  "bullet_ratio", "passive_ratio", "exclaim_per_100w",
];

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
  const entries = METRIC_ORDER.filter((k) => style?.[k]).map((k) => [k, style[k]]);
  if (!entries.length) return null;

  return (
    <>
      <ExpandableCard title={<span className="exp-title">Writing Style</span>}>
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
      `}</style>
    </>
  );
}
