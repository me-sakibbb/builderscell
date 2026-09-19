"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { useGLTF } from "@react-three/drei";

/**
 * Loads a GLB, clones it, and scales it so its largest dimension equals
 * `size`, centred on the origin with its base at y = 0.
 */
export function FitModel({
  url,
  size = 1,
  tint,
  ...group
}: { url: string; size?: number; tint?: (m: THREE.MeshStandardMaterial) => void } & React.ComponentProps<"group">) {
  const { scene } = useGLTF(url);

  const { object, scale, offset } = useMemo(() => {
    const object = scene.clone(true);
    object.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (!mesh.isMesh) return;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      if (tint) {
        const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        const cloned = mats.map((m) => {
          const c = (m as THREE.MeshStandardMaterial).clone();
          tint(c);
          return c;
        });
        mesh.material = Array.isArray(mesh.material) ? cloned : cloned[0];
      }
    });
    const box = new THREE.Box3().setFromObject(object);
    const dims = box.getSize(new THREE.Vector3());
    const scale = size / Math.max(dims.x, dims.y, dims.z);
    const center = box.getCenter(new THREE.Vector3());
    const offset = new THREE.Vector3(-center.x, -box.min.y, -center.z);
    return { object, scale, offset };
  }, [scene, size, tint]);

  return (
    <group {...group}>
      <group scale={scale}>
        <primitive object={object} position={offset} />
      </group>
    </group>
  );
}

useGLTF.preload("/models/uno.glb");
useGLTF.preload("/models/board.glb");
useGLTF.preload("/models/battery.glb");
