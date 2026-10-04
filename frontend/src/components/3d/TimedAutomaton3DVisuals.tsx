import React, { useState, useEffect, useRef, useMemo, Component, ErrorInfo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import {
  timedAutomatonManager,
  TimedAutomatonState,
} from '../../engine/TimedAutomatonManager.ts';

/**
 * 3D Glowing Vector Filament connecting timeline nodes
 * Uses standard Three.js cylinder mesh for 100% WebGL stability (zero line primitive crashes).
 */
function VectorFilament({
  start,
  end,
  color,
}: {
  start: THREE.Vector3;
  end: THREE.Vector3;
  color: string;
}) {
  const { position, quaternion, length } = useMemo(() => {
    const dir = new THREE.Vector3().subVectors(end, start);
    const len = dir.length();
    const pos = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
    const quat = new THREE.Quaternion().setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      dir.clone().normalize()
    );
    return { position: pos, quaternion: quat, length: len };
  }, [start, end]);

  return (
    <mesh position={position} quaternion={quaternion}>
      <cylinderGeometry args={[0.008, 0.008, length, 8]} />
      <meshBasicMaterial color={color} transparent opacity={0.85} />
    </mesh>
  );
}

/**
 * Local Error Boundary to protect Canvas from black screen crashes
 */
interface ErrorBoundaryProps {
  children: React.ReactNode;
}
interface ErrorBoundaryState {
  hasError: boolean;
}

export class TimedAutomatonErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(_: Error): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[TimedAutomaton3DVisuals] WebGL Component Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return null;
    }
    return this.props.children;
  }
}

/**
 * Inner 3D Visualization Component
 */
function TimedAutomaton3DVisualsInner() {
  const [automatonState, setAutomatonState] = useState<TimedAutomatonState>(() =>
    timedAutomatonManager.getState()
  );
  const ghostGroupRef = useRef<THREE.Group>(null);
  const laserPlaneRef = useRef<THREE.Mesh>(null);

  useEffect(() => {
    return timedAutomatonManager.subscribe((state) => {
      setAutomatonState(state);
    });
  }, []);

  const { status, selectedScript } = automatonState;
  const isActive = status === 'VERIFYING' || status === 'VERIFIED';
  const isVerified = status === 'VERIFIED';

  // Base spatial anchor for the timeline nodes (prominently in front of the main workstation)
  const baseAnchor = useMemo(() => new THREE.Vector3(-0.4, 0.45, 0.35), []);

  const nodePositions = useMemo(() => {
    return selectedScript.timelineSteps.map((step) => {
      return new THREE.Vector3(
        baseAnchor.x + step.offset[0],
        baseAnchor.y + step.offset[1],
        baseAnchor.z + step.offset[2]
      );
    });
  }, [selectedScript, baseAnchor]);

  // Animation Loop with strict null-guards
  useFrame((state) => {
    const elapsed = state.clock.getElapsedTime();

    // Laser verification wave: animate single thin laser plane smoothly along Y-axis using Math.sin(elapsed * 2)
    if (laserPlaneRef.current) {
      laserPlaneRef.current.position.y = 1.0 + Math.sin(elapsed * 2.0) * 0.4;
    }

    // Holographic Ghost fast-forward simulation
    if (ghostGroupRef.current && automatonState.ghostActive) {
      ghostGroupRef.current.position.y = 0.55 + Math.sin(elapsed * 3.0) * 0.06;
      ghostGroupRef.current.position.x = -0.7 + Math.cos(elapsed * 2.0) * 0.08;
      ghostGroupRef.current.rotation.y = -Math.PI / 2 + Math.sin(elapsed * 2.5) * 0.15;
    }
  });

  if (!isActive) {
    return null;
  }

  const filamentColor = isVerified ? '#00ff99' : '#00e5ff';

  return (
    <group id="timed-automaton-3d-system">
      {/* ─── 1. 3D TEMPORAL TIMELINE VECTOR FILAMENTS ────────────────── */}
      {nodePositions.length >= 2 && (
        <VectorFilament
          start={nodePositions[0]}
          end={nodePositions[1]}
          color={filamentColor}
        />
      )}
      {nodePositions.length >= 3 && (
        <VectorFilament
          start={nodePositions[1]}
          end={nodePositions[2]}
          color={filamentColor}
        />
      )}

      {/* ─── 2. 3D TEMPORAL TIMELINE NODES (3 FIXED GLOWING STEP SPHERES) ─── */}
      {selectedScript.timelineSteps.map((step, idx) => {
        const pos = nodePositions[idx];
        const nodeColor = isVerified ? '#00ff99' : '#00e5ff';

        return (
          <group key={step.time} position={pos}>
            {/* Glowing 3D Node Marker Sphere */}
            <mesh>
              <sphereGeometry args={[0.11, 16, 16]} />
              <meshStandardMaterial
                color={nodeColor}
                emissive={nodeColor}
                emissiveIntensity={isVerified ? 2.2 : 1.1}
                roughness={0.2}
                metalness={0.8}
              />
            </mesh>

            {/* Orbiting Node Wireframe Ring */}
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <ringGeometry args={[0.15, 0.18, 24]} />
              <meshBasicMaterial
                color={nodeColor}
                transparent
                opacity={0.8}
                side={THREE.DoubleSide}
              />
            </mesh>

            {/* 3D Floating Billboard Step Label */}
            <Html position={[0, 0.26, 0]} center distanceFactor={8}>
              <div
                style={{
                  fontSize: '9.5px',
                  backgroundColor: 'rgba(2, 8, 16, 0.92)',
                  borderColor: isVerified
                    ? 'rgba(0, 255, 153, 0.7)'
                    : 'rgba(0, 229, 255, 0.5)',
                  boxShadow: isVerified
                    ? '0 0 14px rgba(0, 255, 153, 0.4)'
                    : '0 0 10px rgba(0, 229, 255, 0.3)',
                  color: isVerified ? '#00ff99' : '#00e5ff',
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
                {isVerified && (
                  <span className="text-[7.5px] font-bold px-1 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/40">
                    [OK]
                  </span>
                )}
              </div>
            </Html>
          </group>
        );
      })}

      {/* ─── 3. VERIFICATION LASER WAVE PLANE ───────────────────────── */}
      {status === 'VERIFYING' && (
        <mesh
          ref={laserPlaneRef}
          position={[-0.4, 1.0, 0.35]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <planeGeometry args={[2.4, 2.4]} />
          <meshBasicMaterial
            color="#00ff99"
            transparent
            opacity={0.35}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>
      )}

      {/* ─── 4. HOLOGRAPHIC GHOST SIMULATION (TRANSLUCENT CYAN WIREFRAME OVERLAY) ─── */}
      {automatonState.ghostActive && (
        <group ref={ghostGroupRef} position={[-0.7, 0.55, 0.3]}>
          {/* Ghost Torso */}
          <mesh position={[0, 0.45, 0]}>
            <capsuleGeometry args={[0.26, 0.48, 12, 16]} />
            <meshStandardMaterial
              color="#00e5ff"
              emissive="#00e5ff"
              emissiveIntensity={1.2}
              wireframe
              transparent
              opacity={0.35}
            />
          </mesh>

          {/* Ghost Helmet */}
          <mesh position={[0, 0.9, 0]}>
            <sphereGeometry args={[0.24, 16, 16]} />
            <meshStandardMaterial
              color="#00e5ff"
              emissive="#00e5ff"
              emissiveIntensity={1.4}
              wireframe
              transparent
              opacity={0.35}
            />
          </mesh>

          {/* Ghost Backpack */}
          <mesh position={[0, 0.45, -0.22]}>
            <boxGeometry args={[0.38, 0.52, 0.18]} />
            <meshStandardMaterial
              color="#00e5ff"
              emissive="#00e5ff"
              emissiveIntensity={1.0}
              wireframe
              transparent
              opacity={0.35}
            />
          </mesh>

          {/* Ghost Arms */}
          <mesh position={[-0.32, 0.45, 0.12]} rotation={[0.4, 0, 0.3]}>
            <capsuleGeometry args={[0.08, 0.4, 8, 8]} />
            <meshStandardMaterial
              color="#00e5ff"
              emissive="#00e5ff"
              emissiveIntensity={1.0}
              wireframe
              transparent
              opacity={0.35}
            />
          </mesh>
          <mesh position={[0.32, 0.45, 0.12]} rotation={[0.4, 0, -0.3]}>
            <capsuleGeometry args={[0.08, 0.4, 8, 8]} />
            <meshStandardMaterial
              color="#00e5ff"
              emissive="#00e5ff"
              emissiveIntensity={1.0}
              wireframe
              transparent
              opacity={0.35}
            />
          </mesh>

          {/* Floating Pre-Flight CTL Sim Tag */}
          <Html position={[0, 1.25, 0]} center distanceFactor={8}>
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

      {/* ─── 5. VERIFICATION COMPLETION FLOATING HUD TAG ─────────────── */}
      {isVerified && (
        <group position={[-0.4, 1.85, 0.35]}>
          <Html center distanceFactor={8}>
            <div
              style={{
                backgroundColor: 'rgba(2, 20, 12, 0.95)',
                borderColor: '#00ff99',
                boxShadow: '0 12px 35px rgba(0, 0, 0, 0.9), 0 0 25px rgba(0, 255, 153, 0.5)',
                color: '#00ff99',
              }}
              className="px-3.5 py-1.5 rounded-xl border font-mono font-bold text-[11px] uppercase tracking-wider whitespace-nowrap shadow-2xl flex items-center gap-2 animate-in fade-in zoom-in-95"
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

/**
 * Default Export Wrapped in Error Boundary for 100% Canvas Crash Immunity
 */
export default function TimedAutomaton3DVisuals() {
  return (
    <TimedAutomatonErrorBoundary>
      <TimedAutomaton3DVisualsInner />
    </TimedAutomatonErrorBoundary>
  );
}
