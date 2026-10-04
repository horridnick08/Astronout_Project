import React, { useMemo } from 'react';
import * as THREE from 'three';

/**
 * ObservationWindow.tsx
 * 
 * Station 3: Deep Space Hull Observation Window:
 * - Positioned flush along the Starboard wall at [1.84, 1.35, -2.90]
 * - Non-overlapping AABB: X: [1.55, 2.10], Y: [0.4, 2.3], Z: [-3.55, -2.25]
 * - Features:
 *   1. Reinforced multi-layer titanium pressure hull frame with rivets & safety bevels
 *   2. Deep-space celestial viewport with stars, nebula glow, and planetary horizon
 *   3. Holographic HUD reticle on the glass showing orbital vector & hull thermal feeds
 *   4. Zero-G observation handrail for astronaut inspection grip
 *   5. External cosmic illumination beam projecting into the corridor
 */
export default function ObservationWindow() {
  // Holographic Heads-Up Display (HUD) overlay projected on the window glass
  const hudTexture = useMemo(() => {
    const c = document.createElement('canvas');
    c.width = 512;
    c.height = 512;
    const ctx = c.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, 512, 512);

      // Outer targeting brackets
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.45)';
      ctx.lineWidth = 2;
      ctx.strokeRect(30, 30, 452, 452);

      // Corner accent markers
      const corners = [
        [20, 20], [472, 20], [20, 472], [472, 472]
      ];
      ctx.strokeStyle = '#00f0ff';
      ctx.lineWidth = 3;
      corners.forEach(([cx, cy]) => {
        ctx.strokeRect(cx, cy, 20, 20);
      });

      // Central optical horizon reticle
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.6)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(256, 256, 80, 0, Math.PI * 2);
      ctx.arc(256, 256, 140, 0, Math.PI * 2);
      ctx.moveTo(76, 256);
      ctx.lineTo(436, 256);
      ctx.moveTo(256, 76);
      ctx.lineTo(256, 436);
      ctx.stroke();

      // Optical pitch ticks
      for (let y = 156; y <= 356; y += 25) {
        ctx.beginPath();
        ctx.moveTo(244, y);
        ctx.lineTo(268, y);
        ctx.stroke();
      }

      // HUD Text Information
      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 14px "JetBrains Mono", monospace';
      ctx.fillText('HULL VIEWPORT // SECTOR 07', 45, 58);

      ctx.fillStyle = '#94a3b8';
      ctx.font = '11px "JetBrains Mono", monospace';
      ctx.fillText('ORBITAL ALTITUDE: 421.4 KM', 45, 78);
      ctx.fillText('EXTERIOR SKIN TEMP: -128.4 °C', 45, 96);
      ctx.fillText('RADIATION LEVEL: 0.14 mSv/h [NOMINAL]', 45, 114);

      // Sun Vector Warning
      ctx.fillStyle = '#f59e0b';
      ctx.font = 'bold 11px "JetBrains Mono", monospace';
      ctx.fillText('SUN AZIMUTH: +54.2° // SHUTTER AUTO-TINT ARMED', 45, 440);

      // Viewport Status Pill
      ctx.fillStyle = 'rgba(16, 185, 129, 0.25)';
      ctx.fillRect(45, 452, 210, 22);
      ctx.strokeStyle = '#10b981';
      ctx.strokeRect(45, 452, 210, 22);
      ctx.fillStyle = '#34d399';
      ctx.font = 'bold 10px "JetBrains Mono", monospace';
      ctx.fillText('● HULL INTEGRITY 100% // SEALED', 55, 467);
    }
    const tex = new THREE.CanvasTexture(c);
    return tex;
  }, []);

  return (
    <group position={[1.84, 1.35, -2.90]} rotation={[0, -Math.PI / 2, 0]} name="Station_Observation_Window">
      {/* ===================================================================== */}
      {/* 1. REINFORCED STRUCTURAL BULKHEAD RECESSED COLLAR                     */}
      {/* ===================================================================== */}
      {/* Main Structural Recess Frame */}
      <mesh position={[0, 0, -0.06]}>
        <boxGeometry args={[1.30, 1.65, 0.12]} />
        <meshStandardMaterial color="#090d16" metalness={0.92} roughness={0.25} />
      </mesh>

      {/* Titanium Bevel Chamfer Frame */}
      <mesh position={[0, 0, -0.01]}>
        <boxGeometry args={[1.22, 1.56, 0.04]} />
        <meshStandardMaterial color="#1e293b" metalness={0.88} roughness={0.3} />
      </mesh>

      {/* Pressure Hull Ring Gasket */}
      <mesh position={[0, 0.05, 0.01]}>
        <ringGeometry args={[0.48, 0.54, 32]} />
        <meshStandardMaterial color="#0284c7" metalness={0.8} roughness={0.2} emissive="#0369a1" emissiveIntensity={0.6} />
      </mesh>

      {/* Heavy Exterior Mounting Bolts along circumference */}
      {Array.from({ length: 12 }).map((_, i) => {
        const angle = (i / 12) * Math.PI * 2;
        return (
          <mesh
            key={`bolt_${i}`}
            position={[Math.cos(angle) * 0.51, 0.05 + Math.sin(angle) * 0.51, 0.02]}
          >
            <cylinderGeometry args={[0.014, 0.014, 0.015, 8]} />
            <meshStandardMaterial color="#94a3b8" metalness={0.9} roughness={0.2} />
          </mesh>
        );
      })}

      {/* ===================================================================== */}
      {/* 2. DEEP-SPACE CELESTIAL VISTA VISIBLE THROUGH WINDOW                  */}
      {/* ===================================================================== */}
      {/* Outer Space Backdrop (Recessed behind glass) */}
      <mesh position={[0, 0.05, -0.04]}>
        <circleGeometry args={[0.48, 36]} />
        <meshBasicMaterial color="#020817" />
      </mesh>

      {/* Distant Earth Limb Atmosphere Arc (Visible through glass) */}
      <mesh position={[0.08, -0.22, -0.038]} rotation={[0, 0, 0.35]}>
        <ringGeometry args={[0.34, 0.38, 32, 1, 0, Math.PI]} />
        <meshBasicMaterial color="#38bdf8" toneMapped={false} />
      </mesh>
      <mesh position={[0.08, -0.22, -0.039]} rotation={[0, 0, 0.35]}>
        <ringGeometry args={[0.38, 0.44, 32, 1, 0, Math.PI]} />
        <meshBasicMaterial color="#00e5ff" transparent opacity={0.35} toneMapped={false} />
      </mesh>

      {/* Distant Stars behind glass */}
      {[
        [-0.22, 0.32], [0.15, 0.38], [-0.35, 0.12], [0.32, 0.22],
        [-0.12, -0.05], [0.28, -0.15], [-0.30, 0.28], [0.05, 0.20]
      ].map(([sx, sy], idx) => (
        <mesh key={`star_${idx}`} position={[sx, sy + 0.05, -0.035]}>
          <circleGeometry args={[0.004 + (idx % 3) * 0.002, 8]} />
          <meshBasicMaterial color="#ffffff" toneMapped={false} />
        </mesh>
      ))}

      {/* Multi-pane Quartz Observation Glass with Subtle Cyan Tint */}
      <mesh position={[0, 0.05, 0.005]}>
        <circleGeometry args={[0.48, 36]} />
        <meshPhysicalMaterial
          color="#06b6d4"
          transmission={0.88}
          opacity={0.32}
          transparent
          roughness={0.08}
          metalness={0.1}
          reflectivity={0.9}
          clearcoat={1.0}
        />
      </mesh>

      {/* Heads-Up Display Reticle Overlay */}
      <mesh position={[0, 0.05, 0.012]}>
        <planeGeometry args={[0.88, 0.88]} />
        <meshBasicMaterial
          map={hudTexture}
          transparent
          opacity={0.82}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* ===================================================================== */}
      {/* 3. ZERO-G INSPECTION HANDRAIL FOR ASTRONAUT GRIP                      */}
      {/* ===================================================================== */}
      <group position={[0, -0.58, 0.08]} rotation={[0, 0, Math.PI / 2]}>
        <mesh>
          <cylinderGeometry args={[0.016, 0.016, 1.15, 16]} />
          <meshStandardMaterial
            color="#eab308"
            metalness={0.85}
            roughness={0.25}
            emissive="#ca8a04"
            emissiveIntensity={0.3}
          />
        </mesh>
        {/* Left & Right Stanchions */}
        <mesh position={[0, 0.04, -0.52]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.012, 0.012, 0.08, 8]} />
          <meshStandardMaterial color="#334155" metalness={0.9} />
        </mesh>
        <mesh position={[0, 0.04, 0.52]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.012, 0.012, 0.08, 8]} />
          <meshStandardMaterial color="#334155" metalness={0.9} />
        </mesh>
      </group>

      {/* External Cosmic Window Light Streaming In */}
      <pointLight position={[0, 0.1, 0.5]} color="#38bdf8" intensity={1.8} distance={3.2} decay={2} />
    </group>
  );
}
