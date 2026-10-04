import React, { useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { createStaticNormalizedProp, PACK_PATH } from './propUtils.js';

/**
 * Workstations
 * 
 * Separately loaded Flight Operations desk (Laptop) and Comms Mainframe (Console).
 * Station 1: Flight Ops Desk at [-1.6, 0, -0.4]
 * Station 2: Comms Mainframe at [1.6, 0, -1.3]
 */
export default function Workstations() {
  const { scene } = useGLTF(PACK_PATH);

  const workstationProps = useMemo(() => {
    if (!scene) return null;

    // 1. BLACK PEDESTALS
    const rawPedestal = scene.getObjectByName('Cube') || scene.getObjectByName('Cube001');
    const pedestal1 = createStaticNormalizedProp(rawPedestal, 0.80);
    const pedestal2 = createStaticNormalizedProp(rawPedestal, 0.80);

    const applyBlackPedestalMaterial = (wrapper) => {
      if (!wrapper) return;
      wrapper.traverse((c) => {
        if (c.isMesh) {
          c.material = new THREE.MeshStandardMaterial({
            color: '#090d16',
            metalness: 0.85,
            roughness: 0.28,
            envMapIntensity: 1.2
          });
          c.castShadow = true;
          c.receiveShadow = true;
          c.userData.isStatic = true;
          c.matrixAutoUpdate = false;
          c.updateMatrix();
        }
      });
      wrapper.updateMatrix();
    };

    applyBlackPedestalMaterial(pedestal1);
    applyBlackPedestalMaterial(pedestal2);

    // 2. TACTICAL LAPTOP (computer_2)
    const rawLaptop = scene.getObjectByName('computer_2');
    const laptop = createStaticNormalizedProp(rawLaptop, 0.25);
    if (laptop) {
      laptop.traverse((c) => {
        if (c.isMesh) {
          c.castShadow = true;
          c.receiveShadow = true;
          c.userData.isStatic = true;
          c.matrixAutoUpdate = false;
          if (c.name.includes('screen') || c.material?.name?.includes('screen')) {
            c.material = new THREE.MeshStandardMaterial({
              color: '#00f0ff',
              emissive: '#00f0ff',
              emissiveIntensity: 2.2,
              roughness: 0.2,
              metalness: 0.5
            });
          }
          c.updateMatrix();
        }
      });
      laptop.updateMatrix();
    }

    // 3. HOLOGRAPHIC CONSOLE (computer_1)
    const rawConsole = scene.getObjectByName('computer_1');
    const consoleObj = createStaticNormalizedProp(rawConsole, 0.45);
    if (consoleObj) {
      consoleObj.traverse((c) => {
        if (c.isMesh) {
          c.castShadow = true;
          c.receiveShadow = true;
          c.userData.isStatic = true;
          c.matrixAutoUpdate = false;
          if (c.name.includes('display') || c.material?.name?.includes('display')) {
            c.material = new THREE.MeshStandardMaterial({
              color: '#38bdf8',
              emissive: '#0284c7',
              emissiveIntensity: 2.0,
              roughness: 0.25,
              metalness: 0.6
            });
          }
          c.updateMatrix();
        }
      });
      consoleObj.updateMatrix();
    }

    return { pedestal1, pedestal2, laptop, consoleObj };
  }, [scene]);

  if (!workstationProps) return null;

  return (
    <group name="Separated_Workstations">
      {/* STATION 1: Flight Operations (Front Left Wall) */}
      <group position={[-1.6, 0, -0.4]}>
        {workstationProps.pedestal1 && (
          <primitive object={workstationProps.pedestal1} position={[0, 0, 0]} />
        )}
        <pointLight position={[0, 0.82, 0]} color="#00f0ff" intensity={0.6} distance={1.8} decay={2} />
      </group>

      {workstationProps.laptop && (
        <group position={[-1.6, 0.81, -0.4]} rotation={[0, Math.PI / 6, 0]}>
          <primitive object={workstationProps.laptop} position={[0, 0, 0]} />
        </group>
      )}

      {/* STATION 2: Diagnostic Comms (Mid Right Wall) */}
      <group position={[1.6, 0, -1.3]}>
        {workstationProps.pedestal2 && (
          <primitive object={workstationProps.pedestal2} position={[0, 0, 0]} />
        )}
        <pointLight position={[0, 0.85, 0]} color="#38bdf8" intensity={0.7} distance={1.8} decay={2} />
      </group>

      {workstationProps.consoleObj && (
        <group position={[1.6, 0.81, -1.3]} rotation={[0, -Math.PI / 6, 0]}>
          <primitive object={workstationProps.consoleObj} position={[0, 0, 0]} />
        </group>
      )}
    </group>
  );
}

useGLTF.preload(PACK_PATH);
