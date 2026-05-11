import { chromium } from "playwright-core";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
function chromePath() {
  for (const p of ["C:\Program Files\Google\Chrome\Application\chrome.exe","C:\Program Files (x86)\Google\Chrome\Application\chrome.exe"]) if (existsSync(p)) return p;
}
const b = await chromium.launch({ headless: true, executablePath: chromePath(), args: ["--no-sandbox"] });
const p = await b.newPage({ viewport: { width: 1440, height: 1000 } });
await p.goto("http://127.0.0.1:5173/", { waitUntil: "networkidle" });
await p.waitForSelector("canvas");
await p.waitForTimeout(3500);

// Click Substructures button area off (deselect any sub) by re-clicking region
const regions = [
  ["Frontal Lobe",   "region-frontal.png"],
  ["Parietal Lobe",  "region-parietal.png"],
  ["Temporal Lobe",  "region-temporal.png"],
  ["Occipital Lobe", "region-occipital.png"],
  ["Cerebellum",     "region-cerebellum.png"],
  ["Brainstem",      "region-brainstem.png"],
  ["Limbic System",  "region-limbic.png"],
];
for (const [name, file] of regions) {
  await p.locator(".cell-row").filter({ hasText: name }).click();
  await p.waitForTimeout(2400);
  await p.locator("canvas").screenshot({ path: fileURLToPath(new URL(`../verification/${file}`, import.meta.url)) });
  console.error(`✓ ${file}`);
}
await b.close();
console.error("OK");
