import React, { useMemo, useState, useEffect, useRef } from 'react';
import { useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { createStaticNormalizedProp, PACK_PATH } from './propUtils.js';
import { missionTimeline } from '../../engine/useMissionTimeline.ts';

/**
 * QuantumReactorBay.tsx
 * 
 * Station 5: Quantum Core Experiment Station & Interactive Terminal
 * - Positioned cleanly flush along the Starboard side wall structure at Z = -1.35m to -1.75m.
 * - Non-overlapping AABB: X: [1.55, 2.10], Y: [0.5, 2.0], Z: [-2.05, -1.05]
 * - Completely decoupled and non-overlapping with screens (Radar screen ends at Z = -0.75m)
 *   and Observation Window (starts at Z = -2.25m).
 * - Features:
 *   1. Reinforced flush magnetic containment socket at [1.84, 1.25, -1.35]
 *   2. Separately loaded Quantum Core energy module (energy_sphere)
 *   3. Dedicated Interactive Terminal Display & 3D Push-Button Trigger at [1.84, 1.20, -1.75]
 *   4. Depressing the button or astronaut arrival dynamically triggers the 3D Earth Hologram projection!
 */
export default function QuantumReactorBay({ isCoreAttached: propIsCoreAttached }: { isCoreAttached?: boolean }) {
  const { scene } = useGLTF(PACK_PATH);
  const [timelineState, setTimelineState] = useState(missionTimeline.getState());
  const [isHovered, setIsHovered] = useState(false);
  const buttonRef = useRef<THREE.Group>(null);

  useEffect(() => {
    return missionTimeline.subscribe((state) => {
      setTimelineState(state);
    });
  }, []);

  const isCoreAttached = propIsCoreAttached !== undefined ? propIsCoreAttached : timelineState.isCoreAttached;
  const isHologramActive = timelineState.isHologramActive;

  // Quantum Core 3D Mesh
  const coreObj = useMemo(() => {
    if (!scene) return null;

    const rawCore = scene.getObjectByName('energy_sphere');
    const core = createStaticNormalizedProp(rawCore, 0.44, true);

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
            emissiveIntensity: 3.2,
            roughness: 0.08,
            metalness: 0.92,
            toneMapped: false
          });
          c.updateMatrix();
        }
      });
      core.updateMatrix();
    }

    return core;
  }, [scene]);

  // Interactive Terminal Screen Canvas
  const { canvasTerminal, texTerminal } = useMemo(() => {
    const c = document.createElement('canvas');
    c.width = 512;
    c.height = 384;
    const tex = new THREE.CanvasTexture(c);
    tex.generateMipmaps = false;
    tex.minFilter = THREE.LinearFilter;
    return { canvasTerminal: c, texTerminal: tex };
  }, []);

  const socketLightRef = useRef<THREE.PointLight>(null);

  // Live render interactive terminal screen
  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    const activeCoreAttached = propIsCoreAttached !== undefined ? propIsCoreAttached : missionTimeline.getIsCoreAttached();

    // Toggle socket core visibility in real-time when extracted/docked
    if (coreObj) {
      coreObj.visible = !activeCoreAttached;
    }

    if (socketLightRef.current) {
      socketLightRef.current.intensity = THREE.MathUtils.lerp(
        socketLightRef.current.intensity,
        activeCoreAttached ? 0.35 : 2.8,
        0.2
      );
    }

    // Smooth button mechanical push depression animation
    if (buttonRef.current) {
      const targetZ = isHologramActive ? -0.016 : 0.005;
      buttonRef.current.position.z = THREE.MathUtils.lerp(buttonRef.current.position.z, targetZ, 0.2);
    }

    const ctx = canvasTerminal.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#020617';
      ctx.fillRect(0, 0, 512, 384);

      // Border Bezel
      ctx.strokeStyle = isHologramActive ? '#10b981' : '#0284c7';
      ctx.lineWidth = 3;
      ctx.strokeRect(10, 10, 492, 364);

      // Header
      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 16px "JetBrains Mono", monospace';
      ctx.fillText('QUANTUM CORE INTERFACE // SECTOR 4', 24, 38);

      ctx.fillStyle = '#94a3b8';
      ctx.font = '12px "JetBrains Mono", monospace';
      ctx.fillText('POWER BUS: 1.21 GW   MAGNETIC FLUX: 100% NOMINAL', 24, 58);

      // Core State
      ctx.fillStyle = 'rgba(6, 182, 212, 0.15)';
      ctx.fillRect(24, 76, 464, 48);
      ctx.strokeStyle = '#06b6d4';
      ctx.strokeRect(24, 76, 464, 48);
      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 12px "JetBrains Mono", monospace';
      ctx.fillText('CORE MODULE STATUS:', 36, 96);
      ctx.fillStyle = isCoreAttached ? '#facc15' : '#34d399';
      ctx.fillText(isCoreAttached ? '● EXTRACTED // IN EVA HARNESS' : '● DOCKED // CONTAINMENT SECURE', 210, 96);

      // Hologram Projection Controls
      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 14px "JetBrains Mono", monospace';
      ctx.fillText('HOLOGRAM PROJECTION CONTROLLER:', 24, 155);

      // Projection Status Box
      ctx.fillStyle = isHologramActive ? 'rgba(16, 185, 129, 0.25)' : 'rgba(15, 23, 42, 0.8)';
      ctx.fillRect(24, 170, 464, 70);
      ctx.strokeStyle = isHologramActive ? '#10b981' : '#334155';
      ctx.lineWidth = 2;
      ctx.strokeRect(24, 170, 464, 70);

      ctx.fillStyle = isHologramActive ? '#34d399' : '#94a3b8';
      ctx.font = 'bold 15px "JetBrains Mono", monospace';
      ctx.fillText(
        isHologramActive ? '● 3D EARTH HOLOGRAM: PROJECTED' : '○ 3D EARTH HOLOGRAM: STANDBY',
        38,
        198
      );

      ctx.font = '12px "JetBrains Mono", monospace';
      ctx.fillStyle = isHologramActive ? '#6ee7b7' : '#00e5ff';
      ctx.fillText(
        isHologramActive
          ? 'ORBITAL RADIUS: 520mm // DOWNLINK SYNCHRONIZED'
          : '>>> PRESS 3D BUTTON BELOW TO PROJECT HOLOGRAM <<<',
        38,
        224
      );

      // Power Grid Sine Pulse
      ctx.strokeStyle = isHologramActive ? '#10b981' : '#0284c7';
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let px = 24; px <= 488; px += 4) {
        const py = 300 + Math.sin((px + t * 40) * 0.05) * (isHologramActive ? 22 : 8);
        if (px === 24) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();

      // Bottom Interactive Instruction
      ctx.fillStyle = '#94a3b8';
      ctx.font = '11px "JetBrains Mono", monospace';
      ctx.fillText('INTERACTIVE TRIGGER: CLICK PHYSICAL BUTTON IN 3D SCENE', 24, 355);

      texTerminal.needsUpdate = true;
    }
  });

  return (
    <group name="Quantum_Reactor_And_Interactive_Terminal">
      {/* ===================================================================== */}
      {/* 1. QUANTUM CORE DOCKING BAY SLOT [1.84, 1.25, -1.35]                  */}
      {/* ===================================================================== */}
      <group position={[1.84, 1.25, -1.35]} name="Reactor_Bay_Slot">
        {/* Heavy Bulkhead Mounting Collar */}
        <mesh position={[0.08, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.32, 0.36, 0.12, 32]} />
          <meshStandardMaterial color="#090d16" metalness={0.92} roughness={0.2} />
        </mesh>

        {/* Magnetic Containment Field Ring */}
        <mesh position={[0.06, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <torusGeometry args={[0.32, 0.025, 16, 36]} />
          <meshBasicMaterial color="#00e5ff" />
        </mesh>

        {/* Interior Chamber Illumination */}
        <pointLight
          ref={socketLightRef}
          position={[0, 0, 0]}
          color="#00e5ff"
          intensity={2.8}
          distance={3.2}
          decay={2}
        />

        {/* Quantum Core (rendered inside socket when docked) */}
        {coreObj && (
          <group position={[-0.04, 0, 0]}>
            <primitive object={coreObj} position={[0, 0, 0]} />
          </group>
        )}
      </group>

      {/* ===================================================================== */}
      {/* 2. DEDICATED INTERACTIVE TERMINAL DISPLAY & 3D BUTTON TRIGGER         */}
      {/*    Mounted adjacent to Quantum Core at [1.84, 1.20, -1.75]            */}
      {/* ===================================================================== */}
      <group position={[1.84, 1.20, -1.75]} rotation={[0, -Math.PI / 2, 0]} name="Quantum_Interactive_Terminal">
        {/* Terminal Chassis */}
        <mesh position={[0, 0, -0.04]}>
          <boxGeometry args={[0.82, 0.95, 0.08]} />
          <meshStandardMaterial color="#090d16" metalness={0.92} roughness={0.25} />
        </mesh>

        {/* Bevel Rim */}
        <mesh position={[0, 0, 0.002]}>
          <boxGeometry args={[0.78, 0.91, 0.01]} />
          <meshStandardMaterial color="#1e293b" metalness={0.85} roughness={0.3} />
        </mesh>

        {/* Interactive Screen Face */}
        <mesh position={[0, 0.08, 0.01]}>
          <planeGeometry args={[0.74, 0.68]} />
          <meshBasicMaterial map={texTerminal} />
        </mesh>

        {/* =================================================================== */}
        {/* 3D TACTILE INTERACTIVE TRIGGER BUTTON                               */}
        {/* =================================================================== */}
        <group position={[0, -0.34, 0.06]} rotation={[0.4, 0, 0]}>
          {/* Angled Console Shelf Ledge */}
          <mesh position={[0, 0, -0.02]}>
            <boxGeometry args={[0.76, 0.05, 0.18]} />
            <meshStandardMaterial color="#0f172a" metalness={0.9} roughness={0.3} />
          </mesh>

          {/* Button Outer Bezel Collar */}
          <mesh position={[0, 0.03, 0]}>
            <cylinderGeometry args={[0.072, 0.082, 0.025, 24]} />
            <meshStandardMaterial color="#090d16" metalness={0.92} roughness={0.2} />
          </mesh>

          {/* Illuminated Accent Collar Ring */}
          <mesh position={[0, 0.045, 0]}>
            <torusGeometry args={[0.068, 0.006, 12, 24]} />
            <meshBasicMaterial color={isHologramActive ? '#10b981' : '#00e5ff'} />
          </mesh>

          {/* Physical 3D Push-Button Cap (Moves down when clicked/active) */}
          <group
            ref={buttonRef}
            position={[0, 0.05, 0]}
            onClick={(e) => {
              e.stopPropagation();
              missionTimeline.toggleHologram();
            }}
            onPointerOver={(e) => {
              e.stopPropagation();
              setIsHovered(true);
              document.body.style.cursor = 'pointer';
            }}
            onPointerOut={() => {
              setIsHovered(false);
              document.body.style.cursor = 'default';
            }}
          >
            <mesh>
              <cylinderGeometry args={[0.058, 0.062, 0.032, 24]} />
              <meshStandardMaterial
                color={isHologramActive ? '#10b981' : isHovered ? '#38bdf8' : '#0284c7'}
                emissive={isHologramActive ? '#059669' : '#00e5ff'}
                emissiveIntensity={isHologramActive ? 2.4 : isHovered ? 2.0 : 1.2}
                roughness={0.2}
                metalness={0.8}
              />
            </mesh>

            {/* Glowing Center Cap Glyph */}
            <mesh position={[0, 0.017, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <ringGeometry args={[0.018, 0.038, 16]} />
              <meshBasicMaterial color="#ffffff" toneMapped={false} />
            </mesh>

            {/* Dynamic Button Light Glow */}
            <pointLight
              position={[0, 0.08, 0]}
              color={isHologramActive ? '#10b981' : '#00e5ff'}
              intensity={isHologramActive ? 1.8 : 0.8}
              distance={1.5}
              decay={2}
            />
          </group>
        </group>

        {/* Terminal Ambient Light */}
        <pointLight position={[0, 0.2, 0.4]} color={isHologramActive ? '#10b981' : '#00e5ff'} intensity={1.4} distance={2.2} decay={2} />
      </group>
    </group>
  );
}

useGLTF.preload(PACK_PATH);
