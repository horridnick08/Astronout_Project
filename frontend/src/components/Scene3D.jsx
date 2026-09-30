import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Stars, Sparkles, Environment } from '@react-three/drei';
import * as THREE from 'three';
import SpaceshipCorridor from './3d/SpaceshipCorridor.jsx';
import PropsManager from './PropsManager.jsx';
import Astronaut from './Astronaut.jsx';
import CameraManager, { CAMERA_VIEWS } from '../engine/CameraManager.jsx';

/**
 * Scene3D
 * 
 * Principal 3D WebGL Canvas Architecture:
 * 1. Clean Near-Plane: camera near = 0.01 (prevents helmet/visor clipping)
 * 2. Illumination: Pure White Ambient Light (intensity = 1.4), Directional Light [2, 7, 3] (intensity = 1.3)
 * 3. Decoupled Props Architecture: PropsManager rendered as independent world entities
 * 4. Isolated Astronaut Character: SkinnedMesh + bones only, micro zero-g float, waypoint kinematics
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
  onBonesDiscovered = null,
  usp1Active = false,
  usp2Active = false,
  usp4Active = false,
  usp5Active = false,
  usp6Active = false,
  usp7Active = false,
  usp8Active = false,
  usp9Active = false,
  usp10Active = false,
  usp11Active = false,
  usp12Active = false,
  usp19Active = false
}) {
  return (
    <div style={{ width: '100%', height: '100%', position: 'absolute', inset: 0, overflow: 'hidden', background: '#020617' }}>
      <Canvas
        camera={{
          position: [0, 1.25, 2.2],
          fov: 50,
          near: 0.01, // Prevent helmet/visor geometry from clipping into camera
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
          astronautHeading={locomotion.rotationY}
        />

        {/* PBR Environment Reflections for Metallic Spacesuit & Visor */}
        <Environment preset="city" environmentIntensity={0.65} />

        {/* ============================================================== */}
        {/* ILLUMINATION: Requirement 5                                    */}
        {/* - Ambient Light: intensity = 1.4 (pure white)                  */}
        {/* - Directional Light: [2, 7, 3], intensity = 1.3                */}
        {/* ============================================================== */}
        {usp11Active ? (
          <>
            <ambientLight intensity={0.5} color="#ff0000" />
            <directionalLight position={[2, 7, 3]} intensity={1.5} color="#ff0000" castShadow />
            <pointLight position={[0, 2, 0]} color="#ff0000" intensity={2} distance={10} decay={2} />
          </>
        ) : usp12Active ? (
          <>
            {/* USP 12: EXTREME SOLAR GLARE SIMULATION */}
            <ambientLight intensity={3.5} color="#fffbeb" />
            <directionalLight position={[10, 5, 10]} intensity={8.0} color="#fef3c7" castShadow />
            <pointLight position={[0, 2, 0]} color="#fbbf24" intensity={4} distance={20} decay={1.5} />
          </>
        ) : usp19Active ? (
          <>
            {/* USP 19: THERMAL-ROBUST OVERHEAT SIMULATION */}
            <ambientLight intensity={0.6} color="#450a0a" />
            <directionalLight position={[2, 7, 3]} intensity={2.0} color="#dc2626" castShadow />
            <pointLight position={[0, 2, 0]} color="#ef4444" intensity={5} distance={15} decay={2} />
          </>
        ) : (
          <>
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
          </>
        )}

        {/* Subtle Sci-Fi Accent Lights for Corridor Depth */}
        <pointLight
          position={[-2.5, 2.2, -1.0]}
          color={usp11Active ? "#ff0000" : usp12Active ? "#fff" : usp19Active ? "#dc2626" : "#06b6d4"}
          intensity={usp12Active ? 0.1 : 1.5}
          distance={8}
          decay={2}
        />
        <pointLight
          position={[2.5, 2.2, -1.0]}
          color={usp11Active ? "#ff0000" : usp12Active ? "#fff" : "#f59e0b"}
          intensity={usp12Active ? 0.1 : 1.2}
          distance={8}
          decay={2}
        />

        {/* ============================================================== */}
        {/* GROUP B: PERCEPTION ENGINE 3D VISUAL EFFECTS                   */}
        {/* ============================================================== */}

        {/* USP 8: Contradiction Guard (Red Blockade on Laptop) */}
        {usp8Active && (
          <mesh position={[-1.6, 0.9, -0.4]}>
            <boxGeometry args={[0.6, 0.4, 0.6]} />
            <meshBasicMaterial color="#ef4444" wireframe transparent opacity={0.6} />
          </mesh>
        )}

        {/* USP 9: Physical Spatial Memory (Teal Ghost Box on Barrels - ignores depth) */}
        {usp9Active && (
          <mesh position={[-2.2, 0.4, -2.2]}>
            <boxGeometry args={[0.8, 0.8, 0.8]} />
            <meshBasicMaterial color="#14b8a6" wireframe transparent opacity={0.8} depthTest={false} />
          </mesh>
        )}

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
        {/* DECOUPLED 3D ENTITIES: Requirement 1                           */}
        {/* - SpaceshipCorridor: Static background room shell               */}
        {/* - PropsManager: Decoupled world props (Station 1, 2, 3, 4)     */}
        {/* - Astronaut: Isolated character entity (Locomotion & Micro 0-G) */}
        {/* ============================================================== */}
        <Suspense fallback={null}>
          <SpaceshipCorridor />
          <PropsManager usp1Active={usp1Active} usp2Active={usp2Active} />
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
