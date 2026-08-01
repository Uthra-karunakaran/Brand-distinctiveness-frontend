import { layerLabel } from "../lib/layerLabels";

/* Bottom-of-page layer comparison: one pillar per layer, consistency and
 * distinctiveness as two bars growing from a shared baseline, so a reader
 * can compare all three layers' shape at a glance rather than reading three
 * separate cards top to bottom. The per-layer quadrant is already shown on
 * each row in "Why it scored this way" above -- repeating it here was noise,
 * so this view stays to the two numbers the bars exist to compare. */
export default function LayerComparison({ layers }) {
  if (!layers?.length) return null;

  return (
    <div className="pillars">
      {layers.map((l) => (
        <div className="pillar" key={l.layer}>
          <div className="pillar-bars">
            <div className="pillar-bar">
              <span className="pillar-value">{l.consistency}</span>
              <div className="pillar-track">
                <div className="pillar-fill" style={{ height: `${l.consistency}%`, background: "var(--series-1)" }} />
              </div>
              <span className="pillar-caption">On-Brand Score</span>
            </div>
            <div className="pillar-bar">
              <span className="pillar-value">{l.distinctiveness}</span>
              <div className="pillar-track">
                <div className="pillar-fill" style={{ height: `${l.distinctiveness}%`, background: "var(--series-3)" }} />
              </div>
              <span className="pillar-caption">Stand-Out Score</span>
            </div>
          </div>
          <span className="pillar-title">{layerLabel(l.layer)}</span>
        </div>
      ))}

      <style>{`
        .pillars {
          display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
          gap: 20px; align-items: end;
        }
        .pillar {
          display: flex; flex-direction: column; align-items: center; gap: 10px;
        }
        .pillar-bars { display: flex; gap: 14px; align-items: end; height: 180px; }
        .pillar-bar { display: flex; flex-direction: column; align-items: center; gap: 6px; height: 100%; }
        .pillar-value {
          font-size: var(--t-small); font-weight: 620; color: var(--text);
          font-variant-numeric: tabular-nums;
        }
        .pillar-track {
          width: 26px; flex: 1 1 auto; border-radius: var(--r-sm);
          background: var(--seq-track); display: flex; align-items: end; overflow: hidden;
        }
        .pillar-fill {
          width: 100%; border-radius: var(--r-sm) var(--r-sm) 0 0;
          transition: height 700ms var(--ease);
        }
        .pillar-caption { font-size: var(--t-micro); color: var(--text-3); }
        .pillar-title {
          font-size: var(--t-body); font-weight: 620; text-transform: capitalize; color: var(--text);
        }
      `}</style>
    </div>
  );
}
