import { ContactShadows, OrbitControls } from "@react-three/drei";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import { KernelSize } from "postprocessing";
import { Suspense, useEffect, useRef } from "react";
import { Color, Group } from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import type { RegionItem, ViewMode } from "../data/regions";
import { BrainAssembly } from "./brain/BrainAssembly";
import { AutoSpinRig, CameraRig, CaptureContext } from "./brain/rigs";
import { applyClipPose, type ClipOrientation, type ImagingMode } from "./brain/materials";
import type { Camera, Scene, WebGLRenderer } from "three";

export type BrainSceneInnerProps = {
  region: RegionItem;
  activeSubstructure: string;
  viewMode: ViewMode;
  clipOrientation: ClipOrientation;
  clipOffset: number;
  autoRotate: boolean;
  resetKey: number;
  imagingTone: string;
  imagingMode: ImagingMode;
  /**
   * Compact mode for embedding inside drei <View> portals (e.g. ComparisonStage).
   * Skips: OrbitControls (no makeDefault to avoid stomping siblings), EffectComposer
   * (one renderer can't host two composers). CameraRig still runs and falls back
   * to camera.lookAt when controls are absent.
   */
  compact?: boolean;
  /** Optional refs the orchestrator can pass to capture renderer/scene/group/controls. */
  glRef?: React.MutableRefObject<WebGLRenderer | null>;
  sceneRef?: React.MutableRefObject<Scene | null>;
  cameraRef?: React.MutableRefObject<Camera | null>;
  groupRef?: React.MutableRefObject<Group | null>;
  controlsRef?: React.MutableRefObject<OrbitControlsImpl | null>;
};

export function tintBackground(tone: string) {
  const paper = new Color("#fbf6ec");
  const accent = new Color(tone);
  return paper.lerp(accent, 0.18).getStyle();
}

const noopGlRef = { current: null } as React.MutableRefObject<WebGLRenderer | null>;
const noopSceneRef = { current: null } as React.MutableRefObject<Scene | null>;

export function BrainSceneInner({
  region,
  activeSubstructure,
  viewMode,
  clipOrientation,
  clipOffset,
  autoRotate,
  resetKey,
  imagingTone,
  imagingMode,
  compact = false,
  glRef,
  sceneRef,
  cameraRef,
  groupRef,
  controlsRef,
}: BrainSceneInnerProps) {
  const localGroupRef = useRef<Group | null>(null);
  const groupRefToUse = groupRef ?? localGroupRef;
  const localControlsRef = useRef<OrbitControlsImpl | null>(null);
  const controlsRefToUse = controlsRef ?? localControlsRef;
  const clipEnabled = clipOrientation !== "off";

  useEffect(() => {
    applyClipPose(clipOrientation, clipOffset);
  }, [clipOrientation, clipOffset]);

  return (
    <>
      <color attach="background" args={[tintBackground(imagingTone)]} />
      <ambientLight intensity={0.78} />
      <directionalLight
        position={[3.2, 4.4, 3.8]}
        intensity={1.1}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      <directionalLight position={[-3.2, 2.4, -2.8]} intensity={0.42} />
      <CaptureContext
        glRef={glRef ?? noopGlRef}
        sceneRef={sceneRef ?? noopSceneRef}
        cameraRef={cameraRef}
      />
      <CameraRig region={region} activeSubstructure={activeSubstructure} />
      <Suspense fallback={null}>
        <AutoSpinRig
          enabled={autoRotate && !clipEnabled}
          resetKey={resetKey}
          groupRef={groupRefToUse}
        >
          <BrainAssembly
            region={region}
            activeSubstructure={activeSubstructure}
            viewMode={viewMode}
            clipEnabled={clipEnabled}
            imagingMode={imagingMode}
          />
        </AutoSpinRig>
      </Suspense>
      {compact ? null : (
        <EffectComposer autoClear={false} multisampling={4}>
          <Bloom
            intensity={0.55}
            luminanceThreshold={0.78}
            luminanceSmoothing={0.22}
            kernelSize={KernelSize.MEDIUM}
            mipmapBlur
          />
        </EffectComposer>
      )}
      <ContactShadows
        position={[0, -1.05, 0]}
        opacity={0.34}
        blur={2.1}
        far={3.2}
        scale={6}
        color={imagingTone}
      />
      {compact ? null : (
        <OrbitControls
          ref={controlsRefToUse as React.RefObject<OrbitControlsImpl>}
          makeDefault
          enablePan={false}
          enableDamping
          dampingFactor={0.08}
          minDistance={2.0}
          maxDistance={6.6}
          target={[0, 0.05, 0]}
        />
      )}
    </>
  );
}
