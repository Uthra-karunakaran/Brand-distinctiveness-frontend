/* A repeatable block of pasted copy -- the multi-value form for an asset key
 * like `blog` or `homepage`, whose schema value is `string[]`.
 *
 * This is the generalisation of the onboarding prototype's URL-list pattern:
 * that flow asked for links, but the real asset contract asks for pasted
 * TEXT (there is no URL ingestion in this API), so the field is a textarea
 * per item, not a single-line input. Same "+" / remove-once-there's-more-
 * than-one shape, because that interaction was already right.
 */
export default function RepeatableText({ label, hint, placeholder, values, onChange }) {
  const rows = values.length ? values : [""];

  const setAt = (i, v) => onChange(rows.map((row, j) => (j === i ? v : row)));
  const add = () => onChange([...rows, ""]);
  const removeAt = (i) => onChange(rows.filter((_, j) => j !== i));

  return (
    <div className="rtx">
      <div className="rtx-head">
        <span className="bf-label">{label}</span>
        {hint && <span className="bf-hint">{hint}</span>}
      </div>

      <div className="rtx-rows">
        {rows.map((value, i) => (
          <div className="rtx-row" key={i}>
            <textarea
              rows={3}
              value={value}
              placeholder={placeholder}
              aria-label={`${label} ${i + 1}`}
              onChange={(e) => setAt(i, e.target.value)}
            />
            {rows.length > 1 && (
              <button
                type="button" className="rtx-remove"
                aria-label={`Remove ${label} ${i + 1}`} title="Remove"
                onClick={() => removeAt(i)}
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                  <path d="M3 3l6 6M9 3l-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
            )}
          </div>
        ))}
      </div>

      <button type="button" className="ghost rtx-add" onClick={add}>
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
          <path d="M6 2.2v7.6M2.2 6h7.6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
        Add another
      </button>

      <style>{`
        .rtx { display: flex; flex-direction: column; gap: 10px; }
        .rtx-head { display: flex; align-items: baseline; gap: 10px; flex-wrap: wrap; }
        .rtx-rows { display: flex; flex-direction: column; gap: 8px; }
        .rtx-row { position: relative; }
        .rtx-row textarea {
          width: 100%; padding: 11px 34px 11px 13px; border-radius: var(--r-md);
          border: 1px solid var(--line-strong); background: var(--surface-sunken);
          color: var(--text); font: 400 var(--t-body)/1.5 var(--font); resize: vertical;
          transition: border-color 140ms var(--ease), background 140ms var(--ease);
        }
        .rtx-row textarea::placeholder { color: var(--text-3); }
        .rtx-row textarea:focus { outline: none; border-color: var(--series-1); background: var(--surface); }

        .rtx-remove {
          position: absolute; top: 8px; right: 8px;
          width: 24px; height: 24px; padding: 0; border-radius: 6px;
          background: var(--surface); border: 1px solid var(--line-strong); color: var(--text-3);
          display: grid; place-items: center;
        }
        .rtx-remove:hover:not(:disabled) {
          background: color-mix(in srgb, var(--negative) 12%, transparent);
          color: var(--negative); border-color: color-mix(in srgb, var(--negative) 30%, transparent);
          filter: none;
        }

        .rtx-add { align-self: flex-start; height: 32px; padding: 0 12px; }
      `}</style>
    </div>
  );
}
