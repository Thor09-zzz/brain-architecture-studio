import { chromium } from "playwright-core";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
function chromePath() {
  for (const p of ["C:\Program Files\Google\Chrome\Application\chrome.exe","C:\Program Files (x86)\Google\Chrome\Application\chrome.exe"]) if (existsSync(p)) return p;
}
const out = (name) => fileURLToPath(new URL(`../verification/${name}`, import.meta.url));
const b = await chromium.launch({ headless: true, executablePath: chromePath(), args: ["--no-sandbox"] });
const p = await b.newPage({ viewport: { width: 1440, height: 1000 } });
p.on('pageerror', err => console.error('PAGEERR', err.message));
p.on('console', msg => { if (msg.type()==='error') console.error('CONSOLE', msg.text().slice(0,200)); });
await p.goto("http://127.0.0.1:5173/", { waitUntil: "networkidle" });
await p.waitForSelector("canvas");
await p.waitForTimeout(3500);

// 1. Bloom highlight: select Limbic + Hippocampus, brain should glow
await p.locator(".cell-row").filter({ hasText: "Limbic System" }).click();
await p.waitForTimeout(2300);
await p.getByRole("button", { name: "Hippocampus", exact: true }).click();
await p.waitForTimeout(2200);
await p.locator("canvas").screenshot({ path: out("feat-bloom-hippocampus.png") });
console.error("✓ feat-bloom-hippocampus.png");

// 2. Cross section axial
await p.locator(".cell-row").filter({ hasText: "Frontal Lobe" }).click();
await p.waitForTimeout(2300);
await p.locator(".clip-switcher button").filter({ hasText: "Axial" }).click();
await p.waitForTimeout(700);
await p.locator("canvas").first().screenshot({ path: out("feat-clip-axial.png") });
console.error("✓ feat-clip-axial.png");

// 3. Cross section coronal
await p.locator(".clip-switcher button").filter({ hasText: "Coronal" }).click();
await p.waitForTimeout(700);
await p.locator("canvas").first().screenshot({ path: out("feat-clip-coronal.png") });
console.error("✓ feat-clip-coronal.png");

// 4. Cross section sagittal + slider drag
await p.locator(".clip-switcher button").filter({ hasText: "Sagittal" }).click();
await p.waitForTimeout(500);
await p.locator(".clip-slider").fill("-0.4");
await p.waitForTimeout(700);
await p.locator("canvas").first().screenshot({ path: out("feat-clip-sagittal.png") });
console.error("✓ feat-clip-sagittal.png");

// Reset clip
await p.locator(".clip-switcher button").filter({ hasText: "Off" }).click();
await p.waitForTimeout(500);

// 5. Comparison side-by-side
await p.locator(".cell-row").filter({ hasText: "Frontal Lobe" }).click();
await p.waitForTimeout(2200);
await p.getByRole("button", { name: /Open Comparison View/ }).click();
await p.waitForTimeout(4500);
await p.screenshot({ path: out("feat-comparison.png"), fullPage: false });
console.error("✓ feat-comparison.png");

await b.close();
console.error("OK");
