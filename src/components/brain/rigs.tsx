import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import { Group, Scene, Vector3, WebGLRenderer } from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import type { RegionItem } from "../../data/regions";

export function CaptureContext({
  glRef,
  sceneRef,
  cameraRef,
}: {
  glRef: React.MutableRefObject<WebGLRenderer | null>;
  sceneRef: React.MutableRefObject<Scene | null>;
  cameraRef?: React.MutableRefObject<import("three").Camera | null>;
}) {
  const { gl, scene, camera } = useThree();
  useEffect(() => {
    glRef.current = gl;
    sceneRef.current = scene;
    if (cameraRef) {
      cameraRef.current = camera;
    }
    gl.localClippingEnabled = true;
  }, [gl, scene, camera, glRef, sceneRef, cameraRef]);
  return null;
}

export function CameraRig({
  region,
  activeSubstructure,
}: {
  region: RegionItem;
  activeSubstructure: string;
}) {
  const camera = useThree((state) => state.camera);
  const controls = useThree((state) => state.controls) as OrbitControlsImpl | null;
  const pose = useMemo(() => {
    const sub = region.substructures.find((s) => s.id === activeSubstructure);
    return sub?.camera ?? region.camera;
  }, [region, activeSubstructure]);
  const targetPos = useMemo(() => new Vector3(...pose.position), [pose]);
  const targetLook = useMemo(() => new Vector3(...pose.target), [pose]);
  const animatingRef = useRef(false);

  useEffect(() => {
    animatingRef.current = true;
  }, [region.id, activeSubstructure]);

  useFrame(() => {
    if (!animatingRef.current) {
      return;
    }
    camera.position.lerp(targetPos, 0.08);
    if (controls) {
      controls.target.lerp(targetLook, 0.08);
      controls.update();
    } else {
      camera.lookAt(targetLook);
    }
    if (camera.position.distanceToSquared(targetPos) < 0.0025) {
      animatingRef.current = false;
    }
  });

  return null;
}

export function AutoSpinRig({
  enabled,
  resetKey,
  groupRef,
  children,
}: {
  enabled: boolean;
  resetKey: number;
  groupRef: React.MutableRefObject<Group | null>;
  children: React.ReactNode;
}) {
  useFrame((_, delta) => {
    if (!groupRef.current) {
      return;
    }
    if (enabled) {
      groupRef.current.rotation.y += delta * 0.18;
    }
  });
  return (
    <group
      key={resetKey}
      ref={(node) => {
        groupRef.current = node;
      }}
    >
      {children}
    </group>
  );
}
