import { chromium } from "playwright-core";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
function chromePath() {
  for (const p of ["C:\Program Files\Google\Chrome\Application\chrome.exe","C:\Program Files (x86)\Google\Chrome\Application\chrome.exe"]) if (existsSync(p)) return p;
}
const out = (n) => fileURLToPath(new URL(`../verification/${n}`, import.meta.url));
const b = await chromium.launch({ headless: true, executablePath: chromePath(), args: ["--no-sandbox"] });
const p = await b.newPage({ viewport: { width: 1440, height: 1000 } });
await p.goto("http://127.0.0.1:5173/", { waitUntil: "networkidle" });
await p.waitForSelector("canvas");
await p.waitForTimeout(3500);

// 1. Frontal + T1 MRI (default = anatomical)
await p.locator(".cell-row").filter({ hasText: "Frontal Lobe" }).click();
await p.waitForTimeout(2200);
await p.locator(".micro-card").filter({ hasText: "T1 MRI" }).click();
await p.waitForTimeout(1000);
await p.locator("canvas").first().screenshot({ path: out("imaging-t1.png") });
console.error("✓ imaging-t1.png");

// 2. Frontal + fMRI BOLD → activation
await p.locator(".micro-card").filter({ hasText: "fMRI BOLD" }).click();
await p.waitForTimeout(1500);
await p.locator("canvas").first().screenshot({ path: out("imaging-fmri.png") });
console.error("✓ imaging-fmri.png");

// 3. Frontal + Nissl Stain → histology
await p.locator(".micro-card").filter({ hasText: "Nissl Stain" }).click();
await p.waitForTimeout(1500);
await p.locator("canvas").first().screenshot({ path: out("imaging-histology.png") });
console.error("✓ imaging-histology.png");

// 4. Parietal + DTI → tracts
await p.locator(".cell-row").filter({ hasText: "Parietal Lobe" }).click();
await p.waitForTimeout(2400);
await p.locator(".micro-card").filter({ hasText: "DTI" }).click();
await p.waitForTimeout(1500);
await p.locator("canvas").first().screenshot({ path: out("imaging-dti.png") });
console.error("✓ imaging-dti.png");

await b.close();
console.error("OK");
