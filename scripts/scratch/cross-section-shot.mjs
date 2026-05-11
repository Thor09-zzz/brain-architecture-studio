import { chromium } from "playwright-core";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

function chromePath() {
  const cs = ["C:\Program Files\Google\Chrome\Application\chrome.exe","C:\Program Files (x86)\Google\Chrome\Application\chrome.exe"];
  for (const p of cs) if (existsSync(p)) return p;
  return undefined;
}

const b = await chromium.launch({ headless: true, executablePath: chromePath(), args: ["--no-sandbox"] });
const p = await b.newPage({ viewport: { width: 1440, height: 1000 } });
await p.goto("http://127.0.0.1:5173/", { waitUntil: "networkidle" });
await p.waitForSelector("canvas");
await p.waitForTimeout(2500);

// Frontal view (default)
await p.locator("canvas").screenshot({ path: fileURLToPath(new URL("../verification/cam-frontal.png", import.meta.url)) });

// Click Temporal — should fly to right side view
await p.locator(".cell-row").filter({ hasText: "Temporal Lobe" }).click();
await p.waitForTimeout(2500);
await p.locator("canvas").screenshot({ path: fileURLToPath(new URL("../verification/cam-temporal.png", import.meta.url)) });

// Click Cerebellum — back-bottom view
await p.locator(".cell-row").filter({ hasText: "Cerebellum" }).click();
await p.waitForTimeout(2500);
await p.locator("canvas").screenshot({ path: fileURLToPath(new URL("../verification/cam-cerebellum.png", import.meta.url)) });

// Toggle Cross Section
await p.locator("input[type='checkbox']").check();
await p.waitForTimeout(800);
await p.locator("canvas").screenshot({ path: fileURLToPath(new URL("../verification/cross-section-on.png", import.meta.url)) });

await b.close();
console.log("✓ shots saved");
