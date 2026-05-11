import { chromium } from "playwright-core";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { PNG } from "pngjs";
function chromePath() {
  for (const p of [
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  ]) if (existsSync(p)) return p;
}

// Sample the left vs right half of a screenshot, compute pixel variance per side.
// If only left renders, right side will be ~uniform paper color (low variance).
function halfVariance(buf) {
  const png = PNG.sync.read(buf);
  const w = png.width, h = png.height;
  let leftSum = 0, leftSumSq = 0, leftN = 0;
  let rightSum = 0, rightSumSq = 0, rightN = 0;
  for (let y = Math.floor(h * 0.2); y < Math.floor(h * 0.8); y++) {
    for (let x = 0; x < w; x++) {
      const idx = (y * w + x) * 4;
      const brightness = (png.data[idx] + png.data[idx + 1] + png.data[idx + 2]) / 3;
      if (x < w / 2) {
        leftSum += brightness; leftSumSq += brightness * brightness; leftN++;
      } else {
        rightSum += brightness; rightSumSq += brightness * brightness; rightN++;
      }
    }
  }
  const leftMean = leftSum / leftN, rightMean = rightSum / rightN;
  return {
    leftVar: leftSumSq / leftN - leftMean * leftMean,
    rightVar: rightSumSq / rightN - rightMean * rightMean,
    leftMean, rightMean,
  };
}

const b = await chromium.launch({ headless: true, executablePath: chromePath(), args: ["--no-sandbox"] });
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.goto("http://127.0.0.1:5173/", { waitUntil: "networkidle" });
await p.waitForSelector("canvas");
await p.waitForTimeout(3500);

await p.getByRole("button", { name: /Open Comparison View/ }).click();
await p.waitForTimeout(4500);

const buf = await p.locator(".comparison-stage").screenshot();
const stats = halfVariance(buf);
console.log(JSON.stringify(stats, null, 2));

// Save the screenshot for visual inspection
await p.locator(".comparison-stage").screenshot({
  path: fileURLToPath(new URL("../verification/feat-comparison-fixed.png", import.meta.url)),
});
await b.close();
