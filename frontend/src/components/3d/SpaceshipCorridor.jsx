import React, { useEffect, useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';

const CORRIDOR_PATH = '/models/spaceship/corridor.glb';

/**
 * SpaceshipCorridor
 * 
 * Static background room shell for the spaceship corridor.
 * Loads /models/spaceship/corridor.glb, configures PBR materials,
 * enforces cast/receive shadows, and sets matrixAutoUpdate = false
 * to guarantee optimal rendering performance and zero unnecessary recalculations.
 */
export default function SpaceshipCorridor() {
  const { scene } = useGLTF(CORRIDOR_PATH);

  // Clone scene so multiple instances or hot-reloads remain pristine
  const corridorScene = useMemo(() => {
    if (!scene) return null;
    const cloned = scene.clone(true);

    cloned.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        child.userData.isStatic = true;
        child.matrixAutoUpdate = false;

        if (child.material) {
          // Enhance PBR metallic/roughness properties
          child.material.roughness = Math.max(child.material.roughness || 0.35, 0.25);
          child.material.metalness = Math.min(child.material.metalness || 0.65, 0.85);
          child.material.needsUpdate = true;
        }
        child.updateMatrix();
      }
    });

    cloned.userData.isStatic = true;
    cloned.matrixAutoUpdate = false;
    cloned.updateMatrix();

    return cloned;
  }, [scene]);

  if (!corridorScene) return null;

  return (
    <primitive
      object={corridorScene}
      position={[0, 0, 0]}
      scale={[1, 1, 1]}
    />
  );
}

useGLTF.preload(CORRIDOR_PATH);
