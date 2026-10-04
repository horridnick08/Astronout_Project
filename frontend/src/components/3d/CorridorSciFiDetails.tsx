import React, { useMemo } from 'react';
import * as THREE from 'three';

/**
 * CorridorSciFiDetails.tsx
 * 
 * Enriches the 36m spacecraft corridor to eliminate any empty interior feeling:
 * 1. Continuous Glowing LED Strip Lighting along wall & floor seams.
 * 2. ISS-Style Zero-G Handrails & Foot-Restraints along both walls, ceiling, and deck.
 * 3. Technical Wall-Recessed Cargo Lockers & Equipment Bays with status indicators.
 * 4. Overhead Ventilation Hatches with technical louvers and subtle intake glow.
 * 5. High-density Conduit Cabling & Piping runs along corridor spine.
 */
export default function CorridorSciFiDetails() {
  // Generate handrail stanchions along corridor length (-16m to +16m)
  const handrailPositions = useMemo(() => {
    const positions: number[] = [];
    for (let z = -15; z <= 15; z += 3.0) {
      positions.push(z);
    }
    return positions;
  }, []);

  // Generate cargo locker bay positions outside active workstation zones
  const lockerPositions = useMemo(() => {
    return [
      { z: 8.5, side: -1, label: 'BAY-01 // AVIONICS' },
      { z: 4.5, side: -1, label: 'BAY-02 // LIFE SUPPORT' },
      { z: -5.8, side: -1, label: 'BAY-03 // RATION STORES' },
      { z: 8.5, side: 1, label: 'BAY-04 // EVA TOOLS' },
      { z: 4.5, side: 1, label: 'BAY-05 // DATA CORES' },
      { z: -5.8, side: 1, label: 'BAY-06 // SPARE VALVES' }
    ];
  }, []);

  // Generate overhead ventilation units
  const ventPositions = useMemo(() => {
    return [-12, -6, 0, 6, 12];
  }, []);

  return (
    <group name="Corridor_SciFi_Details_Collection">
      {/* ========================================================================= */}
      {/* 1. CONTINUOUS GLOWING LED STRIP LIGHTING ALONG CORRIDOR SEAMS             */}
      {/* ========================================================================= */}
      {/* Port Lower LED Strip (Cyan) */}
      <mesh position={[-2.38, 0.08, 0]}>
        <boxGeometry args={[0.03, 0.04, 34]} />
        <meshBasicMaterial color="#00e5ff" toneMapped={false} />
      </mesh>
      {/* Starboard Lower LED Strip (Amber/Cyan Guide) */}
      <mesh position={[2.38, 0.08, 0]}>
        <boxGeometry args={[0.03, 0.04, 34]} />
        <meshBasicMaterial color="#38bdf8" toneMapped={false} />
      </mesh>

      {/* Port Upper Ceiling LED Strip */}
      <mesh position={[-2.25, 2.75, 0]}>
        <boxGeometry args={[0.03, 0.03, 34]} />
        <meshBasicMaterial color="#06b6d4" toneMapped={false} />
      </mesh>
      {/* Starboard Upper Ceiling LED Strip */}
      <mesh position={[2.25, 2.75, 0]}>
        <boxGeometry args={[0.03, 0.03, 34]} />
        <meshBasicMaterial color="#06b6d4" toneMapped={false} />
      </mesh>

      {/* Central Corridor Floor Alignment Guideline (Glow) */}
      <mesh position={[0, 0.006, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.08, 34]} />
        <meshBasicMaterial color="#22d3ee" transparent opacity={0.65} toneMapped={false} />
      </mesh>

      {/* ========================================================================= */}
      {/* 2. ISS-STYLE ZERO-G HANDRAILS (Yellow & Cyan Aerospace Grab Bars)          */}
      {/* ========================================================================= */}
      {handrailPositions.map((z) => (
        <group key={`handrails_${z}`}>
          {/* Port Wall Mid Handrail (Height 1.4m - Astronaut hand level) */}
          <group position={[-2.32, 1.4, z]}>
            {/* Grab Bar Tube */}
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.016, 0.016, 1.8, 12]} />
              <meshStandardMaterial
                color="#eab308"
                metalness={0.85}
                roughness={0.25}
                emissive="#ca8a04"
                emissiveIntensity={0.25}
              />
            </mesh>
            {/* Left & Right Mounting Stanchions */}
            <mesh position={[0.04, 0, -0.75]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.012, 0.012, 0.08, 8]} />
              <meshStandardMaterial color="#334155" metalness={0.9} />
            </mesh>
            <mesh position={[0.04, 0, 0.75]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.012, 0.012, 0.08, 8]} />
              <meshStandardMaterial color="#334155" metalness={0.9} />
            </mesh>
          </group>

          {/* Starboard Wall Mid Handrail */}
          <group position={[2.32, 1.4, z]}>
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.016, 0.016, 1.8, 12]} />
              <meshStandardMaterial
                color="#eab308"
                metalness={0.85}
                roughness={0.25}
                emissive="#ca8a04"
                emissiveIntensity={0.25}
              />
            </mesh>
            <mesh position={[-0.04, 0, -0.75]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.012, 0.012, 0.08, 8]} />
              <meshStandardMaterial color="#334155" metalness={0.9} />
            </mesh>
            <mesh position={[-0.04, 0, 0.75]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.012, 0.012, 0.08, 8]} />
              <meshStandardMaterial color="#334155" metalness={0.9} />
            </mesh>
          </group>

          {/* Ceiling Grab Rail along Spine */}
          <group position={[0, 2.78, z]}>
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.015, 0.015, 1.8, 12]} />
              <meshStandardMaterial color="#06b6d4" metalness={0.9} roughness={0.2} emissive="#0891b2" emissiveIntensity={0.4} />
            </mesh>
            <mesh position={[0, 0.04, -0.75]}>
              <cylinderGeometry args={[0.01, 0.01, 0.08, 8]} />
              <meshStandardMaterial color="#1e293b" metalness={0.9} />
            </mesh>
            <mesh position={[0, 0.04, 0.75]}>
              <cylinderGeometry args={[0.01, 0.01, 0.08, 8]} />
              <meshStandardMaterial color="#1e293b" metalness={0.9} />
            </mesh>
          </group>

          {/* Deck Zero-G Foot Restraint Loop (Magnetic Boot Restraints) */}
          <group position={[0, 0.02, z]}>
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
              <torusGeometry args={[0.18, 0.012, 12, 24]} />
              <meshStandardMaterial color="#f59e0b" metalness={0.8} roughness={0.3} />
            </mesh>
            <mesh position={[0, 0.002, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[0.28, 0.12]} />
              <meshStandardMaterial color="#0f172a" metalness={0.9} roughness={0.4} />
            </mesh>
          </group>
        </group>
      ))}

      {/* ========================================================================= */}
      {/* 3. TECHNICAL CARGO LOCKERS & ACCESS HATCHES ALONG WALL SECTIONS            */}
      {/* ========================================================================= */}
      {lockerPositions.map(({ z, side, label }, idx) => (
        <group key={`locker_${idx}`} position={[side * 2.36, 1.25, z]} rotation={[0, side > 0 ? -Math.PI / 2 : Math.PI / 2, 0]}>
          {/* Recessed Locker Door Panel Frame */}
          <mesh position={[0, 0, -0.02]}>
            <boxGeometry args={[1.5, 1.8, 0.06]} />
            <meshStandardMaterial color="#0f172a" metalness={0.85} roughness={0.35} />
          </mesh>

          {/* Inner Door Slab */}
          <mesh position={[0, 0, 0.005]}>
            <boxGeometry args={[1.38, 1.68, 0.02]} />
            <meshStandardMaterial color="#1e293b" metalness={0.7} roughness={0.45} />
          </mesh>

          {/* Recessed Lever Release Latch */}
          <mesh position={[0.5, 0, 0.02]}>
            <boxGeometry args={[0.08, 0.22, 0.02]} />
            <meshStandardMaterial color="#ef4444" metalness={0.8} roughness={0.3} />
          </mesh>

          {/* Status Indicator LED (Nominal Green / Standby Cyan) */}
          <mesh position={[-0.52, 0.68, 0.02]}>
            <circleGeometry args={[0.018, 16]} />
            <meshBasicMaterial color="#10b981" />
          </mesh>
          <mesh position={[-0.46, 0.68, 0.02]}>
            <circleGeometry args={[0.018, 16]} />
            <meshBasicMaterial color="#06b6d4" />
          </mesh>

          {/* Technical Beveled Demarcation Seam */}
          <mesh position={[0, 0, 0.016]}>
            <ringGeometry args={[0.65, 0.66, 4]} />
            <meshBasicMaterial color="#334155" />
          </mesh>
        </group>
      ))}

      {/* ========================================================================= */}
      {/* 4. OVERHEAD VENTILATION HATCHES & CONDUIT SPINES                          */}
      {/* ========================================================================= */}
      {ventPositions.map((z) => (
        <group key={`vent_${z}`} position={[0, 2.82, z]}>
          {/* Ventilation Housing Frame */}
          <mesh position={[0, 0, 0]}>
            <boxGeometry args={[1.4, 0.06, 1.1]} />
            <meshStandardMaterial color="#090d16" metalness={0.92} roughness={0.2} />
          </mesh>

          {/* Louvered Grill Texture */}
          <mesh position={[0, -0.028, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <planeGeometry args={[1.2, 0.9]} />
            <meshStandardMaterial color="#020617" roughness={0.8} />
          </mesh>

          {/* Louver Blades */}
          {[-0.35, -0.2, -0.05, 0.1, 0.25, 0.4].map((offset, i) => (
            <mesh key={`blade_${i}`} position={[0, -0.03, offset]} rotation={[0.4, 0, 0]}>
              <boxGeometry args={[1.15, 0.01, 0.08]} />
              <meshStandardMaterial color="#1e293b" metalness={0.8} roughness={0.3} />
            </mesh>
          ))}

          {/* Subtle Blue Air Intake Atmosphere Glow */}
          <pointLight position={[0, -0.2, 0]} color="#38bdf8" intensity={0.45} distance={2.8} decay={2} />
        </group>
      ))}

      {/* Long High-Voltage & Coolant Spine Conduits running along Ceiling */}
      <group position={[-0.8, 2.76, 0]}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.028, 0.028, 34, 16]} />
          <meshStandardMaterial color="#0284c7" metalness={0.8} roughness={0.25} />
        </mesh>
      </group>
      <group position={[0.8, 2.76, 0]}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.024, 0.024, 34, 16]} />
          <meshStandardMaterial color="#f59e0b" metalness={0.8} roughness={0.3} />
        </mesh>
      </group>
    </group>
  );
}
