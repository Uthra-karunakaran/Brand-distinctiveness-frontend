import { chromium } from "playwright";
const OUT = process.argv[2];
const errors = [];
const browser = await chromium.launch();
for (const theme of ["light", "dark"]) {
  const page = await browser.newPage({ viewport: { width: 1400, height: 1100 } });
  page.on("pageerror", (e) => errors.push(`[${theme}] pageerror: ${e.message}`));
  page.on("console", (m) => { if (m.type() === "error") errors.push(`[${theme}] console: ${m.text()}`); });
  await page.goto("http://localhost:5173", { waitUntil: "networkidle" });
  await page.selectOption('select[aria-label="Theme"]', theme);
  await page.click("text=Analyse");
  await page.waitForSelector(".gauge-value", { timeout: 60000 });
  await page.waitForTimeout(1500);
  // horizontal overflow check
  const overflow = await page.evaluate(() =>
    document.documentElement.scrollWidth - document.documentElement.clientWidth);
  const bdi = await page.textContent(".gauge-value");
  const bars = await page.$$eval(".bar-row", (n) => n.length);
  const marks = await page.$$eval("mark.hl", (n) => n.length);
  const dots = await page.$$eval(".recharts-scatter-symbol", (n) => n.length);
  console.log(`${theme}: BDI=${bdi} bars=${bars} highlights=${marks} scatterDots=${dots} hOverflow=${overflow}px`);
  await page.screenshot({ path: `${OUT}/locify-${theme}.png`, fullPage: true });
  await page.close();
}
await browser.close();
if (errors.length) { console.log("\nERRORS:"); errors.forEach((e) => console.log("  " + e)); }
else console.log("\nno console/page errors");
