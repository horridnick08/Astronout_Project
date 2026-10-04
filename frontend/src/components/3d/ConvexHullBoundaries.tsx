import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { boundaryManager, BoundaryState, WORKSPACE_ZONES } from '../../engine/BoundaryManager.ts';

/**
 * ConvexHullBoundaries.tsx
 *
 * Volumetric Workspace Convex Hull Boundary System (In-Scene Visuals):
 * - Renders clean, high-precision 3D wireframe bounding box & convex mesh around active workstation
 * - Color-coded status focus zones:
 *   - Cyan (#00f0ff): Standard Operational / Inspection Focus Zone
 *   - Orange (#ff9900): Maintenance / Data Sync Zone
 *   - Red (#ff2200): High-Energy / Hazard Isolation Zone
 * - Corner reticles, scanning grid plane, and floating 3D holographic status badge
 */
export default function ConvexHullBoundaries() {
  const [boundaryState, setBoundaryState] = useState<BoundaryState>(boundaryManager.getState());
  const scanPlaneRef = useRef<THREE.Mesh>(null);
  const volumeMeshRef = useRef<THREE.Mesh>(null);

  useEffect(() => {
    return boundaryManager.subscribe((state) => {
      setBoundaryState(state);
    });
  }, []);

  const { activeZone, wireframeVisible } = boundaryState;

  // Compute EdgesGeometry for ultra-crisp line rendering
  const boxGeom = useMemo(() => {
    return new THREE.BoxGeometry(activeZone.size[0], activeZone.size[1], activeZone.size[2]);
  }, [activeZone.size]);

  const edgesGeom = useMemo(() => {
    return new THREE.EdgesGeometry(boxGeom);
  }, [boxGeom]);

  // Corner L-bracket line segments for sci-fi CAD look
  const cornerLinesGeom = useMemo(() => {
    const [w, h, d] = activeZone.size;
    const hw = w / 2;
    const hh = h / 2;
    const hd = d / 2;
    const len = Math.min(0.18, Math.min(w, Math.min(h, d)) * 0.28);

    const points: THREE.Vector3[] = [];
    const signs = [
      [-1, -1, -1], [1, -1, -1], [-1, 1, -1], [1, 1, -1],
      [-1, -1, 1], [1, -1, 1], [-1, 1, 1], [1, 1, 1]
    ];

    signs.forEach(([sx, sy, sz]) => {
      const vx = sx * hw;
      const vy = sy * hh;
      const vz = sz * hd;
      // Line along X
      points.push(new THREE.Vector3(vx, vy, vz));
      points.push(new THREE.Vector3(vx - sx * len, vy, vz));
      // Line along Y
      points.push(new THREE.Vector3(vx, vy, vz));
      points.push(new THREE.Vector3(vx, vy - sy * len, vz));
      // Line along Z
      points.push(new THREE.Vector3(vx, vy, vz));
      points.push(new THREE.Vector3(vx, vy, vz - sz * len));
    });

    const geom = new THREE.BufferGeometry().setFromPoints(points);
    return geom;
  }, [activeZone.size]);

  // Animated scanner plane & subtle breathing opacity
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (scanPlaneRef.current) {
      const maxHalfY = (activeZone.size[1] / 2) * 0.88;
      scanPlaneRef.current.position.y = Math.sin(t * 2.2) * maxHalfY;
    }
    if (volumeMeshRef.current && (volumeMeshRef.current.material as THREE.MeshStandardMaterial)) {
      const mat = volumeMeshRef.current.material as THREE.MeshStandardMaterial;
      mat.opacity = 0.10 + Math.sin(t * 3.5) * 0.04;
    }
  });

  if (!wireframeVisible) return null;

  const zoneBadgeText =
    activeZone.zoneType === 'HAZARD'
      ? 'HAZARD ISOLATION ZONE'
      : activeZone.zoneType === 'MAINTENANCE'
      ? 'DATA & SYNC ZONE'
      : 'OPERATIONAL FOCUS ZONE';

  return (
    <group position={activeZone.center}>
      {/* 1. Semi-transparent Inner Volumetric Box */}
      <mesh ref={volumeMeshRef} geometry={boxGeom}>
        <meshStandardMaterial
          color={activeZone.color}
          transparent
          opacity={0.12}
          roughness={0.2}
          metalness={0.8}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* 2. Crisp Edge Wireframe */}
      <lineSegments geometry={edgesGeom}>
        <lineBasicMaterial
          color={activeZone.color}
          transparent
          opacity={0.85}
          linewidth={2}
          depthWrite={false}
        />
      </lineSegments>

      {/* 3. Glowing Corner Reticles (Highlighted Vertices) */}
      <lineSegments geometry={cornerLinesGeom}>
        <lineBasicMaterial
          color="#ffffff"
          transparent
          opacity={0.95}
          linewidth={3}
          depthWrite={false}
        />
      </lineSegments>

      {/* 4. Scanning Grid Line / Laser Plane */}
      <mesh ref={scanPlaneRef} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[activeZone.size[0] * 0.96, activeZone.size[2] * 0.96]} />
        <meshBasicMaterial
          color={activeZone.color}
          transparent
          opacity={0.25}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* 5. In-Scene 3D Holographic Status Label */}
      <Html
        position={[0, activeZone.size[1] / 2 + 0.22, 0]}
        center
        distanceFactor={6.5}
        zIndexRange={[10, 0]}
      >
        <div
          style={{
            borderColor: activeZone.color,
            boxShadow: `0 0 15px ${activeZone.color}40, 0 4px 12px rgba(0,0,0,0.85)`,
          }}
          className="pointer-events-none select-none flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-950/85 backdrop-blur-md border text-[9px] font-mono whitespace-nowrap tracking-wider shadow-lg"
        >
          <span
            style={{ backgroundColor: activeZone.color }}
            className="w-1.5 h-1.5 rounded-full animate-ping"
          />
          <span style={{ color: activeZone.color }} className="font-bold">
            {zoneBadgeText}:
          </span>
          <span className="text-slate-200 uppercase font-semibold">
            {activeZone.hullName}
          </span>
        </div>
      </Html>
    </group>
  );
}