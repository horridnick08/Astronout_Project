import React, { useState, useEffect } from 'react';
import * as THREE from 'three';
import { Activity, Cpu, Layers, Radio, Shield, Terminal, ArrowUpRight, Crosshair } from 'lucide-react';
import { zeroGKinematics } from '../../engine/useZeroGKinematics.ts';

/**
 * KinematicsTelemetryHUD.tsx
 *
 * Professional Biomechanical Telemetry & Expansion Standby HUD:
 * - Positioned adjacent to CAM STANDBY (right: calc(1rem + 310px + 16px)) with exact height match (192px / h-48).
 * - Box 1: "ASTRONAUT BIOMECHANICAL TELEMETRY // REAL-TIME SE(3)" streaming live kinematics.
 * - Box 2: "AUXILIARY MODULE // EXPANSION SLOT 02" clean professional standby slot.
 * - Leaves remaining space on the far-left open for upcoming feature modules.
 */
interface KinematicsTelemetryHUDProps {
  isSidebarOpen: boolean;
}

export default function KinematicsTelemetryHUD({ isSidebarOpen }: KinematicsTelemetryHUDProps) {
  const [telemetry, setTelemetry] = useState({
    // Body trajectory & orientation
    roll: '0.0',
    pitch: '0.0',
    yaw: '-90.0',
    angVelocity: '0.0',
    elevation: '0.000',
    isMoving: false,
    isOopsActive: false,

    // Joint & limb movement
    lhDelta: '[-0.18, 0.05, 0.28]',
    lhVel: '0.00',
    rhDelta: '[0.18, 0.05, 0.28]',
    rhVel: '0.00',
    thrustForce: '0',
    collisionState: 'SURFACE ANCHORED',
  });

  // Sample real-time dynamic kinematics at ~20fps (every 50ms)
  useEffect(() => {
    const timer = setInterval(() => {
      if (zeroGKinematics) {
        const q = zeroGKinematics.quaternion || new THREE.Quaternion();
        const euler = new THREE.Euler().setFromQuaternion(q, 'YXZ');
        const rollDeg = (euler.z * (180 / Math.PI)).toFixed(1);
        const pitchDeg = (euler.x * (180 / Math.PI)).toFixed(1);
        const yawDeg = (euler.y * (180 / Math.PI)).toFixed(1);

        const vel = zeroGKinematics.velocity || new THREE.Vector3();
        const velLen = vel.length();
        const angVel = (velLen * 18.5).toFixed(1);

        const elevOffset = Math.max(0, zeroGKinematics.elevationY - zeroGKinematics.baseY).toFixed(3);
        const moving = zeroGKinematics.isMoving || false;
        const oops = zeroGKinematics.isOopsActive || false;

        const armLag = zeroGKinematics.armLag || { x: 0, y: 0 };
        const interact = zeroGKinematics.stationInteractionWeight || 0;

        // Dynamic hand deltas based on suit inertia and station interaction
        const lhX = (-0.18 + armLag.x * 0.35).toFixed(2);
        const lhY = (0.04 + interact * 0.22).toFixed(2);
        const lhZ = (0.28 + armLag.y * 0.35).toFixed(2);
        const lhVelocity = (velLen * 0.8 + Math.abs(armLag.x) * 0.4).toFixed(2);

        const rhX = (0.18 - armLag.x * 0.35).toFixed(2);
        const rhY = (0.04 + interact * 0.28).toFixed(2);
        const rhZ = (0.28 - armLag.y * 0.35).toFixed(2);
        const rhVelocity = (velLen * 0.85 + Math.abs(armLag.y) * 0.4).toFixed(2);

        // Ground impulse & thrust in Newtons (EVA suit mass: 140kg)
        const thrust = moving
          ? Math.round(140 * (1.15 + (zeroGKinematics.hopProgress ? Math.sin(zeroGKinematics.hopProgress * Math.PI) * 0.4 : 0.2))).toString()
          : '0';

        const collision = oops
          ? 'REBOUND // ATTITUDE RESTORE'
          : moving
          ? 'BALLISTIC TRAVERSAL'
          : 'SURFACE ANCHORED';

        setTelemetry({
          roll: rollDeg,
          pitch: pitchDeg,
          yaw: yawDeg,
          angVelocity: angVel,
          elevation: elevOffset,
          isMoving: moving,
          isOopsActive: oops,
          lhDelta: `[${lhX}, ${lhY}, ${lhZ}]`,
          lhVel: lhVelocity,
          rhDelta: `[${rhX}, ${rhY}, ${rhZ}]`,
          rhVel: rhVelocity,
          thrustForce: thrust,
          collisionState: collision,
        });
      }
    }, 50);

    return () => clearInterval(timer);
  }, []);

  // Sidebar width: 280px, left start: 1rem(16px) → right edge: 296px
  // Add 20px gap → left anchor when open: 316px
  const sidebarOffset = isSidebarOpen ? '316px' : '1rem';

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '1rem',
        left: sidebarOffset,
        right: 'calc(1rem + 310px + 16px)',
        height: '192px',
        zIndex: 25,
        transition: 'left 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        minWidth: '300px',
      }}
      className="pointer-events-auto select-none font-mono grid grid-cols-2 gap-3"
    >
      {/* ===================================================================== */}
      {/* BOX 1: ASTRONAUT BIOMECHANICAL TELEMETRY // REAL-TIME SE(3)           */}
      {/* ===================================================================== */}
      <div
        style={{
          backgroundColor: 'rgba(10, 20, 30, 0.85)',
          borderColor: 'rgba(0, 240, 255, 0.4)',
          boxShadow: '0 12px 30px rgba(0, 0, 0, 0.75), 0 0 20px rgba(0, 240, 255, 0.15)',
        }}
        className="flex flex-col h-full rounded-xl border backdrop-blur-md overflow-hidden p-2.5 transition-all duration-300 justify-between"
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between pb-1.5 border-b border-cyan-500/20">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping shrink-0" />
            <h3 className="text-cyan-200 font-bold tracking-wider uppercase text-[10px] truncate">
              ASTRONAUT BIOMECHANICAL TELEMETRY // REAL-TIME SE(3)
            </h3>
          </div>
          <span className="text-[8px] text-cyan-300 font-bold px-1.5 py-0.5 rounded bg-cyan-950/70 border border-cyan-500/30 shrink-0 ml-1">
            SE(3)
          </span>
        </div>

        {/* 2-Column Telemetry Stream Layout */}
        <div className="grid grid-cols-2 gap-2 text-[9px] leading-tight my-auto">
          {/* Sub-Column A: Joint & Limb Movement */}
          <div className="flex flex-col gap-1.5 border-r border-cyan-500/10 pr-2">
            <div className="flex items-center gap-1 text-[8px] text-slate-400 uppercase tracking-widest font-semibold">
              <Activity className="w-2.5 h-2.5 text-cyan-400" />
              <span>JOINT & LIMB DYNAMICS</span>
            </div>

            {/* Left Hand Delta */}
            <div className="flex flex-col">
              <div className="flex justify-between text-slate-400 text-[8px]">
                <span>LEFT HAND Δ</span>
                <span className="text-cyan-300">{telemetry.lhVel} m/s</span>
              </div>
              <span className="text-slate-200 font-mono text-[8.5px] truncate">
                {telemetry.lhDelta}
              </span>
            </div>

            {/* Right Hand Delta */}
            <div className="flex flex-col">
              <div className="flex justify-between text-slate-400 text-[8px]">
                <span>RIGHT HAND Δ</span>
                <span className="text-cyan-300">{telemetry.rhVel} m/s</span>
              </div>
              <span className="text-slate-200 font-mono text-[8.5px] truncate">
                {telemetry.rhDelta}
              </span>
            </div>

            {/* Legs / Lower Body Impulse */}
            <div className="flex flex-col pt-0.5">
              <span className="text-slate-400 text-[8px]">LOWER BODY IMPULSE</span>
              <div className="flex items-center justify-between text-[8px]">
                <span className="text-emerald-400 font-bold">{telemetry.thrustForce} N</span>
                <span
                  className={`px-1 py-0.2 rounded text-[7.5px] font-bold ${
                    telemetry.isOopsActive
                      ? 'bg-amber-950/80 text-amber-300 border border-amber-500/40 animate-pulse'
                      : telemetry.isMoving
                      ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-500/40'
                      : 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/30'
                  }`}
                >
                  {telemetry.collisionState}
                </span>
              </div>
            </div>
          </div>

          {/* Sub-Column B: Body Trajectory & Orientation */}
          <div className="flex flex-col gap-1.5 pl-0.5">
            <div className="flex items-center gap-1 text-[8px] text-slate-400 uppercase tracking-widest font-semibold">
              <Crosshair className="w-2.5 h-2.5 text-emerald-400" />
              <span>ORIENTATION & SE(3)</span>
            </div>

            {/* Roll / Pitch / Yaw */}
            <div className="flex flex-col">
              <div className="flex justify-between text-slate-400 text-[8px]">
                <span>ROLL / PITCH / YAW</span>
                <span className="text-slate-400">{telemetry.angVelocity}°/s</span>
              </div>
              <div className="flex justify-between text-[8.5px] text-cyan-200 font-mono">
                <span>R:{telemetry.roll}°</span>
                <span>P:{telemetry.pitch}°</span>
                <span>Y:{telemetry.yaw}°</span>
              </div>
            </div>

            {/* Jump & Micro-G Elevation */}
            <div className="flex flex-col">
              <span className="text-slate-400 text-[8px]">JUMP & MICRO-G ELEVATION</span>
              <div className="flex items-center justify-between text-[8.5px]">
                <span className="text-emerald-300 font-semibold font-mono">
                  Δh: +{telemetry.elevation} m
                </span>
                <span className="text-[7.5px] text-slate-400">
                  {telemetry.isMoving ? 'LOW-G FLIGHT' : 'GROUND REST'}
                </span>
              </div>
            </div>

            {/* Spatial Transform Matrix */}
            <div className="flex flex-col pt-0.5">
              <span className="text-slate-400 text-[8px]">SPATIAL TRANSFORM MATRIX</span>
              <div className="p-1 rounded bg-slate-950/70 border border-cyan-500/20 text-[8px] flex items-center justify-between">
                <span className="text-cyan-300 font-mono">SE(3) → R_rack</span>
                <span className="text-emerald-400 font-bold">INVARIANT</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Sub-Strip */}
        <div className="pt-1 border-t border-cyan-500/10 flex items-center justify-between text-[8px] text-slate-400">
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            360° MICRO-G RIGID INVARIANCE
          </span>
          <span className="text-cyan-400 font-mono">RATE: 20Hz</span>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* BOX 2: AUXILIARY MODULE // EXPANSION SLOT 02                          */}
      {/* ===================================================================== */}
      <div
        style={{
          backgroundColor: 'rgba(10, 20, 30, 0.85)',
          borderColor: 'rgba(0, 240, 255, 0.3)',
          boxShadow: '0 12px 30px rgba(0, 0, 0, 0.7), 0 0 15px rgba(0, 240, 255, 0.08)',
        }}
        className="flex flex-col h-full rounded-xl border backdrop-blur-md overflow-hidden p-2.5 transition-all duration-300 justify-between"
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between pb-1.5 border-b border-cyan-500/20">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400/80 animate-pulse shrink-0" />
            <h3 className="text-slate-200 font-bold tracking-wider uppercase text-[10px] truncate">
              AUXILIARY MODULE // EXPANSION SLOT 02
            </h3>
          </div>
          <span className="text-[8px] text-amber-300 font-mono px-1.5 py-0.5 rounded bg-amber-950/60 border border-amber-500/30 shrink-0 ml-1">
            STANDBY
          </span>
        </div>

        {/* Clean Professional Standby Interior */}
        <div className="flex-1 flex flex-col items-center justify-center p-2.5 my-1 rounded-lg border border-dashed border-cyan-500/20 bg-slate-950/40 text-center gap-2">
          <div className="relative flex items-center justify-center">
            <span className="w-6 h-6 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center">
              <Layers className="w-3.5 h-3.5 text-cyan-400/70" />
            </span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-[9.5px] font-bold text-cyan-300/90 tracking-wider uppercase">
              SYSTEM STANDBY // AWAITING FEATURE TELEMETRY HOOK
            </span>
            <span className="text-[8px] text-slate-500 tracking-wider">
              BUS 02 READY • DEDICATED EXPANSION CHANNEL
            </span>
          </div>
        </div>

        {/* Bottom Sub-Strip */}
        <div className="pt-1 border-t border-cyan-500/10 flex items-center justify-between text-[8px] text-slate-400">
          <span className="flex items-center gap-1">
            <Radio className="w-2.5 h-2.5 text-amber-400 animate-pulse" />
            SOCKET READY
          </span>
          <span className="text-slate-500 font-mono">LATENCY: 0ms</span>
        </div>
      </div>
    </div>
  );
}