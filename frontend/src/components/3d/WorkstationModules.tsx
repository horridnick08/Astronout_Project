import React, { useMemo } from 'react';
import * as THREE from 'three';

/**
 * WorkstationModules.tsx
 * 
 * Integrated Sci-Fi Flight Ops Deck Architecture (ISS Destiny / Columbus Module Style):
 * - ZERO freestanding pedestal tables or office chairs.
 * - Wall-integrated avionics racks, angled control surfaces, physical toggle switches,
 *   dual-thrust control sticks, and recessed display panels.
 * - Compact bounding box within 2.0m - 2.5m radius of the central aisle.
 */

// ============================================================================
// 1. WALL-INTEGRATED PRIMARY FLIGHT OPS CONSOLE (PORT WALL, Z = 0.5m)
// ============================================================================
export function PrimaryFlightOpsConsole() {
  // Attitude Director Indicator (ADI) & Primary Flight Display
  const flightDisplayTexture = useMemo(() => {
    const c = document.createElement('canvas');
    c.width = 512;
    c.height = 384;
    const ctx = c.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#020617';
      ctx.fillRect(0, 0, 512, 384);

      // ADI Artificial Horizon Ball
      const grad = ctx.createLinearGradient(0, 70, 0, 290);
      grad.addColorStop(0, '#0284c7');
      grad.addColorStop(0.5, '#0369a1');
      grad.addColorStop(0.51, '#78350f');
      grad.addColorStop(1, '#451a03');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(256, 180, 105, 0, Math.PI * 2);
      ctx.fill();

      // Pitch ladder lines
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      for (let y = 110; y <= 250; y += 24) {
        ctx.beginPath();
        ctx.moveTo(215, y);
        ctx.lineTo(240, y);
        ctx.moveTo(272, y);
        ctx.lineTo(297, y);
        ctx.stroke();
      }

      // Yellow Aircraft flight vector symbol
      ctx.strokeStyle = '#facc15';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(220, 180);
      ctx.lineTo(248, 180);
      ctx.lineTo(256, 190);
      ctx.lineTo(264, 180);
      ctx.lineTo(292, 180);
      ctx.stroke();

      // Outer Bezel
      ctx.strokeStyle = '#00e5ff';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(256, 180, 108, 0, Math.PI * 2);
      ctx.stroke();

      // Header telemetry
      ctx.fillStyle = '#00e5ff';
      ctx.font = 'bold 15px "JetBrains Mono", monospace';
      ctx.fillText('PRIMARY FLIGHT DISPLAY // PFD-1', 24, 32);
      ctx.fillStyle = '#94a3b8';
      ctx.font = '12px "JetBrains Mono", monospace';
      ctx.fillText('ORBIT: 421.4 KM   V_REL: 7.66 KM/S', 24, 52);

      // Mode pill
      ctx.fillStyle = 'rgba(16, 185, 129, 0.25)';
      ctx.fillRect(24, 335, 180, 26);
      ctx.strokeStyle = '#10b981';
      ctx.strokeRect(24, 335, 180, 26);
      ctx.fillStyle = '#34d399';
      ctx.font = 'bold 12px "JetBrains Mono", monospace';
      ctx.fillText('● RCS FLIGHT ACTIVE', 38, 352);
    }
    const tex = new THREE.CanvasTexture(c);
    return tex;
  }, []);

  // Auxiliary Propulsion & Delta-V Display
  const propulsionTexture = useMemo(() => {
    const c = document.createElement('canvas');
    c.width = 384;
    c.height = 256;
    const ctx = c.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#020617';
      ctx.fillRect(0, 0, 384, 256);
      ctx.strokeStyle = '#0284c7';
      ctx.lineWidth = 2;
      ctx.strokeRect(8, 8, 368, 240);

      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 14px "JetBrains Mono", monospace';
      ctx.fillText('PROPULSION MANIFOLD // RCS-A', 20, 32);

      const bars = [
        { label: 'RCS QUADS 1-4', val: 0.92, col: '#00e5ff' },
        { label: 'MAIN XENON SUPPLY', val: 0.86, col: '#3b82f6' },
        { label: 'CHAMBER PRESSURE', val: 0.74, col: '#10b981' }
      ];

      bars.forEach((b, i) => {
        const y = 60 + i * 50;
        ctx.fillStyle = '#94a3b8';
        ctx.font = '11px "JetBrains Mono", monospace';
        ctx.fillText(b.label, 20, y);
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(20, y + 8, 344, 14);
        ctx.fillStyle = b.col;
        ctx.fillRect(20, y + 8, 344 * b.val, 14);
      });

      ctx.fillStyle = '#10b981';
      ctx.font = 'bold 11px "JetBrains Mono", monospace';
      ctx.fillText('MANIFOLD STATUS: SEALED // NOMINAL', 20, 228);
    }
    const tex = new THREE.CanvasTexture(c);
    return tex;
  }, []);

  return (
    <group position={[-1.84, 1.25, 0.5]} rotation={[0, Math.PI / 2, 0]} name="Integrated_Flight_Ops_Console">
      {/* ============================================================== */}
      {/* 1. WALL-INTEGRATED AVIONICS RACK FRAMEWORK                     */}
      {/* ============================================================== */}
      {/* Structural Recessed Wall Collar */}
      <mesh position={[0, 0, -0.08]}>
        <boxGeometry args={[1.9, 1.85, 0.16]} />
        <meshStandardMaterial color="#090d16" metalness={0.92} roughness={0.2} />
      </mesh>

      {/* Titanium Bevel Frame */}
      <mesh position={[0, 0, -0.01]}>
        <boxGeometry args={[1.82, 1.76, 0.04]} />
        <meshStandardMaterial color="#1e293b" metalness={0.85} roughness={0.3} />
      </mesh>

      {/* ============================================================== */}
      {/* 2. RECESSED PRIMARY AND SECONDARY AVIONICS SCREENS             */}
      {/* ============================================================== */}
      {/* Main Recessed PFD Display */}
      <group position={[-0.32, 0.28, 0.02]}>
        <mesh position={[0, 0, 0]}>
          <planeGeometry args={[0.96, 0.68]} />
          <meshBasicMaterial map={flightDisplayTexture} />
        </mesh>
        <mesh position={[0, 0, 0.005]}>
          <ringGeometry args={[0.49, 0.5, 4]} />
          <meshBasicMaterial color="#00e5ff" />
        </mesh>
      </group>

      {/* Auxiliary Propulsion Monitor */}
      <group position={[0.52, 0.35, 0.02]}>
        <mesh position={[0, 0, 0]}>
          <planeGeometry args={[0.62, 0.44]} />
          <meshBasicMaterial map={propulsionTexture} />
        </mesh>
        <mesh position={[0, 0, 0.005]}>
          <ringGeometry args={[0.31, 0.32, 4]} />
          <meshBasicMaterial color="#0284c7" />
        </mesh>
      </group>

      {/* ============================================================== */}
      {/* 3. ANGLED CONSOLE SHELF WITH PHYSICAL TOGGLES & FLIGHT STICKS  */}
      {/* ============================================================== */}
      <group position={[0, -0.32, 0.22]} rotation={[0.35, 0, 0]}>
        {/* Angled Control Surface Shelf */}
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[1.75, 0.06, 0.46]} />
          <meshStandardMaterial color="#0f172a" metalness={0.9} roughness={0.25} />
        </mesh>

        {/* Ambient Under-glow Strip */}
        <mesh position={[0, -0.035, 0.22]}>
          <boxGeometry args={[1.7, 0.015, 0.02]} />
          <meshBasicMaterial color="#00e5ff" toneMapped={false} />
        </mesh>

        {/* DUAL-THRUST CONTROL LEVERS (LEFT) */}
        <group position={[-0.52, 0.06, 0.04]}>
          <mesh position={[0, 0, 0]}>
            <boxGeometry args={[0.18, 0.025, 0.22]} />
            <meshStandardMaterial color="#090d16" metalness={0.92} />
          </mesh>
          {/* Twin Throttle Levers */}
          <mesh position={[-0.03, 0.06, 0]} rotation={[0.15, 0, 0]}>
            <boxGeometry args={[0.022, 0.1, 0.035]} />
            <meshStandardMaterial color="#0284c7" metalness={0.8} />
          </mesh>
          <mesh position={[0.03, 0.06, 0]} rotation={[0.12, 0, 0]}>
            <boxGeometry args={[0.022, 0.1, 0.035]} />
            <meshStandardMaterial color="#0284c7" metalness={0.8} />
          </mesh>
          {/* Throttle Grip Heads */}
          <mesh position={[-0.03, 0.11, -0.01]}>
            <boxGeometry args={[0.035, 0.03, 0.06]} />
            <meshStandardMaterial color="#020617" />
          </mesh>
          <mesh position={[0.03, 0.11, -0.01]}>
            <boxGeometry args={[0.035, 0.03, 0.06]} />
            <meshStandardMaterial color="#020617" />
          </mesh>
        </group>

        {/* FLIGHT CONTROL JOYSTICK (RIGHT) */}
        <group position={[0.52, 0.06, 0.04]}>
          <mesh position={[0, 0, 0]}>
            <cylinderGeometry args={[0.07, 0.08, 0.03, 16]} />
            <meshStandardMaterial color="#090d16" metalness={0.92} />
          </mesh>
          <mesh position={[0, 0.03, 0]}>
            <coneGeometry args={[0.055, 0.04, 16]} />
            <meshStandardMaterial color="#1e293b" roughness={0.8} />
          </mesh>
          <mesh position={[0, 0.09, 0]} rotation={[-0.06, 0, 0.04]}>
            <cylinderGeometry args={[0.015, 0.015, 0.14, 12]} />
            <meshStandardMaterial color="#334155" metalness={0.85} />
          </mesh>
          <mesh position={[0, 0.17, 0.01]}>
            <boxGeometry args={[0.042, 0.09, 0.05]} />
            <meshStandardMaterial color="#020617" />
          </mesh>
          <mesh position={[0, 0.19, -0.02]}>
            <boxGeometry args={[0.014, 0.024, 0.012]} />
            <meshBasicMaterial color="#ef4444" />
          </mesh>
        </group>

        {/* ILLUMINATED PHYSICAL PUSH-BUTTON ARRAY & SAFETY TOGGLES */}
        <group position={[0, 0.04, 0.02]}>
          {[-0.22, -0.14, -0.06, 0.02, 0.1, 0.18, 0.26].map((x, i) => (
            <mesh key={`pbtn_${i}`} position={[x, 0, 0]}>
              <boxGeometry args={[0.045, 0.016, 0.045]} />
              <meshStandardMaterial
                color={i % 2 === 0 ? '#00e5ff' : '#f59e0b'}
                emissive={i % 2 === 0 ? '#0891b2' : '#d97706'}
                emissiveIntensity={1.8}
              />
            </mesh>
          ))}
          {/* Guarded Safety Red Toggle Switches */}
          {[-0.1, 0.14].map((x, i) => (
            <group key={`gtoggle_${i}`} position={[x, 0.01, 0.07]}>
              <mesh>
                <boxGeometry args={[0.025, 0.02, 0.035]} />
                <meshStandardMaterial color="#ef4444" emissive="#dc2626" emissiveIntensity={1.4} />
              </mesh>
            </group>
          ))}
        </group>
      </group>

      {/* ZERO-G HAND-RAIL RESTRAINT ANCHORED BELOW CONSOLE */}
      <group position={[0, -0.58, 0.28]} rotation={[0, 0, Math.PI / 2]}>
        <mesh>
          <cylinderGeometry args={[0.016, 0.016, 1.4, 16]} />
          <meshStandardMaterial color="#eab308" metalness={0.85} roughness={0.25} emissive="#ca8a04" emissiveIntensity={0.3} />
        </mesh>
      </group>

      {/* Console Illumination Spotlight */}
      <pointLight position={[0, 0.2, 0.6]} color="#00e5ff" intensity={1.8} distance={2.5} decay={2} />
    </group>
  );
}

// ============================================================================
// 2. WALL-INTEGRATED EMERGENCY POWER & LIFE SUPPORT PANEL (PORT WALL, Z = -1.2m)
// ============================================================================
export function WallIntegratedLifeSupport() {
  const o2Texture = useMemo(() => {
    const c = document.createElement('canvas');
    c.width = 384;
    c.height = 384;
    const ctx = c.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#020617';
      ctx.fillRect(0, 0, 384, 384);
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 2;
      ctx.strokeRect(8, 8, 368, 368);

      ctx.fillStyle = '#10b981';
      ctx.font = 'bold 15px "JetBrains Mono", monospace';
      ctx.fillText('LIFE SUPPORT // SECTOR 4', 20, 36);

      const items = [
        { label: 'CABIN PRESSURE', val: '101.3 kPa', bar: 0.95 },
        { label: 'O2 PARTIAL PRESSURE', val: '21.3 kPa', bar: 0.88 },
        { label: 'CO2 SCRUBBER 1', val: '0.04 kPa', bar: 0.94 },
        { label: 'NITROGEN RECOVERY', val: '78.8 kPa', bar: 0.90 }
      ];

      items.forEach((item, idx) => {
        const y = 70 + idx * 65;
        ctx.fillStyle = '#94a3b8';
        ctx.font = '11px "JetBrains Mono", monospace';
        ctx.fillText(item.label, 20, y);
        ctx.fillStyle = '#f8fafc';
        ctx.fillText(item.val, 260, y);
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(20, y + 8, 344, 14);
        ctx.fillStyle = '#10b981';
        ctx.fillRect(20, y + 8, 344 * item.bar, 14);
      });

      ctx.fillStyle = '#34d399';
      ctx.font = 'bold 12px "JetBrains Mono", monospace';
      ctx.fillText('● ALL MODULE SECTORS PRESSURIZED', 20, 350);
    }
    const tex = new THREE.CanvasTexture(c);
    return tex;
  }, []);

  return (
    <group position={[-1.84, 1.25, 2.0]} rotation={[0, Math.PI / 2, 0]} name="Wall_Life_Support_Node">
      {/* Wall Frame */}
      <mesh position={[0, 0, -0.06]}>
        <boxGeometry args={[1.2, 1.6, 0.12]} />
        <meshStandardMaterial color="#090d16" metalness={0.92} roughness={0.25} />
      </mesh>
      {/* Recessed Screen */}
      <mesh position={[0, 0.15, 0]}>
        <planeGeometry args={[1.05, 0.95]} />
        <meshBasicMaterial map={o2Texture} />
      </mesh>
      {/* Pressure Valve Handwheels */}
      <group position={[-0.32, -0.5, 0.08]} rotation={[0, 0, 0]}>
        <mesh>
          <torusGeometry args={[0.09, 0.016, 12, 24]} />
          <meshStandardMaterial color="#10b981" metalness={0.8} />
        </mesh>
      </group>
      <group position={[0.32, -0.5, 0.08]} rotation={[0, 0, 0]}>
        <mesh>
          <torusGeometry args={[0.09, 0.016, 12, 24]} />
          <meshStandardMaterial color="#06b6d4" metalness={0.8} />
        </mesh>
      </group>
    </group>
  );
}

// ============================================================================
// 3. DUPLICATE TELEMETRY CONSOLE SCREEN (STORAGE BAY AREA, PORT WALL Z = -1.65m)
// ============================================================================
export function StorageBayTelemetryConsole() {
  // Cargo & Payload Bay Telemetry Display Texture
  const cargoDisplayTexture = useMemo(() => {
    const c = document.createElement('canvas');
    c.width = 512;
    c.height = 384;
    const ctx = c.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#020617';
      ctx.fillRect(0, 0, 512, 384);

      // Border Bezel
      ctx.strokeStyle = '#0284c7';
      ctx.lineWidth = 3;
      ctx.strokeRect(10, 10, 492, 364);

      // Header
      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 16px "JetBrains Mono", monospace';
      ctx.fillText('STORAGE & CARGO BAY TELEMETRY // SECTOR 3', 24, 38);

      ctx.fillStyle = '#94a3b8';
      ctx.font = '12px "JetBrains Mono", monospace';
      ctx.fillText('BAY AIRLOCK: SEALED   LOGISTICS BUS: 100% NOMINAL', 24, 58);

      // Cargo Status Metrics
      const items = [
        { label: 'PRESSURIZED CONTAINER RACKS', val: '101.4 kPa', bar: 0.94, col: '#00e5ff' },
        { label: 'VOLATILE REACTANT COOLANT', val: '12.4 K', bar: 0.88, col: '#38bdf8' },
        { label: 'MAGNETIC DECK CLAMP FORCE', val: '45.2 kN', bar: 0.96, col: '#10b981' },
        { label: 'INVENTORY INTEGRITY INDEX', val: '99.8 %', bar: 0.99, col: '#34d399' }
      ];

      items.forEach((item, idx) => {
        const y = 85 + idx * 56;
        ctx.fillStyle = '#94a3b8';
        ctx.font = '11px "JetBrains Mono", monospace';
        ctx.fillText(item.label, 24, y);
        ctx.fillStyle = '#f8fafc';
        ctx.fillText(item.val, 360, y);
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(24, y + 8, 464, 14);
        ctx.fillStyle = item.col;
        ctx.fillRect(24, y + 8, 464 * item.bar, 14);
      });

      // Bottom Status Indicator
      ctx.fillStyle = 'rgba(16, 185, 129, 0.25)';
      ctx.fillRect(24, 325, 230, 26);
      ctx.strokeStyle = '#10b981';
      ctx.strokeRect(24, 325, 230, 26);
      ctx.fillStyle = '#34d399';
      ctx.font = 'bold 12px "JetBrains Mono", monospace';
      ctx.fillText('● CARGO TELEMETRY LOCKED', 38, 342);
    }
    const tex = new THREE.CanvasTexture(c);
    return tex;
  }, []);

  // Auxiliary Inventory Matrix Texture
  const inventoryTexture = useMemo(() => {
    const c = document.createElement('canvas');
    c.width = 384;
    c.height = 256;
    const ctx = c.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#020617';
      ctx.fillRect(0, 0, 384, 256);
      ctx.strokeStyle = '#0284c7';
      ctx.lineWidth = 2;
      ctx.strokeRect(8, 8, 368, 240);

      ctx.fillStyle = '#00e5ff';
      ctx.font = 'bold 13px "JetBrains Mono", monospace';
      ctx.fillText('CONTAINER PAYLOAD MATRIX', 20, 32);

      const rows = [
        { id: 'DRUM-01', type: 'HYPERGOLIC FUEL', mass: '1,420 KG', stat: 'OK' },
        { id: 'DRUM-02', type: 'XENON PROPELLANT', mass: '880 KG', stat: 'OK' },
        { id: 'CAN-03', type: 'O2 CATALYST', mass: '340 KG', stat: 'OK' },
        { id: 'CORE-A', type: 'QUANTUM CELL', mass: '120 KG', stat: 'DOCKED' }
      ];

      rows.forEach((r, i) => {
        const y = 60 + i * 44;
        ctx.fillStyle = '#94a3b8';
        ctx.font = '10px "JetBrains Mono", monospace';
        ctx.fillText(`${r.id}: ${r.type}`, 20, y);
        ctx.fillStyle = '#38bdf8';
        ctx.fillText(r.mass, 240, y);
        ctx.fillStyle = '#34d399';
        ctx.fillText(r.stat, 320, y);
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(20, y + 6, 344, 2);
      });
    }
    const tex = new THREE.CanvasTexture(c);
    return tex;
  }, []);

  return (
    <group position={[-1.84, 1.25, -1.65]} rotation={[0, Math.PI / 2, 0]} name="Storage_Bay_Telemetry_Console">
      {/* 1. Recessed Wall Chassis */}
      <mesh position={[0, 0, -0.08]}>
        <boxGeometry args={[1.9, 1.85, 0.16]} />
        <meshStandardMaterial color="#090d16" metalness={0.92} roughness={0.2} />
      </mesh>
      <mesh position={[0, 0, -0.01]}>
        <boxGeometry args={[1.82, 1.76, 0.04]} />
        <meshStandardMaterial color="#1e293b" metalness={0.85} roughness={0.3} />
      </mesh>

      {/* 2. Primary & Auxiliary Telemetry Screens */}
      <group position={[-0.32, 0.28, 0.02]}>
        <mesh position={[0, 0, 0]}>
          <planeGeometry args={[0.96, 0.68]} />
          <meshBasicMaterial map={cargoDisplayTexture} />
        </mesh>
        <mesh position={[0, 0, 0.005]}>
          <ringGeometry args={[0.49, 0.5, 4]} />
          <meshBasicMaterial color="#00e5ff" />
        </mesh>
      </group>

      <group position={[0.52, 0.35, 0.02]}>
        <mesh position={[0, 0, 0]}>
          <planeGeometry args={[0.62, 0.44]} />
          <meshBasicMaterial map={inventoryTexture} />
        </mesh>
        <mesh position={[0, 0, 0.005]}>
          <ringGeometry args={[0.31, 0.32, 4]} />
          <meshBasicMaterial color="#0284c7" />
        </mesh>
      </group>

      {/* 3. Angled Control Surface Shelf with HOTAS & Physical Toggles */}
      <group position={[0, -0.32, 0.22]} rotation={[0.35, 0, 0]}>
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[1.75, 0.06, 0.46]} />
          <meshStandardMaterial color="#0f172a" metalness={0.9} roughness={0.25} />
        </mesh>
        <mesh position={[0, -0.035, 0.22]}>
          <boxGeometry args={[1.7, 0.015, 0.02]} />
          <meshBasicMaterial color="#00e5ff" toneMapped={false} />
        </mesh>

        {/* Dual Control Sticks */}
        <group position={[-0.52, 0.06, 0.04]}>
          <mesh position={[0, 0, 0]}>
            <boxGeometry args={[0.18, 0.025, 0.22]} />
            <meshStandardMaterial color="#090d16" metalness={0.92} />
          </mesh>
          <mesh position={[-0.03, 0.06, 0]} rotation={[0.12, 0, 0]}>
            <boxGeometry args={[0.022, 0.1, 0.035]} />
            <meshStandardMaterial color="#0284c7" metalness={0.8} />
          </mesh>
          <mesh position={[0.03, 0.06, 0]} rotation={[0.15, 0, 0]}>
            <boxGeometry args={[0.022, 0.1, 0.035]} />
            <meshStandardMaterial color="#0284c7" metalness={0.8} />
          </mesh>
        </group>

        {/* Center Illuminated Keypad & Toggles */}
        <group position={[0, 0.04, 0]}>
          {[-0.2, -0.1, 0, 0.1, 0.2].map((xPos, idx) => (
            <mesh key={idx} position={[xPos, 0.01, 0]}>
              <boxGeometry args={[0.06, 0.018, 0.06]} />
              <meshStandardMaterial
                color={idx % 2 === 0 ? '#00e5ff' : '#f59e0b'}
                emissive={idx % 2 === 0 ? '#00e5ff' : '#f59e0b'}
                emissiveIntensity={1.8}
                toneMapped={false}
              />
            </mesh>
          ))}
        </group>

        {/* Right Cargo Crane Joystick */}
        <group position={[0.52, 0.06, 0.04]}>
          <mesh position={[0, 0, 0]}>
            <cylinderGeometry args={[0.06, 0.08, 0.025, 16]} />
            <meshStandardMaterial color="#090d16" />
          </mesh>
          <mesh position={[0, 0.07, 0]} rotation={[0.1, 0, 0.05]}>
            <cylinderGeometry args={[0.014, 0.016, 0.12, 12]} />
            <meshStandardMaterial color="#334155" metalness={0.8} />
          </mesh>
          <mesh position={[0.01, 0.13, 0.02]}>
            <sphereGeometry args={[0.025, 16, 16]} />
            <meshStandardMaterial color="#ef4444" />
          </mesh>
        </group>
      </group>

      <pointLight position={[0, 0.4, 0.5]} color="#00e5ff" intensity={1.6} distance={2.8} decay={2} />
    </group>
  );
}

// ============================================================================
// MAIN COMPONENT EXPORT
// ============================================================================
export default function WorkstationModules() {
  return (
    <group name="Integrated_Flight_Deck_Consoles">
      {/* 1. Integrated Primary Flight Ops Console (Port Wall at Z = 0.6m) */}
      <PrimaryFlightOpsConsole />

      {/* 2. Wall-Integrated Emergency Life Support Panel (Port Wall at Z = -0.5m) */}
      <WallIntegratedLifeSupport />

      {/* 3. Duplicated Matching Telemetry Console (Port Wall near Barrels at Z = -1.65m) */}
      <StorageBayTelemetryConsole />
    </group>
  );
}
