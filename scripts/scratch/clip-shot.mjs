import { chromium } from "playwright-core";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
function chromePath() {
  for (const p of ["C:\Program Files\Google\Chrome\Application\chrome.exe","C:\Program Files (x86)\Google\Chrome\Application\chrome.exe"]) if (existsSync(p)) return p;
}
const b = await chromium.launch({ headless: true, executablePath: chromePath(), args: ["--no-sandbox"] });
const p = await b.newPage({ viewport: { width: 1440, height: 1000 } });
p.on('pageerror', err => console.error('PAGEERR', err));
p.on('console', msg => { if (msg.type()==='error') console.error('CONSOLE', msg.text()); });
await p.goto("http://127.0.0.1:5173/", { waitUntil: "networkidle" });
await p.waitForSelector("canvas");
await p.waitForTimeout(2500);
console.error('toggling...');
await p.locator(".toggle-line").click();
await p.waitForTimeout(900);
await p.locator("canvas").screenshot({ path: fileURLToPath(new URL("../verification/cross-section-on.png", import.meta.url)) });
console.error('done on');
await p.locator(".toggle-line").click();
await p.waitForTimeout(500);
await p.locator("canvas").screenshot({ path: fileURLToPath(new URL("../verification/cross-section-off.png", import.meta.url)) });
console.error('done off');
await b.close();
console.error('OK');
