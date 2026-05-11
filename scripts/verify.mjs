import { mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright-core";
import { PNG } from "pngjs";

const url = process.env.APP_URL ?? "http://127.0.0.1:5173/";

function resolveChromePath() {
  if (process.env.CHROME_PATH) {
    return process.env.CHROME_PATH;
  }
  const candidates = [
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/usr/bin/google-chrome",
    "/usr/bin/chromium-browser",
  ];
  for (const p of candidates) {
    if (existsSync(p)) {
      return p;
    }
  }
  return undefined;
}

const chromePath = resolveChromePath();
const outDir = new URL("../verification/", import.meta.url);

function outPath(fileName) {
  return fileURLToPath(new URL(fileName, outDir));
}

function assert(value, message) {
  if (!value) {
    throw new Error(message);
  }
}

async function readVisualMetrics(page, selector) {
  const box = await page.locator(selector).boundingBox();
  const buffer = await page.locator(selector).screenshot();
  const png = PNG.sync.read(buffer);
  const left = Math.floor(png.width * 0.18);
  const right = Math.floor(png.width * 0.82);
  const top = Math.floor(png.height * 0.16);
  const bottom = Math.floor(png.height * 0.86);

  let nonPaper = 0;
  let sum = 0;
  let sumSquares = 0;
  let alphaPixels = 0;
  let count = 0;

  for (let y = top; y < bottom; y += 1) {
    for (let x = left; x < right; x += 1) {
      const index = (png.width * y + x) * 4;
      const r = png.data[index];
      const g = png.data[index + 1];
      const b = png.data[index + 2];
      const a = png.data[index + 3];
      const brightness = (r + g + b) / 3;
      if (a > 0) {
        alphaPixels += 1;
      }
      if (Math.abs(r - 251) + Math.abs(g - 247) + Math.abs(b - 238) > 26) {
        nonPaper += 1;
      }
      sum += brightness;
      sumSquares += brightness * brightness;
      count += 1;
    }
  }

  const mean = sum / count;
  const variance = sumSquares / count - mean * mean;

  return {
    width: box?.width ?? png.width,
    height: box?.height ?? png.height,
    alphaRatio: alphaPixels / count,
    nonPaperRatio: nonPaper / count,
    variance,
  };
}

async function verifyViewport(browser, name, viewport) {
  const page = await browser.newPage({ viewport, deviceScaleFactor: 1 });
  await page.goto(url, { waitUntil: "networkidle" });
  await page.waitForSelector("canvas", { timeout: 15000 });
  await page.waitForTimeout(1600);

  const title = await page.locator(".stage-title h2").innerText();
  const regionCount = await page.locator(".cell-row").count();
  const modeTitles = await page.locator(".mode-switcher button").evaluateAll((buttons) =>
    buttons.map((button) => button.getAttribute("title")),
  );
  const activeMode = await page.locator(".mode-switcher button.is-active").getAttribute("title");
  const visualBox = await page.locator(".canvas-wrap canvas").boundingBox();
  await page.screenshot({ path: outPath(`${name}.png`), fullPage: true });
  await page.locator(".canvas-wrap canvas").screenshot({ path: outPath(`${name}-visual.png`) });
  const metrics = await readVisualMetrics(page, "canvas");

  assert(title.includes("Frontal Lobe"), `${name}: initial title mismatch (got ${title})`);
  assert(regionCount === 7, `${name}: expected 7 regions, received ${regionCount}`);
  assert(activeMode === "Whole", `${name}: default mode should be Whole, got ${activeMode}`);
  assert(
    modeTitles.length === 2 && modeTitles.includes("Whole") && modeTitles.includes("Region"),
    `${name}: unexpected mode buttons ${JSON.stringify(modeTitles)}`,
  );
  assert(visualBox && visualBox.width > 260 && visualBox.height > 220, `${name}: visual is too small`);
  if (name !== "mobile") {
    assert(
      visualBox.y > 0 && visualBox.y + visualBox.height < viewport.height - 8,
      `${name}: canvas falls outside the viewport`,
    );
  } else {
    assert(visualBox.y > 0, `${name}: canvas has invalid origin`);
  }
  assert(metrics, `${name}: missing visual metrics`);
  assert(metrics.nonPaperRatio > 0.05, `${name}: visual appears blank`);
  assert(metrics.variance > 80, `${name}: visual has too little pixel variation`);
  await page.close();

  return { name, title, regionCount, activeMode, modeTitles, visualBox, metrics };
}

async function verifyInteractions(browser) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 });
  await page.goto(url, { waitUntil: "networkidle" });
  await page.waitForSelector("canvas", { timeout: 15000 });
  await page.waitForTimeout(800);

  await page.locator(".cell-row").filter({ hasText: "Parietal Lobe" }).click();
  await page.waitForSelector("canvas", { timeout: 15000 });
  await page.waitForTimeout(1200);
  const parietalMetrics = await readVisualMetrics(page, "canvas");
  assert(parietalMetrics.nonPaperRatio > 0.05, "parietal scene appears blank");
  assert(parietalMetrics.variance > 80, "parietal scene has too little pixel variation");

  await page.locator(".cell-row").filter({ hasText: "Temporal Lobe" }).click();
  await page.waitForSelector("canvas", { timeout: 15000 });
  await page.waitForTimeout(1200);
  const temporalMetrics = await readVisualMetrics(page, "canvas");
  assert(temporalMetrics.nonPaperRatio > 0.05, "temporal scene appears blank");
  assert(temporalMetrics.variance > 80, "temporal scene has too little pixel variation");

  await page.locator(".cell-row").filter({ hasText: "Limbic System" }).click();
  await page.waitForSelector("canvas", { timeout: 15000 });
  await page.waitForTimeout(800);
  const title = await page.locator(".stage-title h2").innerText();
  assert(title.includes("Limbic System"), "region switch did not update title");
  const limbicMetrics = await readVisualMetrics(page, "canvas");
  assert(limbicMetrics.nonPaperRatio > 0.05, "limbic scene appears blank");
  assert(limbicMetrics.variance > 80, "limbic scene has too little pixel variation");

  await page.locator(".organelle-row").filter({ hasText: "Hippocampus" }).click();
  await page.waitForTimeout(900);
  const detailTitle = await page.locator(".detail-hero h3").innerText();
  assert(detailTitle.includes("Hippocampus"), "substructure switch did not update details");
  const hippoMetrics = await readVisualMetrics(page, "canvas");
  await page.locator(".canvas-wrap canvas").screenshot({ path: outPath("hippocampus-occluded.png") });

  // Imaging mode toggle: click the second imaging button, expect is-active.
  const imagingButtons = await page.locator(".micro-card-row .micro-card").all();
  assert(imagingButtons.length >= 2, "imaging mode buttons missing");
  await imagingButtons[1].click();
  await page.waitForTimeout(250);
  const activeImagingCount = await page.locator(".micro-card.is-active").count();
  assert(activeImagingCount === 1, `expected exactly one active imaging card, got ${activeImagingCount}`);

  // Reset View button should not error.
  await page.locator(".stage-toolbar button").filter({ hasText: "Reset View" }).click();
  await page.waitForTimeout(300);

  // Screenshot button should trigger a PNG download.
  const [pngDownload] = await Promise.all([
    page.waitForEvent("download", { timeout: 8000 }),
    page.locator(".export-toolbar button").filter({ hasText: "Screenshot" }).click(),
  ]);
  const pngName = pngDownload.suggestedFilename();
  assert(pngName.endsWith(".png"), `screenshot did not download PNG, got ${pngName}`);

  // GLB Export button should trigger a GLB download.
  const [glbDownload] = await Promise.all([
    page.waitForEvent("download", { timeout: 30000 }),
    page.locator(".export-toolbar button").filter({ hasText: "GLB Export" }).click(),
  ]);
  const glbName = glbDownload.suggestedFilename();
  assert(glbName.endsWith(".glb"), `GLB export did not download GLB, got ${glbName}`);

  await page.getByRole("button", { name: /Open Comparison View/ }).click();
  await page.waitForTimeout(250);
  const modalTitle = await page.locator(".comparison-modal h3").innerText();
  assert(modalTitle.includes("Comparison View"), "comparison modal did not open");

  await page.screenshot({ path: outPath("interaction.png"), fullPage: true });
  await page.locator(".canvas-wrap canvas").screenshot({ path: outPath("interaction-canvas.png") });

  // Confirm previously fake elements are gone.
  const topNavCount = await page.locator(".top-nav").count();
  assert(topNavCount === 0, "fake top-nav should be removed");
  const avatarCount = await page.locator(".avatar-button").count();
  assert(avatarCount === 0, "fake avatar button should be removed");
  const labelToggleCount = await page.locator(".attribute-list .mini-toggle").count();
  assert(labelToggleCount === 0, "fake label mini-toggle should be removed");
  const hideOthersCount = await page.locator("button").filter({ hasText: "Hide Others" }).count();
  assert(hideOthersCount === 0, "duplicate Hide Others button should be removed");

  await page.close();

  return {
    title,
    detailTitle,
    modalTitle,
    parietalMetrics,
    temporalMetrics,
    limbicMetrics,
    hippoMetrics,
    pngName,
    glbName,
  };
}

await mkdir(outDir, { recursive: true });

const launchOptions = {
  headless: true,
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
};
if (chromePath) {
  launchOptions.executablePath = chromePath;
}

const browser = await chromium.launch(launchOptions);

try {
  const desktop = await verifyViewport(browser, "desktop", { width: 1440, height: 1000 });
  const compact = await verifyViewport(browser, "compact", { width: 1280, height: 720 });
  const mobile = await verifyViewport(browser, "mobile", { width: 390, height: 900 });
  const interactions = await verifyInteractions(browser);

  console.log(
    JSON.stringify(
      {
        ok: true,
        url,
        screenshots: [
          "verification/desktop.png",
          "verification/desktop-visual.png",
          "verification/compact.png",
          "verification/compact-visual.png",
          "verification/mobile.png",
          "verification/mobile-visual.png",
          "verification/interaction.png",
          "verification/interaction-canvas.png",
        ],
        desktop,
        compact,
        mobile,
        interactions,
      },
      null,
      2,
    ),
  );
} finally {
  await browser.close();
}
