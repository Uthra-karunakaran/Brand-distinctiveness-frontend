import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { createBrand, getAssetSchema, getIndustries, JobInFlightError } from "../../api/brands";
import BuildShell from "../../components/build/BuildShell";
import IndustryPicker from "../../components/build/IndustryPicker";
import { SAMPLE_BRANDS } from "../../lib/sampleBrands";
import { createDraft, loadDraft, saveDraft } from "../../state/brandDraft";

/* Step 1: mint the brand, then the very first POST /brands/{id}/embeddings.
 *
 * Two very different situations share this screen:
 *
 *   - fresh (`/brands/new`): no brand_id exists yet. Submit mints one, then
 *     immediately saves.
 *   - retry (`/brands/:brandId/quick-start`): BuildingPage sent the user back
 *     here after an `mvbf_not_met` failure, with the offending field names in
 *     navigation state. The brand_id already exists; the field VALUES are not
 *     re-sent through that redirect -- they come back from the persisted
 *     draft (see state/brandDraft.js), because that draft is the only place
 *     that remembers what was actually submitted last time.
 *
 * The six MVBF fields are the only assets this screen ever writes. Industry
 * is required on this exact call too, per the contract, so the picker lives
 * here rather than on a later screen the user might not reach before saving.
 */

const MVBF_FIELDS = [
  { key: "name", label: "Brand name", placeholder: "Linguacore" },
  { key: "tagline", label: "Tagline", area: false, placeholder: "The one line you'd put under the logo." },
  { key: "mission", label: "Mission", area: true, placeholder: "Why the company exists today, in a sentence or two." },
  { key: "vision", label: "Vision", area: true, placeholder: "The world you're trying to bring about." },
  { key: "values", label: "Values", area: true, placeholder: "What the brand refuses to compromise on." },
  { key: "about", label: "About", area: true, placeholder: "How the brand introduces itself, in its own words." },
];

export default function QuickStartPage() {
  const { brandId: brandIdParam } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [brandId, setBrandId] = useState(brandIdParam ?? null);
  const [fields, setFields] = useState({ name: "", tagline: "", mission: "", vision: "", values: "", about: "" });
  const [industry, setIndustry] = useState({ id: null, items: null });
  // Fields a sample brand carries beyond the six visible here (homepage,
  // blog, case_study...). Not shown on this screen -- there's no form for
  // them yet -- but /embeddings accepts any asset_type in one call, so they
  // ride along in the same submit rather than being dropped on the floor
  // until someone visits Enrich.
  const [extraAssets, setExtraAssets] = useState({});
  const [sampleApplied, setSampleApplied] = useState(null);

  const [schema, setSchema] = useState(null);
  const [industries, setIndustries] = useState(null); // null = still loading
  const [recoveryNotice, setRecoveryNotice] = useState(false);

  const [attempted, setAttempted] = useState(false);
  const [fieldErrors, setFieldErrors] = useState(() => new Set(location.state?.fieldErrors ?? []));
  const [industryError, setIndustryError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const nameRef = useRef(null);

  useEffect(() => {
    getAssetSchema().then(setSchema).catch(() => {});
    getIndustries().then(setIndustries).catch(() => setIndustries([]));
  }, []);

  useEffect(() => {
    if (!brandIdParam) return;
    const draft = loadDraft(brandIdParam);
    if (draft) {
      setBrandId(draft.brandId);
      setFields((f) => ({ ...f, name: draft.brandName ?? f.name, ...draft.assets }));
      setIndustry(draft.industry ?? { id: null, items: null });
    } else {
      // Deep link / different device -- the brand_id is real, but nothing
      // round-trips asset VALUES, so there is nothing to prefill with. Say so
      // rather than silently presenting empty fields as if this were fresh.
      setRecoveryNotice(true);
      setBrandId(brandIdParam);
    }
  }, [brandIdParam]);

  const set = (key, value) => {
    setFields((f) => ({ ...f, [key]: value }));
    if (value.trim()) setFieldErrors((prev) => (prev.has(key) ? new Set([...prev].filter((k) => k !== key)) : prev));
  };

  // Autofill: fills the six visible fields, stashes everything else the
  // fixture carries for submit time, and sets industry to whichever path the
  // fixture actually exercises -- an existing id (Linguacore) or a brand-new
  // one seeded from competitor snippets (TrailForge). Whether an id is
  // "existing" depends on GET /industries, so this is a no-op until that has
  // loaded -- the control is disabled until then rather than guessing.
  const applySample = (sample) => {
    if (!sample || !industries) return;
    setFields((f) => ({ ...f, ...sample.mvbf }));
    setExtraAssets(sample.extraAssets);
    setFieldErrors(new Set());

    const known = industries.some((i) => i.industry_id === sample.industryId);
    setIndustry(known
      ? { id: sample.industryId, items: null }
      : { id: sample.industryId, items: sample.industryItems });
    setIndustryError(null);
    setSampleApplied(sample.label);
  };

  const missingRequired = useMemo(
    () => MVBF_FIELDS.filter((f) => !fields[f.key].trim()).map((f) => f.key),
    [fields],
  );
  const industryMissing = !industry.id
    || (!(industries ?? []).some((i) => i.industry_id === industry.id) && !(industry.items ?? []).some((it) => it.text.trim()));

  const submit = async (e) => {
    e.preventDefault();
    setAttempted(true);
    setSubmitError(null);

    if (missingRequired.length) {
      setFieldErrors(new Set(missingRequired));
      nameRef.current?.focus();
      document.querySelector(".bf-error")?.scrollIntoView({ block: "center", behavior: "smooth" });
      return;
    }
    if (industryMissing) {
      setIndustryError(industry.id ? "Add at least one snippet to create this industry." : "Choose an industry, or create one from competitor snippets.");
      document.getElementById("indp-select")?.scrollIntoView({ block: "center", behavior: "smooth" });
      return;
    }

    setSubmitting(true);
    try {
      let id = brandId;
      let draft = id ? loadDraft(id) : null;
      if (!id) {
        id = await createBrand(fields.name.trim());
        setBrandId(id);
      }
      if (!draft) draft = createDraft(id, fields.name.trim());

      const assets = {
        ...extraAssets,
        ...Object.fromEntries(MVBF_FIELDS.map((f) => [f.key, fields[f.key].trim()])),
      };
      // Client shape only -- {text, assetType, sourceUrl}. saveEmbeddings()
      // in api/brands.js is the one place that converts to the server's
      // snake_case shape; converting here would get the converted object
      // persisted back into the draft and corrupt every later read of it.
      const industryPayload = {
        id: industry.id,
        items: (industry.items ?? []).filter((it) => it.text.trim()),
      };

      const updated = await saveDraft({ ...draft, brandName: fields.name.trim() }, { assets, industry: industryPayload });
      navigate(`/brands/${id}/building`);
      void updated;
    } catch (err) {
      if (err instanceof JobInFlightError) {
        // A save from this exact brand is already running -- ride along
        // rather than filing a second one.
        navigate(`/brands/${brandId}/building`);
        return;
      }
      setSubmitError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const assetTypes = schema ? [...new Set(Object.values(schema.layers).flat())] : [];

  return (
    <BuildShell
      stage="quick-start"
      title="Quick start"
      subtitle="The minimum viable brand fingerprint"
      onBack={() => navigate("/")}
      actions={
        <label className="qs-autofill" title="Fill this form from a sample brand">
          <span className="bf-hint">Autofill</span>
          <select
            value=""
            disabled={!industries}
            onChange={(e) => {
              const sample = SAMPLE_BRANDS.find((s) => s.label === e.target.value);
              applySample(sample);
            }}
            aria-label="Autofill from a sample brand"
          >
            <option value="" disabled>{industries ? "Choose a sample…" : "Loading…"}</option>
            {SAMPLE_BRANDS.map((s) => (
              <option key={s.label} value={s.label}>{s.label}</option>
            ))}
          </select>
        </label>
      }
    >
      {sampleApplied && (
        <p className="qs-sample-note">
          Filled from <strong>{sampleApplied}</strong>.
          {Object.keys(extraAssets).length > 0 && (
            <> {Object.keys(extraAssets).length} more fields ({Object.keys(extraAssets).slice(0, 3).join(", ")}…)
            came with it — they're not shown here, but they'll be included when you start the build and
            you'll see them already filled in on the Enrich screen.</>
          )}
        </p>
      )}

      {recoveryNotice && (
        <p className="error">
          <strong>Starting fresh on this device.</strong> This brand was created elsewhere, and its
          entries don't sync between devices — re-enter the six fields below and they'll replace
          whatever was saved before.
        </p>
      )}

      <form className="bf-form" onSubmit={submit} noValidate>
        <section className="bf-section">
          <div className="bf-section-head">
            <div>
              <h3>The six fields</h3>
              <p>Every one of these is required — a build can't start without all six.</p>
            </div>
          </div>

          <div className="bf-grid">
            {MVBF_FIELDS.map((f) => (
              <div className="bf-field" key={f.key} style={f.area ? { gridColumn: "1 / -1" } : undefined}>
                <label className="bf-label" htmlFor={`qs-${f.key}`}>
                  {f.label} <span className="bf-req">Required</span>
                </label>
                {f.area ? (
                  <textarea
                    id={`qs-${f.key}`} rows={3}
                    className={attempted && fieldErrors.has(f.key) ? "invalid" : ""}
                    value={fields[f.key]} onChange={(e) => set(f.key, e.target.value)}
                    placeholder={f.placeholder}
                  />
                ) : (
                  <input
                    id={`qs-${f.key}`} type="text" ref={f.key === "name" ? nameRef : undefined}
                    className={attempted && fieldErrors.has(f.key) ? "invalid" : ""}
                    value={fields[f.key]} onChange={(e) => set(f.key, e.target.value)}
                    placeholder={f.placeholder}
                  />
                )}
                {attempted && fieldErrors.has(f.key) && <span className="bf-error">This field is required.</span>}
              </div>
            ))}
          </div>
        </section>

        <section className="bf-section">
          <div className="bf-section-head">
            <div>
              <h3>Category</h3>
              <p>What "stands out from the category" gets measured against. Required on this save and every one after it.</p>
            </div>
          </div>
          {industries ? (
            <IndustryPicker
              // IndustryPicker's "existing vs. custom" mode is local state,
              // set once on mount from `value` -- it doesn't re-derive when a
              // parent action like Autofill replaces `value` wholesale after
              // mount. Keying on the applied sample forces a clean remount so
              // the mode is freshly computed from the new industry instead of
              // showing a stale picker for the old one.
              key={sampleApplied ?? "empty"}
              industries={industries}
              assetTypes={assetTypes}
              value={industry}
              onChange={(v) => { setIndustry(v); setIndustryError(null); }}
              compact
              error={attempted ? industryError : null}
            />
          ) : (
            <div className="shimmer" style={{ height: 76, borderRadius: "var(--r-md)" }} />
          )}
        </section>

        {submitError && (
          <p className="error bf-submit-error"><strong>Couldn't start the build.</strong> {submitError}</p>
        )}

        <div className="bf-actions">
          <div className="bf-actions-info">
            <span className="bf-hint">
              This kicks off an async build — you'll watch it progress on the next screen.
            </span>
          </div>
          <div className="bf-actions-buttons">
            <button type="submit" disabled={submitting}>
              {submitting ? (<><span className="spinner" />Starting…</>) : "Start build"}
            </button>
          </div>
        </div>
      </form>

      <style>{`
        .bf-form { display: flex; flex-direction: column; gap: var(--gap); }

        .qs-autofill { display: inline-flex; align-items: center; gap: 8px; }
        .qs-autofill select { min-width: 190px; }

        .qs-sample-note {
          margin: -6px 0 0; padding: 10px 14px; border-radius: var(--r-md);
          font-size: var(--t-small); color: var(--text-2);
          background: var(--series-1-soft);
          border: 1px solid color-mix(in srgb, var(--series-1) 24%, transparent);
        }
        .qs-sample-note strong { color: var(--text); }
      `}</style>
    </BuildShell>
  );
}
