import { useState } from "react";

/* Shared chrome for every full-width, click-to-expand row on the page.
 *
 * The per-layer cards (LayerCard) and Structural Style render through this so
 * they share one definition of the header/body layout, spacing, borders and
 * typography -- rather than near-identical copies that can quietly drift
 * apart. `title` and `headerRight` are full ReactNodes so a caller can
 * compose a badge or a metric bar next to the plain text label, the way
 * LayerCard does.
 */
export default function ExpandableCard({ title, headerRight, defaultOpen = false, children }) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="exp-card">
      <button className="exp-head" onClick={() => setOpen((v) => !v)} aria-expanded={open}>
        <div className="exp-head-left">{title}</div>
        <div className="exp-head-right">
          {headerRight}
          <span className="exp-chevron">{open ? "−" : "+"}</span>
        </div>
      </button>

      {open && <div className="exp-body">{children}</div>}

      <style>{`
        .exp-card {
          background: var(--surface); border: 1px solid var(--line);
          border-radius: var(--r-lg); box-shadow: var(--e1); overflow: hidden;
        }
        .exp-head {
          width: 100%; display: flex; align-items: center; justify-content: space-between;
          gap: 16px; padding: 18px 22px; background: transparent; border: none;
          border-radius: 0; color: var(--text); text-align: left; height: auto;
          font: inherit; cursor: pointer;
        }
        .exp-head:hover { background: var(--surface-hover); }
        .exp-head-left { display: flex; align-items: center; gap: 12px; min-width: 0; }
        .exp-title {
          font-size: var(--t-lead); font-weight: 620; text-transform: capitalize;
          color: var(--text);
        }
        .exp-head-right { display: flex; align-items: center; gap: 18px; flex: none; }
        .exp-chevron {
          font-size: 18px; color: var(--text-3); width: 20px; text-align: center;
          font-variant-numeric: normal;
        }
        .exp-body { border-top: 1px solid var(--line); padding: 18px 22px 22px; }
      `}</style>
    </div>
  );
}
