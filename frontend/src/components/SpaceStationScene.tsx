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
import SpaceshipServerRack3D from './3d/SpaceshipServerRack3D.tsx';
import TimedAutomaton3DVisuals from './3d/TimedAutomaton3DVisuals.tsx';
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
  isSwapped?: boolean;
  onToggleSwap?: () => void;
}

export default function SpaceStationScene({
  activeCameraView = CAMERA_VIEWS.FRONT,
  astronautPosition = new THREE.Vector3(0, 0, 0),
  onBonesDiscovered,
  isSwapped = false,
  onToggleSwap,
}: SpaceStationSceneProps) {
  return (
    <div
      id="space-station-3d-viewport"
      style={
        isSwapped
          ? {
              position: 'fixed',
              right: '1rem',
              bottom: '1rem',
              width: '310px',
              height: '192px',
              zIndex: 30,
              borderRadius: '0.75rem',
              overflow: 'hidden',
              backgroundColor: '#020617',
              borderColor: 'rgba(0, 240, 255, 0.45)',
              boxShadow:
                '0 20px 50px rgba(0, 0, 0, 0.85), 0 0 25px rgba(0, 240, 255, 0.25)',
              transition: 'all 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
            }
          : {
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              overflow: 'hidden',
              background: '#020617',
              zIndex: 0,
              transition: 'all 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
            }
      }
      className={isSwapped ? 'border backdrop-blur-xl pointer-events-auto' : ''}
    >
      {/* When Swapped into PiP mode, display a sleek sci-fi HUD header with Swap/Restore button */}
      {isSwapped && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            padding: '6px 10px',
            backgroundColor: 'rgba(2, 6, 23, 0.85)',
            borderBottom: '1px solid rgba(0, 240, 255, 0.25)',
            zIndex: 20,
          }}
          className="flex items-center justify-between font-mono backdrop-blur-md"
        >
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_#00f0ff] shrink-0" />
            <span className="text-[10px] font-mono font-bold text-cyan-300 tracking-[0.05em] uppercase truncate">
              3D SIMULATION // CORRIDOR
            </span>
          </div>

          <button
            id="btn-swap-restore-3d"
            onClick={onToggleSwap}
            title="Restore 3D Simulation to Main Viewport"
            style={{
              padding: '2px 8px',
              fontSize: '9.5px',
              borderColor: 'rgba(0, 240, 255, 0.45)',
              backgroundColor: 'rgba(10, 25, 40, 0.85)',
            }}
            className="flex items-center gap-1 rounded border text-cyan-300 hover:text-white hover:border-cyan-300 hover:bg-cyan-950 transition-all font-mono font-bold uppercase tracking-[0.05em] shrink-0 cursor-pointer shadow-sm active:scale-95"
          >
            <span>[⛶ RESTORE]</span>
          </button>
        </div>
      )}
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

          {/* 9. CBD Diagnostic Engine 3D Laser Grid Wave & Target Reticles */}
          <CbdDiagnostic3DVisuals />

          {/* 10. Spaceship Server Room / Computer Rack & Radiation Fault Tolerance Laser */}
          <SpaceshipServerRack3D />

          {/* 11. Timed Automaton Verifier Holographic Ghost & Temporal Timeline */}
          <TimedAutomaton3DVisuals />
        </Suspense>
      </Canvas>
    </div>
  );
}
