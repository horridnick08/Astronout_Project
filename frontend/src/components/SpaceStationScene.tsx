import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Stars, Sparkles, Environment } from '@react-three/drei';
import * as THREE from 'three';
import SpaceshipCorridor from './3d/SpaceshipCorridor.jsx';
import AstronautAvatar from './3d/AstronautAvatar.tsx';
import WorkstationModules from './3d/WorkstationModules.tsx';
import StorageBayBarrels from './3d/StorageBayBarrels.tsx';
import QuantumReactorBay from './3d/QuantumReactorBay.tsx';
import SatelliteBulkheadDisplay from './3d/SatelliteBulkheadDisplay.tsx';
import CorridorSciFiDetails from './3d/CorridorSciFiDetails.tsx';
import ObservationWindow from './3d/ObservationWindow.tsx';
import ConvexHullBoundaries from './3d/ConvexHullBoundaries.tsx';
import CbdDiagnostic3DVisuals from './3d/CbdDiagnostic3DVisuals.tsx';
import CameraManager, { CAMERA_VIEWS } from '../engine/CameraManager.jsx';

/**
 * SpaceStationScene.tsx
 * 
 * Modular 3D R3F Production Space Station Simulation:
 * 1. Independent Asset Instances (Zero bundled monolithic GLBs):
 *    - SpaceshipCorridor (Static interior hull shell)
 *    - AstronautAvatar (Exposed bone armature for zero-g procedural IK & mass physics)
 *    - WorkstationModules (4 distinct command desks populated with child hardware)
 *    - StorageBayBarrels (Far-end storage bay barrels at [-1.85, 0, -16.0])
 *    - QuantumReactorBay (Designated reactor dock at [2.15, 0.9, -16.5])
 *    - SatelliteBulkheadDisplay (Central bulkhead monitor & animated 3D Earth Hologram)
 * 2. Spatial Immersion & Deep Space Atmosphere
 * 3. Cinematic Camera Controller following astronaut through 36m corridor
 */

interface SpaceStationSceneProps {
  activeCameraView?: string;
  astronautPosition?: THREE.Vector3;
  onBonesDiscovered?: (bones: string[]) => void;
}

export default function SpaceStationScene({
  activeCameraView = CAMERA_VIEWS.FRONT,
  astronautPosition = new THREE.Vector3(0, 0, 0),
  onBonesDiscovered
}: SpaceStationSceneProps) {
  return (
    <div style={{ width: '100%', height: '100%', position: 'absolute', inset: 0, overflow: 'hidden', background: '#020617' }}>
      <Canvas
        camera={{
          position: [0, 1.15, 2.1],
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

        {/* Cinematic Camera Controller Following Astronaut */}
        <CameraManager
          activeView={activeCameraView}
          astronautPos={astronautPosition}
        />

        {/* PBR Environment Reflections for Metallic Spacesuit & Hull */}
        <Environment preset="city" environmentIntensity={0.65} />

        {/* ============================================================== */}
        {/* ILLUMINATION                                                    */}
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

        {/* Subtle Sci-Fi Accent Lights Distributed along the 36m Corridor */}
        {/* Forward Section Accent */}
        <pointLight position={[-2.4, 2.2, 3.5]} color="#06b6d4" intensity={1.4} distance={8} decay={2} />
        <pointLight position={[2.4, 2.2, 3.5]} color="#f59e0b" intensity={1.2} distance={8} decay={2} />

        {/* Mid Section Accent (Near Satellite Display) */}
        <pointLight position={[-2.4, 2.2, -6.5]} color="#06b6d4" intensity={1.4} distance={8} decay={2} />
        <pointLight position={[2.4, 2.2, -6.5]} color="#38bdf8" intensity={1.3} distance={8} decay={2} />

        {/* Aft Section Accent (Near Storage & Reactor) */}
        <pointLight position={[-2.4, 2.2, -15.5]} color="#f59e0b" intensity={1.4} distance={8} decay={2} />
        <pointLight position={[2.4, 2.2, -15.5]} color="#00e5ff" intensity={1.5} distance={8} decay={2} />

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

        {/* Floating Zero-G Particulates across corridor volume */}
        <Sparkles
          count={100}
          scale={[8, 4, 34]}
          size={1.6}
          speed={0.3}
          color="#38bdf8"
          opacity={0.45}
        />

        {/* ============================================================== */}
        {/* MODULAR 3D ASSETS DECOUPLED AS INDEPENDENT INSTANCES           */}
        {/* ============================================================== */}
        <Suspense fallback={null}>
          {/* 1. Spaceship Environment Hull */}
          <SpaceshipCorridor />

          {/* 2. Ambient Sci-Fi Corridor Detailing (LED seams, handrails, lockers, vents) */}
          <CorridorSciFiDetails />

          {/* 3. Dispersed Workstations (Stations Alpha Pilot, Beta, Gamma, Delta) */}
          <WorkstationModules />

          {/* 3. Central Bulkhead Satellite Display & 3D Earth Hologram */}
          <SatelliteBulkheadDisplay />

          {/* 4. Far-End Storage Bay Barrels */}
          <StorageBayBarrels />

          {/* 5. Quantum Reactor Bay & Housing Slot */}
          <QuantumReactorBay />

          {/* 6. Station 3: Deep Space Hull Observation Window */}
          <ObservationWindow />

          {/* 7. Rigged Astronaut with Zero-G Kinematics & Oops Collision Reaction */}
          <AstronautAvatar onBonesDiscovered={onBonesDiscovered} />

          {/* 8. Volumetric Workspace Convex Hull Boundary System */}
          <ConvexHullBoundaries />

          {/* 9. USP 11: CBD Diagnostic Engine 3D Laser Grid Wave & Target Reticles */}
          <CbdDiagnostic3DVisuals />
        </Suspense>
      </Canvas>
    </div>
  );
}
