#!/usr/bin/env node
import { readFile, writeFile } from "node:fs/promises";

const SUB_CAM = {
  // Frontal — close cortical views
  prefrontal:    { position: [0.4, 0.5, 4.8], target: [0, 0.3, 0.6] },
  motor:         { position: [0.5, 3.4, 1.4], target: [0, 0.2, 0.0] },
  broca:         { position: [-3.6, 0.2, 1.6], target: [-0.6, 0, 0.4] },
  // Parietal
  somatosensory:    { position: [0.5, 3.4, -0.3], target: [0, 0.2, 0.0] },
  posteriorParietal:{ position: [0.5, 3.4, -2.0], target: [0, 0.2, -0.5] },
  angular:          { position: [3.4, 1.0, -2.0], target: [0.5, 0, -0.4] },
  // Temporal — flip below the hemisphere to see fusiform / IT gyrus
  fusiform:         { position: [0.2, -3.4, 1.2], target: [0, -0.3, 0.2] },
  inferiorTemporal: { position: [3.8, -1.4, 1.0], target: [0.5, -0.3, 0.2] },
  // Cerebellum
  hemispheres:      { position: [0, -1.0, -4.5], target: [0, -0.4, 0] },
  // Brainstem — close front view
  midbrain:    { position: [0, -0.3, 3.6], target: [0, -0.3, 0] },
  pons:        { position: [0, -0.7, 3.6], target: [0, -0.7, 0] },
  medulla:     { position: [0, -1.3, 3.4], target: [0, -1.1, 0] },
  // Limbic — top-down inside-the-brain views (cortex auto-ghosts thanks to occluding shell)
  hippocampus:  { position: [0, 4.5, 0.4], target: [0, 0, 0.2] },
  amygdala:     { position: [0.4, 3.8, 0.7], target: [0, 0, 0.4] },
  cingulate:    { position: [0, 5.0, -0.6], target: [0, 0, -0.4] },
  hypothalamus: { position: [2.6, 0.1, 0.6], target: [0, -0.2, 0.1] },
  thalamus:     { position: [0.4, 3.5, 0.1], target: [0, 0, 0.0] },
};

const path = "src/data/regions.ts";
const src = await readFile(path, "utf8");

let out = src;
let changed = 0;
for (const [id, pose] of Object.entries(SUB_CAM)) {
  const literal = `        camera: { position: [${pose.position.join(", ")}], target: [${pose.target.join(", ")}] },\n`;
  const re = new RegExp(
    `(        id: "${id}",[\\s\\S]*?        meshes: \\[[^\\]]*\\],\\n)`,
  );
  if (!re.test(out)) {
    console.error(`✗ pattern not found for substructure id="${id}"`);
    continue;
  }
  out = out.replace(re, `$1${literal}`);
  changed += 1;
}
await writeFile(path, out, "utf8");
console.log(`✓ wrote camera to ${changed}/${Object.keys(SUB_CAM).length} substructures`);
