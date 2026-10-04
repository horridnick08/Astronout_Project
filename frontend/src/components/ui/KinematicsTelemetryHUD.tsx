import React, { useState, useEffect } from 'react';
import * as THREE from 'three';
import { Activity, Layers, Radio, Crosshair, AlertTriangle, ChevronUp, ChevronDown } from 'lucide-react';
import { zeroGKinematics } from '../../engine/useZeroGKinematics.ts';
import { KinematicSafetyState } from '../../engine/KinematicSafetyManager.ts';
import { digitalTwinReplayManager } from '../../engine/DigitalTwinReplayManager.ts';
import { videoPoseTracker } from '../../engine/VideoPoseTracker.ts';
import ExpansionSlot02 from './ExpansionSlot02.tsx';

/**
 * KinematicsTelemetryHUD.tsx
 *
 * Professional Biomechanical Telemetry & Expansion Standby HUD:
 * - Normal Mode:
 *     * Positioned adjacent to CAM STANDBY (right: calc(1rem + 310px + 16px)) with exact height match (192px / h-48).
 *     * Box 1: "ASTRONAUT BIOMECHANICAL TELEMETRY // REAL-TIME SE(3)" (Clean Overview State).
 *     * Box 2: "AUXILIARY MODULE // EXPANSION SLOT 02".
 * - Digital Twin Replay Mode:
 *     * Relocates Box 1 to top-right overlay area of 3D Viewport directly below camera buttons.
 *     * Ultra-compact scaled size (width: 310px, padding: 5px 8px, uniform 9px-10px monospace).
 *     * Collapsible slide-up toggle mechanism ([HIDE] ▲ / ▼ TELEMETRY).
 *     * Programmatically HIDES Slot 02 to free bottom viewport space for timeline scrubber.
 *     * Restores Slot 02 when exiting replay mode.
 */
interface KinematicsTelemetryHUDProps {
  isSidebarOpen: boolean;
  safetyState?: KinematicSafetyState;
  isReplayActive?: boolean;
}

export default function KinematicsTelemetryHUD({ isSidebarOpen, safetyState, isReplayActive: isReplayProp }: KinematicsTelemetryHUDProps) {
  const [replayStateActive, setReplayStateActive] = useState<boolean>(() => digitalTwinReplayManager.getState().isActive);
  const [isTelemetryCollapsed, setIsTelemetryCollapsed] = useState<boolean>(false);

  useEffect(() => {
    return digitalTwinReplayManager.subscribe((st) => setReplayStateActive(st.isActive));
  }, []);

  const isReplay = isReplayProp ?? replayStateActive;

  const [telemetry, setTelemetry] = useState({
    roll: '0.0',
    pitch: '0.0',
    yaw: '-90.0',
    angVelocity: '0.0',
    elevation: '0.000',
    isMoving: false,
    isOopsActive: false,
    lhDelta: '[-0.18, 0.05, 0.28]',
    lhVel: '0.16',
    rhDelta: '[0.18, 0.05, 0.28]',
    rhVel: '0.18',
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
        const moving = Boolean(zeroGKinematics.isMoving);
        const oops = Boolean(zeroGKinematics.isOopsActive);

        const armLag = (zeroGKinematics as any).armLag || { x: 0, y: 0 };
        const interact = (zeroGKinematics as any).stationInteractionWeight || 0;

        // Dynamic hand deltas based on suit inertia and station interaction
        const lhX = (-0.18 + armLag.x * 0.35).toFixed(2);
        const lhY = (0.04 + interact * 0.22).toFixed(2);
        const lhZ = (0.28 + armLag.y * 0.35).toFixed(2);
        const defaultLhVel = (safetyState?.lhVel ?? (0.16 + Math.abs(armLag.x) * 0.2)).toFixed(2);

        const rhX = (0.18 - armLag.x * 0.35).toFixed(2);
        const rhY = (0.04 + interact * 0.28).toFixed(2);
        const rhZ = (0.28 - armLag.y * 0.35).toFixed(2);
        const defaultRhVel = (safetyState?.rhVel ?? (0.18 + Math.abs(armLag.y) * 0.2)).toFixed(2);

        // Feed real-time calculated wrist & limb velocities from the VideoPoseTracker
        const vpKinematics = videoPoseTracker.getKinematics();
        const finalLhVel = vpKinematics?.lhVel ?? defaultLhVel;
        const finalRhVel = vpKinematics?.rhVel ?? defaultRhVel;
        const finalAngVel = vpKinematics?.angVelocity ?? angVel;
        const finalLhDelta = vpKinematics?.lhDelta ?? `[${lhX}, ${lhY}, ${lhZ}]`;
        const finalRhDelta = vpKinematics?.rhDelta ?? `[${rhX}, ${rhY}, ${rhZ}]`;

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
          angVelocity: finalAngVel,
          elevation: elevOffset,
          isMoving: moving,
          isOopsActive: oops,
          lhDelta: finalLhDelta,
          lhVel: finalLhVel,
          rhDelta: finalRhDelta,
          rhVel: finalRhVel,
          thrustForce: thrust,
          collisionState: collision,
        });
      }
    }, 50);

    return () => clearInterval(timer);
  }, [safetyState?.lhVel, safetyState?.rhVel]);

  const sidebarOffset = isSidebarOpen ? '316px' : '1rem';
  const isDeviating = Boolean(safetyState?.isDeviating);

  // Reusable 2-Column Telemetry Content
  const renderTelemetryContent = (isCompact: boolean) => (
    <>
      {/* Header Bar */}
      <div className={`flex items-center justify-between border-b border-cyan-500/20 shrink-0 ${isCompact ? 'pb-1' : 'pb-1'}`}>
        <div className="flex items-center gap-1.5 min-w-0">
          <span className={`w-1.5 h-1.5 rounded-full ${isDeviating ? 'bg-red-400' : 'bg-cyan-400'} animate-ping shrink-0`} />
          <h3 className={`text-cyan-200 font-bold uppercase tracking-[0.03em] truncate whitespace-nowrap ${isCompact ? 'text-[9.5px]' : 'text-[10px]'}`}>
            {isCompact ? 'BIOMECHANICAL HUD' : 'ASTRONAUT BIOMECHANICAL TELEMETRY // REAL-TIME SE(3)'}
          </h3>
        </div>
        {isCompact ? (
          <button
            id="btn-collapse-telemetry-hud"
            onClick={() => setIsTelemetryCollapsed(true)}
            title="Hide Telemetry HUD"
            className="px-1.5 py-0.5 rounded bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-300 hover:text-white font-mono font-bold text-[9px] flex items-center gap-1 cursor-pointer transition-all active:scale-95 shrink-0 ml-1"
          >
            <span>[HIDE]</span>
            <ChevronUp className="w-2.5 h-2.5" />
          </button>
        ) : (
          <span className="text-[9.5px] text-cyan-300 font-bold px-1.5 py-0.2 rounded bg-cyan-950/70 border border-cyan-500/30 shrink-0 ml-1">
            SE(3)
          </span>
        )}
      </div>

      {/* 2-Column Telemetry Stream Layout with balanced split and zero clipping */}
      <div className={`flex-1 flex font-mono ${isCompact ? 'gap-2 pt-1' : 'gap-2.5'}`}>
        {/* Column 1 (Left Limb Dynamics): Width 50% */}
        <div
          style={{ width: '50%', flex: '0 0 50%' }}
          className="flex flex-col border-r border-cyan-500/15 pr-1.5 min-w-0"
        >
          {/* Single-Line Header */}
          <div
            style={{ whiteSpace: 'nowrap', letterSpacing: '0.03em', lineHeight: '1.2', marginBottom: '1px' }}
            className={`flex items-center gap-1 text-cyan-400 font-mono font-bold uppercase shrink-0 ${isCompact ? 'text-[9.5px]' : 'text-[10px]'}`}
          >
            <Activity className="w-2.5 h-2.5 text-cyan-400 shrink-0" />
            <span style={{ whiteSpace: 'nowrap' }}>{isCompact ? 'LIMB DYNAMICS' : 'JOINT & LIMB DYNAMICS'}</span>
          </div>

          {/* Left Hand Delta */}
          <div style={{ lineHeight: '1.15', marginBottom: '1px' }} className="flex flex-col">
            <div className={`flex justify-between items-center ${isCompact ? 'text-[9px]' : 'text-[10px]'}`}>
              <span className={isDeviating && safetyState?.handSide === 'LEFT' ? 'text-red-400 font-bold animate-pulse' : 'text-[#a0b0c0]'}>
                {isCompact ? 'LH Δ' : 'LEFT HAND Δ'}
                {isDeviating && safetyState?.handSide === 'LEFT' && (
                  <AlertTriangle className="inline w-2.5 h-2.5 ml-0.5 text-red-400" />
                )}
              </span>
              <span className={isDeviating && safetyState?.handSide === 'LEFT' ? 'text-red-300 font-bold' : 'text-[#00ff99] font-semibold'}>
                {telemetry.lhVel} m/s
              </span>
            </div>
            <span style={{ whiteSpace: 'nowrap' }} className={`text-slate-300 font-mono ${isCompact ? 'text-[9px]' : 'text-[10px]'}`}>
              {telemetry.lhDelta}
            </span>
          </div>

          {/* Right Hand Delta */}
          <div style={{ lineHeight: '1.15', marginBottom: '1px' }} className="flex flex-col">
            <div className={`flex justify-between items-center ${isCompact ? 'text-[9px]' : 'text-[10px]'}`}>
              <span className={isDeviating && safetyState?.handSide === 'RIGHT' ? 'text-red-400 font-bold animate-pulse' : 'text-[#a0b0c0]'}>
                {isCompact ? 'RH Δ' : 'RIGHT HAND Δ'}
                {isDeviating && safetyState?.handSide === 'RIGHT' && (
                  <AlertTriangle className="inline w-2.5 h-2.5 ml-0.5 text-red-400" />
                )}
              </span>
              <span className={isDeviating && safetyState?.handSide === 'RIGHT' ? 'text-red-300 font-bold' : 'text-[#00ff99] font-semibold'}>
                {telemetry.rhVel} m/s
              </span>
            </div>
            <span style={{ whiteSpace: 'nowrap' }} className={`text-slate-300 font-mono ${isCompact ? 'text-[9px]' : 'text-[10px]'}`}>
              {telemetry.rhDelta}
            </span>
          </div>

          {/* Lower Body Impulse */}
          <div style={{ lineHeight: '1.15' }} className="flex flex-col pt-0.5 border-t border-cyan-500/10">
            <div className={`flex justify-between items-center ${isCompact ? 'text-[9px]' : 'text-[10px]'}`}>
              <span style={{ whiteSpace: 'nowrap' }} className="text-[#a0b0c0]">{isCompact ? 'IMPULSE:' : 'LOWER BODY IMPULSE:'}</span>
              <span className="text-[#00ff99] font-semibold">{telemetry.thrustForce} N</span>
            </div>
            <div className={`flex justify-between items-center mt-0.5 ${isCompact ? 'text-[9px]' : 'text-[10px]'}`}>
              <span style={{ whiteSpace: 'nowrap' }} className="text-[#a0b0c0] text-[9px]">{isCompact ? 'CONTACT:' : 'CONTACT STATE:'}</span>
              <span
                style={{ whiteSpace: 'nowrap' }}
                className={`px-1 py-0.2 rounded text-[9px] font-bold uppercase tracking-tight shrink-0 ${
                  telemetry.isOopsActive
                    ? 'bg-amber-950/80 text-amber-300 border border-amber-500/40 animate-pulse'
                    : telemetry.isMoving
                    ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-500/40'
                    : 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/30'
                }`}
              >
                {isCompact
                  ? telemetry.isOopsActive
                    ? 'REBOUND'
                    : telemetry.isMoving
                    ? 'TRAVERSAL'
                    : 'ANCHORED'
                  : telemetry.collisionState}
              </span>
            </div>
          </div>
        </div>

        {/* Column 2 (Orientation & Elevation): Width 50% */}
        <div
          style={{ width: '50%', flex: '0 0 50%' }}
          className="flex flex-col pl-0.5 pr-0.5 min-w-0"
        >
          {/* Single-Line Header */}
          <div
            style={{ whiteSpace: 'nowrap', letterSpacing: '0.03em', lineHeight: '1.2', marginBottom: '1px' }}
            className={`flex items-center gap-1 text-emerald-400 font-mono font-bold uppercase shrink-0 ${isCompact ? 'text-[9.5px]' : 'text-[10px]'}`}
          >
            <Crosshair className="w-2.5 h-2.5 text-emerald-400 shrink-0" />
            <span style={{ whiteSpace: 'nowrap' }}>{isCompact ? 'ORIENTATION' : 'ORIENTATION & ELEVATION'}</span>
          </div>

          {/* Angular Velocity & Roll / Pitch / Yaw */}
          <div style={{ lineHeight: '1.15', marginBottom: '1px' }} className="flex flex-col">
            <div className={`flex justify-between text-[#a0b0c0] ${isCompact ? 'text-[9px]' : 'text-[10px]'}`}>
              <span style={{ whiteSpace: 'nowrap' }}>{isCompact ? 'ANG RATE:' : 'ANGULAR RATE:'}</span>
              <span className="text-cyan-300 font-semibold">{telemetry.angVelocity}°/s</span>
            </div>
            <div className={`flex justify-between text-cyan-200 font-semibold font-mono ${isCompact ? 'text-[9px]' : 'text-[10px]'}`}>
              <span>R:{telemetry.roll}°</span>
              <span>P:{telemetry.pitch}°</span>
              <span>Y:{telemetry.yaw}°</span>
            </div>
          </div>

          {/* Jump & Micro-G Elevation */}
          <div style={{ lineHeight: '1.15', marginBottom: '1px' }} className={`flex justify-between items-center ${isCompact ? 'text-[9px]' : 'text-[10px]'}`}>
            <span style={{ whiteSpace: 'nowrap' }} className="text-[#a0b0c0]">{isCompact ? 'ELEVATION:' : 'JUMP ELEVATION:'}</span>
            <span className="text-[#00ff99] font-semibold">
              Δh: +{telemetry.elevation} m
            </span>
          </div>

          {/* Spatial Transform Matrix */}
          <div
            style={{ lineHeight: '1.15', whiteSpace: 'nowrap' }}
            className={`flex items-center justify-between px-1.5 py-0.5 rounded bg-slate-950/70 border border-cyan-500/20 min-w-0 mt-0.5 ${isCompact ? 'text-[9px]' : 'text-[10px]'}`}
          >
            <span style={{ whiteSpace: 'nowrap' }} className="text-[#a0b0c0]">{isCompact ? 'MATRIX:' : 'TRANSFORM MATRIX'}</span>
            <span style={{ whiteSpace: 'nowrap' }} className="text-[#00ff99] font-bold shrink-0 ml-1">INVARIANT</span>
          </div>
        </div>
      </div>
    </>
  );

  // ─────────────────────────────────────────────────────────────────────────────
  // 1. REPLAY MODE ACTIVE:
  //    - Top-right overlay removed per user specification.
  //    - Biomechanical Telemetry is rendered as a 3-line horizontal strip stacked
  //      directly above the bottom Playback Scrubber widget.
  //    - Auxiliary Module // Expansion Slot 02 is also hidden.
  // ─────────────────────────────────────────────────────────────────────────────
  if (isReplay) {
    return null;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 2. NORMAL MODE: Bottom Row 2-Column Grid (Box 1 + Box 2 RESTORED)
  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div
      id="hud-bottom-telemetry-grid"
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
      {/* BOX 1: ASTRONAUT BIOMECHANICAL TELEMETRY // REAL-TIME SE(3) */}
      <div
        style={{
          backgroundColor: 'rgba(10, 20, 30, 0.88)',
          borderColor: isDeviating ? 'rgba(255, 34, 0, 0.7)' : 'rgba(0, 240, 255, 0.4)',
          boxShadow: isDeviating
            ? '0 12px 30px rgba(0, 0, 0, 0.85), 0 0 24px rgba(255, 34, 0, 0.4)'
            : '0 12px 30px rgba(0, 0, 0, 0.75), 0 0 20px rgba(0, 240, 255, 0.15)',
          padding: '8px 12px',
        }}
        className="flex flex-col h-full rounded-xl border backdrop-blur-md overflow-hidden transition-all duration-300 justify-between font-mono"
      >
        {renderTelemetryContent(false)}
      </div>

      {/* BOX 2: AUXILIARY MODULE // EXPANSION SLOT 02 (Orbital Threat & Edge AI Spatial Radar) */}
      <div
        id="hud-expansion-slot-02"
        style={{
          backgroundColor: 'rgba(10, 20, 30, 0.88)',
          borderColor: 'rgba(0, 240, 255, 0.3)',
          boxShadow: '0 12px 30px rgba(0, 0, 0, 0.7), 0 0 15px rgba(0, 240, 255, 0.08)',
          padding: '8px 12px',
        }}
        className="flex flex-col h-full rounded-xl border backdrop-blur-md overflow-hidden transition-all duration-300 justify-between font-mono"
      >
        <ExpansionSlot02 />
      </div>
    </div>
  );
}