import { chromium } from "playwright";
const b = await chromium.launch();
for (const theme of ["light","dark"]) {
  const p = await b.newPage({ viewport:{width:1120,height:900}, colorScheme: theme });
  const errs=[]; p.on("pageerror",e=>errs.push(e.message));
  await p.goto("file:///" + process.argv[2].replace(/\/g,"/"), {waitUntil:"load"});
  await p.waitForTimeout(400);
  const of = await p.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
  console.log(`${theme}: rows=${await p.$$eval("tbody tr",n=>n.length)} hOverflow=${of}px ${errs.length?"ERR "+errs:""}`);
  await p.screenshot({path:`${process.argv[3]}/slide-${theme}.png`, fullPage:true});
  await p.close();
}
await b.close();
