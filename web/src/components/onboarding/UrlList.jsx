/* A repeatable URL field.
 *
 * One row per URL, a "+" to grow the list, and a remove control that only
 * appears once there is more than one row -- so the control set never offers
 * an action that would leave the group empty. Rows are keyed by index on
 * purpose: they carry no identity beyond their position, and adding an id
 * would be state to keep in sync for no gain.
 */

const GlobeIcon = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <circle cx="8" cy="8" r="6.1" stroke="currentColor" strokeWidth="1.3" />
    <path d="M2.2 8h11.6M8 1.9c1.6 1.7 2.4 3.8 2.4 6.1S9.6 12.4 8 14.1C6.4 12.4 5.6 10.3 5.6 8s.8-4.4 2.4-6.1z"
      stroke="currentColor" strokeWidth="1.3" />
  </svg>
);

export default function UrlList({ label, hint, placeholder, values, errors = {}, onChange }) {
  const rows = values.length ? values : [""];

  const setAt = (i, v) => onChange(rows.map((row, j) => (j === i ? v : row)));
  const add = () => onChange([...rows, ""]);
  const removeAt = (i) => onChange(rows.filter((_, j) => j !== i));

  return (
    <div className="urls">
      <div className="urls-head">
        <span className="ob-label">{label}</span>
        {hint && <span className="ob-hint">{hint}</span>}
      </div>

      <div className="url-rows">
        {rows.map((value, i) => (
          <div className="url-row" key={i}>
            <div className={`url-field${errors[i] ? " invalid" : ""}`}>
              <span className="url-icon" aria-hidden="true"><GlobeIcon /></span>
              <input
                type="text"
                inputMode="url"
                value={value}
                placeholder={placeholder}
                aria-label={`${label} ${i + 1}`}
                aria-invalid={Boolean(errors[i])}
                onChange={(e) => setAt(i, e.target.value)}
              />
              {rows.length > 1 && (
                <button
                  type="button"
                  className="url-remove"
                  aria-label={`Remove ${label} ${i + 1}`}
                  title="Remove"
                  onClick={() => removeAt(i)}
                >
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                    <path d="M3 3l6 6M9 3l-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </button>
              )}
            </div>
            {errors[i] && <span className="ob-error">{errors[i]}</span>}
          </div>
        ))}
      </div>

      <button type="button" className="ghost url-add" onClick={add}>
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
          <path d="M6 2.2v7.6M2.2 6h7.6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
        Add another
      </button>

      <style>{`
        .urls { display: flex; flex-direction: column; gap: 10px; }
        .urls-head { display: flex; align-items: baseline; gap: 10px; flex-wrap: wrap; }
        .url-rows { display: flex; flex-direction: column; gap: 8px; }
        .url-row { display: flex; flex-direction: column; gap: 5px; }

        .url-field {
          display: flex; align-items: center; gap: 9px;
          padding: 0 8px 0 12px; height: 40px;
          border: 1px solid var(--line-strong); border-radius: var(--r-md);
          background: var(--surface-sunken);
          transition: border-color 140ms var(--ease), background 140ms var(--ease);
        }
        .url-field:focus-within { border-color: var(--series-1); background: var(--surface); }
        .url-field.invalid { border-color: var(--negative); }
        .url-icon { display: grid; place-items: center; color: var(--text-3); flex: none; }
        .url-field:focus-within .url-icon { color: var(--series-1); }

        .url-field input {
          flex: 1 1 auto; min-width: 0; border: none; background: none; outline: none;
          color: var(--text); font: 400 var(--t-body)/1.4 var(--font);
        }
        .url-field input::placeholder { color: var(--text-3); }

        .url-remove {
          flex: none; width: 26px; height: 26px; padding: 0; border-radius: 6px;
          background: transparent; border: none; color: var(--text-3);
          display: grid; place-items: center;
        }
        .url-remove:hover:not(:disabled) {
          background: color-mix(in srgb, var(--negative) 12%, transparent);
          color: var(--negative); filter: none;
        }

        .url-add { align-self: flex-start; height: 32px; padding: 0 12px; }
      `}</style>
    </div>
  );
}
