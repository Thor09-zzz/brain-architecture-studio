import { chromium } from "playwright-core";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
function chromePath() {
  for (const p of [
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  ]) if (existsSync(p)) return p;
}
const out = (n) =>
  fileURLToPath(new URL(`../verification/${n}`, import.meta.url));
const b = await chromium.launch({
  headless: true,
  executablePath: chromePath(),
  args: ["--no-sandbox"],
});
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.goto("http://127.0.0.1:5173/", { waitUntil: "networkidle" });
await p.waitForSelector("canvas");
await p.waitForTimeout(3500);

// Sidebar full screenshot
await p.screenshot({ path: out("audit-sidebar.png"), fullPage: false });

// Click Brainstem
await p.locator(".cell-row").filter({ hasText: "Brainstem" }).click();
await p.waitForTimeout(2500);
await p.screenshot({ path: out("audit-brainstem-region.png") });
await p.locator("canvas").first().screenshot({ path: out("audit-brainstem-canvas.png") });

// Click each substructure
for (const sub of ["Midbrain", "Pons", "Medulla Oblongata", "Reticular Formation"]) {
  await p.getByRole("button", { name: sub, exact: true }).click();
  await p.waitForTimeout(2200);
  const safe = sub.replace(/\s+/g, "-").toLowerCase();
  await p.locator("canvas").first().screenshot({ path: out(`audit-brainstem-${safe}.png`) });
  console.error(`✓ ${sub}`);
}

await b.close();
