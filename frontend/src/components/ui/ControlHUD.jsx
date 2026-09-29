import React, { useState, useEffect } from 'react';
import {
  Camera, Video, VideoOff, Orbit, User, Maximize2, Compass, Cpu,
  Laptop, Radio, Eye, Atom, Navigation, Footprints
} from 'lucide-react';
import { CAMERA_VIEWS } from '../../engine/CameraManager.jsx';
import WebcamFeed from './WebcamFeed.jsx';
import { interactionEngine, INTERACTION_ACTIONS, WAYPOINTS } from '../../engine/InteractionEngine.js';

/**
 * ControlHUD
 * 
 * High-tech Sci-Fi Control Dashboard Overlay with:
 * - 4 Cinematic Camera presets
 * - Interactive Waypoint Navigation for Stations 1, 2, 3, 4
 * - Live Mocap activation & fine-tuning sliders
 * - WASD locomotion status & interactive key visualizer
 * - Real-time bone telemetry & Quantum Core harvest status
 */
export default function ControlHUD({
  activeCameraView,
  onSelectCameraView,
  isLiveMocap,
  onToggleLiveMocap,
  lerpFactor,
  onChangeLerpFactor,
  zeroGIntensity,
  onChangeZeroGIntensity,
  locomotion,
  keysPressed = {},
  discoveredBones = [],
  videoRef,
  canvasRef,
  latency,
  landmarks
}) {
  const [engineState, setEngineState] = useState(interactionEngine.getState());

  useEffect(() => {
    return interactionEngine.subscribe((state) => {
      setEngineState(state);
    });
  }, []);

  const cameraPresets = [
    { id: CAMERA_VIEWS.FRONT, label: 'Close Front', icon: User },
    { id: CAMERA_VIEWS.ORBIT_360, label: '360° Orbit', icon: Orbit },
    { id: CAMERA_VIEWS.OTS, label: 'Over-Shoulder', icon: Compass },
    { id: CAMERA_VIEWS.WIDE, label: 'Corridor Wide', icon: Maximize2 }
  ];

  const waypointButtons = [
    {
      id: INTERACTION_ACTIONS.OPERATE_PRIMARY_CONSOLE,
      label: 'Station 1: Flight Ops',
      sublabel: 'Laptop [-1.6, 0.81, -0.4]',
      icon: Laptop
    },
    {
      id: INTERACTION_ACTIONS.OPERATE_SECONDARY_CONSOLE,
      label: 'Station 2: Comms',
      sublabel: 'Console [1.6, 0.81, -1.3]',
      icon: Radio
    },
    {
      id: INTERACTION_ACTIONS.INSPECT_WINDOW,
      label: 'Window EVA View',
      sublabel: 'Aisle [0, 0, -2.5]',
      icon: Eye
    },
    {
      id: INTERACTION_ACTIONS.GRAB_QUANTUM_CORE,
      label: 'Station 4: Harvest Core',
      sublabel: 'Wall Socket [2.2, 0.75, -2.2]',
      icon: Atom
    },
    {
      id: INTERACTION_ACTIONS.MANUAL,
      label: 'Manual WASD',
      sublabel: 'Central Aisle Free Roam',
      icon: Footprints
    }
  ];

  const handleWaypointClick = (actionId) => {
    if (actionId === INTERACTION_ACTIONS.MANUAL) {
      interactionEngine.cancelAction();
    } else {
      interactionEngine.executeAction(actionId, locomotion.position);
    }
  };

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-6 z-20 font-sans">
      {/* TOP HEADER BAR */}
      <header className="flex items-center justify-between pointer-events-auto">
        {/* Title & System Status */}
        <div className="flex items-center gap-4 bg-slate-900/80 backdrop-blur-md border border-cyan-500/30 px-5 py-2.5 rounded-2xl shadow-xl shadow-cyan-950/20">
          <div className="w-3 h-3 rounded-full bg-cyan-400 animate-ping" />
          <div>
            <h1 className="text-sm font-bold tracking-wider text-slate-100 uppercase">
              STS-174 Mocap Simulator
            </h1>
            <p className="text-xs font-mono text-cyan-400">
              {isLiveMocap
                ? '● REAL-TIME MEDIAPIPE MOCAP ACTIVE'
                : engineState.isNavigating
                ? '● AUTONOMOUS WAYPOINT NAVIGATION ACTIVE'
                : engineState.isInteracting
                ? '● STATION INTERACTION IN PROGRESS'
                : '○ ZERO-G SIMULATION & LOCOMOTION'}
            </p>
          </div>
        </div>

        {/* 4 CINEMATIC CAMERA VIEW PRESET BUTTONS */}
        <div className="flex items-center gap-1.5 bg-slate-900/80 backdrop-blur-md border border-cyan-500/30 p-1.5 rounded-2xl shadow-xl shadow-cyan-950/20">
          {cameraPresets.map(({ id, label, icon: Icon }) => {
            const isActive = activeCameraView === id;
            return (
              <button
                key={id}
                onClick={() => onSelectCameraView(id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-mono tracking-wide transition-all duration-200 ${
                  isActive
                    ? 'bg-cyan-500 text-slate-950 font-bold shadow-lg shadow-cyan-500/40 scale-105'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{label}</span>
              </button>
            );
          })}
        </div>
      </header>

      {/* MIDDLE SECTION: Telemetry & Locomotion Helper */}
      <div className="flex items-start justify-between pointer-events-none mt-4">
        {/* LEFT CARD: Locomotion & Bone Rig Telemetry */}
        <div className="pointer-events-auto flex flex-col gap-3 w-64 bg-slate-900/80 backdrop-blur-md border border-cyan-500/30 p-4 rounded-2xl shadow-xl shadow-cyan-950/20 text-xs font-mono">
          <div className="flex items-center justify-between pb-2 border-b border-cyan-500/20">
            <span className="text-slate-400 flex items-center gap-1.5 font-bold uppercase">
              <Cpu className="w-3.5 h-3.5 text-cyan-400" />
              State Machine
            </span>
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                isLiveMocap
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                  : engineState.isNavigating
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse'
                  : engineState.isInteracting
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : locomotion.isMoving
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
              }`}
            >
              {isLiveMocap
                ? 'LIVE MOCAP'
                : engineState.isNavigating
                ? 'NAVIGATING'
                : engineState.isInteracting
                ? 'INTERACTING'
                : locomotion.isMoving
                ? 'WALK CYCLE'
                : 'ZERO-G FLOAT'}
            </span>
          </div>

          {/* ACTIVE WAYPOINT STATUS */}
          {engineState.targetWaypoint && (
            <div className="p-2 rounded-xl bg-slate-800/80 border border-cyan-500/30 flex flex-col gap-1">
              <span className="text-[10px] text-cyan-400 font-bold uppercase">Active Target:</span>
              <span className="text-slate-200 text-xs">{engineState.targetWaypoint.name}</span>
              <span className="text-[10px] text-slate-400">{engineState.targetWaypoint.station}</span>
            </div>
          )}

          {/* QUANTUM CORE HARVEST BADGE */}
          {engineState.isCoreAttached && (
            <div className="p-2 rounded-xl bg-cyan-950/60 border border-cyan-400/60 flex items-center gap-2 text-cyan-300 text-[11px] font-bold">
              <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
              <span>CORE HARVESTED ON GAUNTLET</span>
            </div>
          )}

          {/* WASD KEYBOARD HELPER */}
          <div className="flex flex-col gap-1.5 pt-1">
            <span className="text-slate-400 text-[11px]">WASD Navigation:</span>
            <div className="flex flex-col items-center gap-1">
              <div
                className={`w-7 h-7 rounded flex items-center justify-center font-bold text-xs border ${
                  keysPressed.forward
                    ? 'bg-cyan-500 text-slate-950 border-cyan-300'
                    : 'bg-slate-800 text-slate-300 border-slate-700'
                }`}
              >
                W
              </div>
              <div className="flex gap-1">
                <div
                  className={`w-7 h-7 rounded flex items-center justify-center font-bold text-xs border ${
                    keysPressed.left
                      ? 'bg-cyan-500 text-slate-950 border-cyan-300'
                      : 'bg-slate-800 text-slate-300 border-slate-700'
                  }`}
                >
                  A
                </div>
                <div
                  className={`w-7 h-7 rounded flex items-center justify-center font-bold text-xs border ${
                    keysPressed.backward
                      ? 'bg-cyan-500 text-slate-950 border-cyan-300'
                      : 'bg-slate-800 text-slate-300 border-slate-700'
                  }`}
                >
                  S
                </div>
                <div
                  className={`w-7 h-7 rounded flex items-center justify-center font-bold text-xs border ${
                    keysPressed.right
                      ? 'bg-cyan-500 text-slate-950 border-cyan-300'
                      : 'bg-slate-800 text-slate-300 border-slate-700'
                  }`}
                >
                  D
                </div>
              </div>
            </div>
          </div>

          {/* BONE TELEMETRY */}
          <div className="flex flex-col gap-1.5 pt-2 border-t border-cyan-500/20">
            <span className="text-slate-400 text-[11px] flex items-center justify-between">
              <span>Rigged Bones Discovered:</span>
              <span className="text-cyan-400 font-bold">{discoveredBones.length > 0 ? discoveredBones.length : 14} joints</span>
            </span>
            <div className="grid grid-cols-2 gap-1 text-[10px] text-slate-300">
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>Upper Arms (L/R)</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>Forearms (L/R)</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>Hands & Wrists</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>Head & Neck</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>Spine & Hips</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>Legs & Feet (L/R)</span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT: WEBCAM FEED PIP */}
        <div className="pointer-events-auto">
          <WebcamFeed
            videoRef={videoRef}
            canvasRef={canvasRef}
            isLive={isLiveMocap}
            latency={latency}
            landmarks={landmarks}
          />
        </div>
      </div>

      {/* WAYPOINT MISSION ACTION DOCK */}
      <div className="pointer-events-auto flex items-center justify-center my-3">
        <div className="flex items-center gap-2 bg-slate-900/90 backdrop-blur-md border border-cyan-500/30 p-2 rounded-2xl shadow-2xl shadow-cyan-950/40">
          <div className="flex items-center gap-1.5 px-3 border-r border-slate-700/60 text-xs font-mono text-cyan-400 font-bold">
            <Navigation className="w-3.5 h-3.5" />
            <span>Waypoints:</span>
          </div>

          {waypointButtons.map(({ id, label, sublabel, icon: Icon }) => {
            const isActive = engineState.currentAction === id;
            return (
              <button
                key={id}
                onClick={() => handleWaypointClick(id)}
                title={sublabel}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-mono tracking-wide transition-all duration-200 ${
                  isActive
                    ? 'bg-cyan-500 text-slate-950 font-bold shadow-lg shadow-cyan-500/40 scale-105'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/80 border border-transparent hover:border-cyan-500/30'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* BOTTOM ACTION BAR */}
      <footer className="flex items-center justify-between pointer-events-auto bg-slate-900/80 backdrop-blur-md border border-cyan-500/30 px-6 py-3 rounded-2xl shadow-xl shadow-cyan-950/30">
        {/* LIVE MOCAP TOGGLE */}
        <div className="flex items-center gap-4">
          <button
            onClick={onToggleLiveMocap}
            className={`flex items-center gap-2.5 px-6 py-2.5 rounded-xl font-mono text-xs font-bold uppercase tracking-wider transition-all duration-300 ${
              isLiveMocap
                ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/40 animate-pulse'
                : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-lg shadow-cyan-500/40'
            }`}
          >
            {isLiveMocap ? <VideoOff className="w-4 h-4" /> : <Video className="w-4 h-4" />}
            <span>{isLiveMocap ? 'Stop Live Cam' : 'Toggle Live Cam'}</span>
          </button>

          <span className="text-xs font-mono text-slate-400">
            {isLiveMocap
              ? 'Webcam active. Real-time bone quaternion slerp retargeting running.'
              : 'Webcam standby. Central aisle clear (-0.8 to +0.8). Zero-G procedural float active.'}
          </span>
        </div>

        {/* PARAMETER SLIDERS */}
        <div className="flex items-center gap-6 text-xs font-mono">
          {/* SLERP LERP FACTOR */}
          <div className="flex flex-col gap-1 w-44">
            <div className="flex justify-between text-slate-300">
              <span className="text-slate-400">Bone Slerp Lerp:</span>
              <span className="text-cyan-400 font-bold">{lerpFactor.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0.05"
              max="0.50"
              step="0.01"
              value={lerpFactor}
              onChange={(e) => onChangeLerpFactor(parseFloat(e.target.value))}
              className="accent-cyan-400 h-1 bg-slate-700 rounded-lg cursor-pointer"
            />
          </div>

          {/* ZERO-G FLOAT INTENSITY */}
          <div className="flex flex-col gap-1 w-44">
            <div className="flex justify-between text-slate-300">
              <span className="text-slate-400">Zero-G Amplitude:</span>
              <span className="text-cyan-400 font-bold">{zeroGIntensity.toFixed(1)}x</span>
            </div>
            <input
              type="range"
              min="0.0"
              max="2.0"
              step="0.1"
              value={zeroGIntensity}
              onChange={(e) => onChangeZeroGIntensity(parseFloat(e.target.value))}
              className="accent-cyan-400 h-1 bg-slate-700 rounded-lg cursor-pointer"
            />
          </div>
        </div>
      </footer>
    </div>
  );
}
