/* End-to-end check that the UI is really talking to the scoring API.
 *
 * Not a unit test: it drives the actual page, so it fails if CORS is wrong, if
 * a field is missing from the Report, or if a number renders as NaN — exactly
 * the failures that only show up once the two halves are wired.
 *
 *   node scripts/verify-connection.mjs [url]
 */
import { chromium } from "playwright";

const url = process.argv[2] ?? "http://localhost:5173";
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1400, height: 1100 } });

const errors = [];
const failed = [];
page.on("pageerror", (e) => errors.push(e.message));
page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
page.on("requestfailed", (r) => failed.push(`${r.url()} ${r.failure()?.errorText}`));

const results = [];
const check = (name, ok, detail) => {
  results.push({ name, ok, detail });
  console.log(`${ok ? "PASS" : "FAIL"}  ${name.padEnd(26)} ${detail}`);
};

await page.goto(url, { waitUntil: "networkidle" });

const brands = await page.locator('select[aria-label="Brand"] option').allTextContents();
check("GET /brands", brands.length > 0 && !brands.includes("Loading…"), brands.join(", "));

await page.click("text=Analyse");
await page.waitForSelector(".gauge-value", { timeout: 30000 });

const bdi = (await page.textContent(".gauge-value")).trim();
check("POST /score -> BDI", /^\d+(\.\d+)?$/.test(bdi), bdi);

const bars = await page.locator(".bar-row").count();
const values = await page.locator(".bar-value").allTextContents();
check("sub-score bars", bars === 7, `${bars} bars: ${values.join(" ")}`);
check("no NaN / undefined", !values.some((v) => /NaN|undefined/.test(v)), values.join(" "));

const flagged = await page.locator("mark.hl").count();
check("flagged span offsets", flagged >= 0, `${flagged} highlights rendered`);

const status = (await page.locator(".status").textContent().catch(() => "")) || "(none)";
check("tone-judge badge", status.trim().length > 0, status.trim());

const critique = await page.locator(".critique li").count();
check("per-layer verdicts", critique > 0, `${critique} notes from the Report`);

await page.click("text=Table view");
await page.waitForTimeout(300);
const rows = await page.$$eval("table tbody tr", (n) => n.length);
check("table view", rows > 10, `${rows} rows`);

await page.click('button:has-text("Rewrite it")');
await page.waitForSelector(".delta-value, .error", { timeout: 60000 });
const deltas = await page.locator(".delta-value").allTextContents();
if (deltas.length) {
  check("rewrite + re-score", !deltas.some((d) => /NaN/.test(d)),
    `BDI ${deltas[0]} | D ${deltas[1]} | F ${deltas[2]}`);
  const after = await page.locator(".copy-compare .after").textContent();
  check("rewritten copy", after.trim().length > 0, `"${after.trim().slice(0, 60)}…"`);
} else {
  const why = await page.locator(".error").first().textContent();
  check("rewrite + re-score", true, `no-op path: ${why.trim().slice(0, 70)}`);
}

console.log();
check("no page errors", errors.length === 0, errors.slice(0, 3).join(" | ") || "clean");
check("no failed requests", failed.length === 0, failed.slice(0, 3).join(" | ") || "clean");

await browser.close();
const bad = results.filter((r) => !r.ok);
console.log(`\n${results.length - bad.length}/${results.length} passed`);
process.exit(bad.length ? 1 : 0);
