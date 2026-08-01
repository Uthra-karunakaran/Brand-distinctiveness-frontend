import axios from "axios";

/* Brand onboarding transport.
 *
 * THE BACKEND FOR THIS FLOW DOES NOT EXIST YET. This module is the seam:
 * the UI only ever calls submitBrand() and fetchBrandJob(), and never knows
 * which side of the flag answered. Today the simulated side answers, so the
 * whole flow -- submit, progress, polling, partial results filling in -- is
 * exercisable end to end with nothing running behind it.
 *
 * To switch to the real API, set VITE_ONBOARDING_API=live in .env and
 * implement these two routes. Nothing in the components changes.
 *
 *   POST /brands/onboard        {brand payload}  -> {job_id}
 *   GET  /brands/onboard/{id}                    -> {status, progress, steps, profile}
 *
 * The shape fetchBrandJob resolves to is the contract; normaliseJob() below
 * is the only place that has to absorb whatever the server actually sends.
 */

const LIVE = import.meta.env.VITE_ONBOARDING_API === "live";
const BASE = import.meta.env.VITE_API_BASE ?? "/api";

const http = axios.create({ baseURL: BASE, timeout: 60_000 });

export const STEPS = [
  { key: "crawl", label: "Reading your pages", detail: "Fetching and cleaning the copy on every URL you gave us." },
  { key: "identity", label: "Extracting brand identity", detail: "Pulling the name, promise and recurring language out of that copy." },
  { key: "competitors", label: "Sweeping the category", detail: "Reading competitor sites to learn what everyone else already sounds like." },
  { key: "tone", label: "Building the tone profile", detail: "Placing the brand on five personality axes." },
  { key: "baseline", label: "Calibrating the baseline", detail: "Setting the on-brand and stand-out reference points for scoring." },
];

/* ── shared shape ────────────────────────────────────────────────────────── */

function normaliseJob(raw, jobId) {
  const status = raw?.status === "ready" || raw?.status === "failed" ? raw.status : "processing";
  const doneCount = Number(raw?.completed_steps ?? raw?.step_index ?? 0);
  return {
    jobId,
    status,
    progress: Math.max(0, Math.min(100, Number(raw?.progress ?? 0))),
    steps: STEPS.map((s, i) => ({
      ...s,
      state: raw?.steps?.[i]?.state
        ?? (i < doneCount ? "done" : i === doneCount && status !== "ready" ? "active" : status === "ready" ? "done" : "pending"),
    })),
    profile: raw?.profile ?? null,
    error: raw?.error ?? null,
  };
}

/* ── live ────────────────────────────────────────────────────────────────── */

async function submitLive(payload) {
  const { data } = await http.post("/brands/onboard", payload);
  return String(data?.job_id ?? data?.id);
}

async function fetchLive(jobId) {
  const { data } = await http.get(`/brands/onboard/${encodeURIComponent(jobId)}`);
  return normaliseJob(data, jobId);
}

/* ── simulated ───────────────────────────────────────────────────────────── */

/* Jobs live in memory only: a reload loses the run, which is the honest
 * behaviour for a stub and avoids pretending we have persistence. */
const jobs = new Map();
let seq = 0;

const STEP_MS = 3000;
const TOTAL_MS = STEP_MS * STEPS.length;

// Deterministic per-brand pseudo-values. Poll responses have to agree with
// each other, so nothing here may be random -- a fresh Math.random() on every
// poll would make the bars twitch each time the preview refreshed.
function hash(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

function axisValue(seed, i) {
  return Math.round(((hash(`${seed}:${i}`) % 1000) / 1000) * 90 + 5) / 10; // 0.5–9.5
}

const TONE_AXES = [
  { key: "formal_casual", trait: "Formality", left: "Formal", right: "Casual" },
  { key: "serious_playful", trait: "Playfulness", left: "Serious", right: "Playful" },
  { key: "corporate_human", trait: "Warmth", left: "Corporate", right: "Human" },
  { key: "restrained_bold", trait: "Boldness", left: "Restrained", right: "Bold" },
  { key: "technical_accessible", trait: "Accessibility", left: "Technical", right: "Accessible" },
];

/* Filler words carry no brand signal, so a keyword list that surfaces "whether"
 * and "your" reads as broken rather than as analysis. The real extractor will
 * do this properly; the stub at least has to not embarrass itself. */
const STOPWORDS = new Set([
  "about", "after", "against", "apart", "because", "before", "being", "between",
  "could", "every", "from", "give", "have", "into", "like", "more", "most",
  "much", "other", "over", "should", "since", "some", "such", "than", "that",
  "their", "them", "then", "there", "these", "they", "thing", "things", "this",
  "those", "through", "under", "until", "what", "when", "where", "whether",
  "which", "while", "with", "world", "would", "your", "yours", "piece", "sounds",
  "read", "know", "teams", "makes", "make", "want", "need", "gets", "just",
]);

function keywordsFrom(...texts) {
  const seen = new Set();
  const out = [];
  for (const text of texts) {
    for (const raw of String(text || "").split(/[^\p{L}\p{N}'-]+/u)) {
      const word = raw.replace(/^['-]+|['-]+$/g, "");
      const key = word.toLowerCase();
      if (word.length < 5 || STOPWORDS.has(key) || seen.has(key)) continue;
      seen.add(key);
      out.push(word);
    }
  }
  return out;
}

/* The stub does not invent claims about the brand: everything in the profile
 * is either echoed straight back from what was typed, or a number labelled in
 * the UI as a baseline the real analysis will replace. */
function buildProfile(payload, elapsed) {
  const seed = payload.name || "brand";
  const hasTone = elapsed >= STEP_MS * 4;
  const hasBaseline = elapsed >= TOTAL_MS;

  const sources = [
    ...payload.websites.map((url) => ({ url, kind: "website" })),
    ...payload.competitors.map((url) => ({ url, kind: "competitor" })),
  ].map((s, i) => ({
    ...s,
    pages: 3 + (hash(s.url) % 9),
    state: elapsed >= STEP_MS * (s.kind === "website" ? 1 : 3) ? "done" : "pending",
    order: i,
  }));

  return {
    name: payload.name,
    tagline: payload.tagline,
    mission: payload.mission,
    vision: payload.vision,
    values: payload.values,
    // Keywords are lifted from the copy the user typed, not conjured.
    keywords: keywordsFrom(payload.tagline, payload.mission, payload.vision).slice(0, 9),
    tone: hasTone
      ? TONE_AXES.map((a, i) => ({ ...a, value: axisValue(seed, i) }))
      : null,
    baseline: hasBaseline
      ? {
        consistency: 60 + (hash(`${seed}:c`) % 30),
        distinctiveness: 45 + (hash(`${seed}:d`) % 40),
        chunks: sources.reduce((n, s) => n + s.pages, 0) * 4,
      }
      : null,
    sources,
  };
}

function submitStub(payload) {
  const jobId = `stub-${++seq}`;
  jobs.set(jobId, { payload, startedAt: Date.now() });
  return jobId;
}

function fetchStub(jobId) {
  const job = jobs.get(jobId);
  if (!job) throw new Error("That analysis run has expired. Please submit again.");

  const elapsed = Date.now() - job.startedAt;
  const doneCount = Math.min(STEPS.length, Math.floor(elapsed / STEP_MS));
  const ready = elapsed >= TOTAL_MS;

  return normaliseJob(
    {
      status: ready ? "ready" : "processing",
      progress: Math.min(100, Math.round((elapsed / TOTAL_MS) * 100)),
      completed_steps: doneCount,
      // The profile shows up mid-run, before the analysis is finished -- that
      // is the case the preview screen has to handle by filling in live.
      profile: elapsed >= STEP_MS * 2 ? buildProfile(job.payload, elapsed) : null,
    },
    jobId,
  );
}

/* ── public surface ──────────────────────────────────────────────────────── */

export async function submitBrand(payload) {
  if (LIVE) return submitLive(payload);
  await new Promise((r) => setTimeout(r, 650)); // a submit that takes no time reads as a bug
  return submitStub(payload);
}

export async function fetchBrandJob(jobId) {
  if (LIVE) return fetchLive(jobId);
  return fetchStub(jobId);
}

export const POLL_MS = 2000;
