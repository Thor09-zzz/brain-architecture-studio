import { chromium } from "playwright-core";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
function chromePath() {
  for (const p of ["C:\Program Files\Google\Chrome\Application\chrome.exe","C:\Program Files (x86)\Google\Chrome\Application\chrome.exe"]) if (existsSync(p)) return p;
}
const b = await chromium.launch({ headless: true, executablePath: chromePath(), args: ["--no-sandbox"] });
const p = await b.newPage({ viewport: { width: 1440, height: 1000 } });
p.on('pageerror', err => console.error('PAGEERR', err));
await p.goto("http://127.0.0.1:5173/", { waitUntil: "networkidle" });
await p.waitForSelector("canvas");
await p.waitForTimeout(3000);

const cases = [
  { region: "Limbic System", sub: "Hippocampus", file: "sub-hippocampus.png" },
  { region: "Limbic System", sub: "Amygdala",    file: "sub-amygdala.png" },
  { region: "Limbic System", sub: "Thalamus",    file: "sub-thalamus.png" },
  { region: "Brainstem",     sub: "Pons",        file: "sub-pons.png" },
  { region: "Frontal Lobe",  sub: "Broca's Area", file: "sub-broca.png" },
  { region: "Frontal Lobe",  sub: "Primary Motor Cortex", file: "sub-motor.png" },
];

for (const c of cases) {
  await p.locator(".cell-row").filter({ hasText: c.region }).click();
  await p.waitForTimeout(2200);
  await p.getByRole("button", { name: c.sub, exact: true }).click();
  await p.waitForTimeout(2200);
  await p.locator("canvas").screenshot({ path: fileURLToPath(new URL(`../verification/${c.file}`, import.meta.url)) });
  console.error(`✓ ${c.file}`);
}

await b.close();
console.error("OK");
