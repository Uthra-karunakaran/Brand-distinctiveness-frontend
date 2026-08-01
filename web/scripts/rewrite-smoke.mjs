import { chromium } from "playwright";

const API = "http://localhost:8000";
const GENERIC =
  "In today's fast-paced world, businesses need cutting-edge solutions that " +
  "deliver seamless experiences. Our innovative platform empowers teams to " +
  "unlock their full potential. We provide robust, scalable, and secure " +
  "infrastructure designed to elevate your workflow.";
const BETTER =
  "Your team loses about four hours a week to status updates nobody reads. " +
  "We built the thing that stops that. One board, one owner per line, and a " +
  "nudge at nine on Tuesday if a line has not moved since Friday. " +
  "No dashboards. Fourteen studios ran it for a quarter and shipped, on " +
  "average, eleven days earlier than the quarter before.";

const post = async (path, body) =>
  (await fetch(API + path, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  })).json();

// Real scores on both sides; only the *writing* is substituted.
const original = await post("/analyze", { text: GENERIC, brand_id: 1 });
const rewritten = await post("/analyze", { text: BETTER, brand_id: 1 });
const d = (k) => Math.round((rewritten[k] - original[k]) * 100) / 100;

const payload = {
  original, rewritten,
  delta: {
    bdi: d("bdi"), distinctiveness: d("distinctiveness"), fidelity: d("fidelity"),
    quadrant_changed: original.quadrant !== rewritten.quadrant,
    from_quadrant: original.quadrant, to_quadrant: rewritten.quadrant,
  },
  changes: [
    { removed: "cutting-edge solutions", replaced_with: "the thing that stops that", why: "stock phrase, says nothing" },
    { removed: "unlock their full potential", replaced_with: "shipped eleven days earlier", why: "abstraction replaced with a measured outcome" },
  ],
  preserved_meaning: "The product claim and the audience are unchanged.",
  model: "claude-opus-5",
};

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1400, height: 1200 } });
const errs = [];
page.on("pageerror", (e) => errs.push(e.message));
await page.route("**/rewrite", (route) =>
  route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(payload) }));

await page.goto("http://localhost:5173", { waitUntil: "networkidle" });
await page.click("text=Analyse");
await page.waitForSelector(".gauge-value");
const bdiBefore = await page.textContent(".gauge-value");
// Recharts does not render the scatter groups in JSX order, so identify the
// live dot by which symbol actually moves rather than by position in the DOM.
const positions = () =>
  page.$$eval(".recharts-symbols", (ns) => ns.map((n) => n.getAttribute("transform")));

const before = await positions();
await page.click("text=Rewrite it");
await page.waitForSelector(".delta-large", { timeout: 30000 });
await page.waitForTimeout(300);
const mid = await positions();
await page.waitForTimeout(1600);
const settled = await positions();

const px = (t) => t.match(/translate\(([-\d.]+)/)[1] * 1;
const movers = settled
  .map((t, i) => ({ i, from: before[i], mid: mid[i], to: t }))
  .filter((m) => m.from && m.to !== m.from);
const mover = movers[0];
const tweened = mover && mover.mid !== mover.from && mover.mid !== mover.to;

console.log(`BDI            : ${bdiBefore} -> ${await page.textContent(".gauge-value")}`);
console.log(`delta shown    : ${(await page.textContent(".delta-large .delta-value")).trim()}`);
console.log(`quadrant move  : ${(await page.textContent(".quadrant-move")).replace(/\s+/g, " ").trim()}`);
console.log(`ghost dot      : ${(await page.locator("text=Before rewrite").count()) ? "shown ✓" : "missing ✗"}`);
console.log(`dot moved      : x ${px(mover.from).toFixed(0)} -> ${px(mover.to).toFixed(0)}px`);
console.log(`sampled mid    : x ${px(mover.mid).toFixed(0)}px`);
console.log(`tween          : ${tweened ? "REAL ✓ (caught in flight)" : "snapped ✗"}`);
console.log(`ghost held     : ${movers.length === 1 ? "✓ only the live dot moved" : "✗ " + movers.length + " moved"}`);
console.log(`changes listed : ${await page.$$eval(".changes li", (n) => n.length)}`);
console.log(`hOverflow      : ${await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)}px`);
await page.screenshot({ path: `${process.argv[2] ?? "."}/locify-rewrite.png`, fullPage: true });
console.log(errs.length ? `\nERRORS: ${errs.join("; ")}` : "\nno page errors");
await browser.close();
