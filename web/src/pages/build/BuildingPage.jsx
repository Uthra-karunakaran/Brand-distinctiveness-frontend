import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { JOB_STAGES, pollJob } from "../../api/brands";
import CircularProgress from "../../components/CircularProgress";
import { loadDraft, markJobResolved } from "../../state/brandDraft";

/* The wait after every POST /brands/{id}/embeddings, Quick Start's included.
 *
 * There is no numeric progress from the server -- only a `stage` string that
 * moves through exactly JOB_STAGES. The ring's percentage is derived from
 * the stage's position in that list, not invented or smoothed; it is
 * intentionally coarse (5 even steps) because that is genuinely all the
 * signal there is. Driving the step list off `stage` directly, rather than
 * off a local timer, is what keeps this screen honest if a real build takes
 * 3 seconds one time and 30 the next.
 *
 * On the terminal job this screen routes by outcome:
 *   ready                      -> enrichment, every time. There is no
 *                                  separate "first score" step -- Quick
 *                                  Start's own build lands here exactly the
 *                                  same as any later save's does.
 *   failed mvbf_not_met        -> back to quick start, fields flagged
 *   failed unknown_industry    -> back to the industry picker
 *   failed unmapped_asset_type -> shown here; this is a frontend bug, not a
 *                                  user mistake, so there is nothing to send
 *                                  the user off to fix
 *   failed internal_error/*    -> shown here, with retry
 */
export default function BuildingPage() {
  const { brandId } = useParams();
  const navigate = useNavigate();

  const [draft] = useState(() => loadDraft(brandId));
  const [job, setJob] = useState(null);
  const [pollError, setPollError] = useState(null);
  const [elapsed, setElapsed] = useState(0);
  const startedRef = useRef(performance.now());

  useEffect(() => {
    const id = setInterval(() => setElapsed(Math.round((performance.now() - startedRef.current) / 1000)), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!draft?.jobId) {
      // Nothing to poll -- a bookmarked/refreshed URL with no job behind it.
      // Send the user somewhere that can start one.
      navigate(draft ? `/brands/${brandId}/enrich` : `/brands/${brandId}/quick-start`, { replace: true });
      return undefined;
    }

    const controller = new AbortController();
    pollJob(draft.jobId, { onTick: setJob, signal: controller.signal })
      .then((finalJob) => {
        setJob(finalJob);
        const next = markJobResolved(draft, finalJob);

        if (finalJob.status === "ready") {
          navigate(`/brands/${brandId}/enrich`, {
            state: { warnings: finalJob.warnings ?? [] }, replace: true,
          });
          return;
        }

        const code = finalJob.error?.code;
        if (code === "mvbf_not_met") {
          navigate(`/brands/${brandId}/quick-start`, {
            state: { fieldErrors: finalJob.error.fields ?? [] }, replace: true,
          });
        } else if (code === "unknown_industry") {
          navigate(`/brands/${brandId}/competitors`, {
            state: { message: finalJob.error.message }, replace: true,
          });
        }
        // unmapped_asset_type / internal_error / anything else: render inline below.
        void next;
      })
      .catch((e) => {
        if (e.name !== "AbortError") setPollError(e.message);
      });

    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft?.jobId]);

  const stageIndex = job ? Math.max(0, JOB_STAGES.findIndex((s) => s.key === job.stage)) : 0;
  const ringPct = job?.status === "ready" || job?.status === "failed"
    ? 100
    : Math.round(((stageIndex + 0.5) / JOB_STAGES.length) * 100);

  const inlineFailure = job?.status === "failed"
    && job.error?.code !== "mvbf_not_met" && job.error?.code !== "unknown_industry";

  return (
    <main className="page">
      <div className="bld">
        {/* Going back doesn't cancel the job -- the poll here just stops
            watching it, the server keeps building. Landing back on Enrich
            mid-build is safe: saving again there correctly hits 409 until
            this job resolves. */}
        <button className="quiet bld-back" onClick={() => navigate(`/brands/${brandId}/enrich`)}>
          ← Back
        </button>

        <div className="bld-card">
          <CircularProgress value={pollError ? 0 : ringPct} size={132} thickness={9} suffix="%" />
          <div className="bld-copy">
            <span className="ob-eyebrow">Building</span>
            <h2>{draft?.brandName ?? "Your brand"}</h2>
            <p className="bld-now">
              {pollError
                ? "Lost contact with the build."
                : inlineFailure
                  ? "The build hit a problem."
                  : (JOB_STAGES.find((s) => s.key === job?.stage)?.label ?? "Starting…")}
            </p>
            <div className="bld-meta">
              <span className="bld-live"><span className="bld-live-dot" /> Live</span>
              <span>{elapsed}s elapsed</span>
            </div>
          </div>
        </div>

        <ol className="bld-steps">
          {JOB_STAGES.map((s, i) => {
            const state = job?.status === "ready" || i < stageIndex ? "done"
              : job?.status === "failed" && i === stageIndex ? (inlineFailure ? "error" : "done")
                : i === stageIndex ? "active" : "pending";
            return (
              <li key={s.key} className={`bld-step ${state}`}>
                <span className="bld-step-mark" aria-hidden="true">
                  {state === "done" ? (
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M2.5 6.3l2.4 2.4L9.6 3.9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ) : state === "error" ? (
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                      <path d="M2 2l6 6M8 2l-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                    </svg>
                  ) : state === "active" ? <span className="bld-pulse" /> : <span className="bld-idle" />}
                </span>
                <span className="bld-step-label">{s.label}</span>
                <span className="bld-step-state">
                  {state === "done" ? "Done" : state === "active" ? "Working" : state === "error" ? "Failed" : "Queued"}
                </span>
              </li>
            );
          })}
        </ol>

        {pollError && (
          <p className="error">
            <strong>Couldn't check on the build.</strong> {pollError}{" "}
            <button className="quiet" onClick={() => window.location.reload()}>Try again</button>
          </p>
        )}

        {inlineFailure && job.error?.code === "unmapped_asset_type" && (
          <p className="error">
            <strong>This is a bug, not something to fix on your end.</strong> {job.error.message}{" "}
            The asset keys sent to the server should only ever come from the schema this app fetched
            at load time — please report this.
          </p>
        )}

        {inlineFailure && job.error?.code !== "unmapped_asset_type" && (
          <p className="error">
            <strong>Something went wrong on our end.</strong> {job.error?.message ?? "Unknown error."}{" "}
            <button className="quiet" onClick={() => navigate(`/brands/${brandId}/enrich`)}>Back to your brand</button>
          </p>
        )}
      </div>

      <style>{`
        .bld { display: flex; flex-direction: column; gap: var(--gap); max-width: 760px; margin: 0 auto; }
        .ob-eyebrow {
          font-size: var(--t-micro); font-weight: 660; letter-spacing: 0.09em;
          text-transform: uppercase; color: var(--text-3);
        }

        .bld-back { align-self: flex-start; height: 30px; padding: 0 6px; color: var(--text-2); }

        .bld-card {
          display: flex; align-items: center; gap: 28px; flex-wrap: wrap;
          background: linear-gradient(180deg, var(--series-1-soft) 0%, var(--surface) 62%);
          border: 1px solid color-mix(in srgb, var(--series-1) 22%, transparent);
          border-radius: var(--r-lg); box-shadow: var(--e2); padding: 26px 28px;
        }
        .bld-copy { flex: 1 1 260px; min-width: 0; display: flex; flex-direction: column; gap: 4px; }
        .bld-copy h2 { margin: 0; font-size: 24px; font-weight: 660; letter-spacing: -0.02em; color: var(--text); }
        .bld-now { margin: 2px 0 0; font-size: var(--t-lead); color: var(--text-2); }
        .bld-meta { display: flex; gap: 16px; margin-top: 8px; font-size: var(--t-tiny); color: var(--text-3); }
        .bld-live { display: inline-flex; align-items: center; gap: 6px; color: var(--series-1); font-weight: 560; }
        .bld-live-dot { width: 7px; height: 7px; border-radius: 50%; background: var(--series-1); animation: bld-blink 1.6s var(--ease) infinite; }
        @keyframes bld-blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.25; } }

        .bld-steps {
          list-style: none; margin: 0; padding: 8px 0;
          background: var(--surface); border: 1px solid var(--line);
          border-radius: var(--r-lg); box-shadow: var(--e1);
        }
        .bld-step { display: flex; align-items: center; gap: 14px; padding: 11px 22px; transition: background 200ms var(--ease); }
        .bld-step.active { background: var(--series-1-soft); }
        .bld-step.error { background: color-mix(in srgb, var(--negative) 8%, transparent); }
        .bld-step-mark {
          flex: none; width: 22px; height: 22px; border-radius: 50%; display: grid; place-items: center;
          background: var(--surface-sunken); border: 1px solid var(--line-strong); color: var(--text-3);
        }
        .bld-step.done .bld-step-mark {
          background: color-mix(in srgb, var(--positive) 12%, transparent);
          border-color: color-mix(in srgb, var(--positive) 34%, transparent); color: var(--positive);
        }
        .bld-step.active .bld-step-mark { background: var(--surface); border-color: var(--series-1); }
        .bld-step.error .bld-step-mark {
          background: color-mix(in srgb, var(--negative) 14%, transparent);
          border-color: color-mix(in srgb, var(--negative) 40%, transparent); color: var(--negative);
        }
        .bld-idle { width: 5px; height: 5px; border-radius: 50%; background: var(--axis); }
        .bld-pulse { width: 8px; height: 8px; border-radius: 50%; background: var(--series-1); animation: bld-pulse 1.4s var(--ease) infinite; }
        @keyframes bld-pulse {
          0% { box-shadow: 0 0 0 0 color-mix(in srgb, var(--series-1) 55%, transparent); }
          70% { box-shadow: 0 0 0 7px transparent; }
          100% { box-shadow: 0 0 0 0 transparent; }
        }
        .bld-step-label { flex: 1 1 auto; min-width: 0; font-size: var(--t-body); font-weight: 560; color: var(--text-2); }
        .bld-step.active .bld-step-label { color: var(--text); font-weight: 620; }
        .bld-step.error .bld-step-label { color: var(--negative); font-weight: 620; }
        .bld-step-state { flex: none; font-size: var(--t-micro); font-weight: 660; letter-spacing: 0.06em; text-transform: uppercase; color: var(--text-3); }
        .bld-step.active .bld-step-state { color: var(--series-1); }
        .bld-step.done .bld-step-state { color: var(--positive); }
        .bld-step.error .bld-step-state { color: var(--negative); }
      `}</style>
    </main>
  );
}
