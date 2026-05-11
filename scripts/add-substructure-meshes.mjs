#!/usr/bin/env node
import { readFile, writeFile } from "node:fs/promises";

const SUB_MESHES = {
  prefrontal: ["FJ1787", "FJ1788", "FJ1833", "FJ1834"],
  motor: ["FJ1800", "FJ1801"],
  broca: ["FJ1744"],
  orbitofrontal: [],
  somatosensory: ["FJ1797", "FJ1798"],
  posteriorParietal: ["FJ1835", "FJ1836"],
  angular: ["FJ1732", "FJ1733"],
  auditory: [],
  wernicke: [],
  fusiform: ["FJ1783", "FJ1784"],
  inferiorTemporal: ["FJ1746", "FJ1747"],
  v1: [],
  v2v3: [],
  lingual: [],
  vermis: [],
  hemispheres: ["FJ1781", "FJ1830"],
  dentate: [],
  flocculus: [],
  midbrain: ["FJ1738", "FJ1762", "FJ1770", "FJ1779", "FJ1810", "FJ1817", "FJ1826"],
  pons: ["FJ1775", "FJ1822"],
  medulla: ["FJ1769", "FJ1831"],
  reticular: [],
  hippocampus: ["FJ1759", "FJ1807"],
  amygdala: ["FJ1753"],
  cingulate: ["FJ1739", "FJ1740"],
  hypothalamus: ["FJ1760", "FJ1780", "FJ1808", "FJ1828"],
  thalamus: ["FJ1782"],
};

const path = "src/data/regions.ts";
const src = await readFile(path, "utf8");

let out = src;
let changed = 0;
for (const [id, meshes] of Object.entries(SUB_MESHES)) {
  const meshLiteral =
    meshes.length === 0
      ? "[]"
      : `["${meshes.join('", "')}"]`;
  const pattern = new RegExp(
    `(        id: "${id}",[\\s\\S]*?fact: "[^"\\n]*",\\n)(      \\},)`,
    "g",
  );
  if (!pattern.test(out)) {
    console.error(`✗ pattern not found for id="${id}"`);
    continue;
  }
  out = out.replace(pattern, `$1        meshes: ${meshLiteral},\n$2`);
  changed += 1;
}

await writeFile(path, out, "utf8");
console.log(`✓ rewrote ${changed}/${Object.keys(SUB_MESHES).length} substructures with meshes`);
