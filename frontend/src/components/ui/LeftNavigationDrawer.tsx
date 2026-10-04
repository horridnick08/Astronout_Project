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
  SunMedium,
  Zap,
  AlertTriangle,
  Shield,
  Gauge,
  Lock,
  Unlock,
  Film,
  Clock,
  Send,
  Download,
  Share2,
  Sparkles,
} from 'lucide-react';
import {
  boundaryManager,
  BoundaryState,
} from '../../engine/BoundaryManager.ts';
import {
  cbdDiagnosticManager,
  CbdDiagnosticState,
} from '../../engine/CbdDiagnosticManager.ts';
import {
  kinematicSafetyManager,
  KinematicSafetyState,
} from '../../engine/KinematicSafetyManager.ts';
import {
  digitalTwinReplayManager,
  DigitalTwinReplayState,
} from '../../engine/DigitalTwinReplayManager.ts';
import {
  radiationFaultToleranceManager,
  RadiationFaultState,
} from '../../engine/RadiationFaultToleranceManager.ts';
import {
  protocolInterpreterManager,
  ProtocolInterpreterState,
} from '../../engine/ProtocolInterpreterManager.ts';
import {
  timedAutomatonManager,
  TimedAutomatonState,
} from '../../engine/TimedAutomatonManager.ts';

/**
 * LeftNavigationDrawer.tsx
 *
 * Dedicated Sub-View Navigation Architecture:
 * ───────────────────────────────────────────
 * Views:
 *   1. 'main': Root feature menu list (Convex Hull, CBD Diagnostic, Digital Twin Replay, Radiation Fault Tolerance, Protocol Interpreter, Timed Automaton Verifier)
 *   2. 'convex_hull': Dedicated Convex Hull sub-view with < BACK TO MISSION CONTROLS
 *   3. 'cbd_diagnostic': Dedicated CBD Diagnostic Engine sub-view
 *   4. 'digital_twin_replay': Dedicated Digital Twin Replay sub-view
 *   5. 'radiation_fault_tolerance': Dedicated Radiation Fault Tolerance sub-view
 *   6. 'protocol_interpreter': Dedicated Protocol Interpreter sub-view
 *   7. 'timed_automaton_verifier': Dedicated Timed Automaton Verifier sub-view
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

type ActiveView = 'main' | 'convex_hull' | 'cbd_diagnostic' | 'digital_twin_replay' | 'radiation_fault_tolerance' | 'protocol_interpreter' | 'timed_automaton_verifier';

export default function LeftNavigationDrawer({ isOpen, onToggle }: LeftNavigationDrawerProps) {
  const [boundaryState, setBoundaryState] = useState<BoundaryState>(boundaryManager.getState());
  const [diagState, setDiagState] = useState<CbdDiagnosticState>(() => cbdDiagnosticManager.getState());
  const [safetyState, setSafetyState] = useState<KinematicSafetyState>(() => kinematicSafetyManager.getState());
  const [replayState, setReplayState] = useState<DigitalTwinReplayState>(() => digitalTwinReplayManager.getState());
  const [radState, setRadState] = useState<RadiationFaultState>(() => radiationFaultToleranceManager.getState());
  const [protocolState, setProtocolState] = useState<ProtocolInterpreterState>(() => protocolInterpreterManager.getState());
  const [taState, setTaState] = useState<TimedAutomatonState>(() => timedAutomatonManager.getState());
  // Sub-view navigation state: 'main' | 'convex_hull' | 'cbd_diagnostic' | 'digital_twin_replay' | 'radiation_fault_tolerance' | 'protocol_interpreter' | 'timed_automaton_verifier'
  const [activeView, setActiveView] = useState<ActiveView>('main');

  useEffect(() => {
    return boundaryManager.subscribe((state) => setBoundaryState(state));
  }, []);

  useEffect(() => {
    return cbdDiagnosticManager.subscribe((state) => setDiagState(state));
  }, []);

  useEffect(() => {
    return kinematicSafetyManager.subscribe((state) => setSafetyState(state));
  }, []);

  useEffect(() => {
    return digitalTwinReplayManager.subscribe((state) => setReplayState(state));
  }, []);

  useEffect(() => {
    return radiationFaultToleranceManager.subscribe((state) => setRadState(state));
  }, []);

  useEffect(() => {
    return protocolInterpreterManager.subscribe((state) => setProtocolState(state));
  }, []);

  useEffect(() => {
    return timedAutomatonManager.subscribe((state) => setTaState(state));
  }, []);

  const handleDownloadTelemetryReport = () => {
    const kf = replayState.currentKeyframe;
    const hash = replayState.lastReportPacket?.hashDisplay || '0x4181...46f6';

    const payload = {
      mission_id: "STS-174",
      timestamp: replayState.lastReportPacket?.timestamp || new Date().toISOString(),
      hash_signature: `${hash} [Ed25519 SIGNED]`,
      downlink_specification: {
        bandwidth_rate: "8.4 KB/min",
        compression: "Delta-SE(3)",
        integrity: "Ed25519 Chain"
      },
      experiment_context: {
        astronaut_activity: kf?.stationName ? `${kf.stationName} Diagnostic Test` : "Avionics Console A Diagnostic Test",
        contact_state: "BALLISTIC TRAVERSAL",
        impulse_force_N: 217
      },
      spatial_coordinates_SE3: {
        position: {
          x: kf ? parseFloat(kf.position.x.toFixed(2)) : 1.10,
          y: kf ? parseFloat(kf.elevationY.toFixed(2)) : 0.12,
          z: kf ? parseFloat(kf.position.z.toFixed(2)) : -0.38
        },
        orientation: {
          yaw: kf ? parseFloat(((kf.yaw * 180) / Math.PI).toFixed(1)) : 90.0,
          pitch: 4.5,
          roll: 0.0,
          elevation: kf ? parseFloat(kf.elevationY.toFixed(3)) : 0.037
        }
      },
      biomechanical_telemetry: {
        left_hand_delta: {
          coords: [-0.17, 0.26, 0.28],
          velocity_ms: 0.26
        },
        right_hand_delta: {
          coords: [0.17, 0.32, 0.28],
          velocity_ms: 0.28
        },
        hand_motion_delta: kf?.jointKinematics ? `${kf.jointKinematics.handMotionDelta.toFixed(2)} m/s` : "0.23 m/s",
        palm_wrist_delta: kf?.jointKinematics ? `${kf.jointKinematics.wristDelta.toFixed(2)} m/s` : "0.11 m/s",
        finger_jitter_delta: kf?.jointKinematics ? `${kf.jointKinematics.fingerJitterDelta.toFixed(2)} m/s` : "0.08 m/s"
      }
    };

    const jsonString = JSON.stringify(payload, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const downloadUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = 'Digital_Twin_Telemetry_Payload.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(downloadUrl);
  };

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
          zIndex: 35,
        }}
        className="fixed flex flex-col rounded-2xl border backdrop-blur-xl pointer-events-auto overflow-hidden font-mono select-none"
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

              {/* Feature 03: Digital Twin Replay */}
              <div
                style={{
                  backgroundColor: 'rgba(10, 20, 30, 0.88)',
                  borderColor: replayState.isActive ? 'rgba(0, 255, 153, 0.4)' : 'rgba(0, 240, 255, 0.3)',
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.6), 0 0 15px rgba(0, 240, 255, 0.12)',
                }}
                className="mx-2.5 mb-2 rounded-xl border overflow-hidden hover:border-[#00ff99] transition-all duration-200"
              >
                <button
                  id="btn-open-digital-twin-replay"
                  onClick={() => {
                    setActiveView('digital_twin_replay');
                    digitalTwinReplayManager.setActive(true);
                  }}
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
                        borderColor: 'rgba(0, 255, 153, 0.4)',
                        backgroundColor: 'rgba(0, 255, 153, 0.15)',
                      }}
                      className="p-1.5 rounded-lg border mt-0.5 shrink-0 group-hover:border-[#00ff99] transition-all"
                    >
                      <Film className="w-4 h-4 text-[#00ff99]" />
                    </div>
                    <div className="flex flex-col min-w-0 text-left items-start flex-1 mr-2">
                      <span className="font-bold tracking-wide whitespace-nowrap leading-tight text-white text-[15.5px]">
                        Digital Twin Replay
                      </span>
                      <span className="font-medium tracking-wider whitespace-nowrap leading-normal mt-0.5 text-[11px] text-[#00ff99] truncate max-w-full">
                        Deterministic Telemetry Scrubber
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0 mt-1">
                    <span
                      style={{
                        borderColor: 'rgba(0, 255, 153, 0.4)',
                        backgroundColor: 'rgba(2, 6, 23, 0.8)',
                        color: '#00ff99',
                        boxShadow: '0 0 8px rgba(0, 255, 153, 0.3)',
                      }}
                      className="text-[7.5px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wider whitespace-nowrap"
                    >
                      READY
                    </span>
                    <ChevronRight className="w-4 h-4 text-[#00ff99] group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </button>
              </div>

              {/* Feature 04: Radiation Fault Tolerance */}
              <div
                style={{
                  backgroundColor: 'rgba(10, 20, 30, 0.88)',
                  borderColor: radState.status === 'ANOMALY_DETECTED' ? 'rgba(255, 0, 85, 0.5)' : radState.status === 'REPAIRED' ? 'rgba(0, 255, 153, 0.4)' : 'rgba(0, 240, 255, 0.3)',
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.6), 0 0 15px rgba(0, 240, 255, 0.12)',
                }}
                className="mx-2.5 mb-2 rounded-xl border overflow-hidden hover:border-[#00ff99] transition-all duration-200"
              >
                <button
                  id="radiation-fault-tolerance"
                  onClick={() => setActiveView('radiation_fault_tolerance')}
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
                        borderColor: 'rgba(0, 255, 153, 0.4)',
                        backgroundColor: 'rgba(0, 255, 153, 0.15)',
                      }}
                      className="p-1.5 rounded-lg border mt-0.5 shrink-0 group-hover:border-[#00ff99] transition-all"
                    >
                      <Shield className="w-4 h-4 text-[#00ff99]" />
                    </div>
                    <div className="flex flex-col min-w-0 text-left items-start flex-1 mr-2">
                      <span className="font-bold tracking-wide whitespace-nowrap leading-tight text-white text-[15.5px]">
                        Radiation Fault Tolerance
                      </span>
                      <span className="font-medium tracking-wider whitespace-nowrap leading-normal mt-0.5 text-[11px] text-[#00ff99] truncate max-w-full">
                        Memory Bit-Flip Repair
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0 mt-1">
                    <span
                      style={{
                        borderColor: radState.status === 'ANOMALY_DETECTED' ? 'rgba(255, 0, 85, 0.5)' : 'rgba(0, 255, 153, 0.4)',
                        backgroundColor: 'rgba(2, 6, 23, 0.8)',
                        color: radState.status === 'ANOMALY_DETECTED' ? '#ff0055' : '#00ff99',
                        boxShadow: radState.status === 'ANOMALY_DETECTED' ? '0 0 8px rgba(255, 0, 85, 0.3)' : '0 0 8px rgba(0, 255, 153, 0.3)',
                      }}
                      className="text-[7.5px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wider whitespace-nowrap"
                    >
                      {radState.status === 'ANOMALY_DETECTED' ? 'FAULT' : radState.status === 'REPAIRED' ? 'HEALTHY' : 'READY'}
                    </span>
                    <ChevronRight className="w-4 h-4 text-[#00ff99] group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </button>
              </div>

              {/* Feature 05: Protocol Interpreter (JSON-LD 3D Node Graph Engine) */}
              <div
                style={{
                  backgroundColor: 'rgba(10, 20, 30, 0.88)',
                  borderColor: protocolState.isGraphActive ? 'rgba(0, 255, 153, 0.4)' : 'rgba(0, 240, 255, 0.3)',
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.6), 0 0 15px rgba(0, 240, 255, 0.12)',
                }}
                className="mx-2.5 mb-2 rounded-xl border overflow-hidden hover:border-[#00f0ff] transition-all duration-200"
              >
                <button
                  id="btn-open-protocol-interpreter"
                  onClick={() => setActiveView('protocol_interpreter')}
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
                      <Share2 className="w-4 h-4 text-[#00f0ff]" />
                    </div>
                    <div className="flex flex-col min-w-0 text-left items-start flex-1 mr-2">
                      <span className="font-bold tracking-wide whitespace-nowrap leading-tight text-white text-[15.5px]">
                        Protocol Interpreter
                      </span>
                      <span className="font-medium tracking-wider whitespace-nowrap leading-normal mt-0.5 text-[11px] text-[#00f0ff] truncate max-w-full">
                        JSON-LD Graph Engine
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0 mt-1">
                    <span
                      style={{
                        borderColor: 'rgba(0, 240, 255, 0.4)',
                        backgroundColor: 'rgba(2, 6, 23, 0.8)',
                        color: '#00f0ff',
                        boxShadow: '0 0 8px rgba(0, 240, 255, 0.3)',
                      }}
                      className="text-[7.5px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wider whitespace-nowrap"
                    >
                      {protocolState.isGraphActive ? '3D RUNTIME' : 'READY'}
                    </span>
                    <ChevronRight className="w-4 h-4 text-[#00f0ff] group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </button>
              </div>

              {/* Feature 06: Timed Automaton Verifier (Pre-Flight Script Verification) */}
              <div
                style={{
                  backgroundColor: 'rgba(10, 20, 30, 0.88)',
                  borderColor: taState.status === 'VERIFIED' ? 'rgba(0, 255, 153, 0.4)' : 'rgba(0, 240, 255, 0.3)',
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.6), 0 0 15px rgba(0, 255, 153, 0.12)',
                }}
                className="mx-2.5 mb-2 rounded-xl border overflow-hidden hover:border-[#00ff99] transition-all duration-200"
              >
                <button
                  id="timed-automaton-verifier"
                  onClick={() => setActiveView('timed_automaton_verifier')}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    width: '100%',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                  className="w-full flex items-start justify-between px-3.5 py-3 text-left transition-all duration-200 cursor-pointer group hover:bg-emerald-500/10"
                >
                  <div className="flex items-start gap-2.5 min-w-0 flex-1 text-left">
                    <div
                      style={{
                        borderColor: 'rgba(0, 255, 153, 0.4)',
                        backgroundColor: 'rgba(0, 255, 153, 0.15)',
                      }}
                      className="p-1.5 rounded-lg border mt-0.5 shrink-0 group-hover:border-[#00ff99] transition-all"
                    >
                      <ShieldCheck className="w-4 h-4 text-[#00ff99]" />
                    </div>
                    <div className="flex flex-col min-w-0 text-left items-start flex-1 mr-2">
                      <span className="font-bold tracking-wide whitespace-nowrap leading-tight text-white text-[15.5px]">
                        Timed Automaton Verifier
                      </span>
                      <span className="font-medium tracking-wider whitespace-nowrap leading-normal mt-0.5 text-[11px] text-[#00ff99] truncate max-w-full">
                        Pre-Flight Script Verification
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0 mt-1">
                    <span
                      style={{
                        borderColor: 'rgba(0, 255, 153, 0.5)',
                        backgroundColor: 'rgba(2, 6, 23, 0.8)',
                        color: '#00ff99',
                        boxShadow: '0 0 8px rgba(0, 255, 153, 0.3)',
                      }}
                      className="text-[7.5px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wider whitespace-nowrap"
                    >
                      VERIFIED
                    </span>
                    <ChevronRight className="w-4 h-4 text-[#00ff99] group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </button>
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
                  padding: '10px 12px',
                  overflow: 'hidden',
                  backgroundColor: 'rgba(8, 16, 26, 0.75)',
                  borderColor: 'rgba(0, 240, 255, 0.25)',
                }}
                className="flex items-center justify-between rounded-xl border box-border shrink-0 font-mono"
              >
                <div className="flex items-center gap-2 min-w-0 mr-2">
                  <span
                    className={`w-2 h-2 rounded-full shrink-0 ${
                      isAutoMode ? 'bg-[#00ff99] shadow-[0_0_8px_#00ff99] animate-pulse' : 'bg-slate-500'
                    }`}
                  />
                  <div className="flex flex-col min-w-0">
                    <span className="text-[11px] font-mono font-bold text-white tracking-[0.05em]">
                      {isAutoMode ? 'AUTO TRACK: ON' : 'MANUAL OVERRIDE'}
                    </span>
                    <span className="text-[10px] font-mono text-[#a0b0c0] tracking-wide truncate">
                      {isAutoMode ? 'Tracking EVA-1 Traversal' : 'Locked to selected zone'}
                    </span>
                  </div>
                </div>
                <button
                  id="btn-convex-auto-mode"
                  onClick={() => boundaryManager.setFocusStation('AUTO')}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold tracking-[0.05em] transition-all shrink-0 cursor-pointer ${
                    isAutoMode
                      ? 'bg-[#00ff99] text-slate-950 shadow-md shadow-[#00ff99]/40'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-[rgba(0,240,255,0.3)]'
                  }`}
                >
                  AUTO
                </button>
              </div>

              {/* FOCUS AREA SELECTORS */}
              <div className="flex flex-col gap-1.5 shrink-0 font-mono">
                <span className="text-[11px] font-mono font-bold text-[#88a0b5] uppercase tracking-[0.05em] px-1">
                  FOCUS AREA SELECTORS
                </span>
                {selectorList.map((item) => {
                  const isSelected = !isAutoMode && activeStationId === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        boundaryManager.setFocusStation(item.id);
                        kinematicSafetyManager.setActiveArea(item.label);
                      }}
                      style={{
                        padding: '10px 12px',
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
                          <span className={`text-[11px] font-mono font-bold tracking-[0.05em] truncate ${isSelected ? 'text-white' : 'text-slate-200 group-hover:text-white'}`}>
                            {item.label}
                          </span>
                          <span className="text-[10px] font-mono text-[#a0b0c0] tracking-wide truncate">
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
                        className="text-[10px] font-mono font-bold uppercase tracking-[0.05em] shrink-0 px-1.5 py-0.5 rounded border"
                      >
                        {item.type === 'HAZARD' ? 'HAZARD' : item.type === 'MAINTENANCE' ? 'DATA' : 'FOCUS'}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* ─────────────────────────────────────────────────────── */}
              {/* KINEMATIC MONITOR SUB-PANEL (appears when area selected) */}
              {/* ─────────────────────────────────────────────────────── */}
              {safetyState.activeArea && (
                <div
                  style={{
                    backgroundColor: safetyState.isDeviating
                      ? 'rgba(40, 8, 8, 0.88)'
                      : 'rgba(8, 16, 26, 0.88)',
                    borderColor: safetyState.isDeviating
                      ? 'rgba(255, 34, 0, 0.7)'
                      : safetyState.throttlingEnabled
                      ? 'rgba(0, 255, 153, 0.45)'
                      : 'rgba(0, 240, 255, 0.25)',
                    boxShadow: safetyState.isDeviating
                      ? '0 0 18px rgba(255, 34, 0, 0.35)'
                      : safetyState.throttlingEnabled
                      ? '0 0 14px rgba(0, 255, 153, 0.2)'
                      : 'none',
                    transition: 'all 0.3s ease',
                    padding: '8px 10px',
                    overflow: 'hidden',
                  }}
                  className="rounded-xl border flex flex-col gap-2 shrink-0 font-mono overflow-hidden"
                >
                  {/* Sub-Panel Header */}
                  <div className="flex items-center justify-between border-b border-white/10 pb-1.5">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <Shield
                        className={`w-3.5 h-3.5 shrink-0 ${
                          safetyState.isDeviating
                            ? 'text-red-400'
                            : safetyState.throttlingEnabled
                            ? 'text-[#00ff99]'
                            : 'text-cyan-400'
                        }`}
                      />
                      <span
                        className="text-[11px] font-mono font-bold tracking-[0.05em] uppercase truncate"
                        style={{
                          color: safetyState.isDeviating
                            ? '#ff4444'
                            : safetyState.throttlingEnabled
                            ? '#00ff99'
                            : '#88a0b5',
                        }}
                      >
                        KINEMATIC MONITOR
                      </span>
                    </div>
                    {safetyState.isDeviating ? (
                      <span className="text-[10px] font-mono font-bold text-red-400 border border-red-500/60 bg-red-950/60 px-1.5 py-0.5 rounded animate-pulse tracking-[0.05em] shrink-0 whitespace-nowrap">
                        DEVIATION
                      </span>
                    ) : safetyState.throttlingEnabled ? (
                      <span className="text-[10px] font-mono font-bold text-[#00ff99] border border-[#00ff99]/40 bg-emerald-950/60 px-1.5 py-0.5 rounded tracking-[0.05em] shrink-0 whitespace-nowrap">
                        ACTIVE
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono text-[#a0b0c0] border border-slate-700/50 bg-slate-900/50 px-1.5 py-0.5 rounded shrink-0 whitespace-nowrap">
                        STANDBY
                      </span>
                    )}
                  </div>

                  {/* Telemetry Rows */}
                  <div className="flex flex-col gap-1.5 text-[10px] font-mono leading-[1.25]">
                    {/* Active Target */}
                    <div className="flex justify-between items-center gap-1 min-w-0">
                      <span className="text-[#a0b0c0] font-normal shrink-0">ACTIVE TARGET:</span>
                      <span className="text-cyan-200 font-semibold truncate text-right text-[11px]">
                        {safetyState.activeArea}
                      </span>
                    </div>
                    {/* Max Allowed Delta */}
                    <div className="flex justify-between items-center gap-1">
                      <span className="text-[#a0b0c0] font-normal shrink-0">MAX ALLOWED Δ:</span>
                      <span className="text-amber-300 font-semibold text-[11px] shrink-0">
                        {safetyState.maxAllowed.toFixed(2)} m/s
                      </span>
                    </div>
                    {/* Live Hand Delta */}
                    <div className="flex justify-between items-center gap-1">
                      <span className="text-[#a0b0c0] font-normal shrink-0">LIVE HAND Δ:</span>
                      <span
                        className="font-semibold text-[11px] transition-colors duration-200 shrink-0"
                        style={{
                          color: safetyState.isDeviating
                            ? '#ff4444'
                            : safetyState.throttlingEnabled && safetyState.liveDelta > safetyState.maxAllowed * 0.8
                            ? '#ffaa00'
                            : '#00ff99',
                        }}
                      >
                        {safetyState.liveDelta.toFixed(2)} m/s
                      </span>
                    </div>

                    {/* END-EFFECTOR KINEMATICS BREAKDOWN */}
                    <div className="flex flex-col gap-1 pt-1.5 border-t border-white/10 text-[10px] font-mono">
                      <div className="flex items-center gap-1 text-[8.5px] text-[#88a0b5] uppercase tracking-widest font-semibold pb-0.5 whitespace-nowrap">
                        <Activity className="w-2.5 h-2.5 text-cyan-400 shrink-0" />
                        <span className="truncate">END-EFFECTOR KINEMATICS</span>
                      </div>

                      {/* HAND MOTION Δ */}
                      <div className="flex justify-between items-center gap-1 min-w-0">
                        <span className="text-[#a0b0c0] font-normal shrink-0">HAND MOTION Δ:</span>
                        <div className="flex items-center gap-1 shrink-0">
                          <span className="text-[#00ff99] font-semibold text-[10.5px]">
                            {safetyState.handMotionDelta.toFixed(2)} m/s
                          </span>
                          <span className="text-[7.5px] text-cyan-400/90 font-mono font-bold px-1 py-0.2 rounded bg-cyan-950/60 border border-cyan-500/30 whitespace-nowrap shrink-0">
                            [TRANSLATING]
                          </span>
                        </div>
                      </div>

                      {/* PALM / WRIST Δ */}
                      <div className="flex justify-between items-center gap-1 min-w-0">
                        <span className={safetyState.isDeviating && safetyState.deviatingLayer === 'PALM_WRIST' ? 'text-amber-400 font-bold animate-pulse shrink-0' : 'text-[#a0b0c0] font-normal shrink-0'}>
                          PALM / WRIST Δ:
                          {safetyState.isDeviating && safetyState.deviatingLayer === 'PALM_WRIST' && (
                            <AlertTriangle className="inline w-2.5 h-2.5 ml-0.5 text-amber-400" />
                          )}
                        </span>
                        <div className="flex items-center gap-1 shrink-0">
                          <span className={safetyState.isDeviating && safetyState.deviatingLayer === 'PALM_WRIST' ? 'text-amber-300 font-bold text-[10.5px]' : 'text-[#00ff99] font-semibold text-[10.5px]'}>
                            {safetyState.palmWristDelta.toFixed(2)} m/s
                          </span>
                          <span className={`text-[7.5px] font-mono font-bold px-1 py-0.2 rounded border whitespace-nowrap shrink-0 ${
                            safetyState.isDeviating && safetyState.deviatingLayer === 'PALM_WRIST'
                              ? 'text-amber-300 bg-amber-950/70 border-amber-500/50'
                              : 'text-cyan-400/90 bg-cyan-950/60 border-cyan-500/30'
                          }`}>
                            [{safetyState.isDeviating && safetyState.deviatingLayer === 'PALM_WRIST' ? 'EXCEEDED' : 'STABILIZED'}]
                          </span>
                        </div>
                      </div>

                      {/* FINGER JITTER Δ */}
                      <div className="flex justify-between items-center gap-1 min-w-0">
                        <span className={safetyState.isDeviating && (safetyState.deviatingLayer === 'FINGER_JITTER' || !safetyState.deviatingLayer) ? 'text-red-400 font-bold animate-pulse shrink-0' : 'text-[#a0b0c0] font-normal shrink-0'}>
                          FINGER JITTER Δ:
                          {safetyState.isDeviating && (safetyState.deviatingLayer === 'FINGER_JITTER' || !safetyState.deviatingLayer) && (
                            <AlertTriangle className="inline w-2.5 h-2.5 ml-0.5 text-red-400" />
                          )}
                        </span>
                        <div className="flex items-center gap-1 shrink-0">
                          <span className={safetyState.isDeviating && (safetyState.deviatingLayer === 'FINGER_JITTER' || !safetyState.deviatingLayer) ? 'text-red-300 font-bold text-[10.5px]' : 'text-[#00ff99] font-semibold text-[10.5px]'}>
                            {safetyState.fingerJitterDelta.toFixed(2)} m/s
                          </span>
                          <span className={`text-[7.5px] font-mono font-bold px-1 py-0.2 rounded border whitespace-nowrap shrink-0 ${
                            safetyState.isDeviating && (safetyState.deviatingLayer === 'FINGER_JITTER' || !safetyState.deviatingLayer)
                              ? 'text-red-300 bg-red-950/70 border-red-500/60 animate-pulse'
                              : 'text-cyan-400/90 bg-cyan-950/60 border-cyan-500/30'
                          }`}>
                            [{safetyState.isDeviating ? 'SPIKE' : 'CALIBRATED'}]
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Threshold Bar */}
                    <div className="flex flex-col gap-0.5 pt-0.5">
                      <div className="w-full h-1.5 bg-slate-800/80 rounded-full overflow-hidden border border-white/10">
                        <div
                          style={{
                            width: `${Math.min(100, (safetyState.liveDelta / (safetyState.maxAllowed * 1.4)) * 100).toFixed(1)}%`,
                            backgroundColor: safetyState.isDeviating
                              ? '#ff2200'
                              : safetyState.liveDelta > safetyState.maxAllowed * 0.8
                              ? '#ffaa00'
                              : '#00ff99',
                            transition: 'all 0.2s ease',
                            boxShadow: safetyState.isDeviating ? '0 0 6px #ff2200' : 'none',
                          }}
                          className="h-full rounded-full"
                        />
                      </div>
                      <div className="flex justify-between text-[10px] font-mono text-[#a0b0c0]">
                        <span>0.00</span>
                        <span className="text-amber-500/80">LIMIT: {safetyState.maxAllowed.toFixed(2)}</span>
                        <span>{(safetyState.maxAllowed * 1.4).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Dexterity Throttling Toggle */}
                  <div className="flex items-center justify-between pt-1.5 border-t border-white/10">
                    <div className="flex items-center gap-1.5">
                      {safetyState.throttlingEnabled ? (
                        <Lock className="w-3.5 h-3.5 text-[#00ff99] shrink-0" />
                      ) : (
                        <Unlock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      )}
                      <span className="text-[10px] font-mono text-[#a0b0c0] font-normal tracking-wide">
                        DEXTERITY THROTTLING
                      </span>
                    </div>
                    <button
                      id="btn-toggle-dexterity-throttling"
                      onClick={() => kinematicSafetyManager.setThrottling(!safetyState.throttlingEnabled)}
                      style={{
                        backgroundColor: safetyState.throttlingEnabled
                          ? 'rgba(0, 255, 153, 0.18)'
                          : 'rgba(30, 42, 56, 0.9)',
                        borderColor: safetyState.throttlingEnabled
                          ? 'rgba(0, 255, 153, 0.6)'
                          : 'rgba(0, 240, 255, 0.25)',
                        color: safetyState.throttlingEnabled ? '#00ff99' : '#a0b0c0',
                        boxShadow: safetyState.throttlingEnabled
                          ? '0 0 10px rgba(0, 255, 153, 0.3)'
                          : 'none',
                        transition: 'all 0.2s ease',
                      }}
                      className="px-2.5 py-1 rounded-lg border text-[10px] font-mono font-bold tracking-[0.05em] cursor-pointer uppercase"
                    >
                      {safetyState.throttlingEnabled ? 'ENABLED' : 'ENABLE'}
                    </button>
                  </div>

                  {/* Quick Simulation Trigger Button */}
                  <button
                    id="btn-simulate-jitter-spike"
                    onClick={() => {
                      if (!safetyState.throttlingEnabled) {
                        kinematicSafetyManager.setThrottling(true);
                      }
                      kinematicSafetyManager.triggerJitterSpike(3500);
                    }}
                    className="w-full mt-1 px-2 py-1 rounded-lg border border-amber-500/40 bg-amber-950/40 hover:bg-amber-900/60 text-amber-300 text-[10px] font-mono font-bold tracking-[0.05em] transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Zap className="w-3 h-3 text-amber-400" />
                    <span>SIMULATE DEXTERITY SPIKE (0.42 m/s)</span>
                  </button>
                </div>
              )}

              {/* ACTIVE ZONE TELEMETRY */}
              <div
                style={{
                  padding: '10px 12px',
                  overflow: 'hidden',
                  backgroundColor: 'rgba(8, 16, 26, 0.75)',
                  borderColor: 'rgba(0, 240, 255, 0.25)',
                }}
                className="rounded-xl border flex flex-col gap-1.5 box-border shrink-0 font-mono"
              >
                <div className="flex items-center justify-between border-b border-[rgba(0,240,255,0.15)] pb-1.5">
                  <span className="text-[11px] font-mono font-bold text-[#88a0b5] uppercase tracking-[0.05em]">
                    ACTIVE ZONE TELEMETRY
                  </span>
                  <span
                    style={{
                      color: activeZone.color,
                      borderColor: `${activeZone.color}50`,
                      backgroundColor: `${activeZone.color}15`,
                    }}
                    className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border uppercase tracking-[0.05em]"
                  >
                    {activeZone.zoneType}
                  </span>
                </div>
                <div className="flex flex-col gap-1 text-[10px] font-mono">
                  {[
                    { label: 'HULL NAME',    value: activeZone.hullName,   cls: 'text-white font-semibold' },
                    { label: 'BOUNDING DIM', value: `${activeZone.size[0]}m × ${activeZone.size[1]}m × ${activeZone.size[2]}m`, cls: 'text-cyan-200 font-semibold' },
                    { label: 'CENTER COORD', value: `[${activeZone.center.join(', ')}]`, cls: 'text-slate-200 font-semibold' },
                  ].map(({ label, value, cls }) => (
                    <div key={label} className="flex justify-between items-center gap-2">
                      <span className="text-[#a0b0c0] font-normal shrink-0">{label}:</span>
                      <span className={`truncate text-right text-[11px] ${cls}`}>{value}</span>
                    </div>
                  ))}
                  <div className="flex justify-between items-center">
                    <span className="text-[#a0b0c0] font-normal">COLOR CODE:</span>
                    <span style={{ color: activeZone.color }} className="font-semibold text-[11px]">
                      {activeZone.color}
                    </span>
                  </div>
                </div>
              </div>

              {/* WIREFRAME TOGGLE */}
              <div
                style={{
                  padding: '10px 12px',
                  overflow: 'hidden',
                  backgroundColor: 'rgba(8, 16, 26, 0.75)',
                  borderColor: 'rgba(0, 240, 255, 0.25)',
                }}
                className="flex items-center justify-between rounded-xl border box-border shrink-0 mb-2 font-mono"
              >
                <div className="flex items-center gap-2 text-[11px] font-mono font-bold text-white tracking-[0.05em]">
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
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold tracking-[0.05em] transition-all cursor-pointer ${
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
        {/* VIEW 3: DEDICATED CBD DIAGNOSTIC CONTROLS VIEW                    */}
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
                className="rounded-xl border flex flex-col gap-2 shrink-0 transition-all duration-300 font-mono"
              >
                <div className="flex items-center justify-between">
                  <span
                    className="text-[11px] font-mono font-bold text-white tracking-[0.05em] flex items-center gap-1.5 uppercase"
                  >
                    <Cpu className="w-3.5 h-3.5 text-[#00f0ff]" />
                    REITER&apos;S DIAGNOSTIC ENGINE
                  </span>
                </div>

                {/* Structured 2-column key-value rows */}
                <div className="flex flex-col gap-1.5 bg-slate-950/60 p-2.5 rounded-lg border border-cyan-500/15 font-mono">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-[#a0b0c0] font-normal tracking-wider uppercase">ALGORITHM:</span>
                    <span className="text-white font-semibold text-[11px]">Reiter&apos;s CBD</span>
                  </div>
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-[#a0b0c0] font-normal tracking-wider uppercase">ACTIVE NODES:</span>
                    <span className="text-white font-semibold text-[11px]">4 Multi-Cam Heads</span>
                  </div>
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-[#a0b0c0] font-normal tracking-wider uppercase">STATUS:</span>
                    <span
                      style={{
                        color:
                          diagState.status === 'COMPLETED'
                            ? '#00ff99'
                            : diagState.status === 'SCANNING'
                            ? '#00f0ff'
                            : '#00ff99',
                      }}
                      className="font-semibold text-[11px] uppercase tracking-wider"
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
                  }}
                  className="px-2.5 py-1.5 rounded-lg border font-mono font-bold text-[10px] tracking-[0.05em] flex items-center justify-between transition-all"
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

              {/* MODULE 1: Spectral Glare & Ambient Adaptation */}
              <div
                style={{
                  padding: '10px 12px',
                  backgroundColor: 'rgba(8, 16, 26, 0.75)',
                  borderColor: diagState.isGlareActive ? 'rgba(255, 170, 0, 0.5)' : 'rgba(0, 240, 255, 0.25)',
                  boxShadow: diagState.isGlareActive ? '0 0 16px rgba(255, 170, 0, 0.15)' : 'none',
                }}
                className="rounded-xl border flex flex-col gap-2 shrink-0 font-mono transition-all duration-300"
              >
                <div className="flex flex-col text-left">
                  <div className="flex items-center justify-between">
                    <span
                      className="text-[11px] font-mono font-bold text-white tracking-[0.05em] uppercase"
                    >
                      MODULE 1 // SPECTRAL GLARE ADAPTATION
                    </span>
                    <span
                      style={{
                        backgroundColor: diagState.spectralAdapted && diagState.scanType === 'GLARE_ADAPTATION'
                          ? 'rgba(0, 240, 255, 0.15)'
                          : diagState.isGlareActive
                          ? 'rgba(255, 170, 0, 0.15)'
                          : 'rgba(15, 23, 42, 0.6)',
                        borderColor: diagState.spectralAdapted && diagState.scanType === 'GLARE_ADAPTATION'
                          ? 'rgba(0, 240, 255, 0.5)'
                          : diagState.isGlareActive
                          ? 'rgba(255, 170, 0, 0.5)'
                          : 'rgba(51, 65, 85, 0.5)',
                        color: diagState.spectralAdapted && diagState.scanType === 'GLARE_ADAPTATION'
                          ? '#00f0ff'
                          : diagState.isGlareActive
                          ? '#ffaa00'
                          : '#88a0b5',
                      }}
                      className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border uppercase tracking-[0.05em]"
                    >
                      {diagState.status === 'COMPLETED' && diagState.scanType === 'GLARE_ADAPTATION'
                        ? 'CAM_02 GLARE REPAIRED'
                        : diagState.isGlareActive
                        ? 'GLARE SPIKE'
                        : 'FILTER READY'}
                    </span>
                  </div>
                  <span
                    className="text-[10px] font-mono text-[#a0b0c0] tracking-wide mt-0.5"
                  >
                    Sensor oversaturation test &amp; adaptive filter recovery
                  </span>
                </div>

                {/* Telemetry Indicator Row */}
                <div className="flex items-center justify-between px-2 py-1 rounded bg-slate-950/70 border border-cyan-500/15 text-[10px] font-mono">
                  <span className="text-[#a0b0c0] font-normal">OUTPUT ERROR:</span>
                  <span
                    style={{
                      color: diagState.isGlareActive && !diagState.spectralAdapted ? '#ffaa00' : '#00ff99',
                    }}
                    className="font-semibold text-[11px]"
                  >
                    {diagState.isGlareActive && !diagState.spectralAdapted ? `${diagState.errorRatePct}% (DISTORTION)` : '< 4.8% (NOMINAL)'}
                  </span>
                </div>

                {/* Action Buttons: [SIMULATE GLARE SPIKE] -> [ADAPT SPECTRAL FILTERS] */}
                <div className="flex flex-col gap-1.5">
                  {!diagState.isGlareActive && !(diagState.status === 'COMPLETED' && diagState.scanType === 'GLARE_ADAPTATION') ? (
                    <button
                      id="btn-trigger-glare-spike"
                      disabled={diagState.status === 'SCANNING'}
                      onClick={() => cbdDiagnosticManager.triggerGlareEvent('cam_02')}
                      style={{
                        backgroundColor: 'rgba(255, 100, 0, 0.12)',
                        borderColor: 'rgba(255, 140, 0, 0.4)',
                      }}
                      className={`w-full py-2 px-2.5 rounded-lg border font-mono font-bold text-[10px] tracking-[0.05em] flex items-center justify-center gap-1.5 transition-all cursor-pointer hover:border-amber-400 hover:bg-amber-500/25 text-amber-300 ${
                        diagState.status === 'SCANNING' ? 'opacity-70 cursor-not-allowed' : ''
                      }`}
                    >
                      <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span>SIMULATE GLARE SPIKE</span>
                    </button>
                  ) : (
                    <button
                      id="btn-adapt-spectral-filters"
                      disabled={diagState.status === 'SCANNING'}
                      onClick={() => cbdDiagnosticManager.startScan('GLARE_ADAPTATION')}
                      style={{
                        backgroundColor:
                          diagState.status === 'SCANNING' && diagState.scanType === 'GLARE_ADAPTATION'
                            ? 'rgba(0, 240, 255, 0.15)'
                            : 'rgba(0, 240, 255, 0.10)',
                        borderColor: 'rgba(0, 240, 255, 0.45)',
                      }}
                      className={`w-full py-2 px-2.5 rounded-lg border font-mono font-bold text-[10px] tracking-[0.05em] flex items-center justify-center gap-1.5 transition-all cursor-pointer hover:border-[#00f0ff] hover:bg-cyan-500/20 text-[#00f0ff] ${
                        diagState.status === 'SCANNING' ? 'opacity-70 cursor-not-allowed' : ''
                      }`}
                    >
                      {diagState.status === 'SCANNING' && diagState.scanType === 'GLARE_ADAPTATION' ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-[#00f0ff]" />
                          <span>ADAPTING SPECTRAL FILTERS...</span>
                        </>
                      ) : diagState.status === 'COMPLETED' && diagState.scanType === 'GLARE_ADAPTATION' ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#00ff99]" />
                          <span className="text-[#00ff99]">[CAM_02 GLARE REPAIRED]</span>
                        </>
                      ) : (
                        <>
                          <ShieldCheck className="w-3.5 h-3.5 text-[#00f0ff]" />
                          <span>ADAPT SPECTRAL FILTERS</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>

              {/* MODULE 2: Camera Pipeline Consistency Check */}
              <div
                style={{
                  padding: '10px 12px',
                  backgroundColor: 'rgba(8, 16, 26, 0.75)',
                  borderColor: 'rgba(0, 240, 255, 0.25)',
                }}
                className="rounded-xl border flex flex-col gap-2 shrink-0 font-mono"
              >
                <div className="flex flex-col text-left">
                  <div className="flex items-center justify-between">
                    <span
                      className="text-[11px] font-mono font-bold text-white tracking-[0.05em] uppercase"
                    >
                      MODULE 2 // CAMERA PIPELINE CHECK
                    </span>
                    <span
                      style={{
                        backgroundColor: diagState.status === 'COMPLETED' && diagState.scanType === 'CAMERA_PIPELINE' ? 'rgba(0, 255, 153, 0.15)' : 'rgba(15, 23, 42, 0.6)',
                        borderColor: diagState.status === 'COMPLETED' && diagState.scanType === 'CAMERA_PIPELINE' ? 'rgba(0, 255, 153, 0.4)' : 'rgba(51, 65, 85, 0.5)',
                        color: diagState.status === 'COMPLETED' && diagState.scanType === 'CAMERA_PIPELINE' ? '#00ff99' : '#88a0b5',
                      }}
                      className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border uppercase tracking-[0.05em]"
                    >
                      {diagState.status === 'COMPLETED' && diagState.scanType === 'CAMERA_PIPELINE' ? '4 NODES SYNCED' : 'READY'}
                    </span>
                  </div>
                  <span
                    className="text-[10px] font-mono text-[#a0b0c0] tracking-wide mt-0.5"
                  >
                    Reiter&apos;s CBD consistency verification (CAM_01 to CAM_04)
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
                        : 'rgba(0, 240, 255, 0.08)',
                    borderColor: 'rgba(0, 240, 255, 0.4)',
                  }}
                  className={`w-full py-2 px-2.5 rounded-lg border font-mono font-bold text-[10px] tracking-[0.05em] flex items-center justify-center gap-1.5 transition-all cursor-pointer hover:border-[#00f0ff] hover:bg-cyan-500/20 text-[#00f0ff] ${
                    diagState.status === 'SCANNING' ? 'opacity-70 cursor-not-allowed' : ''
                  }`}
                >
                  {diagState.status === 'SCANNING' && diagState.scanType === 'CAMERA_PIPELINE' ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-[#00f0ff]" />
                      <span>VERIFYING CAMERA NODES...</span>
                    </>
                  ) : diagState.status === 'COMPLETED' && diagState.scanType === 'CAMERA_PIPELINE' ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#00ff99]" />
                      <span className="text-[#00ff99]">[DONE // ALL 4 NODES NOMINAL]</span>
                    </>
                  ) : (
                    <>
                      <Eye className="w-3.5 h-3.5 text-[#00f0ff]" />
                      <span>RUN CAMERA PIPELINE CHECK</span>
                    </>
                  )}
                </button>
              </div>

              {/* MODULE 3: AI Core & Neural Module Sweep */}
              <div
                style={{
                  padding: '10px 12px',
                  backgroundColor: 'rgba(8, 16, 26, 0.75)',
                  borderColor: 'rgba(0, 240, 255, 0.25)',
                }}
                className="rounded-xl border flex flex-col gap-2 shrink-0 font-mono"
              >
                <div className="flex flex-col text-left">
                  <div className="flex items-center justify-between">
                    <span
                      className="text-[11px] font-mono font-bold text-white tracking-[0.05em] uppercase"
                    >
                      MODULE 3 // AI CORE MODULE SWEEP
                    </span>
                    <span
                      style={{
                        backgroundColor: diagState.status === 'COMPLETED' && diagState.scanType === 'EDGE_AI_MODULES' ? 'rgba(0, 255, 153, 0.15)' : 'rgba(15, 23, 42, 0.6)',
                        borderColor: diagState.status === 'COMPLETED' && diagState.scanType === 'EDGE_AI_MODULES' ? 'rgba(0, 255, 153, 0.4)' : 'rgba(51, 65, 85, 0.5)',
                        color: diagState.status === 'COMPLETED' && diagState.scanType === 'EDGE_AI_MODULES' ? '#00ff99' : '#88a0b5',
                      }}
                      className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border uppercase tracking-[0.05em]"
                    >
                      {diagState.status === 'COMPLETED' && diagState.scanType === 'EDGE_AI_MODULES' ? 'AI OPTIMAL' : 'READY'}
                    </span>
                  </div>
                  <span
                    className="text-[10px] font-mono text-[#a0b0c0] tracking-wide mt-0.5"
                  >
                    Scan NPU neural vision heads, context memory, &amp; edge LLM
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
                  }}
                  className={`w-full py-2 px-2.5 rounded-lg border font-mono font-bold text-[10px] tracking-[0.05em] flex items-center justify-center gap-1.5 transition-all cursor-pointer hover:border-[#00f0ff] hover:bg-cyan-500/20 text-[#00f0ff] ${
                    diagState.status === 'SCANNING' ? 'opacity-70 cursor-not-allowed' : ''
                  }`}
                >
                  {diagState.status === 'SCANNING' && diagState.scanType === 'EDGE_AI_MODULES' ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-[#00f0ff]" />
                      <span>SWEEPING AI MODULES...</span>
                    </>
                  ) : diagState.status === 'COMPLETED' && diagState.scanType === 'EDGE_AI_MODULES' ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#00ff99]" />
                      <span className="text-[#00ff99]">[DONE // AI CORE OPTIMAL]</span>
                    </>
                  ) : (
                    <>
                      <Cpu className="w-3.5 h-3.5 text-[#00f0ff]" />
                      <span>SCAN AI NEURAL MODULES</span>
                    </>
                  )}
                </button>
              </div>

              {/* Clean Module Diagnostic Summary (Visible when Completed) */}
              {diagState.status === 'COMPLETED' && (
                <div
                  style={{
                    padding: '9px 11px',
                    backgroundColor: 'rgba(5, 20, 15, 0.85)',
                    borderColor: 'rgba(0, 255, 153, 0.4)',
                  }}
                  className="rounded-xl border flex flex-col gap-1.5 shrink-0 animate-fade-in font-mono"
                >
                  <span
                    style={{ fontSize: '11px' }}
                    className="font-bold text-[#00ff99] tracking-wider uppercase flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#00ff99]" />
                    {diagState.scanType === 'GLARE_ADAPTATION'
                      ? 'SPECTRAL ADAPTATION REPORT'
                      : diagState.scanType === 'CAMERA_PIPELINE'
                      ? 'CAMERA PIPELINE REPORT'
                      : 'AI CORE VERIFICATION REPORT'}
                  </span>
                  <div
                    style={{ fontSize: '9.5px' }}
                    className="flex flex-col gap-1 text-slate-300"
                  >
                    {diagState.scanType === 'GLARE_ADAPTATION' ? (
                      <>
                        <div><span className="text-[#88a0b5] font-semibold">ISOLATED NODE:</span> CAM_02 (Visual Oversaturation)</div>
                        <div><span className="text-[#88a0b5] font-semibold">DIAGNOSIS:</span> Reiter&apos;s Minimal Hitting Set</div>
                        <div><span className="text-[#88a0b5] font-semibold">FILTER:</span> Adaptive Spectral Temperature Scaling</div>
                        <div><span className="text-[#88a0b5] font-semibold">OUTPUT ERROR:</span> &lt; 4.8% (Nominal)</div>
                        <div className="mt-0.5 flex items-center gap-1.5 text-cyan-300 font-bold">
                          <ShieldCheck className="w-3 h-3 text-[#00f0ff]" />
                          <span>[CAM_02: SPECTRAL ADAPTED &amp; REPAIRED]</span>
                        </div>
                      </>
                    ) : diagState.scanType === 'CAMERA_PIPELINE' ? (
                      <>
                        <div><span className="text-[#88a0b5] font-semibold">NODES VERIFIED:</span> 4 Multi-Cam Heads (CAM_01 to CAM_04)</div>
                        <div><span className="text-[#88a0b5] font-semibold">CBD CHECK:</span> Consistency Model-Based Verification</div>
                        <div><span className="text-[#88a0b5] font-semibold">STREAM STATUS:</span> All 4 Camera Streams Synchronized</div>
                        <div><span className="text-[#88a0b5] font-semibold">PIPELINE ERROR:</span> &lt; 1.2% (Nominal)</div>
                      </>
                    ) : (
                      <>
                        <div><span className="text-[#88a0b5] font-semibold">SUBSYSTEM:</span> NPU &amp; Local LLM Engine</div>
                        <div><span className="text-[#88a0b5] font-semibold">INFERENCE:</span> Latency: 8ms // Jitter: 0.2ms</div>
                        <div><span className="text-[#88a0b5] font-semibold">STATUS:</span> Neural Vision Heads Synchronized (98.2%)</div>
                      </>
                    )}
                  </div>
                  <button
                    id="btn-reset-cbd-diagnostic"
                    onClick={() => cbdDiagnosticManager.reset()}
                    style={{ fontSize: '9.5px' }}
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

        {/* ================================================================= */}
        {/* VIEW 4: DEDICATED DIGITAL TWIN REPLAY VIEW                        */}
        {/* ================================================================= */}
        {activeView === 'digital_twin_replay' && (
          <>
            {/* Top Navigation Bar with Back Button */}
            <div className="flex items-center justify-between px-3 py-2.5 border-b border-[rgba(0,240,255,0.3)] bg-slate-950/80 shrink-0">
              <button
                id="btn-back-from-replay-to-controls"
                onClick={() => {
                  setActiveView('main');
                  digitalTwinReplayManager.setActive(false);
                }}
                className="flex items-center gap-1.5 text-xs font-mono font-bold text-cyan-300 hover:text-white transition-all cursor-pointer group"
              >
                <ChevronLeft className="w-4 h-4 text-[#00f0ff] group-hover:-translate-x-0.5 transition-transform" />
                <span className="tracking-wider uppercase">BACK TO MISSION CONTROLS</span>
              </button>
              <button
                id="btn-close-replay-drawer"
                onClick={() => onToggle(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 border border-transparent hover:border-[rgba(0,240,255,0.3)] transition-all cursor-pointer"
              >
                <PanelLeftClose className="w-4 h-4 text-cyan-400" />
              </button>
            </div>

            {/* Sub-Header: Digital Twin Replay Title */}
            <div className="px-3.5 py-2.5 border-b border-[rgba(0,240,255,0.15)] bg-cyan-950/30 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg border border-emerald-500/35 bg-emerald-500/15 shrink-0">
                  <Film className="w-4 h-4 text-[#00ff99]" />
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-[14px] font-bold text-white tracking-wide leading-tight">
                    Digital Twin Replay
                  </span>
                  <span className="text-[10px] font-semibold text-[#00ff99] tracking-wider leading-snug">
                    Deterministic Telemetry Scrubber
                  </span>
                </div>
              </div>
              <span
                style={{
                  borderColor: 'rgba(0, 255, 153, 0.4)',
                  backgroundColor: 'rgba(2, 6, 23, 0.8)',
                  color: '#00ff99',
                  boxShadow: '0 0 8px rgba(0, 255, 153, 0.3)',
                }}
                className="text-[7.5px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wider shrink-0 flex items-center gap-1"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[#00ff99] animate-pulse" />
                ACTIVE
              </span>
            </div>

            {/* Dedicated Scrollable Sub-View Content */}
            <div
              style={{
                maxHeight: 'calc(100vh - 120px)',
                overflowY: 'auto',
                scrollbarWidth: 'thin',
              }}
              className="p-2.5 pb-10 flex flex-col gap-2.5 font-mono text-left"
            >
              {/* Card 1: Downlink Bandwidth Specification (<10 KB/min) */}
              <div
                style={{
                  backgroundColor: 'rgba(8, 16, 26, 0.75)',
                  borderColor: 'rgba(0, 255, 153, 0.25)',
                  padding: '10px 12px',
                }}
                className="rounded-xl border flex flex-col gap-2 shadow-sm font-mono"
              >
                <div className="flex items-center justify-between border-b border-emerald-500/20 pb-1.5">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <Send className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span className="text-[11px] font-mono font-bold text-[#88a0b5] uppercase tracking-[0.05em] truncate">
                      DOWNLINK SPECIFICATION
                    </span>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-[#00ff99] border border-[#00ff99]/40 bg-emerald-950/60 px-1.5 py-0.5 rounded tracking-[0.05em] shrink-0 whitespace-nowrap">
                    &lt;10 KB/MIN
                  </span>
                </div>

                <div className="flex flex-col gap-1.5 text-[10px] font-mono leading-[1.25]">
                  <div className="flex justify-between items-center gap-1 min-w-0">
                    <span className="text-[#a0b0c0] font-normal shrink-0">BANDWIDTH BUDGET:</span>
                    <span className="text-emerald-300 font-semibold truncate text-right text-[11px]">&lt; 10 KB / min</span>
                  </div>
                  <div className="flex justify-between items-center gap-1 min-w-0">
                    <span className="text-[#a0b0c0] font-normal shrink-0">NOMINAL PAYLOAD:</span>
                    <span className="text-cyan-200 font-semibold truncate text-right text-[11px]">8.4 KB / packet</span>
                  </div>
                  <div className="flex justify-between items-center gap-1 min-w-0">
                    <span className="text-[#a0b0c0] font-normal shrink-0">COMPRESSION:</span>
                    <span className="text-slate-200 font-mono text-[10.5px] font-semibold">DELTA-SE(3)</span>
                  </div>
                  <div className="flex justify-between items-center gap-1 min-w-0">
                    <span className="text-[#a0b0c0] font-normal shrink-0">INTEGRITY SIGN:</span>
                    <span className="text-[#00ff99] font-mono text-[10.5px] font-semibold">Ed25519 CHAIN</span>
                  </div>
                </div>
              </div>

              {/* Card 2: Deterministic Telemetry Keyframe Data */}
              <div
                style={{
                  backgroundColor: 'rgba(8, 16, 26, 0.75)',
                  borderColor: 'rgba(0, 240, 255, 0.25)',
                  padding: '10px 12px',
                }}
                className="rounded-xl border flex flex-col gap-2 shadow-sm font-mono"
              >
                <div className="flex items-center justify-between border-b border-white/10 pb-1.5">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <Clock className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    <span className="text-[11px] font-mono font-bold text-[#88a0b5] uppercase tracking-[0.05em] truncate">
                      LIVE SCRUBBER TELEMETRY
                    </span>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-cyan-300 border border-cyan-500/40 bg-cyan-950/60 px-1.5 py-0.5 rounded tracking-[0.05em] shrink-0 whitespace-nowrap">
                    {Math.floor(replayState.currentTime / 60).toString().padStart(2, '0')}:
                    {(Math.floor(replayState.currentTime % 60)).toString().padStart(2, '0')} / 05:00
                  </span>
                </div>

                <div className="flex flex-col gap-1.5 text-[10px] font-mono leading-[1.25]">
                  <div className="flex justify-between items-center gap-1 min-w-0">
                    <span className="text-[#a0b0c0] font-normal shrink-0">TARGET WORKSTATION:</span>
                    <span className="text-cyan-200 font-semibold truncate text-right text-[11px]">
                      {replayState.currentKeyframe.stationName}
                    </span>
                  </div>
                  <div className="flex justify-between items-center gap-1 min-w-0">
                    <span className="text-[#a0b0c0] font-normal shrink-0">SE(3) COORDINATES:</span>
                    <span className="text-slate-200 font-mono text-[10.5px] font-semibold">
                      [{replayState.currentKeyframe.position.x.toFixed(2)}, {replayState.currentKeyframe.elevationY.toFixed(2)}, {replayState.currentKeyframe.position.z.toFixed(2)}]
                    </span>
                  </div>
                  <div className="flex justify-between items-center gap-1 min-w-0">
                    <span className="text-[#a0b0c0] font-normal shrink-0">YAW ROTATION:</span>
                    <span className="text-slate-200 font-mono text-[10.5px] font-semibold">
                      {((replayState.currentKeyframe.yaw * 180) / Math.PI).toFixed(1)}°
                    </span>
                  </div>

                  {/* END-EFFECTOR KINEMATICS BREAKDOWN (Matches Convex Hull) */}
                  <div className="flex flex-col gap-1 pt-1.5 border-t border-white/10 text-[10px] font-mono">
                    <div className="flex items-center gap-1 text-[8.5px] text-[#88a0b5] uppercase tracking-widest font-semibold pb-0.5 whitespace-nowrap">
                      <Activity className="w-2.5 h-2.5 text-[#00ff99] shrink-0" />
                      <span className="truncate">END-EFFECTOR KINEMATICS</span>
                    </div>

                    {/* HAND MOTION Δ */}
                    <div className="flex justify-between items-center gap-1 min-w-0">
                      <span className="text-[#a0b0c0] font-normal shrink-0">HAND MOTION Δ:</span>
                      <div className="flex items-center gap-1 shrink-0">
                        <span className="text-[#00ff99] font-semibold text-[10.5px]">
                          {replayState.currentKeyframe.jointKinematics.handMotionDelta.toFixed(2)} m/s
                        </span>
                        <span className="text-[7.5px] text-[#00ff99]/90 font-mono font-bold px-1 py-0.2 rounded bg-emerald-950/60 border border-emerald-500/30 whitespace-nowrap shrink-0">
                          [NOMINAL]
                        </span>
                      </div>
                    </div>

                    {/* PALM / WRIST Δ */}
                    <div className="flex justify-between items-center gap-1 min-w-0">
                      <span className="text-[#a0b0c0] font-normal shrink-0">PALM / WRIST Δ:</span>
                      <div className="flex items-center gap-1 shrink-0">
                        <span className="text-[#00ff99] font-semibold text-[10.5px]">
                          {replayState.currentKeyframe.jointKinematics.wristDelta.toFixed(2)} m/s
                        </span>
                        <span className="text-[7.5px] text-[#00ff99]/90 font-mono font-bold px-1 py-0.2 rounded bg-emerald-950/60 border border-emerald-500/30 whitespace-nowrap shrink-0">
                          [STABILIZED]
                        </span>
                      </div>
                    </div>

                    {/* FINGER JITTER Δ */}
                    <div className="flex justify-between items-center gap-1 min-w-0">
                      <span className="text-[#a0b0c0] font-normal shrink-0">FINGER JITTER Δ:</span>
                      <div className="flex items-center gap-1 shrink-0">
                        <span className="text-[#00ff99] font-semibold text-[10.5px]">
                          {replayState.currentKeyframe.jointKinematics.fingerJitterDelta.toFixed(2)} m/s
                        </span>
                        <span className="text-[7.5px] text-[#00ff99]/90 font-mono font-bold px-1 py-0.2 rounded bg-emerald-950/60 border border-emerald-500/30 whitespace-nowrap shrink-0">
                          [CALIBRATED]
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 3: Downlink Packet & Report Generator */}
              <div
                style={{
                  backgroundColor: 'rgba(8, 16, 26, 0.75)',
                  borderColor: 'rgba(0, 255, 153, 0.25)',
                  padding: '10px 12px',
                }}
                className="rounded-xl border flex flex-col gap-2 shadow-sm font-mono"
              >
                <div className="flex items-center gap-1.5 border-b border-emerald-500/20 pb-1.5">
                  <Send className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span className="text-[11px] font-mono font-bold text-[#88a0b5] uppercase tracking-[0.05em] truncate">
                    DOWNLINK REPORT DISPATCH
                  </span>
                </div>

                <p className="text-[10px] font-mono text-[#a0b0c0] leading-snug">
                  Compresses full 5-minute deterministic kinematic keyframes into an Ed25519-signed telemetry payload ready for ultra-low bandwidth Earth downlink (&lt;10 KB/min).
                </p>

                <button
                  id="btn-generate-replay-packet"
                  onClick={() => digitalTwinReplayManager.generateReplayPacketAndReport()}
                  style={{ height: '28px', fontSize: '10px' }}
                  className="w-full mt-1 px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/50 hover:border-emerald-400 text-emerald-200 font-mono font-bold tracking-[0.05em] flex items-center justify-center gap-1.5 transition-all shadow-md shadow-emerald-950/30 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5 text-emerald-400" />
                  <span>[GENERATE REPLAY PACKET &amp; REPORT]</span>
                </button>

                {replayState.isReportGenerated && (
                  <div className="p-2 rounded-lg bg-emerald-950/50 border border-emerald-500/40 flex flex-col gap-1.5 text-[10px] font-mono mt-1">
                    <div className="flex items-center gap-1.5 text-emerald-300 font-bold">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>[PACKET READY // DOWNLINK QUEUED (8.4 KB)]</span>
                    </div>
                    <div className="text-slate-300 font-mono text-[9px]">
                      HASH: <span className="text-cyan-300">{replayState.lastReportPacket?.hashDisplay || '0x4181...46f6'}</span> | Ed25519 SIGNED
                    </div>
                    <div className="text-slate-400 text-[8.5px] italic">
                      Telemetry broadcast dispatched to EDGE AI chat stream.
                    </div>

                    {/* Interactive Download Button directly below badge */}
                    <button
                      id="btn-download-telemetry-report"
                      onClick={handleDownloadTelemetryReport}
                      title="Download Telemetry Report JSON"
                      style={{ height: '30px', fontSize: '9.5px' }}
                      className="w-full mt-1 px-2 py-1 rounded-lg bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-400/60 hover:border-cyan-300 text-cyan-200 hover:text-white font-mono font-bold tracking-[0.02em] flex items-center justify-center gap-1.5 transition-all shadow-md shadow-cyan-950/50 cursor-pointer active:scale-95"
                    >
                      <Download className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      <span>[📥 CLICK TO DOWNLOAD TELEMETRY REPORT (.JSON)]</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* ================================================================= */}
        {/* VIEW 5: DEDICATED RADIATION FAULT TOLERANCE VIEW                  */}
        {/* ================================================================= */}
        {activeView === 'radiation_fault_tolerance' && (
          <>
            {/* Top Navigation Bar with Back Button */}
            <div className="flex items-center justify-between px-3 py-2.5 border-b border-[rgba(0,255,153,0.3)] bg-slate-950/80 shrink-0">
              <button
                id="btn-back-to-mission-controls"
                onClick={() => setActiveView('main')}
                className="flex items-center gap-1.5 text-xs font-mono font-bold text-emerald-300 hover:text-white transition-all cursor-pointer group"
              >
                <ChevronLeft className="w-4 h-4 text-[#00ff99] group-hover:-translate-x-0.5 transition-transform" />
                <span className="tracking-wider uppercase">BACK TO MISSION CONTROLS</span>
              </button>
              <button
                id="btn-close-mission-controls"
                onClick={() => onToggle(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 border border-transparent hover:border-[rgba(0,255,153,0.3)] transition-all cursor-pointer"
              >
                <PanelLeftClose className="w-4 h-4 text-emerald-400" />
              </button>
            </div>

            {/* Sub-Header: Radiation Fault Tolerance Title */}
            <div className="px-3.5 py-2.5 border-b border-[rgba(0,255,153,0.15)] bg-emerald-950/20 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg border border-emerald-500/35 bg-emerald-500/15 shrink-0">
                  <Shield className="w-4 h-4 text-[#00ff99]" />
                </div>
                <div className="flex flex-col text-left">
                  <span
                    style={{ fontSize: '14px', fontWeight: 700, lineHeight: 1.25 }}
                    className="text-white tracking-wide"
                  >
                    Radiation Fault Tolerance
                  </span>
                  <span
                    style={{ fontSize: '10px', opacity: 0.7 }}
                    className="font-mono font-semibold text-[#00ff99] tracking-wider leading-snug"
                  >
                    Memory Bit-Flip Repair
                  </span>
                </div>
              </div>
              <span className="text-[7.5px] font-bold px-1.5 py-0.5 rounded border border-emerald-500/40 bg-slate-950/80 text-[#00ff99] uppercase tracking-wider shrink-0">
                READY
              </span>
            </div>

            {/* Dedicated Controls Section (Custom Scrollbar enabled) */}
            <div
              className="subpanel-content radiation-controls-scroll flex-1 flex flex-col gap-2.5 p-2.5 overflow-y-auto font-mono text-left"
              style={{
                maxHeight: 'calc(100vh - 120px)',
                overflowY: 'auto',
              }}
            >
              {/* Card 1: Telemetry Readouts (Standard uniform monospace UI 10px-11px uppercase) */}
              <div
                style={{
                  backgroundColor: 'rgba(8, 16, 26, 0.75)',
                  borderColor: radState.status === 'ANOMALY_DETECTED' ? 'rgba(255, 0, 85, 0.4)' : 'rgba(0, 255, 153, 0.25)',
                  padding: '8px 10px',
                }}
                className="rounded-xl border flex flex-col shadow-sm font-mono shrink-0"
              >
                <div className="flex items-center gap-1.5 border-b border-emerald-500/20 pb-1 mb-1">
                  <Gauge className="w-3 h-3 text-emerald-400 shrink-0" />
                  <span className="text-[10px] font-mono font-bold text-[#88a0b5] uppercase tracking-[0.05em] truncate">
                    REAL-TIME TELEMETRY READOUTS
                  </span>
                </div>

                <div className="flex flex-col font-mono uppercase">
                  {/* Readout 1 */}
                  <div
                    style={{ padding: '4px 0', margin: '2px 0' }}
                    className="flex justify-between items-center border-b border-slate-800/60 leading-none"
                  >
                    <span className="text-[10px] font-mono text-[#a0b0c0] tracking-[0.05em] uppercase whitespace-nowrap">
                      TRIPLE MEMORY REPLICAS:
                    </span>
                    <span className={`text-[11px] font-bold font-mono tracking-[0.05em] uppercase whitespace-nowrap ${radState.status === 'ANOMALY_DETECTED' ? 'text-[#ff0055] animate-pulse' : 'text-[#00ff99]'}`}>
                      {radState.status === 'ANOMALY_DETECTED' ? '2/3 FAULT' : '3/3 SYNCED'}
                    </span>
                  </div>

                  {/* Readout 2 */}
                  <div
                    style={{ padding: '4px 0', margin: '2px 0' }}
                    className="flex justify-between items-center border-b border-slate-800/60 leading-none"
                  >
                    <span className="text-[10px] font-mono text-[#a0b0c0] tracking-[0.05em] uppercase whitespace-nowrap">
                      RADIATION PROTECTION:
                    </span>
                    <span className="text-[11px] font-bold font-mono tracking-[0.05em] text-[#00ff99] uppercase whitespace-nowrap">
                      100% ACTIVE
                    </span>
                  </div>

                  {/* Readout 3 */}
                  <div
                    style={{ padding: '4px 0', margin: '2px 0' }}
                    className="flex justify-between items-center leading-none"
                  >
                    <span className="text-[10px] font-mono text-[#a0b0c0] tracking-[0.05em] uppercase whitespace-nowrap">
                      DYNAMIC VOTING ENGINE:
                    </span>
                    <span className="text-[11px] font-bold font-mono tracking-[0.05em] text-[#00ff99] uppercase whitespace-nowrap">
                      {radState.status === 'ANOMALY_DETECTED' ? 'ENGAGED' : 'ENABLED'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Card 2: Action Buttons & Scanner Controls */}
              <div
                style={{
                  backgroundColor: 'rgba(8, 16, 26, 0.75)',
                  borderColor: 'rgba(0, 255, 153, 0.25)',
                  padding: '8px 10px',
                }}
                className="rounded-xl border flex flex-col shadow-sm font-mono shrink-0"
              >
                <div className="flex items-center gap-1.5 border-b border-emerald-500/20 pb-1 mb-1.5">
                  <Activity className="w-3 h-3 text-emerald-400 shrink-0" />
                  <span className="text-[10px] font-mono font-bold text-[#88a0b5] uppercase tracking-[0.05em] truncate">
                    RADIATION INTERVENTION
                  </span>
                </div>

                <div className="flex flex-col gap-1.5">
                  {/* Button 1: Initiate Scan */}
                  <button
                    id="btn-initiate-radiation-scan"
                    onClick={() => radiationFaultToleranceManager.initiateScan()}
                    disabled={radState.status === 'SCANNING' || radState.status === 'REPAIRING'}
                    style={{ padding: '6px 10px', fontSize: '10px' }}
                    className={`w-full rounded-lg border font-mono font-bold uppercase tracking-[0.05em] flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer ${
                      radState.status === 'SCANNING'
                        ? 'bg-rose-950/40 border-rose-500/50 text-rose-300 animate-pulse cursor-wait'
                        : 'bg-emerald-500/20 hover:bg-emerald-500/30 border-emerald-500/50 hover:border-emerald-400 text-emerald-200 shadow-emerald-950/30'
                    }`}
                  >
                    {radState.status === 'SCANNING' ? (
                      <>
                        <Loader2 className="w-3 h-3 text-rose-400 animate-spin" />
                        <span>[SWEEPING RED LASER...]</span>
                      </>
                    ) : (
                      <>
                        <Zap className="w-3 h-3 text-emerald-400" />
                        <span>[INITIATE COSMIC RADIATION SCAN]</span>
                      </>
                    )}
                  </button>

                  {/* Button 2: Execute Memory Auto-Repair */}
                  <button
                    id="btn-execute-auto-repair"
                    onClick={() => radiationFaultToleranceManager.executeAutoRepair()}
                    disabled={radState.status !== 'ANOMALY_DETECTED'}
                    style={{ padding: '6px 10px', fontSize: '10px' }}
                    className={`w-full rounded-lg border font-mono font-bold uppercase tracking-[0.05em] flex items-center justify-center gap-1.5 transition-all shadow-md ${
                      radState.status === 'ANOMALY_DETECTED'
                        ? 'bg-amber-500/25 hover:bg-amber-500/35 border-amber-500/60 hover:border-amber-400 text-amber-200 shadow-amber-950/40 cursor-pointer animate-pulse'
                        : radState.status === 'REPAIRING'
                        ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300 animate-pulse cursor-wait'
                        : 'bg-slate-900/60 border-slate-700/50 text-slate-500 opacity-60 cursor-not-allowed'
                    }`}
                  >
                    {radState.status === 'REPAIRING' ? (
                      <>
                        <Loader2 className="w-3 h-3 text-emerald-400 animate-spin" />
                        <span>[VOTING ENGINE CORRECTING PARITY...]</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-3 h-3" />
                        <span>[EXECUTE MEMORY AUTO-REPAIR]</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Status Indicator banner */}
                {radState.status === 'ANOMALY_DETECTED' && (
                  <div
                    style={{ padding: '6px 8px', marginTop: '4px' }}
                    className="rounded-lg bg-red-950/60 border border-red-500/50 flex flex-col gap-0.5 font-mono animate-pulse"
                  >
                    <div className="flex items-center gap-1.5 text-red-300 font-bold text-[11px] font-mono">
                      <AlertTriangle className="w-3 h-3 text-red-400 shrink-0" />
                      <span className="uppercase tracking-[0.05em]">[WARNING: BIT-FLIP DETECTED]</span>
                    </div>
                    <div className="text-red-200 text-[10px] font-mono uppercase tracking-wide">
                      RAM BLOCK #04 (0x04F8A9) PARITY MISMATCH
                    </div>
                    <div className="text-red-300/80 text-[9px] font-mono">
                      Laser sweep identified cosmic ray corruption. Ready for auto-repair.
                    </div>
                  </div>
                )}

                {radState.status === 'REPAIRED' && (
                  <div
                    style={{ padding: '6px 8px', marginTop: '4px' }}
                    className="rounded-lg bg-emerald-950/60 border border-emerald-500/50 flex flex-col gap-0.5 font-mono"
                  >
                    <div className="flex items-center gap-1.5 text-emerald-300 font-bold text-[11px] font-mono">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                      <span className="uppercase tracking-[0.05em]">[RESOLVED: MEMORY RESTORED]</span>
                    </div>
                    <div className="text-emerald-200 text-[10px] font-mono">
                      Bit-flip corrected via dynamic memory voting.
                    </div>
                    <div className="text-emerald-300/80 text-[9px] font-mono">
                      Triple Modular Redundancy verified at 100% parity integrity.
                    </div>
                  </div>
                )}
              </div>

              {/* Card 3: Memory Block Architecture Matrix */}
              <div
                style={{
                  backgroundColor: 'rgba(8, 16, 26, 0.75)',
                  borderColor: 'rgba(0, 255, 153, 0.25)',
                  padding: '8px 10px',
                }}
                className="rounded-xl border flex flex-col shadow-sm font-mono shrink-0"
              >
                <div className="flex items-center gap-1.5 border-b border-emerald-500/20 pb-1 mb-1">
                  <Cpu className="w-3 h-3 text-emerald-400 shrink-0" />
                  <span className="text-[10px] font-mono font-bold text-[#88a0b5] uppercase tracking-[0.05em] truncate">
                    RAM BLOCKS PARITY MATRIX
                  </span>
                </div>

                <div className="flex flex-col gap-0.5">
                  {[1, 2, 3, 4, 5, 6].map((blk) => {
                    const isFaulty = blk === 4 && radState.activeAnomalyBlock === 4;
                    const isRepaired = blk === 4 && radState.status === 'REPAIRED';
                    return (
                      <div
                        key={blk}
                        style={{ padding: '3px 6px', margin: '1px 0' }}
                        className={`flex items-center justify-between rounded border font-mono ${
                          isFaulty
                            ? 'bg-red-950/50 border-red-500/50 text-red-300'
                            : isRepaired
                            ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                            : 'bg-slate-900/40 border-slate-800 text-slate-300'
                        }`}
                      >
                        <span className="text-[10px] font-mono font-semibold tracking-wider">
                          BLOCK #{String(blk).padStart(2, '0')}
                        </span>
                        <span className="text-[10px] font-mono uppercase tracking-wider">
                          {isFaulty ? '[BIT-FLIP FAULT]' : isRepaired ? '[REPAIRED // SYNC]' : '[PARITY SYNCED]'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </>
        )}

        {/* ================================================================= */}
        {/* VIEW 6: DEDICATED PROTOCOL INTERPRETER VIEW                       */}
        {/* ================================================================= */}
        {activeView === 'protocol_interpreter' && (
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

            {/* Sub-Header */}
            <div className="px-3.5 py-2.5 border-b border-[rgba(0,240,255,0.15)] bg-cyan-950/30 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg border border-cyan-500/35 bg-cyan-500/15 shrink-0">
                  <Share2 className="w-4 h-4 text-[#00f0ff]" />
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-[14px] font-bold text-white tracking-wide leading-tight">
                    Protocol Interpreter
                  </span>
                  <span className="text-[10px] font-semibold text-[#00f0ff] tracking-wider leading-snug">
                    JSON-LD Experiment Runner
                  </span>
                </div>
              </div>
            </div>

            {/* Scrollable Sub-panel Content */}
            <div
              className="mission-controls-scroll flex-1 overflow-y-auto p-3 flex flex-col gap-3 font-mono"
              style={{
                maxHeight: 'calc(100vh - 120px)',
                overflowY: 'auto',
              }}
            >
              {/* Status Header Badge */}
              <div className="p-2.5 rounded-xl border border-cyan-500/25 bg-slate-950/60 flex flex-col gap-1.5 text-left">
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-slate-400 font-semibold uppercase">SPECIFICATION:</span>
                  <span className="text-cyan-300 font-bold">W3C JSON-LD 1.1</span>
                </div>
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-slate-400 font-semibold uppercase">RUNTIME ENGINE:</span>
                  <span className="text-emerald-400 font-bold">GRAPH AST OK</span>
                </div>
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-slate-400 font-semibold uppercase">SPACECRAFT CORE:</span>
                  <span className="text-cyan-400 font-bold">LINKED // READY</span>
                </div>
              </div>

              {/* 1. SELECTABLE JSON-LD PAYLOAD EXPERIMENT CARDS */}
              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-left">
                  PAYLOAD EXPERIMENT SCRIPTS:
                </span>

                {protocolState.payloads.map((payload) => {
                  const isSelected = payload.id === protocolState.selectedPayloadId;
                  return (
                    <div
                      key={payload.id}
                      onClick={() => protocolInterpreterManager.selectPayload(payload.id)}
                      style={{
                        backgroundColor: isSelected ? 'rgba(0, 240, 255, 0.12)' : 'rgba(10, 20, 30, 0.75)',
                        borderColor: isSelected ? '#00f0ff' : 'rgba(0, 240, 255, 0.25)',
                        boxShadow: isSelected ? '0 0 16px rgba(0, 240, 255, 0.25)' : 'none',
                      }}
                      className="p-2.5 rounded-xl border flex flex-col gap-1.5 cursor-pointer transition-all duration-200 text-left hover:border-cyan-400 group"
                    >
                      <div className="flex items-start justify-between gap-1.5">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span
                            className={`w-2 h-2 rounded-full shrink-0 ${
                              isSelected ? 'bg-cyan-400 shadow-[0_0_8px_#00f0ff]' : 'bg-slate-600'
                            }`}
                          />
                          <span
                            className={`text-[10px] font-bold tracking-wide truncate ${
                              isSelected ? 'text-white' : 'text-slate-200 group-hover:text-cyan-300'
                            }`}
                          >
                            {payload.filename}
                          </span>
                        </div>
                        {isSelected && (
                          <span className="text-[7.5px] font-bold px-1 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/40 uppercase shrink-0">
                            SELECTED
                          </span>
                        )}
                      </div>

                      <span className="text-[9px] text-[#00ff99] font-medium truncate">
                        {payload.subtitle}
                      </span>

                      <div className="flex items-center gap-2 text-[8px] text-slate-400 pt-0.5 border-t border-cyan-500/15">
                        <span className="text-cyan-400 uppercase font-semibold truncate">
                          @{payload.type}
                        </span>
                        <span className="text-slate-600">•</span>
                        <span className="text-slate-400 truncate">{payload.payloadScript}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* 2. ACTION BUTTON: [LAUNCH 3D RUNTIME GRAPH] */}
              <div className="pt-1">
                <button
                  id="btn-launch-protocol-graph"
                  onClick={() => {
                    protocolInterpreterManager.setGraphActive(true);
                    onToggle(false);
                  }}
                  style={{
                    background: 'linear-gradient(135deg, rgba(0, 240, 255, 0.3) 0%, rgba(0, 255, 153, 0.25) 100%)',
                    borderColor: 'rgba(0, 240, 255, 0.65)',
                    boxShadow: '0 8px 24px rgba(0, 240, 255, 0.35)',
                  }}
                  className="w-full py-2.5 px-3 rounded-xl border text-white font-mono font-bold text-[11px] tracking-wider uppercase transition-all duration-200 hover:scale-[1.02] active:scale-95 cursor-pointer flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-4 h-4 text-[#00f0ff] animate-pulse" />
                  <span>[LAUNCH 3D RUNTIME GRAPH]</span>
                </button>
              </div>

              {/* Raw JSON-LD Schema Inspector Box */}
              <div
                style={{
                  padding: '8px',
                  backgroundColor: 'rgba(2, 6, 23, 0.88)',
                  borderColor: 'rgba(0, 240, 255, 0.25)',
                }}
                className="json-schema-inspector rounded-xl border flex flex-col gap-1.5 text-left"
              >
                <div className="flex items-center justify-between">
                  <span
                    style={{
                      fontSize: '10px',
                      fontWeight: 700,
                      letterSpacing: '0.05em',
                      lineHeight: '14px',
                      whiteSpace: 'nowrap',
                    }}
                    className="font-mono text-slate-400 uppercase"
                  >
                    JSON-LD SCHEMA INSPECTOR:
                  </span>
                  <span
                    style={{
                      fontSize: '8px',
                      borderColor: 'rgba(0, 240, 255, 0.3)',
                      backgroundColor: 'rgba(0, 240, 255, 0.1)',
                    }}
                    className="px-1.5 py-0.5 rounded border text-cyan-300 font-mono font-semibold uppercase"
                  >
                    SCHEMA 1.1
                  </span>
                </div>
                <pre
                  style={{
                    fontSize: '9.5px',
                    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                    lineHeight: 1.25,
                    letterSpacing: '0.02em',
                    padding: '6px 8px',
                    wordBreak: 'break-all',
                    whiteSpace: 'pre-wrap',
                    maxHeight: '135px',
                    overflowY: 'auto',
                  }}
                  className="rounded bg-slate-900/80 border border-cyan-500/20 text-cyan-300 font-mono leading-relaxed"
                >
                  <code>{JSON.stringify(protocolState.activePayload.schema, null, 2)}</code>
                </pre>
              </div>
            </div>
          </>
        )}

        {/* ================================================================= */}
        {/* VIEW 7: DEDICATED TIMED AUTOMATON VERIFIER VIEW                   */}
        {/* ================================================================= */}
        {activeView === 'timed_automaton_verifier' && (
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

            {/* Sub-Header */}
            <div className="px-3 py-2.5 border-b border-[rgba(0,240,255,0.15)] bg-cyan-950/30 flex items-start justify-between shrink-0">
              <div className="flex items-center gap-2 min-w-0">
                <div className="p-1.5 rounded-lg border border-emerald-500/35 bg-emerald-500/15 shrink-0 mt-0.5">
                  <ShieldCheck className="w-4 h-4 text-[#00ff99]" />
                </div>
                <div className="flex flex-col text-left min-w-0">
                  <div className="text-[12px] font-mono font-bold uppercase tracking-wider text-white leading-[14px]">
                    <div className="whitespace-nowrap">TIMED AUTOMATON</div>
                    <div className="whitespace-nowrap">VERIFIER</div>
                  </div>
                  <span className="text-[8.5px] font-mono font-semibold text-[#00ff99] tracking-wider leading-snug mt-0.5 whitespace-nowrap">
                    PRE-FLIGHT SCRIPT VERIFICATION
                  </span>
                </div>
              </div>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded border border-cyan-500/40 bg-cyan-950/60 text-cyan-300 uppercase tracking-wider shrink-0 mt-0.5">
                CTL // UPPAAL
              </span>
            </div>

            {/* Scrollable Sub-panel Content */}
            <div
              className="mission-controls-scroll flex-1 overflow-y-auto p-3 flex flex-col gap-3 font-mono"
              style={{
                maxHeight: 'calc(100vh - 120px)',
                overflowY: 'auto',
              }}
            >
              {/* Telemetry Readouts */}
              <div className="p-2.5 rounded-xl border border-emerald-500/30 bg-slate-950/80 flex flex-col gap-1.5 text-left shadow-[0_0_15px_rgba(0,255,153,0.08)]">
                <div className="flex items-center justify-between text-[8.5px] font-mono leading-tight whitespace-nowrap" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', whiteSpace: 'nowrap' }}>
                  <span style={{ fontSize: '8.5px', opacity: 0.7 }} className="text-slate-400 font-semibold uppercase tracking-wider whitespace-nowrap">
                    CHECK ENGINE:
                  </span>
                  <span style={{ fontSize: '8.5px' }} className="text-cyan-300 font-bold uppercase tracking-wider whitespace-nowrap">
                    UPPAAL CTL SYMBOLIC
                  </span>
                </div>
                <div className="flex items-center justify-between text-[8.5px] font-mono leading-tight whitespace-nowrap" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', whiteSpace: 'nowrap' }}>
                  <span style={{ fontSize: '8.5px', opacity: 0.7 }} className="text-slate-400 font-semibold uppercase tracking-wider whitespace-nowrap">
                    DEADLOCK STATE:
                  </span>
                  <span style={{ fontSize: '8.5px' }} className="text-[#00ff99] font-bold uppercase tracking-wider whitespace-nowrap">
                    0 (PROVEN FREE)
                  </span>
                </div>
                <div className="flex items-center justify-between text-[8.5px] font-mono leading-tight whitespace-nowrap" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', whiteSpace: 'nowrap' }}>
                  <span style={{ fontSize: '8.5px', opacity: 0.7 }} className="text-slate-400 font-semibold uppercase tracking-wider whitespace-nowrap">
                    VERIFICATION FORMULA:
                  </span>
                  <span style={{ fontSize: '8.5px' }} className="text-emerald-300 font-bold uppercase tracking-wider whitespace-nowrap">
                    AG (NOT DEADLOCK)
                  </span>
                </div>
              </div>

              {/* Procedure Script Selection List */}
              <div className="flex flex-col gap-1.5">
                <span
                  style={{ fontSize: '9px', opacity: 0.7 }}
                  className="font-mono font-bold text-slate-400 uppercase tracking-widest text-left"
                >
                  PROCEDURE SCRIPT SELECTION:
                </span>

                {taState.scripts.map((script) => {
                  const isSelected = script.id === taState.selectedScriptId;
                  return (
                    <div
                      key={script.id}
                      onClick={() => timedAutomatonManager.selectScript(script.id)}
                      style={{
                        backgroundColor: isSelected ? 'rgba(0, 255, 153, 0.12)' : 'rgba(10, 20, 30, 0.75)',
                        borderColor: isSelected ? '#00ff99' : 'rgba(0, 240, 255, 0.25)',
                        boxShadow: isSelected ? '0 0 16px rgba(0, 255, 153, 0.25)' : 'none',
                        padding: '10px',
                      }}
                      className="rounded-xl border flex flex-col gap-1.5 cursor-pointer transition-all duration-200 text-left hover:border-emerald-400 group"
                    >
                      <div className="flex items-start justify-between gap-1.5">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span
                            className={`w-2 h-2 rounded-full shrink-0 ${
                              isSelected ? 'bg-emerald-400 shadow-[0_0_8px_#00ff99]' : 'bg-slate-600'
                            }`}
                          />
                          <span
                            style={{ fontSize: '8.5px' }}
                            className={`font-mono font-bold tracking-wide truncate ${
                              isSelected ? 'text-white' : 'text-slate-200 group-hover:text-emerald-300'
                            }`}
                          >
                            {script.filename}
                          </span>
                        </div>
                        <span
                          style={{ fontSize: '8.5px' }}
                          className={`font-mono font-bold px-1.5 py-0.5 rounded border uppercase shrink-0 transition-colors ${
                            isSelected
                              ? 'bg-emerald-950 text-[#00ff99] border-emerald-500/50 shadow-[0_0_8px_rgba(0,255,153,0.3)]'
                              : 'bg-slate-900 text-slate-400 border-slate-700 group-hover:border-emerald-500/30 group-hover:text-emerald-300'
                          }`}
                        >
                          [SELECT]
                        </span>
                      </div>

                      <span
                        style={{ fontSize: '8.5px' }}
                        className="font-mono text-[#00e5ff] font-medium truncate"
                      >
                        {script.name} — {script.description}
                      </span>

                      <div
                        style={{ fontSize: '8px' }}
                        className="flex items-center gap-2 font-mono text-slate-400 pt-0.5 border-t border-emerald-500/15 whitespace-nowrap overflow-hidden"
                      >
                        <span className="text-emerald-400 uppercase font-semibold truncate shrink-0">
                          {script.statesCount.toLocaleString()} STATES
                        </span>
                        <span className="text-slate-600">•</span>
                        <span className="text-slate-400 truncate shrink-0">{script.clocksCount} CLOCKS</span>
                        <span className="text-slate-600">•</span>
                        <span className="text-cyan-400 truncate font-mono">{script.formula}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Action Button: [RUN SYMBOLIC MODEL CHECK] */}
              <div className="pt-1">
                <button
                  id="btn-run-symbolic-check"
                  disabled={taState.isVerifying}
                  onClick={() => {
                    timedAutomatonManager.runVerification();
                  }}
                  style={{
                    background: taState.isVerifying
                      ? 'rgba(0, 255, 153, 0.15)'
                      : 'linear-gradient(135deg, rgba(0, 255, 153, 0.35) 0%, rgba(0, 229, 255, 0.25) 100%)',
                    borderColor: 'rgba(0, 255, 153, 0.75)',
                    boxShadow: taState.isVerifying
                      ? 'none'
                      : '0 8px 24px rgba(0, 255, 153, 0.35)',
                  }}
                  className={`w-full py-2.5 px-3 rounded-xl border text-white font-mono font-bold text-[11px] tracking-wider uppercase transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 ${
                    taState.isVerifying
                      ? 'opacity-70 cursor-not-allowed'
                      : 'hover:scale-[1.02] active:scale-95'
                  }`}
                >
                  {taState.isVerifying ? (
                    <>
                      <Loader2 className="w-4 h-4 text-[#00ff99] animate-spin" />
                      <span>[EXPLORING SYMBOLIC SPACE...]</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 text-[#00ff99] animate-pulse" />
                      <span>[RUN SYMBOLIC MODEL CHECK]</span>
                    </>
                  )}
                </button>
              </div>

              {/* Real-Time Verification Terminal */}
              <div
                style={{
                  padding: '8px',
                  backgroundColor: 'rgba(2, 6, 23, 0.92)',
                  borderColor: 'rgba(0, 255, 153, 0.3)',
                  boxShadow: 'inset 0 0 12px rgba(0, 0, 0, 0.8)',
                }}
                className="terminal-block rounded-xl border flex flex-col gap-1.5 text-left"
              >
                <div className="flex items-center justify-between">
                  <span
                    style={{
                      fontSize: '10px',
                      fontWeight: 700,
                      letterSpacing: '0.05em',
                      lineHeight: '14px',
                      whiteSpace: 'nowrap',
                    }}
                    className="font-mono text-slate-400 uppercase flex items-center gap-1.5"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    UPPAAL ENGINE TERMINAL:
                  </span>
                  <span
                    style={{
                      fontSize: '8px',
                      borderColor: 'rgba(0, 255, 153, 0.4)',
                      backgroundColor: 'rgba(0, 255, 153, 0.1)',
                    }}
                    className="px-1.5 py-0.5 rounded border text-[#00ff99] font-mono font-semibold uppercase"
                  >
                    {taState.isVerifying ? 'BUSY' : 'READY'}
                  </span>
                </div>
                <pre
                  style={{
                    fontSize: '9.5px',
                    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                    lineHeight: 1.35,
                    letterSpacing: '0.02em',
                    padding: '8px',
                    wordBreak: 'break-all',
                    whiteSpace: 'pre-wrap',
                    maxHeight: '125px',
                    overflowY: 'auto',
                  }}
                  className="mission-controls-scroll rounded bg-slate-950/90 border border-emerald-500/25 text-[#00ff99] font-mono"
                >
                  {taState.terminalLogs.map((log, idx) => {
                    const isSuccess = log.includes('PROPERTY SATISFIED');
                    return (
                      <div
                        key={idx}
                        className={`${
                          isSuccess
                            ? 'text-[#00ff99] font-bold drop-shadow-[0_0_6px_rgba(0,255,153,0.8)]'
                            : 'text-cyan-300'
                        }`}
                      >
                        {log}
                      </div>
                    );
                  })}
                </pre>
              </div>
            </div>
          </>
        )}

        {/* ─── SLEEK STATUS FOOTER ────────────────────────────────────── */}
        <div className="px-3.5 py-2 border-t border-[rgba(0,240,255,0.2)] bg-slate-950/80 flex items-center justify-between shrink-0 w-full font-mono">
          <div className="flex items-center gap-1.5 shrink-0" style={{ fontSize: '10px', lineHeight: '14px' }}>
            <Radio className="w-3.5 h-3.5 text-[#00ff99] animate-pulse" />
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
              : activeView === 'digital_twin_replay'
              ? 'DIGITAL TWIN REPLAY'
              : activeView === 'radiation_fault_tolerance'
              ? 'RADIATION FAULT TOLERANCE'
              : activeView === 'protocol_interpreter'
              ? 'PROTOCOL INTERPRETER'
              : activeView === 'timed_automaton_verifier'
              ? 'TIMED AUTOMATON VERIFIER'
              : 'WORKSPACE ACTIVE'}
          </span>
        </div>
      </aside>
    </>
  );
}