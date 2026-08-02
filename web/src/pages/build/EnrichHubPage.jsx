import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { getAssetSchema, JobInFlightError } from "../../api/brands";
import ExpandableCard from "../../components/ExpandableCard";
import BuildShell from "../../components/build/BuildShell";
import RepeatableText from "../../components/build/RepeatableText";
import { fieldMeta, layerMeta } from "../../lib/assetFields";
import { completeness, loadDraft, saveDraft } from "../../state/brandDraft";

/* Step 5+6: the completeness meter and the layer-by-layer enrichment form.
 *
 * GET /schema/assets is fetched once per session and drives everything here
 * -- which sections exist, which fields each one has, and the completeness
 * math, which is pure client arithmetic against that schema and never a
 * network call of its own.
 *
 * Every save resends the WHOLE accumulated assets object (state/brandDraft.js
 * enforces this), so the "working copy" here starts as a clone of the saved
 * draft and grows as the user fills in more -- there is no per-field save,
 * only one save per visit, because a per-field save would just be N calls
 * that each still have to carry everything.
 */
export default function EnrichHubPage() {
  const { brandId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [draft, setDraft] = useState(() => loadDraft(brandId));
  const [schema, setSchema] = useState(null);
  const [working, setWorking] = useState(() => ({ ...(draft?.assets ?? {}) }));
  const [warnings, setWarnings] = useState(location.state?.warnings ?? []);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [busyElsewhere, setBusyElsewhere] = useState(Boolean(draft?.jobId));

  useEffect(() => {
    if (!draft) {
      navigate(`/brands/${brandId}/quick-start`, { replace: true });
      return;
    }
    getAssetSchema().then(setSchema).catch((e) => setSubmitError(e.message));
  }, [brandId, draft, navigate]);

  const meter = useMemo(() => (schema ? completeness({ assets: working }, schema) : null), [working, schema]);
  const dirty = useMemo(
    () => JSON.stringify(working) !== JSON.stringify(draft?.assets ?? {}),
    [working, draft],
  );

  const setField = (key, value) => setWorking((w) => ({ ...w, [key]: value }));

  const save = async () => {
    setSubmitting(true);
    setSubmitError(null);
    try {
      const updated = await saveDraft(draft, { assets: working });
      setDraft(updated);
      navigate(`/brands/${brandId}/building`);
    } catch (e) {
      if (e instanceof JobInFlightError) {
        setBusyElsewhere(true);
      } else {
        setSubmitError(e.message);
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (!draft || !schema) {
    return (
      <BuildShell stage="enrich" title="Enrich your brand" subtitle="Loading…" onBack={() => navigate(`/brands/${brandId}/quick-start`)}>
        <div className="shimmer" style={{ height: 220, borderRadius: "var(--r-lg)" }} />
      </BuildShell>
    );
  }

  return (
    <BuildShell
      stage="enrich"
      title="Enrich your brand"
      subtitle="Every extra piece of copy sharpens the fingerprint. Nothing here is required to move on."
      onBack={() => navigate(`/brands/${brandId}/quick-start`)}
      actions={
        <button className="ghost" onClick={() => navigate(`/brands/${brandId}/competitors`)}>
          Manage competitor set
        </button>
      }
    >
      {warnings.length > 0 && (
        <div className="enr-warnings">
          {warnings.map((w, i) => (
            <p key={i} className="enr-warning">
              <strong>Heads up.</strong> {w.message}
              <button className="quiet" onClick={() => setWarnings((ws) => ws.filter((_, j) => j !== i))} aria-label="Dismiss">×</button>
            </p>
          ))}
        </div>
      )}

      {busyElsewhere && (
        <p className="error">
          <strong>A build is already running for this brand.</strong> Wait for it to finish before saving again.{" "}
          <button className="quiet" onClick={() => navigate(`/brands/${brandId}/building`)}>
            Check status
          </button>
        </p>
      )}

      {/* ── completeness meter ── */}
      <div className="enr-meter-card">
        <div className="enr-meter-row">
          <span className={`enr-badge ${meter.mvbf.met ? "ok" : "warn"}`}>
            {meter.mvbf.met ? "✓" : meter.mvbf.done} MVBF {meter.mvbf.met ? "complete" : `${meter.mvbf.done}/${meter.mvbf.total}`}
          </span>
          {schema.layers && Object.keys(schema.layers).map((layer) => {
            const m = meter.layers[layer];
            const scored = schema.scored_layers.includes(layer);
            return (
              <div className="enr-meter-chip" key={layer} title={`${m.done} of ${m.total} fields`}>
                <span className="enr-meter-chip-label">{layerMeta(layer).label}{!scored && <span className="enr-meter-chip-note"> · collected only</span>}</span>
                <span className="enr-meter-track"><span style={{ width: `${m.pct * 100}%` }} /></span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── one section per layer ── */}
      <div className="enr-sections">
        {Object.entries(schema.layers).map(([layer, keys]) => {
          const meta = layerMeta(layer);
          const scored = schema.scored_layers.includes(layer);
          const m = meter.layers[layer];
          return (
            <ExpandableCard
              key={layer}
              title={<span className="exp-title">{meta.label}</span>}
              headerRight={
                <>
                  <span className="badge">{m.done}/{m.total} filled</span>
                  {!scored && <span className="badge">Won't move your score</span>}
                </>
              }
            >
              <div className="enr-section-body">
                {meta.blurb && <p className="enr-section-blurb">{meta.blurb}</p>}
                {keys.map((key) => {
                  const fm = fieldMeta(key);
                  const value = working[key] ?? (fm.multi ? [] : "");
                  return (
                    <div className="bf-field" key={key}>
                      {fm.multi ? (
                        <RepeatableText
                          label={fm.label}
                          placeholder={fm.placeholder}
                          values={Array.isArray(value) ? value : []}
                          onChange={(v) => setField(key, v)}
                        />
                      ) : (
                        <>
                          <label className="bf-label" htmlFor={`enr-${key}`}>{fm.label}</label>
                          {fm.area ? (
                            <textarea
                              id={`enr-${key}`} rows={3} value={value}
                              placeholder={fm.placeholder}
                              onChange={(e) => setField(key, e.target.value)}
                            />
                          ) : (
                            <input
                              id={`enr-${key}`} type="text" value={value}
                              placeholder={fm.placeholder}
                              onChange={(e) => setField(key, e.target.value)}
                            />
                          )}
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </ExpandableCard>
          );
        })}
      </div>

      {submitError && <p className="error bf-submit-error"><strong>Couldn't save.</strong> {submitError}</p>}

      <div className="bf-actions">
        <div className="bf-actions-info">
          <span className="bf-hint">
            {dirty ? "You have unsaved changes." : "Everything here is saved."} Saving re-runs the
            whole build, so it goes through the same progress screen as Quick Start.
          </span>
        </div>
        <div className="bf-actions-buttons">
          <button className="ghost" onClick={() => navigate(`/brands/${brandId}/review`)}>Go to review</button>
          <button onClick={save} disabled={submitting || !dirty || busyElsewhere}>
            {submitting ? (<><span className="spinner" />Saving…</>) : "Save and rebuild"}
          </button>
        </div>
      </div>

      <style>{`
        .enr-warnings { display: flex; flex-direction: column; gap: 8px; }
        .enr-warning {
          position: relative; margin: 0; padding: 11px 34px 11px 13px; border-radius: var(--r-md);
          font-size: var(--t-small); color: var(--series-2);
          background: color-mix(in srgb, var(--series-2) 8%, transparent);
          border: 1px solid color-mix(in srgb, var(--series-2) 22%, transparent);
        }
        .enr-warning button {
          position: absolute; top: 6px; right: 6px; width: 22px; height: 22px; padding: 0;
          background: transparent; border: none; color: inherit; font-size: 16px; line-height: 1;
        }
        .enr-warning button:hover { background: color-mix(in srgb, var(--series-2) 16%, transparent); filter: none; }

        .enr-meter-card {
          background: var(--surface-sunken); border: 1px solid var(--line); border-radius: var(--r-md);
          padding: 16px 18px;
        }
        .enr-meter-row { display: flex; flex-wrap: wrap; gap: 14px 22px; align-items: center; }
        .enr-badge {
          flex: none; font-size: var(--t-small); font-weight: 620; padding: 5px 12px;
          border-radius: var(--r-pill); border: 1px solid var(--line-strong); color: var(--text-2);
        }
        .enr-badge.ok { color: var(--positive); border-color: color-mix(in srgb, var(--positive) 32%, transparent); background: color-mix(in srgb, var(--positive) 9%, transparent); }
        .enr-badge.warn { color: var(--series-2); border-color: color-mix(in srgb, var(--series-2) 32%, transparent); background: color-mix(in srgb, var(--series-2) 9%, transparent); }

        .enr-meter-chip { flex: 1 1 140px; min-width: 130px; display: flex; flex-direction: column; gap: 5px; }
        .enr-meter-chip-label { font-size: var(--t-tiny); color: var(--text-2); font-weight: 560; }
        .enr-meter-chip-note { color: var(--text-3); font-weight: 400; }
        .enr-meter-track { display: block; height: 5px; border-radius: var(--r-pill); background: var(--seq-track); overflow: hidden; }
        .enr-meter-track span { display: block; height: 100%; background: var(--series-1); border-radius: var(--r-pill); transition: width 400ms var(--ease); }

        .enr-sections { display: flex; flex-direction: column; gap: 12px; }
        .enr-section-body { display: flex; flex-direction: column; gap: 16px; }
        .enr-section-blurb { margin: -4px 0 0; font-size: var(--t-small); color: var(--text-2); }
      `}</style>
    </BuildShell>
  );
}
