import { quadrantMeta, quadrantSoft, quadrantBorder } from "../lib/quadrant";

/* The closing card: the same two overall figures the hero opened with, the
 * quadrant explanation, and one line of synthesis. `insight` is a fixed
 * sentence keyed off the API's own quadrant string (lib/quadrant.js) -- it
 * does not re-derive or guess at anything the scorer didn't already say. */
export default function FinalSummary({ report }) {
  const q = quadrantMeta(report.overall_quadrant);

  return (
    <div
      className="final-summary"
      style={{ "--q": q.color, "--q-soft": quadrantSoft(q.color), "--q-border": quadrantBorder(q.color) }}
    >
      <div className="fs-metrics">
        <div className="fs-metric">
          <span className="fs-label">Overall On-Brand Score</span>
          <span className="fs-value">{report.overall_consistency}</span>
        </div>
        <div className="fs-metric">
          <span className="fs-label">Overall Stand-Out Score</span>
          <span className="fs-value">{report.overall_distinctiveness}</span>
        </div>
      </div>

      <div className="fs-quadrant-row">
        <span className="fs-quadrant-label">Verdict</span>
        <p className="fs-note">{report.overall_note}</p>
      </div>

      {q.insight && (
        <div className="fs-callout">
          <span className="fs-callout-label">The Bottom Line</span>
          <p className="fs-insight">{q.insight}</p>
        </div>
      )}

      <style>{`
        .final-summary {
          background: linear-gradient(180deg, var(--q-soft) 0%, var(--surface) 55%);
          border: 1px solid var(--q-border); border-radius: var(--r-lg);
          padding: 26px 28px; display: flex; flex-direction: column; gap: 18px;
        }
        .fs-metrics { display: flex; flex-wrap: wrap; gap: 32px; }
        .fs-metric { display: flex; flex-direction: column; gap: 3px; }
        .fs-label { font-size: var(--t-tiny); font-weight: 660; color: var(--text-3); }
        .fs-value { font-size: 26px; font-weight: 640; color: var(--text); font-variant-numeric: tabular-nums; }

        .fs-quadrant-row { display: flex; align-items: baseline; gap: 10px; flex-wrap: wrap; }
        .fs-quadrant-label {
          font-size: var(--t-micro); font-weight: 660; letter-spacing: 0.07em;
          text-transform: uppercase; color: var(--text-3); flex: none;
        }
        .fs-note { margin: 0; font-size: var(--t-body); color: var(--text-2); }

        .fs-callout {
          display: flex; flex-direction: column; gap: 6px;
          padding: 16px 18px; border-radius: var(--r-md);
          background: var(--surface); border: 1px solid var(--q-border);
          border-left: 4px solid var(--q);
        }
        .fs-callout-label {
          font-size: var(--t-micro); font-weight: 660; letter-spacing: 0.08em;
          text-transform: uppercase; color: var(--q);
        }
        .fs-insight {
          margin: 0; font-size: var(--t-lead); font-weight: 560; color: var(--text); line-height: 1.55;
        }
      `}</style>
    </div>
  );
}
