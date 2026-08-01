import CircularProgress from "./CircularProgress";
import { quadrantMeta, quadrantBorder, quadrantSoft } from "../lib/quadrant";

/* Section 1 -- At a Glance.
 *
 * Every value here comes straight off the Report's top-level fields:
 * overall_consistency, overall_distinctiveness, overall_quadrant, overall_note.
 * Nothing is blended or derived -- this is the API's own headline number,
 * rendered, not a composite invented on this side.
 */
export default function HeroSection({ report }) {
  const q = quadrantMeta(report.overall_quadrant);

  return (
    <div className="hero-section">
      <div className="hero-eyebrow">
        <span className="eyebrow"> At a glance</span>
        <h1 className="hero-brand">{report.brand}</h1>
      </div>

      <div className="hero-cards">
        <div className="hero-card">
          <span
            className="hero-card-label"
            title="Weighted average across identity, messaging and voice: how closely this copy's language, tone and structure match the brand's own."
          >
            Consistency
          </span>
          <CircularProgress value={report.overall_consistency} color="var(--series-1)" />
          <span className="hero-caption">How closely this sounds like the brand</span>
        </div>

        <div className="hero-card">
          <span
            className="hero-card-label"
            title="Weighted average across identity, messaging and voice: how far this copy sits from generic category language and competitor phrasing."
          >
            Distinctiveness
          </span>
          <CircularProgress value={report.overall_distinctiveness} color="var(--series-3)" />
          <span className="hero-caption">How far this sits from category boilerplate</span>
        </div>

        <div
          className="hero-card hero-quadrant"
          style={{ "--q": q.color, "--q-soft": quadrantSoft(q.color), "--q-border": quadrantBorder(q.color) }}
        >
          <span
            className="hero-card-label"
            title="Where consistency and distinctiveness intersect: Ideal (both high), On-brand but generic (consistent, not distinctive), Unique but off-brand (distinctive, not consistent), or Lost (neither)."
          >
            Quadrant
          </span>
          {/* Fixed to the same 128px box CircularProgress renders, so the
              badge sits at exactly the height the rings do in the other two
              cards regardless of how long the quadrant label is. */}
          <div className="hero-quadrant-ring">
            <span className="hero-quadrant-badge">
              <span className="hero-quadrant-icon">{q.icon}</span>
              {q.label}
            </span>
          </div>
          <p className="hero-caption">{report.overall_note}</p>
        </div>
      </div>

      <style>{`
        .hero-section { display: flex; flex-direction: column; gap: 20px; }
        .hero-eyebrow { display: flex; flex-direction: column; gap: 4px; }
        .eyebrow {
          font-size: var(--t-micro); font-weight: 660; letter-spacing: 0.09em;
          text-transform: uppercase; color: var(--text-3);
        }
        .hero-brand {
          margin: 0; font-size: 28px; font-weight: 660; letter-spacing: -0.02em;
          color: var(--text);
        }

        .hero-cards {
          display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--gap);
        }
        @media (max-width: 900px) { .hero-cards { grid-template-columns: 1fr; } }

        .hero-card {
          background: var(--surface); border: 1px solid var(--line);
          border-radius: var(--r-lg); box-shadow: var(--e1);
          padding: 28px 24px; display: flex; flex-direction: column;
          align-items: center; gap: 14px; text-align: center;
          transition: box-shadow 180ms var(--ease);
        }
        .hero-card:hover { box-shadow: var(--e2); }

        .hero-card-label {
          font-size: var(--t-micro); font-weight: 660; letter-spacing: 0.08em;
          text-transform: uppercase; color: var(--text-3);
        }
        .hero-caption { margin: 0; font-size: var(--t-small); color: var(--text-2); max-width: 26ch; }

        .hero-quadrant {
          background: linear-gradient(180deg, var(--q-soft) 0%, var(--surface) 65%);
          border-color: var(--q-border);
        }
        .hero-quadrant-ring {
          width: 128px; height: 128px; flex: none;
          display: flex; align-items: center; justify-content: center;
        }
        .hero-quadrant-badge {
          display: inline-flex; align-items: center; gap: 9px; flex-wrap: wrap;
          justify-content: center;
          font-size: 21px; font-weight: 640; color: var(--q); line-height: 1.25;
        }
        .hero-quadrant-icon { font-size: 22px; line-height: 1; }
      `}</style>
    </div>
  );
}
