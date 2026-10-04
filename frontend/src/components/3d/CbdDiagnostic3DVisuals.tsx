import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import {
  cbdDiagnosticManager,
  CbdDiagnosticState,
} from '../../engine/CbdDiagnosticManager.ts';

/**
 * CbdDiagnostic3DVisuals.tsx
 *
 * WebGL 3D Visualization for Reiter's CBD Diagnostic Engine
 * ──────────────────────────────────────────────────────────
 * 1. Slower 3D Scanning Laser Plane Wave:
 *    - Reduced wave velocity by ~60% for a smooth, realistic sci-fi sweep.
 *    - Sweeps gently across corridor volume with high-luminance forward laser beam.
 * 2. Module 1: Camera Pipeline Check (CAM_01 -> CAM_02 -> CAM_02 REPAIRED -> ALL STREAMS NOMINAL)
 *    - Sequential display: strictly one node badge at a time.
 * 3. Module 2: AI Core Module Sweep (NPU -> NEURAL HEAD #03 -> LLM LATENCY -> AI CORE OPTIMAL)
 *    - Focused wireframe matrix box around central AI rack station.
 * 4. Strictly 10px monospace compact badges (3px 8px) with Dark Navy Glass backdrop.
 */

export default function CbdDiagnostic3DVisuals() {
  const [diagState, setDiagState] = useState<CbdDiagnosticState>(() => cbdDiagnosticManager.getState());
  const planeGroupRef = useRef<THREE.Group>(null);
  const aiMatrixGroupRef = useRef<THREE.Group>(null);
  const pulseRef = useRef(0);

  useEffect(() => {
    return cbdDiagnosticManager.subscribe((state) => {
      setDiagState(state);
    });
  }, []);

  const isScanning = diagState.status === 'SCANNING';
  const { step, targets, laserSweepY, scanType } = diagState;

  // Box geometry for target reticles
  const targetBoxGeom = useMemo(() => new THREE.BoxGeometry(0.7, 0.7, 0.7), []);
  const targetEdgesGeom = useMemo(() => new THREE.EdgesGeometry(targetBoxGeom), [targetBoxGeom]);

  // AI Core focused wireframe matrix box geometry
  const aiBoxGeom = useMemo(() => new THREE.BoxGeometry(1.3, 1.3, 1.3), []);
  const aiBoxEdgesGeom = useMemo(() => new THREE.EdgesGeometry(aiBoxGeom), [aiBoxGeom]);

  // Corner CAD brackets
  const cornerLinesGeom = useMemo(() => {
    const s = 0.35;
    const len = 0.12;
    const points: THREE.Vector3[] = [];
    const signs = [
      [-1, -1, -1], [1, -1, -1], [-1, 1, -1], [1, 1, -1],
      [-1, -1, 1], [1, -1, 1], [-1, 1, 1], [1, 1, 1]
    ];
    signs.forEach(([sx, sy, sz]) => {
      const vx = sx * s;
      const vy = sy * s;
      const vz = sz * s;
      points.push(new THREE.Vector3(vx, vy, vz));
      points.push(new THREE.Vector3(vx - sx * len, vy, vz));
      points.push(new THREE.Vector3(vx, vy, vz));
      points.push(new THREE.Vector3(vx, vy - sy * len, vz));
      points.push(new THREE.Vector3(vx, vy, vz));
      points.push(new THREE.Vector3(vx, vy, vz - sz * len));
    });
    return new THREE.BufferGeometry().setFromPoints(points);
  }, []);

  // Update plane animation and matrix rotation smoothly on frame
  useFrame(({ clock }) => {
    if (!isScanning) return;
    const t = clock.getElapsedTime();
    pulseRef.current = t;
    if (planeGroupRef.current) {
      planeGroupRef.current.position.y = laserSweepY;
    }
    if (aiMatrixGroupRef.current) {
      aiMatrixGroupRef.current.rotation.y = t * 0.45;
      aiMatrixGroupRef.current.rotation.x = Math.sin(t * 0.3) * 0.08;
    }
  });

  if (!isScanning) return null;

  return (
    <group name="cbd-diagnostic-3d-visuals">
      {/* ───────────────────────────────────────────────────────────── */}
      {/* 1. SLOWER SWEEPING 3D LASER SCANNING GRID PLANE (~60% Slower) */}
      {/* ───────────────────────────────────────────────────────────── */}
      <group ref={planeGroupRef} position={[0, laserSweepY, -4]}>
        {/* Soft cyan scanning plane */}
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[7.8, 30, 24, 48]} />
          <meshBasicMaterial
            color="#00f0ff"
            transparent
            opacity={0.16}
            side={THREE.DoubleSide}
            depthWrite={false}
            wireframe
          />
        </mesh>

        {/* Luminous laser beam bar across corridor width */}
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[7.5, 0.12]} />
          <meshBasicMaterial
            color="#ffffff"
            transparent
            opacity={0.85}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>

        {/* Secondary soft glow ribbon */}
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[7.6, 0.7]} />
          <meshBasicMaterial
            color="#00f0ff"
            transparent
            opacity={0.25}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>
      </group>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* MODULE 1: SPECTRAL GLARE & AMBIENT ADAPTATION                 */}
      {/* ───────────────────────────────────────────────────────────── */}
      {scanType === 'GLARE_ADAPTATION' && (
        <>
          {/* STEP 1 & 2: ONLY CAM_02 -> High Glare / Spectral Distortion Spike */}
          {(step === 1 || step === 2) && targets[1] && (
            <group position={targets[1].position}>
              <pointLight color="#ff3300" intensity={4.8} distance={7} decay={2} />
              <mesh>
                <sphereGeometry args={[0.16, 16, 16]} />
                <meshBasicMaterial color="#ff2a00" transparent opacity={0.85} />
              </mesh>
              <mesh rotation={[0, 0, pulseRef.current * 2]}>
                <ringGeometry args={[0.18, 0.72, 32]} />
                <meshBasicMaterial
                  color="#ffaa00"
                  transparent
                  opacity={0.55}
                  side={THREE.DoubleSide}
                  depthWrite={false}
                  blending={THREE.AdditiveBlending}
                />
              </mesh>
              <lineSegments geometry={targetEdgesGeom}>
                <lineBasicMaterial color="#ffaa00" linewidth={2} transparent opacity={0.95} />
              </lineSegments>
              <lineSegments geometry={cornerLinesGeom}>
                <lineBasicMaterial color="#ff3300" linewidth={3} transparent opacity={1.0} />
              </lineSegments>
              <Html position={[0, 0.58, 0]} center distanceFactor={14} style={{ pointerEvents: 'none' }}>
                <div
                  style={{
                    fontFamily: 'monospace',
                    fontSize: '10px',
                    fontWeight: 'bold',
                    color: '#ffaa00',
                    backgroundColor: 'rgba(20, 8, 8, 0.92)',
                    borderColor: 'rgba(255, 170, 0, 0.9)',
                    boxShadow: '0 0 16px rgba(255, 80, 0, 0.6), 0 0 6px rgba(255, 170, 0, 0.9)',
                    padding: '2.5px 7px',
                    borderRadius: '4px',
                    borderWidth: '1px',
                    borderStyle: 'solid',
                    whiteSpace: 'nowrap',
                    textShadow: '0 0 6px rgba(255, 170, 0, 0.9)',
                    animation: 'pulse 0.6s infinite',
                  }}
                >
                  [CAM_02: HIGH GLARE / SPECTRAL DISTORTION]
                </div>
              </Html>
            </group>
          )}

          {/* STEP 3 & 4: ONLY CAM_02 -> Cyan Calibrated Box [CAM_02: SPECTRAL ADAPTED & REPAIRED] */}
          {(step === 3 || step === 4) && targets[1] && (
            <group position={targets[1].position}>
              <pointLight color="#00f0ff" intensity={2.4} distance={5} decay={2} />
              <mesh rotation={[0, 0, -pulseRef.current * 1.5]}>
                <ringGeometry args={[0.22, 0.65, 32]} />
                <meshBasicMaterial
                  color="#00f0ff"
                  transparent
                  opacity={0.4}
                  side={THREE.DoubleSide}
                  depthWrite={false}
                  blending={THREE.AdditiveBlending}
                />
              </mesh>
              <lineSegments geometry={targetEdgesGeom}>
                <lineBasicMaterial color="#00f0ff" linewidth={2} transparent opacity={0.95} />
              </lineSegments>
              <lineSegments geometry={cornerLinesGeom}>
                <lineBasicMaterial color="#00f0ff" linewidth={3} transparent opacity={1.0} />
              </lineSegments>
              <mesh>
                <boxGeometry args={[0.45, 0.45, 0.45]} />
                <meshBasicMaterial color="#00f0ff" wireframe transparent opacity={0.4} />
              </mesh>
              <Html position={[0, 0.58, 0]} center distanceFactor={14} style={{ pointerEvents: 'none' }}>
                <div
                  style={{
                    fontFamily: 'monospace',
                    fontSize: '10px',
                    fontWeight: 'bold',
                    color: '#00f0ff',
                    backgroundColor: 'rgba(6, 18, 28, 0.92)',
                    borderColor: 'rgba(0, 240, 255, 0.85)',
                    boxShadow: '0 0 16px rgba(0, 240, 255, 0.6), 0 0 6px rgba(0, 240, 255, 0.9)',
                    padding: '2.5px 7px',
                    borderRadius: '4px',
                    borderWidth: '1px',
                    borderStyle: 'solid',
                    whiteSpace: 'nowrap',
                    textShadow: '0 0 8px rgba(0, 240, 255, 0.9)',
                  }}
                >
                  [CAM_02: SPECTRAL ADAPTED & REPAIRED]
                </div>
              </Html>
            </group>
          )}
        </>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* MODULE 2: CAMERA PIPELINE CONSISTENCY CHECK (CAM 01 - 04)     */}
      {/* ───────────────────────────────────────────────────────────── */}
      {scanType === 'CAMERA_PIPELINE' && (
        <>
          {/* STEP 1: Strictly CAM_01 */}
          {step === 1 && targets[0] && (
            <group position={targets[0].position}>
              <lineSegments geometry={targetEdgesGeom}>
                <lineBasicMaterial color="#00ff99" linewidth={2} transparent opacity={0.9} />
              </lineSegments>
              <lineSegments geometry={cornerLinesGeom}>
                <lineBasicMaterial color="#00ff99" linewidth={3} transparent opacity={1.0} />
              </lineSegments>
              <Html position={[0, 0.55, 0]} center distanceFactor={14} style={{ pointerEvents: 'none' }}>
                <div
                  style={{
                    fontFamily: 'monospace',
                    fontSize: '10px',
                    fontWeight: 'bold',
                    color: '#00ff99',
                    backgroundColor: 'rgba(10, 20, 30, 0.88)',
                    borderColor: 'rgba(0, 255, 153, 0.7)',
                    boxShadow: '0 0 12px rgba(0, 255, 153, 0.4)',
                    padding: '2.5px 7px',
                    borderRadius: '4px',
                    borderWidth: '1px',
                    borderStyle: 'solid',
                    whiteSpace: 'nowrap',
                    textShadow: '0 0 6px rgba(0, 255, 153, 0.8)',
                  }}
                >
                  [CAM_01: ONLINE]
                </div>
              </Html>
            </group>
          )}

          {/* STEP 2: Strictly CAM_02 */}
          {step === 2 && targets[1] && (
            <group position={targets[1].position}>
              <lineSegments geometry={targetEdgesGeom}>
                <lineBasicMaterial color="#00ff99" linewidth={2} transparent opacity={0.9} />
              </lineSegments>
              <lineSegments geometry={cornerLinesGeom}>
                <lineBasicMaterial color="#00ff99" linewidth={3} transparent opacity={1.0} />
              </lineSegments>
              <Html position={[0, 0.55, 0]} center distanceFactor={14} style={{ pointerEvents: 'none' }}>
                <div
                  style={{
                    fontFamily: 'monospace',
                    fontSize: '10px',
                    fontWeight: 'bold',
                    color: '#00ff99',
                    backgroundColor: 'rgba(10, 20, 30, 0.88)',
                    borderColor: 'rgba(0, 255, 153, 0.7)',
                    boxShadow: '0 0 12px rgba(0, 255, 153, 0.4)',
                    padding: '2.5px 7px',
                    borderRadius: '4px',
                    borderWidth: '1px',
                    borderStyle: 'solid',
                    whiteSpace: 'nowrap',
                    textShadow: '0 0 6px rgba(0, 255, 153, 0.8)',
                  }}
                >
                  [CAM_02: ONLINE]
                </div>
              </Html>
            </group>
          )}

          {/* STEP 3: Strictly CAM_03 */}
          {step === 3 && targets[2] && (
            <group position={targets[2].position}>
              <lineSegments geometry={targetEdgesGeom}>
                <lineBasicMaterial color="#00ff99" linewidth={2} transparent opacity={0.9} />
              </lineSegments>
              <lineSegments geometry={cornerLinesGeom}>
                <lineBasicMaterial color="#00ff99" linewidth={3} transparent opacity={1.0} />
              </lineSegments>
              <Html position={[0, 0.55, 0]} center distanceFactor={14} style={{ pointerEvents: 'none' }}>
                <div
                  style={{
                    fontFamily: 'monospace',
                    fontSize: '10px',
                    fontWeight: 'bold',
                    color: '#00ff99',
                    backgroundColor: 'rgba(10, 20, 30, 0.88)',
                    borderColor: 'rgba(0, 255, 153, 0.7)',
                    boxShadow: '0 0 12px rgba(0, 255, 153, 0.4)',
                    padding: '2.5px 7px',
                    borderRadius: '4px',
                    borderWidth: '1px',
                    borderStyle: 'solid',
                    whiteSpace: 'nowrap',
                    textShadow: '0 0 6px rgba(0, 255, 153, 0.8)',
                  }}
                >
                  [CAM_03: ONLINE]
                </div>
              </Html>
            </group>
          )}

          {/* STEP 4: Strictly CAM_04 */}
          {step === 4 && targets[3] && (
            <group position={targets[3].position}>
              <lineSegments geometry={targetEdgesGeom}>
                <lineBasicMaterial color="#00ff99" linewidth={2} transparent opacity={0.9} />
              </lineSegments>
              <lineSegments geometry={cornerLinesGeom}>
                <lineBasicMaterial color="#00ff99" linewidth={3} transparent opacity={1.0} />
              </lineSegments>
              <Html position={[0, 0.55, 0]} center distanceFactor={14} style={{ pointerEvents: 'none' }}>
                <div
                  style={{
                    fontFamily: 'monospace',
                    fontSize: '10px',
                    fontWeight: 'bold',
                    color: '#00ff99',
                    backgroundColor: 'rgba(10, 20, 30, 0.88)',
                    borderColor: 'rgba(0, 255, 153, 0.75)',
                    boxShadow: '0 0 16px rgba(0, 255, 153, 0.5)',
                    padding: '2.5px 7px',
                    borderRadius: '4px',
                    borderWidth: '1px',
                    borderStyle: 'solid',
                    whiteSpace: 'nowrap',
                    textShadow: '0 0 6px rgba(0, 255, 153, 0.8)',
                  }}
                >
                  [ALL 4 STREAMS NOMINAL]
                </div>
              </Html>
            </group>
          )}
        </>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* MODULE 3: AI CORE & NEURAL MODULE SWEEP (AI Core Station)     */}
      {/* ───────────────────────────────────────────────────────────── */}
      {scanType === 'EDGE_AI_MODULES' && (
        <group position={[0, 1.35, -2.4]}>
          {/* Animated Rotating Wireframe Matrix Box */}
          <group ref={aiMatrixGroupRef}>
            <lineSegments geometry={aiBoxEdgesGeom}>
              <lineBasicMaterial color={step === 4 ? '#00ff99' : '#00f0ff'} linewidth={2} transparent opacity={0.85} />
            </lineSegments>
            <mesh>
              <boxGeometry args={[1.3, 1.3, 1.3]} />
              <meshBasicMaterial color={step === 4 ? '#00ff99' : '#00f0ff'} wireframe transparent opacity={0.12} />
            </mesh>
            <lineSegments geometry={cornerLinesGeom}>
              <lineBasicMaterial color={step === 4 ? '#00ff99' : '#00f0ff'} linewidth={3} transparent opacity={1.0} />
            </lineSegments>
          </group>

          {/* Core Central Pulsing Sphere */}
          <mesh>
            <sphereGeometry args={[0.18, 16, 16]} />
            <meshBasicMaterial color={step === 4 ? '#00ff99' : '#00f0ff'} wireframe transparent opacity={0.65} />
          </mesh>

          {/* Strictly ONE badge visible per step on AI matrix */}
          {step === 1 && (
            <Html position={[0, 0.95, 0]} center distanceFactor={14} style={{ pointerEvents: 'none' }}>
              <div
                style={{
                  fontFamily: 'monospace',
                  fontSize: '10px',
                  fontWeight: 'bold',
                  color: '#00f0ff',
                  backgroundColor: 'rgba(10, 20, 30, 0.88)',
                  borderColor: 'rgba(0, 240, 255, 0.75)',
                  boxShadow: '0 0 14px rgba(0, 240, 255, 0.4)',
                  padding: '2.5px 7px',
                  borderRadius: '4px',
                  borderWidth: '1px',
                  borderStyle: 'solid',
                  whiteSpace: 'nowrap',
                  textShadow: '0 0 6px rgba(0, 240, 255, 0.8)',
                }}
              >
                [NPU THREADS: ALLOCATED]
              </div>
            </Html>
          )}

          {step === 2 && (
            <Html position={[0, 0.95, 0]} center distanceFactor={14} style={{ pointerEvents: 'none' }}>
              <div
                style={{
                  fontFamily: 'monospace',
                  fontSize: '10px',
                  fontWeight: 'bold',
                  color: '#00ff99',
                  backgroundColor: 'rgba(10, 20, 30, 0.88)',
                  borderColor: 'rgba(0, 255, 153, 0.75)',
                  boxShadow: '0 0 14px rgba(0, 255, 153, 0.4)',
                  padding: '2.5px 7px',
                  borderRadius: '4px',
                  borderWidth: '1px',
                  borderStyle: 'solid',
                  whiteSpace: 'nowrap',
                  textShadow: '0 0 6px rgba(0, 255, 153, 0.8)',
                }}
              >
                [NEURAL HEAD SYNCHRONIZED]
              </div>
            </Html>
          )}

          {step === 3 && (
            <Html position={[0, 0.95, 0]} center distanceFactor={14} style={{ pointerEvents: 'none' }}>
              <div
                style={{
                  fontFamily: 'monospace',
                  fontSize: '10px',
                  fontWeight: 'bold',
                  color: '#00f0ff',
                  backgroundColor: 'rgba(10, 20, 30, 0.88)',
                  borderColor: 'rgba(0, 240, 255, 0.75)',
                  boxShadow: '0 0 14px rgba(0, 240, 255, 0.4)',
                  padding: '2.5px 7px',
                  borderRadius: '4px',
                  borderWidth: '1px',
                  borderStyle: 'solid',
                  whiteSpace: 'nowrap',
                  textShadow: '0 0 6px rgba(0, 240, 255, 0.8)',
                }}
              >
                [LLM LATENCY: 8ms OK]
              </div>
            </Html>
          )}

          {step === 4 && (
            <Html position={[0, 0.95, 0]} center distanceFactor={14} style={{ pointerEvents: 'none' }}>
              <div
                style={{
                  fontFamily: 'monospace',
                  fontSize: '10px',
                  fontWeight: 'bold',
                  color: '#00ff99',
                  backgroundColor: 'rgba(10, 20, 30, 0.88)',
                  borderColor: 'rgba(0, 255, 153, 0.75)',
                  boxShadow: '0 0 14px rgba(0, 255, 153, 0.4)',
                  padding: '2.5px 7px',
                  borderRadius: '4px',
                  borderWidth: '1px',
                  borderStyle: 'solid',
                  whiteSpace: 'nowrap',
                  textShadow: '0 0 6px rgba(0, 255, 153, 0.8)',
                }}
              >
                [AI CORE OPTIMAL]
              </div>
            </Html>
          )}
        </group>
      )}
    </group>
  );
}
