import { useState } from "react";

/* warnings[] from the Report. Dismissed per-item, in memory only -- reloading
 * or re-scoring brings them back, since they describe the current result, not
 * a notification history. */
export default function WarningsBanner({ warnings }) {
  const [dismissed, setDismissed] = useState(() => new Set());
  const list = warnings ?? [];
  if (!list.length || list.every((_, i) => dismissed.has(i))) return null;

  return (
    <div className="warn-banners">
      {list.map((w, i) => {
        if (dismissed.has(i)) return null;
        return (
          <div className="warn-banner" key={i}>
            <span className="warn-text">⚠ {w}</span>
            <button
              className="quiet" onClick={() => setDismissed((s) => new Set(s).add(i))}
              aria-label="Dismiss warning"
            >
              ×
            </button>
          </div>
        );
      })}

      <style>{`
        .warn-banners { display: flex; flex-direction: column; gap: 8px; }
        .warn-banner {
          display: flex; align-items: center; justify-content: space-between; gap: 12px;
          padding: 10px 14px; border-radius: var(--r-md);
          background: color-mix(in srgb, var(--series-2) 10%, transparent);
          border: 1px solid color-mix(in srgb, var(--series-2) 26%, transparent);
        }
        .warn-text { font-size: var(--t-small); color: var(--text-2); }
        .warn-banner button {
          font-size: 16px; line-height: 1; color: var(--text-3); padding: 0 6px; height: 22px;
        }
      `}</style>
    </div>
  );
}
