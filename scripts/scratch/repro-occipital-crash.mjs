import { chromium } from "playwright-core";
import { existsSync } from "node:fs";
function chromePath() {
  for (const p of [
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  ]) if (existsSync(p)) return p;
}
const b = await chromium.launch({ headless: true, executablePath: chromePath(), args: ["--no-sandbox"] });

const ATTEMPTS = 8;
const hits = [];

for (let i = 0; i < ATTEMPTS; i++) {
  const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  const crashInfo = [];
  p.on("pageerror", (e) => {
    crashInfo.push({
      attempt: i,
      message: e.message,
      stack: (e.stack || "").split("\n").slice(0, 6).join(" | "),
    });
  });
  p.on("console", (m) => {
    if (m.type() === "error" && /alpha|undefined|null/.test(m.text())) {
      crashInfo.push({ attempt: i, console: m.text().slice(0, 250) });
    }
  });

  try {
    await p.goto("http://127.0.0.1:5173/", { waitUntil: "networkidle" });
    await p.waitForSelector("canvas");
    await p.waitForTimeout(3500);
    await p.locator(".cell-row").filter({ hasText: "Occipital Lobe" }).click();
    await p.waitForTimeout(2500);
    await p.locator(".micro-card").filter({ hasText: "Myelin Stain" }).click();
    await p.waitForTimeout(2500);
  } catch (err) {
    crashInfo.push({ attempt: i, scripterror: String(err).slice(0, 200) });
  }

  if (crashInfo.length) {
    hits.push(crashInfo);
    console.error(`💥 attempt ${i} caught ${crashInfo.length} events`);
  } else {
    console.error(`✓ attempt ${i} clean`);
  }
  await p.close();
}

await b.close();
console.log(`\n${hits.length}/${ATTEMPTS} attempts triggered events:`);
console.log(JSON.stringify(hits, null, 2));
