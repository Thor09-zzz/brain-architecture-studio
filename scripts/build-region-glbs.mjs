#!/usr/bin/env node
import { mkdir, readdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";
import obj2gltf from "obj2gltf";

const exec = promisify(execFile);

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");
const tmpDir = join(root, ".tmp");
const objDir = join(tmpDir, "obj");
const outDir = join(root, "public", "models", "regions");
const zipPath = join(tmpDir, "bodyparts3d.zip");

const FJ_CODES = [
  // Frontal lobe (R: FJ1745+1788+1801+1834, L: FJ1744+1787+1800+1833)
  "FJ1744", "FJ1745", "FJ1787", "FJ1788", "FJ1800", "FJ1801", "FJ1833", "FJ1834",
  // Parietal lobe (R: 1733+1798+1836+1842, L: 1732+1797+1835+1841)
  "FJ1732", "FJ1733", "FJ1797", "FJ1798", "FJ1835", "FJ1836", "FJ1841", "FJ1842",
  // Temporal lobe (R: 1747+1784+1786+1790, L: 1746+1783+1785+1789)
  "FJ1746", "FJ1747", "FJ1783", "FJ1784", "FJ1785", "FJ1786", "FJ1789", "FJ1790",
  // Occipital lobe (R: 1792, L: 1791)
  "FJ1791", "FJ1792",
  // Cerebellum
  "FJ1781", "FJ1830",
  // Brainstem (midbrain + pons + medulla)
  "FJ1738", "FJ1762", "FJ1769", "FJ1770", "FJ1775", "FJ1779", "FJ1810",
  "FJ1817", "FJ1822", "FJ1826", "FJ1831",
  // Limbic — extra not already covered
  "FJ1739", "FJ1740", "FJ1759", "FJ1807", "FJ1753", "FJ1782",
  // Hypothalamus completes (FMA62008 has 4 FJ files)
  "FJ1760", "FJ1780", "FJ1808", "FJ1828",
];

async function ensureDir(path) {
  await mkdir(path, { recursive: true });
}

async function extractObjs() {
  await ensureDir(objDir);
  const existing = new Set(
    (existsSync(objDir) ? await readdir(objDir) : []).filter((name) => name.endsWith(".obj")),
  );
  const missing = FJ_CODES.filter((code) => !existing.has(`${code}.obj`));
  if (missing.length === 0) {
    console.log(`✓ all ${FJ_CODES.length} OBJ files already extracted`);
    return;
  }
  const args = [
    "-j", zipPath, "-d", objDir,
    ...missing.map((code) => `isa_BP3D_4.0_obj_99/${code}.obj`),
  ];
  console.log(`→ extracting ${missing.length} OBJ files via unzip`);
  await exec("unzip", args);
}

async function convertObj(code) {
  const objPath = join(objDir, `${code}.obj`);
  const glbPath = join(outDir, `${code}.glb`);
  if (existsSync(glbPath)) {
    const stats = await stat(glbPath);
    if (stats.size > 200) {
      return { code, status: "cached", size: stats.size };
    }
  }
  const buf = await obj2gltf(objPath, {
    binary: true,
    optimizeForCesium: false,
    packOcclusion: false,
    inputUpAxis: "Y",
    outputUpAxis: "Y",
  });
  await writeFile(glbPath, buf);
  const stats = await stat(glbPath);
  return { code, status: "converted", size: stats.size };
}

async function main() {
  if (!existsSync(zipPath)) {
    throw new Error(`missing ${zipPath} — download BodyParts3D ZIP first`);
  }
  await ensureDir(outDir);
  await extractObjs();
  console.log(`→ converting ${FJ_CODES.length} OBJ → GLB`);
  const results = [];
  for (const code of FJ_CODES) {
    try {
      const result = await convertObj(code);
      results.push(result);
      process.stdout.write(`  ${code}: ${result.status} (${result.size} bytes)\n`);
    } catch (err) {
      console.error(`  ✗ ${code}: ${err.message}`);
      results.push({ code, status: "error", error: err.message });
    }
  }
  const ok = results.filter((r) => r.status !== "error");
  const totalBytes = ok.reduce((sum, r) => sum + (r.size ?? 0), 0);
  console.log(`\n✓ ${ok.length}/${FJ_CODES.length} GLBs ready, total ${(totalBytes / 1024).toFixed(0)} KB`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
