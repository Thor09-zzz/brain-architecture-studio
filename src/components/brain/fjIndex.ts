import { useGLTF } from "@react-three/drei";
import { fjMeshUrl, regions as allRegions } from "../../data/regions";

export type FJTag = {
  code: string;
  regions: string[];
  /** Keys formatted as `${regionId}:${substructureId}`. */
  substructures: string[];
};

export type TagState = "substructure" | "region" | "off";

function buildFJIndex(): FJTag[] {
  const map = new Map<string, FJTag>();
  for (const region of allRegions) {
    for (const code of region.meshes) {
      const tag = map.get(code) ?? { code, regions: [], substructures: [] };
      if (!tag.regions.includes(region.id)) {
        tag.regions.push(region.id);
      }
      map.set(code, tag);
    }
    for (const sub of region.substructures) {
      for (const code of sub.meshes) {
        const tag = map.get(code) ?? { code, regions: [], substructures: [] };
        const subKey = `${region.id}:${sub.id}`;
        if (!tag.substructures.includes(subKey)) {
          tag.substructures.push(subKey);
        }
        map.set(code, tag);
      }
    }
  }
  return Array.from(map.values());
}

export const FJ_INDEX = buildFJIndex();
for (const tag of FJ_INDEX) {
  useGLTF.preload(fjMeshUrl(tag.code));
}

export function tagState(
  tag: FJTag,
  selectedRegion: string,
  activeSubstructure: string,
): TagState {
  if (
    tag.substructures.some(
      (subKey) => subKey === `${selectedRegion}:${activeSubstructure}`,
    )
  ) {
    return "substructure";
  }
  if (tag.regions.includes(selectedRegion)) {
    return "region";
  }
  return "off";
}

const DEEP_SUBSTRUCTURES = new Set<string>([
  "hippocampus",
  "amygdala",
  "thalamus",
  "hypothalamus",
  "cingulate",
  "midbrain",
  "pons",
  "medulla",
  "dentate",
  "vermis",
  "flocculus",
]);

const SHELL_REGIONS = new Set<string>([
  "frontal",
  "parietal",
  "temporal",
  "occipital",
  "cerebellum",
]);

export function isOccludingShell(
  tag: FJTag,
  selectedRegion: string,
  activeSubstructure: string,
): boolean {
  const exploringDeep =
    DEEP_SUBSTRUCTURES.has(activeSubstructure) || selectedRegion === "limbic";
  if (!exploringDeep) {
    return false;
  }
  return (
    tag.regions.some((rid) => SHELL_REGIONS.has(rid)) &&
    !tag.regions.includes(selectedRegion)
  );
}
