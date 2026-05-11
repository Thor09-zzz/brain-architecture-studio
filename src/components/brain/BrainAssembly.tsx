import { Center } from "@react-three/drei";
import type { RegionItem, ViewMode } from "../../data/regions";
import { FJ_INDEX } from "./fjIndex";
import { FJMesh } from "./FJMesh";
import type { ImagingMode } from "./materials";

export const BRAIN_GROUP_SCALE = 0.018;

export function BrainAssembly({
  region,
  activeSubstructure,
  viewMode,
  clipEnabled,
  imagingMode,
}: {
  region: RegionItem;
  activeSubstructure: string;
  viewMode: ViewMode;
  clipEnabled: boolean;
  imagingMode: ImagingMode;
}) {
  return (
    <group scale={[BRAIN_GROUP_SCALE, BRAIN_GROUP_SCALE, BRAIN_GROUP_SCALE]}>
      <Center>
        <group>
          {FJ_INDEX.map((tag) => (
            <FJMesh
              key={tag.code}
              tag={tag}
              selectedRegion={region.id}
              activeSubstructure={activeSubstructure}
              viewMode={viewMode}
              clipEnabled={clipEnabled}
              imagingMode={imagingMode}
            />
          ))}
        </group>
      </Center>
    </group>
  );
}
