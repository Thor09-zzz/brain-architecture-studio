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
p.on("console", (m) => { if (m.type() === "error") errors.push(m.text().slice(0, 250)); });
p.on("pageerror", (e) => errors.push("PAGEERR: " + e.message.slice(0, 250)));

await p.goto("http://127.0.0.1:5173/", { waitUntil: "networkidle" });
await p.waitForSelector("canvas");
await p.waitForTimeout(3500);

await p.getByRole("button", { name: /Open Comparison View/ }).click();
await p.waitForTimeout(4500);

const info = await p.evaluate(() => {
  const views = document.querySelectorAll(".comparison-view");
  const canvases = document.querySelectorAll(".comparison-stage canvas");
  return {
    viewCount: views.length,
    viewRects: Array.from(views).map((v) => v.getBoundingClientRect().toJSON()),
    canvasCount: canvases.length,
    canvasSize: canvases[0]?.getBoundingClientRect().toJSON(),
  };
});

console.log(JSON.stringify(info, null, 2));
console.log("---errors---");
console.log(JSON.stringify(errors, null, 2));
await b.close();
