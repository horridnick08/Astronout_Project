import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import {
  timedAutomatonManager,
  TimedAutomatonState,
} from '../../engine/TimedAutomatonManager.ts';

/**
 * TimedAutomaton3DVisuals.tsx
 *
 * WebGL 3D Visualization for UPPAAL CTL Timed Automaton Deadlock Verification:
 * 1. Holographic Ghost Simulation: Translucent cyan wireframe avatar executing motion in fast-forward.
 * 2. 3D Temporal Timeline Nodes: Spatial sequence markers (T+0.0s, T+1.2s, T+2.5s).
 * 3. Verification Laser Sweep: Sweeping emerald green laser plane during symbolic state exploration.
 * 4. Completion State: Solid emerald timeline nodes & floating HUD tag [TIMED AUTOMATON PROVEN: ZERO DEADLOCKS].
 */
export default function TimedAutomaton3DVisuals() {
  const [automatonState, setAutomatonState] = useState<TimedAutomatonState>(() =>
    timedAutomatonManager.getState()
  );
  const ghostGroupRef = useRef<THREE.Group>(null);
  const laserPlaneRef = useRef<THREE.Mesh>(null);
  const laserBeamRef = useRef<THREE.Line>(null);

  useEffect(() => {
    return timedAutomatonManager.subscribe((state) => {
      setAutomatonState(state);
    });
  }, []);

  const { status, selectedScript, verificationProgress, laserSweepX, ghostActive, ghostProgress } =
    automatonState;

  const isActive = status === 'VERIFYING' || status === 'VERIFIED';
  const isVerified = status === 'VERIFIED';

  // Base spatial anchor for the timeline nodes (near astronaut console corridor)
  const baseAnchor = useMemo(() => new THREE.Vector3(-1.0, 0.4, 0.4), []);

  const nodePositions = useMemo(() => {
    return selectedScript.timelineSteps.map((step) => {
      return new THREE.Vector3(
        baseAnchor.x + step.offset[0],
        baseAnchor.y + step.offset[1],
        baseAnchor.z + step.offset[2]
      );
    });
  }, [selectedScript, baseAnchor]);

  // Points for 3D vector connector line
  const timelineLineGeom = useMemo(() => {
    return new THREE.BufferGeometry().setFromPoints(nodePositions);
  }, [nodePositions]);

  // Fast-forward Ghost Animation
  useFrame((_, delta) => {
    if (ghostGroupRef.current && ghostActive) {
      // Rapid fast-forward procedural drift
      const t = automatonState.ghostProgress * Math.PI * 2;
      ghostGroupRef.current.position.y = 0.85 + Math.sin(t * 3) * 0.12;
      ghostGroupRef.current.position.x = -1.0 + Math.cos(t * 2) * 0.18;
      ghostGroupRef.current.rotation.y = -Math.PI / 2 + Math.sin(t * 2.5) * 0.25;
      ghostGroupRef.current.rotation.z = Math.sin(t * 2) * 0.12;
    }
  });

  if (!isActive) {
    return null;
  }

  return (
    <group id="timed-automaton-3d-system">
      {/* ─── 1. 3D TEMPORAL TIMELINE VECTOR LINE ─────────────────────── */}
      {/* @ts-ignore */}
      <line geometry={timelineLineGeom}>
        <lineBasicMaterial
          color={isVerified ? '#00ff99' : '#00e5ff'}
          linewidth={2}
          transparent
          opacity={0.7}
        />
      </line>

      {/* ─── 2. 3D TEMPORAL TIMELINE NODES ───────────────────────────── */}
      {selectedScript.timelineSteps.map((step, idx) => {
        const pos = nodePositions[idx];
        const isPassedByLaser =
          isVerified || (status === 'VERIFYING' && laserSweepX >= pos.x - 0.2);
        const nodeColor = isPassedByLaser ? '#00ff99' : '#00e5ff';

        return (
          <group key={step.time} position={pos}>
            {/* Glowing Diamond / Octahedron Node Marker */}
            <mesh>
              <octahedronGeometry args={[0.12]} />
              <meshStandardMaterial
                color={nodeColor}
                emissive={nodeColor}
                emissiveIntensity={isPassedByLaser ? 1.8 : 0.8}
                wireframe={false}
              />
            </mesh>

            {/* Orbiting Node Wireframe Ring */}
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <ringGeometry args={[0.16, 0.19, 24]} />
              <meshBasicMaterial
                color={nodeColor}
                transparent
                opacity={0.8}
                side={THREE.DoubleSide}
              />
            </mesh>

            {/* 3D Floating Billboard Label for Step */}
            <Html position={[0, 0.28, 0]} center distanceFactor={10}>
              <div
                style={{
                  fontSize: '9.5px',
                  backgroundColor: 'rgba(2, 8, 16, 0.92)',
                  borderColor: isPassedByLaser
                    ? 'rgba(0, 255, 153, 0.7)'
                    : 'rgba(0, 229, 255, 0.5)',
                  boxShadow: isPassedByLaser
                    ? '0 0 14px rgba(0, 255, 153, 0.4)'
                    : '0 0 10px rgba(0, 229, 255, 0.3)',
                  color: isPassedByLaser ? '#00ff99' : '#00e5ff',
                }}
                className="px-2 py-0.5 rounded border font-mono font-bold uppercase tracking-wider whitespace-nowrap shadow-lg flex items-center gap-1.5 transition-all duration-300"
              >
                <span
                  style={{ backgroundColor: nodeColor }}
                  className="w-1.5 h-1.5 rounded-full animate-ping shrink-0"
                />
                <span>
                  {step.time}: {step.label}
                </span>
                {isPassedByLaser && (
                  <span className="text-[7.5px] font-bold px-1 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/40">
                    [OK]
                  </span>
                )}
              </div>
            </Html>
          </group>
        );
      })}

      {/* ─── 3. VERIFICATION LASER SWEEP PLANE ───────────────────────── */}
      {status === 'VERIFYING' && (
        <group position={[laserSweepX, 1.2, 0.2]}>
          {/* Glowing Vertical Laser Sheet */}
          <mesh ref={laserPlaneRef} rotation={[0, Math.PI / 2, 0]}>
            <planeGeometry args={[3.2, 2.4]} />
            <meshBasicMaterial
              color="#00ff99"
              transparent
              opacity={0.35}
              side={THREE.DoubleSide}
              depthWrite={false}
              blending={THREE.AdditiveBlending}
            />
          </mesh>

          {/* High-Luminance Center Beam */}
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.02, 0.02, 2.4, 16]} />
            <meshBasicMaterial color="#ffffff" />
          </mesh>

          {/* Glowing Laser Light Source */}
          <pointLight color="#00ff99" intensity={2.5} distance={5} />
        </group>
      )}

      {/* ─── 4. HOLOGRAPHIC GHOST SIMULATION MESH ────────────────────── */}
      {ghostActive && (
        <group ref={ghostGroupRef} position={[-1.0, 0.85, 0.4]}>
          {/* Ghost Astronaut Torso */}
          <mesh position={[0, 0.45, 0]}>
            <capsuleGeometry args={[0.26, 0.48, 12, 16]} />
            <meshStandardMaterial
              color="#00e5ff"
              emissive="#00e5ff"
              emissiveIntensity={1.4}
              wireframe
              transparent
              opacity={0.55}
            />
          </mesh>

          {/* Ghost Helmet */}
          <mesh position={[0, 0.9, 0]}>
            <sphereGeometry args={[0.24, 16, 16]} />
            <meshStandardMaterial
              color="#00f0ff"
              emissive="#00f0ff"
              emissiveIntensity={1.6}
              wireframe
              transparent
              opacity={0.65}
            />
          </mesh>

          {/* Ghost Backpack / Life Support Pack */}
          <mesh position={[0, 0.45, -0.22]}>
            <boxGeometry args={[0.38, 0.52, 0.18]} />
            <meshStandardMaterial
              color="#00e5ff"
              emissive="#00e5ff"
              emissiveIntensity={1.2}
              wireframe
              transparent
              opacity={0.5}
            />
          </mesh>

          {/* Ghost Floating Arms */}
          <mesh position={[-0.32, 0.45, 0.12]} rotation={[0.4, 0, 0.3]}>
            <capsuleGeometry args={[0.08, 0.4, 8, 8]} />
            <meshStandardMaterial
              color="#00e5ff"
              emissive="#00e5ff"
              emissiveIntensity={1.2}
              wireframe
              transparent
              opacity={0.45}
            />
          </mesh>
          <mesh position={[0.32, 0.45, 0.12]} rotation={[0.4, 0, -0.3]}>
            <capsuleGeometry args={[0.08, 0.4, 8, 8]} />
            <meshStandardMaterial
              color="#00e5ff"
              emissive="#00e5ff"
              emissiveIntensity={1.2}
              wireframe
              transparent
              opacity={0.45}
            />
          </mesh>

          {/* Holographic Pulse Aura Indicator */}
          <Html position={[0, 1.25, 0]} center distanceFactor={10}>
            <div
              style={{
                fontSize: '9px',
                backgroundColor: 'rgba(2, 16, 26, 0.94)',
                borderColor: 'rgba(0, 229, 255, 0.6)',
                color: '#00e5ff',
                boxShadow: '0 0 15px rgba(0, 229, 255, 0.4)',
              }}
              className="px-2 py-0.5 rounded border font-mono font-bold uppercase tracking-wider whitespace-nowrap animate-pulse"
            >
              [HOLOGRAPHIC GHOST // PRE-FLIGHT CTL SIM]
            </div>
          </Html>
        </group>
      )}

      {/* ─── 5. VERIFICATION COMPLETION STATE HUD TAG ───────────────── */}
      {isVerified && (
        <group position={[-1.0, 2.1, 0.4]}>
          <Html center distanceFactor={9}>
            <div
              style={{
                backgroundColor: 'rgba(2, 20, 12, 0.94)',
                borderColor: '#00ff99',
                boxShadow: '0 12px 35px rgba(0, 0, 0, 0.9), 0 0 25px rgba(0, 255, 153, 0.45)',
                color: '#00ff99',
              }}
              className="px-3 py-1.5 rounded-xl border font-mono font-bold text-[10.5px] uppercase tracking-wider whitespace-nowrap shadow-2xl flex items-center gap-2 animate-in fade-in zoom-in-95"
            >
              <span className="w-2 h-2 rounded-full bg-[#00ff99] animate-ping shrink-0" />
              <span>[TIMED AUTOMATON PROVEN: ZERO DEADLOCKS]</span>
            </div>
          </Html>
        </group>
      )}
    </group>
  );
}
