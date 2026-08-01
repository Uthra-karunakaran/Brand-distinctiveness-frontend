import { chromium } from "playwright";
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1400, height: 1100 } });
const errs = [];
page.on("pageerror", e => errs.push(e.message));
await page.goto("http://localhost:5173", { waitUntil: "networkidle" });
await page.click("text=Analyse");
await page.waitForSelector(".gauge-value");

const before = await page.textContent(".gauge-value");

// Drag the cliche_density weight to 0 -> BDI must move.
const slider = page.locator('input[aria-label="Cliché density weight"]');
await slider.fill("0");
await page.waitForTimeout(400);
const after = await page.textContent(".gauge-value");
const dirty = await page.textContent(".card-head .sub").catch(() => "");
const pct = await page.locator(".slider-value").first().textContent();

console.log(`slider recompute : BDI ${before} -> ${after}  ${before !== after ? "LIVE ✓" : "NO CHANGE ✗"}`);
console.log(`weight readout   : cliche now ${pct}`);
console.log(`dirty banner     : ${(await page.locator("text=live preview").count()) ? "shown ✓" : "missing ✗"}`);

// Reset restores
await page.click("text=Reset");
await page.waitForTimeout(1300); // gauge count-up is ~850ms
console.log(`reset            : BDI ${await page.textContent(".gauge-value")} ${(await page.textContent(".gauge-value")) === before ? "✓" : "✗"}`);

// Table view
await page.click("text=Table view");
await page.waitForTimeout(300);
const rows = await page.$$eval("table tbody tr", n => n.length);
console.log(`table view       : ${rows} rows ${rows > 10 ? "✓" : "✗"}`);

// Tooltip on a bar
await page.locator(".bar-row").first().hover();
await page.waitForTimeout(250);
console.log(`bar tooltip      : ${(await page.locator(".bar-tip").count()) ? "shown ✓" : "missing ✗"}`);

// Changing brand re-scores on its own -- no second Analyse click needed.
await page.selectOption('select[aria-label="Brand"]', "");
await page.waitForTimeout(3000);
console.log(`no-brand BDI     : ${await page.textContent(".gauge-value")} (expect —)`);

await page.screenshot({ path: "/tmp/shots/locify-table.png", fullPage: true });
console.log(errs.length ? `\nERRORS: ${errs.join("; ")}` : "\nno page errors");
await browser.close();
