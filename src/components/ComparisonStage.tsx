import { Canvas } from "@react-three/fiber";
import { PerspectiveCamera, View } from "@react-three/drei";
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
    compact: true as const,
  };
}

/**
 * HtmlView pattern: <View> outside Canvas renders as a tracked <div>; its children
 * tunnel through to <View.Port /> inside Canvas. This avoids the drei v10 CanvasView
 * isOffscreen bug (View.js:19 mis-checks trackRect.left vs canvasSize.width when the
 * canvas is offset from viewport left=0). HTML labels stay outside the View so they
 * don't get tunneled into the WebGL scene.
 */
export function ComparisonStage({
  left,
  right,
}: {
  left: RegionItem;
  right: RegionItem;
}) {
  return (
    <div className="comparison-stage">
      <div className="comparison-cell">
        <span className="comparison-view-label">{left.name}</span>
        <View index={1} className="comparison-view-3d">
          <PerspectiveCamera makeDefault position={left.camera.position} fov={38} />
          <BrainSceneInner {...buildProps(left)} />
        </View>
      </div>
      <div className="comparison-cell">
        <span className="comparison-view-label">{right.name}</span>
        <View index={2} className="comparison-view-3d">
          <PerspectiveCamera makeDefault position={right.camera.position} fov={38} />
          <BrainSceneInner {...buildProps(right)} />
        </View>
      </div>
      <Canvas
        className="comparison-stage-canvas"
        shadows
        gl={{ antialias: true, localClippingEnabled: true }}
        dpr={[1, 1.8]}
      >
        <View.Port />
      </Canvas>
    </div>
  );
}
