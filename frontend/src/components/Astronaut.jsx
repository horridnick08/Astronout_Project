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
import { interactionEngine, INTERACTION_ACTIONS } from '../engine/InteractionEngine.js';

const PACK_PATH = '/models/astronaut/space_sci_fi_pack.glb';

/**
 * Astronaut
 * 
 * Production-ready Rigged Astronaut Character:
 * - Decoupled from all prop sub-meshes (Props live in PropsManager in the world scene)
 * - Retains ONLY the rigged suit mesh and skeleton bones
 * - Calibrated scale (0.165) for 3.0m spaceship corridor
 * - ONLY Astronaut gets locomotion & micro zero-g float: position.y = baseY + Math.sin(time * 1.0) * 0.03
 * - Supports procedural walk cycle, waypoint navigation poses, and Live MediaPipe Mocap
 * - Renders harvested Quantum Core attached to gauntlet when grabbed
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

  // Interaction engine state
  const [engineState, setEngineState] = useState(interactionEngine.getState());

  useEffect(() => {
    return interactionEngine.subscribe((state) => {
      setEngineState(state);
    });
  }, []);

  // 1. ISOLATE RIGGED ASTRONAUT SUIT & SKELETON
  // Uses SkeletonUtils.clone to properly clone SkinnedMesh skeleton bindings,
  // then strips out all prop meshes completely so props NEVER move with the astronaut.
  const isolatedAstronautScene = useMemo(() => {
    if (!scene) return null;

    const cloned = skeletonClone(scene);

    // Identify and remove all prop sub-meshes from the astronaut hierarchy
    const propsToRemove = [];
    cloned.traverse((child) => {
      const n = (child.name || '').toLowerCase();
      if (
        n.includes('computer') ||
        n.includes('barrel') ||
        n.includes('cube') ||
        n.includes('energy_sphere') ||
        n.includes('prop')
      ) {
        propsToRemove.push(child);
      }
    });

    propsToRemove.forEach((p) => {
      if (p.parent) p.parent.remove(p);
    });

    // Configure PBR materials and shadow flags on the astronaut suit
    cloned.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;

        if (child.material) {
          child.material = child.material.clone();
          child.material.roughness = Math.min(child.material.roughness ?? 0.4, 0.4);
          child.material.metalness = Math.max(child.material.metalness ?? 0.35, 0.45);
          child.material.needsUpdate = true;
        }
      }
    });

    return cloned;
  }, [scene]);

  // Calibration: fits the 3.0m spaceship corridor
  const calibration = useMemo(() => ({
    scale: 0.165,
    baseY: 0.0
  }), []);

  // Rig bone discovery and rest pose capture
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

  // Capture initial rest Euler rotations for safe relative procedural offsets
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

  // Reset baseline hip on mocap toggle
  useEffect(() => {
    if (isLiveMocap) {
      resetBaselineHip();
    }
  }, [isLiveMocap]);

  // Quaternion & Euler caching for smooth root rotation slerp
  const targetQuat = useMemo(() => new THREE.Quaternion(), []);
  const targetEuler = useMemo(() => new THREE.Euler(0, 0, 0, 'YXZ'), []);

  // State machine blending state
  const blendStateRef = useRef({
    mocapBlend: 0.0,
    interactionPoseBlend: 0.0,
    activePoseType: null
  });

  // Main frame loop: locomotion via root group translation & quaternion slerp, continuous zero-g bone float, waypoint kinematics
  useFrame((state, delta) => {
    if (!rootGroupRef.current) return;
    const time = state.clock.getElapsedTime();
    const bs = blendStateRef.current;

    // A. Check InteractionEngine waypoint navigation update
    let activePos = locomotion.position;
    let activeRotY = locomotion.rotationY;

    const navResult = interactionEngine.update(
      delta,
      locomotion.position,
      currentRotationYRef.current,
      (poseType) => {
        bs.activePoseType = poseType;
        bs.interactionPoseBlend = THREE.MathUtils.lerp(bs.interactionPoseBlend, 1.0, Math.min(1.0, delta * 5.0));
      }
    );

    if (navResult) {
      activePos = navResult.position;
      activeRotY = navResult.rotationY;
      currentRotationYRef.current = activeRotY;
    } else {
      currentRotationYRef.current = activeRotY;
      if (!engineState.isInteracting) {
        bs.interactionPoseBlend = THREE.MathUtils.lerp(bs.interactionPoseBlend, 0.0, Math.min(1.0, delta * 6.0));
      }
    }

    // B. Mocap Blending Transition
    const targetMocapBlend = isLiveMocap ? 1.0 : 0.0;
    bs.mocapBlend = THREE.MathUtils.lerp(bs.mocapBlend, targetMocapBlend, Math.min(1.0, delta * 6.0));

    // C. Micro Zero-G Vertical Float:
    // position.y = baseY + Math.sin(time * 1.0) * 0.03
    const microZeroGFloat = Math.sin(time * 1.0) * 0.03 * zeroGIntensity;

    // D. UNIFIED CONTINUOUS PROCEDURAL ZERO-G IDLE BONE ANIMATIONS
    // Runs ALL THE TIME (both stationary AND when traveling to waypoints).
    // NO walking animation, leg gait, or arm-flaring poses during movement.
    if (!isLiveMocap) {
      const head = bones.head;
      const spine = bones.spine || bones.chest;
      const leftArm = bones.leftUpperArm;
      const rightArm = bones.rightUpperArm;
      const leftHand = bones.leftHand;
      const rightHand = bones.rightHand;
      const leftLeg = bones.leftThigh;
      const rightLeg = bones.rightThigh;

      // 1. Head & Neck: gentle helmet looking around
      if (head) {
        head.rotation.y = Math.sin(time * 0.8) * 0.06;
        head.rotation.x = Math.cos(time * 0.6) * 0.04;
      }

      // 2. Spine & Chest (Breathing Float):
      if (spine) {
        const baseSpineX = restEuler.spine ? restEuler.spine.x : 0;
        spine.rotation.x = baseSpineX + Math.sin(time * 1.0) * 0.03;
      }

      // 3. Hands, Arms & Palms: floating zero-g posture & soft palm movement
      if (leftArm) {
        leftArm.rotation.z = -0.2 + Math.sin(time * 1.1) * 0.05;
      }
      if (rightArm) {
        rightArm.rotation.z = 0.2 - Math.sin(time * 1.1) * 0.05;
      }
      if (leftHand) {
        const baseHandX = restEuler.leftHand ? restEuler.leftHand.x : 0;
        leftHand.rotation.x = baseHandX + Math.sin(time * 1.4) * 0.08;
      }
      if (rightHand) {
        const baseHandX = restEuler.rightHand ? restEuler.rightHand.x : 0;
        rightHand.rotation.x = baseHandX + Math.cos(time * 1.4) * 0.08;
      }

      // 4. Subtle Leg Drift (STRICTLY CLAMPED - NO SPLITS):
      // Apply very slight, gentle drift on upper legs (max range ±0.03 rad) so legs feel weightless in zero-g without flaring outwards
      if (leftLeg) {
        const baseLeftLegZ = restEuler.leftThigh ? restEuler.leftThigh.z : 0;
        const driftL = Math.sin(time * 0.7) * 0.02;
        leftLeg.rotation.z = baseLeftLegZ + Math.max(-0.03, Math.min(0.03, 0.01 + driftL));
      }
      if (rightLeg) {
        const baseRightLegZ = restEuler.rightThigh ? restEuler.rightThigh.z : 0;
        const driftR = Math.sin(time * 0.7) * 0.02;
        rightLeg.rotation.z = baseRightLegZ - Math.max(-0.03, Math.min(0.03, 0.01 + driftR));
      }
    }

    // E. Procedural Waypoint Interaction Kinematics (overlays only when stationary at station)
    if (bs.interactionPoseBlend > 0.01 && !isLiveMocap && bs.activePoseType) {
      const pBlend = bs.interactionPoseBlend;

      if (bs.activePoseType === 'TYPE_PRIMARY') {
        // Station 1: Extends right gauntlet to type on Tactical Laptop
        if (bones.rightUpperArm && restPose.rightUpperArm) {
          const typingOsc = Math.sin(time * 9.0) * 0.04;
          bones.rightUpperArm.rotation.x = THREE.MathUtils.lerp(bones.rightUpperArm.rotation.x, -0.75 + typingOsc, pBlend * 0.15);
          bones.rightUpperArm.rotation.z = THREE.MathUtils.lerp(bones.rightUpperArm.rotation.z, -0.25, pBlend * 0.15);
        }
        if (bones.rightLowerArm && restPose.rightLowerArm) {
          bones.rightLowerArm.rotation.x = THREE.MathUtils.lerp(bones.rightLowerArm.rotation.x, -0.65, pBlend * 0.15);
        }
        if (bones.head && restPose.head) {
          bones.head.rotation.x = THREE.MathUtils.lerp(bones.head.rotation.x, -0.22, pBlend * 0.1);
        }
      } else if (bs.activePoseType === 'OPERATE_TELEMETRY') {
        // Station 2: Operates Holographic Telemetry Console with dual gauntlets
        if (bones.rightUpperArm && restPose.rightUpperArm) {
          const dialOsc = Math.sin(time * 5.0) * 0.06;
          bones.rightUpperArm.rotation.x = THREE.MathUtils.lerp(bones.rightUpperArm.rotation.x, -0.8 + dialOsc, pBlend * 0.15);
          bones.rightUpperArm.rotation.y = THREE.MathUtils.lerp(bones.rightUpperArm.rotation.y, 0.2, pBlend * 0.15);
        }
        if (bones.leftUpperArm && restPose.leftUpperArm) {
          const slideOsc = Math.cos(time * 4.5) * 0.05;
          bones.leftUpperArm.rotation.x = THREE.MathUtils.lerp(bones.leftUpperArm.rotation.x, -0.7 + slideOsc, pBlend * 0.15);
          bones.leftUpperArm.rotation.y = THREE.MathUtils.lerp(bones.leftUpperArm.rotation.y, -0.2, pBlend * 0.15);
        }
      } else if (bs.activePoseType === 'INSPECT_COSMOS') {
        // Deep Space Observation Window: Calm posture looking out at cosmos
        if (bones.head && restPose.head) {
          bones.head.rotation.x = THREE.MathUtils.lerp(bones.head.rotation.x, 0.25, pBlend * 0.1);
        }
      } else if (bs.activePoseType === 'GRAB_CORE') {
        // Station 4: Reaches right hand toward wall dock to grab Quantum Core
        if (bones.rightUpperArm && restPose.rightUpperArm) {
          bones.rightUpperArm.rotation.x = THREE.MathUtils.lerp(bones.rightUpperArm.rotation.x, -0.95, pBlend * 0.18);
          bones.rightUpperArm.rotation.y = THREE.MathUtils.lerp(bones.rightUpperArm.rotation.y, 0.35, pBlend * 0.18);
        }
        if (bones.rightLowerArm && restPose.rightLowerArm) {
          bones.rightLowerArm.rotation.x = THREE.MathUtils.lerp(bones.rightLowerArm.rotation.x, -0.35, pBlend * 0.18);
        }
      }
    }

    // F. Live MediaPipe Mocap Kinematics (Quaternions + Slerp)
    if (bs.mocapBlend > 0.01) {
      applyKinematics({
        bones,
        restPose,
        landmarks,
        lerpFactor,
        blendWeight: bs.mocapBlend
      });
    }

    // Blend back to rest pose when exiting mocap and idle
    if (!isLiveMocap && bs.mocapBlend > 0.01) {
      blendToRestPose(bones, restPose, 0.1);
    }

    // G. Root Group Locomotion & Smooth Quaternion Orientation ONLY
    const rootOffset = (isLiveMocap && landmarks && landmarks.length >= 25)
      ? computeRootTranslation(landmarks)
      : null;

    const mocapOffsetX = (rootOffset ? rootOffset.dx : 0) * bs.mocapBlend;
    const mocapOffsetZ = (rootOffset ? rootOffset.dz : 0) * bs.mocapBlend;

    const targetX = activePos.x + mocapOffsetX;
    const targetY = calibration.baseY + microZeroGFloat;
    const targetZ = activePos.z + mocapOffsetZ;

    targetPosRef.current.set(targetX, targetY, targetZ);

    // Smooth root group translation (lerp)
    const posLerpSpeed = isLiveMocap ? Math.min(1.0, lerpFactor * 1.5) : Math.min(1.0, delta * 6.0);
    rootGroupRef.current.position.lerp(targetPosRef.current, posLerpSpeed);

    // Smooth root group orientation toward travel direction via Quaternion slerp (do NOT rotate individual hip/spine bones)
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

      {/* When Quantum Core is grabbed, attach miniature glowing Core to right gauntlet */}
      {engineState.isCoreAttached && bones.rightHand && (
        <group position={[0.45, 1.05, 0.35]}>
          <mesh>
            <sphereGeometry args={[0.08, 16, 16]} />
            <meshStandardMaterial
              color="#38bdf8"
              emissive="#00e5ff"
              emissiveIntensity={3.0}
              toneMapped={false}
            />
          </mesh>
          <pointLight color="#00e5ff" intensity={1.8} distance={1.2} decay={2} />
        </group>
      )}
    </group>
  );
}

useGLTF.preload(PACK_PATH);
