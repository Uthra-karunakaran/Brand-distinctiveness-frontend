/* Screenshot the calibration slide in both themes.
 *
 *   npm run shoot-slide
 *
 * Exists because the slide is generated, and a generated slide still has to be
 * looked at: the validator checks colour, not whether a table overflows its card.
 */

import path from "node:path";
import { pathToFileURL } from "node:url";
import { chromium } from "playwright";

const SLIDE = path.resolve(
  process.argv[2] ?? "../demo/calibration_slide.html",
);
const OUT = process.argv[3] ?? "/tmp/shots";

const browser = await chromium.launch();
for (const theme of ["light", "dark"]) {
  const page = await browser.newPage({
    viewport: { width: 1120, height: 900 },
    colorScheme: theme,
  });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));

  await page.goto(pathToFileURL(SLIDE).href, { waitUntil: "load" });
  await page.waitForTimeout(400);

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  const rows = await page.$$eval("tbody tr", (n) => n.length);
  console.log(
    `${theme}: rows=${rows} hOverflow=${overflow}px ${errors.length ? "ERRORS " + errors.join("; ") : "clean"}`,
  );

  await page.screenshot({ path: `${OUT}/slide-${theme}.png`, fullPage: true });
  await page.close();
}
await browser.close();
