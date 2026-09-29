import React, { useRef, useEffect, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Stars, Sparkles } from '@react-three/drei';
import * as THREE from 'three';
import gsap from 'gsap';
import SpaceshipEnvironment from './SpaceshipEnvironment.jsx';
import AstronautAvatar from './AstronautAvatar.jsx';

/**
 * 4 Cinematic Camera Presets (relative to Astronaut origin)
 */
export const CAMERA_PRESETS = {
  FRONT: {
    id: 'FRONT',
    label: 'Close Front',
    position: [0, 1.25, 2.2],
    target: [0, 1.15, 0],
    autoRotate: false
  },
  ORBIT: {
    id: 'ORBIT',
    label: '360° Orbit',
    position: [0, 1.35, 3.2],
    target: [0, 1.1, 0],
    autoRotate: true,
    autoRotateSpeed: 2.0
  },
  OTS: {
    id: 'OTS',
    label: 'Over-Shoulder',
    position: [0.45, 1.45, -1.2],
    target: [0, 1.15, 2.5],
    autoRotate: false
  },
  WIDE: {
    id: 'WIDE',
    label: 'Corridor Wide',
    position: [0, 1.5, 4.8],
    target: [0, 1.0, 0],
    autoRotate: false
  }
};

/**
 * CameraController
 * 
 * Manages smooth GSAP transitions between camera presets,
 * targeting y = 1.15 (astronaut chest/eye level) and updating OrbitControls.
 */
function CameraController({ cameraPreset = 'FRONT', controlsRef }) {
  const { camera } = useThree();
  const tweenRef = useRef(null);
  const isTransitioningRef = useRef(false);

  const getPresetConfig = (preset) => {
    const key = String(preset).toUpperCase();
    if (key.includes('ORBIT')) return CAMERA_PRESETS.ORBIT;
    if (key.includes('OTS') || key.includes('SHOULDER') || key.includes('EVA')) return CAMERA_PRESETS.OTS;
    if (key.includes('WIDE') || key.includes('CORRIDOR')) return CAMERA_PRESETS.WIDE;
    return CAMERA_PRESETS.FRONT;
  };

  useEffect(() => {
    const controls = controlsRef?.current;
    if (!controls) return;

    const presetConfig = getPresetConfig(cameraPreset);
    if (tweenRef.current) tweenRef.current.kill();

    isTransitioningRef.current = true;
    controls.enabled = false; // Prevent OrbitControls from fighting GSAP

    // Apply auto-rotation configuration
    controls.autoRotate = !!presetConfig.autoRotate;
    if (presetConfig.autoRotateSpeed) {
      controls.autoRotateSpeed = presetConfig.autoRotateSpeed;
    }

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
      camX: presetConfig.position[0],
      camY: presetConfig.position[1],
      camZ: presetConfig.position[2],
      tarX: presetConfig.target[0],
      tarY: presetConfig.target[1],
      tarZ: presetConfig.target[2],
      duration: 1.2,
      ease: 'power2.inOut',
      onUpdate: () => {
        camera.position.set(tweenState.camX, tweenState.camY, tweenState.camZ);
        controls.target.set(tweenState.tarX, tweenState.tarY, tweenState.tarZ);
        controls.update(); // Keep OrbitControls damping and targets synchronized every frame
      },
      onComplete: () => {
        camera.position.set(...presetConfig.position);
        controls.target.set(...presetConfig.target);
        controls.enabled = true;
        controls.update();
        isTransitioningRef.current = false;
      }
    });

    return () => {
      if (tweenRef.current) tweenRef.current.kill();
      controls.enabled = true;
    };
  }, [cameraPreset, camera, controlsRef]);

  useFrame(() => {
    const controls = controlsRef?.current;
    if (!controls || isTransitioningRef.current) return;
    controls.update();
  });

  return null;
}

export default function SpaceScene({
  landmarks = [],
  worldLandmarks = [],
  orientation = { pitch: 0, yaw: 0, roll: 0 },
  cameraPreset = 'FRONT',
  isSynthetic = false
}) {
  const controlsRef = useRef();

  return (
    <div style={{ width: '100%', height: '100%', position: 'absolute', inset: 0, overflow: 'hidden', background: '#020617' }}>
      <Canvas
        camera={{ position: [0, 1.25, 2.2], fov: 50, near: 0.1, far: 1000 }}
        gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
        shadows
      >
        <color attach="background" args={['#020617']} />

        {/* Dynamic Preset Camera Interpolation */}
        <CameraController cameraPreset={cameraPreset} controlsRef={controlsRef} />

        {/* Orbit Controls */}
        <OrbitControls
          ref={controlsRef}
          enableZoom={true}
          maxPolarAngle={Math.PI / 1.75}
          dampingFactor={0.06}
          enableDamping={true}
        />

        {/* Cinematic Lighting System */}
        <ambientLight intensity={0.8} />
        <directionalLight position={[5, 10, 5]} intensity={1.5} castShadow />

        {/* ISRO Saffron Tint Point Light */}
        <pointLight
          position={[0, 2, 0]}
          color="#FF671F"
          intensity={2}
          distance={8}
          decay={2}
        />

        {/* Deep Space Background Atmosphere */}
        <Stars
          radius={60}
          depth={30}
          count={3500}
          factor={4}
          saturation={0.5}
          fade
          speed={0.6}
        />

        {/* Floating Zero-G Space Particulates */}
        <Sparkles
          count={50}
          scale={[6, 4, 6]}
          size={1.5}
          speed={0.2}
          color="#38bdf8"
          opacity={0.5}
        />

        {/* Real 3D GLB Models wrapped in Suspense */}
        <Suspense fallback={null}>
          <SpaceshipEnvironment />
          <AstronautAvatar
            landmarks={landmarks}
            worldLandmarks={worldLandmarks}
            orientation={orientation}
            isSynthetic={isSynthetic}
          />
        </Suspense>
      </Canvas>
    </div>
  );
}
