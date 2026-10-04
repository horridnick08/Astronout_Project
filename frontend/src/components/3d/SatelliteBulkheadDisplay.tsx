import React, { useRef, useMemo, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { missionTimeline } from '../../engine/useMissionTimeline.ts';

/**
 * SatelliteBulkheadDisplay.tsx
 * 
 * 1. Enlarged Photorealistic 3D Earth Hologram (Relocated beside Observation Window):
 *    - Position: X = 1.20m, Y = 1.40m, Z = -2.40m.
 *    - Directly adjacent to the Quantum Core station (Z = -1.8m to -2.1m) and next to the observation window panel.
 *    - Center height set to astronaut's chest/head height (Y = 1.40m).
 *    - Enlarged sphere radius (R = 0.52m) for massive visual impact with high-res surface textures,
 *      Rayleigh atmospheric glow shells, and multiple revolving orbital satellites.
 *    - Dynamic Projection: Powers up when triggered by terminal button / Step 4.
 * 
 * 2. Earth Ground-Link Data Screen (Starboard wall at Z = -0.75m):
 *    - Real-time planetary telemetry, ground station link status ("● DOWNLINK ACTIVE // ISS GROUND STATION").
 *    - In Phase 6 (Outgoing Transmission): Displays active signal wave animations and outgoing status reports.
 * 
 * 3. Starboard Bulkhead Screens:
 *    - Screen 1: SGP4 Orbital Mechanics & Ground Track at Z = 0.85m.
 *    - Screen 2: Satellite Telemetry, Radar Sweep & Subsystems at Z = 0.05m.
 */
export default function SatelliteBulkheadDisplay() {
  const [timelineState, setTimelineState] = useState(missionTimeline.getState());

  useEffect(() => {
    return missionTimeline.subscribe((state) => {
      setTimelineState(state);
    });
  }, []);

  const isHologramActive = timelineState.isHologramActive;
  const isTransmitting = timelineState.stepId === 6;

  // Earth high-resolution diffuse texture
  const earthTexture = useMemo(() => {
    const loader = new THREE.TextureLoader();
    const tex = loader.load('/textures/earth_diffuse.jpg');
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.ClampToEdgeWrapping;
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }, []);

  // Screen 1: SGP4 Orbital Mechanics & Ground Track (Z = 0.85m)
  const { canvasOrbital, texOrbital } = useMemo(() => {
    const c = document.createElement('canvas');
    c.width = 512;
    c.height = 384;
    const tex = new THREE.CanvasTexture(c);
    tex.generateMipmaps = false;
    tex.minFilter = THREE.LinearFilter;
    return { canvasOrbital: c, texOrbital: tex };
  }, []);

  // Screen 2: Rotating Satellite & Subsystem Diagnostics (Z = 0.05m)
  const { canvasSatellite, texSatellite } = useMemo(() => {
    const c = document.createElement('canvas');
    c.width = 512;
    c.height = 384;
    const tex = new THREE.CanvasTexture(c);
    tex.generateMipmaps = false;
    tex.minFilter = THREE.LinearFilter;
    return { canvasSatellite: c, texSatellite: tex };
  }, []);

  // Screen 3: Earth Ground-Link Data Screen (Z = -0.75m)
  const { canvasGroundLink, texGroundLink } = useMemo(() => {
    const c = document.createElement('canvas');
    c.width = 512;
    c.height = 384;
    const tex = new THREE.CanvasTexture(c);
    tex.generateMipmaps = false;
    tex.minFilter = THREE.LinearFilter;
    return { canvasGroundLink: c, texGroundLink: tex };
  }, []);

  // Hologram 3D animation refs
  const hologramRootRef = useRef<THREE.Group>(null);
  const earthGlobeRef = useRef<THREE.Group>(null);
  const orbitRing1Ref = useRef<THREE.Group>(null);
  const orbitRing2Ref = useRef<THREE.Group>(null);
  const satBeacon1Ref = useRef<THREE.Group>(null);
  const satBeacon2Ref = useRef<THREE.Group>(null);
  const beamRef = useRef<THREE.Mesh>(null);
  const lightRef = useRef<THREE.PointLight>(null);

  // Render live animated textures and 3D hologram rotations
  useFrame((state) => {
    const t = state.clock.getElapsedTime();

    // -----------------------------------------------------------------------
    // 1. Draw Screen 1: SGP4 Orbital Mechanics
    // -----------------------------------------------------------------------
    const ctx1 = canvasOrbital.getContext('2d');
    if (ctx1) {
      ctx1.fillStyle = '#020617';
      ctx1.fillRect(0, 0, 512, 384);

      // Coordinate Grid
      ctx1.strokeStyle = 'rgba(56, 189, 248, 0.15)';
      ctx1.lineWidth = 1;
      for (let x = 32; x < 512; x += 48) {
        ctx1.beginPath();
        ctx1.moveTo(x, 40);
        ctx1.lineTo(x, 320);
        ctx1.stroke();
      }
      for (let y = 60; y < 320; y += 40) {
        ctx1.beginPath();
        ctx1.moveTo(32, y);
        ctx1.lineTo(480, y);
        ctx1.stroke();
      }

      // Title
      ctx1.fillStyle = '#38bdf8';
      ctx1.font = 'bold 15px "JetBrains Mono", monospace';
      ctx1.fillText('SGP4 ORBITAL MECHANICS // GROUND TRACK', 24, 30);

      // Orbital Ground Track Sine Wave
      ctx1.strokeStyle = '#0284c7';
      ctx1.lineWidth = 2.5;
      ctx1.beginPath();
      for (let px = 32; px <= 480; px += 4) {
        const py = 180 + Math.sin((px + t * 24) * 0.02) * 75;
        if (px === 32) ctx1.moveTo(px, py);
        else ctx1.lineTo(px, py);
      }
      ctx1.stroke();

      // Satellite blip
      const satPx = 256;
      const satPy = 180 + Math.sin((satPx + t * 24) * 0.02) * 75;
      ctx1.fillStyle = '#f59e0b';
      ctx1.beginPath();
      ctx1.arc(satPx, satPy, 6, 0, Math.PI * 2);
      ctx1.fill();

      // Telemetry readouts
      ctx1.fillStyle = '#94a3b8';
      ctx1.font = '12px "JetBrains Mono", monospace';
      ctx1.fillText('PERIGEE: 418.2 KM   APOGEE: 424.6 KM', 24, 345);
      ctx1.fillText('INCLINATION: 51.64°   PERIOD: 92.8 MIN', 24, 365);

      texOrbital.needsUpdate = true;
    }

    // -----------------------------------------------------------------------
    // 2. Draw Screen 2: Satellite Telemetry & Radar
    // -----------------------------------------------------------------------
    const ctx2 = canvasSatellite.getContext('2d');
    if (ctx2) {
      ctx2.fillStyle = '#020617';
      ctx2.fillRect(0, 0, 512, 384);

      // Radar rings
      ctx2.strokeStyle = 'rgba(6, 182, 212, 0.35)';
      ctx2.beginPath();
      ctx2.arc(256, 185, 105, 0, Math.PI * 2);
      ctx2.arc(256, 185, 70, 0, Math.PI * 2);
      ctx2.arc(256, 185, 35, 0, Math.PI * 2);
      ctx2.stroke();

      // Sweep line
      const sweep = t * 1.6;
      ctx2.strokeStyle = '#22d3ee';
      ctx2.lineWidth = 2;
      ctx2.beginPath();
      ctx2.moveTo(256, 185);
      ctx2.lineTo(256 + Math.cos(sweep) * 105, 185 + Math.sin(sweep) * 105);
      ctx2.stroke();

      // Rotating wireframe satellite symbol
      ctx2.save();
      ctx2.translate(256, 185);
      ctx2.rotate(t * 0.7);
      ctx2.strokeStyle = '#38bdf8';
      ctx2.lineWidth = 2;
      ctx2.strokeRect(-42, -7, 24, 14);
      ctx2.strokeRect(18, -7, 24, 14);
      ctx2.fillStyle = '#0f172a';
      ctx2.fillRect(-12, -12, 24, 24);
      ctx2.strokeRect(-12, -12, 24, 24);
      ctx2.restore();

      // Header
      ctx2.fillStyle = '#00e5ff';
      ctx2.font = 'bold 15px "JetBrains Mono", monospace';
      ctx2.fillText('SAT-09 // EDGE AI TELEMETRY LINK', 24, 30);
      ctx2.font = '12px "JetBrains Mono", monospace';
      ctx2.fillStyle = '#94a3b8';
      ctx2.fillText('UPLINK: 24.84 GHz // DATA RATE: 1.2 GBPS', 24, 50);

      // Status pill
      ctx2.fillStyle = isHologramActive ? 'rgba(16, 185, 129, 0.25)' : 'rgba(6, 182, 212, 0.2)';
      ctx2.fillRect(24, 340, 195, 24);
      ctx2.strokeStyle = isHologramActive ? '#10b981' : '#06b6d4';
      ctx2.strokeRect(24, 340, 195, 24);
      ctx2.fillStyle = isHologramActive ? '#34d399' : '#22d3ee';
      ctx2.font = 'bold 11px "JetBrains Mono", monospace';
      ctx2.fillText(isHologramActive ? '● 3D HOLOGRAM ACTIVE' : '○ HOLOGRAM STANDBY', 32, 356);

      texSatellite.needsUpdate = true;
    }

    // -----------------------------------------------------------------------
    // 3. Draw Screen 3: Earth Ground-Link Data Screen (with Phase 6 Transmit mode)
    // -----------------------------------------------------------------------
    const ctx3 = canvasGroundLink.getContext('2d');
    if (ctx3) {
      ctx3.fillStyle = '#020617';
      ctx3.fillRect(0, 0, 512, 384);

      // Border Bezel
      ctx3.strokeStyle = isTransmitting ? '#10b981' : '#0284c7';
      ctx3.lineWidth = 2;
      ctx3.strokeRect(8, 8, 496, 368);

      // Header
      ctx3.fillStyle = isTransmitting ? '#34d399' : '#38bdf8';
      ctx3.font = 'bold 15px "JetBrains Mono", monospace';
      ctx3.fillText(
        isTransmitting ? 'EARTH TRANSMISSION // OUTGOING TELEMETRY FEED' : 'EARTH GROUND-LINK // DEEP SPACE NETWORK',
        20,
        32
      );

      // Primary Status Banner
      ctx3.fillStyle = isTransmitting ? 'rgba(16, 185, 129, 0.35)' : 'rgba(16, 185, 129, 0.2)';
      ctx3.fillRect(20, 44, 472, 28);
      ctx3.strokeStyle = '#10b981';
      ctx3.strokeRect(20, 44, 472, 28);
      ctx3.fillStyle = '#34d399';
      ctx3.font = 'bold 13px "JetBrains Mono", monospace';
      ctx3.fillText(
        isTransmitting
          ? '● OUTGOING TRANSMISSION ACTIVE // DSN BASE LINK LOCKED'
          : '● DOWNLINK ACTIVE // ISS GROUND STATION',
        32,
        63
      );

      // Latency & Frequency Readout
      ctx3.fillStyle = '#00e5ff';
      ctx3.font = 'bold 12px "JetBrains Mono", monospace';
      const latencyVal = (41.4 + Math.sin(t * 1.5) * 1.2).toFixed(1);
      ctx3.fillText(
        isTransmitting
          ? `BURST TRANSMIT: 1.2 GBPS   BURST PACKETS: ${Math.floor(t * 32) % 9999} KB`
          : `SIGNAL LATENCY: ${latencyVal} ms   KU-BAND: 24.85 GHz`,
        20,
        96
      );

      // DSN Stations Status Grid
      const dsnStations = [
        { name: 'DSN-14 GOLDSTONE', snr: '44.2 dB', stat: isTransmitting ? 'BURST UPLINK' : 'LOCKED', col: '#10b981' },
        { name: 'DSN-63 MADRID',    snr: '39.8 dB', stat: isTransmitting ? 'SYNC VERIFIED' : 'DOWNLINK', col: '#00e5ff' },
        { name: 'DSN-43 CANBERRA',  snr: '46.1 dB', stat: isTransmitting ? 'CARRIER LOCK' : 'TRACKING', col: '#38bdf8' }
      ];

      dsnStations.forEach((dsn, idx) => {
        const y = 120 + idx * 26;
        ctx3.fillStyle = '#94a3b8';
        ctx3.font = '11px "JetBrains Mono", monospace';
        ctx3.fillText(dsn.name, 20, y);
        ctx3.fillStyle = '#f8fafc';
        ctx3.fillText(dsn.snr, 260, y);
        ctx3.fillStyle = dsn.col;
        ctx3.font = 'bold 11px "JetBrains Mono", monospace';
        ctx3.fillText(`● ${dsn.stat}`, 380, y);
      });

      // Live Oscilloscope Carrier Wave Graph
      ctx3.fillStyle = '#090d16';
      ctx3.fillRect(20, 200, 472, 75);
      ctx3.strokeStyle = isTransmitting ? '#10b981' : '#1e293b';
      ctx3.strokeRect(20, 200, 472, 75);

      // Grid lines inside graph
      ctx3.strokeStyle = 'rgba(56, 189, 248, 0.12)';
      ctx3.lineWidth = 1;
      for (let gx = 20; gx <= 492; gx += 40) {
        ctx3.beginPath();
        ctx3.moveTo(gx, 200);
        ctx3.lineTo(gx, 275);
        ctx3.stroke();
      }
      ctx3.beginPath();
      ctx3.moveTo(20, 237.5);
      ctx3.lineTo(492, 237.5);
      ctx3.stroke();

      // Dynamic modulated carrier waveform
      ctx3.strokeStyle = isTransmitting ? '#34d399' : '#00f0ff';
      ctx3.lineWidth = isTransmitting ? 2.5 : 2;
      ctx3.beginPath();
      for (let px = 20; px <= 492; px += 3) {
        const speed = isTransmitting ? 12 : 6;
        const phase = (px - 20) * 0.08 + t * speed;
        const amp = (isTransmitting ? 32 : 24) * Math.sin(phase * 0.4) * Math.sin(phase);
        const py = 237.5 + amp;
        if (px === 20) ctx3.moveTo(px, py);
        else ctx3.lineTo(px, py);
      }
      ctx3.stroke();

      // Carrier waveform label
      ctx3.fillStyle = isTransmitting ? '#6ee7b7' : '#38bdf8';
      ctx3.font = '10px "JetBrains Mono", monospace';
      ctx3.fillText(
        isTransmitting ? '>>> OUTGOING HIGH-RATE RF PACKET STREAM <<<' : 'CARRIER DEMODULATION // IF 70.0 MHz',
        28,
        216
      );

      // Planetary Telemetry Feeds
      const telemetryRows = isTransmitting
        ? [
            'STATUS: TRANSMITTING TO EARTH BASE // REPORT BURST 100%',
            'DATA INTEGRITY: VERIFIED // SHA-256 TELEMETRY SEALED',
            'EARTH BASE ACKNOWLEDGEMENT: RECEIVED // LINK NOMINAL'
          ]
        : [
            'SUB-SATELLITE GROUND TRACK: 28.5721° N, 80.6480° W (KSC)',
            'DATA RATE: 300.0 MBPS   FRAME SYNC: 100% NOMINAL',
            'INCOMING TELEMETRY BUFFER: 0 BYTES PENDING // ZERO LOSS'
          ];

      telemetryRows.forEach((row, i) => {
        ctx3.fillStyle = i === 0 ? (isTransmitting ? '#34d399' : '#facc15') : '#94a3b8';
        ctx3.font = '11px "JetBrains Mono", monospace';
        ctx3.fillText(row, 20, 305 + i * 22);
      });

      texGroundLink.needsUpdate = true;
    }

    // -----------------------------------------------------------------------
    // 4. Animate 3D Hologram Components (Event-Driven Activation & Scaled Rotation)
    // -----------------------------------------------------------------------
    // Instantaneous live projection check from engine
    const active = missionTimeline.getIsHologramActive();

    if (hologramRootRef.current) {
      const targetScale = active ? 1.0 : 0.0;
      hologramRootRef.current.scale.lerp(
        new THREE.Vector3(targetScale, targetScale, targetScale),
        active ? 0.08 : 0.22
      );
      if (active) {
        hologramRootRef.current.visible = true;
      } else if (hologramRootRef.current.scale.x < 0.03) {
        hologramRootRef.current.visible = false;
      }
    }

    if (lightRef.current) {
      const targetIntensity = active ? 3.4 : 0.0;
      lightRef.current.intensity = THREE.MathUtils.lerp(
        lightRef.current.intensity,
        targetIntensity,
        active ? 0.1 : 0.25
      );
    }

    if (beamRef.current) {
      const beamMat = beamRef.current.material as THREE.MeshBasicMaterial;
      if (beamMat) {
        const targetOpacity = active ? 0.18 : 0.0;
        beamMat.opacity = THREE.MathUtils.lerp(
          beamMat.opacity,
          targetOpacity,
          active ? 0.1 : 0.25
        );
      }
      beamRef.current.scale.set(
        1 + Math.sin(t * 2.5) * 0.03,
        1,
        1 + Math.cos(t * 2.5) * 0.03
      );
    }

    if (earthGlobeRef.current) {
      // Natural slow planetary rotation on axial tilt
      earthGlobeRef.current.rotation.y = t * 0.15;
    }

    // Orbit Ring 1: ISS Low-Earth Orbit (51.6° Inclination)
    if (orbitRing1Ref.current) {
      orbitRing1Ref.current.rotation.z = 0.88 + Math.sin(t * 0.15) * 0.03;
    }
    if (satBeacon1Ref.current) {
      const orbAngle = t * 1.15;
      const orbRadius = 0.82; // Scaled for enlarged Earth
      satBeacon1Ref.current.position.set(
        Math.cos(orbAngle) * orbRadius,
        Math.sin(orbAngle) * 0.38,
        Math.sin(orbAngle) * orbRadius
      );
      satBeacon1Ref.current.rotation.y = -orbAngle;
    }

    // Orbit Ring 2: Polar Orbital Relay (Tilted 78°)
    if (orbitRing2Ref.current) {
      orbitRing2Ref.current.rotation.x = -0.75 + Math.cos(t * 0.12) * 0.02;
    }
    if (satBeacon2Ref.current) {
      const orbAngle2 = -t * 0.85 + Math.PI;
      const orbRadius2 = 0.96; // Scaled for enlarged Earth
      satBeacon2Ref.current.position.set(
        Math.sin(orbAngle2) * 0.32,
        Math.cos(orbAngle2) * orbRadius2,
        Math.sin(orbAngle2) * orbRadius2
      );
      satBeacon2Ref.current.rotation.x = orbAngle2;
    }
  });

  return (
    <group name="Bulkhead_Screens_And_Realistic_Earth_Hologram">
      {/* ========================================================================= */}
      {/* 1. STATION 6: SECONDARY TELEMETRY & DOWNLINK SCREEN (X = 1.84m, Z = 1.00m)*/}
      {/*    AABB: X: [1.55, 2.10], Y: [0.6, 2.1], Z: [0.45, 1.55]                  */}
      {/* ========================================================================= */}
      <group position={[1.84, 1.35, 1.00]} rotation={[0, -Math.PI / 2, 0]} name="Station6_Downlink_Screen">
        <mesh position={[0, 0, -0.04]}>
          <boxGeometry args={[1.12, 0.94, 0.06]} />
          <meshStandardMaterial color="#090d16" metalness={0.92} roughness={0.2} />
        </mesh>
        <mesh position={[0, 0, 0.005]}>
          <planeGeometry args={[1.05, 0.88]} />
          <meshBasicMaterial map={texGroundLink} />
        </mesh>
        <mesh position={[0, 0, 0.006]}>
          <ringGeometry args={[0.52, 0.53, 4]} />
          <meshBasicMaterial color={isTransmitting ? '#10b981' : '#00f0ff'} />
        </mesh>
        <pointLight position={[0, 0, 0.35]} color={isTransmitting ? '#10b981' : '#00e5ff'} intensity={1.5} distance={2.5} decay={2} />
      </group>

      {/* ========================================================================= */}
      {/* 2. STATION 4: ORBIT RADAR & SGP4 SATELLITE SCREEN (X = 1.84m, Z = -0.20m) */}
      {/*    AABB: X: [1.55, 2.10], Y: [0.6, 2.1], Z: [-0.75, 0.35]                 */}
      {/* ========================================================================= */}
      <group position={[1.84, 1.35, -0.20]} rotation={[0, -Math.PI / 2, 0]} name="Station4_Orbit_Radar_Screen">
        <mesh position={[0, 0, -0.04]}>
          <boxGeometry args={[1.12, 0.94, 0.06]} />
          <meshStandardMaterial color="#0f172a" metalness={0.92} roughness={0.2} />
        </mesh>
        <mesh
          position={[0, 0, 0.005]}
          onClick={() => missionTimeline.toggleHologram()}
          className="cursor-pointer"
        >
          <planeGeometry args={[1.05, 0.88]} />
          <meshBasicMaterial map={texSatellite} />
        </mesh>
        <mesh position={[0, 0, 0.006]}>
          <ringGeometry args={[0.52, 0.53, 4]} />
          <meshBasicMaterial color="#00e5ff" />
        </mesh>
        <pointLight position={[0, 0, 0.35]} color="#00e5ff" intensity={1.5} distance={2.5} decay={2} />
      </group>

      {/* ========================================================================= */}
      {/* 3. STATION 4: 3D EARTH HOLOGRAM PEDESTAL & GLOBE (X = 1.45m, Z = -2.30m)  */}
      {/*    Event-Driven projection: Hidden by default, active during Station 4 dwell */}
      {/*    Center Height: Y = 1.40m (matches astronaut chest/head height)         */}
      {/*    Enlarged Radius: R = 0.50m (High-impact visual presence)               */}
      {/*    AABB: X: [1.05, 1.85], Y: [0.0, 2.0], Z: [-2.75, -1.85]                */}
      {/* ========================================================================= */}
      <group position={[1.45, 1.40, -2.30]} name="Realistic_Earth_Hologram_Station">
        {/* Holographic Illumination Spotlight (0 intensity when inactive) */}
        <pointLight ref={lightRef} color="#00f0ff" intensity={0} distance={4.5} decay={2} />

        {/* Floor Pedestal Holographic Emitter Directly Below at Y = -1.40 (Floor level 0) */}
        <group position={[0, -1.40, 0]}>
          {/* Emitter Base Chassis */}
          <mesh position={[0, 0.03, 0]}>
            <cylinderGeometry args={[0.46, 0.52, 0.06, 32]} />
            <meshStandardMaterial color="#090d16" metalness={0.92} roughness={0.2} />
          </mesh>
          {/* Illuminated Emitter Ring */}
          <mesh position={[0, 0.065, 0]}>
            <ringGeometry args={[0.30, 0.44, 32]} />
            <meshBasicMaterial color={isHologramActive ? '#00e5ff' : '#0369a1'} side={THREE.DoubleSide} />
          </mesh>
          {/* Hazard Border Decal */}
          <mesh position={[0, 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.52, 0.58, 32]} />
            <meshStandardMaterial color="#f59e0b" emissive="#d97706" emissiveIntensity={0.5} />
          </mesh>
        </group>

        {/* Dynamic Projecting Volumetric Cone & Enlarged 3D Earth Globe (Hidden by default) */}
        <group ref={hologramRootRef} visible={false} scale={[0, 0, 0]}>
          {/* Vertical Volumetric Projection Beam Rising from Floor Emitter */}
          <mesh ref={beamRef} position={[0, -0.70, 0]}>
            <cylinderGeometry args={[0.52, 0.32, 1.40, 32, 1, true]} />
            <meshBasicMaterial
              color="#00e5ff"
              transparent
              opacity={0}
              side={THREE.DoubleSide}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
            />
          </mesh>

          {/* =================================================================== */}
          {/* ENLARGED PHOTOREALISTIC 3D EARTH GLOBE (R = 0.52m)                  */}
          {/* =================================================================== */}
          <group ref={earthGlobeRef} rotation={[0.23, 0, 0]}>
            {/* 1. High-Fidelity Textured Earth Sphere */}
            <mesh castShadow receiveShadow>
              <sphereGeometry args={[0.52, 64, 64]} />
              <meshStandardMaterial
                map={earthTexture}
                roughness={0.42}
                metalness={0.08}
                emissive="#04162e"
                emissiveIntensity={0.35}
              />
            </mesh>

            {/* 2. Inner Atmospheric Rayleigh Glow */}
            <mesh>
              <sphereGeometry args={[0.532, 48, 48]} />
              <meshBasicMaterial
                color="#00f0ff"
                transparent
                opacity={0.24}
                blending={THREE.AdditiveBlending}
                depthWrite={false}
              />
            </mesh>

            {/* 3. Outer Atmosphere Glow Shell (Cyan Fresnel Backside Glow) */}
            <mesh>
              <sphereGeometry args={[0.56, 48, 48]} />
              <meshStandardMaterial
                color="#38bdf8"
                transparent
                opacity={0.42}
                side={THREE.BackSide}
                blending={THREE.AdditiveBlending}
                depthWrite={false}
                emissive="#0284c7"
                emissiveIntensity={1.0}
              />
            </mesh>
          </group>

          {/* =================================================================== */}
          {/* REVOLVING ORBITAL SATELLITES                                        */}
          {/* =================================================================== */}
          
          {/* ORBIT RING 1: ISS Orbital Trajectory (51.6° Inclination) */}
          <group ref={orbitRing1Ref} rotation={[0.42, 0.35, 0.88]}>
            {/* Glowing Orbit Vector Ring */}
            <mesh>
              <torusGeometry args={[0.82, 0.009, 16, 64]} />
              <meshBasicMaterial
                color="#22d3ee"
                transparent
                opacity={0.88}
                blending={THREE.AdditiveBlending}
              />
            </mesh>

            {/* Revolving Primary Satellite (ISS / CommSat) */}
            <group ref={satBeacon1Ref}>
              {/* Satellite Body */}
              <mesh>
                <boxGeometry args={[0.065, 0.034, 0.034]} />
                <meshStandardMaterial
                  color="#f8fafc"
                  emissive="#00e5ff"
                  emissiveIntensity={2.4}
                  toneMapped={false}
                />
              </mesh>
              {/* Left Solar Array */}
              <mesh position={[-0.066, 0, 0]}>
                <boxGeometry args={[0.058, 0.022, 0.005]} />
                <meshStandardMaterial color="#0284c7" emissive="#0369a1" emissiveIntensity={1.8} />
              </mesh>
              {/* Right Solar Array */}
              <mesh position={[0.066, 0, 0]}>
                <boxGeometry args={[0.058, 0.022, 0.005]} />
                <meshStandardMaterial color="#0284c7" emissive="#0369a1" emissiveIntensity={1.8} />
              </mesh>
              {/* Active Telemetry Beacon Light */}
              <pointLight color="#22d3ee" intensity={1.8} distance={1.5} decay={2} />
            </group>
          </group>

          {/* ORBIT RING 2: Polar Orbital Relay Trajectory (78° Inclination) */}
          <group ref={orbitRing2Ref} rotation={[-0.75, 0.2, 0.3]}>
            {/* Glowing Orbit Vector Ring */}
            <mesh>
              <torusGeometry args={[0.96, 0.008, 16, 64]} />
              <meshBasicMaterial
                color="#10b981"
                transparent
                opacity={0.75}
                blending={THREE.AdditiveBlending}
              />
            </mesh>

            {/* Revolving Polar Relay Satellite */}
            <group ref={satBeacon2Ref}>
              <mesh>
                <cylinderGeometry args={[0.022, 0.026, 0.048, 12]} />
                <meshStandardMaterial color="#e2e8f0" emissive="#34d399" emissiveIntensity={2.2} />
              </mesh>
              {/* Dish Antenna */}
              <mesh position={[0, 0.03, 0]} rotation={[Math.PI / 4, 0, 0]}>
                <coneGeometry args={[0.032, 0.016, 16, 1, true]} />
                <meshStandardMaterial color="#facc15" side={THREE.DoubleSide} />
              </mesh>
              <pointLight color="#10b981" intensity={1.6} distance={1.2} decay={2} />
            </group>
          </group>

          {/* Concentric Floating Holographic HUD Data Rings */}
          <mesh position={[0, -0.42, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.66, 0.68, 48]} />
            <meshBasicMaterial color="#10b981" transparent opacity={0.65} blending={THREE.AdditiveBlending} />
          </mesh>
          <mesh position={[0, 0.42, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.62, 0.64, 48]} />
            <meshBasicMaterial color="#00e5ff" transparent opacity={0.55} blending={THREE.AdditiveBlending} />
          </mesh>
        </group>
      </group>
    </group>
  );
}
