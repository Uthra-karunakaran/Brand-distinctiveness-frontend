/* Section 3 -- Writing Style & Tone -> Tone Analysis.
 *
 * evidence.tone_input / tone_brand are five axes on a 0-10 scale; each row
 * places both as markers on one track rather than a radar chart, which reads
 * clearly at a glance and animates well. `alignmentScore` is not computed
 * here -- it is the API's own tone contribution value (identical across
 * layers, since tone is scored once per document), passed in by the caller
 * so this component never invents a number the scorer didn't produce.
 */

const AXES = [
  { key: "formal_casual", left: "Formal", right: "Casual" },
  { key: "serious_playful", left: "Serious", right: "Playful" },
  { key: "corporate_human", left: "Corporate", right: "Human" },
  { key: "restrained_bold", left: "Restrained", right: "Bold" },
  { key: "technical_accessible", left: "Technical", right: "Accessible" },
];

export default function ToneAnalysis({ toneInput, toneBrand, biggestGap, alignmentScore, judge }) {
  if (!toneInput || !toneBrand) return null;

  return (
    <div className="tone">
      {AXES.map(({ key, left, right }) => {
        const brandPct = ((toneBrand[key] ?? 0) / 10) * 100;
        const inputPct = ((toneInput[key] ?? 0) / 10) * 100;
        const isGap = key === biggestGap;
        return (
          <div
            className={`tone-row${isGap ? " gap" : ""}`} key={key}
            title={`${left} ↔ ${right}: brand ${(toneBrand[key] ?? 0).toFixed(1)}, this copy ${(toneInput[key] ?? 0).toFixed(1)} (0–10 scale).`}
          >
            <div className="tone-labels">
              <span>{left}</span>
              {isGap && <span className="gap-tag">Largest gap</span>}
              <span>{right}</span>
            </div>
            <div className="tone-track">
              <span
                className="tone-marker brand" style={{ left: `${brandPct}%` }}
                title={`Brand: ${(toneBrand[key] ?? 0).toFixed(1)} / 10`}
              />
              <span
                className="tone-marker input" style={{ left: `${inputPct}%` }}
                title={`Input: ${(toneInput[key] ?? 0).toFixed(1)} / 10`}
              />
            </div>
          </div>
        );
      })}

      <div className="tone-legend">
        <span><span className="dot brand" /> Brand profile</span>
        <span><span className="dot input" /> Input profile</span>
      </div>

      <div className="tone-summary">
        <div>
          <span className="ts-label">Overall tone alignment</span>
          <span className="ts-value">{alignmentScore === null || alignmentScore === undefined ? "—" : Math.round(alignmentScore)}</span>
        </div>
        <div>
          <span className="ts-label">Judge used</span>
          <span className="ts-value cap">{judge ?? "—"}</span>
        </div>
      </div>

      <style>{`
        .tone { display: flex; flex-direction: column; gap: 18px; }
        .tone-row { display: flex; flex-direction: column; gap: 8px; }
        .tone-labels {
          display: flex; justify-content: space-between; align-items: center;
          font-size: var(--t-small); color: var(--text-2); font-weight: 560;
        }
        .gap-tag {
          font-size: var(--t-micro); font-weight: 660; letter-spacing: 0.05em;
          text-transform: uppercase; color: var(--series-2);
          background: color-mix(in srgb, var(--series-2) 12%, transparent);
          padding: 2px 8px; border-radius: var(--r-pill);
        }
        .tone-track {
          position: relative; height: 6px; border-radius: var(--r-pill);
          background: var(--seq-track);
        }
        .tone-marker {
          position: absolute; top: 50%; width: 14px; height: 14px;
          border-radius: 50%; transform: translate(-50%, -50%);
          border: 2px solid var(--surface); box-shadow: var(--e1);
          transition: left 700ms var(--ease);
        }
        .tone-marker.brand { background: var(--text-3); z-index: 1; }
        .tone-marker.input { background: var(--series-1); z-index: 2; }

        .tone-legend {
          display: flex; gap: 18px; font-size: var(--t-tiny); color: var(--text-3);
          padding-top: 4px; border-top: 1px solid var(--grid);
        }
        .tone-legend span { display: inline-flex; align-items: center; gap: 6px; }
        .dot { width: 9px; height: 9px; border-radius: 50%; }
        .dot.brand { background: var(--text-3); }
        .dot.input { background: var(--series-1); }

        .tone-summary {
          display: flex; gap: 32px; flex-wrap: wrap; padding-top: 6px;
        }
        .tone-summary > div { display: flex; flex-direction: column; gap: 2px; }
        .ts-label { font-size: var(--t-tiny); color: var(--text-3); }
        .ts-value { font-size: 20px; font-weight: 640; color: var(--text); font-variant-numeric: tabular-nums; }
        .ts-value.cap { text-transform: capitalize; font-size: var(--t-lead); }
      `}</style>
    </div>
  );
}
