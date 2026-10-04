import React, { useState, useEffect } from 'react';
import {
  Layers,
  PanelLeftClose,
  PanelLeftOpen,
  Eye,
  EyeOff,
  Radio,
  ChevronLeft,
  ChevronRight,
  Hexagon,
  Activity,
  ShieldCheck,
  Cpu,
  Loader2,
  RotateCcw,
  CheckCircle2,
} from 'lucide-react';
import {
  boundaryManager,
  BoundaryState,
} from '../../engine/BoundaryManager.ts';
import {
  cbdDiagnosticManager,
  CbdDiagnosticState,
} from '../../engine/CbdDiagnosticManager.ts';

/**
 * LeftNavigationDrawer.tsx
 *
 * Dedicated Sub-View Navigation Architecture:
 * ───────────────────────────────────────────
 * Views:
 *   1. 'main': Root feature menu list (Convex Hull, CBD Diagnostic, Feature 03)
 *   2. 'convex_hull': Dedicated Convex Hull sub-view with < BACK TO MISSION CONTROLS
 *   3. 'cbd_diagnostic': Dedicated CBD Diagnostic Engine sub-view (USP 11)
 *
 * Features:
 *   - Dedicated scrollable container (max-height: calc(100vh - 120px), overflow-y: auto)
 *   - Root features completely hidden when inside dedicated views
 *   - Sleek cyan-slate glassmorphism (rgba(10, 20, 30, 0.88), borders rgba(0, 240, 255, 0.3))
 *   - Preserves dynamic left-margin push for bottom KinematicsTelemetryHUD
 */

interface LeftNavigationDrawerProps {
  isOpen: boolean;
  onToggle: (open: boolean) => void;
}

type ActiveView = 'main' | 'convex_hull' | 'cbd_diagnostic';

export default function LeftNavigationDrawer({ isOpen, onToggle }: LeftNavigationDrawerProps) {
  const [boundaryState, setBoundaryState] = useState<BoundaryState>(boundaryManager.getState());
  const [diagState, setDiagState] = useState<CbdDiagnosticState>(() => cbdDiagnosticManager.getState());
  // Sub-view navigation state: 'main' | 'convex_hull' | 'cbd_diagnostic'
  const [activeView, setActiveView] = useState<ActiveView>('main');

  useEffect(() => {
    return boundaryManager.subscribe((state) => setBoundaryState(state));
  }, []);

  useEffect(() => {
    return cbdDiagnosticManager.subscribe((state) => setDiagState(state));
  }, []);

  const { activeStationId, isAutoMode, wireframeVisible, activeZone } = boundaryState;

  const selectorList = [
    { id: 1, label: 'Avionics Console A',   sub: 'Flight Deck Ops',   color: '#00f0ff', type: 'OPERATIONAL' },
    { id: 5, label: 'Quantum Core Chamber', sub: 'High-Energy Bay',   color: '#ff2200', type: 'HAZARD'      },
    { id: 4, label: 'Downlink Terminal',    sub: 'Earth Orbit Radar', color: '#ff9900', type: 'MAINTENANCE' },
    { id: 3, label: 'Hull Viewport Sector', sub: 'Obs. Window',       color: '#00f0ff', type: 'OPERATIONAL' },
    { id: 2, label: 'Cargo Storage Bay',    sub: 'Supply Barrels',    color: '#ff9900', type: 'MAINTENANCE' },
  ];

  return (
    <>
      {/* ===================================================================== */}
      {/* FLOATING TOGGLE BUTTON (always visible, top-left)                     */}
      {/* ===================================================================== */}
      <div
        style={{ top: '1rem', left: '1rem' }}
        className="fixed z-40 pointer-events-auto"
      >
        <button
          id="btn-toggle-boundary-drawer"
          onClick={() => onToggle(!isOpen)}
          style={{
            backgroundColor: 'rgba(10, 20, 30, 0.88)',
            borderColor: 'rgba(0, 240, 255, 0.3)',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.7), 0 0 15px rgba(0, 240, 255, 0.15)',
          }}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-mono tracking-wider backdrop-blur-md border hover:border-[#00f0ff] text-cyan-200 hover:text-white transition-all duration-200 cursor-pointer"
        >
          {isOpen ? (
            <PanelLeftClose className="w-4 h-4 text-[#00f0ff]" />
          ) : (
            <PanelLeftOpen className="w-4 h-4 text-[#00f0ff]" />
          )}
          <span className="font-bold tracking-widest hidden sm:inline text-white">
            MISSION CONTROLS
          </span>
          <span
            style={{ backgroundColor: activeZone.color }}
            className="w-2 h-2 rounded-full animate-ping shrink-0"
          />
        </button>
      </div>

      {/* ===================================================================== */}
      {/* MAIN SLIDING DRAWER                                                   */}
      {/* ===================================================================== */}
      <aside
        style={{
          width: '298px',
          top: '1rem',
          bottom: '1rem',
          maxHeight: 'calc(100vh - 40px)',
          left: '1rem',
          transform: isOpen ? 'translateX(0)' : 'translateX(-340px)',
          transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
          backgroundColor: 'rgba(10, 20, 30, 0.88)',
          borderColor: 'rgba(0, 240, 255, 0.3)',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.85), 0 0 25px rgba(0, 240, 255, 0.15)',
        }}
        className="fixed z-35 flex flex-col rounded-2xl border backdrop-blur-xl pointer-events-auto overflow-hidden font-mono select-none"
      >
        {/* ================================================================= */}
        {/* VIEW 1: MAIN LIST VIEW                                            */}
        {/* ================================================================= */}
        {activeView === 'main' && (
          <>
            {/* Header: Mission Controls */}
            <div className="flex items-center justify-between px-3.5 py-3 border-b border-[rgba(0,240,255,0.3)] bg-slate-950/60 shrink-0">
              <div className="flex items-center gap-2">
                <div className="p-1 rounded-lg bg-cyan-950/40 border border-[rgba(0,240,255,0.3)]">
                  <Hexagon className="w-3.5 h-3.5 text-[#00f0ff]" />
                </div>
                <span
                  className="text-white font-mono font-bold text-xs tracking-wider uppercase"
                  style={{
                    textShadow: '0 0 8px rgba(0, 240, 255, 0.6), 0 0 16px rgba(0, 240, 255, 0.25)',
                  }}
                >
                  MISSION CONTROLS
                </span>
              </div>
              <button
                id="btn-close-mission-controls"
                onClick={() => onToggle(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 border border-transparent hover:border-[rgba(0,240,255,0.3)] transition-all cursor-pointer"
              >
                <PanelLeftClose className="w-4 h-4 text-cyan-400" />
              </button>
            </div>

            {/* Root Feature List */}
            <div
              className="mission-controls-scroll flex-1 overflow-y-auto flex flex-col py-2.5"
              style={{
                maxHeight: 'calc(100vh - 120px)',
                overflowY: 'auto',
              }}
            >
              {/* Feature 01: Convex Hull (Clickable - Matching Feature 02 / 03 Layout) */}
              <div
                style={{
                  backgroundColor: 'rgba(10, 20, 30, 0.88)',
                  borderColor: 'rgba(0, 240, 255, 0.3)',
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.6), 0 0 15px rgba(0, 240, 255, 0.12)',
                }}
                className="mx-2.5 mb-2 rounded-xl border overflow-hidden hover:border-[#00f0ff] transition-all duration-200"
              >
                <button
                  id="btn-open-convex-hull-view"
                  onClick={() => setActiveView('convex_hull')}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    width: '100%',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                  className="w-full flex items-start justify-between px-3.5 py-3 text-left transition-all duration-200 cursor-pointer group hover:bg-cyan-500/10"
                >
                  <div className="flex items-start gap-2.5 min-w-0 flex-1 text-left">
                    <div
                      style={{
                        borderColor: 'rgba(0, 240, 255, 0.4)',
                        backgroundColor: 'rgba(0, 240, 255, 0.15)',
                      }}
                      className="p-1.5 rounded-lg border mt-0.5 shrink-0 group-hover:border-[#00f0ff] transition-all"
                    >
                      <Layers className="w-4 h-4 text-[#00f0ff]" />
                    </div>
                    <div className="flex flex-col min-w-0 text-left items-start">
                      <span className="font-bold tracking-wide whitespace-nowrap leading-tight text-white text-[15.5px]">
                        Convex Hull
                      </span>
                      <span className="font-medium tracking-wider whitespace-nowrap leading-normal mt-0.5 text-[11px] text-[#00f0ff]">
                        Volumetric Workspace
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0 ml-2 mt-1">
                    <span
                      style={{
                        borderColor: 'rgba(0, 240, 255, 0.4)',
                        backgroundColor: 'rgba(2, 6, 23, 0.8)',
                        color: '#00f0ff',
                        boxShadow: '0 0 8px rgba(0, 240, 255, 0.3)',
                      }}
                      className="text-[7.5px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wider"
                    >
                      LIVE
                    </span>
                    <ChevronRight className="w-4 h-4 text-[#00f0ff] group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </button>
              </div>

              {/* Feature 02: CBD Diagnostic (Reiter's Fault Recovery - Interactive Sub-View) */}
              <div
                style={{
                  backgroundColor: 'rgba(10, 20, 30, 0.88)',
                  borderColor: diagState.status === 'COMPLETED' ? 'rgba(0, 255, 153, 0.4)' : 'rgba(0, 240, 255, 0.3)',
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.6), 0 0 15px rgba(0, 240, 255, 0.12)',
                }}
                className="mx-2.5 mb-2 rounded-xl border overflow-hidden hover:border-[#00f0ff] transition-all duration-200"
              >
                <button
                  id="btn-open-cbd-diagnostic-view"
                  onClick={() => setActiveView('cbd_diagnostic')}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    width: '100%',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                  className="w-full flex items-start justify-between px-3.5 py-3 text-left transition-all duration-200 cursor-pointer group hover:bg-cyan-500/10"
                >
                  <div className="flex items-start gap-2.5 min-w-0 flex-1 text-left">
                    <div
                      style={{
                        borderColor: diagState.status === 'COMPLETED' ? 'rgba(0, 255, 153, 0.5)' : 'rgba(0, 240, 255, 0.4)',
                        backgroundColor: diagState.status === 'COMPLETED' ? 'rgba(0, 255, 153, 0.15)' : 'rgba(0, 240, 255, 0.15)',
                      }}
                      className="p-1.5 rounded-lg border mt-0.5 shrink-0 group-hover:border-[#00f0ff] transition-all"
                    >
                      <ShieldCheck
                        className={`w-4 h-4 ${diagState.status === 'COMPLETED' ? 'text-[#00ff99]' : 'text-[#00f0ff]'}`}
                      />
                    </div>
                    <div className="flex flex-col min-w-0 text-left items-start flex-1 mr-2">
                      <span className="font-bold tracking-wide whitespace-nowrap leading-tight text-white text-[15.5px]">
                        CBD Diagnostic
                      </span>
                      <span className="font-medium tracking-wider whitespace-nowrap leading-normal mt-0.5 text-[11px] text-[#00f0ff] truncate max-w-full">
                        Consistency Diagnosis
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0 mt-1">
                    <span
                      style={{
                        borderColor: diagState.status === 'COMPLETED' ? 'rgba(0, 255, 153, 0.5)' : 'rgba(0, 240, 255, 0.4)',
                        backgroundColor: 'rgba(2, 6, 23, 0.8)',
                        color: diagState.status === 'COMPLETED' ? '#00ff99' : '#00ff99',
                        boxShadow: '0 0 8px rgba(0, 255, 153, 0.3)',
                      }}
                      className="text-[7.5px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wider whitespace-nowrap"
                    >
                      {diagState.status === 'COMPLETED' ? 'HEALTHY' : 'READY'}
                    </span>
                    <ChevronRight className="w-4 h-4 text-[#00f0ff] group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </button>
              </div>

              {/* Feature 03: Standby Slot (Disabled) */}
              <div
                style={{
                  backgroundColor: 'rgba(10, 20, 30, 0.5)',
                  borderColor: 'rgba(0, 240, 255, 0.15)',
                }}
                className="mx-2.5 mb-2 rounded-xl border overflow-hidden opacity-40 cursor-not-allowed"
              >
                <div className="w-full flex items-start justify-between px-3.5 py-3 text-left">
                  <div className="flex items-start gap-2.5 min-w-0 flex-1 text-left">
                    <div
                      style={{
                        borderColor: 'rgba(0, 240, 255, 0.2)',
                        backgroundColor: 'rgba(0, 240, 255, 0.1)',
                      }}
                      className="p-1.5 rounded-lg border mt-0.5 shrink-0"
                    >
                      <Activity className="w-4 h-4 text-[#00f0ff]" />
                    </div>
                    <div className="flex flex-col min-w-0 text-left items-start">
                      <span className="font-bold tracking-wide whitespace-nowrap leading-tight text-white text-[15.5px]">
                        Feature 03
                      </span>
                      <span className="font-medium tracking-wider whitespace-nowrap leading-normal mt-0.5 text-[11px] text-[#00f0ff]">
                        Standby Slot // Reserved
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0 ml-2 mt-1">
                    <span
                      style={{
                        borderColor: 'rgba(0, 240, 255, 0.2)',
                        backgroundColor: 'rgba(2, 6, 23, 0.8)',
                        color: '#00f0ff',
                      }}
                      className="text-[7.5px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wider"
                    >
                      SOON
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* ================================================================= */}
        {/* VIEW 2: DEDICATED CONVEX HULL CONTROLS VIEW                       */}
        {/* ================================================================= */}
        {activeView === 'convex_hull' && (
          <>
            {/* Top Navigation Bar with Back Button */}
            <div className="flex items-center justify-between px-3 py-2.5 border-b border-[rgba(0,240,255,0.3)] bg-slate-950/80 shrink-0">
              <button
                id="btn-back-to-mission-controls"
                onClick={() => setActiveView('main')}
                className="flex items-center gap-1.5 text-xs font-mono font-bold text-cyan-300 hover:text-white transition-all cursor-pointer group"
              >
                <ChevronLeft className="w-4 h-4 text-[#00f0ff] group-hover:-translate-x-0.5 transition-transform" />
                <span className="tracking-wider uppercase">BACK TO MISSION CONTROLS</span>
              </button>
              <button
                id="btn-close-mission-controls"
                onClick={() => onToggle(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 border border-transparent hover:border-[rgba(0,240,255,0.3)] transition-all cursor-pointer"
              >
                <PanelLeftClose className="w-4 h-4 text-cyan-400" />
              </button>
            </div>

            {/* Sub-Header: Convex Hull Title */}
            <div className="px-3.5 py-2.5 border-b border-[rgba(0,240,255,0.15)] bg-cyan-950/30 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg border border-cyan-500/35 bg-cyan-500/15 shrink-0">
                  <Layers className="w-4 h-4 text-[#00f0ff]" />
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-[14px] font-bold text-white tracking-wide leading-tight">
                    Convex Hull
                  </span>
                  <span className="text-[10px] font-semibold text-[#00f0ff] tracking-wider leading-snug">
                    Volumetric Workspace
                  </span>
                </div>
              </div>
              <span className="text-[7.5px] font-bold px-1.5 py-0.5 rounded border border-cyan-500/40 bg-slate-950/80 text-[#00f0ff] uppercase tracking-wider shrink-0">
                LIVE
              </span>
            </div>

            {/* Dedicated Scrollable Controls Section */}
            <div
              className="mission-controls-scroll flex-1 overflow-y-auto flex flex-col gap-2.5 p-2.5"
              style={{
                maxHeight: 'calc(100vh - 120px)',
                overflowY: 'auto',
              }}
            >
              {/* AUTO-TRACK / MANUAL OVERRIDE */}
              <div
                style={{
                  padding: '12px 16px',
                  overflow: 'hidden',
                  backgroundColor: 'rgba(8, 16, 26, 0.75)',
                  borderColor: 'rgba(0, 240, 255, 0.25)',
                }}
                className="flex items-center justify-between rounded-xl border box-border shrink-0"
              >
                <div className="flex items-center gap-2 min-w-0 mr-2">
                  <span
                    className={`w-2 h-2 rounded-full shrink-0 ${
                      isAutoMode ? 'bg-[#00ff99] shadow-[0_0_8px_#00ff99] animate-pulse' : 'bg-slate-500'
                    }`}
                  />
                  <div className="flex flex-col min-w-0">
                    <span className="text-[10px] font-bold text-white tracking-wide">
                      {isAutoMode ? 'AUTO TRACK: ON' : 'MANUAL OVERRIDE'}
                    </span>
                    <span className="text-[7.5px] text-[#88a0b5] tracking-wider truncate">
                      {isAutoMode ? 'Tracking EVA-1 Traversal' : 'Locked to selected zone'}
                    </span>
                  </div>
                </div>
                <button
                  id="btn-convex-auto-mode"
                  onClick={() => boundaryManager.setFocusStation('AUTO')}
                  className={`px-2 py-1 rounded-lg text-[8.5px] font-bold tracking-wider transition-all shrink-0 cursor-pointer ${
                    isAutoMode
                      ? 'bg-[#00ff99] text-slate-950 shadow-md shadow-[#00ff99]/40 font-bold'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-[rgba(0,240,255,0.3)]'
                  }`}
                >
                  AUTO
                </button>
              </div>

              {/* FOCUS AREA SELECTORS */}
              <div className="flex flex-col gap-1.5 shrink-0">
                <span className="text-[7.5px] font-bold text-[#88a0b5] uppercase tracking-widest px-1">
                  Focus Area Selectors
                </span>
                {selectorList.map((item) => {
                  const isSelected = !isAutoMode && activeStationId === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => boundaryManager.setFocusStation(item.id)}
                      style={{
                        padding: '12px 16px',
                        overflow: 'hidden',
                        borderColor: isSelected ? item.color : 'rgba(0, 240, 255, 0.2)',
                        boxShadow: isSelected ? `0 0 10px ${item.color}35` : 'none',
                        backgroundColor: isSelected ? 'rgba(15, 28, 44, 0.95)' : 'rgba(8, 16, 26, 0.65)',
                      }}
                      className="w-full rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer box-border group"
                    >
                      <div className="flex items-center gap-2.5 min-w-0 mr-1.5">
                        <span
                          style={{
                            backgroundColor: item.color,
                            boxShadow: isSelected ? `0 0 8px ${item.color}` : 'none',
                          }}
                          className="w-2 h-2 rounded-full shrink-0"
                        />
                        <div className="flex flex-col min-w-0">
                          <span className={`text-[9.5px] font-bold truncate ${isSelected ? 'text-white' : 'text-slate-200 group-hover:text-white'}`}>
                            {item.label}
                          </span>
                          <span className="text-[7.5px] text-[#88a0b5] tracking-wide truncate">
                            {item.sub}
                          </span>
                        </div>
                      </div>
                      <span
                        style={{
                          color: item.color,
                          borderColor: `${item.color}55`,
                          backgroundColor: `${item.color}15`,
                        }}
                        className="text-[7.5px] font-bold uppercase tracking-wider shrink-0 px-1.5 py-0.5 rounded border"
                      >
                        {item.type === 'HAZARD' ? 'HAZARD' : item.type === 'MAINTENANCE' ? 'DATA' : 'FOCUS'}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* ACTIVE ZONE TELEMETRY */}
              <div
                style={{
                  padding: '12px 14px',
                  overflow: 'hidden',
                  backgroundColor: 'rgba(8, 16, 26, 0.75)',
                  borderColor: 'rgba(0, 240, 255, 0.25)',
                }}
                className="rounded-xl border flex flex-col gap-1.5 box-border shrink-0"
              >
                <div className="flex items-center justify-between border-b border-[rgba(0,240,255,0.15)] pb-1.5">
                  <span className="text-[7.5px] font-bold text-[#88a0b5] uppercase tracking-wider">
                    Active Zone Telemetry
                  </span>
                  <span
                    style={{
                      color: activeZone.color,
                      borderColor: `${activeZone.color}50`,
                      backgroundColor: `${activeZone.color}15`,
                    }}
                    className="text-[7.5px] font-bold px-1.5 py-0.5 rounded border"
                  >
                    {activeZone.zoneType}
                  </span>
                </div>
                <div className="flex flex-col gap-1 text-[8.5px]">
                  {[
                    { label: 'HULL NAME',    value: activeZone.hullName,   cls: 'text-white font-bold' },
                    { label: 'BOUNDING DIM', value: `${activeZone.size[0]}m × ${activeZone.size[1]}m × ${activeZone.size[2]}m`, cls: 'text-cyan-200' },
                    { label: 'CENTER COORD', value: `[${activeZone.center.join(', ')}]`, cls: 'text-slate-200' },
                  ].map(({ label, value, cls }) => (
                    <div key={label} className="flex justify-between gap-2">
                      <span className="text-[#88a0b5] shrink-0 font-medium">{label}:</span>
                      <span className={`truncate text-right ${cls}`}>{value}</span>
                    </div>
                  ))}
                  <div className="flex justify-between">
                    <span className="text-[#88a0b5] font-medium">COLOR CODE:</span>
                    <span style={{ color: activeZone.color }} className="font-bold">
                      {activeZone.color}
                    </span>
                  </div>
                </div>
              </div>

              {/* WIREFRAME TOGGLE */}
              <div
                style={{
                  padding: '12px 14px',
                  overflow: 'hidden',
                  backgroundColor: 'rgba(8, 16, 26, 0.75)',
                  borderColor: 'rgba(0, 240, 255, 0.25)',
                }}
                className="flex items-center justify-between rounded-xl border box-border shrink-0 mb-2"
              >
                <div className="flex items-center gap-2 text-[9px] text-white font-bold">
                  {wireframeVisible ? (
                    <Eye className="w-3.5 h-3.5 text-[#00f0ff]" />
                  ) : (
                    <EyeOff className="w-3.5 h-3.5 text-slate-400" />
                  )}
                  <span>3D WIREFRAME MESH</span>
                </div>
                <button
                  id="btn-toggle-wireframe"
                  onClick={() => boundaryManager.toggleWireframe()}
                  className={`px-2.5 py-1 rounded-lg text-[8px] font-bold tracking-wider transition-all cursor-pointer ${
                    wireframeVisible
                      ? 'bg-cyan-500/20 hover:bg-cyan-500/30 text-[#00f0ff] border border-cyan-400/50 shadow-sm shadow-cyan-500/30'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                  }`}
                >
                  {wireframeVisible ? 'VISIBLE' : 'HIDDEN'}
                </button>
              </div>
            </div>
          </>
        )}

        {/* ================================================================= */}
        {/* VIEW 3: DEDICATED CBD DIAGNOSTIC CONTROLS VIEW (USP 11)           */}
        {/* ================================================================= */}
        {activeView === 'cbd_diagnostic' && (
          <>
            {/* Top Navigation Bar with Back Button */}
            <div className="flex items-center justify-between px-3 py-2.5 border-b border-[rgba(0,240,255,0.3)] bg-slate-950/80 shrink-0">
              <button
                id="btn-back-from-cbd"
                onClick={() => setActiveView('main')}
                className="flex items-center gap-1.5 text-xs font-mono font-bold text-cyan-300 hover:text-white transition-all cursor-pointer group"
              >
                <ChevronLeft className="w-4 h-4 text-[#00f0ff] group-hover:-translate-x-0.5 transition-transform" />
                <span className="tracking-wider uppercase">BACK TO MISSION CONTROLS</span>
              </button>
              <button
                id="btn-close-cbd-controls"
                onClick={() => onToggle(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 border border-transparent hover:border-[rgba(0,240,255,0.3)] transition-all cursor-pointer"
              >
                <PanelLeftClose className="w-4 h-4 text-cyan-400" />
              </button>
            </div>

            {/* Sub-Header: CBD Diagnostic Engine Title */}
            <div className="px-3.5 py-2.5 border-b border-[rgba(0,240,255,0.15)] bg-cyan-950/30 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg border border-cyan-500/35 bg-cyan-500/15 shrink-0">
                  <ShieldCheck className="w-4 h-4 text-[#00f0ff]" />
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-[14px] font-bold text-white tracking-wide leading-tight">
                    CBD Diagnostic
                  </span>
                  <span className="text-[10px] font-semibold text-[#00f0ff] tracking-wider leading-snug">
                    Reiter&apos;s Fault Recovery
                  </span>
                </div>
              </div>
              <span
                style={{
                  borderColor: diagState.status === 'COMPLETED' ? 'rgba(0, 255, 153, 0.5)' : 'rgba(0, 240, 255, 0.4)',
                  color: diagState.status === 'COMPLETED' ? '#00ff99' : '#00f0ff',
                }}
                className="text-[7.5px] font-bold px-1.5 py-0.5 rounded border bg-slate-950/80 uppercase tracking-wider shrink-0"
              >
                {diagState.status === 'COMPLETED'
                  ? 'HEALTHY'
                  : diagState.status === 'SCANNING'
                  ? 'SCANNING'
                  : 'READY'}
              </span>
            </div>

            {/* Dedicated Scrollable Controls Section */}
            <div
              className="mission-controls-scroll flex-1 overflow-y-auto flex flex-col gap-2.5 p-2.5"
              style={{
                maxHeight: 'calc(100vh - 120px)',
                overflowY: 'auto',
              }}
            >
              {/* REITER'S MODEL OVERVIEW CARD */}
              <div
                style={{
                  padding: '10px 12px',
                  backgroundColor: 'rgba(8, 16, 26, 0.85)',
                  borderColor: diagState.status === 'COMPLETED' ? 'rgba(0, 255, 153, 0.4)' : 'rgba(0, 240, 255, 0.25)',
                }}
                className="rounded-xl border flex flex-col gap-2 shrink-0 transition-all duration-300"
              >
                <div className="flex items-center justify-between">
                  <span
                    style={{ fontSize: '12px' }}
                    className="font-bold text-white tracking-wider flex items-center gap-1.5 uppercase font-mono"
                  >
                    <Cpu className="w-3.5 h-3.5 text-[#00f0ff]" />
                    REITER&apos;S DIAGNOSTIC ENGINE
                  </span>
                </div>

                {/* Structured 2-column key-value rows */}
                <div className="flex flex-col gap-1.5 bg-slate-950/60 p-2.5 rounded-lg border border-cyan-500/15 font-mono">
                  <div className="flex items-center justify-between" style={{ fontSize: '10.5px' }}>
                    <span className="text-[#88a0b5] font-semibold tracking-wider uppercase">ALGORITHM:</span>
                    <span className="text-white font-bold">Reiter&apos;s CBD</span>
                  </div>
                  <div className="flex items-center justify-between" style={{ fontSize: '10.5px' }}>
                    <span className="text-[#88a0b5] font-semibold tracking-wider uppercase">ACTIVE NODES:</span>
                    <span className="text-white font-bold">4 Multi-Cam Heads</span>
                  </div>
                  <div className="flex items-center justify-between" style={{ fontSize: '10.5px' }}>
                    <span className="text-[#88a0b5] font-semibold tracking-wider uppercase">STATUS:</span>
                    <span
                      style={{
                        color:
                          diagState.status === 'COMPLETED'
                            ? '#00ff99'
                            : diagState.status === 'SCANNING'
                            ? '#00f0ff'
                            : '#00ff99',
                      }}
                      className="font-bold uppercase tracking-wider"
                    >
                      {diagState.status === 'COMPLETED'
                        ? '1 Fault Repaired'
                        : diagState.status === 'SCANNING'
                        ? 'Scanning...'
                        : 'Nominal'}
                    </span>
                  </div>
                </div>

                {/* Dynamic Status Tag */}
                <div
                  style={{
                    backgroundColor:
                      diagState.status === 'COMPLETED'
                        ? 'rgba(0, 255, 153, 0.12)'
                        : diagState.status === 'SCANNING'
                        ? 'rgba(0, 240, 255, 0.12)'
                        : 'rgba(15, 23, 42, 0.6)',
                    borderColor:
                      diagState.status === 'COMPLETED'
                        ? 'rgba(0, 255, 153, 0.4)'
                        : diagState.status === 'SCANNING'
                        ? 'rgba(0, 240, 255, 0.4)'
                        : 'rgba(51, 65, 85, 0.5)',
                    color:
                      diagState.status === 'COMPLETED'
                        ? '#00ff99'
                        : diagState.status === 'SCANNING'
                        ? '#00f0ff'
                        : '#94a3b8',
                    fontSize: '10px',
                  }}
                  className="px-2.5 py-1.5 rounded-lg border font-mono font-bold tracking-wide flex items-center justify-between transition-all"
                >
                  <span className="flex items-center gap-1.5">
                    {diagState.status === 'COMPLETED' ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#00ff99]" />
                    ) : diagState.status === 'SCANNING' ? (
                      <Loader2 className="w-3.5 h-3.5 text-[#00f0ff] animate-spin" />
                    ) : (
                      <Radio className="w-3.5 h-3.5 text-cyan-400" />
                    )}
                    {diagState.status === 'COMPLETED'
                      ? 'SYSTEM HEALTHY (1 FAULT RECOVERED)'
                      : diagState.status === 'SCANNING'
                      ? 'SCANNING 3D WORKSPACE...'
                      : 'ONLINE // DIAGNOSTIC READY'}
                  </span>
                </div>
              </div>

              {/* MODULE 1: Camera Pipeline Check */}
              <div
                style={{
                  padding: '12px 14px',
                  backgroundColor: 'rgba(8, 16, 26, 0.75)',
                  borderColor: 'rgba(0, 240, 255, 0.25)',
                }}
                className="rounded-xl border flex flex-col gap-2 shrink-0 font-mono"
              >
                <div className="flex flex-col text-left">
                  <span
                    style={{ fontSize: '12.5px' }}
                    className="font-bold text-white tracking-wide uppercase"
                  >
                    MODULE 1 // CAMERA PIPELINE CHECK
                  </span>
                  <span
                    style={{ fontSize: '10.5px' }}
                    className="text-[#88a0b5] tracking-wider mt-0.5"
                  >
                    Consistency verification scan of 4 camera nodes
                  </span>
                </div>

                <button
                  id="btn-run-camera-check"
                  disabled={diagState.status === 'SCANNING'}
                  onClick={() => cbdDiagnosticManager.startScan('CAMERA_PIPELINE')}
                  style={{
                    backgroundColor:
                      diagState.status === 'SCANNING' && diagState.scanType === 'CAMERA_PIPELINE'
                        ? 'rgba(0, 240, 255, 0.15)'
                        : 'rgba(0, 240, 255, 0.10)',
                    borderColor: 'rgba(0, 240, 255, 0.4)',
                    fontSize: '10.5px',
                  }}
                  className={`w-full py-2.5 px-3 rounded-lg border font-mono font-bold tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer hover:border-[#00f0ff] hover:bg-cyan-500/20 text-[#00f0ff] ${
                    diagState.status === 'SCANNING' ? 'opacity-70 cursor-not-allowed' : ''
                  }`}
                >
                  {diagState.status === 'SCANNING' && diagState.scanType === 'CAMERA_PIPELINE' ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-[#00f0ff]" />
                      <span>SCANNING 3D WORKSPACE...</span>
                    </>
                  ) : diagState.status === 'COMPLETED' && diagState.scanType === 'CAMERA_PIPELINE' ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#00ff99]" />
                      <span className="text-[#00ff99]">[DONE // COMPLETE DIAGNOSTIC]</span>
                    </>
                  ) : (
                    <>
                      <Eye className="w-3.5 h-3.5 text-[#00f0ff]" />
                      <span>RUN CAMERA PIPELINE CHECK</span>
                    </>
                  )}
                </button>
              </div>

              {/* MODULE 2: AI Core Inspection */}
              <div
                style={{
                  padding: '12px 14px',
                  backgroundColor: 'rgba(8, 16, 26, 0.75)',
                  borderColor: 'rgba(0, 240, 255, 0.25)',
                }}
                className="rounded-xl border flex flex-col gap-2 shrink-0 font-mono"
              >
                <div className="flex flex-col text-left">
                  <span
                    style={{ fontSize: '12.5px' }}
                    className="font-bold text-white tracking-wide uppercase"
                  >
                    MODULE 2 // AI CORE MODULE SWEEP
                  </span>
                  <span
                    style={{ fontSize: '10.5px' }}
                    className="text-[#88a0b5] tracking-wider mt-0.5"
                  >
                    Neural vision head latent divergence sweep
                  </span>
                </div>

                <button
                  id="btn-scan-edge-ai-modules"
                  disabled={diagState.status === 'SCANNING'}
                  onClick={() => cbdDiagnosticManager.startScan('EDGE_AI_MODULES')}
                  style={{
                    backgroundColor:
                      diagState.status === 'SCANNING' && diagState.scanType === 'EDGE_AI_MODULES'
                        ? 'rgba(0, 240, 255, 0.15)'
                        : 'rgba(0, 240, 255, 0.10)',
                    borderColor: 'rgba(0, 240, 255, 0.4)',
                    fontSize: '10.5px',
                  }}
                  className={`w-full py-2.5 px-3 rounded-lg border font-mono font-bold tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer hover:border-[#00f0ff] hover:bg-cyan-500/20 text-[#00f0ff] ${
                    diagState.status === 'SCANNING' ? 'opacity-70 cursor-not-allowed' : ''
                  }`}
                >
                  {diagState.status === 'SCANNING' && diagState.scanType === 'EDGE_AI_MODULES' ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-[#00f0ff]" />
                      <span>SCANNING 3D WORKSPACE...</span>
                    </>
                  ) : diagState.status === 'COMPLETED' && diagState.scanType === 'EDGE_AI_MODULES' ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#00ff99]" />
                      <span className="text-[#00ff99]">[DONE // COMPLETE DIAGNOSTIC]</span>
                    </>
                  ) : (
                    <>
                      <Cpu className="w-3.5 h-3.5 text-[#00f0ff]" />
                      <span>SCAN EDGE AI MODULES</span>
                    </>
                  )}
                </button>
              </div>

              {/* Fault Recovery Summary (Visible when Completed) */}
              {diagState.status === 'COMPLETED' && (
                <div
                  style={{
                    padding: '10px 12px',
                    backgroundColor: 'rgba(5, 20, 15, 0.85)',
                    borderColor: 'rgba(0, 255, 153, 0.4)',
                  }}
                  className="rounded-xl border flex flex-col gap-2 shrink-0 animate-fade-in font-mono"
                >
                  <span
                    style={{ fontSize: '12px' }}
                    className="font-bold text-[#00ff99] tracking-wider uppercase flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#00ff99]" />
                    {diagState.scanType === 'EDGE_AI_MODULES' ? 'AI CORE VERIFICATION REPORT' : 'FAULT ISOLATION REPORT'}
                  </span>
                  <div
                    style={{ fontSize: '10.5px' }}
                    className="flex flex-col gap-1 text-slate-300"
                  >
                    {diagState.scanType === 'EDGE_AI_MODULES' ? (
                      <>
                        <div><span className="text-[#88a0b5] font-semibold">SUBSYSTEM:</span> NPU & Local LLM Engine</div>
                        <div><span className="text-[#88a0b5] font-semibold">INFERENCE:</span> Latency: 8ms // Jitter: 0.2ms</div>
                        <div><span className="text-[#88a0b5] font-semibold">STATUS:</span> Neural Vision Heads Synchronized (98.2%)</div>
                      </>
                    ) : (
                      <>
                        <div><span className="text-[#88a0b5] font-semibold">TARGET NODE:</span> Head #02 (Latent Fault)</div>
                        <div><span className="text-[#88a0b5] font-semibold">ACTION:</span> Reiter&apos;s Minimal Hitting Set Bypass</div>
                        <div><span className="text-[#88a0b5] font-semibold">STATUS:</span> All 4 Streams Nominal</div>
                      </>
                    )}
                  </div>
                  <button
                    id="btn-reset-cbd-diagnostic"
                    onClick={() => cbdDiagnosticManager.reset()}
                    style={{ fontSize: '10px' }}
                    className="mt-1 w-full py-1.5 px-2 rounded-lg border border-slate-700 bg-slate-900/60 hover:bg-slate-800 text-slate-300 hover:text-white font-bold tracking-wider flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                  >
                    <RotateCcw className="w-3 h-3 text-cyan-400" />
                    <span>RESET DIAGNOSTIC STATE</span>
                  </button>
                </div>
              )}
            </div>
          </>
        )}

        {/* ─── SLEEK STATUS FOOTER ────────────────────────────────────── */}
        <div className="px-3.5 py-2 border-t border-[rgba(0,240,255,0.2)] bg-slate-950/80 flex items-center justify-between shrink-0 w-full font-mono">
          <div className="flex items-center gap-1.5 shrink-0" style={{ fontSize: '10px', lineHeight: '14px' }}>
            <Radio className="w-3 h-3 text-[#00ff99] animate-pulse" />
            <span className="uppercase tracking-wider font-bold text-white">ONLINE</span>
          </div>
          <span
            style={{ fontSize: '10px', lineHeight: '14px' }}
            className="text-[#00f0ff] font-mono tracking-wider font-semibold uppercase text-right shrink-0 truncate ml-2"
          >
            {activeView === 'convex_hull'
              ? 'CONVEX HULL'
              : activeView === 'cbd_diagnostic'
              ? 'CBD DIAGNOSTIC'
              : 'WORKSPACE ACTIVE'}
          </span>
        </div>
      </aside>
    </>
  );
}