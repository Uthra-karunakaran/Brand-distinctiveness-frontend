import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { getAssetSchema, getIndustries, JobInFlightError } from "../../api/brands";
import BuildShell from "../../components/build/BuildShell";
import IndustryPicker from "../../components/build/IndustryPicker";
import { loadDraft, saveDraft } from "../../state/brandDraft";

/* The standalone industry / competitor-corpus screen -- reachable from the
 * enrichment hub, and also where BuildingPage sends a failed job whose
 * error.code was unknown_industry.
 *
 * Same IndustryPicker as Quick Start, in its full (non-compact) form. The
 * component itself is what enforces "no implied edit": choosing an industry
 * that already exists clears any pasted items before they could be sent, so
 * there is no path through this screen that quietly asks the server to do
 * something it doesn't support.
 */
export default function CompetitorsPage() {
  const { brandId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [draft, setDraft] = useState(() => loadDraft(brandId));
  const [schema, setSchema] = useState(null);
  const [industries, setIndustries] = useState(null); // null = still loading
  const [industry, setIndustry] = useState(() => draft?.industry ?? { id: null, items: null });
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  useEffect(() => {
    if (!draft) {
      navigate(`/brands/${brandId}/quick-start`, { replace: true });
      return;
    }
    getAssetSchema().then(setSchema).catch(() => {});
    getIndustries().then(setIndustries).catch((e) => { setIndustries([]); setSubmitError(e.message); });
  }, [brandId, draft, navigate]);

  const assetTypes = schema ? [...new Set(Object.values(schema.layers).flat())] : [];
  const isNewCustom = industry.id && !(industries ?? []).some((i) => i.industry_id === industry.id);
  const itemsFilled = (industry.items ?? []).some((it) => it.text.trim());

  const save = async () => {
    setError(null);
    if (!industry.id) return setError("Choose an industry, or create one from competitor snippets.");
    if (isNewCustom && !itemsFilled) return setError("Add at least one snippet to create this industry.");

    setSubmitting(true);
    setSubmitError(null);
    try {
      // Client shape only -- saveEmbeddings() in api/brands.js converts to
      // the server's snake_case shape; converting here would get that
      // converted object persisted back into the draft and corrupt every
      // later read of it (assetType/sourceUrl silently becoming undefined).
      //
      // items is forced to null on anything but the genuinely-new-custom
      // path, regardless of what industry.items happens to hold -- picking
      // an EXISTING industry must never send items, even if some got typed
      // in before the user switched back to the dropdown.
      const payload = {
        id: industry.id,
        items: isNewCustom ? (industry.items ?? []).filter((it) => it.text.trim()) : null,
      };
      const updated = await saveDraft(draft, { industry: payload });
      setDraft(updated);
      navigate(`/brands/${brandId}/building`);
    } catch (e) {
      if (e instanceof JobInFlightError) {
        setSubmitError("A build is already running for this brand — wait for it to finish before saving again.");
      } else {
        setSubmitError(e.message);
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (!draft || !schema || !industries) {
    return (
      <BuildShell stage="enrich" title="Competitor set" subtitle="Loading…" onBack={() => navigate(`/brands/${brandId}/enrich`)}>
        <div className="shimmer" style={{ height: 220, borderRadius: "var(--r-lg)" }} />
      </BuildShell>
    );
  }

  return (
    <BuildShell
      stage="enrich"
      title="Competitor set"
      subtitle="The category this brand is measured against. Pick an existing one, or seed a new category the first time it's needed."
      onBack={() => navigate(`/brands/${brandId}/enrich`)}
    >
      {location.state?.message && (
        <p className="error">
          <strong>That industry couldn't be used.</strong> {location.state.message}
        </p>
      )}

      <section className="bf-section">
        <IndustryPicker
          industries={industries}
          assetTypes={assetTypes}
          value={industry}
          onChange={(v) => { setIndustry(v); setError(null); }}
          error={error}
        />
      </section>

      {submitError && <p className="error bf-submit-error"><strong>Couldn't save.</strong> {submitError}</p>}

      <div className="bf-actions">
        <div className="bf-actions-info">
          <span className="bf-hint">
            Saving here re-runs the build, same as any other save.
          </span>
        </div>
        <div className="bf-actions-buttons">
          <button onClick={save} disabled={submitting}>
            {submitting ? (<><span className="spinner" />Saving…</>) : "Save and rebuild"}
          </button>
        </div>
      </div>
    </BuildShell>
  );
}
