import React, { useEffect, useRef } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import gsap from 'gsap';

/**
 * 4 Cinematic Camera Presets calibrated for the Astronaut & Spaceship Corridor
 */
export const CAMERA_PRESETS = {
  FRONT: {
    id: 'FRONT',
    label: 'Close Front',
    position: [0, 1.15, 2.1],
    target: [0, 0.95, 0],
    autoRotate: true
  },
  ORBIT: {
    id: 'ORBIT',
    label: '360° Orbit',
    position: [0, 1.25, 2.6],
    target: [0, 0.95, 0],
    autoRotate: true,
    autoRotateSpeed: 2.0
  },
  OTS: {
    id: 'OTS',
    label: 'Over-Shoulder',
    position: [0.55, 1.35, -1.0],
    target: [0, 1.0, 0.3],
    autoRotate: false
  },
  WIDE: {
    id: 'WIDE',
    label: 'Corridor Wide',
    position: [0, 1.35, 3.4],
    target: [0, 0.9, -0.4],
    autoRotate: true
  },
  SERVER_RACK: {
    id: 'SERVER_RACK',
    label: 'Server Rack',
    position: [0.75, 1.35, -0.4],
    target: [2.15, 1.25, -0.4],
    autoRotate: false
  }
};

// Aliases for compatibility with different UI button labels
export const CAMERA_VIEWS = {
  FRONT: 'FRONT',
  ORBIT_360: 'ORBIT',
  ORBIT: 'ORBIT',
  OTS: 'OTS',
  WIDE: 'WIDE',
  SERVER_RACK: 'SERVER_RACK',
  RADIATION: 'SERVER_RACK'
};

import { zeroGKinematics } from './useZeroGKinematics.ts';
import { radiationFaultToleranceManager } from './RadiationFaultToleranceManager.ts';

export default function CameraManager({
  activeView = 'FRONT',
  astronautPos = null,
  controlsRef = null
}) {
  const { camera } = useThree();
  const internalControlsRef = useRef();
  const effectiveControlsRef = controlsRef || internalControlsRef;

  const tweenRef = useRef(null);
  const isTransitioningRef = useRef(false);
  const [targetView, setTargetView] = React.useState(activeView);

  useEffect(() => {
    setTargetView(activeView);
  }, [activeView]);

  useEffect(() => {
    return radiationFaultToleranceManager.subscribe((state) => {
      if (state.cameraFocused) {
        setTargetView('SERVER_RACK');
      }
    });
  }, []);

  const getEffectivePos = () => {
    if (astronautPos && (astronautPos.x !== 0 || astronautPos.y !== 0 || astronautPos.z !== 0)) {
      return astronautPos;
    }
    return zeroGKinematics ? zeroGKinematics.position : new THREE.Vector3(0, 0, 0);
  };

  // Resolve preset configuration relative to astronaut world position
  const getCameraConfig = (view, pos = null) => {
    const p = pos || getEffectivePos();
    const key = String(view).toUpperCase();

    if (key.includes('ORBIT')) {
      return {
        position: new THREE.Vector3(p.x + CAMERA_PRESETS.ORBIT.position[0], p.y + CAMERA_PRESETS.ORBIT.position[1], p.z + CAMERA_PRESETS.ORBIT.position[2]),
        target: new THREE.Vector3(p.x + CAMERA_PRESETS.ORBIT.target[0], p.y + CAMERA_PRESETS.ORBIT.target[1], p.z + CAMERA_PRESETS.ORBIT.target[2]),
        autoRotate: true,
        autoRotateSpeed: 2.0,
        enableRotate: true,
        enableZoom: true,
        minDistance: 0.8,
        maxDistance: 6.0
      };
    }

    if (key.includes('OTS') || key.includes('SHOULDER') || key.includes('EVA')) {
      return {
        position: new THREE.Vector3(p.x + CAMERA_PRESETS.OTS.position[0], p.y + CAMERA_PRESETS.OTS.position[1], p.z + CAMERA_PRESETS.OTS.target ? CAMERA_PRESETS.OTS.position[2] : -1.0),
        target: new THREE.Vector3(p.x + CAMERA_PRESETS.OTS.target[0], p.y + CAMERA_PRESETS.OTS.target[1], p.z + CAMERA_PRESETS.OTS.target[2]),
        autoRotate: false,
        enableRotate: true,
        enableZoom: true,
        minDistance: 0.5,
        maxDistance: 8.0
      };
    }

    if (key.includes('SERVER') || key.includes('RACK') || key.includes('RADIATION')) {
      return {
        position: new THREE.Vector3(CAMERA_PRESETS.SERVER_RACK.position[0], CAMERA_PRESETS.SERVER_RACK.position[1], CAMERA_PRESETS.SERVER_RACK.position[2]),
        target: new THREE.Vector3(CAMERA_PRESETS.SERVER_RACK.target[0], CAMERA_PRESETS.SERVER_RACK.target[1], CAMERA_PRESETS.SERVER_RACK.target[2]),
        autoRotate: false,
        enableRotate: true,
        enableZoom: true,
        minDistance: 0.3,
        maxDistance: 6.0
      };
    }

    if (key.includes('WIDE') || key.includes('CORRIDOR')) {
      return {
        position: new THREE.Vector3(p.x + CAMERA_PRESETS.WIDE.position[0], p.y + CAMERA_PRESETS.WIDE.position[1], p.z + CAMERA_PRESETS.WIDE.position[2]),
        target: new THREE.Vector3(p.x + CAMERA_PRESETS.WIDE.target[0], p.y + CAMERA_PRESETS.WIDE.target[1], p.z + CAMERA_PRESETS.WIDE.target[2]),
        autoRotate: false,
        enableRotate: true,
        enableZoom: true,
        minDistance: 1.0,
        maxDistance: 15.0
      };
    }

    // Default: 'Close Front'
    return {
      position: new THREE.Vector3(p.x + CAMERA_PRESETS.FRONT.position[0], p.y + CAMERA_PRESETS.FRONT.position[1], p.z + CAMERA_PRESETS.FRONT.position[2]),
      target: new THREE.Vector3(p.x + CAMERA_PRESETS.FRONT.target[0], p.y + CAMERA_PRESETS.FRONT.target[1], p.z + CAMERA_PRESETS.FRONT.target[2]),
      autoRotate: false,
      enableRotate: true,
      enableZoom: true,
      minDistance: 0.8,
      maxDistance: 6.0
    };
  };

  // Perform GSAP smooth interpolation when preset changes
  useEffect(() => {
    const controls = effectiveControlsRef.current;
    if (!controls) return;

    const config = getCameraConfig(targetView, getEffectivePos());
    if (tweenRef.current) tweenRef.current.kill();

    isTransitioningRef.current = true;
    controls.enabled = false; // Prevent OrbitControls from fighting GSAP during animation

    controls.autoRotate = config.autoRotate;
    if (config.autoRotateSpeed !== undefined) {
      controls.autoRotateSpeed = config.autoRotateSpeed;
    }
    controls.minDistance = config.minDistance;
    controls.maxDistance = config.maxDistance;

    const tweenState = {
      camX: camera.position.x,
      camY: camera.position.y,
      camZ: camera.position.z,
      tarX: controls.target.x,
      tarY: controls.target.y,
      tarZ: controls.target.z
    };

    // Smooth transition over 1.2s with power2.inOut easing
    tweenRef.current = gsap.to(tweenState, {
      camX: config.position.x,
      camY: config.position.y,
      camZ: config.position.z,
      tarX: config.target.x,
      tarY: config.target.y,
      tarZ: config.target.z,
      duration: 1.2,
      ease: 'power2.inOut',
      onUpdate: () => {
        camera.position.set(tweenState.camX, tweenState.camY, tweenState.camZ);
        controls.target.set(tweenState.tarX, tweenState.tarY, tweenState.tarZ);
        controls.update(); // Keep OrbitControls damping and targets synchronized every frame
      },
      onComplete: () => {
        camera.position.copy(config.position);
        controls.target.copy(config.target);
        controls.enabled = true;
        controls.update();
        isTransitioningRef.current = false;
      }
    });

    return () => {
      if (tweenRef.current) tweenRef.current.kill();
      controls.enabled = true;
    };
  }, [targetView, camera]);

  // Keep camera tracking astronaut position when moving (unless manually orbiting)
  useFrame(() => {
    const controls = effectiveControlsRef.current;
    if (!controls || !controls.enabled || isTransitioningRef.current) return;

    const curPos = getEffectivePos();

    if (activeView === 'OTS' || activeView === 'FRONT' || String(activeView).includes('FRONT') || String(activeView).includes('SHOULDER')) {
      const config = getCameraConfig(activeView, curPos);
      controls.target.lerp(config.target, 0.08);
      camera.position.lerp(config.position, 0.08);
    } else if (String(activeView).includes('ORBIT')) {
      const chestTarget = new THREE.Vector3(curPos.x, curPos.y + 1.1, curPos.z);
      controls.target.lerp(chestTarget, 0.08);
    }
    controls.update();
  });

  return (
    <OrbitControls
      ref={effectiveControlsRef}
      enableDamping={true}
      dampingFactor={0.06}
      maxPolarAngle={Math.PI / 1.75}
      minPolarAngle={0.1}
    />
  );
}
