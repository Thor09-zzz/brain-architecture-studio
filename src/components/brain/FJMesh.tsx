import { useGLTF } from "@react-three/drei";
import { useMemo } from "react";
import { Color, Mesh, type Material } from "three";
import { fjMeshUrl, regions as allRegions, type ViewMode } from "../../data/regions";
import { isOccludingShell, tagState, type FJTag } from "./fjIndex";
import { tintMaterial, type ImagingMode } from "./materials";

export type FJMeshProps = {
  tag: FJTag;
  selectedRegion: string;
  activeSubstructure: string;
  viewMode: ViewMode;
  clipEnabled: boolean;
  imagingMode: ImagingMode;
};

export function FJMesh({
  tag,
  selectedRegion,
  activeSubstructure,
  viewMode,
  clipEnabled,
  imagingMode,
}: FJMeshProps) {
  const { scene } = useGLTF(fjMeshUrl(tag.code));
  const state = tagState(tag, selectedRegion, activeSubstructure);
  const occludingShell = isOccludingShell(tag, selectedRegion, activeSubstructure);

  const accent = useMemo(() => {
    if (state === "substructure") {
      const region = allRegions.find((r) => r.id === selectedRegion);
      const sub = region?.substructures.find((s) => s.id === activeSubstructure);
      return new Color(sub?.color ?? region?.accent ?? "#a07158");
    }
    if (state === "region") {
      const region = allRegions.find((r) => r.id === selectedRegion);
      return new Color(region?.accent ?? "#a07158");
    }
    return new Color("#a89381");
  }, [state, selectedRegion, activeSubstructure]);

  const tinted = useMemo(() => {
    const clone = scene.clone(true);
    clone.traverse((node) => {
      const mesh = node as Mesh;
      if (!mesh.isMesh) {
        return;
      }
      const apply = (source: Material) =>
        tintMaterial(source, accent, {
          state,
          viewMode,
          clipEnabled,
          occludingShell,
          imagingMode,
        });
      mesh.material = Array.isArray(mesh.material)
        ? mesh.material.map(apply)
        : apply(mesh.material);
      mesh.castShadow = !occludingShell;
      mesh.receiveShadow = true;
    });
    return clone;
  }, [scene, accent, state, viewMode, clipEnabled, occludingShell, imagingMode]);

  return <primitive object={tinted} />;
}
