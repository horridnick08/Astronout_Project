import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Stars, Sparkles, Environment } from '@react-three/drei';
import * as THREE from 'three';
import SpaceshipCorridor from './3d/SpaceshipCorridor.jsx';
import StorageBarrels from './3d/StorageBarrels.jsx';
import QuantumCore from './3d/QuantumCore.jsx';
import Workstations from './3d/Workstations.jsx';
import Astronaut from './Astronaut.jsx';
import CameraManager, { CAMERA_VIEWS } from '../engine/CameraManager.jsx';

/**
 * Scene3D
 * 
 * Principal 3D WebGL Canvas Architecture:
 * 1. Clean Near-Plane: camera near = 0.01 (prevents helmet/visor clipping)
 * 2. Illumination: Pure White Ambient Light (intensity = 1.4), Directional Light [2, 7, 3] (intensity = 1.3)
 * 3. Separately Loaded 3D Assets:
 *    - StorageBarrels: Cargo storage barrels loaded separately at distinct coordinates
 *    - QuantumCore: Glowing core secured at designated reactor wall slot [2.2, 0.75, -2.2]
 *    - Workstations: Flight Ops laptop desk and Comms mainframe console
 * 4. Isolated Astronaut Character: Automated 30-40s mission loop kinematics
 * 5. Static Corridor Environment: Static background room shell
 */
export default function Scene3D({
  activeCameraView = CAMERA_VIEWS.FRONT,
  locomotion = {
    position: new THREE.Vector3(0, 0, 0),
    rotationY: 0,
    isMoving: false,
    speed: 0
  },
  landmarks = [],
  isLiveMocap = false,
  lerpFactor = 0.22,
  zeroGIntensity = 1.0,
  onBonesDiscovered = null
}) {
  return (
    <div style={{ width: '100%', height: '100%', position: 'absolute', inset: 0, overflow: 'hidden', background: '#020617' }}>
      <Canvas
        camera={{
          position: [0, 1.25, 2.2],
          fov: 50,
          near: 0.01,
          far: 500
        }}
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: 'high-performance'
        }}
        shadows={{ type: THREE.PCFShadowMap }}
      >
        <color attach="background" args={['#020617']} />

        {/* Cinematic Camera Controller */}
        <CameraManager
          activeView={activeCameraView}
          astronautPos={locomotion.position}
        />

        {/* PBR Environment Reflections for Metallic Spacesuit & Visor */}
        <Environment preset="city" environmentIntensity={0.65} />

        {/* ============================================================== */}
        {/* ILLUMINATION                                                    */}
        {/* - Ambient Light: intensity = 1.4 (pure white)                  */}
        {/* - Directional Light: [2, 7, 3], intensity = 1.3                */}
        {/* ============================================================== */}
        <ambientLight intensity={1.4} color="#ffffff" />
        <directionalLight
          position={[2, 7, 3]}
          intensity={1.3}
          color="#ffffff"
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-bias={-0.0001}
        />

        {/* Subtle Sci-Fi Accent Lights for Corridor Depth */}
        <pointLight
          position={[-2.5, 2.2, -1.0]}
          color="#06b6d4"
          intensity={1.5}
          distance={8}
          decay={2}
        />
        <pointLight
          position={[2.5, 2.2, -1.0]}
          color="#f59e0b"
          intensity={1.2}
          distance={8}
          decay={2}
        />

        {/* Deep Space Background Atmosphere */}
        <Stars
          radius={80}
          depth={40}
          count={4000}
          factor={4}
          saturation={0.6}
          fade
          speed={0.5}
        />

        {/* Floating Zero-G Particulates */}
        <Sparkles
          count={60}
          scale={[8, 5, 12]}
          size={1.6}
          speed={0.3}
          color="#38bdf8"
          opacity={0.45}
        />

        {/* ============================================================== */}
        {/* SEPARATELY LOADED 3D ASSETS & CHARACTERS                       */}
        {/* - SpaceshipCorridor: Background room shell                     */}
        {/* - StorageBarrels: Cargo barrels at distinct wall coordinates   */}
        {/* - QuantumCore: Secured at reactor socket [2.2, 0.75, -2.2]     */}
        {/* - Workstations: Flight Ops and Comms console stations          */}
        {/* - Astronaut: Automated 30-40s mission loop kinematics          */}
        {/* ============================================================== */}
        <Suspense fallback={null}>
          <SpaceshipCorridor />
          <StorageBarrels />
          <QuantumCore />
          <Workstations />
          <Astronaut
            locomotion={locomotion}
            landmarks={landmarks}
            isLiveMocap={isLiveMocap}
            lerpFactor={lerpFactor}
            zeroGIntensity={zeroGIntensity}
            onBonesDiscovered={onBonesDiscovered}
          />
        </Suspense>
      </Canvas>
    </div>
  );
}
