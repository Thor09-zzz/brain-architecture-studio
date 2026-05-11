import { chromium } from "playwright-core";
import { existsSync, renameSync, readdirSync, statSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";

function chromePath() {
  for (const p of [
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  ]) if (existsSync(p)) return p;
}

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");
const videoDir = join(root, "verification", "demo-raw");
mkdirSync(videoDir, { recursive: true });

const URL = "http://127.0.0.1:5173/";
const VIEWPORT = { width: 1280, height: 720 };

const b = await chromium.launch({
  headless: true,
  executablePath: chromePath(),
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});

const ctx = await b.newContext({
  viewport: VIEWPORT,
  recordVideo: { dir: videoDir, size: VIEWPORT },
  deviceScaleFactor: 1,
});

const p = await ctx.newPage();
p.on("pageerror", (err) => console.error("PAGEERR", err.message));

// Wait for app to be live (handle slow dev server warmup)
let ready = false;
for (let i = 0; i < 20; i += 1) {
  try {
    await p.goto(URL, { waitUntil: "networkidle", timeout: 5000 });
    ready = true;
    break;
  } catch {
    await new Promise((r) => setTimeout(r, 1500));
  }
}
if (!ready) {
  throw new Error("dev server never came up at " + URL);
}

await p.waitForSelector("canvas", { timeout: 20000 });
// Pre-warm: let initial GLB cohort fully load + first paint settle
await p.waitForTimeout(4500);

// Helper: click + dwell
async function step(label, action, dwellMs = 2200) {
  console.error(`▶ ${label}`);
  await action();
  await p.waitForTimeout(dwellMs);
}

// === 30-second demo sequence ===

// Beat 1 (0-3s): Default Frontal Lobe — establishing shot
await step("intro hold (Frontal default)", async () => {}, 1800);

// Beat 2 (3-7s): Click Limbic — camera flies down, cortex ghosts
await step("→ Limbic System (cortex auto-ghosts)", async () => {
  await p.locator(".cell-row").filter({ hasText: "Limbic System" }).click();
}, 3000);

// Beat 3 (7-11s): Click Hippocampus — camera zooms in, pink bloom
await step("→ Hippocampus (deep structure bloom)", async () => {
  await p.getByRole("button", { name: "Hippocampus", exact: true }).click();
}, 3000);

// Beat 4 (11-15s): fMRI BOLD — whole scene shifts to orange/red activation
await step("→ fMRI BOLD (activation heatmap)", async () => {
  await p.locator(".cell-row").filter({ hasText: "Frontal Lobe" }).click();
  await p.waitForTimeout(1800);
  await p.locator(".micro-card").filter({ hasText: "fMRI BOLD" }).click();
}, 2500);

// Beat 5 (15-18s): Nissl Stain — full sepia histology
await step("→ Nissl Stain (sepia histology)", async () => {
  await p.locator(".micro-card").filter({ hasText: "Nissl Stain" }).click();
}, 2400);

// Beat 6 (18-21s): Switch to Parietal + DTI — cyan tracts
await step("→ Parietal + DTI (cyan tracts)", async () => {
  await p.locator(".cell-row").filter({ hasText: "Parietal Lobe" }).click();
  await p.waitForTimeout(1800);
  await p.locator(".micro-card").filter({ hasText: "DTI" }).click();
}, 2500);

// Beat 7 (21-24s): T1 MRI back to anatomical baseline
await step("→ T1 MRI (back to anatomical)", async () => {
  await p.locator(".micro-card").filter({ hasText: "T1 MRI" }).click();
}, 2000);

// Beat 8 (24-27s): Cross Section Axial — clipping plane reveal
await step("→ Cross Section Axial", async () => {
  await p.locator(".clip-switcher button").filter({ hasText: "Axial" }).click();
}, 2200);

// Beat 9 (27-30s): Open Comparison Modal — dual 3D
await step("→ Open Comparison View (dual 3D)", async () => {
  await p.locator(".clip-switcher button").filter({ hasText: "Off" }).click();
  await p.waitForTimeout(700);
  await p.getByRole("button", { name: /Open Comparison View/ }).click();
}, 4000);

await ctx.close();
await b.close();

// Find the recorded webm and rename
const files = readdirSync(videoDir)
  .filter((f) => f.endsWith(".webm"))
  .map((f) => ({ f, mtime: statSync(join(videoDir, f)).mtimeMs }))
  .sort((a, b) => b.mtime - a.mtime);

if (files.length === 0) {
  throw new Error("no webm recorded in " + videoDir);
}

const newest = join(videoDir, files[0].f);
const target = join(root, "verification", "killer-demo.webm");
if (existsSync(target)) {
  // Overwrite existing
  renameSync(newest, target);
} else {
  renameSync(newest, target);
}
console.log(`✓ recorded: ${target}`);
console.log(`  size: ${(statSync(target).size / 1024 / 1024).toFixed(2)} MB`);
