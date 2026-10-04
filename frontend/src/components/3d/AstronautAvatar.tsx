import React, { useRef, useMemo, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { clone as skeletonClone } from 'three/examples/jsm/utils/SkeletonUtils.js';
import { discoverBones } from '../../engine/MocapEngine.js';
import { missionTimeline } from '../../engine/useMissionTimeline.ts';
import { zeroGKinematics } from '../../engine/useZeroGKinematics.ts';

const PACK_PATH = '/models/astronaut/space_sci_fi_pack.glb';

/**
 * Comic-style "Oops!" Speech Bubble Component
 * Floats directly above helmet when obstacle collision is avoided.
 */
function OopsSpeechBubble({ visible }: { visible: boolean }) {
  const bubbleRef = useRef<THREE.Group>(null);

  const canvasTexture = useMemo(() => {
    const c = document.createElement('canvas');
    c.width = 256;
    c.height = 128;
    const ctx = c.getContext('2d');
    if (ctx) {
      // Comic bubble background
      ctx.fillStyle = '#fef08a'; // Bright comic yellow
      ctx.strokeStyle = '#020617';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.roundRect(10, 10, 236, 108, [24]);
      ctx.fill();
      ctx.stroke();

      // Bold comic text "Oops!"
      ctx.font = '900 46px "Arial Black", Impact, sans-serif';
      ctx.fillStyle = '#dc2626'; // Comic Red
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Oops!', 128, 64);
    }
    const tex = new THREE.CanvasTexture(c);
    return tex;
  }, []);

  useFrame((state) => {
    if (!bubbleRef.current) return;
    const t = state.clock.getElapsedTime();
    if (visible) {
      // Gentle bounce & scale pop
      bubbleRef.current.scale.setScalar(THREE.MathUtils.lerp(bubbleRef.current.scale.x, 1.0, 0.2));
      bubbleRef.current.position.y = 1.95 + Math.sin(t * 8.0) * 0.04;
    } else {
      bubbleRef.current.scale.setScalar(THREE.MathUtils.lerp(bubbleRef.current.scale.x, 0.0, 0.2));
    }
  });

  return (
    <group ref={bubbleRef} position={[0, 1.95, 0]} scale={[0, 0, 0]}>
      {/* 2.5D Bubble Billboard facing camera */}
      <mesh position={[0, 0, 0]}>
        <planeGeometry args={[0.55, 0.28]} />
        <meshBasicMaterial map={canvasTexture} transparent depthWrite={false} side={THREE.DoubleSide} />
      </mesh>
      {/* Speech pointer cone toward helmet */}
      <mesh position={[0, -0.16, 0]} rotation={[0, 0, Math.PI]}>
        <coneGeometry args={[0.04, 0.08, 16]} />
        <meshBasicMaterial color="#fef08a" />
      </mesh>
    </group>
  );
}

/**
 * AstronautAvatar.tsx
 * 
 * Production-ready Rigged Character:
 * - Driven by useZeroGKinematics (mass inertia, momentum dampening, constrained IK)
 * - Coordinated by useMissionTimeline (40s autonomous mission loop)
 * - Renders dynamic "Oops!" collision avoidance bubble
 * - Attaches glowing miniature Quantum Core to gauntlet during interaction
 */
export default function AstronautAvatar({
  onBonesDiscovered
}: {
  onBonesDiscovered?: (bones: string[]) => void;
}) {
  const { scene } = useGLTF(PACK_PATH);
  const rootGroupRef = useRef<THREE.Group>(null);
  const innerModelRef = useRef<THREE.Group>(null);

  const [timelineState, setTimelineState] = useState(missionTimeline.getState());
  const [isOops, setIsOops] = useState(false);

  useEffect(() => {
    return missionTimeline.subscribe((state) => {
      setTimelineState(state);
    });
  }, []);

  // 1. ISOLATE SKELETON & SKINNED MESH
  const isolatedAstronautScene = useMemo(() => {
    if (!scene) return null;

    const cloned = skeletonClone(scene);
    const propNamesToRemove = [
      'Cube', 'Cube001',
      'computer_1', 'computer_2',
      'barrel_1', 'barrel_2', 'barrel_3_1', 'barrel_3_2',
      'energy_sphere', 'Camera', 'Light'
    ];

    const nodesToRemove: THREE.Object3D[] = [];
    cloned.traverse((node: any) => {
      if (propNamesToRemove.includes(node.name) || propNamesToRemove.some(p => node.name.startsWith(p))) {
        nodesToRemove.push(node);
      }
    });

    nodesToRemove.forEach((node) => {
      if (node.parent) {
        node.parent.remove(node);
      }
    });

    cloned.traverse((child: any) => {
      child.visible = true;
      if (child.isMesh || child.isSkinnedMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        child.frustumCulled = false;
        child.visible = true;

        if (child.material) {
          child.material = child.material.clone();
          child.material.roughness = Math.max(child.material.roughness || 0.35, 0.28);
          child.material.metalness = Math.min(child.material.metalness || 0.65, 0.85);
          child.material.side = THREE.DoubleSide; // Double-sided rendering prevents palm/glove dropouts
          child.material.depthWrite = true;
          child.material.needsUpdate = true;
        }
      }
    });

    return cloned;
  }, [scene]);

  const calibration = useMemo(() => ({
    scale: 0.165,
    baseY: 0.08
  }), []);

  const bones = useMemo(() => {
    if (!isolatedAstronautScene) return {};
    return discoverBones(isolatedAstronautScene);
  }, [isolatedAstronautScene]);

  const restEuler = useMemo(() => {
    if (!isolatedAstronautScene || !bones) return {};
    const res: Record<string, { x: number; y: number; z: number }> = {};
    Object.entries(bones).forEach(([k, b]: [string, any]) => {
      if (b) {
        res[k] = {
          x: b.rotation.x,
          y: b.rotation.y,
          z: b.rotation.z
        };
      }
    });
    return res;
  }, [bones, isolatedAstronautScene]);

  useEffect(() => {
    if (onBonesDiscovered && bones) {
      onBonesDiscovered(Object.keys(bones));
    }
  }, [bones, onBonesDiscovered]);

  // Physical Quantum Core 3D Mesh Group for Glove Attachment
  const heldCoreGroup = useMemo(() => {
    const grp = new THREE.Group();
    grp.name = 'Attached_Quantum_Core_Glove_Module';
    grp.visible = false;

    // Scale conversion: rootGroup has scale = calibration.scale (0.165),
    // so 1.0 world meter = (1.0 / 0.165) ~ 6.06 local units.
    const invScale = 1.0 / 0.165;
    const coreRadiusWorld = 0.13; // 0.13m radius (~0.26m diameter fits palm & glove fingers cleanly)
    const coreRadiusLocal = coreRadiusWorld * invScale;

    // Inner Glowing Plasma Sphere
    const sphereGeo = new THREE.SphereGeometry(coreRadiusLocal, 32, 32);
    const sphereMat = new THREE.MeshStandardMaterial({
      color: '#38bdf8',
      emissive: '#00e5ff',
      emissiveIntensity: 3.6,
      roughness: 0.08,
      metalness: 0.92,
      toneMapped: false
    });
    const sphereMesh = new THREE.Mesh(sphereGeo, sphereMat);
    sphereMesh.castShadow = true;
    grp.add(sphereMesh);

    // Inner Pulsing Core Lattice
    const innerGeo = new THREE.SphereGeometry(coreRadiusLocal * 0.55, 24, 24);
    const innerMat = new THREE.MeshBasicMaterial({
      color: '#ffffff',
      wireframe: true,
      transparent: true,
      opacity: 0.8
    });
    const innerMesh = new THREE.Mesh(innerGeo, innerMat);
    innerMesh.name = 'InnerWireframe';
    grp.add(innerMesh);

    // Gyroscopic Containment Ring 1 (Longitudinal)
    const ring1Geo = new THREE.TorusGeometry(coreRadiusLocal * 1.35, 0.025 * invScale, 16, 36);
    const ringMat = new THREE.MeshStandardMaterial({
      color: '#0369a1',
      emissive: '#00e5ff',
      emissiveIntensity: 1.5,
      metalness: 0.95,
      roughness: 0.12
    });
    const ring1Mesh = new THREE.Mesh(ring1Geo, ringMat);
    ring1Mesh.name = 'GyroRing1';
    grp.add(ring1Mesh);

    // Gyroscopic Containment Ring 2 (Equatorial)
    const ring2Geo = new THREE.TorusGeometry(coreRadiusLocal * 1.55, 0.022 * invScale, 16, 36);
    const ring2Mesh = new THREE.Mesh(ring2Geo, ringMat);
    ring2Mesh.rotation.x = Math.PI / 2;
    ring2Mesh.name = 'GyroRing2';
    grp.add(ring2Mesh);

    // Concentrated Dynamic Point Light
    const pointLight = new THREE.PointLight('#00e5ff', 3.2, 2.5 * invScale, 2);
    grp.add(pointLight);

    return grp;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (heldCoreGroup.parent) {
        heldCoreGroup.parent.remove(heldCoreGroup);
      }
    };
  }, [heldCoreGroup]);

  // Main frame loop: physics, kinematics & procedural IK
  useFrame((state, delta) => {
    if (!rootGroupRef.current) return;
    const time = state.clock.getElapsedTime();

    // 1. Update 40-second timeline state machine
    const mission = missionTimeline.update(delta);

    // 2. Update Low-G Physics & Kinematics engine
    const kin = zeroGKinematics.update(
      delta,
      mission.targetPosition,
      mission.targetYaw,
      mission.poseType,
      time,
      mission.isTransit,
      mission.hopIndex,
      mission.numHops,
      mission.hopProgress,
      mission.hopStartPos,
      mission.hopEndPos,
      mission.startPosition
    );

    setIsOops(kin.isOopsActive);

    // 3. Apply Constrained Limb IK with secondary motion & soft knee compression
    zeroGKinematics.applyConstrainedLimbIK(
      bones,
      mission.poseType,
      time,
      delta,
      restEuler,
      kin.compressionFactor,
      kin.isMoving,
      kin.hopProgress
    );

    // 4. Update Root Transform at floor proximity (0.05m to 0.15m above floor grid)
    rootGroupRef.current.position.set(
      kin.position.x,
      kin.elevationY,
      kin.position.z
    );
    rootGroupRef.current.quaternion.copy(kin.quaternion);

    // 5. Physical Mesh Attachment / Mechanical Parenting of Quantum Core
    const activeHandBone = bones.rightHand || (isolatedAstronautScene ? (
      isolatedAstronautScene.getObjectByName('wrist_R') ||
      isolatedAstronautScene.getObjectByName('hand_R') ||
      isolatedAstronautScene.getObjectByName('handR_032')
    ) : null);

    if (activeHandBone && heldCoreGroup) {
      if (mission.isCoreAttached) {
        // Mechanically parent to active hand bone
        if (heldCoreGroup.parent !== activeHandBone) {
          if (heldCoreGroup.parent) {
            heldCoreGroup.parent.remove(heldCoreGroup);
          }
          activeHandBone.add(heldCoreGroup);
        }
        heldCoreGroup.visible = true;

        // Position offset: Delta x = 0, Delta y = -0.05m, Delta z = 0.10m relative to palm matrix
        const invScale = 1.0 / calibration.scale;
        heldCoreGroup.position.set(0, -0.05 * invScale, 0.10 * invScale);

        // Gyroscopic Containment Ring Rotations
        const gyro1 = heldCoreGroup.getObjectByName('GyroRing1');
        const gyro2 = heldCoreGroup.getObjectByName('GyroRing2');
        const inner = heldCoreGroup.getObjectByName('InnerWireframe');
        if (gyro1) {
          gyro1.rotation.y = time * 2.5;
          gyro1.rotation.z = time * 1.2;
        }
        if (gyro2) {
          gyro2.rotation.x = time * 1.8 + Math.PI / 2;
          gyro2.rotation.z = -time * 1.4;
        }
        if (inner) {
          inner.rotation.y = -time * 3.0;
        }
      } else {
        // Release / Place Mechanics: Unparent and return to pedestal socket
        if (heldCoreGroup.parent === activeHandBone) {
          activeHandBone.remove(heldCoreGroup);
        }
        heldCoreGroup.visible = false;
      }
    }
  });

  if (!isolatedAstronautScene) return null;

  return (
    <group
      ref={rootGroupRef}
      scale={[calibration.scale, calibration.scale, calibration.scale]}
      name="Astronaut_Rig_Character"
    >
      <primitive
        ref={innerModelRef}
        object={isolatedAstronautScene}
        position={[0, 0, 0]}
      />

      {/* Floating "Oops!" Speech Bubble above helmet on obstacle collision avoidance */}
      <group position={[0, 1.95 / calibration.scale, 0]} scale={[1.0 / calibration.scale, 1.0 / calibration.scale, 1.0 / calibration.scale]}>
        <OopsSpeechBubble visible={isOops} />
      </group>
    </group>
  );
}

useGLTF.preload(PACK_PATH);
