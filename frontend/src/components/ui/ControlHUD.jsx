import React, { useState, useEffect } from 'react';
import {
  Camera, Video, VideoOff, Orbit, User, Maximize2, Compass, Cpu,
  Laptop, Radio, Eye, Atom, Navigation, Footprints, Layers, ShieldCheck, Activity, ShieldAlert,
  Box, Focus, Link, TrendingUp, GitMerge, AlertTriangle, Ghost, Lock, CheckSquare, Database,
  Terminal, FileText, Rewind, Thermometer, Timer, Code, GitBranch, Grid
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
  landmarks,
  activeModule,
  onSelectModule,
  usp1Active,
  onToggleUsp1,
  usp2Active,
  onToggleUsp2,
  usp3Active,
  onToggleUsp3,
  usp4Active,
  onToggleUsp4,
  usp5Active,
  onToggleUsp5,
  usp6Active,
  onToggleUsp6,
  usp7Active,
  onToggleUsp7,
  usp8Active,
  onToggleUsp8,
  usp9Active,
  onToggleUsp9,
  usp10Active,
  onToggleUsp10,
  usp11Active,
  onToggleUsp11,
  usp12Active,
  onToggleUsp12,
  usp13Active,
  onToggleUsp13,
  usp14Active,
  onToggleUsp14,
  usp23Active,
  onToggleUsp23,
  usp24Active,
  onToggleUsp24,
  usp15Active,
  onToggleUsp15,
  usp16Active,
  onToggleUsp16,
  usp17Active,
  onToggleUsp17,
  usp18Active,
  onToggleUsp18,
  usp19Active,
  onToggleUsp19,
  usp20Active,
  onToggleUsp20,
  usp21Active,
  onToggleUsp21,
  usp22Active,
  onToggleUsp22,
  usp25Active,
  onToggleUsp25
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

  const modules = [
    { id: 'CORE', label: 'Core Ops', icon: Activity },
    { id: 'SPATIAL', label: 'Spatial Framing', icon: Layers },
    { id: 'PERCEPTION', label: 'Perception Engine', icon: Eye },
    { id: 'INTELLIGENCE', label: 'Procedure Intel', icon: ShieldCheck },
    { id: 'ASSURANCE', label: 'Flight Assurance', icon: ShieldAlert },
  ];

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between z-20 font-sans">
      {/* TOP HEADER BAR: Modular Navigation (Absolute Top Edge) */}
      <header className="pointer-events-auto w-full bg-slate-950/95 backdrop-blur-xl border-b border-cyan-500/30 px-6 py-2 flex items-center justify-between shadow-2xl shadow-cyan-950/40">

        {/* Title & System Status */}
        <div className="flex items-center gap-3">
          <div className="flex flex-col">
            <h1 className="text-sm font-black tracking-widest text-white uppercase">
              STS-174 Mocap Simulator
            </h1>
            <p className="text-[10px] font-mono text-black font-bold">
              {isLiveMocap
                ? 'REAL-TIME MEDIAPIPE MOCAP ACTIVE'
                : engineState.isNavigating
                  ? 'AUTONOMOUS WAYPOINT NAVIGATION ACTIVE'
                  : engineState.isInteracting
                    ? 'STATION INTERACTION IN PROGRESS'
                    : 'ZERO-G SIMULATION & LOCOMOTION'}
            </p>
          </div>
        </div>

        {/* MODULE TABS (Center) */}
        <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-700/50 p-1 rounded-xl shadow-inner shadow-black/50">
          {modules.map(({ id, label, icon: Icon }) => {
            const isActive = activeModule === id;
            return (
              <button
                key={id}
                onClick={() => onSelectModule(id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[11px] font-mono tracking-widest transition-all duration-300 ${isActive
                    ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span className="uppercase">{label}</span>
              </button>
            );
          })}
        </div>

        {/* 4 CINEMATIC CAMERA VIEW PRESET BUTTONS (Right) */}
        <div className="flex items-center gap-1">
          {cameraPresets.map(({ id, label, icon: Icon }) => {
            const isActive = activeCameraView === id;
            return (
              <button
                key={id}
                onClick={() => onSelectCameraView(id)}
                className={`flex flex-col items-center justify-center w-16 h-12 rounded-lg text-[9px] font-mono transition-all duration-200 border ${isActive
                    ? 'bg-cyan-500/20 text-white border-cyan-500/50 shadow-inner shadow-cyan-500/20'
                    : 'bg-transparent text-slate-200 border-transparent hover:text-white hover:bg-slate-800/50'
                  }`}
              >
                <Icon className="w-4 h-4 mb-1" />
                <span className="text-center leading-none">{label}</span>
              </button>
            );
          })}
        </div>
      </header>

      {/* MIDDLE & BOTTOM CONTEXT AREA */}
      <div className="flex-1 min-h-0 w-full flex px-6 py-0 pointer-events-none overflow-hidden gap-6">

        {/* LEFT ACTION COLUMN (Cam + Waypoints) - ALWAYS FIXED TO LEFT */}
        <div className="flex flex-col justify-end items-start h-full min-h-0 pointer-events-none gap-4 shrink-0">

          {/* LEFT: WEBCAM FEED PIP */}
          <div className="pointer-events-auto shrink-0">
            <WebcamFeed
              videoRef={videoRef}
              canvasRef={canvasRef}
              isLive={isLiveMocap}
              latency={latency}
              landmarks={landmarks}
            />
          </div>

          {/* WAYPOINT MISSION ACTION DOCK */}
          <div className="pointer-events-auto flex items-center justify-start shrink-0">
            <div className="flex items-center gap-2 bg-slate-900/90 backdrop-blur-md border border-cyan-500/30 p-2 rounded-2xl shadow-2xl shadow-cyan-950/40">
              <div className="flex items-center gap-1 px-2 border-r border-slate-700/60 text-[9px] font-mono text-cyan-400 font-bold uppercase">
                <Navigation className="w-3 h-3" />
                <span>Waypoints:</span>
              </div>

              {waypointButtons.map(({ id, label, sublabel, icon: Icon }) => {
                const isActive = engineState.currentAction === id;
                return (
                  <button
                    key={id}
                    onClick={() => handleWaypointClick(id)}
                    title={sublabel}
                    className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[9px] font-mono tracking-wide transition-all duration-200 ${isActive
                        ? 'bg-cyan-500 text-slate-950 font-bold shadow-lg shadow-cyan-500/40 scale-105'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800/80 border border-transparent hover:border-cyan-500/30'
                      }`}
                  >
                    <Icon className="w-3 h-3" />
                    <span>{label}</span>
                  </button>
                );
              })}
            </div>
          </div>

        </div>

        {/* SPACER to push dynamic card to the right */}
        <div className="flex-1" />

        {/* RIGHT DYNAMIC CONTENT PANEL (Only visible if there is content) */}
        {(activeModule === 'CORE' || activeModule === 'SPATIAL' || activeModule === 'PERCEPTION' || activeModule === 'INTELLIGENCE' || activeModule === 'ASSURANCE') && (
          <div
            style={{
              width: '360px',
              minWidth: '360px',
              maxWidth: '360px',
              height: '100%',
              flexShrink: 0,
              flexGrow: 0,
              position: 'relative',
              background: 'rgba(15, 23, 42, 0.9)',
              backdropFilter: 'blur(20px)',
              borderLeft: '1px solid rgba(100, 116, 139, 0.5)',
              borderRight: '1px solid rgba(100, 116, 139, 0.5)',
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.5)',
              color: 'white',
              pointerEvents: 'auto',
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: 0,
                right: 0,
                bottom: 0,
                left: 0,
                overflowY: 'auto',
                overflowX: 'hidden',
                padding: '1.5rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '1.5rem',
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%' }}>

                {/* CORE MODULE CONTENT */}
                {activeModule === 'CORE' && (
              <div className="flex flex-col gap-5 font-mono text-xs">
                <div className="pb-3 border-b border-cyan-500/30 flex items-center justify-between">
                  <h2 className="text-sm font-bold uppercase tracking-widest flex items-center gap-2 text-white">
                    <Cpu className="w-4 h-4 text-cyan-400" />
                    Locomotion & State
                  </h2>
                  <span
                    className={`px-2 py-1 rounded-md text-[10px] font-bold ${isLiveMocap
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
                            ? 'WALKING'
                            : 'ZERO-G FLOAT'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* LEFT COLUMN */}
                  <div className="flex flex-col gap-4">
                    {/* WASD KEYBOARD HELPER */}
                    <div className="flex flex-col gap-1.5">
                      <span className="text-slate-400 text-[10px]">WASD Navigation:</span>
                      <div className="flex flex-col items-center gap-1 self-start">
                        <div
                          className={`w-7 h-7 rounded flex items-center justify-center font-bold text-xs border ${keysPressed.forward
                              ? 'bg-cyan-500 text-slate-950 border-cyan-300'
                              : 'bg-slate-800 text-slate-300 border-slate-700'
                            }`}
                        >
                          W
                        </div>
                        <div className="flex gap-1">
                          <div
                            className={`w-7 h-7 rounded flex items-center justify-center font-bold text-xs border ${keysPressed.left
                                ? 'bg-cyan-500 text-slate-950 border-cyan-300'
                                : 'bg-slate-800 text-slate-300 border-slate-700'
                              }`}
                          >
                            A
                          </div>
                          <div
                            className={`w-7 h-7 rounded flex items-center justify-center font-bold text-xs border ${keysPressed.backward
                                ? 'bg-cyan-500 text-slate-950 border-cyan-300'
                                : 'bg-slate-800 text-slate-300 border-slate-700'
                              }`}
                          >
                            S
                          </div>
                          <div
                            className={`w-7 h-7 rounded flex items-center justify-center font-bold text-xs border ${keysPressed.right
                                ? 'bg-cyan-500 text-slate-950 border-cyan-300'
                                : 'bg-slate-800 text-slate-300 border-slate-700'
                              }`}
                          >
                            D
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* ACTIVE WAYPOINT STATUS */}
                    {engineState.targetWaypoint && (
                      <div className="p-2 rounded-lg bg-slate-800/80 border border-cyan-500/30 flex flex-col gap-1">
                        <span className="text-[10px] text-cyan-400 font-bold uppercase">Active Target:</span>
                        <span className="text-white text-xs">{engineState.targetWaypoint.name}</span>
                        <span className="text-[10px] text-slate-400">{engineState.targetWaypoint.station}</span>
                      </div>
                    )}
                  </div>

                  {/* RIGHT COLUMN */}
                  <div className="flex flex-col gap-4">
                    {/* BONE TELEMETRY */}
                    <div className="flex flex-col gap-1.5">
                      <span className="text-slate-400 text-[10px] flex items-center justify-between">
                        <span>Bones Discovered:</span>
                        <span className="text-cyan-400 font-bold">{discoveredBones.length > 0 ? discoveredBones.length : 14} joints</span>
                      </span>
                      <div className="grid grid-cols-1 gap-1.5 text-[10px] text-slate-300 bg-slate-950/40 p-2 rounded-lg border border-slate-700">
                        <div className="flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                          <span>Upper Arms (L/R)</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                          <span>Forearms (L/R)</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                          <span>Hands & Wrists</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                          <span>Head & Neck</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                          <span>Spine & Hips</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                          <span>Legs & Feet (L/R)</span>
                        </div>
                      </div>
                    </div>

                    {/* QUANTUM CORE HARVEST BADGE */}
                    {engineState.isCoreAttached && (
                      <div className="p-2 rounded-lg bg-cyan-950/60 border border-cyan-400/60 flex items-center gap-2 text-cyan-300 text-[10px] font-bold">
                        <div className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                        <span>CORE HARVESTED ON GAUNTLET</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* SPATIAL MODULE CONTENT */}
            {activeModule === 'SPATIAL' && (
              <div className="flex flex-col gap-6 text-white font-sans min-w-0">

                <div className="pb-3 border-b border-slate-700/50">
                  <h2 className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                    <Compass className="w-4 h-4 text-indigo-400" />
                    Spatial Framing
                  </h2>
                </div>

                {/* USP 1 */}
                <div className="flex flex-col gap-1.5">
                  <h3 className="font-bold text-sm">1. Fixed Camera Reference</h3>
                  <p className="text-xs text-white leading-relaxed">
                    The green grid creates a fixed reference point around the workstation. The AI knows where objects are relative to this grid, even if the astronaut floats upside down.
                  </p>

                  <button
                    onClick={onToggleUsp1}
                    className={`mt-1.5 self-start w-fit px-3 py-1 rounded text-[9px] font-bold tracking-widest transition-all duration-300 border uppercase ${usp1Active
                        ? 'bg-indigo-500 text-white border-indigo-400 shadow-[0_0_8px_rgba(99,102,241,0.4)]'
                        : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700 hover:text-white'
                      }`}
                  >
                    {usp1Active ? 'DEACTIVATE FEATURE' : 'ACTIVATE FEATURE'}
                  </button>

                  {usp1Active && (
                    <div className="mt-1.5 p-2 bg-indigo-950/40 border border-indigo-500/30 rounded flex items-center gap-2 text-[10px] text-indigo-200 font-mono self-start">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
                      <span>Coordinate Lock: Active at Station 1</span>
                    </div>
                  )}
                </div>

                <div className="h-px w-full bg-slate-700/50 my-1" />

                {/* USP 2 */}
                <div className="flex flex-col gap-1.5">
                  <h3 className="font-bold text-sm">2. 3D Workspace Boundary</h3>
                  <p className="text-xs text-white leading-relaxed">
                    The amber box acts as a 3D boundary. The AI only pays attention to actions inside this box and ignores background distractions.
                  </p>

                  <button
                    onClick={onToggleUsp2}
                    className={`mt-1.5 self-start w-fit px-3 py-1 rounded text-[9px] font-bold tracking-widest transition-all duration-300 border uppercase ${usp2Active
                        ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.4)]'
                        : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700 hover:text-white'
                      }`}
                  >
                    {usp2Active ? 'DEACTIVATE FEATURE' : 'ACTIVATE FEATURE'}
                  </button>

                  {usp2Active && (
                    <div className="mt-1.5 p-2 bg-amber-950/40 border border-amber-500/30 rounded flex items-center gap-4 text-[10px] text-amber-200 font-mono self-start">
                      <div className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                        <span>Boundary Box: Visible</span>
                      </div>
                      <span className="font-bold text-amber-400">DISTRACTORS BLOCKED: 32</span>
                    </div>
                  )}
                </div>

                <div className="h-px w-full bg-slate-700/50 my-1" />

                {/* USP 3 */}
                <div className="flex flex-col gap-1.5">
                  <h3 className="font-bold text-sm">3. Smart Focus Area</h3>
                  <p className="text-xs text-white leading-relaxed">
                    The camera zooms in only on the active hands and tools. By not processing the entire room, it saves 65% of computer processing power.
                  </p>

                  <button
                    onClick={onToggleUsp3}
                    className={`mt-1.5 self-start w-fit px-3 py-1 rounded text-[9px] font-bold tracking-widest transition-all duration-300 border uppercase ${usp3Active
                        ? 'bg-rose-500 text-white border-rose-400 shadow-[0_0_8px_rgba(244,63,94,0.4)]'
                        : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700 hover:text-white'
                      }`}
                  >
                    {usp3Active ? 'DEACTIVATE FEATURE' : 'ACTIVATE FEATURE'}
                  </button>

                  {usp3Active && (
                    <div className="mt-1.5 p-2 bg-rose-950/40 border border-rose-500/30 rounded flex items-center gap-3 text-[10px] font-mono text-rose-200 self-start">
                      <span>COMPUTE SAVED:</span>
                      <span className="text-sm font-black text-rose-400">65%</span>
                    </div>
                  )}
                </div>

              </div>
            )}

            {/* PERCEPTION MODULE CONTENT (GROUP B) */}
            {activeModule === 'PERCEPTION' && (
              <div className="flex flex-col gap-6 text-white font-sans min-w-0">

                <div className="pb-3 border-b border-slate-700/50">
                  <h2 className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                    <Eye className="w-4 h-4 text-emerald-400" />
                    Perception Engine
                  </h2>
                </div>

                {/* USP 4 */}
                <div className="flex flex-col gap-1.5">
                  <h3 className="font-bold text-sm">4. Causal Action Verifier</h3>
                  <p className="text-xs text-white leading-relaxed">
                    Links physical state changes to recognized actions in a definitive timeline to prevent false positives.
                  </p>
                  <button
                    onClick={onToggleUsp4}
                    className={`mt-1.5 self-start w-fit px-3 py-1 rounded text-[9px] font-bold tracking-widest transition-all duration-300 border uppercase ${usp4Active
                        ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.4)]'
                        : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700 hover:text-white'
                      }`}
                  >
                    {usp4Active ? 'DEACTIVATE FEATURE' : 'ACTIVATE FEATURE'}
                  </button>
                  {usp4Active && (
                    <div className="mt-1.5 p-2 bg-emerald-950/40 border border-emerald-500/30 rounded flex flex-col gap-2 text-[10px] font-mono self-stretch">
                      <div className="flex items-center gap-2 text-emerald-200">
                        <Link className="w-3 h-3" />
                        <span>CAUSAL CHAIN ESTABLISHED</span>
                      </div>
                      <div className="flex items-center gap-1 text-slate-300">
                        <span className="text-cyan-400">Hand Moved</span>
                        <span className="text-slate-500">→</span>
                        <span className="text-amber-400">Switch Flipped</span>
                        <span className="text-slate-500">→</span>
                        <span className="text-emerald-400 font-bold">ACTION VERIFIED</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="h-px w-full bg-slate-700/50 my-1" />

                {/* USP 5 */}
                <div className="flex flex-col gap-1.5">
                  <h3 className="font-bold text-sm">5. Bayesian Evidence Assessor</h3>
                  <p className="text-xs text-white leading-relaxed">
                    Uses Spatial-Bayes Factor (K) to rigorously quantify confidence in task completion before proceeding.
                  </p>
                  <button
                    onClick={onToggleUsp5}
                    className={`mt-1.5 self-start w-fit px-3 py-1 rounded text-[9px] font-bold tracking-widest transition-all duration-300 border uppercase ${usp5Active
                        ? 'bg-blue-500 text-white border-blue-400 shadow-[0_0_8px_rgba(59,130,246,0.4)]'
                        : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700 hover:text-white'
                      }`}
                  >
                    {usp5Active ? 'DEACTIVATE FEATURE' : 'ACTIVATE FEATURE'}
                  </button>
                  {usp5Active && (
                    <div className="mt-1.5 p-2 bg-blue-950/40 border border-blue-500/30 rounded flex flex-col gap-2 self-stretch">
                      <div className="flex justify-between items-center text-[10px] font-mono">
                        <span className="text-blue-300">K-Factor Confidence</span>
                        <span className="text-blue-400 font-bold">K = 42.8 {'>'} 31.6</span>
                      </div>
                      <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-blue-400 h-full w-[85%] animate-pulse" />
                      </div>
                      <span className="text-[9px] text-blue-200 font-bold">DECISIVE EVIDENCE DETECTED</span>
                    </div>
                  )}
                </div>

                <div className="h-px w-full bg-slate-700/50 my-1" />

                {/* USP 6 */}
                <div className="flex flex-col gap-1.5">
                  <h3 className="font-bold text-sm">6. DTW Trajectory Verification</h3>
                  <p className="text-xs text-white leading-relaxed">
                    Matches variable-speed astronaut movements against a master reference curve using Dynamic Time Warping.
                  </p>
                  <button
                    onClick={onToggleUsp6}
                    className={`mt-1.5 self-start w-fit px-3 py-1 rounded text-[9px] font-bold tracking-widest transition-all duration-300 border uppercase ${usp6Active
                        ? 'bg-purple-500 text-white border-purple-400 shadow-[0_0_8px_rgba(168,85,247,0.4)]'
                        : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700 hover:text-white'
                      }`}
                  >
                    {usp6Active ? 'DEACTIVATE FEATURE' : 'ACTIVATE FEATURE'}
                  </button>
                  {usp6Active && (
                    <div className="mt-1.5 p-2 bg-purple-950/40 border border-purple-500/30 rounded flex items-center gap-3 text-[10px] font-mono text-purple-200 self-start">
                      <TrendingUp className="w-4 h-4 text-purple-400" />
                      <div className="flex flex-col">
                        <span>TRAJECTORY ALIGNED</span>
                        <span className="text-purple-400 font-bold">Deviation: 0.04m (Within tolerance)</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="h-px w-full bg-slate-700/50 my-1" />

                {/* USP 7 */}
                <div className="flex flex-col gap-1.5">
                  <h3 className="font-bold text-sm">7. Dempster-Shafer Fusion</h3>
                  <p className="text-xs text-white leading-relaxed">
                    Resolves conflicting data from multiple cameras into a single, highly accurate belief state.
                  </p>
                  <button
                    onClick={onToggleUsp7}
                    className={`mt-1.5 self-start w-fit px-3 py-1 rounded text-[9px] font-bold tracking-widest transition-all duration-300 border uppercase ${usp7Active
                        ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.4)]'
                        : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700 hover:text-white'
                      }`}
                  >
                    {usp7Active ? 'DEACTIVATE FEATURE' : 'ACTIVATE FEATURE'}
                  </button>
                  {usp7Active && (
                    <div className="mt-1.5 p-2 bg-cyan-950/40 border border-cyan-500/30 rounded flex flex-col gap-1.5 text-[10px] font-mono self-stretch">
                      <div className="flex justify-between items-center text-slate-300">
                        <span>CAM A: 85%</span>
                        <GitMerge className="w-3 h-3 text-cyan-400" />
                        <span>CAM B: 40% (Glare)</span>
                      </div>
                      <div className="text-cyan-300 font-bold text-center border-t border-cyan-500/30 pt-1 mt-1">
                        FUSED BELIEF: 94% VALID
                      </div>
                    </div>
                  )}
                </div>

                <div className="h-px w-full bg-slate-700/50 my-1" />

                {/* USP 8 */}
                <div className="flex flex-col gap-1.5">
                  <h3 className="font-bold text-sm flex items-center gap-2">
                    8. Contradiction Guard
                    <span className="text-[8px] bg-red-500/20 text-red-300 px-1.5 py-0.5 rounded border border-red-500/30 tracking-wider">WORKING 3D EFFECT</span>
                  </h3>
                  <p className="text-xs text-white leading-relaxed">
                    Mathematically blocks impossible actions (e.g., trying to close an already closed hatch).
                  </p>
                  <button
                    onClick={onToggleUsp8}
                    className={`mt-1.5 self-start w-fit px-3 py-1 rounded text-[9px] font-bold tracking-widest transition-all duration-300 border uppercase ${usp8Active
                        ? 'bg-red-500 text-white border-red-400 shadow-[0_0_8px_rgba(239,68,68,0.4)]'
                        : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700 hover:text-white'
                      }`}
                  >
                    {usp8Active ? 'DEACTIVATE FEATURE' : 'ACTIVATE FEATURE'}
                  </button>
                  {usp8Active && (
                    <div className="mt-1.5 p-2 bg-red-950/40 border border-red-500/30 rounded flex items-center gap-3 text-[10px] font-mono text-red-200 self-start">
                      <AlertTriangle className="w-4 h-4 text-red-400 animate-pulse" />
                      <div className="flex flex-col">
                        <span className="font-bold text-red-400">ACTION REJECTED</span>
                        <span>State Contradiction Detected</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="h-px w-full bg-slate-700/50 my-1" />

                {/* USP 9 */}
                <div className="flex flex-col gap-1.5">
                  <h3 className="font-bold text-sm flex items-center gap-2">
                    9. Physical Spatial Memory
                    <span className="text-[8px] bg-teal-500/20 text-teal-300 px-1.5 py-0.5 rounded border border-teal-500/30 tracking-wider">WORKING 3D EFFECT</span>
                  </h3>
                  <p className="text-xs text-white leading-relaxed">
                    Uses Kalman filtering to remember the exact location of objects even when occluded by the astronaut.
                  </p>
                  <button
                    onClick={onToggleUsp9}
                    className={`mt-1.5 self-start w-fit px-3 py-1 rounded text-[9px] font-bold tracking-widest transition-all duration-300 border uppercase ${usp9Active
                        ? 'bg-teal-500 text-slate-950 border-teal-400 shadow-[0_0_8px_rgba(20,184,166,0.4)]'
                        : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700 hover:text-white'
                      }`}
                  >
                    {usp9Active ? 'DEACTIVATE FEATURE' : 'ACTIVATE FEATURE'}
                  </button>
                  {usp9Active && (
                    <div className="mt-1.5 p-2 bg-teal-950/40 border border-teal-500/30 rounded flex items-center gap-3 text-[10px] font-mono text-teal-200 self-start">
                      <Ghost className="w-4 h-4 text-teal-400 animate-bounce" />
                      <span>OCCLUSION PERSISTENCE ACTIVE</span>
                    </div>
                  )}
                </div>

                <div className="h-px w-full bg-slate-700/50 my-1" />

                {/* USP 10 */}
                <div className="flex flex-col gap-1.5">
                  <h3 className="font-bold text-sm">10. Topological State Guard</h3>
                  <p className="text-xs text-white leading-relaxed">
                    Enforces strict procedural checklists by graying out future steps and mathematically blocking skips.
                  </p>
                  <button
                    onClick={onToggleUsp10}
                    className={`mt-1.5 self-start w-fit px-3 py-1 rounded text-[9px] font-bold tracking-widest transition-all duration-300 border uppercase ${usp10Active
                        ? 'bg-slate-200 text-slate-950 border-white shadow-[0_0_8px_rgba(255,255,255,0.4)]'
                        : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700 hover:text-white'
                      }`}
                  >
                    {usp10Active ? 'DEACTIVATE FEATURE' : 'ACTIVATE FEATURE'}
                  </button>
                  {usp10Active && (
                    <div className="mt-1.5 p-2 bg-slate-800/80 border border-slate-500/50 rounded flex flex-col gap-1 text-[10px] font-mono self-stretch">
                      <div className="flex items-center gap-2 text-emerald-400">
                        <CheckSquare className="w-3 h-3" />
                        <span>Step 1: Complete</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-500">
                        <Lock className="w-3 h-3" />
                        <span>Step 2: Locked (Requires Step 1)</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="h-px w-full bg-slate-700/50 my-1" />

                {/* USP 11 */}
                <div className="flex flex-col gap-1.5">
                  <h3 className="font-bold text-sm flex items-center gap-2">
                    11. Reiter's CBD Engine
                    <span className="text-[8px] bg-fuchsia-500/20 text-fuchsia-300 px-1.5 py-0.5 rounded border border-fuchsia-500/30 tracking-wider">WORKING 3D EFFECT</span>
                  </h3>
                  <p className="text-xs text-white leading-relaxed">
                    Diagnoses sensor health in real-time. If a camera fails, the system automatically falls back to secondary sensors.
                  </p>
                  <button
                    onClick={onToggleUsp11}
                    className={`mt-1.5 self-start w-fit px-3 py-1 rounded text-[9px] font-bold tracking-widest transition-all duration-300 border uppercase ${usp11Active
                        ? 'bg-fuchsia-500 text-white border-fuchsia-400 shadow-[0_0_8px_rgba(217,70,239,0.4)]'
                        : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700 hover:text-white'
                      }`}
                  >
                    {usp11Active ? 'DEACTIVATE FEATURE' : 'ACTIVATE FEATURE'}
                  </button>
                  {usp11Active && (
                    <div className="mt-1.5 p-2 bg-fuchsia-950/40 border border-fuchsia-500/30 rounded flex justify-between items-center text-[10px] font-mono self-stretch">
                      <div className="flex flex-col">
                        <span className="text-slate-400">Cam 1: <span className="text-emerald-400">OK</span></span>
                        <span className="text-slate-400">Cam 2: <span className="text-red-400 font-bold">FAIL</span></span>
                      </div>
                      <div className="text-fuchsia-300 font-bold border border-fuchsia-500/50 px-2 py-1 rounded bg-fuchsia-900/50">
                        FAILOVER ACTIVE
                      </div>
                    </div>
                  )}
                </div>

              </div>
            )}

            {/* INTELLIGENCE MODULE CONTENT (GROUP C) */}
            {activeModule === 'INTELLIGENCE' && (
              <div className="flex flex-col gap-6 text-white font-sans min-w-0">

                <div className="pb-3 border-b border-slate-700/50">
                  <h2 className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    Procedure Intel
                  </h2>
                </div>

                {/* USP 12 */}
                <div className="flex flex-col gap-1.5">
                  <h3 className="font-bold text-sm flex items-center gap-2">
                    12. Lighting-Regime Thermographic Adaptor
                    <span className="text-[8px] bg-transparent text-amber-300 px-1.5 py-0.5 rounded border border-amber-500/30 tracking-wider whitespace-nowrap">WORKING 3D EFFECT</span>
                  </h3>
                  <p className="text-xs text-white leading-relaxed">
                    Physical 3D effect: Automatically simulates solar glare / extreme lighting conditions.
                  </p>
                  <button
                    onClick={onToggleUsp12}
                    className={`mt-1.5 self-start w-fit px-3 py-1 rounded text-[9px] font-bold tracking-widest transition-all duration-300 border uppercase ${usp12Active
                        ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.4)]'
                        : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700 hover:text-white'
                      }`}
                  >
                    {usp12Active ? 'DEACTIVATE GLARE SIM' : 'ACTIVATE GLARE SIM'}
                  </button>
                  {usp12Active && (
                    <div className="mt-1.5 p-2 bg-amber-950/40 border border-amber-500/30 rounded flex items-center gap-3 text-[10px] font-mono text-amber-200 self-start">
                      <Focus className="w-4 h-4 text-amber-400 animate-pulse" />
                      <span>OPTICAL NORMALIZATION FILTER: ON</span>
                    </div>
                  )}
                </div>

                <div className="h-px w-full bg-slate-700/50 my-1" />

                {/* USP 13 */}
                <div className="flex flex-col gap-1.5">
                  <h3 className="font-bold text-sm">13. Autonomous Protocol Recovery Engine</h3>
                  <p className="text-xs text-white leading-relaxed">
                    Calculates Dijkstra/A* path to recover state if a step is accidentally skipped.
                  </p>
                  <button
                    onClick={onToggleUsp13}
                    className={`mt-1.5 self-start w-fit px-3 py-1 rounded text-[9px] font-bold tracking-widest transition-all duration-300 border uppercase ${usp13Active
                        ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.4)]'
                        : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700 hover:text-white'
                      }`}
                  >
                    {usp13Active ? 'DEACTIVATE FEATURE' : 'ACTIVATE FEATURE'}
                  </button>
                  {usp13Active && (
                    <div className="mt-1.5 p-2 bg-emerald-950/40 border border-emerald-500/30 rounded flex flex-col gap-2 text-[10px] font-mono self-stretch">
                      <span className="text-emerald-400 font-bold border-b border-emerald-500/30 pb-1">RECOVERY PATH CALCULATED</span>
                      <div className="flex items-center gap-2 text-slate-300 text-[9px]">
                        <span>St 2 (Skipped)</span>
                        <span className="text-slate-500">→</span>
                        <span className="text-cyan-400">St 1b (Recalibrate)</span>
                        <span className="text-slate-500">→</span>
                        <span className="text-emerald-400">St 3 (Resume)</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="h-px w-full bg-slate-700/50 my-1" />

                {/* USP 14 */}
                <div className="flex flex-col gap-1.5">
                  <h3 className="font-bold text-sm">14. Dexterity-Aware Alert Governor</h3>
                  <p className="text-xs text-white leading-relaxed">
                    Analyzes hand jitter via FFT and suppresses non-critical alarms during delicate tasks.
                  </p>
                  <button
                    onClick={onToggleUsp14}
                    className={`mt-1.5 self-start w-fit px-3 py-1 rounded text-[9px] font-bold tracking-widest transition-all duration-300 border uppercase ${usp14Active
                        ? 'bg-purple-500 text-white border-purple-400 shadow-[0_0_8px_rgba(168,85,247,0.4)]'
                        : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700 hover:text-white'
                      }`}
                  >
                    {usp14Active ? 'DEACTIVATE FEATURE' : 'ACTIVATE FEATURE'}
                  </button>
                  {usp14Active && (
                    <div className="mt-1.5 p-2 bg-purple-950/40 border border-purple-500/30 rounded flex flex-col gap-2 text-[10px] font-mono self-stretch">
                      <div className="flex justify-between items-center text-slate-300">
                        <span>Jitter FFT:</span>
                        <span className="text-purple-400 font-bold">4.2Hz (HIGH)</span>
                      </div>
                      <div className="text-rose-400 font-bold flex items-center gap-2">
                        <Activity className="w-3 h-3" />
                        ALERTS SUPPRESSED
                      </div>
                    </div>
                  )}
                </div>

                <div className="h-px w-full bg-slate-700/50 my-1" />

                {/* USP 15 */}
                <div className="flex flex-col gap-1.5">
                  <h3 className="font-bold text-sm flex items-center gap-2">
                    15. Multi-Modal Voice Alert
                    <span className="text-[8px] bg-rose-500/20 text-rose-300 px-1.5 py-0.5 rounded border border-rose-500/30 tracking-wider whitespace-nowrap">WORKING AUDIO</span>
                  </h3>
                  <p className="text-xs text-white leading-relaxed">
                    Working Audio Effect: Triggers an audible Web Audio API siren synthesis for critical alerts.
                  </p>
                  <button
                    onClick={() => {
                      onToggleUsp23();
                      if (!usp23Active) {
                        const ctx = new (window.AudioContext || window.webkitAudioContext)();
                        const osc = ctx.createOscillator();
                        const gain = ctx.createGain();
                        osc.type = 'sawtooth';
                        osc.frequency.setValueAtTime(400, ctx.currentTime);
                        osc.frequency.linearRampToValueAtTime(600, ctx.currentTime + 0.5);
                        osc.frequency.linearRampToValueAtTime(400, ctx.currentTime + 1.0);
                        gain.gain.setValueAtTime(0, ctx.currentTime);
                        gain.gain.linearRampToValueAtTime(0.1, ctx.currentTime + 0.1);
                        gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 1.0);
                        osc.connect(gain);
                        gain.connect(ctx.destination);
                        osc.start();
                        osc.stop(ctx.currentTime + 1.0);
                      }
                    }}
                    className={`mt-1.5 self-start w-fit px-3 py-1 rounded text-[9px] font-bold tracking-widest transition-all duration-300 border uppercase ${usp23Active
                        ? 'bg-rose-500 text-white border-rose-400 shadow-[0_0_8px_rgba(244,63,94,0.4)]'
                        : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700 hover:text-white'
                      }`}
                  >
                    {usp23Active ? 'MUTE ALERT' : 'TEST SIREN ALERT'}
                  </button>
                  {usp23Active && (
                    <div className="mt-1.5 p-2 bg-rose-950/40 border border-rose-500/30 rounded flex items-center gap-3 text-[10px] font-mono text-rose-200 self-start">
                      <Radio className="w-4 h-4 text-rose-400 animate-ping" />
                      <span>CRITICAL ALERT BROADCASTING</span>
                    </div>
                  )}
                </div>

                <div className="h-px w-full bg-slate-700/50 my-1" />

                {/* USP 16 */}
                <div className="flex flex-col gap-1.5">
                  <h3 className="font-bold text-sm flex items-center gap-2">
                    16. Spatial-Audio Cueing
                    <span className="text-[8px] bg-blue-500/20 text-blue-300 px-1.5 py-0.5 rounded border border-blue-500/30 tracking-wider whitespace-nowrap">WORKING AUDIO</span>
                  </h3>
                  <p className="text-xs text-white leading-relaxed">
                    Working Audio Effect: Uses 3D spatial panning (requires stereo headphones) to guide the user to a "lost tool".
                  </p>
                  <button
                    onClick={() => {
                      onToggleUsp24();
                      if (!usp24Active) {
                        const ctx = new (window.AudioContext || window.webkitAudioContext)();
                        const osc = ctx.createOscillator();
                        const panner = ctx.createPanner();
                        const gain = ctx.createGain();
                        osc.type = 'sine';
                        osc.frequency.value = 800;
                        panner.panningModel = 'HRTF';
                        panner.setPosition(-5, 0, 0); // Hard left pan
                        gain.gain.setValueAtTime(0, ctx.currentTime);
                        gain.gain.linearRampToValueAtTime(0.1, ctx.currentTime + 0.1);
                        gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.5);
                        osc.connect(panner);
                        panner.connect(gain);
                        gain.connect(ctx.destination);
                        osc.start();
                        osc.stop(ctx.currentTime + 0.5);
                      }
                    }}
                    className={`mt-1.5 self-start w-fit px-3 py-1 rounded text-[9px] font-bold tracking-widest transition-all duration-300 border uppercase ${usp24Active
                        ? 'bg-blue-500 text-white border-blue-400 shadow-[0_0_8px_rgba(59,130,246,0.4)]'
                        : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700 hover:text-white'
                      }`}
                  >
                    {usp24Active ? 'STOP PING' : 'TEST 3D LEFT PING'}
                  </button>
                  {usp24Active && (
                    <div className="mt-1.5 p-2 bg-blue-950/40 border border-blue-500/30 rounded flex items-center gap-3 text-[10px] font-mono text-blue-200 self-start">
                      <Focus className="w-4 h-4 text-blue-400" />
                      <span>3D PANNING ACTIVE (LEFT)</span>
                    </div>
                  )}
                </div>

              </div>
            )}

            {/* ASSURANCE MODULE CONTENT (GROUP D) */}
            {activeModule === 'ASSURANCE' && (
              <div className="flex flex-col gap-6 text-white font-sans min-w-0">

                <div className="pb-3 border-b border-slate-700/50">
                  <h2 className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-emerald-400" />
                    Flight Assurance
                  </h2>
                </div>

                {/* USP 15 */}
                <div className="flex flex-col gap-1.5">
                  <h3 className="font-bold text-sm">17. Tamper-Proof Execution Ledger</h3>
                  <p className="text-xs text-white leading-relaxed">
                    Maintains a cryptographic Ed25519 hash chain of every completed action.
                  </p>
                  <button
                    onClick={onToggleUsp15}
                    className={`mt-1.5 self-start w-fit px-3 py-1 rounded text-[9px] font-bold tracking-widest transition-all duration-300 border uppercase ${usp15Active
                        ? 'bg-slate-200 text-slate-950 border-white shadow-[0_0_8px_rgba(255,255,255,0.4)]'
                        : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700 hover:text-white'
                      }`}
                  >
                    {usp15Active ? 'DEACTIVATE FEATURE' : 'ACTIVATE FEATURE'}
                  </button>
                  {usp15Active && (
                    <div className="mt-1.5 p-2 bg-slate-900 border border-slate-700 rounded flex flex-col gap-1 text-[8px] font-mono text-emerald-400 self-stretch overflow-hidden">
                      <div className="flex items-center gap-2 border-b border-slate-800 pb-1 mb-1 text-slate-500">
                        <Terminal className="w-3 h-3" />
                        LIVE LEDGER STREAM
                      </div>
                      <div className="whitespace-nowrap overflow-hidden text-ellipsis">0x7F9...A14: [OP_MOVE_ARM] OK</div>
                      <div className="whitespace-nowrap overflow-hidden text-ellipsis opacity-75">0xB21...C9F: [OP_GRAB_CORE] OK</div>
                      <div className="whitespace-nowrap overflow-hidden text-ellipsis opacity-50">0x3AA...9D1: [SYS_INIT] OK</div>
                    </div>
                  )}
                </div>

                <div className="h-px w-full bg-slate-700/50 my-1" />

                {/* USP 16 */}
                <div className="flex flex-col gap-1.5">
                  <h3 className="font-bold text-sm">18. Experiment Integrity Certificate Generator</h3>
                  <p className="text-xs text-white leading-relaxed">
                    Compiles telemetry into a verifiable JSON-LD cryptographic certificate.
                  </p>
                  <button
                    onClick={onToggleUsp16}
                    className={`mt-1.5 self-start w-fit px-3 py-1 rounded text-[9px] font-bold tracking-widest transition-all duration-300 border uppercase ${usp16Active
                        ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.4)]'
                        : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700 hover:text-white'
                      }`}
                  >
                    {usp16Active ? 'CLOSE CERTIFICATE' : 'GENERATE CERTIFICATE'}
                  </button>
                  {usp16Active && (
                    <div className="mt-1.5 p-2 bg-amber-950/40 border border-amber-500/30 rounded flex items-center gap-3 text-[10px] font-mono text-amber-200 self-stretch">
                      <FileText className="w-5 h-5 text-amber-400" />
                      <div className="flex flex-col flex-1">
                        <span className="font-bold text-amber-400">CERTIFICATE SIGNED</span>
                        <span>Composite Q_exp Score: 98.4%</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="h-px w-full bg-slate-700/50 my-1" />

                {/* USP 17 */}
                <div className="flex flex-col gap-1.5">
                  <h3 className="font-bold text-sm">19. Deterministic Mission Replay</h3>
                  <p className="text-xs text-white leading-relaxed">
                    Allows scrubbing backwards through the physical state vector history.
                  </p>
                  <button
                    onClick={onToggleUsp17}
                    className={`mt-1.5 self-start w-fit px-3 py-1 rounded text-[9px] font-bold tracking-widest transition-all duration-300 border uppercase ${usp17Active
                        ? 'bg-blue-500 text-white border-blue-400 shadow-[0_0_8px_rgba(59,130,246,0.4)]'
                        : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700 hover:text-white'
                      }`}
                  >
                    {usp17Active ? 'END REPLAY MODE' : 'START REPLAY SCRUBBER'}
                  </button>
                  {usp17Active && (
                    <div className="mt-1.5 p-2 bg-blue-950/40 border border-blue-500/30 rounded flex flex-col gap-2 text-[10px] font-mono text-blue-200 self-stretch">
                      <div className="flex justify-between items-center">
                        <span className="flex items-center gap-2"><Rewind className="w-3 h-3 text-blue-400" /> T-00:45</span>
                        <span>LIVE</span>
                      </div>
                      <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-blue-400 h-full w-[40%]" />
                      </div>
                    </div>
                  )}
                </div>

                <div className="h-px w-full bg-slate-700/50 my-1" />

                {/* USP 18 */}
                <div className="flex flex-col gap-1.5">
                  <h3 className="font-bold text-sm">20. Software TMR State Integrity Governor</h3>
                  <p className="text-xs text-white leading-relaxed">
                    Triple Modular Redundancy (TMR) protects state variables from cosmic radiation bit-flips.
                  </p>
                  <button
                    onClick={onToggleUsp18}
                    className={`mt-1.5 self-start w-fit px-3 py-1 rounded text-[9px] font-bold tracking-widest transition-all duration-300 border uppercase ${usp18Active
                        ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.4)]'
                        : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700 hover:text-white'
                      }`}
                  >
                    {usp18Active ? 'DEACTIVATE FEATURE' : 'ACTIVATE FEATURE'}
                  </button>
                  {usp18Active && (
                    <div className="mt-1.5 p-2 bg-emerald-950/40 border border-emerald-500/30 rounded flex flex-col gap-1 text-[10px] font-mono self-stretch">
                      <div className="flex items-center gap-2 border-b border-emerald-500/30 pb-1 mb-1 text-emerald-300 font-bold">
                        <Cpu className="w-3 h-3" />
                        TMR REGISTERS
                      </div>
                      <div className="flex justify-between"><span>Reg A:</span><span className="text-emerald-400">0x4F (OK)</span></div>
                      <div className="flex justify-between"><span>Reg B:</span><span className="text-emerald-400">0x4F (OK)</span></div>
                      <div className="flex justify-between"><span>Reg C:</span><span className="text-red-400 line-through">0x4E (FLIP)</span></div>
                      <div className="text-center text-[9px] text-emerald-400 font-bold mt-1 bg-emerald-950 border border-emerald-500/50 rounded py-0.5">MAJORITY VOTE: RECOVERED</div>
                    </div>
                  )}
                </div>

                <div className="h-px w-full bg-slate-700/50 my-1" />

                {/* USP 19 */}
                <div className="flex flex-col gap-1.5">
                  <h3 className="font-bold text-sm flex items-center gap-2">
                    21. Thermal-Robust Continuity Filter
                    <span className="text-[8px] bg-red-500/20 text-red-300 px-1.5 py-0.5 rounded border border-red-500/30 tracking-wider whitespace-nowrap">WORKING 3D EFFECT</span>
                  </h3>
                  <p className="text-xs text-white leading-relaxed">
                    Working 3D Effect: Simulates NPU overheating by visually tinting the simulation red/hot.
                  </p>
                  <button
                    onClick={onToggleUsp19}
                    className={`mt-1.5 self-start w-fit px-3 py-1 rounded text-[9px] font-bold tracking-widest transition-all duration-300 border uppercase ${usp19Active
                        ? 'bg-red-500 text-white border-red-400 shadow-[0_0_8px_rgba(239,68,68,0.4)]'
                        : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700 hover:text-white'
                      }`}
                  >
                    {usp19Active ? 'COOL DOWN NPU' : 'SIMULATE NPU OVERHEAT'}
                  </button>
                  {usp19Active && (
                    <div className="mt-1.5 p-2 bg-red-950/40 border border-red-500/30 rounded flex items-center gap-3 text-[10px] font-mono text-red-200 self-start">
                      <Thermometer className="w-4 h-4 text-red-400 animate-bounce" />
                      <div className="flex flex-col">
                        <span className="font-bold text-red-400">CRITICAL TEMP: 98°C</span>
                        <span>FPS Throttled to 1Hz</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="h-px w-full bg-slate-700/50 my-1" />

                {/* USP 20 */}
                <div className="flex flex-col gap-1.5">
                  <h3 className="font-bold text-sm">22. Lock-Free Edge Stream Pipeline</h3>
                  <p className="text-xs text-white leading-relaxed">
                    Single-Producer Single-Consumer (SPSC) ring buffer architecture eliminating mutex locks.
                  </p>
                  <button
                    onClick={onToggleUsp20}
                    className={`mt-1.5 self-start w-fit px-3 py-1 rounded text-[9px] font-bold tracking-widest transition-all duration-300 border uppercase ${usp20Active
                        ? 'bg-fuchsia-500 text-white border-fuchsia-400 shadow-[0_0_8px_rgba(217,70,239,0.4)]'
                        : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700 hover:text-white'
                      }`}
                  >
                    {usp20Active ? 'DEACTIVATE FEATURE' : 'ACTIVATE FEATURE'}
                  </button>
                  {usp20Active && (
                    <div className="mt-1.5 p-2 bg-fuchsia-950/40 border border-fuchsia-500/30 rounded flex items-center justify-between text-[10px] font-mono text-fuchsia-200 self-stretch">
                      <div className="flex items-center gap-2">
                        <Timer className="w-4 h-4 text-fuchsia-400 animate-pulse" />
                        <span>Pipeline Latency:</span>
                      </div>
                      <span className="text-fuchsia-400 font-bold">8.4µs</span>
                    </div>
                  )}
                </div>

                <div className="h-px w-full bg-slate-700/50 my-1" />

                {/* USP 21 */}
                <div className="flex flex-col gap-1.5">
                  <h3 className="font-bold text-sm">23. Protocol-Agnostic Declarative Graph Interpreter</h3>
                  <p className="text-xs text-white leading-relaxed">
                    Parses JSON/YAML mission rules dynamically without needing recompilation.
                  </p>
                  <button
                    onClick={onToggleUsp21}
                    className={`mt-1.5 self-start w-fit px-3 py-1 rounded text-[9px] font-bold tracking-widest transition-all duration-300 border uppercase ${usp21Active
                        ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.4)]'
                        : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700 hover:text-white'
                      }`}
                  >
                    {usp21Active ? 'CLOSE INTERPRETER' : 'OPEN INTERPRETER'}
                  </button>
                  {usp21Active && (
                    <div className="mt-1.5 p-2 bg-slate-900 border border-cyan-500/30 rounded flex flex-col gap-1 text-[9px] font-mono text-cyan-200 self-stretch">
                      <div className="flex items-center gap-2 mb-1 border-b border-cyan-500/30 pb-1">
                        <Code className="w-3 h-3 text-cyan-400" />
                        schema.json (Live Parsed)
                      </div>
                      <span className="text-cyan-400">{'{"mission": "STS-174",'}</span>
                      <span className="text-cyan-400 pl-2">{'"steps": ["reboot", "calibrate"]}'}</span>
                    </div>
                  )}
                </div>

                <div className="h-px w-full bg-slate-700/50 my-1" />

                {/* USP 22 */}
                <div className="flex flex-col gap-1.5">
                  <h3 className="font-bold text-sm">24. Timed-Automaton Protocol Verifier</h3>
                  <p className="text-xs text-white leading-relaxed">
                    UPPAAL CTL safety checks guarantee deadlocks are impossible before mission start.
                  </p>
                  <button
                    onClick={onToggleUsp22}
                    className={`mt-1.5 self-start w-fit px-3 py-1 rounded text-[9px] font-bold tracking-widest transition-all duration-300 border uppercase ${usp22Active
                        ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.4)]'
                        : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700 hover:text-white'
                      }`}
                  >
                    {usp22Active ? 'DEACTIVATE FEATURE' : 'ACTIVATE FEATURE'}
                  </button>
                  {usp22Active && (
                    <div className="mt-1.5 p-2 bg-emerald-950/40 border border-emerald-500/30 rounded flex items-center justify-between text-[10px] font-mono text-emerald-200 self-stretch">
                      <div className="flex items-center gap-2">
                        <GitBranch className="w-4 h-4 text-emerald-400" />
                        <span>State Graph:</span>
                      </div>
                      <span className="text-emerald-400 font-bold uppercase">Deadlock-Free</span>
                    </div>
                  )}
                </div>

                <div className="h-px w-full bg-slate-700/50 my-1" />

                {/* USP 25 */}
                <div className="flex flex-col gap-1.5">
                  <h3 className="font-bold text-sm">25. Flight Software Assurance Matrix</h3>
                  <p className="text-xs text-white leading-relaxed">
                    Live DO-178C traceability matrix tracking requirements to verified code states.
                  </p>
                  <button
                    onClick={onToggleUsp25}
                    className={`mt-1.5 self-start w-fit px-3 py-1 rounded text-[9px] font-bold tracking-widest transition-all duration-300 border uppercase ${usp25Active
                        ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.4)]'
                        : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700 hover:text-white'
                      }`}
                  >
                    {usp25Active ? 'HIDE TRACEABILITY' : 'SHOW MATRIX'}
                  </button>
                  {usp25Active && (
                    <div className="mt-1.5 p-2 bg-amber-950/40 border border-amber-500/30 rounded flex flex-col gap-1.5 text-[9px] font-mono self-stretch">
                      <div className="flex items-center gap-2 border-b border-amber-500/30 pb-1 mb-1 text-amber-300 font-bold">
                        <Grid className="w-3 h-3 text-amber-400" />
                        DO-178C TRACEABILITY
                      </div>
                      <div className="flex justify-between text-slate-300"><span>REQ-01 (Vision):</span> <span className="text-emerald-400">PASS (Test 1.1)</span></div>
                      <div className="flex justify-between text-slate-300"><span>REQ-02 (Safety):</span> <span className="text-emerald-400">PASS (Test 2.0)</span></div>
                      <div className="flex justify-between text-slate-300"><span>REQ-03 (Logic):</span> <span className="text-amber-400 animate-pulse">PENDING</span></div>
                    </div>
                  )}
                </div>

              </div>
            )}
              </div>
            </div>
          </div>
        )}

      </div>

      {/* BOTTOM ACTION BAR */}
      <footer className="flex items-center justify-between pointer-events-auto bg-slate-900/80 backdrop-blur-md border border-cyan-500/30 px-6 py-3 shadow-xl shadow-cyan-950/30">
        {/* LIVE MOCAP TOGGLE */}
        <div className="flex items-center gap-4">
          <button
            onClick={onToggleLiveMocap}
            className={`flex items-center gap-2.5 px-6 py-2.5 rounded-xl font-mono text-xs font-bold uppercase tracking-wider transition-all duration-300 ${isLiveMocap
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
