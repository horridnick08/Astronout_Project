import React, { useState, useEffect } from 'react';
import { Orbit, User, Maximize2, Compass } from 'lucide-react';
import { CAMERA_VIEWS } from '../../engine/CameraManager.jsx';
import WebcamFeed from './WebcamFeed.jsx';
import KinematicsTelemetryHUD from './KinematicsTelemetryHUD.tsx';
import LeftNavigationDrawer from './LeftNavigationDrawer.tsx';
import EdgeAIChatLog from './EdgeAIChatLog.tsx';
import { missionTimeline } from '../../engine/useMissionTimeline.ts';
import { cbdDiagnosticManager, CbdDiagnosticState } from '../../engine/CbdDiagnosticManager.ts';

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

  const isScanning = diagState.status === 'SCANNING';

  return (
    <div className="absolute inset-0 pointer-events-none z-20 font-sans select-none overflow-hidden">
      {/* ========================================================================= */}
      {/* ========================================================================= */}
      {/* 0. LEFT COLLAPSIBLE NAVIGATION DRAWER (Convex Hull Boundary Controls)     */}
      {/* ========================================================================= */}
      <LeftNavigationDrawer isOpen={isSidebarOpen} onToggle={setIsSidebarOpen} />

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

        {/* Docked Active Diagnostic Progress Banner (Directly Below Camera Bar) */}
        {isScanning && (
          <div
            style={{
              backgroundColor: 'rgba(8, 18, 28, 0.94)',
              borderColor: diagState.step === 2 && diagState.scanType === 'CAMERA_PIPELINE' ? 'rgba(255, 170, 0, 0.6)' : 'rgba(0, 240, 255, 0.45)',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.8), 0 0 16px rgba(0, 240, 255, 0.25)',
              width: '100%',
              maxWidth: '350px',
            }}
            className="px-3 py-1.5 rounded-xl border flex flex-col items-start gap-1 font-mono backdrop-blur-md transition-all duration-300 pointer-events-auto shadow-lg"
          >
            <div className="flex items-center justify-between w-full gap-2" style={{ fontSize: '10px' }}>
              <div className="flex items-center gap-1.5 text-cyan-300 font-bold tracking-wider uppercase truncate">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping shrink-0" />
                REITER&apos;S DIAGNOSIS STEP {diagState.step}/4
              </div>
              <span
                style={{ fontSize: '9px' }}
                className="text-[#88a0b5] font-semibold uppercase tracking-wider shrink-0"
              >
                {diagState.scanType === 'EDGE_AI_MODULES' ? 'AI CORE' : 'MULTI-CAM'}
              </span>
            </div>
            <div
              style={{
                color: diagState.step === 2 && diagState.scanType === 'CAMERA_PIPELINE' ? '#ffaa00' : '#ffffff',
                fontSize: '10px',
                lineHeight: '13px',
              }}
              className="font-mono font-medium tracking-wide truncate max-w-full"
            >
              {diagState.phaseLabel}
            </div>
            {/* Progress Bar */}
            <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden border border-cyan-500/30 mt-0.5">
              <div
                style={{
                  width: `${Math.round(diagState.progress * 100)}%`,
                  backgroundColor: diagState.step === 2 && diagState.scanType === 'CAMERA_PIPELINE' ? '#ffaa00' : '#00f0ff',
                  boxShadow: `0 0 8px ${diagState.step === 2 && diagState.scanType === 'CAMERA_PIPELINE' ? '#ffaa00' : '#00f0ff'}`,
                }}
                className="h-full transition-all duration-100 rounded-full"
              />
            </div>
          </div>
        )}
      </header>

      {/* ========================================================================= */}
      {/* 2. 2-COLUMN TELEMETRY & STANDBY HUD GRID (Bottom-Left Section)            */}
      {/* ========================================================================= */}
      <KinematicsTelemetryHUD isSidebarOpen={isSidebarOpen} />

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

        {/* BOTTOM-RIGHT: CAM STANDBY CARD */}
        <div className="pointer-events-auto w-full">
          <WebcamFeed
            videoRef={videoRef}
            canvasRef={canvasRef}
            isLive={isLiveMocap}
            latency={latency}
            landmarks={landmarks}
          />
        </div>
      </aside>
    </div>
  );
}
