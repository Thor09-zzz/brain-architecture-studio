import { chromium } from "playwright-core";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
function chromePath() {
  for (const p of [
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  ]) if (existsSync(p)) return p;
}
const b = await chromium.launch({
  headless: true,
  executablePath: chromePath(),
  args: ["--no-sandbox"],
});
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.goto(
  "https://www.brainfacts.org/3d-brain#intro=false&focus=Brain-cerebral_hemisphere-right",
  { waitUntil: "networkidle", timeout: 60000 },
);
await p.waitForTimeout(6000);
await p.screenshot({
  path: fileURLToPath(
    new URL("../verification/competitor-brainfacts.png", import.meta.url),
  ),
  fullPage: false,
});
const title = await p.title();
const canvasCount = await p.locator("canvas").count();
const iframeCount = await p.locator("iframe").count();
const buttons = await p.$$eval("button", (btns) =>
  btns.slice(0, 30).map((b) => b.textContent?.trim().slice(0, 50)),
);
const headings = await p.$$eval("h1,h2,h3,h4", (hs) =>
  hs.slice(0, 20).map((h) => h.textContent?.trim().slice(0, 80)),
);
const scriptSrcs = await p.$$eval("script[src]", (s) =>
  s
    .map((x) => x.getAttribute("src"))
    .filter((src) => /three|unity|webgl|babylon|model|gltf|brain/i.test(src ?? ""))
    .slice(0, 15),
);
const iframeSrcs = await p.$$eval("iframe", (fs) =>
  fs.map((f) => f.getAttribute("src")),
);
console.log(
  JSON.stringify(
    { title, canvasCount, iframeCount, buttons, headings, scriptSrcs, iframeSrcs },
    null,
    2,
  ),
);
await b.close();
