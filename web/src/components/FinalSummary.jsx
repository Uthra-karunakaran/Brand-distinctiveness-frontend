import { quadrantMeta, quadrantSoft, quadrantBorder } from "../lib/quadrant";

/* The closing card: the same three overall figures the hero opened with, plus
 * one line of synthesis. `insight` is a fixed sentence keyed off the API's own
 * quadrant string (lib/quadrant.js) -- it does not re-derive or guess at
 * anything the scorer didn't already say. */
export default function FinalSummary({ report }) {
  const q = quadrantMeta(report.overall_quadrant);

  return (
    <div
      className="final-summary"
      style={{ "--q": q.color, "--q-soft": quadrantSoft(q.color), "--q-border": quadrantBorder(q.color) }}
    >
      <div className="fs-metrics">
        <div className="fs-metric">
          <span className="fs-label">Overall consistency</span>
          <span className="fs-value">{report.overall_consistency}</span>
        </div>
        <div className="fs-metric">
          <span className="fs-label">Overall distinctiveness</span>
          <span className="fs-value">{report.overall_distinctiveness}</span>
        </div>
        <div className="fs-metric">
          <span className="fs-label">Quadrant</span>
          <span className="fs-badge">{q.icon} {q.label}</span>
        </div>
      </div>
      <p className="fs-note">{report.overall_note}</p>
      {q.insight && <p className="fs-insight">{q.insight}</p>}

      <style>{`
        .final-summary {
          background: linear-gradient(180deg, var(--q-soft) 0%, var(--surface) 55%);
          border: 1px solid var(--q-border); border-radius: var(--r-lg);
          padding: 26px 28px; display: flex; flex-direction: column; gap: 16px;
        }
        .fs-metrics { display: flex; flex-wrap: wrap; gap: 32px; }
        .fs-metric { display: flex; flex-direction: column; gap: 3px; }
        .fs-label { font-size: var(--t-tiny); color: var(--text-3); }
        .fs-value { font-size: 26px; font-weight: 640; color: var(--text); font-variant-numeric: tabular-nums; }
        .fs-badge { font-size: var(--t-lead); font-weight: 640; color: var(--q); }
        .fs-note { margin: 0; font-size: var(--t-body); color: var(--text-2); }
        .fs-insight {
          margin: 0; padding-top: 12px; border-top: 1px solid var(--line);
          font-size: var(--t-lead); font-weight: 540; color: var(--text); line-height: 1.55;
        }
      `}</style>
    </div>
  );
}
