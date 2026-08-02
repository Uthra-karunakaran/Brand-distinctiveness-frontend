/* The one holder of a brand's accumulated build state.
 *
 * POST /brands/{id}/embeddings is a full replace, and nothing reads the
 * assets back -- GET /brands/{id} reports which layers are present, never
 * their values. So the browser is the only copy of the truth, and it has to
 * survive a refresh: this store round-trips through localStorage, keyed by
 * brand_id, so a save mid-flow doesn't silently delete everything that came
 * before it.
 *
 * `save()` is the single place that calls saveEmbeddings() -- no screen is
 * allowed to build that payload itself, because a screen that assembles its
 * own subset of assets is exactly how a field gets dropped.
 */

import { getBrand, saveEmbeddings } from "../api/brands";

const KEY_PREFIX = "locify.brandDraft.";

function emptyDraft(brandId, brandName) {
  return {
    brandId,
    brandName,
    assets: {},          // { [assetKey]: string | string[] }, accumulated across every save
    industry: { id: null, items: null },
    jobId: null,          // the in-flight job, if a save is running
    lastGoodJobId: null,  // the last job that resolved ready -- lets us re-poll after a refresh
  };
}

function storageKey(brandId) {
  return `${KEY_PREFIX}${brandId}`;
}

/* Drafts saved before saveEmbeddings() became the sole shape-converter could
 * have server-shaped items ({asset_type, source_url}) persisted where client
 * shape ({assetType, sourceUrl}) belongs -- reading one of those back and
 * re-editing it crashed on `.sourceUrl.trim()`. Heal it transparently on
 * load rather than requiring anyone to clear localStorage by hand. */
function normaliseIndustry(industry) {
  if (!industry) return { id: null, items: null };
  const items = (industry.items ?? [])
    .map((it) => ({
      text: it.text ?? "",
      assetType: it.assetType ?? it.asset_type ?? "",
      sourceUrl: it.sourceUrl ?? it.source_url ?? "",
    }))
    .filter((it) => it.text.trim());
  return { id: industry.id ?? null, items: industry.items == null ? null : items };
}

export function loadDraft(brandId) {
  try {
    const raw = localStorage.getItem(storageKey(brandId));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed?.brandId !== brandId) return null;
    return { ...parsed, industry: normaliseIndustry(parsed.industry) };
  } catch {
    return null;
  }
}

function persist(draft) {
  try {
    localStorage.setItem(storageKey(draft.brandId), JSON.stringify(draft));
  } catch {
    // A full localStorage must not crash the flow -- the in-memory draft
    // still works for the rest of this tab session, it just won't survive
    // a refresh.
  }
}

export function createDraft(brandId, brandName) {
  const draft = emptyDraft(brandId, brandName);
  persist(draft);
  return draft;
}

/* Merges new fields into the accumulated assets and industry choice, then
 * submits the WHOLE accumulated object -- never just what changed. Returns
 * the updated draft (with jobId set) so the caller can start polling.
 *
 * patch: { assets?: {...new/changed fields...}, industry?: {id, items} }
 */
export async function saveDraft(draft, patch) {
  const merged = {
    ...draft,
    assets: { ...draft.assets, ...(patch.assets ?? {}) },
    industry: patch.industry ?? draft.industry,
  };

  const jobId = await saveEmbeddings(merged); // throws JobInFlightError on 409
  const next = { ...merged, jobId };
  persist(next);
  return next;
}

export function markJobResolved(draft, job) {
  const next = {
    ...draft,
    jobId: null,
    lastGoodJobId: job.status === "ready" ? job.job_id : draft.lastGoodJobId,
  };
  persist(next);
  return next;
}

export function clearDraft(brandId) {
  try {
    localStorage.removeItem(storageKey(brandId));
  } catch {
    /* best effort */
  }
}

/* Field-level completeness, computed purely against the cached schema --
 * no network call beyond the one GET /schema/assets fetch. */
export function completeness(draft, schema) {
  if (!schema) return null;

  const hasField = (key) => {
    const v = draft.assets[key];
    return Array.isArray(v) ? v.length > 0 : Boolean(v && String(v).trim());
  };

  const coreFieldsDone = schema.mvbf_fields.filter(hasField).length;

  const perLayer = Object.fromEntries(
    Object.entries(schema.layers).map(([layer, fields]) => {
      const done = fields.filter(hasField).length;
      return [layer, { done, total: fields.length, pct: fields.length ? done / fields.length : 0 }];
    }),
  );

  return {
    coreFields: { done: coreFieldsDone, total: schema.mvbf_fields.length, met: coreFieldsDone === schema.mvbf_fields.length },
    layers: perLayer,
  };
}

/* Deep-link recovery: someone lands on an enrichment/review URL for a brand
 * this tab has never seen (new device, cleared storage). We can't recover the
 * asset values -- nothing round-trips them -- but we can recover enough to
 * keep going: the brand name and which layers already have content, from the
 * server's own view. */
export async function hydrateFromServer(brandId) {
  const server = await getBrand(brandId); // throws with .code === "not_found" on 404
  const draft = emptyDraft(brandId, server.brand_name);
  draft.industry = { id: server.industry ?? null, items: null };
  persist(draft);
  return { draft, server };
}
