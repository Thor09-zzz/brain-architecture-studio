#!/usr/bin/env node
import { readFile, writeFile } from "node:fs/promises";

const POSES = {
  frontal:    { position: [0.6, 0.8, 5.5],  target: [0, 0.0, 0.0] },
  parietal:   { position: [0.4, 4.8, -1.2], target: [0, 0.0, 0.0] },
  temporal:   { position: [5.5, 0.4, 0.6],  target: [0, 0.0, 0.0] },
  occipital:  { position: [0.0, 1.0, -5.5], target: [0, 0.0, 0.0] },
  cerebellum: { position: [0.0, -0.8, -5.0], target: [0, -0.2, 0.0] },
  brainstem:  { position: [0.0, -1.6, 5.0],  target: [0, -0.2, 0.0] },
  limbic:     { position: [0.4, 5.5, 0.4],   target: [0, 0.0, 0.2] },
};

const path = "src/data/regions.ts";
const src = await readFile(path, "utf8");

let out = src;
let changed = 0;
for (const [id, pose] of Object.entries(POSES)) {
  const literal = `    camera: { position: [${pose.position.join(", ")}], target: [${pose.target.join(", ")}] },\n`;
  const pattern = new RegExp(
    `(    id: "${id}",[\\s\\S]*?    meshes: \\[[^\\]]*\\],?\\n)`,
  );
  if (!pattern.test(out)) {
    console.error(`✗ pattern not found for region id="${id}"`);
    continue;
  }
  out = out.replace(pattern, `$1${literal}`);
  changed += 1;
}

await writeFile(path, out, "utf8");
console.log(`✓ wrote camera pose to ${changed}/${Object.keys(POSES).length} regions`);
