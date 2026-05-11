// Headless inventory walker. Visits every interactive UI element, captures
// screenshots into verification/inv-NN.png, and emits a Markdown table to
// .tmp/inventory.md. Console errors per click are tracked via page.on("pageerror")
// and page.on("console" - error level). Each row is one feature_id.

import { mkdir, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright-core";

const APP_URL = process.env.APP_URL ?? "http://127.0.0.1:5173/";
const OUT_DIR = new URL("../verification/", import.meta.url);
const TMP_DIR = new URL("../.tmp/", import.meta.url);

function chromePath() {
  if (process.env.CHROME_PATH) return process.env.CHROME_PATH;
  const cands = [
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  ];
  for (const p of cands) if (existsSync(p)) return p;
  return undefined;
}

const REGIONS = [
  { id: "frontal",    name: "Frontal Lobe",   subs: ["prefrontal", "motor", "broca", "orbitofrontal"] },
  { id: "parietal",   name: "Parietal Lobe",  subs: ["somatosensory", "angular"] }, // sidebar list shows substructures of region
  { id: "temporal",   name: "Temporal Lobe",  subs: ["auditory", "wernicke", "fusiform"] },
  { id: "occipital",  name: "Occipital Lobe", subs: ["v1", "v2v3", "lingual"] },
  { id: "cerebellum", name: "Cerebellum",     subs: ["vermis", "hemispheres", "dentate", "flocculus"] },
  { id: "brainstem",  name: "Brainstem",      subs: ["midbrain", "pons", "medulla", "reticular"] },
  { id: "limbic",     name: "Limbic System",  subs: ["hippocampus", "amygdala", "cingulate", "hypothalamus", "thalamus"] },
];

let shotCounter = 0;
const rows = []; // each: { feature_id, ui_label, code_anchor, screenshot, what_happens, console_errors, star }

function rel(p) {
  return p.replace(/\\/g, "/");
}

function pad(n) {
  return String(n).padStart(2, "0");
}

async function snap(page, locator) {
  shotCounter += 1;
  const name = `inv-${pad(shotCounter)}.png`;
  const fullpath = fileURLToPath(new URL(name, OUT_DIR));
  try {
    if (locator) {
      await locator.screenshot({ path: fullpath, timeout: 4000 });
    } else {
      await page.screenshot({ path: fullpath, fullPage: false });
    }
  } catch {
    // fallback to full page
    try { await page.screenshot({ path: fullpath, fullPage: false }); } catch {}
  }
  return `verification/${name}`;
}

function record({ id, label, anchor, shot, action, errors, star = false }) {
  // Auto-star on real errors (THREE.* / TypeError / Uncaught), but ignore
  // generic resource 404s (favicon-style noise).
  const realErr = errors.some((e) => /THREE\.|TypeError|Uncaught|ReferenceError|RangeError|SyntaxError|pageerror/i.test(e));
  rows.push({
    feature_id: id,
    ui_label: label.replace(/\|/g, "\\|"),
    code_anchor: anchor,
    screenshot: shot,
    what_happens: action.replace(/\|/g, "\\|").slice(0, 90),
    console_errors: errors.length > 0 ? "Y" : "N",
    star: star || realErr,
    error_msgs: errors.slice(0, 2),
  });
}

class ErrorBucket {
  constructor(page) {
    this.errors = [];
    page.on("pageerror", (err) => this.errors.push(`pageerror: ${String(err.message ?? err)}`));
    page.on("console", (msg) => {
      if (msg.type() === "error") this.errors.push(`console: ${msg.text().slice(0, 200)}`);
    });
  }
  reset() { const e = this.errors; this.errors = []; return e; }
}

async function safeClick(locator, opts = {}) {
  try {
    await locator.click({ timeout: opts.timeout ?? 3500 });
    return true;
  } catch {
    return false;
  }
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  await mkdir(TMP_DIR, { recursive: true });

  const launchOptions = { headless: true, args: ["--no-sandbox", "--disable-dev-shm-usage"] };
  const exe = chromePath();
  if (exe) launchOptions.executablePath = exe;

  const browser = await chromium.launch(launchOptions);
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1, acceptDownloads: true });
  const page = await ctx.newPage();
  const bucket = new ErrorBucket(page);

  // Loader visibility on cold load. Loader is from drei; appears while suspense pending.
  await page.goto(APP_URL, { waitUntil: "domcontentloaded" });
  let loaderShot = "";
  let loaderSawIt = false;
  try {
    // drei Loader root has data-react-three-loader or its container styles inline; try by partial selector
    const loaderEl = page.locator("div").filter({ hasText: /Loading anatomy/ }).first();
    await loaderEl.waitFor({ state: "visible", timeout: 4000 });
    loaderSawIt = true;
    loaderShot = await snap(page);
  } catch {
    // probably already loaded; take a snapshot of the initial frame anyway
    loaderShot = await snap(page);
  }
  record({
    id: "loader",
    label: "drei <Loader> overlay",
    anchor: "src/App.tsx:711",
    shot: loaderShot,
    action: loaderSawIt ? "Loader shown during initial suspense" : "Loader did not appear (load too fast?)",
    errors: bucket.reset(),
    star: !loaderSawIt,
  });

  await page.waitForSelector("canvas", { timeout: 15000 });
  await page.waitForTimeout(1500);

  // ---- TOPBAR ----
  const brand = page.locator(".brand-block");
  const brandShot = await snap(page, brand);
  record({
    id: "topbar.brand",
    label: "Brand block (logo + title)",
    anchor: "src/App.tsx:41-50",
    shot: brandShot,
    action: "Static title + brain orb icon (no click handler)",
    errors: bucket.reset(),
  });

  const topMeta = page.locator(".topbar-meta");
  const metaShot = await snap(page, topMeta);
  record({
    id: "topbar.region_chip",
    label: "Region chip (right of topbar)",
    anchor: "src/App.tsx:52-55",
    shot: metaShot,
    action: "Shows current region accent + name (display only)",
    errors: bucket.reset(),
  });

  // ---- SIDEBAR REGIONS (7) ----
  for (const region of REGIONS) {
    const rowLoc = page.locator(".cell-row").filter({ hasText: region.name }).first();
    bucket.reset();
    const clicked = await safeClick(rowLoc);
    await page.waitForTimeout(900);
    let title = "";
    try { title = await page.locator(".stage-title h2").innerText({ timeout: 2000 }); } catch {}
    const matched = title.includes(region.name);
    const shot = await snap(page);
    record({
      id: `sidebar.region.${region.id}`,
      label: `Region card: ${region.name}`,
      anchor: "src/App.tsx:108-134",
      shot,
      action: clicked ? (matched ? `Selects ${region.name}, stage title updated` : `Clicked but title=${title.slice(0, 28)}`) : "locator failed",
      errors: bucket.reset(),
      star: !clicked || !matched,
    });

    // Favorite star inside this card
    bucket.reset();
    const star = rowLoc.locator(".favorite-dot");
    let favClicked = await safeClick(star);
    await page.waitForTimeout(220);
    let isOn = false;
    try { isOn = (await star.getAttribute("class") ?? "").includes("is-on"); } catch {}
    const favShot = await snap(page, star);
    record({
      id: `sidebar.region.${region.id}.fav`,
      label: `Favorite star on ${region.name}`,
      anchor: "src/App.tsx:120-131",
      shot: favShot,
      action: favClicked ? `Toggled favorite (is-on=${isOn})` : "locator failed",
      errors: bucket.reset(),
      star: !favClicked,
    });
    // toggle back so we don't accumulate state
    await safeClick(star);
    await page.waitForTimeout(150);

    // ---- SUBSTRUCTURE BUTTONS for this region ----
    const subRows = await page.locator(".organelle-row").all();
    for (let i = 0; i < subRows.length; i += 1) {
      bucket.reset();
      const subBtn = subRows[i];
      let subName = "";
      try { subName = (await subBtn.innerText({ timeout: 1200 })).trim(); } catch {}
      const cClicked = await safeClick(subBtn);
      // Poll right-rail h3 until it matches subName, max 1.5s
      let detailHero = "";
      const target = subName.split("\n")[0].toLowerCase().slice(0, 6);
      const deadline = Date.now() + 1500;
      while (Date.now() < deadline) {
        try { detailHero = await page.locator(".detail-hero h3").innerText({ timeout: 600 }); } catch {}
        if (detailHero.toLowerCase().includes(target)) break;
        await page.waitForTimeout(120);
      }
      const reflected = target && detailHero.toLowerCase().includes(target);
      const sShot = await snap(page);
      const slug = (subName || `idx${i}`).toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 24);
      record({
        id: `sidebar.sub.${region.id}.${slug}`,
        label: `Substructure: ${subName}`,
        anchor: "src/App.tsx:147-157",
        shot: sShot,
        action: cClicked ? (reflected ? `Right-rail detail = ${detailHero}` : `★ Clicked but h3 did not update (got: ${detailHero.slice(0, 24)})`) : "locator failed",
        errors: bucket.reset(),
        star: !cClicked || !reflected,
      });
    }
  }

  // Reset to frontal for stage interactions
  await page.locator(".cell-row").filter({ hasText: "Frontal Lobe" }).first().click().catch(() => {});
  await page.waitForTimeout(800);

  // ---- STAGE: View Mode buttons ----
  const modeBtns = await page.locator(".mode-switcher button").all();
  for (let i = 0; i < modeBtns.length; i += 1) {
    bucket.reset();
    const b = modeBtns[i];
    let title = "";
    try { title = (await b.getAttribute("title")) ?? ""; } catch {}
    const ok = await safeClick(b);
    await page.waitForTimeout(500);
    let isActive = false;
    try { isActive = (await b.getAttribute("class") ?? "").includes("is-active"); } catch {}
    const shot = await snap(page);
    record({
      id: `stage.mode.${title.toLowerCase()}`,
      label: `View Mode: ${title}`,
      anchor: "src/App.tsx:221-232",
      shot,
      action: ok ? `Sets viewMode=${title.toLowerCase()}, btn is-active=${isActive}` : "locator failed",
      errors: bucket.reset(),
      star: !ok,
    });
  }

  // ---- STAGE: Cross Section orientation buttons ----
  const clipLabels = ["Off", "Axial", "Coronal", "Sagittal"];
  for (const label of clipLabels) {
    bucket.reset();
    const btn = page.locator(".clip-switcher button").filter({ hasText: label }).first();
    const ok = await safeClick(btn);
    await page.waitForTimeout(550);
    let active = false;
    try { active = (await btn.getAttribute("class") ?? "").includes("is-active"); } catch {}
    let sliderPresent = false;
    try { sliderPresent = (await page.locator(".clip-slider").count()) > 0; } catch {}
    const shot = await snap(page);
    record({
      id: `stage.clip.${label.toLowerCase()}`,
      label: `Cross Section: ${label}`,
      anchor: "src/App.tsx:236-247",
      shot,
      action: ok ? `clipOrientation=${label.toLowerCase()}, slider=${sliderPresent}, active=${active}` : "locator failed",
      errors: bucket.reset(),
      star: !ok,
    });
  }

  // Slider interaction (set to non-zero while in current axial/coronal/sagittal mode)
  bucket.reset();
  // Switch to axial first to ensure slider exists
  await safeClick(page.locator(".clip-switcher button").filter({ hasText: "Axial" }).first());
  await page.waitForTimeout(400);
  const slider = page.locator(".clip-slider").first();
  let sliderOk = false;
  try {
    await slider.evaluate((el) => {
      const input = el;
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
      setter.call(input, "0.6");
      input.dispatchEvent(new Event("input", { bubbles: true }));
      input.dispatchEvent(new Event("change", { bubbles: true }));
    });
    sliderOk = true;
  } catch {}
  await page.waitForTimeout(450);
  const sliderShot = await snap(page);
  let sliderVal = "";
  try { sliderVal = (await slider.inputValue()) ?? ""; } catch {}
  record({
    id: "stage.clip.slider",
    label: "Cross section offset slider",
    anchor: "src/App.tsx:248-259",
    shot: sliderShot,
    action: sliderOk ? `Set value=${sliderVal} via input event` : "Could not drive slider",
    errors: bucket.reset(),
    star: !sliderOk,
  });
  // Turn clip off to clean state
  await safeClick(page.locator(".clip-switcher button").filter({ hasText: "Off" }).first());
  await page.waitForTimeout(300);

  // ---- STAGE TOOLBAR: Rotate / Isolate / Reset View ----
  const toolbarSpecs = [
    { text: "Rotate", id: "stage.tool.rotate", anchor: "src/App.tsx:280-288", what: "Toggles autoRotate" },
    { text: "Isolate", id: "stage.tool.isolate", anchor: "src/App.tsx:289-297", what: "Toggles viewMode focus<->mesh" },
    { text: "Reset View", id: "stage.tool.reset", anchor: "src/App.tsx:298-301", what: "Resets camera, fires toast" },
  ];
  for (const spec of toolbarSpecs) {
    bucket.reset();
    const btn = page.locator(".stage-toolbar button").filter({ hasText: spec.text }).first();
    const ok = await safeClick(btn);
    await page.waitForTimeout(700);
    const shot = await snap(page);
    let toastSeen = false;
    try { toastSeen = (await page.locator(".toast").count()) > 0; } catch {}
    record({
      id: spec.id,
      label: `Toolbar: ${spec.text}`,
      anchor: spec.anchor,
      shot,
      action: ok ? `${spec.what} (toast=${toastSeen})` : "locator failed",
      errors: bucket.reset(),
      star: !ok,
    });
  }

  // ---- EXPORT TOOLBAR: Screenshot / GLB Export (capture downloads) ----
  bucket.reset();
  let pngName = "";
  try {
    const [download] = await Promise.all([
      page.waitForEvent("download", { timeout: 8000 }),
      page.locator(".export-toolbar button").filter({ hasText: "Screenshot" }).click({ timeout: 3000 }),
    ]);
    pngName = download.suggestedFilename();
  } catch (e) {
    pngName = `FAILED: ${String(e.message ?? e).slice(0, 60)}`;
  }
  await page.waitForTimeout(400);
  const ssShot = await snap(page);
  record({
    id: "export.screenshot",
    label: "Export: Screenshot",
    anchor: "src/App.tsx:304-308",
    shot: ssShot,
    action: pngName.startsWith("FAILED") ? pngName : `Downloaded ${pngName}`,
    errors: bucket.reset(),
    star: pngName.startsWith("FAILED") || !pngName.endsWith(".png"),
  });

  bucket.reset();
  let glbName = "";
  try {
    const [download] = await Promise.all([
      page.waitForEvent("download", { timeout: 30000 }),
      page.locator(".export-toolbar button").filter({ hasText: "GLB Export" }).click({ timeout: 3000 }),
    ]);
    glbName = download.suggestedFilename();
  } catch (e) {
    glbName = `FAILED: ${String(e.message ?? e).slice(0, 60)}`;
  }
  await page.waitForTimeout(400);
  const glbShot = await snap(page);
  record({
    id: "export.glb",
    label: "Export: GLB",
    anchor: "src/App.tsx:309-312",
    shot: glbShot,
    action: glbName.startsWith("FAILED") ? glbName : `Downloaded ${glbName}`,
    errors: bucket.reset(),
    star: glbName.startsWith("FAILED") || !glbName.endsWith(".glb"),
  });

  // ---- RIGHT RAIL: details / heart / notes / occurrence ----
  bucket.reset();
  const heart = page.locator(".details-panel .panel-heading button").first();
  const heartOk = await safeClick(heart);
  await page.waitForTimeout(250);
  const heartShot = await snap(page, page.locator(".details-panel"));
  record({
    id: "right.heart",
    label: "Right-rail heart favorite",
    anchor: "src/App.tsx:335-337",
    shot: heartShot,
    action: heartOk ? "Toggles favorite for current region" : "locator failed",
    errors: bucket.reset(),
    star: !heartOk,
  });
  // toggle back
  await safeClick(heart);
  await page.waitForTimeout(150);

  // capture display-only panels
  for (const spec of [
    { sel: ".details-panel", id: "right.details", label: "Substructure Details panel", anchor: "src/App.tsx:332-365" },
    { sel: ".notes-panel", id: "right.notes", label: "Neuroscience Notes panel", anchor: "src/App.tsx:367-376" },
    { sel: ".occurrence-panel", id: "right.occurrence", label: "Anatomical Location panel", anchor: "src/App.tsx:378-389" },
  ]) {
    const loc = page.locator(spec.sel).first();
    const shot = await snap(page, loc);
    record({
      id: spec.id,
      label: spec.label,
      anchor: spec.anchor,
      shot,
      action: "Display only (driven by region+sub state)",
      errors: bucket.reset(),
    });
  }

  // ---- BOTTOM: Imaging modes -- per region we visit, click each micro-card ----
  for (const region of REGIONS) {
    bucket.reset();
    await safeClick(page.locator(".cell-row").filter({ hasText: region.name }).first());
    await page.waitForTimeout(700);
    const cards = await page.locator(".micro-card").all();
    for (let i = 0; i < cards.length; i += 1) {
      bucket.reset();
      const card = cards[i];
      let label = "";
      try { label = (await card.innerText({ timeout: 1200 })).trim(); } catch {}
      const ok = await safeClick(card);
      await page.waitForTimeout(400);
      let active = false;
      try { active = (await card.getAttribute("class") ?? "").includes("is-active"); } catch {}
      let toastVisible = false;
      try { toastVisible = (await page.locator(".toast").count()) > 0; } catch {}
      const shot = await snap(page);
      const slug = label.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 20);
      record({
        id: `bottom.imaging.${region.id}.${slug || "idx" + i}`,
        label: `Imaging [${region.name}]: ${label}`,
        anchor: "src/App.tsx:413-426",
        shot,
        action: ok ? `Active=${active}, toast=${toastVisible}` : "locator failed",
        errors: bucket.reset(),
        star: !ok,
      });
    }
  }

  // ---- BOTTOM: Compare panel + Open Comparison View ----
  bucket.reset();
  const comparePanel = page.locator(".compare-panel").first();
  const comparePanelShot = await snap(page, comparePanel);
  record({
    id: "bottom.compare.panel",
    label: "Compare Regions panel",
    anchor: "src/App.tsx:430-453",
    shot: comparePanelShot,
    action: "Shows current region vs region.comparison default",
    errors: bucket.reset(),
  });

  bucket.reset();
  const openBtn = page.locator(".comparison-button").first();
  const ok = await safeClick(openBtn);
  await page.waitForTimeout(1800); // allow drei <View> + GLB load on right
  let modalOk = false;
  let viewCount = 0;
  let leftBox = null;
  let rightBox = null;
  try {
    modalOk = (await page.locator(".comparison-modal h3").count()) > 0;
    viewCount = await page.locator(".comparison-stage .comparison-view").count();
    if (viewCount >= 2) {
      const views = await page.locator(".comparison-stage .comparison-view").all();
      leftBox = await views[0].boundingBox();
      rightBox = await views[1].boundingBox();
    }
  } catch {}
  await page.waitForTimeout(400);
  const modalShot = await snap(page);
  record({
    id: "bottom.compare.open",
    label: "Open Comparison View button",
    anchor: "src/App.tsx:454-457",
    shot: modalShot,
    action: ok ? `Modal opened=${modalOk}, view containers=${viewCount}` : "locator failed",
    errors: bucket.reset(),
    star: !ok || !modalOk,
  });

  // Comparison modal layout — sample center pixels of each side
  bucket.reset();
  const modalWide = await snap(page, page.locator(".comparison-modal").first());
  // Pixel sampling to detect blank vs rendered brain on each side
  let leftHasContent = false;
  let rightHasContent = false;
  try {
    const probe = await page.locator(".comparison-stage").screenshot();
    const { PNG } = await import("pngjs");
    const png = PNG.sync.read(probe);
    function probeRegion(x0, x1) {
      let nonBg = 0;
      const y0 = Math.floor(png.height * 0.25);
      const y1 = Math.floor(png.height * 0.85);
      let total = 0;
      for (let y = y0; y < y1; y += 4) {
        for (let x = x0; x < x1; x += 4) {
          const i = (png.width * y + x) * 4;
          const r = png.data[i], g = png.data[i + 1], b = png.data[i + 2];
          if (Math.abs(r - 251) + Math.abs(g - 247) + Math.abs(b - 238) > 22) nonBg += 1;
          total += 1;
        }
      }
      return nonBg / total;
    }
    const halfW = Math.floor(png.width / 2);
    const leftRatio = probeRegion(Math.floor(png.width * 0.05), halfW - 10);
    const rightRatio = probeRegion(halfW + 10, Math.floor(png.width * 0.95));
    leftHasContent = leftRatio > 0.04;
    rightHasContent = rightRatio > 0.04;
  } catch (e) {
    // pixel probe failed; rely on box dims
  }
  record({
    id: "modal.comparison",
    label: "Comparison Modal (dual <View> brains)",
    anchor: "src/App.tsx:482-523, components/ComparisonStage.tsx",
    shot: modalWide,
    action: `1 Canvas + 2 drei <View>s; left rendered=${leftHasContent}, right rendered=${rightHasContent}`,
    errors: bucket.reset(),
    star: !leftHasContent || !rightHasContent,
  });

  // Close modal
  bucket.reset();
  const closeBtn = page.locator(".modal-close").first();
  const closedOk = await safeClick(closeBtn);
  await page.waitForTimeout(400);
  const closedShot = await snap(page);
  record({
    id: "modal.close",
    label: "Comparison Modal Close button",
    anchor: "src/App.tsx:485-487",
    shot: closedShot,
    action: closedOk ? "Closed modal" : "locator failed",
    errors: bucket.reset(),
    star: !closedOk,
  });

  // ---- TOAST capture (trigger via Reset View, then snapshot quickly) ----
  bucket.reset();
  await safeClick(page.locator(".stage-toolbar button").filter({ hasText: "Reset View" }).first());
  await page.waitForTimeout(150);
  let toastShot = "";
  let toastSeen = false;
  try {
    await page.locator(".toast").waitFor({ state: "visible", timeout: 1500 });
    toastSeen = true;
    toastShot = await snap(page, page.locator(".toast").first());
  } catch {
    toastShot = await snap(page);
  }
  record({
    id: "toast",
    label: "Toast notification",
    anchor: "src/App.tsx:526-531",
    shot: toastShot,
    action: toastSeen ? "Visible after Reset View click" : "Toast did not appear in 1.5s",
    errors: bucket.reset(),
    star: !toastSeen,
  });

  await ctx.close();
  await browser.close();

  // ---- WRITE INVENTORY FILE ----
  const lines = [];
  lines.push("# UI Inventory (raw)");
  lines.push("");
  lines.push(`Generated: ${new Date().toISOString()}`);
  lines.push(`URL: ${APP_URL}`);
  lines.push(`Viewport: 1440x1000`);
  lines.push("");
  lines.push("## Feature table");
  lines.push("");
  lines.push("| feature_id | ui_label | code_anchor | screenshot | what_happens | console_errors | star |");
  lines.push("|---|---|---|---|---|---|---|");
  for (const r of rows) {
    lines.push(
      `| ${r.feature_id} | ${r.ui_label} | ${r.code_anchor} | ${r.screenshot} | ${r.what_happens} | ${r.console_errors} | ${r.star ? "★" : ""} |`,
    );
  }

  // Errors detail block
  const errored = rows.filter((r) => r.error_msgs && r.error_msgs.length > 0);
  if (errored.length > 0) {
    lines.push("");
    lines.push("## Console / page errors per feature");
    lines.push("");
    for (const r of errored) {
      lines.push(`- **${r.feature_id}**`);
      for (const e of r.error_msgs) lines.push(`  - ${e}`);
    }
  }

  // ---- Scripts classification ----
  // keep = long-term tools, scratch = one-off probes
  const scriptClass = {
    keep: [
      { f: "verify.mjs", why: "Headless verification — viewport sweep, region/sub clicks, downloads, asserts. Used by `npm run verify`." },
      { f: "build-region-glbs.mjs", why: "Per-region GLB authoring tool — long-term build pipeline for /public/models/regions/*." },
      { f: "add-region-cameras.mjs", why: "Camera-pose authoring tool against regions.ts — keep as a maintenance helper." },
      { f: "add-substructure-cameras.mjs", why: "Camera-pose authoring tool for substructure close-ups." },
      { f: "add-substructure-meshes.mjs", why: "Mesh authoring helper to wire FJ codes into substructure entries." },
      { f: "inventory.mjs", why: "(this file) UI inventory walker — keep as a regression tool, can be re-run any time." },
    ],
    scratch: [
      { f: "all-region-shots.mjs", why: "One-off batch screenshot generator (region tour) — overlaps with verify.mjs." },
      { f: "check-brainstem.mjs", why: "Brainstem-specific audit — one region only, narrow purpose." },
      { f: "clip-shot.mjs", why: "Cross-section screenshot probe for a single state." },
      { f: "cross-section-shot.mjs", why: "Two-state cross-section screenshot probe (off vs on)." },
      { f: "debug-warning.mjs", why: "Console-warning probe — name says it; one-off." },
      { f: "imaging-modes-shot.mjs", why: "Imaging-mode visual probe — one-off, now covered by inventory." },
      { f: "killer-demo.mjs", why: "Demo recording probe (clipping + bloom + comparison)." },
      { f: "recon.mjs", why: "Reconnaissance probe — adhoc DOM scrape." },
      { f: "sub-cam-shots.mjs", why: "Substructure camera-pose probe shots." },
      { f: "three-features-shot.mjs", why: "Three-feature visual probe (bloom/clip/comparison)." },
    ],
  };

  lines.push("");
  lines.push("## Scripts directory classification");
  lines.push("");
  lines.push("### keep (long-term tools)");
  lines.push("");
  for (const s of scriptClass.keep) lines.push(`- \`scripts/${s.f}\` — ${s.why}`);
  lines.push("");
  lines.push("### scratch (one-off probes — candidates for `scripts/scratch/`)");
  lines.push("");
  for (const s of scriptClass.scratch) lines.push(`- \`scripts/${s.f}\` — ${s.why}`);
  lines.push("");
  lines.push("**Suggestion**: move every file under \"scratch\" into `scripts/scratch/` (or delete if no longer interesting). Keep `verify.mjs`, `inventory.mjs`, `build-region-glbs.mjs`, and the three `add-*.mjs` authoring helpers at top-level.");

  // ---- Self evaluation footer ----
  const total = rows.length;
  const stars = rows.filter((r) => r.star).length;
  lines.push("");
  lines.push("## Self-evaluation");
  lines.push("");
  lines.push(`- UI elements operated: ${total} (target estimate from spec ≈ 80, includes 7 regions × (card + star) + 28 substructures + 4 view-mode/clip + 1 slider + 3 toolbar + 2 export + 4 right-rail + 4 imaging-region (3 each) + compare + modal + close + toast + loader + 2 topbar)`);
  lines.push(`- Screenshots written: ${shotCounter} (verification/inv-01.png … inv-${pad(shotCounter)}.png)`);
  lines.push(`- ★ flagged (looks broken / needs human review): ${stars}`);

  const out = fileURLToPath(new URL("inventory.md", TMP_DIR));
  await writeFile(out, lines.join("\n") + "\n", "utf8");

  console.log(JSON.stringify({
    ok: true,
    total_features: total,
    screenshots: shotCounter,
    stars,
    output: rel(out),
  }, null, 2));
}

main().catch((err) => {
  console.error("inventory failed:", err);
  process.exit(1);
});
