import { chromium } from "playwright-core";
import { existsSync } from "node:fs";
function chromePath() {
  for (const p of [
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  ]) if (existsSync(p)) return p;
}
const b = await chromium.launch({ headless: true, executablePath: chromePath(), args: ["--no-sandbox"] });
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
p.on("console", (msg) => {
  if (msg.type() === "error" && /camera|THREE/.test(msg.text())) {
    errors.push(msg.text().slice(0, 150));
  }
});
await p.goto("http://127.0.0.1:5173/", { waitUntil: "networkidle" });
await p.waitForSelector("canvas");
await p.waitForTimeout(3500);

const [dl] = await Promise.all([
  p.waitForEvent("download", { timeout: 8000 }),
  p.locator(".export-toolbar button").filter({ hasText: "Screenshot" }).click(),
]);
await p.waitForTimeout(500);

console.log(`download: ${dl.suggestedFilename()}`);
console.log(`camera/THREE errors after screenshot click: ${errors.length}`);
if (errors.length) console.log(JSON.stringify(errors, null, 2));
await b.close();
