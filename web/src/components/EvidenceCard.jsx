import { useState } from "react";

/* Section 4 -- Supporting Evidence.
 *
 * evidence.nearest_brand_chunks / nearest_generic_chunks are the real
 * document chunks closest to the input, by cosine distance -- the concrete
 * "why" behind an abstract centroid score. Hides entirely if the API sent
 * neither, rather than rendering an empty shell.
 */
export default function EvidenceCard({ nearestBrand, nearestGeneric }) {
  const [open, setOpen] = useState(true);
  const brandChunks = nearestBrand ?? [];
  const genericChunks = nearestGeneric ?? [];
  if (!brandChunks.length && !genericChunks.length) return null;

  return (
    <div className="evidence">
      <button className="evidence-toggle" onClick={() => setOpen((v) => !v)} aria-expanded={open}>
        <span> Supporting evidence</span>
        <span>{open ? "−" : "+"}</span>
      </button>

      {open && (
        <div className="evidence-panels">
          {brandChunks.length > 0 && (
            <div className="bubble brand">
              <span className="bubble-label"> Sounds like the brand</span>
              {brandChunks.map((chunk, i) => (
                <p key={i}>“{chunk}”</p>
              ))}
            </div>
          )}
          {genericChunks.length > 0 && (
            <div className="bubble generic">
              <span className="bubble-label"> Generic example</span>
              {genericChunks.map((chunk, i) => (
                <p key={i}>“{chunk}”</p>
              ))}
            </div>
          )}
        </div>
      )}

      <style>{`
        .evidence { display: flex; flex-direction: column; gap: 14px; }
        .evidence-toggle {
          width: 100%; display: flex; align-items: center; justify-content: space-between;
          background: transparent; border: none; color: var(--text); font: inherit;
          font-weight: 620; font-size: var(--t-body); padding: 0; height: auto; cursor: pointer;
        }
        .evidence-panels { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        @media (max-width: 720px) { .evidence-panels { grid-template-columns: 1fr; } }

        .bubble {
          padding: 16px 18px; border-radius: var(--r-md); border: 1px solid var(--line);
          background: var(--surface-sunken); display: flex; flex-direction: column; gap: 8px;
        }
        .bubble.brand { border-color: color-mix(in srgb, var(--positive) 26%, transparent); }
        .bubble-label { font-size: var(--t-tiny); font-weight: 620; color: var(--text-2); }
        .bubble p { margin: 0; font-size: var(--t-small); line-height: 1.6; color: var(--text-2); font-style: italic; }
      `}</style>
    </div>
  );
}
