import React from 'react';
import { Orbit, User, Maximize2, Compass, Layers } from 'lucide-react';
import { CAMERA_VIEWS } from '../../engine/CameraManager.jsx';
import WebcamFeed from './WebcamFeed.jsx';
import SubtitleOverlay from './SubtitleOverlay.jsx';

/**
 * ControlHUD
 * 
 * Clean Mission Control Overlay:
 * 1. LEFT SIDE: Completely clean and transparent over the 3D space.
 * 2. RIGHT SIDEBAR:
 *    - Top-Right: Dark aerospace empty placeholder container (Expansion Bay) ready for next feature.
 *    - Extreme Bottom-Right: CAM STANDBY (WebcamFeed PiP) card.
 * 3. CENTER 3D VIEWPORT:
 *    - Top-Right Camera utility buttons (Close Front, 360 Orbit, Over-Shoulder, Corridor Wide)
 *    - Bottom-Center Subtitle HUD Overlay for the 30-40s automated dialogue loop.
 */
export default function ControlHUD({
  activeCameraView,
  onSelectCameraView,
  isLiveMocap,
  videoRef,
  canvasRef,
  latency,
  landmarks
}) {
  const cameraPresets = [
    { id: CAMERA_VIEWS.FRONT, label: 'Close Front', icon: User },
    { id: CAMERA_VIEWS.ORBIT_360, label: '360° Orbit', icon: Orbit },
    { id: CAMERA_VIEWS.OTS, label: 'Over-Shoulder', icon: Compass },
    { id: CAMERA_VIEWS.WIDE, label: 'Corridor Wide', icon: Maximize2 }
  ];

  return (
    <div className="absolute inset-0 pointer-events-none z-20 font-sans select-none overflow-hidden">
      {/* ========================================================================= */}
      {/* 1. CAMERA UTILITY BUTTONS ALIGNED ABOVE 3D VIEW                           */}
      {/* ========================================================================= */}
      <header
        style={{
          right: '284px',
          top: '1rem'
        }}
        className="fixed flex items-center justify-end pointer-events-none z-20"
      >
        <div className="flex items-center gap-1.5 bg-slate-900/80 backdrop-blur-md border border-cyan-500/30 p-1.5 rounded-2xl shadow-xl shadow-cyan-950/20 pointer-events-auto">
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

      {/* ========================================================================= */}
      {/* 2. SUBTITLE HUD OVERLAY (Bottom-Center of 3D Viewport)                     */}
      {/* ========================================================================= */}
      <SubtitleOverlay />

      {/* ========================================================================= */}
      {/* 3. RIGHT SIDEBAR RE-ARRANGEMENT                                           */}
      {/*    - Top-Right Area: Empty aerospace placeholder container                 */}
      {/*    - Bottom-Right Corner: CAM STANDBY (WebcamFeed) completely down        */}
      {/* ========================================================================= */}
      <aside className="fixed right-4 top-4 bottom-4 w-64 pointer-events-none flex flex-col justify-between z-20">
        {/* TOP-RIGHT AREA: EMPTY PLACEHOLDER CONTAINER (Dark Aerospace Card Styling) */}
        <div className="pointer-events-auto flex-1 mb-3 flex flex-col rounded-xl overflow-hidden border border-cyan-500/30 bg-slate-900/80 backdrop-blur-md shadow-xl shadow-cyan-950/30">
          {/* Header Bar matching CAM STANDBY */}
          <div className="flex items-center justify-between px-3 py-1.5 bg-slate-950/60 border-b border-cyan-500/20 text-xs font-mono">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-cyan-400/60" />
              <span className="text-slate-300 font-semibold tracking-wider uppercase text-[11px]">
                EXPANSION BAY
              </span>
            </div>
            <span className="text-[9px] text-cyan-400 font-mono px-1.5 py-0.5 rounded bg-cyan-950/40 border border-cyan-500/20">
              STANDBY
            </span>
          </div>

          {/* Interior Placeholder Body */}
          <div className="flex-1 p-3 flex flex-col items-center justify-center text-center">
            <div className="w-full h-full border border-dashed border-cyan-500/25 rounded-lg bg-slate-950/40 p-4 flex flex-col items-center justify-center text-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-cyan-950/40 border border-cyan-500/20 flex items-center justify-center">
                <Layers className="w-5 h-5 text-cyan-400/60" />
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider">
                  Auxiliary Bay Slot
                </span>
                <span className="text-[10px] font-mono text-slate-400 leading-relaxed px-2">
                  Reserved for next telemetry feature integration.
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* BOTTOM-RIGHT CORNER: CAM STANDBY BOX (Extreme bottom-right position) */}
        <div className="pointer-events-auto">
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
