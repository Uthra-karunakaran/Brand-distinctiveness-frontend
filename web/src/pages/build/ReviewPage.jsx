import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getAssetSchema, getBrand } from "../../api/brands";
import BuildShell from "../../components/build/BuildShell";
import { layerMeta } from "../../lib/assetFields";

/* Step 7: GET /brands/{id}, server-authoritative. Everything here is what the
 * LAST SUCCESSFUL job actually produced -- not the current form state, which
 * may have unsaved edits sitting in the enrichment hub. mvbf.met in
 * particular is deliberately re-read from the server rather than computed
 * from local state, because the local completeness meter can only ever
 * describe what's IN the form, not what the last build actually accepted.
 *
 * A 404 here means the brand's first embeddings job never resolved ready --
 * reachable only via a bookmarked/deep-linked URL, since the flow itself
 * never routes here before that happens.
 */
export default function ReviewPage() {
  const { brandId } = useParams();
  const navigate = useNavigate();

  const [schema, setSchema] = useState(null);
  const [brand, setBrand] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([getAssetSchema(), getBrand(brandId)])
      .then(([s, b]) => { if (!cancelled) { setSchema(s); setBrand(b); } })
      .catch((e) => {
        if (cancelled) return;
        if (e.code === "not_found") setNotFound(true);
        else setError(e.message);
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [brandId]);

  const goBack = () => navigate(`/brands/${brandId}/enrich`);

  if (loading) {
    return (
      <BuildShell stage="review" title="Review" subtitle="Loading…" onBack={goBack}>
        <div className="shimmer" style={{ height: 260, borderRadius: "var(--r-lg)" }} />
      </BuildShell>
    );
  }

  if (notFound) {
    return (
      <BuildShell stage="review" title="Review" onBack={goBack}>
        <div className="rvw-empty">
          <p><strong>This brand has no completed build yet.</strong></p>
          <p>The first embeddings job either hasn't run or didn't finish successfully.</p>
          <button onClick={() => navigate(`/brands/${brandId}/quick-start`)}>Go to Quick Start</button>
        </div>
      </BuildShell>
    );
  }

  if (error) {
    return (
      <BuildShell stage="review" title="Review" onBack={goBack}>
        <p className="error"><strong>Couldn't load this brand.</strong> {error}</p>
      </BuildShell>
    );
  }

  const scoredSet = new Set(schema.scored_layers);

  return (
    <BuildShell
      stage="review" title={brand.brand_name}
      subtitle={`Category: ${brand.industry.replace(/_/g, " ")}`}
      onBack={goBack}
    >
      {brand.warnings?.length > 0 && (
        <div className="rvw-warnings">
          {brand.warnings.map((w, i) => (
            <p key={i} className="enr-warning"><strong>Heads up.</strong> {w.message}</p>
          ))}
        </div>
      )}

      <div className="rvw-grid">
        <section className="bf-section">
          <div className="bf-section-head">
            <div><h3>MVBF status</h3></div>
          </div>
          <div className={`rvw-mvbf ${brand.mvbf.met ? "ok" : "warn"}`}>
            <span className="rvw-mvbf-icon" aria-hidden="true">{brand.mvbf.met ? "✓" : "!"}</span>
            <div>
              <strong>{brand.mvbf.met ? "Complete" : "Incomplete"}</strong>
              {!brand.mvbf.met && brand.mvbf.missing_fields?.length > 0 && (
                <p>Missing: {brand.mvbf.missing_fields.join(", ")}</p>
              )}
            </div>
          </div>
        </section>

        <section className="bf-section">
          <div className="bf-section-head">
            <div><h3>Scorable</h3></div>
          </div>
          <div className={`rvw-mvbf ${brand.scorable ? "ok" : "warn"}`}>
            <span className="rvw-mvbf-icon" aria-hidden="true">{brand.scorable ? "✓" : "!"}</span>
            <div><strong>{brand.scorable ? "Yes" : "Not yet"}</strong><p>{brand.scorable_message}</p></div>
          </div>
        </section>

        <section className="bf-section rvw-span">
          <div className="bf-section-head">
            <div>
              <h3>Layers</h3>
              <p>What's actually contributing to a score, vs. collected for later.</p>
            </div>
          </div>
          <div className="rvw-layers">
            {Object.keys(schema.layers).map((layer) => {
              const present = brand.layers_present.includes(layer);
              const scored = scoredSet.has(layer);
              return (
                <div className={`rvw-layer ${present ? "present" : "absent"}`} key={layer}>
                  <span className="rvw-layer-label">{layerMeta(layer).label}</span>
                  <span className="rvw-layer-state">
                    {!present ? "Not started" : scored ? "Contributing to scores" : "Collected · won't move your score"}
                  </span>
                </div>
              );
            })}
          </div>
        </section>

        <section className="bf-section rvw-span">
          <div className="bf-section-head">
            <div>
              <h3>Vocabulary</h3>
              <p>Terms distinct to this brand, and category boilerplate found in its own copy.</p>
            </div>
          </div>
          <div className="rvw-vocab">
            <div>
              <span className="rvw-vocab-label">Signature terms</span>
              <div className="rvw-chips">
                {brand.signature_terms.length
                  ? brand.signature_terms.map((t) => <span className="rvw-chip ok" key={t}>{t}</span>)
                  : <span className="bf-hint">None yet.</span>}
              </div>
            </div>
            <div>
              <span className="rvw-vocab-label">Cliché terms</span>
              <div className="rvw-chips">
                {brand.cliche_terms.length
                  ? brand.cliche_terms.map((t) => <span className="rvw-chip warn" key={t}>{t}</span>)
                  : <span className="bf-hint">None found.</span>}
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Review is the last step in the build flow (step 7) -- the Scorable
          card above already reports whether this brand is ready to be scored
          against, and the ← Back control at the top of the page already goes
          to Enrich, so there is nothing left for a bottom action bar to do. */}
      <p className="bf-hint">Add more content any time — every save re-runs the build.</p>

      <style>{`
        .rvw-empty {
          display: flex; flex-direction: column; gap: 10px; align-items: flex-start;
          padding: 32px; background: var(--surface); border: 1px solid var(--line);
          border-radius: var(--r-lg);
        }
        .rvw-empty p { margin: 0; color: var(--text-2); }

        .rvw-warnings { display: flex; flex-direction: column; gap: 8px; }
        .enr-warning {
          margin: 0; padding: 11px 13px; border-radius: var(--r-md); font-size: var(--t-small);
          color: var(--series-2); background: color-mix(in srgb, var(--series-2) 8%, transparent);
          border: 1px solid color-mix(in srgb, var(--series-2) 22%, transparent);
        }

        .rvw-grid { display: grid; grid-template-columns: 1fr 1fr; gap: var(--gap); }
        .rvw-span { grid-column: 1 / -1; }
        @media (max-width: 760px) { .rvw-grid { grid-template-columns: 1fr; } }

        .rvw-mvbf { display: flex; align-items: flex-start; gap: 12px; }
        .rvw-mvbf-icon {
          flex: none; width: 26px; height: 26px; border-radius: 50%; display: grid; place-items: center;
          font-size: 13px; font-weight: 700;
        }
        .rvw-mvbf.ok .rvw-mvbf-icon { background: color-mix(in srgb, var(--positive) 14%, transparent); color: var(--positive); }
        .rvw-mvbf.warn .rvw-mvbf-icon { background: color-mix(in srgb, var(--series-2) 14%, transparent); color: var(--series-2); }
        .rvw-mvbf p { margin: 2px 0 0; font-size: var(--t-small); color: var(--text-2); }
        .rvw-mvbf strong { color: var(--text); }

        .rvw-layers { display: flex; flex-direction: column; gap: 10px; }
        .rvw-layer {
          display: flex; align-items: center; justify-content: space-between; gap: 12px;
          padding: 10px 14px; border-radius: var(--r-md); border: 1px solid var(--line);
          background: var(--surface-sunken);
        }
        .rvw-layer.absent { opacity: 0.55; }
        .rvw-layer-label { font-size: var(--t-body); font-weight: 590; color: var(--text); }
        .rvw-layer-state { font-size: var(--t-tiny); color: var(--text-3); }
        .rvw-layer.present .rvw-layer-state { color: var(--positive); }

        .rvw-vocab { display: grid; grid-template-columns: 1fr 1fr; gap: var(--gap); }
        @media (max-width: 640px) { .rvw-vocab { grid-template-columns: 1fr; } }
        .rvw-vocab-label {
          display: block; margin-bottom: 8px; font-size: var(--t-micro); font-weight: 660;
          letter-spacing: 0.06em; text-transform: uppercase; color: var(--text-3);
        }
        .rvw-chips { display: flex; flex-wrap: wrap; gap: 7px; }
        .rvw-chip {
          font-size: var(--t-small); font-weight: 560; padding: 4px 11px; border-radius: var(--r-pill);
        }
        .rvw-chip.ok { color: var(--series-1); background: var(--series-1-soft); border: 1px solid color-mix(in srgb, var(--series-1) 24%, transparent); }
        .rvw-chip.warn { color: var(--series-2); background: color-mix(in srgb, var(--series-2) 10%, transparent); border: 1px solid color-mix(in srgb, var(--series-2) 26%, transparent); }
      `}</style>
    </BuildShell>
  );
}
