import axios from "axios";
import { getVisitorId } from "./lib/visitorId";

/* The Locify scorer API.
 *
 *   GET  /brands               -> the brand catalog
 *   POST /brands/{slug}/score  -> a per-layer Report
 *
 * Two endpoints, and that is the whole surface. There is no /health, no
 * /analyze and no /rewrite. There is also no signature/cliché vocabulary
 * endpoint -- the Report itself carries `evidence.signature_terms_used` and
 * `evidence.cliches_detected`, so nothing else needs to be fetched.
 */

// Relative by default: the Vite dev server proxies /api -> the scorer (see
// vite.config.js). The API sets no CORS headers, so calling it cross-origin
// from the browser fails before it reaches the network.
const BASE = import.meta.env.VITE_API_BASE ?? "/api";

// X-Client-Key/X-Visitor-Id are non-secret signal headers, not auth -- see
// platform_admin.py on the backend for what they're actually used for.
const http = axios.create({
  baseURL: BASE,
  timeout: 120_000,
  headers: {
    "X-Client-Key": import.meta.env.VITE_CLIENT_KEY ?? "",
    "X-Visitor-Id": getVisitorId(),
  },
});

function message(error) {
  if (error.response?.status === 429) {
    return "You're going a bit fast — wait a moment and try again.";
  }
  if (error.response?.data?.detail) {
    const { detail } = error.response.data;
    return typeof detail === "string" ? detail : JSON.stringify(detail);
  }
  if (error.code === "ECONNABORTED") return "The request timed out.";
  if (error.request) {
    return `Cannot reach the API at ${BASE}. Is uvicorn running on that port?`;
  }
  return error.message;
}

/* GET /brands has been seen in two shapes:
 *
 *   {"brands": [{"brand_id": "duolingo", "brand_name": "Duolingo", ...}]}
 *   [{"id": 1, "name": "Duolingo", "slug": "duolingo"}]
 *
 * Both normalise to {id, name, slug} here so the rest of the app only ever
 * deals with one. `slug` is what the scoring route is keyed by; `id` is only
 * a stable handle for the <select>, so it is positional when absent.
 */
function normaliseBrands(data) {
  const list = Array.isArray(data) ? data : (data?.brands ?? []);
  return list
    .map((b, i) => {
      const slug = b.slug ?? b.brand_id ?? b.id;
      if (slug === undefined || slug === null) return null;
      return {
        id: typeof b.id === "number" ? b.id : i + 1,
        name: b.name ?? b.brand_name ?? String(slug),
        slug: String(slug),
      };
    })
    .filter(Boolean);
}

export async function fetchBrands() {
  try {
    const { data } = await http.get("/brands");
    return normaliseBrands(data);
  } catch {
    return [];
  }
}

export async function scoreCopy({ slug, text, intendedLayer = "messaging" }) {
  try {
    const { data } = await http.post(`/brands/${encodeURIComponent(slug)}/score`, {
      text,
      intended_layer: intendedLayer,
    });
    return data;
  } catch (error) {
    throw new Error(message(error));
  }
}
