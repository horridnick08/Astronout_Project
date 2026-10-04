import React, { useState, useEffect } from 'react';
import { Orbit, User, Maximize2, Compass, AlertTriangle, ShieldCheck, Activity } from 'lucide-react';
import { CAMERA_VIEWS } from '../../engine/CameraManager.jsx';
import WebcamFeed from './WebcamFeed.jsx';
import KinematicsTelemetryHUD from './KinematicsTelemetryHUD.tsx';
import LeftNavigationDrawer from './LeftNavigationDrawer.tsx';
import EdgeAIChatLog from './EdgeAIChatLog.tsx';
import { missionTimeline } from '../../engine/useMissionTimeline.ts';
import { cbdDiagnosticManager, CbdDiagnosticState } from '../../engine/CbdDiagnosticManager.ts';
import { kinematicSafetyManager, KinematicSafetyState } from '../../engine/KinematicSafetyManager.ts';
import DigitalTwinTimelineScrubber from './DigitalTwinTimelineScrubber.tsx';
import { digitalTwinReplayManager, DigitalTwinReplayState } from '../../engine/DigitalTwinReplayManager.ts';
import { radiationFaultToleranceManager, RadiationFaultState } from '../../engine/RadiationFaultToleranceManager.ts';

/**
 * ControlHUD.tsx
 * 
 * Production Aerospace HUD Overlay:
 * 1. Left Viewport: 100% clean and transparent over the 3D space.
 * 2. Top Utility Rail: Camera preset buttons (Close Front, 360 Orbit, Over-Shoulder, Corridor Wide).
 * 3. Right Sidebar:
 *    - Top-Right: EDGE AI // OFFLINE ASSISTANT live copilot chat history & real-time telemetry.
 *    - Bottom-Right: CAM STANDBY (WebcamFeed PiP) card.
 * 4. Bottom-Center: Subtitle HUD Overlay for the autonomous multi-station mission loop.
 */

interface ControlHUDProps {
  activeCameraView: string;
  onSelectCameraView: (view: string) => void;
  isLiveMocap: boolean;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  latency: number;
  landmarks: any[];
}

export default function ControlHUD({
  activeCameraView,
  onSelectCameraView,
  isLiveMocap,
  videoRef,
  canvasRef,
  latency,
  landmarks
}: ControlHUDProps) {
  const cameraPresets = [
    { id: CAMERA_VIEWS.FRONT, label: 'Close Front', icon: User },
    { id: CAMERA_VIEWS.ORBIT_360, label: '360° Orbit', icon: Orbit },
    { id: CAMERA_VIEWS.OTS, label: 'Over-Shoulder', icon: Compass },
    { id: CAMERA_VIEWS.WIDE, label: 'Corridor Wide', icon: Maximize2 }
  ];

  const [timelineState, setTimelineState] = useState(missionTimeline.getState());
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [diagState, setDiagState] = useState<CbdDiagnosticState>(() => cbdDiagnosticManager.getState());
  const [safetyState, setSafetyState] = useState<KinematicSafetyState>(() => kinematicSafetyManager.getState());
  const [replayState, setReplayState] = useState<DigitalTwinReplayState>(() => digitalTwinReplayManager.getState());

  useEffect(() => {
    return missionTimeline.subscribe((state) => {
      setTimelineState(state);
    });
  }, []);

  useEffect(() => {
    return cbdDiagnosticManager.subscribe((state) => {
      setDiagState(state);
    });
  }, []);

  useEffect(() => {
    return kinematicSafetyManager.subscribe((state) => setSafetyState(state));
  }, []);

  useEffect(() => {
    return digitalTwinReplayManager.subscribe((state) => setReplayState(state));
  }, []);

  useEffect(() => {
    return radiationFaultToleranceManager.subscribe((state) => {
      if (state.cameraFocused) {
        onSelectCameraView(CAMERA_VIEWS.SERVER_RACK || 'SERVER_RACK');
      }
    });
  }, [onSelectCameraView]);

  const isScanning = diagState.status === 'SCANNING';

  return (
    <div className="absolute inset-0 pointer-events-none z-20 font-sans select-none overflow-hidden">
      {/* ========================================================================= */}
      {/* ========================================================================= */}
      {/* 0. LEFT COLLAPSIBLE NAVIGATION DRAWER (Convex Hull Boundary Controls)     */}
      {/* ========================================================================= */}
      <LeftNavigationDrawer isOpen={isSidebarOpen} onToggle={setIsSidebarOpen} />

      {/* ========================================================================= */}
      {/* 0b. DIGITAL TWIN REPLAY TIMELINE SCRUBBER & TOP BANNER OVERLAY             */}
      {/* ========================================================================= */}
      <DigitalTwinTimelineScrubber />

      {/* ========================================================================= */}
      {/* 1. TOP UTILITY RAIL: CAMERA SWITCHER BUTTONS & DOCKED DIAGNOSTIC BANNER   */}
      {/* ========================================================================= */}
      <header
        style={{
          right: 'calc(1rem + 310px + 16px)',
          top: '1rem',
        }}
        className="fixed flex flex-col items-end gap-1.5 pointer-events-none z-20"
      >
        {/* Camera Angle Controls */}
        <div className="flex items-center gap-1 bg-slate-900/80 backdrop-blur-md border border-cyan-500/30 p-1 rounded-xl shadow-lg shadow-cyan-950/20 pointer-events-auto">
          {cameraPresets.map(({ id, label, icon: Icon }) => {
            const isActive = activeCameraView === id;
            return (
              <button
                key={id}
                id={`btn-cam-${id.toLowerCase()}`}
                onClick={() => onSelectCameraView(id)}
                style={{ padding: '4px 8px', fontSize: '10px' }}
                className={`flex items-center gap-1.5 rounded-lg font-mono tracking-wide transition-all duration-200 cursor-pointer ${
                  isActive
                    ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/30'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                }`}
              >
                <Icon className="w-3 h-3" />
                <span className="whitespace-nowrap">{label}</span>
              </button>
            );
          })}
        </div>

        {/* Docked Active Diagnostic Step Banner (Strictly Below Camera Bar with clear offset) */}
        {isScanning && (
          <div
            style={{
              backgroundColor: 'rgba(8, 18, 28, 0.94)',
              borderColor: diagState.step === 2 && diagState.scanType === 'GLARE_ADAPTATION' ? 'rgba(255, 170, 0, 0.7)' : 'rgba(0, 240, 255, 0.45)',
              boxShadow: diagState.step === 2 && diagState.scanType === 'GLARE_ADAPTATION' ? '0 8px 24px rgba(0, 0, 0, 0.8), 0 0 16px rgba(255, 170, 0, 0.35)' : '0 8px 24px rgba(0, 0, 0, 0.8), 0 0 14px rgba(0, 240, 255, 0.2)',
              width: '100%',
              maxWidth: '340px',
              marginTop: '4px',
            }}
            className="px-2.5 py-1.5 rounded-lg border flex flex-col items-start gap-1 font-mono backdrop-blur-md transition-all duration-300 pointer-events-auto shadow-lg"
          >
            <div className="flex items-center justify-between w-full gap-2" style={{ fontSize: '10px' }}>
              <div className="flex items-center gap-1.5 text-cyan-300 font-bold tracking-wider uppercase truncate">
                <span className={`w-1.5 h-1.5 rounded-full ${diagState.step === 2 && diagState.scanType === 'GLARE_ADAPTATION' ? 'bg-amber-400' : 'bg-cyan-400'} animate-ping shrink-0`} />
                REITER&apos;S DIAGNOSIS STEP {diagState.step}/4
              </div>
              <span
                style={{ fontSize: '8.5px' }}
                className={`${diagState.step === 2 && diagState.scanType === 'GLARE_ADAPTATION' ? 'text-amber-400' : 'text-[#88a0b5]'} font-semibold uppercase tracking-wider shrink-0`}
              >
                {diagState.scanType === 'GLARE_ADAPTATION'
                  ? 'SPECTRAL ADAPTATION'
                  : diagState.scanType === 'EDGE_AI_MODULES'
                  ? 'AI CORE MODULES'
                  : 'CAMERA PIPELINE'}
              </span>
            </div>
            <div
              style={{
                color: diagState.step === 2 && diagState.scanType === 'GLARE_ADAPTATION' ? '#ffaa00' : '#ffffff',
                fontSize: '9.5px',
                lineHeight: '12px',
              }}
              className="font-mono font-medium tracking-wide truncate max-w-full"
            >
              {diagState.phaseLabel}
            </div>
            {/* Compact Progress Bar */}
            <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden border border-cyan-500/30 mt-0.5">
              <div
                style={{
                  width: `${Math.round(diagState.progress * 100)}%`,
                  backgroundColor: diagState.step === 2 && diagState.scanType === 'GLARE_ADAPTATION' ? '#ffaa00' : '#00f0ff',
                  boxShadow: `0 0 8px ${diagState.step === 2 && diagState.scanType === 'GLARE_ADAPTATION' ? '#ffaa00' : '#00f0ff'}`,
                }}
                className="h-full transition-all duration-100 rounded-full"
              />
            </div>
          </div>
        )}

        {/* Compact HUD Warning Badge strictly during active glare distortion in Module 1 */}
        {isScanning && diagState.scanType === 'GLARE_ADAPTATION' && diagState.step <= 2 && (
          <div
            id="hud-badge-glare-warning"
            style={{ fontSize: '10px', padding: '2px 8px' }}
            className="flex items-center gap-1.5 rounded-lg border border-amber-500/80 bg-slate-950/90 text-amber-300 font-mono font-bold tracking-wider shadow-[0_0_16px_rgba(255,170,0,0.5)] backdrop-blur-md pointer-events-auto animate-pulse transition-all duration-200 mt-0.5"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>[CAM_02: HIGH GLARE / SPECTRAL DISTORTION]</span>
          </div>
        )}

        {/* Compact HUD Status Badge strictly during active spectral adaptation in Module 1 */}
        {isScanning && diagState.scanType === 'GLARE_ADAPTATION' && diagState.step >= 3 && (
          <div
            id="hud-badge-spectral-repaired"
            style={{ fontSize: '10px', padding: '2px 8px' }}
            className="flex items-center gap-1.5 rounded-lg border border-cyan-400/80 bg-slate-950/90 text-cyan-300 font-mono font-bold tracking-wider shadow-[0_0_16px_rgba(0,240,255,0.4)] backdrop-blur-md pointer-events-auto transition-all duration-200 mt-0.5"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-[#00f0ff] shrink-0" />
            <span>[CAM_02: SPECTRAL ADAPTED & REPAIRED]</span>
          </div>
        )}
      </header>

      {/* ========================================================================= */}
      {/* 2. 2-COLUMN TELEMETRY & STANDBY HUD GRID (Bottom-Left Section)            */}
      {/* ========================================================================= */}
      <KinematicsTelemetryHUD
        isSidebarOpen={isSidebarOpen}
        safetyState={safetyState}
        isReplayActive={replayState.isActive}
      />

      {/* ========================================================================= */}
      {/* KINEMATIC DEVIATION ALERT: Floating Red Monospace Badge (Top/Center)      */}
      {/* ========================================================================= */}
      {safetyState.isDeviating && (
        <div
          id="hud-badge-kinematic-deviation"
          style={{
            position: 'fixed',
            top: '64px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 50,
            backgroundColor: 'rgba(32, 6, 6, 0.96)',
            borderColor: 'rgba(255, 34, 0, 0.85)',
            boxShadow: '0 0 28px rgba(255, 34, 0, 0.6), 0 8px 24px rgba(0, 0, 0, 0.9)',
            fontSize: '10px',
            padding: '5px 14px',
          }}
          className="flex items-center gap-2 rounded-lg border font-mono font-bold tracking-[0.05em] text-red-300 pointer-events-none animate-pulse backdrop-blur-md"
        >
          <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0" />
          <span>[CRITICAL KINEMATIC DEVIATION // {(safetyState.activeArea || 'AVIONICS CONSOLE A').toUpperCase()}]</span>
          <span style={{ color: '#ff6644', fontSize: '10px' }} className="font-normal opacity-90">
            Δ {safetyState.liveDelta.toFixed(2)} m/s &gt; {safetyState.maxAllowed.toFixed(2)} m/s
          </span>
          <span className="text-[9px] px-1.5 py-0.5 rounded bg-red-950/80 border border-red-500/40 text-red-200 uppercase font-semibold">
            AUTO-THROTTLED • COMMS MUTED
          </span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. RIGHT SIDEBAR ALIGNMENT                                                */}
      {/*    - Top-Right: EDGE AI // OFFLINE ASSISTANT live copilot chat log          */}
      {/*    - Bottom-Right: CAM STANDBY feed card                                  */}
      {/* ========================================================================= */}
      <aside
        style={{ width: '310px', right: '1rem' }}
        className="fixed top-4 bottom-4 pointer-events-none flex flex-col justify-between z-20"
      >
        {/* TOP-RIGHT: EDGE AI // OFFLINE ASSISTANT LIVE CHAT LOG */}
        <EdgeAIChatLog timelineState={timelineState} />

        {/* BOTTOM-RIGHT: RESERVED SLOT FOR LIVE FEED / 3D PIP */}
        <div style={{ height: '192px' }} className="w-full shrink-0 pointer-events-none" />
      </aside>
    </div>
  );
}
