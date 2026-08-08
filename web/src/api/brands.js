import axios from "axios";
import { JobInFlightError } from "./errors";
import { getVisitorId } from "../lib/visitorId";

/* Brand-build API client -- the seven endpoints of the build flow, called for
 * real. No mock, no stub branch: every function here is a straight axios call
 * against the backend proxied at VITE_API_BASE (see vite.config.js -- /api
 * proxies to the real server so the browser never hits CORS).
 *
 *   POST /brands                     mint a brand_id
 *   POST /brands/{id}/embeddings     submit assets (full replace, async)
 *   GET  /jobs/{job_id}              poll a submission to ready/failed
 *   POST /brands/{id}/score          score a piece of copy
 *   GET  /schema/assets              asset types per layer (fetch once)
 *   GET  /industries                 generic-corpus catalog
 *   GET  /brands/{id}                server-side review of the brand
 *
 * Two contract facts every caller has to respect, enforced as far as possible
 * here rather than trusted to each screen:
 *
 *   1. /embeddings is a FULL REPLACE. The server rebuilds the fingerprint from
 *      exactly the assets object sent, and nothing reads the assets back --
 *      GET /brands/{id} returns which layers are present, never their values.
 *      So the browser is the only holder of the accumulated assets, and every
 *      payload must be built from the whole draft. saveEmbeddings() therefore
 *      takes the draft, not a patch; see state/brandDraft.js, which is the one
 *      place allowed to call it.
 *
 *   2. A 202 means "queued", not "valid". Missing core fields, unknown
 *      industries and unmapped asset types only surface later on the job. Use
 *      pollJob() and branch on the terminal job's error.code -- never treat a
 *      resolved POST as a successful save.
 */

const BASE = import.meta.env.VITE_API_BASE ?? "/api";

// X-Client-Key/X-Visitor-Id are non-secret signal headers, not auth -- see
// platform_admin.py on the backend for what they're actually used for.
const http = axios.create({
  baseURL: BASE,
  timeout: 60_000,
  headers: {
    "X-Client-Key": import.meta.env.VITE_CLIENT_KEY ?? "",
    "X-Visitor-Id": getVisitorId(),
  },
});

/* The exact stage sequence the backend reports. The progress bar is driven off
 * this list and the job's own `stage` string -- not off invented steps, which
 * would drift from what the server is actually doing. */
export const JOB_STAGES = [
  { key: "fingerprinting", label: "Fingerprinting your copy" },
  { key: "fitting_embedder", label: "Fitting the embedder" },
  { key: "encoding_vectors", label: "Encoding vectors" },
  { key: "building_index", label: "Building the index" },
  { key: "writing_manifest", label: "Writing the manifest" },
];

export const POLL_MS = 800;

export { JobInFlightError };

function message(error) {
  const detail = error.response?.data?.detail;
  if (detail) return typeof detail === "string" ? detail : JSON.stringify(detail);
  if (error.code === "ECONNABORTED") return "The request timed out.";
  if (error.request) return `Cannot reach the API at ${BASE}.`;
  return error.message;
}

/* ── 1. POST /brands -- mint a brand_id ──────────────────────────────────── */

export async function createBrand(brandName) {
  try {
    const { data } = await http.post("/brands", { brand_name: brandName });
    return data.brand_id;
  } catch (e) {
    throw new Error(message(e));
  }
}

/* ── 2. POST /brands/{id}/embeddings ─────────────────────────────────────── */

/* Takes the whole draft and serialises it. Deliberately has no "patch" form:
 * a partial payload is a silent delete, so the shape of this function is the
 * guard against writing one by accident.
 *
 * draft.industry.items is always CLIENT shape here -- {text, assetType,
 * sourceUrl}, whatever IndustryPicker produced -- and this is the one and
 * only place that converts it to the server's {text, asset_type, source_url}.
 * That conversion must not happen anywhere else: if a caller converted and
 * then handed the SERVER-shaped object to saveDraft(), it would get persisted
 * into the draft verbatim, and the next read of draft.industry.items would be
 * server-shaped where every other piece of code expects client-shaped --
 * exactly the bug (`sourceUrl` undefined -> `.trim()` on undefined) this
 * comment is here to stop someone reintroducing. */
export async function saveEmbeddings(draft) {
  const items = (draft.industry.items ?? []).filter((it) => it.text?.trim());
  const payload = {
    brand_name: draft.brandName,
    assets: draft.assets,
    generic_corpus: items.length
      ? {
        industry: draft.industry.id,
        items: items.map((it) => ({
          text: it.text.trim(),
          asset_type: it.assetType,
          source_url: it.sourceUrl?.trim() || undefined,
        })),
      }
      : { industry: draft.industry.id },
  };

  try {
    const { data } = await http.post(
      `/brands/${encodeURIComponent(draft.brandId)}/embeddings`, payload,
    );
    return data.job_id;
  } catch (e) {
    if (e.response?.status === 409) throw new JobInFlightError(e.response.data?.detail);
    throw new Error(message(e));
  }
}

/* ── 3. GET /jobs/{job_id} -- poll after every embeddings POST ───────────── */

export async function getJob(jobId) {
  try {
    const { data } = await http.get(`/jobs/${encodeURIComponent(jobId)}`);
    return data;
  } catch (e) {
    throw new Error(message(e));
  }
}

/* Self-scheduling timeout rather than setInterval: a response slower than the
 * interval would otherwise stack requests behind each other. Resolves on the
 * terminal job (ready OR failed) -- a failed job is a normal outcome to be
 * rendered, not an exception to be thrown. */
export function pollJob(jobId, { onTick, signal } = {}) {
  return new Promise((resolve, reject) => {
    let timer = null;
    const stop = () => timer && clearTimeout(timer);

    signal?.addEventListener("abort", () => {
      stop();
      reject(new DOMException("Polling aborted", "AbortError"));
    });

    const tick = async () => {
      if (signal?.aborted) return;
      try {
        const job = await getJob(jobId);
        if (signal?.aborted) return;
        onTick?.(job);
        if (job.status === "ready" || job.status === "failed") return resolve(job);
        timer = setTimeout(tick, POLL_MS);
      } catch (e) {
        reject(e);
      }
    };

    tick();
  });
}

/* ── 4. POST /brands/{id}/score ──────────────────────────────────────────── */

export async function scoreBrandCopy(brandId, { text, intendedLayer = "identity", channel, label }) {
  try {
    const { data } = await http.post(`/brands/${encodeURIComponent(brandId)}/score`, {
      text,
      intended_layer: intendedLayer,
      ...(channel ? { channel } : {}),
      ...(label ? { label } : {}),
    });
    return data;
  } catch (e) {
    throw new Error(message(e));
  }
}

/* ── 5. GET /schema/assets -- fetched once per session ───────────────────── */

let schemaPromise = null;

export function getAssetSchema() {
  if (!schemaPromise) {
    schemaPromise = http.get("/schema/assets").then((r) => r.data).catch((e) => {
      schemaPromise = null; // a failed fetch must not be cached forever
      throw new Error(message(e));
    });
  }
  return schemaPromise;
}

/* ── 6. GET /industries ───────────────────────────────────────────────────── */

export async function getIndustries() {
  try {
    const { data } = await http.get("/industries");
    return data.industries ?? [];
  } catch (e) {
    throw new Error(message(e));
  }
}

/* ── 7. GET /brands/{id} ──────────────────────────────────────────────────── */

export async function getBrand(brandId) {
  try {
    const { data } = await http.get(`/brands/${encodeURIComponent(brandId)}`);
    return data;
  } catch (e) {
    if (e.response?.status === 404) {
      const err = new Error("This brand has no completed build yet.");
      err.code = "not_found";
      throw err;
    }
    throw new Error(message(e));
  }
}
