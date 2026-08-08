import axios from "axios";
import { getVisitorId } from "./visitorId";

/* The logo/image classifier search API -- a separate service from the copy
 * scorer in api.js. POST /search takes the image itself (multipart) and
 * returns its nearest matches by embedding similarity; the backend owns
 * getting it onto Drive, so the browser never touches Google APIs.
 */

// Relative by default: the Vite dev server proxies /classifier-api -> the
// search service (see vite.config.js), same trick as api.js uses for /api.
const BASE = import.meta.env.VITE_CLASSIFIER_API_BASE ?? "/classifier-api";

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

function message(error) {
  if (error.response?.status === 429) {
    return "You're going a bit fast — wait a moment and try again.";
  }
  if (error.response?.data?.detail) {
    const { detail } = error.response.data;
    return typeof detail === "string" ? detail : JSON.stringify(detail);
  }
  if (error.code === "ECONNABORTED") return "The request timed out.";
  if (error.request) return `Cannot reach the classifier API at ${BASE}. Is it running on that port?`;
  return error.message;
}

export async function searchByImage(file, topK = 5) {
  const form = new FormData();
  form.append("image", file);
  form.append("top_k", topK);

  try {
    const { data } = await http.post("/search", form);
    return data;
  } catch (error) {
    throw new Error(message(error));
  }
}
