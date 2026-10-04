import React, { useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { createStaticNormalizedProp, PACK_PATH } from './propUtils.js';

/**
 * StorageBarrels
 * 
 * Separately loaded cargo storage barrel assets.
 * Each barrel is loaded as an independent entity and placed at distinct,
 * individual coordinates along the storage bay wall.
 */
export default function StorageBarrels() {
  const { scene } = useGLTF(PACK_PATH);

  const barrelProps = useMemo(() => {
    if (!scene) return null;

    const rawBarrel1 = scene.getObjectByName('barrel_1');
    const rawBarrel2 = scene.getObjectByName('barrel_2');
    const rawBarrel3 = scene.getObjectByName('barrel_3_1') || scene.getObjectByName('barrel_3_2');

    const barrel1 = createStaticNormalizedProp(rawBarrel1, 0.85);
    const barrel2 = createStaticNormalizedProp(rawBarrel2, 0.72);
    const barrel3 = createStaticNormalizedProp(rawBarrel3, 0.88);

    return { barrel1, barrel2, barrel3 };
  }, [scene]);

  if (!barrelProps) return null;

  return (
    <group name="Storage_Bay_Barrels_Separated">
      {/* BARREL 1: Heavy Primary Cargo Drum at distinct coordinate [-2.15, 0, -3.2] */}
      {barrelProps.barrel1 && (
        <group position={[-2.15, 0, -3.2]} rotation={[0, 0.4, 0]}>
          <primitive object={barrelProps.barrel1} position={[0, 0, 0]} />
        </group>
      )}

      {/* BARREL 2: Secondary Ribbed Canister at distinct coordinate [-2.05, 0, -4.0] */}
      {barrelProps.barrel2 && (
        <group position={[-2.05, 0, -4.0]} rotation={[0, -0.6, 0]}>
          <primitive object={barrelProps.barrel2} position={[0, 0, 0]} />
        </group>
      )}

      {/* BARREL 3: Auxiliary Pressurized Container at distinct coordinate [-2.15, 0, -2.4] */}
      {barrelProps.barrel3 && (
        <group position={[-2.15, 0, -2.4]} rotation={[0, 1.2, 0]}>
          <primitive object={barrelProps.barrel3} position={[0, 0, 0]} />
        </group>
      )}

      {/* Storage Bay Safety Amber Warning Beacon */}
      <pointLight position={[-2.1, 1.2, -3.2]} color="#f59e0b" intensity={0.65} distance={2.5} decay={2} />
    </group>
  );
}

useGLTF.preload(PACK_PATH);
