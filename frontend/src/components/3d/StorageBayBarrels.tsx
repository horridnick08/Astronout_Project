import React, { useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { createStaticNormalizedProp, PACK_PATH } from './propUtils.js';

/**
 * StorageBayBarrels.tsx
 * 
 * Separately loaded cargo storage barrel assets.
 * Instantiated at far-end storage bay coordinates [-1.85, 0, -16.0],
 * maintaining strict 15m distance from the central corridor area.
 */
export default function StorageBayBarrels() {
  const { scene } = useGLTF(PACK_PATH);

  const barrels = useMemo(() => {
    if (!scene) return null;

    const rawBarrel1 = scene.getObjectByName('barrel_1');
    const rawBarrel2 = scene.getObjectByName('barrel_2');
    const rawBarrel3 = scene.getObjectByName('barrel_3_1') || scene.getObjectByName('barrel_3_2');

    const b1 = createStaticNormalizedProp(rawBarrel1, 0.88);
    const b2 = createStaticNormalizedProp(rawBarrel2, 0.74);
    const b3 = createStaticNormalizedProp(rawBarrel3, 0.92);

    return { b1, b2, b3 };
  }, [scene]);

  if (!barrels) return null;

  return (
    <group position={[-1.75, 0, -3.80]} name="Station2_Storage_Bay_Barrels">
      {/* Storage Alcove Floor Demarcation Hazard Pad */}
      <mesh position={[0, 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[1.4, 1.8]} />
        <meshStandardMaterial
          color="#0f172a"
          roughness={0.7}
          metalness={0.4}
        />
      </mesh>

      {/* BARREL 1: Primary Heavy Ribbed Cargo Drum */}
      {barrels.b1 && (
        <group position={[0, 0, -0.45]} rotation={[0, 0.35, 0]}>
          <primitive object={barrels.b1} position={[0, 0, 0]} />
        </group>
      )}

      {/* BARREL 2: Secondary Pressurized Canister */}
      {barrels.b2 && (
        <group position={[0.22, 0, 0.45]} rotation={[0, -0.85, 0]}>
          <primitive object={barrels.b2} position={[0, 0, 0]} />
        </group>
      )}

      {/* BARREL 3: Coolant Reservoir Unit */}
      {barrels.b3 && (
        <group position={[-0.25, 0, 0.15]} rotation={[0, 1.1, 0]}>
          <primitive object={barrels.b3} position={[0, 0, 0]} />
        </group>
      )}

      {/* Storage Bay Amber Safety Caution Beacon */}
      <pointLight position={[0, 1.4, 0]} color="#f59e0b" intensity={0.8} distance={3.2} decay={2} />
    </group>
  );
}

useGLTF.preload(PACK_PATH);
