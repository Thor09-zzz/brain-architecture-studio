import {
  Color,
  DoubleSide,
  MeshStandardMaterial,
  Plane,
  Vector3,
  type Material,
} from "three";
import type { ViewMode } from "../../data/regions";
import type { TagState } from "./fjIndex";

export type ImagingMode = "anatomical" | "activation" | "tracts" | "histology";

export function deriveImagingMode(pattern: string | undefined): ImagingMode {
  if (pattern === "fmri") return "activation";
  if (pattern === "dti") return "tracts";
  if (pattern === "histology") return "histology";
  return "anatomical";
}

export type ClipOrientation = "off" | "axial" | "coronal" | "sagittal";

export const CLIP_NORMALS: Record<Exclude<ClipOrientation, "off">, Vector3> = {
  axial: new Vector3(0, 1, 0),
  coronal: new Vector3(0, 0, 1),
  sagittal: new Vector3(1, 0, 0),
};

/** Module-scope plane mutated in place by the slider — avoids per-frame material re-clones. */
export const SHARED_CLIP_PLANE = new Plane(new Vector3(0, 1, 0), 0);

export function applyClipPose(orientation: ClipOrientation, offset: number) {
  if (orientation === "off") {
    return;
  }
  SHARED_CLIP_PLANE.normal.copy(CLIP_NORMALS[orientation]);
  SHARED_CLIP_PLANE.constant = -offset;
}

export type TintOptions = {
  state: TagState;
  viewMode: ViewMode;
  /** Whether any clip plane is active (pure boolean — slider drag does NOT trigger re-clone). */
  clipEnabled: boolean;
  /** True when the user is viewing a deep structure that the surface cortex would otherwise occlude. */
  occludingShell: boolean;
  imagingMode: ImagingMode;
};

type StylePreset = {
  /** Diffuse color base for all meshes. */
  baseColor: string;
  /** Diffuse color for non-highlighted meshes (overrides baseColor). */
  offColor?: string;
  /** Emissive color for highlighted region/substructure (replaces accent if set). */
  highlightEmissive?: string;
  /** Stronger emissive for substructure focus. */
  substructureEmissive?: string;
  /** Multiplier for emissive intensities (1.0 = standard). */
  intensityScale: number;
  /** Roughness for highlighted meshes. */
  highlightRoughness: number;
  /** Roughness for non-highlighted. */
  offRoughness: number;
  /** Metalness for highlighted (some modes look more like fibers). */
  highlightMetalness: number;
  /** Tint mix between accent and warm white. Lower = more saturated accent. */
  accentMix: number;
};

const PRESETS: Record<ImagingMode, StylePreset> = {
  anatomical: {
    baseColor: "#f5e1d3",
    intensityScale: 1.0,
    highlightRoughness: 0.55,
    offRoughness: 0.78,
    highlightMetalness: 0.04,
    accentMix: 0.18,
  },
  activation: {
    baseColor: "#fff4dc",
    offColor: "#9a8f80",
    highlightEmissive: "#ff5121",
    substructureEmissive: "#ffd246",
    intensityScale: 1.6,
    highlightRoughness: 0.42,
    offRoughness: 0.84,
    highlightMetalness: 0.05,
    accentMix: 0.0,
  },
  tracts: {
    baseColor: "#dfeaf2",
    offColor: "#3a4250",
    highlightEmissive: "#3eb7e8",
    substructureEmissive: "#a0e8ff",
    intensityScale: 1.4,
    highlightRoughness: 0.34,
    offRoughness: 0.7,
    highlightMetalness: 0.22,
    accentMix: 0.0,
  },
  histology: {
    baseColor: "#c9a37b",
    offColor: "#8d6f4e",
    highlightEmissive: "#7a4a24",
    substructureEmissive: "#3f250f",
    /** Below bloom threshold — histology is matte, no glow. */
    intensityScale: 0.35,
    highlightRoughness: 0.92,
    offRoughness: 0.96,
    highlightMetalness: 0.0,
    accentMix: 0.0,
  },
};

export function tintMaterial(
  source: Material,
  accent: Color,
  options: TintOptions,
): Material {
  const cloned = source.clone();
  cloned.side = DoubleSide;
  if (cloned instanceof MeshStandardMaterial) {
    const preset = PRESETS[options.imagingMode];
    const warm = new Color("#fff5e6");
    const isHighlight = options.state !== "off";
    const isSubstructure = options.state === "substructure";

    cloned.color = new Color(
      isHighlight ? preset.baseColor : preset.offColor ?? preset.baseColor,
    );

    let emissive: Color;
    if (isSubstructure && preset.substructureEmissive) {
      emissive = new Color(preset.substructureEmissive);
    } else if (isHighlight && preset.highlightEmissive) {
      emissive = new Color(preset.highlightEmissive);
    } else {
      emissive = accent.clone().lerp(warm, isHighlight ? preset.accentMix : 0.74);
    }
    cloned.emissive = emissive;
    const baseIntensity = isSubstructure ? 1.4 : isHighlight ? 0.95 : 0.05;
    cloned.emissiveIntensity = baseIntensity * preset.intensityScale;

    cloned.envMapIntensity = 0.85;
    cloned.roughness = isHighlight ? preset.highlightRoughness : preset.offRoughness;
    cloned.metalness = isHighlight ? preset.highlightMetalness : 0.04;

    const dimmed = options.viewMode === "focus" && !isHighlight;
    const ghosted = options.occludingShell && !isHighlight;
    cloned.transparent = dimmed || ghosted || cloned.transparent;
    if (dimmed) {
      cloned.opacity = 0.08;
    } else if (ghosted) {
      cloned.opacity = 0.22;
      cloned.depthWrite = false;
    }
    if (options.clipEnabled) {
      cloned.clippingPlanes = [SHARED_CLIP_PLANE];
      cloned.clipShadows = true;
    } else {
      cloned.clippingPlanes = null;
    }
  }
  cloned.needsUpdate = true;
  return cloned;
}
