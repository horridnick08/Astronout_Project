import React, { useState, useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, Html } from '@react-three/drei';
import * as THREE from 'three';
import {
  radiationFaultToleranceManager,
  RadiationFaultState,
} from '../../engine/RadiationFaultToleranceManager.ts';

/**
 * SpaceshipServerRack3D.tsx
 *
 * Production 3D Mainframe Server Room & Computer Rack:
 * - Positioned securely on the corridor starboard wall at [2.15, 1.25, -0.4]
 * - 6 Modular Server Memory Blocks (#01 to #06)
 * - Sweeping horizontal laser line (#ff0055 scan / #00ff99 auto-repair)
 *   with exact CSS box-shadow: 0 0 10px #ff0055
 * - Pulsing red bounding box & anomaly callout on RAM Block #04
 */
export default function SpaceshipServerRack3D() {
  const [radState, setRadState] = useState<RadiationFaultState>(() =>
    radiationFaultToleranceManager.getState()
  );

  const pulseMeshRef = useRef<THREE.Mesh>(null);
  const glowMeshRef = useRef<THREE.Mesh>(null);

  useEffect(() => {
    return radiationFaultToleranceManager.subscribe((state) => {
      setRadState(state);
    });
  }, []);

  // Animate bounding box pulse on Block #04
  useFrame((state) => {
    if (pulseMeshRef.current && radState.activeAnomalyBlock === 4) {
      const t = state.clock.getElapsedTime();
      const s = 1 + 0.04 * Math.sin(t * 8);
      pulseMeshRef.current.scale.set(s, s, s);
    }
  });

  const isScanningOrRepairing =
    radState.status === 'SCANNING' || radState.status === 'REPAIRING';

  // Calculate laser sweep Y position from top (+0.82) to bottom (-0.82)
  const laserY = 0.82 - radState.laserProgress * 1.64;
  const laserColor = radState.laserColor || '#ff0055';

  const memoryBlocks = [
    { id: 1, label: 'RAM BLOCK #01', sub: 'PARITY SYNCED', y: 0.62 },
    { id: 2, label: 'RAM BLOCK #02', sub: 'PARITY SYNCED', y: 0.37 },
    { id: 3, label: 'RAM BLOCK #03', sub: 'PARITY SYNCED', y: 0.12 },
    { id: 4, label: 'RAM BLOCK #04', sub: radState.activeAnomalyBlock === 4 ? 'BIT-FLIP ANOMALY' : 'PARITY SYNCED', y: -0.13 },
    { id: 5, label: 'RAM BLOCK #05', sub: 'PARITY SYNCED', y: -0.38 },
    { id: 6, label: 'RAM BLOCK #06', sub: 'PARITY SYNCED', y: -0.63 },
  ];

  return (
    <group
      name="Spaceship_Server_Rack_System"
      position={[2.15, 1.25, -0.4]}
      rotation={[0, -Math.PI / 2, 0]}
    >
      {/* ─── 1. SERVER CABINET CHASSIS ─────────────────────────────────── */}
      {/* Main Server Cabinet Outer Shell */}
      <mesh castShadow receiveShadow position={[0, 0, 0]}>
        <boxGeometry args={[1.08, 1.96, 0.42]} />
        <meshStandardMaterial
          color="#080f1a"
          roughness={0.3}
          metalness={0.88}
        />
      </mesh>

      {/* Internal Recessed Bay Cavity */}
      <mesh position={[0, 0, 0.04]}>
        <boxGeometry args={[0.96, 1.82, 0.36]} />
        <meshStandardMaterial
          color="#030712"
          roughness={0.4}
          metalness={0.92}
        />
      </mesh>

      {/* Side Mounting Rails & Structural Frame Accent */}
      <mesh position={[-0.49, 0, 0.19]}>
        <boxGeometry args={[0.04, 1.88, 0.05]} />
        <meshStandardMaterial color="#00e5ff" metalness={0.9} roughness={0.2} />
      </mesh>
      <mesh position={[0.49, 0, 0.19]}>
        <boxGeometry args={[0.04, 1.88, 0.05]} />
        <meshStandardMaterial color="#00e5ff" metalness={0.9} roughness={0.2} />
      </mesh>

      {/* Top Laser Emitter Bar Housing */}
      <mesh position={[0, 0.88, 0.2]}>
        <boxGeometry args={[0.98, 0.08, 0.08]} />
        <meshStandardMaterial color="#0b1b2b" metalness={0.8} roughness={0.3} />
      </mesh>
      {/* Top Status LED */}
      <mesh position={[0.4, 0.88, 0.24]}>
        <sphereGeometry args={[0.016, 16, 16]} />
        <meshBasicMaterial
          color={isScanningOrRepairing ? laserColor : '#00ff99'}
        />
      </mesh>

      {/* Bottom Cable Conduit Collector */}
      <mesh position={[0, -0.88, 0.2]}>
        <boxGeometry args={[0.98, 0.08, 0.08]} />
        <meshStandardMaterial color="#0b1b2b" metalness={0.8} roughness={0.3} />
      </mesh>

      {/* Header Cabinet Label */}
      <Text
        position={[0, 0.88, 0.245]}
        fontSize={0.032}
        color="#38bdf8"
        anchorX="center"
        anchorY="middle"
      >
        EDGE COMPUTING // TRIPLE MODULAR REDUNDANCY
      </Text>

      {/* ─── 2. 6 INDIVIDUAL SERVER MEMORY BLOCKS ──────────────────────── */}
      {memoryBlocks.map((block) => {
        const isBlock4 = block.id === 4;
        const isFaulty = isBlock4 && radState.activeAnomalyBlock === 4;
        const isRepaired = isBlock4 && radState.status === 'REPAIRED';

        let ledColor = '#00ff99';
        let faceplateColor = '#0f172a';
        let borderColor = '#1e293b';

        if (isFaulty) {
          ledColor = '#ff0055';
          faceplateColor = '#2a0814';
          borderColor = '#ff0055';
        } else if (isRepaired) {
          ledColor = '#00ff99';
          faceplateColor = '#06281e';
          borderColor = '#00ff99';
        }

        return (
          <group key={block.id} position={[0, block.y, 0.16]}>
            {/* Blade Faceplate Body */}
            <mesh castShadow receiveShadow>
              <boxGeometry args={[0.9, 0.21, 0.08]} />
              <meshStandardMaterial
                color={faceplateColor}
                roughness={0.25}
                metalness={0.85}
              />
            </mesh>

            {/* Front Bezel Accent Frame */}
            <lineSegments>
              <edgesGeometry args={[new THREE.BoxGeometry(0.9, 0.21, 0.082)]} />
              <lineBasicMaterial
                color={isFaulty ? '#ff0055' : borderColor}
                linewidth={isFaulty ? 2 : 1}
              />
            </lineSegments>

            {/* Heat Sink Ribs */}
            {[-0.25, -0.15, -0.05, 0.05, 0.15, 0.25].map((xOffset, i) => (
              <mesh key={i} position={[xOffset, 0, 0.042]}>
                <boxGeometry args={[0.05, 0.15, 0.01]} />
                <meshStandardMaterial
                  color="#1e293b"
                  metalness={0.9}
                  roughness={0.2}
                />
              </mesh>
            ))}

            {/* Status LED Cluster */}
            <mesh position={[-0.38, 0.04, 0.045]}>
              <sphereGeometry args={[0.012, 16, 16]} />
              <meshBasicMaterial color={ledColor} />
            </mesh>
            <mesh position={[-0.38, -0.04, 0.045]}>
              <sphereGeometry args={[0.009, 16, 16]} />
              <meshBasicMaterial
                color={isFaulty ? '#ffaa00' : '#00e5ff'}
              />
            </mesh>

            {/* Block 3D Label */}
            <Text
              position={[-0.34, 0.03, 0.045]}
              fontSize={0.024}
              color={isFaulty ? '#ff0055' : '#ffffff'}
              anchorX="left"
              anchorY="middle"
            >
              {block.label}
            </Text>

            <Text
              position={[-0.34, -0.04, 0.045]}
              fontSize={0.018}
              color={isFaulty ? '#ff5577' : '#00ff99'}
              anchorX="left"
              anchorY="middle"
            >
              {isFaulty ? 'BIT-FLIP ANOMALY // 0x04F8A9' : block.sub}
            </Text>

            {/* Handle Pulls */}
            <mesh position={[-0.42, 0, 0.05]}>
              <boxGeometry args={[0.01, 0.14, 0.02]} />
              <meshStandardMaterial color="#64748b" metalness={0.9} />
            </mesh>
            <mesh position={[0.42, 0, 0.05]}>
              <boxGeometry args={[0.01, 0.14, 0.02]} />
              <meshStandardMaterial color="#64748b" metalness={0.9} />
            </mesh>
          </group>
        );
      })}

      {/* ─── 3. ANOMALY HIGHLIGHT: PULSING RED BOUNDING BOX ON BLOCK #04 ── */}
      {radState.activeAnomalyBlock === 4 && (
        <group position={[0, -0.13, 0.16]}>
          {/* Pulsing Wireframe Box */}
          <mesh ref={pulseMeshRef}>
            <boxGeometry args={[0.94, 0.25, 0.12]} />
            <meshBasicMaterial
              color="#ff0055"
              wireframe
              transparent
              opacity={0.85}
            />
          </mesh>

          {/* Anomaly Callout Overlay (Drei Html) */}
          <Html
            position={[0.55, 0.02, 0.1]}
            center={false}
            distanceFactor={3.2}
            style={{ pointerEvents: 'none' }}
          >
            <div className="flex flex-col gap-0.5 px-2 py-1 rounded border border-red-500 bg-red-950/90 text-white font-mono text-[10px] shadow-[0_0_15px_#ff0055] whitespace-nowrap animate-pulse">
              <div className="flex items-center gap-1.5 text-[#ff0055] font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-[#ff0055] animate-ping" />
                <span>BIT-FLIP DETECTED</span>
              </div>
              <span className="text-[9px] text-red-200">
                RAM BLOCK #04 (0x04F8A9)
              </span>
              <span className="text-[8px] text-red-400">
                PARITY MISMATCH // AWAITING AUTO-REPAIR
              </span>
            </div>
          </Html>
        </group>
      )}

      {/* ─── 4. REPAIR SUCCESS GREEN PULSE ON BLOCK #04 ────────────────── */}
      {radState.status === 'REPAIRED' && (
        <group position={[0, -0.13, 0.16]}>
          <mesh>
            <boxGeometry args={[0.94, 0.25, 0.12]} />
            <meshBasicMaterial
              color="#00ff99"
              wireframe
              transparent
              opacity={0.5}
            />
          </mesh>
          <Html
            position={[0.55, 0.02, 0.1]}
            center={false}
            distanceFactor={3.2}
            style={{ pointerEvents: 'none' }}
          >
            <div className="flex flex-col gap-0.5 px-2 py-1 rounded border border-emerald-500 bg-emerald-950/90 text-white font-mono text-[10px] shadow-[0_0_15px_#00ff99] whitespace-nowrap">
              <div className="flex items-center gap-1.5 text-[#00ff99] font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00ff99]" />
                <span>REPAIR VALIDATED</span>
              </div>
              <span className="text-[9px] text-emerald-200">
                3/3 REPLICAS SYNCHRONIZED
              </span>
            </div>
          </Html>
        </group>
      )}

      {/* ─── 5. SWEEPING HORIZONTAL LASER SCANNER LINE ─────────────────── */}
      {isScanningOrRepairing && (
        <group position={[0, laserY, 0.22]}>
          {/* Glowing 3D Laser Rod */}
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.006, 0.006, 0.94, 16]} />
            <meshBasicMaterial color={laserColor} toneMapped={false} />
          </mesh>

          {/* Sweeping Laser Fan/Plane Volume Glow */}
          <mesh position={[0, 0.02, -0.06]} rotation={[-Math.PI / 12, 0, 0]}>
            <planeGeometry args={[0.94, 0.12]} />
            <meshBasicMaterial
              color={laserColor}
              transparent
              opacity={0.3}
              side={THREE.DoubleSide}
              toneMapped={false}
            />
          </mesh>

          {/* Precision HTML Laser Line with requested CSS box-shadow */}
          <Html
            position={[0, 0, 0.01]}
            center
            distanceFactor={3.0}
            style={{ pointerEvents: 'none' }}
          >
            <div
              style={{
                width: '320px',
                height: '2px',
                backgroundColor: laserColor,
                boxShadow:
                  laserColor === '#00ff99'
                    ? '0 0 10px #00ff99, 0 0 20px #00ff99'
                    : '0 0 10px #ff0055, 0 0 20px #ff0055',
                borderRadius: '1px',
              }}
            />
          </Html>
        </group>
      )}
    </group>
  );
}
