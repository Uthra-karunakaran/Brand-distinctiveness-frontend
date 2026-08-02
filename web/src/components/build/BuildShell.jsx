/* Shared chrome for the brand-build flow: the page head, the stage rail, and
 * the field/card CSS every screen in this flow draws on (`.bf-*`). Defined
 * once here rather than per screen, since five screens sharing one visual
 * language is the whole point of a "flow" -- text inputs, error copy, and
 * card padding need to match exactly or the seams show.
 *
 * `stage` is one of STAGES[].key, or null on screens that aren't part of the
 * numbered rail (Building, which is a transition, not a stage the user makes
 * choices on).
 *
 * `onBack`, when given, renders a single consistent "← Back" control above
 * the title on every screen that has one -- the same control, same position,
 * every time, rather than each page inventing its own Cancel/Back button in
 * a different spot with different wording.
 */

export const STAGES = [
  { key: "quick-start", label: "Quick start" },
  { key: "enrich", label: "Enrich" },
  { key: "review", label: "Review" },
];

export default function BuildShell({ stage, title, subtitle, actions, onBack, children }) {
  const stageIndex = STAGES.findIndex((s) => s.key === stage);

  return (
    <main className="page">
      <div className="bf">
        {onBack && (
          <button className="quiet bf-back" onClick={onBack}>← Back</button>
        )}

        <header className="bf-head">
          <div className="bf-head-copy">
            <span className="ob-eyebrow">Brand On Boarding</span>
            <h1>{title}</h1>
            {subtitle && <p>{subtitle}</p>}
          </div>
          {actions && <div className="bf-head-actions">{actions}</div>}
        </header>

        {stageIndex >= 0 && (
          <ol className="bf-stages">
            {STAGES.map((s, i) => (
              <li
                key={s.key}
                className={`bf-stage ${i < stageIndex ? "done" : i === stageIndex ? "current" : "todo"}`}
                aria-current={i === stageIndex ? "step" : undefined}
              >
                <span className="bf-stage-num">
                  {i < stageIndex ? (
                    <svg width="11" height="11" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                      <path d="M2.5 6.3l2.4 2.4L9.6 3.9" stroke="currentColor" strokeWidth="1.9"
                        strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ) : i + 1}
                </span>
                <span className="bf-stage-label">{s.label}</span>
                {i < STAGES.length - 1 && <span className="bf-stage-line" aria-hidden="true" />}
              </li>
            ))}
          </ol>
        )}

        {children}
      </div>

      <style>{`
        .bf { display: flex; flex-direction: column; gap: 20px; padding-bottom: 24px; }

        .bf-back { align-self: flex-start; height: 30px; padding: 0 6px; margin-bottom: -8px; color: var(--text-2); }

        .bf-head { display: flex; align-items: flex-start; gap: 16px; flex-wrap: wrap; }
        .bf-head-copy { flex: 1 1 320px; min-width: 0; }
        .bf-head-copy h1 {
          margin: 2px 0 6px; font-size: 28px; font-weight: 660;
          letter-spacing: -0.022em; color: var(--text);
        }
        .bf-head-copy p { margin: 0; font-size: var(--t-lead); color: var(--text-2); max-width: 62ch; }
        .bf-head-actions { display: flex; align-items: center; gap: 8px; flex: none; }

        .ob-eyebrow {
          font-size: var(--t-micro); font-weight: 660; letter-spacing: 0.09em;
          text-transform: uppercase; color: var(--text-3);
        }

        /* ── stage rail ── */
        .bf-stages {
          list-style: none; margin: 0; padding: 0;
          display: flex; align-items: center; flex-wrap: wrap;
        }
        .bf-stage { display: flex; align-items: center; gap: 9px; }
        .bf-stage-num {
          flex: none; width: 24px; height: 24px; border-radius: 50%;
          display: grid; place-items: center;
          font-size: var(--t-tiny); font-weight: 660;
          background: var(--surface); border: 1px solid var(--line-strong); color: var(--text-3);
          transition: background 200ms var(--ease), color 200ms var(--ease), border-color 200ms var(--ease);
        }
        .bf-stage-label {
          font-size: var(--t-small); font-weight: 560; color: var(--text-3);
          transition: color 200ms var(--ease);
        }
        .bf-stage-line { width: 46px; height: 1px; background: var(--line-strong); margin: 0 12px; flex: none; }
        .bf-stage.current .bf-stage-num { background: var(--series-1); border-color: var(--series-1); color: #fff; }
        .bf-stage.current .bf-stage-label { color: var(--text); font-weight: 620; }
        .bf-stage.done .bf-stage-num {
          background: color-mix(in srgb, var(--positive) 12%, transparent);
          border-color: color-mix(in srgb, var(--positive) 34%, transparent);
          color: var(--positive);
        }
        .bf-stage.done .bf-stage-label { color: var(--text-2); }

        /* ── field chrome, shared by every form in this flow ── */
        .bf-section {
          background: var(--surface); border: 1px solid var(--line);
          border-radius: var(--r-lg); box-shadow: var(--e1);
          padding: 22px 24px; display: flex; flex-direction: column; gap: 18px;
        }
        .bf-section-head { display: flex; gap: 12px; align-items: flex-start; }
        .bf-section-head h3 { margin: 0 0 3px; font-size: var(--t-h3); font-weight: 640; color: var(--text); }
        .bf-section-head p { margin: 0; font-size: var(--t-small); color: var(--text-2); max-width: 64ch; }
        .bf-section-badge {
          font-size: var(--t-micro); font-weight: 660; letter-spacing: 0.04em;
          padding: 3px 9px; border-radius: var(--r-pill); flex: none;
          background: var(--surface-sunken); color: var(--text-3); border: 1px solid var(--line-strong);
        }

        .bf-grid { display: grid; grid-template-columns: 1fr 1fr; gap: var(--gap); }
        @media (max-width: 760px) { .bf-grid { grid-template-columns: 1fr; } }

        .bf-field { display: flex; flex-direction: column; gap: 7px; min-width: 0; }
        .bf-label {
          font-size: var(--t-small); font-weight: 620; color: var(--text);
          display: inline-flex; align-items: baseline; gap: 6px;
        }
        .bf-req {
          font-size: var(--t-micro); font-weight: 660; letter-spacing: 0.05em;
          text-transform: uppercase; color: var(--text-3);
        }
        .bf-hint { font-size: var(--t-tiny); color: var(--text-3); }
        .bf-error {
          font-size: var(--t-tiny); font-weight: 560; color: var(--negative);
          display: inline-flex; align-items: center; gap: 5px;
        }
        .bf-error::before { content: "!"; font-weight: 700; }

        .bf-field input[type="text"], .bf-field input:not([type]) {
          height: 40px; padding: 0 12px; border-radius: var(--r-md);
          border: 1px solid var(--line-strong); background: var(--surface-sunken);
          color: var(--text); font: 400 var(--t-body)/1.4 var(--font);
          transition: border-color 140ms var(--ease), background 140ms var(--ease);
        }
        .bf-field input::placeholder, .bf-field textarea::placeholder { color: var(--text-3); }
        .bf-field input:focus, .bf-field textarea:focus {
          outline: none; border-color: var(--series-1); background: var(--surface);
        }
        .bf-field input.invalid, .bf-field textarea.invalid { border-color: var(--negative); }
        .bf-field textarea { min-height: 0; font-size: var(--t-body); }

        .bf-submit-error { margin-top: 0; }

        /* ── sticky action bar ── */
        .bf-actions {
          position: sticky; bottom: 0; z-index: 5;
          display: flex; align-items: center; justify-content: space-between;
          gap: 16px; flex-wrap: wrap;
          padding: 14px 18px; border-radius: var(--r-lg);
          background: color-mix(in srgb, var(--surface) 92%, transparent);
          backdrop-filter: saturate(180%) blur(12px);
          -webkit-backdrop-filter: saturate(180%) blur(12px);
          border: 1px solid var(--line-strong); box-shadow: var(--e2);
        }
        .bf-actions-info { display: flex; flex-direction: column; gap: 6px; flex: 1 1 220px; min-width: 0; }
        .bf-actions-buttons { display: flex; align-items: center; gap: 8px; flex: none; }

        @media (max-width: 640px) {
          .bf-head-copy h1 { font-size: 23px; }
          .bf-stage-line { width: 18px; margin: 0 8px; }
          .bf-stage-label { display: none; }
          .bf-stage.current .bf-stage-label { display: inline; }
        }
      `}</style>
    </main>
  );
}
