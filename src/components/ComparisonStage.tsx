import { Canvas } from "@react-three/fiber";
import { View } from "@react-three/drei";
import { useRef } from "react";
import type { RegionItem } from "../data/regions";
import { BrainSceneInner } from "./BrainSceneInner";

function buildProps(region: RegionItem) {
  return {
    region,
    activeSubstructure: region.defaultSubstructure,
    viewMode: "mesh" as const,
    clipOrientation: "off" as const,
    clipOffset: 0,
    autoRotate: true,
    resetKey: 0,
    imagingTone: region.accentSoft,
    imagingMode: "anatomical" as const,
  };
}

export function ComparisonStage({
  left,
  right,
}: {
  left: RegionItem;
  right: RegionItem;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const leftRef = useRef<HTMLDivElement>(null);
  const rightRef = useRef<HTMLDivElement>(null);

  return (
    <div ref={containerRef} className="comparison-stage">
      <div ref={leftRef} className="comparison-view">
        <span className="comparison-view-label">{left.name}</span>
      </div>
      <div ref={rightRef} className="comparison-view">
        <span className="comparison-view-label">{right.name}</span>
      </div>
      <Canvas
        eventSource={containerRef as React.RefObject<HTMLElement>}
        shadows
        gl={{ antialias: true, localClippingEnabled: true }}
        dpr={[1, 1.8]}
        style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
      >
        <View track={leftRef as React.RefObject<HTMLElement>}>
          <BrainSceneInner {...buildProps(left)} />
        </View>
        <View track={rightRef as React.RefObject<HTMLElement>}>
          <BrainSceneInner {...buildProps(right)} />
        </View>
      </Canvas>
    </div>
  );
}
