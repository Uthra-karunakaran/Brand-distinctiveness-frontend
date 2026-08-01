import { useState } from "react";

/* Brand values as chips rather than a comma-separated textarea.
 *
 * Values are a list downstream -- they get matched one by one -- so collecting
 * them as a list here avoids a parse step and shows the user exactly what the
 * analysis will receive. Enter or comma commits, Backspace on an empty input
 * reclaims the last chip, and duplicates are dropped silently rather than
 * refused with an error nobody needs.
 */
export default function TagInput({ values, suggestions = [], max = 12, onChange }) {
  const [draft, setDraft] = useState("");

  const add = (raw) => {
    const tag = raw.trim().replace(/,+$/, "");
    if (!tag || values.length >= max) return;
    if (values.some((v) => v.toLowerCase() === tag.toLowerCase())) return setDraft("");
    onChange([...values, tag]);
    setDraft("");
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      add(draft);
    } else if (e.key === "Backspace" && !draft && values.length) {
      onChange(values.slice(0, -1));
    }
  };

  const unused = suggestions.filter(
    (s) => !values.some((v) => v.toLowerCase() === s.toLowerCase()),
  );

  return (
    <div className="tags">
      <div className="tag-box">
        {values.map((v) => (
          <span className="tag" key={v}>
            {v}
            <button type="button" aria-label={`Remove ${v}`} onClick={() => onChange(values.filter((x) => x !== v))}>
              <svg width="10" height="10" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                <path d="M3 3l6 6M9 3l-6 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            </button>
          </span>
        ))}
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onKeyDown}
          onBlur={() => add(draft)}
          placeholder={values.length >= max ? "" : values.length ? "Add another…" : "Type a value and press Enter"}
          aria-label="Brand values"
          disabled={values.length >= max}
        />
      </div>

      {unused.length > 0 && values.length < max && (
        <div className="tag-suggest">
          <span className="tag-suggest-label">Common ones</span>
          {unused.slice(0, 6).map((s) => (
            <button type="button" className="tag-chip" key={s} onClick={() => add(s)}>
              + {s}
            </button>
          ))}
        </div>
      )}

      <style>{`
        .tags { display: flex; flex-direction: column; gap: 10px; }
        .tag-box {
          display: flex; flex-wrap: wrap; align-items: center; gap: 7px;
          min-height: 40px; padding: 6px 8px;
          border: 1px solid var(--line-strong); border-radius: var(--r-md);
          background: var(--surface-sunken);
          transition: border-color 140ms var(--ease), background 140ms var(--ease);
        }
        .tag-box:focus-within { border-color: var(--series-1); background: var(--surface); }
        .tag-box input {
          flex: 1 1 120px; min-width: 120px; border: none; background: none;
          outline: none; color: var(--text); height: 26px;
          font: 400 var(--t-body)/1.4 var(--font);
        }
        .tag-box input::placeholder { color: var(--text-3); }

        .tag {
          display: inline-flex; align-items: center; gap: 5px;
          padding: 4px 6px 4px 10px; border-radius: var(--r-pill);
          background: var(--series-1-soft); color: var(--series-1);
          border: 1px solid color-mix(in srgb, var(--series-1) 26%, transparent);
          font-size: var(--t-small); font-weight: 560;
        }
        .tag button {
          width: 16px; height: 16px; padding: 0; border: none; border-radius: 50%;
          background: transparent; color: inherit; display: grid; place-items: center;
          opacity: 0.65;
        }
        .tag button:hover:not(:disabled) {
          background: color-mix(in srgb, var(--series-1) 20%, transparent);
          opacity: 1; filter: none;
        }

        .tag-suggest { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; }
        .tag-suggest-label { font-size: var(--t-tiny); color: var(--text-3); margin-right: 2px; }
        .tag-chip {
          height: 26px; padding: 0 10px; border-radius: var(--r-pill);
          background: var(--surface); border: 1px dashed var(--line-strong);
          color: var(--text-2); font-size: var(--t-tiny); font-weight: 560;
        }
        .tag-chip:hover:not(:disabled) {
          background: var(--surface-hover); color: var(--text);
          border-style: solid; filter: none;
        }
      `}</style>
    </div>
  );
}
