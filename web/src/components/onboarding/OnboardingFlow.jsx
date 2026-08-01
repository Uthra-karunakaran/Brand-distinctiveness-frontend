import { useEffect, useState } from "react";
import { POLL_MS, fetchBrandJob, submitBrand } from "../../lib/onboardingApi";
import BrandForm from "./BrandForm";
import BrandPreview from "./BrandPreview";
import ProcessingScreen from "./ProcessingScreen";

/* The three-stage onboarding flow, and the only place that talks to the
 * onboarding API.
 *
 * The stage is derived, never stored: no job means the form, a job carrying a
 * profile means the preview, anything else means we are still waiting. One
 * source of truth removes the class of bug where a poll lands after a stage
 * transition and puts the user back on a screen they already left.
 *
 * Polling is a self-scheduling timeout rather than setInterval: a request that
 * takes longer than the interval would otherwise stack up behind itself, and
 * on a slow connection that turns one poll every two seconds into a queue.
 * The chain also stops cleanly on ready, on failure, and on unmount.
 */

const STAGES = [
  { key: "form", label: "Brand details" },
  { key: "processing", label: "AI analysis" },
  { key: "preview", label: "Brand preview" },
];

export default function OnboardingFlow({ onDone, onCancel }) {
  const [draft, setDraft] = useState(null);
  const [jobId, setJobId] = useState(null);
  const [job, setJob] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const stage = !jobId ? "form" : job?.profile ? "preview" : "processing";
  const stageIndex = STAGES.findIndex((s) => s.key === stage);

  useEffect(() => {
    if (!jobId) return undefined;

    let cancelled = false;
    let timer = null;

    const tick = async () => {
      try {
        const next = await fetchBrandJob(jobId);
        if (cancelled) return;
        setJob(next);
        if (next.status === "ready" || next.status === "failed") return;
      } catch (e) {
        if (cancelled) return;
        setError(e.message);
        return;
      }
      timer = setTimeout(tick, POLL_MS);
    };

    tick();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [jobId]);

  // A stage change is a page change; landing halfway down the previous screen
  // is disorienting.
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [stage]);

  const submit = async (payload) => {
    setSubmitting(true);
    setError(null);
    try {
      const id = await submitBrand(payload);
      setDraft(payload);
      setJob(null);
      setJobId(id);
    } catch (e) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const backToForm = () => {
    setJobId(null);
    setJob(null);
    setError(null);
  };

  return (
    <div className="ob">
      <header className="ob-head">
        <div className="ob-head-copy">
          <span className="ob-eyebrow">Onboarding</span>
          <h1>Add a brand</h1>
          <p>
            Tell us who you are and where to read you. We build the brand
            profile every future score is measured against.
          </p>
        </div>
        {onCancel && stage === "form" && (
          <button className="ghost" onClick={onCancel}>Back to scoring</button>
        )}
      </header>

      {/* Flow-level progress: which of the three screens you are on. */}
      <ol className="ob-stages">
        {STAGES.map((s, i) => (
          <li
            key={s.key}
            className={`ob-stage ${i < stageIndex ? "done" : i === stageIndex ? "current" : "todo"}`}
            aria-current={i === stageIndex ? "step" : undefined}
          >
            <span className="ob-stage-num">
              {i < stageIndex ? (
                <svg width="11" height="11" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                  <path d="M2.5 6.3l2.4 2.4L9.6 3.9" stroke="currentColor" strokeWidth="1.9"
                    strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ) : i + 1}
            </span>
            <span className="ob-stage-label">{s.label}</span>
            {i < STAGES.length - 1 && <span className="ob-stage-line" aria-hidden="true" />}
          </li>
        ))}
      </ol>

      {stage === "form" && (
        <BrandForm
          initial={draft}
          submitting={submitting}
          error={error}
          onSubmit={submit}
          onCancel={onCancel}
        />
      )}

      {stage === "processing" && (
        <>
          <ProcessingScreen job={job} brandName={draft?.name ?? "your brand"} />
          {error && (
            <p className="error">
              <strong>Lost contact with the analysis.</strong> {error}{" "}
              <button className="quiet" onClick={backToForm}>Start over</button>
            </p>
          )}
        </>
      )}

      {stage === "preview" && (
        <BrandPreview
          job={job}
          onEdit={backToForm}
          onDone={onDone}
          onScore={() => onDone?.(job.profile)}
        />
      )}

      <style>{`
        .ob { display: flex; flex-direction: column; gap: 20px; padding-bottom: 24px; }

        .ob-head { display: flex; align-items: flex-start; gap: 16px; flex-wrap: wrap; }
        .ob-head-copy { flex: 1 1 320px; min-width: 0; }
        .ob-head h1 {
          margin: 2px 0 6px; font-size: 30px; font-weight: 660;
          letter-spacing: -0.022em; color: var(--text);
        }
        .ob-head p { margin: 0; font-size: var(--t-lead); color: var(--text-2); max-width: 62ch; }

        /* ── shared field chrome, used by every child of this flow ── */
        .ob-eyebrow {
          font-size: var(--t-micro); font-weight: 660; letter-spacing: 0.09em;
          text-transform: uppercase; color: var(--text-3);
        }
        .ob-field { display: flex; flex-direction: column; gap: 7px; min-width: 0; }
        .ob-label {
          font-size: var(--t-small); font-weight: 620; color: var(--text);
          display: inline-flex; align-items: baseline;
        }
        .ob-hint { font-size: var(--t-tiny); color: var(--text-3); }
        .ob-error {
          font-size: var(--t-tiny); font-weight: 560; color: var(--negative);
          display: inline-flex; align-items: center; gap: 5px;
        }
        .ob-error::before { content: "!"; font-weight: 700; }

        /* ── stage rail ── */
        .ob-stages {
          list-style: none; margin: 0; padding: 0;
          display: flex; align-items: center; gap: 0; flex-wrap: wrap;
        }
        .ob-stage { display: flex; align-items: center; gap: 9px; }
        .ob-stage-num {
          flex: none; width: 24px; height: 24px; border-radius: 50%;
          display: grid; place-items: center;
          font-size: var(--t-tiny); font-weight: 660;
          background: var(--surface); border: 1px solid var(--line-strong); color: var(--text-3);
          transition: background 200ms var(--ease), color 200ms var(--ease),
                      border-color 200ms var(--ease);
        }
        .ob-stage-label {
          font-size: var(--t-small); font-weight: 560; color: var(--text-3);
          transition: color 200ms var(--ease);
        }
        .ob-stage-line {
          width: 46px; height: 1px; background: var(--line-strong); margin: 0 12px; flex: none;
        }
        .ob-stage.current .ob-stage-num { background: var(--series-1); border-color: var(--series-1); color: #fff; }
        .ob-stage.current .ob-stage-label { color: var(--text); font-weight: 620; }
        .ob-stage.done .ob-stage-num {
          background: color-mix(in srgb, var(--positive) 12%, transparent);
          border-color: color-mix(in srgb, var(--positive) 34%, transparent);
          color: var(--positive);
        }
        .ob-stage.done .ob-stage-label { color: var(--text-2); }

        @media (max-width: 640px) {
          .ob-head h1 { font-size: 24px; }
          .ob-stage-line { width: 18px; margin: 0 8px; }
          .ob-stage-label { display: none; }
          .ob-stage.current .ob-stage-label { display: inline; }
        }
      `}</style>
    </div>
  );
}
