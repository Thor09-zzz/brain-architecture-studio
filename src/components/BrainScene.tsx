import { Canvas } from "@react-three/fiber";
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter.js";
import { forwardRef, useImperativeHandle, useRef } from "react";
import { Camera, Group, Scene, Vector3, WebGLRenderer } from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import type { RegionItem, ViewMode } from "../data/regions";
import { BrainSceneInner } from "./BrainSceneInner";
import type { ClipOrientation, ImagingMode } from "./brain/materials";

type BrainSceneProps = {
  region: RegionItem;
  activeSubstructure: string;
  viewMode: ViewMode;
  clipOrientation: ClipOrientation;
  clipOffset: number;
  autoRotate: boolean;
  resetKey: number;
  imagingTone: string;
  imagingMode: ImagingMode;
};

const DEFAULT_CAMERA_POSITION = new Vector3(4.9, 2.8, 6.5);
const DEFAULT_CAMERA_TARGET = new Vector3(0, 0.05, 0.1);

export type BrainSceneHandle = {
  resetView: () => void;
  screenshot: () => string | null;
  exportGLB: () => Promise<ArrayBuffer | null>;
};

export const BrainScene = forwardRef<BrainSceneHandle, BrainSceneProps>(function BrainScene(
  props,
  ref,
) {
  const controlsRef = useRef<OrbitControlsImpl | null>(null);
  const groupRef = useRef<Group | null>(null);
  const glRef = useRef<WebGLRenderer | null>(null);
  const sceneRef = useRef<Scene | null>(null);
  const cameraRef = useRef<Camera | null>(null);

  useImperativeHandle(
    ref,
    () => ({
      resetView: () => {
        controlsRef.current?.reset();
        if (cameraRef.current) {
          cameraRef.current.position.copy(DEFAULT_CAMERA_POSITION);
          cameraRef.current.lookAt(DEFAULT_CAMERA_TARGET);
        }
        if (controlsRef.current) {
          controlsRef.current.target.copy(DEFAULT_CAMERA_TARGET);
          controlsRef.current.update();
        }
        if (groupRef.current) {
          groupRef.current.rotation.set(0, 0, 0);
        }
      },
      screenshot: () => {
        const gl = glRef.current;
        const scene = sceneRef.current;
        const camera = cameraRef.current;
        if (!gl || !scene || !camera) {
          return null;
        }
        gl.render(scene, gl.xr.isPresenting ? gl.xr.getCamera() : camera);
        return gl.domElement.toDataURL("image/png");
      },
      exportGLB: () =>
        new Promise<ArrayBuffer | null>((resolve) => {
          const target = groupRef.current;
          if (!target) {
            resolve(null);
            return;
          }
          const exporter = new GLTFExporter();
          exporter.parse(
            target,
            (result) => {
              if (result instanceof ArrayBuffer) {
                resolve(result);
              } else {
                resolve(null);
              }
            },
            (error) => {
              console.error("GLB export failed", error);
              resolve(null);
            },
            { binary: true },
          );
        }),
    }),
    [],
  );

  return (
    <Canvas
      shadows
      camera={{ position: DEFAULT_CAMERA_POSITION.toArray(), fov: 38 }}
      gl={{ antialias: true, preserveDrawingBuffer: true }}
      dpr={[1, 1.8]}
    >
      <BrainSceneInner
        {...props}
        glRef={glRef}
        sceneRef={sceneRef}
        cameraRef={cameraRef}
        groupRef={groupRef}
        controlsRef={controlsRef}
      />
    </Canvas>
  );
});
