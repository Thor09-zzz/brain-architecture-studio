import { chromium } from "playwright-core";
import { existsSync } from "node:fs";
function chromePath() {
  for (const p of [
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  ]) if (existsSync(p)) return p;
}
const b = await chromium.launch({ headless: true, executablePath: chromePath(), args: ["--no-sandbox"] });
const p = await b.newPage({ viewport: { width: 1440, height: 1000 } });

let count = 0;
p.on("console", (msg) => {
  if (msg.text().includes("Maximum update")) count += 1;
});

await p.goto("http://127.0.0.1:5173/", { waitUntil: "networkidle" });
await p.waitForSelector("canvas");
await p.waitForTimeout(3500);
console.error(`init: ${count}`);

const regions = [
  "Frontal Lobe",
  "Parietal Lobe",
  "Temporal Lobe",
  "Occipital Lobe",
  "Cerebellum",
  "Brainstem",
  "Limbic System",
];
for (const r of regions) {
  const before = count;
  await p.locator(".cell-row").filter({ hasText: r }).click();
  await p.waitForTimeout(2200);
  console.error(`click ${r}: +${count - before} (total ${count})`);
}
for (const r of regions) {
  const before = count;
  await p.locator(".cell-row").filter({ hasText: r }).click();
  await p.waitForTimeout(2200);
  console.error(`pass2 ${r}: +${count - before} (total ${count})`);
}

await b.close();
