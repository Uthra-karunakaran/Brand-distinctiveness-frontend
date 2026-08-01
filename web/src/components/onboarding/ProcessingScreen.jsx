import { useEffect, useState } from "react";
import CircularProgress from "../CircularProgress";

/* Step 2 of onboarding: the wait.
 *
 * Three things are on screen because a progress bar alone doesn't answer the
 * question people actually have during a wait, which is "is it stuck?":
 *
 *   - the ring gives the overall figure the server reports,
 *   - the step list names what is happening right now, so movement is visible
 *     even while the percentage sits still,
 *   - the skeleton shows the shape of what is coming, so the next screen is
 *     not a surprise layout shift.
 *
 * The elapsed counter is local and cosmetic; every other number here comes
 * from the job the API returned.
 */
export default function ProcessingScreen({ job, brandName }) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const steps = job?.steps ?? [];
  const active = steps.find((s) => s.state === "active");

  return (
    <div className="proc">
      <div className="proc-card">
        <div className="proc-ring">
          <CircularProgress value={job?.progress ?? 0} size={132} thickness={9} suffix="%" />
          <span className="proc-ring-label">analysed</span>
        </div>

        <div className="proc-copy">
          <span className="ob-eyebrow">Analysing</span>
          <h2>{brandName}</h2>
          <p className="proc-now">
            {active ? active.detail : "Wrapping up the last checks…"}
          </p>
          <div className="proc-meta">
            <span className="proc-live"><span className="proc-live-dot" /> Live</span>
            <span>{elapsed}s elapsed</span>
            <span>Usually about 15 seconds</span>
          </div>
        </div>
      </div>

      <ol className="proc-steps">
        {steps.map((s) => (
          <li key={s.key} className={`proc-step ${s.state}`}>
            <span className="proc-step-mark" aria-hidden="true">
              {s.state === "done" ? (
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M2.5 6.3l2.4 2.4L9.6 3.9" stroke="currentColor" strokeWidth="1.8"
                    strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ) : s.state === "active" ? <span className="proc-pulse" /> : <span className="proc-idle" />}
            </span>
            <span className="proc-step-body">
              <span className="proc-step-label">{s.label}</span>
              <span className="proc-step-detail">{s.detail}</span>
            </span>
            <span className="proc-step-state">
              {s.state === "done" ? "Done" : s.state === "active" ? "Working" : "Queued"}
            </span>
          </li>
        ))}
      </ol>

      {/* The shape of the preview, held open so the next screen doesn't jump. */}
      <div className="proc-skeleton" aria-hidden="true">
        <div className="proc-skel-head">
          <span className="shimmer" style={{ width: 46, height: 46, borderRadius: 12 }} />
          <span className="proc-skel-lines">
            <span className="shimmer" style={{ width: "38%", height: 15 }} />
            <span className="shimmer" style={{ width: "56%", height: 11 }} />
          </span>
        </div>
        <div className="proc-skel-grid">
          {[0, 1, 2, 3].map((i) => (
            <span className="shimmer" key={i} style={{ height: i < 2 ? 84 : 108 }} />
          ))}
        </div>
      </div>

      <style>{`
        .proc { display: flex; flex-direction: column; gap: var(--gap); }

        .proc-card {
          display: flex; align-items: center; gap: 28px; flex-wrap: wrap;
          background: linear-gradient(180deg, var(--series-1-soft) 0%, var(--surface) 62%);
          border: 1px solid color-mix(in srgb, var(--series-1) 22%, transparent);
          border-radius: var(--r-lg); box-shadow: var(--e2); padding: 26px 28px;
        }
        .proc-ring { display: flex; flex-direction: column; align-items: center; gap: 6px; flex: none; }
        .proc-ring-label {
          font-size: var(--t-micro); font-weight: 660; letter-spacing: 0.08em;
          text-transform: uppercase; color: var(--text-3);
        }
        .proc-copy { flex: 1 1 260px; min-width: 0; display: flex; flex-direction: column; gap: 5px; }
        .proc-copy h2 {
          margin: 0; font-size: 26px; font-weight: 660; letter-spacing: -0.02em; color: var(--text);
        }
        .proc-now { margin: 2px 0 0; font-size: var(--t-lead); color: var(--text-2); max-width: 52ch; }
        .proc-meta {
          display: flex; flex-wrap: wrap; gap: 6px 16px; margin-top: 8px;
          font-size: var(--t-tiny); color: var(--text-3);
        }
        .proc-live { display: inline-flex; align-items: center; gap: 6px; color: var(--series-1); font-weight: 560; }
        .proc-live-dot {
          width: 7px; height: 7px; border-radius: 50%; background: var(--series-1);
          animation: proc-blink 1.6s var(--ease) infinite;
        }
        @keyframes proc-blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.25; } }

        .proc-steps {
          list-style: none; margin: 0; padding: 8px 0;
          background: var(--surface); border: 1px solid var(--line);
          border-radius: var(--r-lg); box-shadow: var(--e1);
        }
        .proc-step {
          display: flex; align-items: center; gap: 14px; padding: 11px 22px;
          transition: background 200ms var(--ease);
        }
        .proc-step.active { background: var(--series-1-soft); }
        .proc-step-mark {
          flex: none; width: 22px; height: 22px; border-radius: 50%;
          display: grid; place-items: center;
          background: var(--surface-sunken); border: 1px solid var(--line-strong);
          color: var(--text-3);
        }
        .proc-step.done .proc-step-mark {
          background: color-mix(in srgb, var(--positive) 12%, transparent);
          border-color: color-mix(in srgb, var(--positive) 34%, transparent);
          color: var(--positive);
        }
        .proc-step.active .proc-step-mark {
          background: var(--surface); border-color: var(--series-1);
        }
        .proc-idle { width: 5px; height: 5px; border-radius: 50%; background: var(--axis); }
        .proc-pulse {
          width: 8px; height: 8px; border-radius: 50%; background: var(--series-1);
          animation: proc-pulse 1.4s var(--ease) infinite;
        }
        @keyframes proc-pulse {
          0% { box-shadow: 0 0 0 0 color-mix(in srgb, var(--series-1) 55%, transparent); }
          70% { box-shadow: 0 0 0 7px transparent; }
          100% { box-shadow: 0 0 0 0 transparent; }
        }

        .proc-step-body { flex: 1 1 auto; min-width: 0; display: flex; flex-direction: column; }
        .proc-step-label { font-size: var(--t-body); font-weight: 560; color: var(--text-2); }
        .proc-step.active .proc-step-label { color: var(--text); font-weight: 620; }
        .proc-step.done .proc-step-label { color: var(--text-2); }
        .proc-step.pending .proc-step-label { color: var(--text-3); }
        .proc-step-detail { font-size: var(--t-tiny); color: var(--text-3); }
        .proc-step.pending .proc-step-detail { opacity: 0.7; }
        .proc-step-state {
          flex: none; font-size: var(--t-micro); font-weight: 660; letter-spacing: 0.06em;
          text-transform: uppercase; color: var(--text-3);
        }
        .proc-step.active .proc-step-state { color: var(--series-1); }
        .proc-step.done .proc-step-state { color: var(--positive); }

        .proc-skeleton {
          background: var(--surface); border: 1px solid var(--line);
          border-radius: var(--r-lg); padding: 20px; display: flex;
          flex-direction: column; gap: 18px; opacity: 0.85;
        }
        .proc-skel-head { display: flex; align-items: center; gap: 14px; }
        .proc-skel-lines { flex: 1 1 auto; display: flex; flex-direction: column; gap: 8px; }
        .proc-skel-lines .shimmer { display: block; border-radius: 5px; }
        .proc-skel-grid { display: grid; grid-template-columns: 1fr 1fr; gap: var(--gap); }
        .proc-skel-grid .shimmer { display: block; border-radius: var(--r-md); }
        @media (max-width: 700px) { .proc-skel-grid { grid-template-columns: 1fr; } }
      `}</style>
    </div>
  );
}
