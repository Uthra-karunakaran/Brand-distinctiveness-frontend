/* Record the backup video.
 *
 *   npm run record-demo            # needs the API on :8000 and vite on :5173
 *
 * The plan: "Record a backup video of the full flow -- venue wifi/API failures
 * are common." This drives the real dashboard against the real API and writes a
 * webm, so the fallback is a recording of the actual product rather than a
 * slideshow of screenshots.
 *
 * It paces itself for a human watching, not for a test runner: the beats are
 * timed to match the 90-second demo slot in demo/SCRIPT.md, and it pauses on the
 * dot animation because that is the moment you stop talking.
 *
 * If ANTHROPIC_API_KEY is set the rewrite is real. If not, the recorder falls
 * back to the human-written rewrite from demo/demo_content.json and BURNS A
 * CAPTION saying so -- an unlabelled fallback in a backup video is the kind of
 * thing that gets noticed on stage.
 */

import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const API = process.env.VITE_API_BASE ?? "http://localhost:8000";
const APP = "http://localhost:5173";
const OUT = process.argv[2] ?? "demo-video";
const REPO = path.resolve(process.cwd(), "..");

const demo = JSON.parse(
  fs.readFileSync(path.join(REPO, "demo", "demo_content.json"), "utf-8"),
);
const primary = demo.pieces.find((p) => p.id === "primary");
const fallback = demo.rewrite_fallback;

const post = async (route, body) =>
  (
    await fetch(API + route, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    })
  ).json();

const pause = (ms) => new Promise((r) => setTimeout(r, ms));

async function llmAvailable() {
  try {
    return (await (await fetch(API + "/health")).json()).llm_available;
  } catch {
    return false;
  }
}

const live = await llmAvailable();
console.log(
  live
    ? "LLM available - recording a real rewrite."
    : "No LLM credentials - recording with the human-written fallback rewrite (captioned).",
);

fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 1440, height: 1000 },
  recordVideo: { dir: OUT, size: { width: 1440, height: 1000 } },
});
const page = await context.newPage();

// Offline path: intercept /rewrite and serve the human-written rewrite, scored
// live by the real engine so the delta on screen is genuine.
if (!live) {
  const original = await post("/analyze", {
    text: primary.content,
    brand_id: 1,
  });
  const rewritten = await post("/analyze", {
    text: fallback.content,
    brand_id: 1,
  });
  const d = (k) => Math.round((rewritten[k] - original[k]) * 100) / 100;

  await page.route("**/rewrite", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        original,
        rewritten,
        delta: {
          bdi: d("bdi"),
          distinctiveness: d("distinctiveness"),
          fidelity: d("fidelity"),
          quadrant_changed: original.quadrant !== rewritten.quadrant,
          from_quadrant: original.quadrant,
          to_quadrant: rewritten.quadrant,
        },
        changes: [
          {
            removed: "cutting-edge solutions that deliver seamless experiences",
            replaced_with: "the first nudge goes out on day three",
            why: "stock phrase replaced with the actual mechanic",
          },
          {
            removed: "unlock their full potential",
            replaced_with: "the money arrived eleven days sooner",
            why: "abstraction replaced with a measured outcome",
          },
        ],
        preserved_meaning:
          "Same product, same audience, same claim. Only the writing changed.",
        model: "human-written fallback",
      }),
    }),
  );
}

async function caption(text, ms = 3200) {
  await page.evaluate((t) => {
    let el = document.getElementById("__demo_caption");
    if (!el) {
      el = document.createElement("div");
      el.id = "__demo_caption";
      el.style.cssText =
        "position:fixed;left:50%;bottom:34px;transform:translateX(-50%);" +
        "background:rgba(11,11,11,.9);color:#fff;padding:11px 20px;border-radius:9px;" +
        "font:500 15px system-ui,-apple-system,'Segoe UI',sans-serif;z-index:99999;" +
        "max-width:78vw;text-align:center;pointer-events:none;box-shadow:0 6px 24px rgba(0,0,0,.3)";
      document.body.appendChild(el);
    }
    el.textContent = t;
    el.style.opacity = "1";
  }, text);
  await pause(ms);
  await page.evaluate(() => {
    const el = document.getElementById("__demo_caption");
    if (el) el.style.opacity = "0";
  });
  await pause(320);
}

try {
  await page.goto(APP, { waitUntil: "networkidle" });
  await pause(900);

  if (!live) {
    await caption(
      "BACKUP RECORDING - rewrite is human-written, not model-generated. Scores are live.",
      4200,
    );
  }

  await caption("Generic SaaS launch copy. You have read this a hundred times.", 3600);

  await page.fill("textarea", primary.content);
  await pause(700);

  await caption("Score it.", 1500);
  await page.click("text=Analyse");
  await page.waitForSelector(".gauge-value", { timeout: 60000 });
  await pause(2600);

  await caption("BDI 26. Generic slop. Bottom-left of the 2x2.", 3800);
  await pause(1200);

  await caption("Every flagged phrase, with the rule that caught it.", 3600);
  await page.locator("mark.hl").first().hover().catch(() => {});
  await pause(2400);

  await caption("Now rewrite it - briefed with those exact failures.", 3600);
  await page.click("text=Rewrite it");
  await page.waitForSelector(".delta-large", { timeout: 120000 });

  // Say nothing here. The dot is moving.
  await pause(4200);

  await caption("Generic slop to Target zone. Nothing was cut - the claim survives.", 4600);
  await pause(1600);

  await page.evaluate(() => window.scrollTo({ top: 700, behavior: "smooth" }));
  await pause(2400);
  await caption("Every sub-score moved. Zero flagged phrases left.", 3800);
  await pause(1800);

  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "smooth" }));
  await pause(1400);
  await caption("And most of that score never touched a model.", 3600);
  await pause(1200);
} finally {
  await context.close();
  await browser.close();
}

const file = fs.readdirSync(OUT).find((f) => f.endsWith(".webm"));
if (file) {
  const target = path.join(OUT, live ? "loci-demo.webm" : "loci-demo-fallback.webm");
  fs.renameSync(path.join(OUT, file), target);
  const mb = (fs.statSync(target).size / 1e6).toFixed(1);
  console.log(`\nwrote ${target}  (${mb} MB)`);
  console.log("Play it once end-to-end before you rely on it.");
} else {
  console.error("no video produced");
  process.exit(1);
}
