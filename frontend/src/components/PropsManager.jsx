import React, { useMemo, useEffect, useState } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { interactionEngine } from '../engine/InteractionEngine.js';

const PACK_PATH = '/models/astronaut/space_sci_fi_pack.glb';

/**
 * Normalizes an extracted GLTF node into a standalone, centered, scaled wrapper group.
 * Guarantees local bounds:
 * - base is anchored flat at local y = 0 (or centered for spheres)
 * - X and Z are centered at 0
 * - Height matches targetHeight
 * - matrixAutoUpdate is disabled and userData.isStatic = true (100% STATIC ZERO FLOATING)
 */
function createStaticNormalizedProp(sourceNode, targetHeight, centerVertically = false) {
  if (!sourceNode) return null;

  const clone = sourceNode.clone(true);
  clone.position.set(0, 0, 0);

  // Compute unscaled local bounding box
  const box = new THREE.Box3().setFromObject(clone);
  const size = new THREE.Vector3();
  box.getSize(size);
  const center = new THREE.Vector3();
  box.getCenter(center);

  const wrapper = new THREE.Group();
  const currentHeight = size.y || 1;
  const scale = targetHeight ? (targetHeight / currentHeight) : 1;

  // Center horizontally, and anchor bottom to y=0 (or center vertically for sphere)
  clone.position.x = -center.x;
  clone.position.y = centerVertically ? -center.y : -box.min.y;
  clone.position.z = -center.z;

  wrapper.add(clone);
  wrapper.scale.setScalar(scale);

  // Force strict static props: ZERO FLOATING, NO ANIMATIONS, STATIC MATRICES
  wrapper.traverse((child) => {
    if (child.isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
      child.userData.isStatic = true;
      child.matrixAutoUpdate = false;
      if (child.material) {
        child.material = child.material.clone();
        child.material.needsUpdate = true;
      }
      child.updateMatrix();
    }
  });

  wrapper.userData.isStatic = true;
  wrapper.matrixAutoUpdate = false;
  wrapper.updateMatrix();

  return wrapper;
}

/**
 * PropsManager
 * 
 * Decouples and manages all static world props extracted from space_sci_fi_pack.glb.
 * MANDATORY: All props are unparented from the astronaut and live in the world scene.
 * Props are placed at dedicated corner stations keeping central walkway (X: -0.8 to +0.8) clear:
 * - Station 1: Flight Operations (Front Left Wall): Black Pedestal + Tactical Laptop at [-1.6, 0.81, -0.4]
 * - Station 2: Diagnostic Comms (Mid Right Wall): Black Pedestal + Holographic Console at [1.6, 0.81, -1.3]
 * - Station 3: Cargo Alcove (Far Left Floor): Metallic Barrels resting flat at [-2.2, 0, -2.2]
 * - Station 4: Reactor Dock (Far Right Wall Socket): Glowing Quantum Core at [2.2, 0.75, -2.2]
 */
export default function PropsManager({ usp1Active = false, usp2Active = false }) {
  const { scene } = useGLTF(PACK_PATH);
  const [isCoreAttached, setIsCoreAttached] = useState(interactionEngine.isCoreAttached);

  useEffect(() => {
    return interactionEngine.subscribe((state) => {
      setIsCoreAttached(state.isCoreAttached);
    });
  }, []);

  const propsObjects = useMemo(() => {
    if (!scene) return null;

    // --- 1. BLACK PEDESTALS (Cube / Cube001) ---
    // Extracted and given sleek obsidian matte black metallic finish
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

    // --- 2. TACTICAL LAPTOP (computer_2) ---
    const rawLaptop = scene.getObjectByName('computer_2');
    const laptop = createStaticNormalizedProp(rawLaptop, 0.25);
    if (laptop) {
      laptop.traverse((c) => {
        if (c.isMesh) {
          c.castShadow = true;
          c.receiveShadow = true;
          c.userData.isStatic = true;
          c.matrixAutoUpdate = false;
          // Add glowing cyan screen illumination
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

    // --- 3. HOLOGRAPHIC CONSOLE (computer_1) ---
    const rawConsole = scene.getObjectByName('computer_1');
    const consoleObj = createStaticNormalizedProp(rawConsole, 0.45);
    if (consoleObj) {
      consoleObj.traverse((c) => {
        if (c.isMesh) {
          c.castShadow = true;
          c.receiveShadow = true;
          c.userData.isStatic = true;
          c.matrixAutoUpdate = false;
          // Add telemetry screens illumination
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

    // --- 4. METALLIC BARRELS (barrel_1, barrel_2, barrel_3_1) ---
    const rawBarrel1 = scene.getObjectByName('barrel_1');
    const rawBarrel2 = scene.getObjectByName('barrel_2');
    const rawBarrel3 = scene.getObjectByName('barrel_3_1') || scene.getObjectByName('barrel_3_2');

    const barrelGroup = new THREE.Group();
    barrelGroup.name = 'Station3_Barrels_Cluster';

    const b1 = createStaticNormalizedProp(rawBarrel1, 0.85);
    const b2 = createStaticNormalizedProp(rawBarrel2, 0.72);
    const b3 = createStaticNormalizedProp(rawBarrel3, 0.88);

    if (b1) {
      b1.position.set(0, 0, 0);
      barrelGroup.add(b1);
    }
    if (b2) {
      b2.position.set(0.35, 0, 0.25);
      barrelGroup.add(b2);
    }
    if (b3) {
      b3.position.set(-0.25, 0, 0.32);
      barrelGroup.add(b3);
    }

    barrelGroup.traverse((c) => {
      if (c.isMesh) {
        c.castShadow = true;
        c.receiveShadow = true;
        c.userData.isStatic = true;
        c.matrixAutoUpdate = false;
        c.updateMatrix();
      }
    });
    barrelGroup.userData.isStatic = true;
    barrelGroup.matrixAutoUpdate = false;
    barrelGroup.updateMatrix();

    // --- 5. GLOWING QUANTUM CORE (energy_sphere) ---
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

    return {
      pedestal1,
      pedestal2,
      laptop,
      consoleObj,
      barrelGroup,
      core
    };
  }, [scene]);

  if (!propsObjects) return null;

  return (
    <group name="Decoupled_Static_World_Props">
      {/* ============================================================== */}
      {/* STATION 1: Flight Operations (Front Left Wall)                 */}
      {/* - Black Pedestal at [-1.6, 0, -0.4]                             */}
      {/* - Tactical Laptop on top at [-1.6, 0.81, -0.4], rot: PI/6       */}
      {/* ============================================================== */}
      <group position={[-1.6, 0, -0.4]}>
        {propsObjects.pedestal1 && (
          <primitive object={propsObjects.pedestal1} position={[0, 0, 0]} />
        )}
        {/* Subtle LED glow accent at table base */}
        <pointLight position={[0, 0.82, 0]} color="#00f0ff" intensity={0.6} distance={1.8} decay={2} />
      </group>

      {/* USP 1 & 2 VISUALIZERS at Station 1 */}
      <group position={[-1.6, 0.81, -0.4]}>
        {/* USP 1: Payload-Rack Kinematics Reference Frame */}
        {usp1Active && (
          <group>
            <axesHelper args={[1.5]} />
            <gridHelper args={[2, 10, '#10b981', '#047857']} rotation={[Math.PI / 2, 0, 0]} />
          </group>
        )}

        {/* USP 2: Volumetric Workspace Anchor */}
        {usp2Active && (
          <mesh>
            <octahedronGeometry args={[1.5, 1]} />
            <meshBasicMaterial color="#f59e0b" wireframe transparent opacity={0.4} />
          </mesh>
        )}
      </group>

      {propsObjects.laptop && (
        <group
          position={[-1.6, 0.81, -0.4]}
          rotation={[0, Math.PI / 6, 0]}
        >
          <primitive object={propsObjects.laptop} position={[0, 0, 0]} />
        </group>
      )}

      {/* ============================================================== */}
      {/* STATION 2: Diagnostic Comms (Mid Right Wall)                   */}
      {/* - Black Pedestal at [1.6, 0, -1.3]                              */}
      {/* - Holographic Console on top at [1.6, 0.81, -1.3], rot: -PI/6   */}
      {/* ============================================================== */}
      <group position={[1.6, 0, -1.3]}>
        {propsObjects.pedestal2 && (
          <primitive object={propsObjects.pedestal2} position={[0, 0, 0]} />
        )}
        <pointLight position={[0, 0.85, 0]} color="#38bdf8" intensity={0.7} distance={1.8} decay={2} />
      </group>

      {propsObjects.consoleObj && (
        <group
          position={[1.6, 0.81, -1.3]}
          rotation={[0, -Math.PI / 6, 0]}
        >
          <primitive object={propsObjects.consoleObj} position={[0, 0, 0]} />
        </group>
      )}

      {/* ============================================================== */}
      {/* STATION 3: Cargo Alcove (Far Left Floor)                       */}
      {/* - Metallic Barrels resting flat on floor at [-2.2, 0, -2.2]     */}
      {/* ============================================================== */}
      <group position={[-2.2, 0, -2.2]}>
        {propsObjects.barrelGroup && (
          <primitive object={propsObjects.barrelGroup} position={[0, 0, 0]} />
        )}
        {/* Ambient indicator warning light */}
        <pointLight position={[0, 0.9, 0]} color="#f59e0b" intensity={0.5} distance={1.5} decay={2} />
      </group>

      {/* ============================================================== */}
      {/* STATION 4: Reactor Dock (Far Right Wall Socket)                */}
      {/* - Glowing Quantum Core mounted inside wall dock at [2.2, 0.75, -2.2] */}
      {/* ============================================================== */}
      <group position={[2.2, 0.75, -2.2]}>

        {/* Wall socket dock ring geometry */}
        <mesh position={[0.08, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.26, 0.28, 0.08, 24]} />
          <meshStandardMaterial color="#0f172a" metalness={0.9} roughness={0.2} />
        </mesh>
        <mesh position={[0.08, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <torusGeometry args={[0.26, 0.02, 16, 32]} />
          <meshBasicMaterial color="#00e5ff" />
        </mesh>

        {/* Quantum Core (rendered here if not currently attached to astronaut gauntlet) */}
        {!isCoreAttached && propsObjects.core && (
          <group position={[0, 0, 0]}>
            <primitive object={propsObjects.core} position={[0, 0, 0]} />
            <pointLight color="#00e5ff" intensity={2.2} distance={2.5} decay={2} />
          </group>
        )}
      </group>
    </group>
  );
}

useGLTF.preload(PACK_PATH);
