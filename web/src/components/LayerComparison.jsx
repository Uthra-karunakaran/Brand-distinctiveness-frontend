import { quadrantMeta } from "../lib/quadrant";

/* Bottom-of-page layer comparison: one pillar per layer, consistency and
 * distinctiveness as two bars growing from a shared baseline, so a reader
 * can compare all three layers' shape at a glance rather than reading three
 * separate cards top to bottom. */
export default function LayerComparison({ layers }) {
  if (!layers?.length) return null;

  return (
    <div className="pillars">
      {layers.map((l) => {
        const q = quadrantMeta(l.quadrant);
        return (
          <div className="pillar" key={l.layer}>
            <div className="pillar-bars">
              <div className="pillar-bar">
                <span className="pillar-value">{l.consistency}</span>
                <div className="pillar-track">
                  <div className="pillar-fill" style={{ height: `${l.consistency}%`, background: "var(--series-1)" }} />
                </div>
                <span className="pillar-caption">Consistency</span>
              </div>
              <div className="pillar-bar">
                <span className="pillar-value">{l.distinctiveness}</span>
                <div className="pillar-track">
                  <div className="pillar-fill" style={{ height: `${l.distinctiveness}%`, background: "var(--series-3)" }} />
                </div>
                <span className="pillar-caption">Distinctiveness</span>
              </div>
            </div>
            <span className="pillar-title">{l.layer}</span>
            <span className="pillar-quadrant" style={{ color: q.color }}>{q.icon} {q.label}</span>
          </div>
        );
      })}

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
        .pillar-quadrant { font-size: var(--t-tiny); font-weight: 560; }
      `}</style>
    </div>
  );
}
