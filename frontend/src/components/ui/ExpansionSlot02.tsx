import React, { useState, useEffect, useRef, useMemo, Component, ErrorInfo, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Radio, Activity } from 'lucide-react';

/**
 * Local Error Boundary to protect the Mini-Globe Canvas
 */
interface MiniGlobeErrorBoundaryProps {
  children: React.ReactNode;
}
interface MiniGlobeErrorBoundaryState {
  hasError: boolean;
}

class MiniGlobeErrorBoundary extends Component<MiniGlobeErrorBoundaryProps, MiniGlobeErrorBoundaryState> {
  constructor(props: MiniGlobeErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(_: Error): MiniGlobeErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[MiniOrbitalGlobe] Error caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="w-full h-full flex items-center justify-center text-[8px] text-cyan-400 font-mono">
          [RADAR DISPLAY OFFLINE]
        </div>
      );
    }
    return this.props.children;
  }
}

/**
 * Scaled 3D Mini-Globe Viewport Parameters
 * Earth radius scaled down to ~0.58x (R = 0.42) so the entire Earth, satellites,
 * and orbital ring fit cleanly inside the viewport without clipping.
 */
const EARTH_RADIUS = 0.52;
const ORBIT_RADIUS = 0.68;

// Generate fixed debris & satellite positions once (zero memory leaks)
const NUM_DEBRIS = 14;
const NUM_SATELLITES = 8;

const debrisPositions = (() => {
  const arr = new Float32Array(NUM_DEBRIS * 3);
  for (let i = 0; i < NUM_DEBRIS; i++) {
    const angle = (i / NUM_DEBRIS) * Math.PI * 2 + (i % 3) * 0.35;
    const r = ORBIT_RADIUS + ((i % 5) - 2) * 0.024;
    const zOffset = ((i % 4) - 1.5) * 0.03;
    arr[i * 3 + 0] = Math.cos(angle) * r;
    arr[i * 3 + 1] = Math.sin(angle) * r;
    arr[i * 3 + 2] = zOffset;
  }
  return arr;
})();

const satellitePositions = (() => {
  const arr = new Float32Array(NUM_SATELLITES * 3);
  for (let i = 0; i < NUM_SATELLITES; i++) {
    const angle = (i / NUM_SATELLITES) * Math.PI * 2 + 0.25;
    const r = ORBIT_RADIUS + ((i % 3) - 1) * 0.018;
    const zOffset = ((i % 3) - 1) * 0.025;
    arr[i * 3 + 0] = Math.cos(angle) * r;
    arr[i * 3 + 1] = Math.sin(angle) * r;
    arr[i * 3 + 2] = zOffset;
  }
  return arr;
})();

// Dotted ring points along orbital path
const orbitRingPoints = (() => {
  const pts: THREE.Vector3[] = [];
  const segments = 48;
  for (let i = 0; i <= segments; i++) {
    const theta = (i / segments) * Math.PI * 2;
    pts.push(new THREE.Vector3(Math.cos(theta) * ORBIT_RADIUS, Math.sin(theta) * ORBIT_RADIUS, 0));
  }
  return pts;
})();

const orbitLineGeom = new THREE.BufferGeometry().setFromPoints(orbitRingPoints);

/**
 * 3D Mini-Globe Scene with Realistic Slow Orbit & High-Visibility Markers
 */
function MiniOrbitalScene() {
  const earthRef = useRef<THREE.Mesh>(null);
  const orbitGroupRef = useRef<THREE.Group>(null);
  const shipMarkerRef = useRef<THREE.Group>(null);
  const radarSweepRef = useRef<THREE.Mesh>(null);

  // Load Earth diffuse texture once
  const earthTexture = useMemo(() => {
    const loader = new THREE.TextureLoader();
    const tex = loader.load('/textures/earth_diffuse.jpg');
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.ClampToEdgeWrapping;
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }, []);

  // Pre-instantiated BufferGeometries for points
  const debrisGeom = useMemo(() => {
    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.BufferAttribute(debrisPositions, 3));
    return geom;
  }, []);

  const satelliteGeom = useMemo(() => {
    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.BufferAttribute(satellitePositions, 3));
    return geom;
  }, []);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();

    // 1. Earth realistic slow rotation (strictly rotation.y += 0.0008)
    if (earthRef.current) {
      earthRef.current.rotation.y += 0.0008;
    }

    // 2. Spaceship smooth orbit traversal
    const shipAngle = t * 0.42;
    const shipX = Math.cos(shipAngle) * ORBIT_RADIUS;
    const shipY = Math.sin(shipAngle) * ORBIT_RADIUS;

    if (shipMarkerRef.current) {
      shipMarkerRef.current.position.set(shipX, shipY, 0);
      shipMarkerRef.current.rotation.z = shipAngle + Math.PI / 2;
    }

    // 3. Radar wave pulse expanding from ship
    if (radarSweepRef.current) {
      const pulse = (t * 1.2) % 1.0;
      const scale = 0.05 + pulse * 0.16;
      radarSweepRef.current.position.set(shipX, shipY, 0);
      radarSweepRef.current.scale.set(scale, scale, 1);
      // @ts-ignore
      if (radarSweepRef.current.material) {
        // @ts-ignore
        radarSweepRef.current.material.opacity = (1.0 - pulse) * 0.6;
      }
    }
  });

  return (
    <group position={[0, 0, 0]}>
      {/* Directional & Ambient Planetary Lighting */}
      <ambientLight intensity={1.15} />
      <directionalLight position={[3, 2, 2.5]} intensity={2.2} color="#ffffff" />
      <pointLight position={[-2, -1, -2]} intensity={0.5} color="#00e5ff" />

      {/* ─── 1. 3D ROTATING EARTH SPHERE (PROMINENT RADIUS 0.52) ────── */}
      <mesh ref={earthRef} position={[0, 0, 0]} rotation={[0.22, 0, 0]}>
        <sphereGeometry args={[EARTH_RADIUS, 32, 32]} />
        <meshStandardMaterial
          map={earthTexture}
          roughness={0.65}
          metalness={0.1}
        />
      </mesh>

      {/* Earth Wireframe Grid Overlay */}
      <mesh position={[0, 0, 0]} rotation={[0.22, 0, 0]}>
        <sphereGeometry args={[EARTH_RADIUS + 0.003, 20, 20]} />
        <meshBasicMaterial
          color="#00e5ff"
          wireframe
          transparent
          opacity={0.15}
        />
      </mesh>

      {/* Atmospheric Haze Glow Shell */}
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[EARTH_RADIUS + 0.038, 28, 28]} />
        <meshBasicMaterial
          color="#38bdf8"
          transparent
          opacity={0.16}
          side={THREE.BackSide}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* ─── 2. TIGHT INCLINED ORBITAL PLANE (SNUG TO ATMOSPHERE) ───── */}
      <group ref={orbitGroupRef} position={[0, 0, 0]} rotation={[0.42, 0.25, 0]}>
        {/* Dotted/Dashed Orbital Track Ring */}
        {/* @ts-ignore */}
        <lineLoop geometry={orbitLineGeom}>
          <lineBasicMaterial
            color="#00ff99"
            transparent
            opacity={0.5}
            linewidth={1}
          />
        </lineLoop>

        {/* ─── 3. PROXIMITY THREAT PARTICLES (RED DEBRIS & CYAN SATS) ─── */}
        {/* Space Debris (Red warning markers) */}
        <points geometry={debrisGeom}>
          <pointsMaterial
            color="#ff2244"
            size={0.055}
            transparent
            opacity={0.95}
            sizeAttenuation
          />
        </points>

        {/* Orbiting Satellites (Cyan constellation markers) */}
        <points geometry={satelliteGeom}>
          <pointsMaterial
            color="#00f0ff"
            size={0.05}
            transparent
            opacity={0.95}
            sizeAttenuation
          />
        </points>

        {/* ─── 4. USER SPACESHIP GLOWING BEACON MARKER ────────────────── */}
        <group ref={shipMarkerRef}>
          {/* Spaceship Marker Cone */}
          <mesh>
            <coneGeometry args={[0.026, 0.055, 4]} />
            <meshStandardMaterial
              color="#00ff99"
              emissive="#00ff99"
              emissiveIntensity={2.5}
            />
          </mesh>

          {/* Spaceship Beacon Ring */}
          <mesh>
            <ringGeometry args={[0.03, 0.044, 16]} />
            <meshBasicMaterial
              color="#00ff99"
              transparent
              opacity={0.8}
              side={THREE.DoubleSide}
            />
          </mesh>
        </group>

        {/* ─── 5. SCANNING RADAR SWEEP CONE/RING ──────────────────────── */}
        <mesh ref={radarSweepRef} rotation={[0, 0, 0]}>
          <ringGeometry args={[0.01, 0.2, 24]} />
          <meshBasicMaterial
            color="#00ff99"
            transparent
            opacity={0.4}
            side={THREE.DoubleSide}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      </group>
    </group>
  );
}

/**
 * Dynamic Feed Messages Pool
 */
const EDGE_AI_FEED_STREAM = [
  '[EDGE_AI]: Scanning 360° orbital sphere...',
  '[EDGE_AI]: STARLINK-3021 passing at 4.2km (VECTOR SAFE)',
  '[EDGE_AI]: ALERT: Space Junk #9910 detected | Dist: 18.2km | Rel Speed: +1.2km/s',
  '[EDGE_AI]: Trajectory computed: No collision threat. AI Model status nominal.',
  '[EDGE_AI]: COSMOS-2251 debris fragment locked | Δ-V: 0.04 km/s | Margin: +9.8km',
  '[EDGE_AI]: ISS Coplanar synchronization verified. Relative drift steady.',
  '[EDGE_AI]: Atmospheric drag model nominal. Exosphere solar flux: 148 SFU.',
  '[EDGE_AI]: ONEWEB-0142 radar cross-section: 1.1m² | Vector confirmed clear',
  '[EDGE_AI]: Spatial threat index: 0.002% (GREEN // SECURE ORBIT)',
  '[EDGE_AI]: Neural trajectory predictor updated (0.8ms inference cycle)',
];

/**
 * ExpansionSlot02.tsx
 *
 * "Orbital Threat & Edge AI Spatial Radar"
 * Polished compact HUD layout matching Biomechanical Telemetry.
 */
export default function ExpansionSlot02() {
  const [feedLogs, setFeedLogs] = useState<string[]>([
    '[EDGE_AI]: Scanning 360° orbital sphere...',
    '[EDGE_AI]: STARLINK-3021 passing at 4.2km (VECTOR SAFE)',
    '[EDGE_AI]: ALERT: Space Junk #9910 detected | Dist: 18.2km | Rel Speed: +1.2km/s',
    '[EDGE_AI]: Trajectory computed: No collision threat. AI Model status nominal.',
  ]);

  const feedScrollRef = useRef<HTMLDivElement>(null);
  const streamIdxRef = useRef<number>(4);

  // Non-blocking async interval updating Edge AI dynamic feed every 1.5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      const nextLog = EDGE_AI_FEED_STREAM[streamIdxRef.current % EDGE_AI_FEED_STREAM.length];
      streamIdxRef.current += 1;

      setFeedLogs((prev) => {
        const updated = [...prev, nextLog];
        // Keep last 14 logs to prevent unbounded DOM growth
        return updated.length > 14 ? updated.slice(updated.length - 14) : updated;
      });
    }, 1500);

    return () => clearInterval(interval);
  }, []);

  // Auto-scroll feed terminal to bottom smoothly
  useEffect(() => {
    if (feedScrollRef.current) {
      feedScrollRef.current.scrollTop = feedScrollRef.current.scrollHeight;
    }
  }, [feedLogs]);

  return (
    <div
      id="hud-expansion-slot-02-radar"
      className="w-full h-full flex flex-col justify-between font-mono select-none"
    >
      {/* ─── 1. PANEL HEADER BAR (MATCHING BIOMECHANICAL HUD EXACTLY) ── */}
      <div className="flex items-center justify-between pb-1 border-b border-cyan-500/20 shrink-0">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="w-1.5 h-1.5 rounded-full bg-[#00ff99] animate-pulse shrink-0" />
          <h3 className="text-cyan-200 font-bold uppercase tracking-[0.03em] truncate whitespace-nowrap text-[10px]">
            ORBITAL HAZARD RADAR // EDGE AI
          </h3>
        </div>
        <span className="text-[8.5px] text-[#00ff99] font-bold px-1.5 py-0.2 rounded bg-emerald-950/70 border border-emerald-500/40 shrink-0 ml-1 flex items-center gap-1 font-mono">
          <span className="w-1.5 h-1.5 rounded-full bg-[#00ff99] animate-ping shrink-0" />
          SCANNER: ACTIVE
        </span>
      </div>

      {/* ─── 2. MAIN WORKSPACE (3D MINI-GLOBE + TELEMETRY & FEED) ───── */}
      <div className="flex-1 flex items-stretch gap-2 my-0.5 min-h-0">
        {/* LEFT COLUMN: 3D Mini-Orbital Viewport (Clean 3D Globe with Zero Text Blocking) */}
        <div
          style={{
            width: '124px',
            backgroundColor: 'rgba(2, 8, 16, 0.92)',
            borderColor: 'rgba(0, 240, 255, 0.3)',
            boxShadow: 'inset 0 0 16px rgba(0, 240, 255, 0.12)',
          }}
          className="relative rounded-lg border overflow-hidden shrink-0 h-full flex flex-col"
        >
          {/* 3D R3F Canvas - 100% Unblocked Pristine 3D Globe View Centered at [0,0,3.8] */}
          <div className="absolute inset-0">
            <MiniGlobeErrorBoundary>
              <Suspense fallback={null}>
                <Canvas
                  gl={{ antialias: true, alpha: true, powerPreference: 'low-power' }}
                  camera={{ position: [0, 0, 2.3], fov: 45 }}
                  style={{ width: '100%', height: '100%' }}
                >
                  <MiniOrbitalScene />
                </Canvas>
              </Suspense>
            </MiniGlobeErrorBoundary>
          </div>
        </div>

        {/* RIGHT COLUMN: Compact Telemetry Readouts & Auto-scrolling Feed */}
        <div className="flex-1 flex flex-col justify-between min-w-0">
          {/* Primary Telemetry Readouts (Exact Blueprint: strict 8px Monospace) */}
          <div className="px-1.5 py-1 rounded-lg border border-cyan-500/20 bg-slate-950/60 flex flex-col gap-0.5 text-left shrink-0 font-mono">
            <div className="flex items-center justify-between leading-tight whitespace-nowrap" style={{ whiteSpace: 'nowrap' }}>
              <span style={{ fontSize: '8px', opacity: 0.7 }} className="font-mono uppercase tracking-wider text-slate-400 whitespace-nowrap">
                ORBITAL ALTITUDE:
              </span>
              <span style={{ fontSize: '8px' }} className="font-mono font-bold uppercase tracking-wider text-[#00e5ff] whitespace-nowrap">
                408.2 KM <span className="text-slate-500 font-normal">|</span> 7.66 KM/S
              </span>
            </div>
            <div className="flex items-center justify-between leading-tight whitespace-nowrap" style={{ whiteSpace: 'nowrap' }}>
              <span style={{ fontSize: '8px', opacity: 0.7 }} className="font-mono uppercase tracking-wider text-slate-400 whitespace-nowrap">
                TRACKED OBJECTS:
              </span>
              <span style={{ fontSize: '8px' }} className="font-mono font-bold uppercase tracking-wider text-[#00e5ff] whitespace-nowrap">
                142 DEBRIS <span className="text-slate-500 font-normal">/</span> 18 SATELLITES
              </span>
            </div>
            <div className="flex items-center justify-between leading-tight whitespace-nowrap" style={{ whiteSpace: 'nowrap' }}>
              <span style={{ fontSize: '8px', opacity: 0.7 }} className="font-mono uppercase tracking-wider text-slate-400 whitespace-nowrap">
                ATMOSPHERE:
              </span>
              <span style={{ fontSize: '8px' }} className="font-mono font-bold uppercase tracking-wider text-[#00e5ff] whitespace-nowrap truncate ml-1">
                LOW EARTH ORBIT (EXOSPHERE)
              </span>
            </div>
          </div>

          {/* Live Edge AI Dynamic Feed Box (Strict 8px Monospace, Fixed Height) */}
          <div
            style={{
              backgroundColor: 'rgba(2, 6, 23, 0.94)',
              borderColor: 'rgba(0, 240, 255, 0.25)',
              boxShadow: 'inset 0 0 10px rgba(0, 0, 0, 0.85)',
            }}
            className="flex-1 rounded-lg border px-1.5 py-1 flex flex-col gap-0.5 mt-0.5 min-h-0 text-left overflow-hidden"
          >
            {/* Feed Sub-Header: Single Line Inline Layout (Blueprint: 8px) */}
            <div
              style={{
                fontSize: '8px',
                whiteSpace: 'nowrap',
                display: 'flex',
                flexDirection: 'row',
                gap: '6px',
                alignItems: 'center',
              }}
              className="border-b border-cyan-500/15 pb-0.5 shrink-0 font-mono text-slate-300 font-bold uppercase tracking-wider whitespace-nowrap"
            >
              <Activity className="w-2.5 h-2.5 text-[#00ff99] animate-pulse shrink-0" />
              <span style={{ fontSize: '8px' }}>SPATIAL INFERENCE:</span>
              <span style={{ fontSize: '8px' }} className="text-[#00e5ff] font-semibold ml-auto whitespace-nowrap">
                1.5s CYCLE • 0.8ms
              </span>
            </div>

            {/* Scrollable Log Stream Container */}
            <div
              ref={feedScrollRef}
              className="mission-controls-scroll flex-1 overflow-y-auto flex flex-col gap-0.5 pr-0.5"
              style={{ maxHeight: '56px' }}
            >
              {feedLogs.map((log, idx) => {
                const isAlert = log.includes('ALERT:');
                const isSafe = log.includes('SAFE') || log.includes('nominal') || log.includes('SECURE');
                return (
                  <div
                    key={idx}
                    style={{
                      fontSize: '8px',
                      lineHeight: '12px',
                      fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                    }}
                    className={`truncate font-mono ${
                      isAlert
                        ? 'text-amber-300 font-bold'
                        : isSafe
                        ? 'text-[#00ff99] font-medium'
                        : 'text-cyan-200 font-medium'
                    }`}
                  >
                    {log}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
