import React, { useEffect } from 'react';
import { useGLTF } from '@react-three/drei';

const MODEL_PATH = '/models/spaceship/spacecorridor_BY_HN.glb';

export default function SpaceshipEnvironment() {
  const { scene } = useGLTF(MODEL_PATH);

  useEffect(() => {
    if (!scene) return;
    scene.traverse((child) => {
      if (child.isMesh) {
        child.receiveShadow = true;
      }
    });
  }, [scene]);

  return (
    <primitive
      object={scene}
      scale={[1, 1, 1]}
      position={[0, 0, 0]}
    />
  );
}

useGLTF.preload(MODEL_PATH);
