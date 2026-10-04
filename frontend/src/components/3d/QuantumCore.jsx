import React, { useMemo, useState, useEffect } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { createStaticNormalizedProp, PACK_PATH } from './propUtils.js';
import { automatedMissionLoop } from '../../engine/AutomatedMissionLoop.js';

/**
 * QuantumCore
 * 
 * Separately loaded Quantum Core asset and dedicated Reactor Dock Slot.
 * Secured at distinct coordinates [2.2, 0.75, -2.2] on the starboard corridor wall.
 */
export default function QuantumCore({ isCoreAttached: propIsCoreAttached }) {
  const { scene } = useGLTF(PACK_PATH);
  const [isCoreAttached, setIsCoreAttached] = useState(automatedMissionLoop.isCoreAttached);

  useEffect(() => {
    return automatedMissionLoop.subscribe((state) => {
      setIsCoreAttached(state.isCoreAttached);
    });
  }, []);

  const coreObj = useMemo(() => {
    if (!scene) return null;

    const rawCore = scene.getObjectByName('energy_sphere');
    const core = createStaticNormalizedProp(rawCore, 0.42, true);

    if (core) {
      core.traverse((c) => {
        if (c.isMesh) {
          c.castShadow = true;
          c.receiveShadow = true;
          c.userData.isStatic = true;
          c.matrixAutoUpdate = false;
          c.material = new THREE.MeshStandardMaterial({
            color: '#38bdf8',
            emissive: '#00e5ff',
            emissiveIntensity: 2.8,
            roughness: 0.1,
            metalness: 0.9,
            toneMapped: false
          });
          c.updateMatrix();
        }
      });
      core.updateMatrix();
    }

    return core;
  }, [scene]);

  const activeAttached = propIsCoreAttached !== undefined ? propIsCoreAttached : isCoreAttached;

  return (
    <group position={[2.2, 0.75, -2.2]} name="Station_4_Reactor_Slot">
      {/* Reactor Wall Socket Docking Ring Assembly */}
      <mesh position={[0.08, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.26, 0.28, 0.08, 24]} />
        <meshStandardMaterial color="#0f172a" metalness={0.9} roughness={0.2} />
      </mesh>
      <mesh position={[0.08, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <torusGeometry args={[0.26, 0.02, 16, 32]} />
        <meshBasicMaterial color="#00e5ff" />
      </mesh>

      {/* Internal Magnetic Chamber Glow */}
      <pointLight
        position={[0.02, 0, 0]}
        color="#00e5ff"
        intensity={activeAttached ? 0.4 : 2.4}
        distance={2.5}
        decay={2}
      />

      {/* Quantum Core (rendered secured in dock when not held by astronaut) */}
      {!activeAttached && coreObj && (
        <group position={[0, 0, 0]}>
          <primitive object={coreObj} position={[0, 0, 0]} />
        </group>
      )}
    </group>
  );
}

useGLTF.preload(PACK_PATH);
