import React, { useRef, useEffect, useMemo, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { clone as skeletonClone } from 'three/examples/jsm/utils/SkeletonUtils.js';
import {
  discoverBones,
  captureRestPose,
  applyKinematics,
  blendToRestPose,
  computeRootTranslation,
  resetBaselineHip
} from '../engine/MocapEngine.js';
import { automatedMissionLoop } from '../engine/AutomatedMissionLoop.js';

const PACK_PATH = '/models/astronaut/space_sci_fi_pack.glb';

/**
 * Astronaut
 * 
 * Production-ready Rigged Astronaut Character:
 * - Executes automated 30-40s mission loop across 12 distinct steps
 * - Procedural bone kinematics for floating, window observation, laptop & console typing,
 *   barrel inspection, grabbing/placing quantum core, and communicating with Edge AI
 * - Retains isolated SkinnedMesh and skeleton bindings (Props live in independent world modules)
 * - Calibrated scale (0.165) for 3.0m spaceship corridor
 */
export default function Astronaut({
  locomotion = {
    position: new THREE.Vector3(0, 0, 0),
    rotationY: 0,
    isMoving: false,
    speed: 0
  },
  landmarks = [],
  isLiveMocap = false,
  lerpFactor = 0.25,
  zeroGIntensity = 1.0,
  onBonesDiscovered = null
}) {
  const { scene } = useGLTF(PACK_PATH);
  const rootGroupRef = useRef();
  const innerModelRef = useRef();
  const targetPosRef = useRef(new THREE.Vector3(0, 0, 0));
  const currentRotationYRef = useRef(0);

  // Automated mission loop state
  const [missionState, setMissionState] = useState(automatedMissionLoop.getState());

  useEffect(() => {
    return automatedMissionLoop.subscribe((state) => {
      setMissionState(state);
    });
  }, []);

  // 1. ISOLATE RIGGED ASTRONAUT SUIT & SKELETON
  const isolatedAstronautScene = useMemo(() => {
    if (!scene) return null;

    const cloned = skeletonClone(scene);
    const propNamesToRemove = [
      'Cube', 'Cube001',
      'computer_1', 'computer_2',
      'barrel_1', 'barrel_2', 'barrel_3_1', 'barrel_3_2',
      'energy_sphere', 'Camera', 'Light'
    ];

    const nodesToRemove = [];
    cloned.traverse((node) => {
      if (propNamesToRemove.includes(node.name) || propNamesToRemove.some(p => node.name.startsWith(p))) {
        nodesToRemove.push(node);
      }
    });

    nodesToRemove.forEach((node) => {
      if (node.parent) {
        node.parent.remove(node);
      }
    });

    cloned.traverse((child) => {
      if (child.isMesh || child.isSkinnedMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        child.frustumCulled = false;

        if (child.material) {
          child.material = child.material.clone();
          child.material.roughness = Math.max(child.material.roughness || 0.35, 0.28);
          child.material.metalness = Math.min(child.material.metalness || 0.65, 0.85);
          child.material.needsUpdate = true;
        }
      }
    });

    return cloned;
  }, [scene]);

  const calibration = useMemo(() => ({
    scale: 0.165,
    baseY: 0.05
  }), []);

  const bones = useMemo(() => {
    if (!isolatedAstronautScene) return {};
    return discoverBones(isolatedAstronautScene);
  }, [isolatedAstronautScene]);

  useEffect(() => {
    if (onBonesDiscovered && bones) {
      onBonesDiscovered(Object.keys(bones));
    }
  }, [bones, onBonesDiscovered]);

  const restPose = useMemo(() => {
    if (!isolatedAstronautScene || !bones) return {};
    return captureRestPose(bones, isolatedAstronautScene);
  }, [bones, isolatedAstronautScene]);

  const restEuler = useMemo(() => {
    if (!isolatedAstronautScene || !bones) return {};
    const res = {};
    Object.entries(bones).forEach(([k, b]) => {
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
    if (isLiveMocap) {
      resetBaselineHip();
    }
  }, [isLiveMocap]);

  const targetQuat = useMemo(() => new THREE.Quaternion(), []);
  const targetEuler = useMemo(() => new THREE.Euler(0, 0, 0, 'YXZ'), []);

  const blendStateRef = useRef({
    mocapBlend: 0.0
  });

  // Main animation frame loop
  useFrame((state, delta) => {
    if (!rootGroupRef.current) return;
    const time = state.clock.getElapsedTime();
    const bs = blendStateRef.current;

    // Active position and rotation from locomotion / mission loop
    const activePos = locomotion.position;
    currentRotationYRef.current = locomotion.rotationY;

    // Mocap blending transition
    const targetMocapBlend = isLiveMocap ? 1.0 : 0.0;
    bs.mocapBlend = THREE.MathUtils.lerp(bs.mocapBlend, targetMocapBlend, Math.min(1.0, delta * 6.0));

    // Micro Zero-G vertical float: position.y = baseY + Math.sin(time * 1.0) * 0.03
    const microZeroGFloat = Math.sin(time * 1.0) * 0.03 * zeroGIntensity;

    // PROCEDURAL BONE KINEMATICS FOR 12-STEP MISSION LOOP
    if (!isLiveMocap) {
      const head = bones.head;
      const spine = bones.spine || bones.chest;
      const leftArm = bones.leftUpperArm;
      const rightArm = bones.rightUpperArm;
      const leftLowerArm = bones.leftLowerArm;
      const rightLowerArm = bones.rightLowerArm;
      const leftHand = bones.leftHand;
      const rightHand = bones.rightHand;
      const leftLeg = bones.leftThigh;
      const rightLeg = bones.rightThigh;

      // Base weightless zero-g breathing & palm float
      if (spine) {
        const baseSpineX = restEuler.spine ? restEuler.spine.x : 0;
        spine.rotation.x = baseSpineX + Math.sin(time * 1.0) * 0.02;
      }
      if (leftHand) {
        const baseHandX = restEuler.leftHand ? restEuler.leftHand.x : 0;
        leftHand.rotation.x = baseHandX + Math.sin(time * 1.4) * 0.06;
      }
      if (rightHand) {
        const baseHandX = restEuler.rightHand ? restEuler.rightHand.x : 0;
        rightHand.rotation.x = baseHandX + Math.cos(time * 1.4) * 0.06;
      }

      // Subtle leg drift (weightless, strictly clamped)
      if (leftLeg) {
        const baseLeftLegZ = restEuler.leftThigh ? restEuler.leftThigh.z : 0;
        leftLeg.rotation.z = baseLeftLegZ + Math.sin(time * 0.7) * 0.015;
      }
      if (rightLeg) {
        const baseRightLegZ = restEuler.rightThigh ? restEuler.rightThigh.z : 0;
        rightLeg.rotation.z = baseRightLegZ - Math.sin(time * 0.7) * 0.015;
      }

      // Task-specific kinematics based on active loop step poseType:
      const pose = automatedMissionLoop.currentStep?.poseType || missionState.poseType || 'FLOAT_BACKWARDS';

      if (pose === 'FLOAT_BACKWARDS') {
        // Step 1: Arms float gently outwards, body leans back slightly
        if (head) {
          head.rotation.x = THREE.MathUtils.lerp(head.rotation.x, -0.05, delta * 3.0);
          head.rotation.y = THREE.MathUtils.lerp(head.rotation.y, Math.sin(time * 0.6) * 0.05, delta * 3.0);
        }
        if (leftArm) leftArm.rotation.z = THREE.MathUtils.lerp(leftArm.rotation.z, -0.28, delta * 3.0);
        if (rightArm) rightArm.rotation.z = THREE.MathUtils.lerp(rightArm.rotation.z, 0.28, delta * 3.0);
        if (leftArm) leftArm.rotation.x = THREE.MathUtils.lerp(leftArm.rotation.x, 0.1, delta * 3.0);
        if (rightArm) rightArm.rotation.x = THREE.MathUtils.lerp(rightArm.rotation.x, 0.1, delta * 3.0);
      } else if (pose === 'LOOK_OUT_WINDOW_1' || pose === 'LOOK_WINDOW_BRIEF') {
        // Step 2 & 8: Head tilts up and right/left to observe cosmos outside window
        if (head) {
          head.rotation.x = THREE.MathUtils.lerp(head.rotation.x, 0.18, delta * 4.0);
          head.rotation.y = THREE.MathUtils.lerp(head.rotation.y, -0.25, delta * 4.0);
        }
        if (rightArm) {
          rightArm.rotation.x = THREE.MathUtils.lerp(rightArm.rotation.x, -0.4, delta * 3.0);
          rightArm.rotation.z = THREE.MathUtils.lerp(rightArm.rotation.z, 0.2, delta * 3.0);
        }
        if (leftArm) {
          leftArm.rotation.x = THREE.MathUtils.lerp(leftArm.rotation.x, -0.15, delta * 3.0);
        }
      } else if (pose === 'LOOK_OUT_WINDOW_2') {
        // Step 3: Deep space observation window gazing
        if (head) {
          head.rotation.x = THREE.MathUtils.lerp(head.rotation.x, 0.12, delta * 4.0);
          head.rotation.y = THREE.MathUtils.lerp(head.rotation.y, -0.3 + Math.sin(time * 0.8) * 0.08, delta * 3.0);
        }
        if (rightArm) rightArm.rotation.x = THREE.MathUtils.lerp(rightArm.rotation.x, -0.2, delta * 3.0);
        if (leftArm) leftArm.rotation.x = THREE.MathUtils.lerp(leftArm.rotation.x, -0.2, delta * 3.0);
      } else if (pose === 'TYPE_LAPTOP') {
        // Step 4: Extends arms forward, typing motion on Tactical Laptop
        const typeOscR = Math.sin(time * 9.0) * 0.04;
        const typeOscL = Math.cos(time * 8.5) * 0.03;
        if (head) {
          head.rotation.x = THREE.MathUtils.lerp(head.rotation.x, -0.22, delta * 4.0);
          head.rotation.y = THREE.MathUtils.lerp(head.rotation.y, 0.0, delta * 4.0);
        }
        if (rightArm) {
          rightArm.rotation.x = THREE.MathUtils.lerp(rightArm.rotation.x, -0.75 + typeOscR, delta * 5.0);
          rightArm.rotation.z = THREE.MathUtils.lerp(rightArm.rotation.z, -0.2, delta * 5.0);
        }
        if (rightLowerArm) rightLowerArm.rotation.x = THREE.MathUtils.lerp(rightLowerArm.rotation.x, -0.65, delta * 5.0);
        if (leftArm) {
          leftArm.rotation.x = THREE.MathUtils.lerp(leftArm.rotation.x, -0.68 + typeOscL, delta * 5.0);
          leftArm.rotation.z = THREE.MathUtils.lerp(leftArm.rotation.z, 0.2, delta * 5.0);
        }
        if (leftLowerArm) leftLowerArm.rotation.x = THREE.MathUtils.lerp(leftLowerArm.rotation.x, -0.60, delta * 5.0);
      } else if (pose === 'TYPE_CONSOLE') {
        // Step 5: Operates holographic comms console with dual gauntlets
        const dialOsc = Math.sin(time * 5.0) * 0.05;
        const slideOsc = Math.cos(time * 4.5) * 0.04;
        if (head) {
          head.rotation.x = THREE.MathUtils.lerp(head.rotation.x, -0.15, delta * 4.0);
        }
        if (rightArm) {
          rightArm.rotation.x = THREE.MathUtils.lerp(rightArm.rotation.x, -0.82 + dialOsc, delta * 5.0);
          rightArm.rotation.y = THREE.MathUtils.lerp(rightArm.rotation.y, 0.2, delta * 5.0);
        }
        if (rightLowerArm) rightLowerArm.rotation.x = THREE.MathUtils.lerp(rightLowerArm.rotation.x, -0.45, delta * 5.0);
        if (leftArm) {
          leftArm.rotation.x = THREE.MathUtils.lerp(leftArm.rotation.x, -0.72 + slideOsc, delta * 5.0);
          leftArm.rotation.y = THREE.MathUtils.lerp(leftArm.rotation.y, -0.18, delta * 5.0);
        }
        if (leftLowerArm) leftLowerArm.rotation.x = THREE.MathUtils.lerp(leftLowerArm.rotation.x, -0.45, delta * 5.0);
      } else if (pose === 'LOOK_AHEAD') {
        // Step 6: Turns and looks straight down the aisle
        if (head) {
          head.rotation.x = THREE.MathUtils.lerp(head.rotation.x, 0.0, delta * 3.0);
          head.rotation.y = THREE.MathUtils.lerp(head.rotation.y, Math.sin(time * 0.5) * 0.1, delta * 3.0);
        }
        if (rightArm) {
          rightArm.rotation.x = THREE.MathUtils.lerp(rightArm.rotation.x, -0.1, delta * 3.0);
          rightArm.rotation.y = THREE.MathUtils.lerp(rightArm.rotation.y, 0.0, delta * 3.0);
          rightArm.rotation.z = THREE.MathUtils.lerp(rightArm.rotation.z, 0.2, delta * 3.0);
        }
        if (leftArm) {
          leftArm.rotation.x = THREE.MathUtils.lerp(leftArm.rotation.x, -0.1, delta * 3.0);
          leftArm.rotation.y = THREE.MathUtils.lerp(leftArm.rotation.y, 0.0, delta * 3.0);
          leftArm.rotation.z = THREE.MathUtils.lerp(leftArm.rotation.z, -0.2, delta * 3.0);
        }
      } else if (pose === 'INSPECT_BARRELS') {
        // Step 7: Head tilted down inspecting cargo barrels, gesturing
        if (head) {
          head.rotation.x = THREE.MathUtils.lerp(head.rotation.x, -0.32, delta * 4.0);
          head.rotation.y = THREE.MathUtils.lerp(head.rotation.y, -0.22, delta * 4.0);
        }
        if (rightArm) {
          rightArm.rotation.x = THREE.MathUtils.lerp(rightArm.rotation.x, -0.45, delta * 4.0);
          rightArm.rotation.y = THREE.MathUtils.lerp(rightArm.rotation.y, -0.2, delta * 4.0);
        }
        if (rightLowerArm) rightLowerArm.rotation.x = THREE.MathUtils.lerp(rightLowerArm.rotation.x, -0.35, delta * 4.0);
      } else if (pose === 'GRAB_CORE') {
        // Step 9: Reaches right hand out to grab Quantum Core from reactor socket
        if (head) {
          head.rotation.x = THREE.MathUtils.lerp(head.rotation.x, -0.1, delta * 4.0);
          head.rotation.y = THREE.MathUtils.lerp(head.rotation.y, 0.25, delta * 4.0);
        }
        if (rightArm) {
          rightArm.rotation.x = THREE.MathUtils.lerp(rightArm.rotation.x, -0.95, delta * 6.0);
          rightArm.rotation.y = THREE.MathUtils.lerp(rightArm.rotation.y, 0.35, delta * 6.0);
        }
        if (rightLowerArm) rightLowerArm.rotation.x = THREE.MathUtils.lerp(rightLowerArm.rotation.x, -0.35, delta * 6.0);
      } else if (pose === 'PLACE_CORE_BACK') {
        // Step 10: Extends right arm, locks core into socket, then lowers arm
        if (head) {
          head.rotation.x = THREE.MathUtils.lerp(head.rotation.x, -0.05, delta * 4.0);
          head.rotation.y = THREE.MathUtils.lerp(head.rotation.y, 0.2, delta * 4.0);
        }
        if (rightArm) {
          rightArm.rotation.x = THREE.MathUtils.lerp(rightArm.rotation.x, -0.88, delta * 5.0);
          rightArm.rotation.y = THREE.MathUtils.lerp(rightArm.rotation.y, 0.3, delta * 5.0);
        }
        if (rightLowerArm) rightLowerArm.rotation.x = THREE.MathUtils.lerp(rightLowerArm.rotation.x, -0.3, delta * 5.0);
      } else if (pose === 'PROMPT_AI') {
        // Step 11: Faces forward, left hand raised slightly near helmet comms radio
        if (head) {
          head.rotation.x = THREE.MathUtils.lerp(head.rotation.x, 0.05, delta * 4.0);
          head.rotation.y = THREE.MathUtils.lerp(head.rotation.y, 0.0, delta * 4.0);
        }
        if (leftArm) {
          leftArm.rotation.x = THREE.MathUtils.lerp(leftArm.rotation.x, -0.75, delta * 5.0);
          leftArm.rotation.z = THREE.MathUtils.lerp(leftArm.rotation.z, 0.35, delta * 5.0);
        }
        if (leftLowerArm) leftLowerArm.rotation.x = THREE.MathUtils.lerp(leftLowerArm.rotation.x, -0.85, delta * 5.0);
        if (rightArm) {
          rightArm.rotation.x = THREE.MathUtils.lerp(rightArm.rotation.x, -0.15, delta * 4.0);
          rightArm.rotation.y = THREE.MathUtils.lerp(rightArm.rotation.y, 0.0, delta * 4.0);
          rightArm.rotation.z = THREE.MathUtils.lerp(rightArm.rotation.z, 0.22, delta * 4.0);
        }
      } else if (pose === 'AI_RESPONSE') {
        // Step 12: Relaxed weightless float, subtle head nod receiving Edge AI transmission
        if (head) {
          head.rotation.x = THREE.MathUtils.lerp(head.rotation.x, 0.04 + Math.sin(time * 1.5) * 0.03, delta * 3.0);
          head.rotation.y = THREE.MathUtils.lerp(head.rotation.y, 0.0, delta * 3.0);
        }
        if (leftArm) {
          leftArm.rotation.x = THREE.MathUtils.lerp(leftArm.rotation.x, -0.15, delta * 3.0);
          leftArm.rotation.z = THREE.MathUtils.lerp(leftArm.rotation.z, -0.22, delta * 3.0);
        }
        if (leftLowerArm) leftLowerArm.rotation.x = THREE.MathUtils.lerp(leftLowerArm.rotation.x, 0.0, delta * 3.0);
        if (rightArm) {
          rightArm.rotation.x = THREE.MathUtils.lerp(rightArm.rotation.x, -0.15, delta * 3.0);
          rightArm.rotation.z = THREE.MathUtils.lerp(rightArm.rotation.z, 0.22, delta * 3.0);
        }
      }
    }

    // Live MediaPipe Mocap Kinematics (Quaternions + Slerp)
    if (bs.mocapBlend > 0.01) {
      applyKinematics({
        bones,
        restPose,
        landmarks,
        lerpFactor,
        blendWeight: bs.mocapBlend
      });
    }

    if (!isLiveMocap && bs.mocapBlend > 0.01) {
      blendToRestPose(bones, restPose, 0.1);
    }

    // Root Group Locomotion & Smooth Quaternion Orientation
    const rootOffset = (isLiveMocap && landmarks && landmarks.length >= 25)
      ? computeRootTranslation(landmarks)
      : null;

    const mocapOffsetX = (rootOffset ? rootOffset.dx : 0) * bs.mocapBlend;
    const mocapOffsetZ = (rootOffset ? rootOffset.dz : 0) * bs.mocapBlend;

    const targetX = activePos.x + mocapOffsetX;
    const targetY = calibration.baseY + microZeroGFloat;
    const targetZ = activePos.z + mocapOffsetZ;

    targetPosRef.current.set(targetX, targetY, targetZ);

    // Smooth root group translation
    const posLerpSpeed = isLiveMocap ? Math.min(1.0, lerpFactor * 1.5) : Math.min(1.0, delta * 6.0);
    rootGroupRef.current.position.lerp(targetPosRef.current, posLerpSpeed);

    // Smooth root group orientation toward heading via Quaternion slerp
    targetEuler.set(0, currentRotationYRef.current, 0);
    targetQuat.setFromEuler(targetEuler);
    rootGroupRef.current.quaternion.slerp(targetQuat, Math.min(1.0, delta * 6.0));
  });

  if (!isolatedAstronautScene) return null;

  return (
    <group
      ref={rootGroupRef}
      scale={[calibration.scale, calibration.scale, calibration.scale]}
      name="Isolated_Astronaut_Character"
    >
      <primitive
        ref={innerModelRef}
        object={isolatedAstronautScene}
        position={[0, 0, 0]}
      />

      {/* When Quantum Core is grabbed, attach glowing miniature Core to right gauntlet */}
      {missionState.isCoreAttached && bones.rightHand && (
        <group position={[0.45, 1.05, 0.35]}>
          <mesh>
            <sphereGeometry args={[0.08, 16, 16]} />
            <meshStandardMaterial
              color="#38bdf8"
              emissive="#00e5ff"
              emissiveIntensity={3.2}
              toneMapped={false}
            />
          </mesh>
          <pointLight color="#00e5ff" intensity={2.0} distance={1.5} decay={2} />
        </group>
      )}
    </group>
  );
}

useGLTF.preload(PACK_PATH);
