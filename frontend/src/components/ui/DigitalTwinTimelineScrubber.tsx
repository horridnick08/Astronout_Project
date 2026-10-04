import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, FastForward, Radio, Activity, Crosshair } from 'lucide-react';
import * as THREE from 'three';
import { digitalTwinReplayManager, DigitalTwinReplayState } from '../../engine/DigitalTwinReplayManager.ts';
import { zeroGKinematics } from '../../engine/useZeroGKinematics.ts';

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function DigitalTwinTimelineScrubber() {
  const [replayState, setReplayState] = useState<DigitalTwinReplayState>(() => digitalTwinReplayManager.getState());

  const [telemetry, setTelemetry] = useState({
    pitch: '0.0',
    yaw: '-135.0',
    angVelocity: '6.3',
    elevation: '+0.015',
    lhDelta: '[-0.18, 0.26, 0.28]',
    lhVel: '0.25',
    rhDelta: '[0.18, 0.32, 0.28]',
    rhVel: '0.28',
    thrustForce: '217',
    collisionState: 'BALLISTIC TRAVERSAL',
    isOopsActive: false,
  });

  useEffect(() => {
    return digitalTwinReplayManager.subscribe((st) => setReplayState(st));
  }, []);

  // Sample real-time biomechanical telemetry at ~20fps
  useEffect(() => {
    const timer = setInterval(() => {
      let pitchDeg = '0.0';
      let yawDeg = '-135.0';
      let angVel = '6.3';
      let elevOffset = '+0.015';
      let lhDelta = '[-0.18, 0.26, 0.28]';
      let lhVel = '0.25';
      let rhDelta = '[0.18, 0.32, 0.28]';
      let rhVel = '0.28';
      let thrust = '217';
      let collision = 'BALLISTIC TRAVERSAL';
      let oops = false;

      if (zeroGKinematics) {
        const q = zeroGKinematics.quaternion || new THREE.Quaternion();
        const euler = new THREE.Euler().setFromQuaternion(q, 'YXZ');
        const p = (euler.x * (180 / Math.PI)).toFixed(1);
        pitchDeg = p === '-0.0' ? '0.0' : p;
        yawDeg = (euler.y * (180 / Math.PI)).toFixed(1);

        const vel = zeroGKinematics.velocity || new THREE.Vector3();
        const velLen = vel.length();
        angVel = Math.max(6.3, parseFloat((velLen * 18.5).toFixed(1))).toFixed(1);

        const elevVal = Math.max(0.015, zeroGKinematics.elevationY - zeroGKinematics.baseY).toFixed(3);
        elevOffset = `+${elevVal}`;

        oops = Boolean(zeroGKinematics.isOopsActive);
        const moving = Boolean(zeroGKinematics.isMoving || replayState.isPlaying);

        const armLag = (zeroGKinematics as any).armLag || { x: 0, y: 0 };
        const interact = (zeroGKinematics as any).stationInteractionWeight || 0;

        const lhX = (-0.18 + armLag.x * 0.35).toFixed(2);
        const lhY = (0.26 + interact * 0.22).toFixed(2);
        const lhZ = (0.28 + armLag.y * 0.35).toFixed(2);
        lhDelta = `[${lhX}, ${lhY}, ${lhZ}]`;
        lhVel = (0.25 + Math.abs(armLag.x) * 0.2).toFixed(2);

        const rhX = (0.18 - armLag.x * 0.35).toFixed(2);
        const rhY = (0.32 + interact * 0.28).toFixed(2);
        const rhZ = (0.28 - armLag.y * 0.35).toFixed(2);
        rhDelta = `[${rhX}, ${rhY}, ${rhZ}]`;
        rhVel = (0.28 + Math.abs(armLag.y) * 0.2).toFixed(2);

        thrust = moving ? '217' : '0';
        collision = oops ? 'REBOUND' : moving ? 'BALLISTIC TRAVERSAL' : 'SURFACE ANCHORED';
      }

      if (replayState.currentKeyframe && !zeroGKinematics?.isMoving && !replayState.isPlaying) {
        const kfYaw = ((replayState.currentKeyframe.yaw * 180) / Math.PI).toFixed(1);
        if (kfYaw !== '0.0') yawDeg = kfYaw;
        elevOffset = `+${replayState.currentKeyframe.elevationY.toFixed(3)}`;
        lhVel = replayState.currentKeyframe.jointKinematics.handMotionDelta.toFixed(2);
        rhVel = (replayState.currentKeyframe.jointKinematics.handMotionDelta * 1.1).toFixed(2);
      }

      setTelemetry({
        pitch: pitchDeg,
        yaw: yawDeg,
        angVelocity: angVel,
        elevation: elevOffset,
        lhDelta,
        lhVel,
        rhDelta,
        rhVel,
        thrustForce: thrust,
        collisionState: collision,
        isOopsActive: oops,
      });
    }, 50);

    return () => clearInterval(timer);
  }, [replayState.isPlaying, replayState.currentKeyframe]);

  if (!replayState.isActive) {
    return null;
  }

  const { currentKeyframe, currentTime, duration, isPlaying, playbackSpeed } = replayState;
  const progressPct = (currentTime / duration) * 100;

  return (
    <>
      {/* ───────────────────── TOP BANNER OVERLAY ───────────────────── */}
      <div
        id="hud-badge-replay-mode"
        style={{
          position: 'fixed',
          top: '56px',
          left: '340px',
          zIndex: 45,
          backgroundColor: 'rgba(4, 20, 24, 0.94)',
          borderColor: 'rgba(0, 255, 153, 0.75)',
          boxShadow: '0 0 20px rgba(0, 255, 153, 0.35), 0 8px 20px rgba(0, 0, 0, 0.85)',
          fontSize: '10px',
          padding: '4px 10px',
        }}
        className="flex items-center gap-2 rounded-lg border font-mono font-bold tracking-[0.04em] text-[#00ff99] pointer-events-none backdrop-blur-md"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-[#00ff99] animate-ping shrink-0" />
        <span>[REPLAY MODE ACTIVE // DOWNLINK RATE: 8.4 KB/MIN]</span>
        <span className="text-[8.5px] px-1.5 py-0.5 rounded bg-emerald-950/80 border border-emerald-500/40 text-emerald-200 font-semibold tracking-wider">
          DETERMINISTIC
        </span>
      </div>

      {/* ───────────────────── BOTTOM HUD REPLAY STACKED CONTAINER ───────────────────── */}
      <div
        id="viewport-replay-bottom-container"
        style={{
          position: 'fixed',
          bottom: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: 'min(680px, calc(100vw - 360px))',
          zIndex: 40,
        }}
        className="flex flex-col font-mono pointer-events-auto select-none"
      >
        {/* 1. BIOMECHANICAL TELEMETRY HUD: COMPACT 3-LINE HORIZONTAL STRIP */}
        <div
          id="hud-biomechanical-replay-strip"
          style={{
            width: '100%',
            backgroundColor: 'rgba(8, 16, 26, 0.96)',
            borderColor: 'rgba(0, 255, 153, 0.45)',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.85), 0 0 16px rgba(0, 255, 153, 0.15)',
            padding: '4px 12px',
            borderTopLeftRadius: '12px',
            borderTopRightRadius: '12px',
            borderBottomLeftRadius: '0px',
            borderBottomRightRadius: '0px',
            borderWidth: '1px',
            borderBottomWidth: '1px',
            borderBottomColor: 'rgba(0, 255, 153, 0.25)',
            overflow: 'hidden',
          }}
          className="flex flex-col gap-1 backdrop-blur-md select-none font-mono"
        >
          {/* Row 1: LIMB DYNAMICS ➔ LH: [-0.18, 0.26, 0.28] (0.25 m/s) | RH: [0.18, 0.32, 0.28] (0.28 m/s) */}
          <div style={{ whiteSpace: 'nowrap' }} className="flex items-center justify-between text-[9px] font-mono leading-none">
            <div className="flex items-center gap-1.5 shrink-0">
              <Activity className="w-2.5 h-2.5 text-cyan-400 shrink-0" />
              <span className="text-cyan-400 font-bold tracking-wider">LIMB DYNAMICS ➔</span>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <span className="text-[#a0b0c0]">LH:</span>
              <span className="text-cyan-200 font-mono">{telemetry.lhDelta}</span>
              <span className="text-[#00ff99] font-semibold">({telemetry.lhVel} m/s)</span>
            </div>
            <span className="text-slate-600">|</span>
            <div className="flex items-center gap-1 shrink-0">
              <span className="text-[#a0b0c0]">RH:</span>
              <span className="text-cyan-200 font-mono">{telemetry.rhDelta}</span>
              <span className="text-[#00ff99] font-semibold">({telemetry.rhVel} m/s)</span>
            </div>
          </div>

          {/* Row 2: ORIENTATION ➔ ANG RATE: 6.3°/s | PITCH: 0.0° | YAW: -135.0° | ELEVATION: +0.015 */}
          <div style={{ whiteSpace: 'nowrap' }} className="flex items-center justify-between text-[9px] font-mono leading-none">
            <div className="flex items-center gap-1.5 shrink-0">
              <Crosshair className="w-2.5 h-2.5 text-emerald-400 shrink-0" />
              <span className="text-emerald-400 font-bold tracking-wider">ORIENTATION ➔</span>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <span className="text-[#a0b0c0]">ANG RATE:</span>
              <span className="text-cyan-300 font-semibold">{telemetry.angVelocity}°/s</span>
            </div>
            <span className="text-slate-600">|</span>
            <div className="flex items-center gap-1 shrink-0">
              <span className="text-[#a0b0c0]">PITCH:</span>
              <span className="text-cyan-200 font-semibold">{telemetry.pitch}°</span>
            </div>
            <span className="text-slate-600">|</span>
            <div className="flex items-center gap-1 shrink-0">
              <span className="text-[#a0b0c0]">YAW:</span>
              <span className="text-cyan-200 font-semibold">{telemetry.yaw}°</span>
            </div>
            <span className="text-slate-600">|</span>
            <div className="flex items-center gap-1 shrink-0">
              <span className="text-[#a0b0c0]">ELEVATION:</span>
              <span className="text-[#00ff99] font-semibold">{telemetry.elevation}</span>
            </div>
          </div>

          {/* Row 3: CONTACT STATE ➔ IMPULSE: 217 N | STATUS: BALLISTIC TRAVERSAL | INVARIANT: SE(3) */}
          <div style={{ whiteSpace: 'nowrap' }} className="flex items-center justify-between text-[9px] font-mono leading-none">
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse shrink-0" />
              <span className="text-cyan-300 font-bold tracking-wider">CONTACT STATE ➔</span>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <span className="text-[#a0b0c0]">IMPULSE:</span>
              <span className="text-[#00ff99] font-semibold">{telemetry.thrustForce} N</span>
            </div>
            <span className="text-slate-600">|</span>
            <div className="flex items-center gap-1 shrink-0">
              <span className="text-[#a0b0c0]">STATUS:</span>
              <span
                className={`px-1.5 py-0.2 rounded text-[9px] font-bold uppercase tracking-tight ${
                  telemetry.isOopsActive
                    ? 'bg-amber-950/80 text-amber-300 border border-amber-500/40 animate-pulse'
                    : telemetry.collisionState === 'BALLISTIC TRAVERSAL'
                    ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-500/40'
                    : 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/30'
                }`}
              >
                {telemetry.collisionState}
              </span>
            </div>
            <span className="text-slate-600">|</span>
            <div className="flex items-center gap-1 shrink-0">
              <span className="text-[#a0b0c0]">INVARIANT:</span>
              <span className="px-1.5 py-0.2 rounded bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 font-bold text-[9px]">
                SE(3)
              </span>
            </div>
          </div>
        </div>

        {/* 2. BOTTOM PLAYBACK SCRUBBER WIDGET */}
        <div
          id="viewport-timeline-scrubber"
          style={{
            width: '100%',
            backgroundColor: 'rgba(8, 16, 26, 0.95)',
            borderColor: 'rgba(0, 255, 153, 0.45)',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.85), 0 0 16px rgba(0, 255, 153, 0.2)',
            padding: '5px 12px',
            borderTopLeftRadius: '0px',
            borderTopRightRadius: '0px',
            borderBottomLeftRadius: '12px',
            borderBottomRightRadius: '12px',
            borderWidth: '1px',
            borderTopWidth: '0px',
          }}
          className="rounded-b-xl border flex flex-col gap-1.5 font-mono backdrop-blur-md pointer-events-auto select-none transition-all duration-200"
        >
        {/* Header / Info Row */}
        <div className="flex items-center justify-between gap-2 border-b border-emerald-500/20 pb-1">
          <div className="flex items-center gap-1.5 min-w-0">
            <Radio className="w-3 h-3 text-[#00ff99] animate-pulse shrink-0" />
            <span className="font-bold text-[#00ff99] text-[10.5px] tracking-wider whitespace-nowrap shrink-0">
              DIGITAL TWIN REPLAY
            </span>
            <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 font-semibold uppercase truncate">
              {currentKeyframe.stationName.toUpperCase()}
            </span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* Status Tag: DOWNLINK RATE: 8.4 KB/MIN */}
            <span
              id="tag-replay-downlink-rate"
              style={{
                borderColor: 'rgba(0, 255, 153, 0.4)',
                backgroundColor: 'rgba(0, 255, 153, 0.12)',
                color: '#00ff99',
              }}
              className="text-[9.5px] font-mono font-bold px-1.5 py-0.2 rounded border uppercase tracking-wider"
            >
              8.4 KB/MIN
            </span>
            <span className="text-[10px] font-mono font-bold text-slate-100 bg-slate-900/90 px-1.5 py-0.2 rounded border border-slate-700/60">
              {formatTime(currentTime)} / 05:00
            </span>
          </div>
        </div>

        {/* Controls Row: [⏪ -10s] [▶ PLAY / ⏸ PAUSE] [⏩ 2x] [🔴 LIVE REPLAY] */}
        <div className="flex items-center justify-between gap-1.5">
          <div className="flex items-center gap-1 shrink-0">
            {/* [⏪ -10s] */}
            <button
              id="btn-replay-rewind-10s"
              onClick={() => digitalTwinReplayManager.rewind(10)}
              title="Rewind 10 seconds"
              style={{ height: '24px', fontSize: '10px' }}
              className="px-2 rounded bg-slate-900/90 hover:bg-slate-800 border border-cyan-500/40 hover:border-cyan-300 text-cyan-300 font-mono font-bold flex items-center gap-1 transition-all cursor-pointer shadow-sm active:scale-95"
            >
              <RotateCcw className="w-3 h-3 text-cyan-400" />
              <span>-10s</span>
            </button>

            {/* [▶ PLAY / ⏸ PAUSE] */}
            <button
              id="btn-replay-play-pause"
              onClick={() => digitalTwinReplayManager.togglePlay()}
              title={isPlaying ? 'Pause 3D Telemetry Playback' : 'Start 3D Telemetry Playback'}
              style={{ height: '24px', fontSize: '10px' }}
              className={`px-2.5 rounded border font-mono font-bold flex items-center gap-1 transition-all cursor-pointer shadow-sm active:scale-95 ${
                isPlaying
                  ? 'bg-amber-500/20 border-amber-500/50 hover:bg-amber-500/30 text-amber-200'
                  : 'bg-emerald-500/20 border-emerald-500/50 hover:bg-emerald-500/30 text-emerald-200 shadow-[0_0_8px_rgba(0,255,153,0.25)]'
              }`}
            >
              {isPlaying ? (
                <>
                  <Pause className="w-3 h-3 text-amber-400" />
                  <span>PAUSE</span>
                </>
              ) : (
                <>
                  <Play className="w-3 h-3 text-[#00ff99]" />
                  <span>PLAY</span>
                </>
              )}
            </button>

            {/* [⏩ 2x] */}
            <button
              id="btn-replay-fast-forward"
              onClick={() => digitalTwinReplayManager.cycleSpeed()}
              title="Cycle Speed (1x -> 2x -> 4x)"
              style={{ height: '24px', fontSize: '10px' }}
              className={`px-2 rounded border font-mono font-bold flex items-center gap-1 transition-all cursor-pointer shadow-sm active:scale-95 ${
                playbackSpeed > 1
                  ? 'bg-emerald-500/20 border-emerald-400 text-emerald-200 shadow-[0_0_8px_rgba(0,255,153,0.3)]'
                  : 'bg-slate-900/90 hover:bg-slate-800 border-emerald-500/40 hover:border-emerald-300 text-emerald-300'
              }`}
            >
              <FastForward className="w-3 h-3 text-[#00ff99]" />
              <span>{playbackSpeed}x</span>
            </button>

            {/* [🔴 LIVE REPLAY] */}
            <button
              id="btn-replay-live-mode"
              onClick={() => {
                if (!isPlaying) digitalTwinReplayManager.play();
              }}
              title="Real-Time Deterministic Telemetry Stream"
              style={{ height: '24px', fontSize: '10px' }}
              className="px-2 rounded bg-rose-950/40 hover:bg-rose-900/50 border border-rose-500/50 hover:border-rose-400 text-rose-300 font-mono font-bold flex items-center gap-1 transition-all cursor-pointer shadow-sm active:scale-95"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping shrink-0" />
              <span>LIVE</span>
            </button>
          </div>

          <div className="flex items-center gap-1 text-[10px] text-[#a0b0c0] font-mono">
            <span>SPEED:</span>
            <span className="text-[#00ff99] font-bold">{playbackSpeed}.0x</span>
          </div>
        </div>

        {/* Scrubber Bar: Draggable input range slider (00:00 to 05:00) */}
        <div className="flex items-center gap-2 pt-0">
          <span className="text-[10px] font-mono text-slate-400 select-none">
            00:00
          </span>
          <div className="flex-1 flex items-center relative">
            <input
              id="slider-replay-scrubber"
              type="range"
              min={0}
              max={duration}
              step={0.1}
              value={currentTime}
              onChange={(e) => {
                const newT = parseFloat(e.target.value);
                digitalTwinReplayManager.seek(newT);
              }}
              className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-[#00ff99]"
              style={{
                background: `linear-gradient(to right, #00ff99 0%, #00e5ff ${progressPct}%, #1e293b ${progressPct}%, #1e293b 100%)`,
              }}
            />
          </div>
          <span className="text-[10px] font-mono text-slate-400 select-none">
            05:00
          </span>
        </div>

        {/* Real-Time Telemetry & SE(3) Keyframe Strip */}
        <div className="flex items-center justify-between text-[9.5px] text-slate-400 border-t border-cyan-500/15 pt-0.5 font-mono">
          <div className="flex items-center gap-2 truncate">
            <span>
              SE(3): <span className="text-cyan-300">[{currentKeyframe.position.x.toFixed(2)}, {currentKeyframe.elevationY.toFixed(2)}, {currentKeyframe.position.z.toFixed(2)}]</span>
            </span>
            <span className="text-slate-600">|</span>
            <span>
              YAW: <span className="text-slate-200">{((currentKeyframe.yaw * 180) / Math.PI).toFixed(0)}°</span>
            </span>
            <span className="text-slate-600">|</span>
            <span>
              HAND Δ: <span className="text-[#00ff99]">{currentKeyframe.jointKinematics.handMotionDelta.toFixed(2)} m/s</span>
            </span>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <Activity className="w-2.5 h-2.5 text-[#00ff99]" />
            <span className="text-[#00ff99] font-semibold text-[9px]">
              VIEWPORT SYNC
            </span>
          </div>
        </div>
      </div>
    </div>
  </>
);
}
