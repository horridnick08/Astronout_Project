import React, { useEffect, useState } from 'react';
import {
  Camera,
  CameraOff,
  Radio,
  Sliders,
  Maximize2,
  Minimize2,
  RefreshCw,
  Layers,
  Sparkles,
  Zap
} from 'lucide-react';
import TelemetryPanel from './TelemetryPanel.jsx';

export default function Dashboard({
  videoRef,
  canvasRef,
  trackingStatus,
  latency = 0,
  fps = 0,
  isSynthetic = false,
  filteredLandmarks = [],
  predictedLandmarks = [],
  orientation = { pitch: 0, yaw: 0, roll: 0 },
  metrics = {},
  predictionHorizon = 80,
  zeroGDamping = 0.85,
  cameraPreset = 'FRONT',
  showHologram = false,
  onStartCamera,
  onStartSynthetic,
  onStopTracking,
  onSetPredictionHorizon,
  onSetZeroGDamping,
  onSetCameraPreset,
  onToggleHologram,
  onResetFilters
}) {
  const [isTelemetryCollapsed, setIsTelemetryCollapsed] = useState(false);
  const [isPipMinimized, setIsPipMinimized] = useState(false);
  const [missionTime, setMissionTime] = useState('00:00:00');

  // Mission Elapsed Time timer
  useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      const hours = Math.floor(elapsed / 3600).toString().padStart(2, '0');
      const mins = Math.floor((elapsed % 3600) / 60).toString().padStart(2, '0');
      const secs = (elapsed % 60).toString().padStart(2, '0');
      setMissionTime(`${hours}:${mins}:${secs}`);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-4 md:p-6 select-none z-10">
      {/* Top Header / Aerospace Status Bar */}
      <header className="flex flex-wrap items-center justify-between gap-3 pointer-events-auto">
        {/* Mission Title & System Badges */}
        <div className="glass-panel px-4 py-2.5 rounded-2xl flex items-center gap-3 shadow-lg border border-slate-700/60">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
            <span className="w-2 h-2 rounded-full bg-cyan-400 absolute" />
            <h1 className="font-mono text-sm md:text-base font-bold tracking-wider text-slate-100 uppercase">
              STS-174 PROTOTYPE
            </h1>
          </div>
          <div className="h-4 w-px bg-slate-700" />
          <div className="flex items-center gap-2 font-mono text-xs">
            <span className="text-slate-400">MET:</span>
            <span className="text-cyan-300 font-semibold">{missionTime}</span>
          </div>
          <div className="h-4 w-px bg-slate-700" />
          <div className="flex items-center gap-1.5 font-mono text-xs">
            <span className="text-slate-400">PIPELINE:</span>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-950/60 text-cyan-300 border border-cyan-500/30">
              100% CLIENT-SIDE JS
            </span>
          </div>
        </div>

        {/* Telemetry Rates (Latency & FPS) & Camera Preset Controls */}
        <div className="glass-panel px-4 py-2 rounded-2xl flex items-center gap-3 shadow-lg border border-slate-700/60">
          {/* FPS Counter */}
          <div className="flex flex-col items-center font-mono">
            <span className="text-[9px] text-slate-400 uppercase">STREAM RATE</span>
            <span className="text-xs font-bold text-emerald-400">{fps || 30} FPS</span>
          </div>

          <div className="h-4 w-px bg-slate-700" />

          {/* Latency Counter */}
          <div className="flex flex-col items-center font-mono">
            <span className="text-[9px] text-slate-400 uppercase">INFERENCE</span>
            <span className="text-xs font-bold text-cyan-300">{latency} ms</span>
          </div>

          <div className="h-4 w-px bg-slate-700" />

          {/* View Preset Selector */}
          <div className="flex items-center gap-1 bg-slate-900/80 p-1 rounded-xl border border-slate-800">
            {['FRONT', 'ORBIT', 'OTS', 'WIDE'].map((preset) => (
              <button
                key={preset}
                onClick={() => onSetCameraPreset(preset)}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold transition-all ${
                  cameraPreset === preset
                    ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {preset}
              </button>
            ))}
          </div>

          {/* Hologram Toggle */}
          <button
            onClick={onToggleHologram}
            title="Toggle Holographic HUD Wireframe"
            className={`p-2 rounded-xl border transition-all ${
              showHologram
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/60 shadow-lg shadow-cyan-500/20'
                : 'text-slate-400 border-slate-800 hover:text-white bg-slate-900/60'
            }`}
          >
            <Layers size={15} />
          </button>
        </div>
      </header>

      {/* Main Center Area: Right Docked Telemetry Panel */}
      <div className="flex-1 flex justify-end items-center my-4 pointer-events-none">
        <div className="pointer-events-auto">
          <TelemetryPanel
            filteredLandmarks={filteredLandmarks}
            predictedLandmarks={predictedLandmarks}
            orientation={orientation}
            metrics={metrics}
            isCollapsed={isTelemetryCollapsed}
            onToggleCollapse={() => setIsTelemetryCollapsed(!isTelemetryCollapsed)}
          />
        </div>
      </div>

      {/* Bottom Area: Webcam PIP and Edge AI Control Ribbon */}
      <footer className="flex flex-wrap items-end justify-between gap-4 pointer-events-auto">
        {/* PIP Webcam / Landmark Tracking Stream */}
        <div
          className={`glass-panel rounded-2xl overflow-hidden shadow-2xl border border-slate-700/60 transition-all duration-300 relative ${
            isPipMinimized ? 'w-48 h-12' : 'w-56 md:w-64 h-44 md:h-48'
          }`}
        >
          {/* PIP Header Bar */}
          <div className="absolute top-0 inset-x-0 bg-slate-950/80 backdrop-blur-sm px-3 py-1.5 flex items-center justify-between z-20 border-b border-slate-800 text-[10px] font-mono">
            <div className="flex items-center gap-1.5">
              <span
                className={`w-2 h-2 rounded-full ${
                  trackingStatus === 'ACTIVE'
                    ? 'bg-emerald-400 animate-pulse'
                    : trackingStatus === 'SYNTHETIC'
                    ? 'bg-cyan-400 animate-pulse'
                    : 'bg-rose-500'
                }`}
              />
              <span className="text-slate-200 uppercase font-semibold">
                {isSynthetic ? 'ZERO-G SIM' : 'OPTICAL CAM'}
              </span>
            </div>
            <button
              onClick={() => setIsPipMinimized(!isPipMinimized)}
              className="text-slate-400 hover:text-white"
            >
              {isPipMinimized ? <Maximize2 size={13} /> : <Minimize2 size={13} />}
            </button>
          </div>

          {/* Video and Overlay Canvas */}
          {!isPipMinimized && (
            <div className="w-full h-full relative bg-slate-950 flex items-center justify-center pt-6">
              <video
                ref={videoRef}
                playsInline
                muted
                autoPlay
                className={`w-full h-full object-cover transform -scale-x-100 ${
                  isSynthetic ? 'opacity-20' : 'opacity-85'
                }`}
              />
              <canvas
                ref={canvasRef}
                className="absolute inset-0 w-full h-full pointer-events-none transform -scale-x-100"
              />

              {/* Synthetic Mode Visual Overlay */}
              {isSynthetic && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/70 p-3 text-center pointer-events-none">
                  <Sparkles size={24} className="text-cyan-400 animate-bounce mb-1" />
                  <span className="text-[11px] font-mono text-cyan-200 font-bold">
                    SYNTHETIC TELEMETRY
                  </span>
                  <span className="text-[9px] font-mono text-slate-400 mt-0.5">
                    Zero-G Biomechanical Generator Active
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Edge AI & Trajectory Tuning Control Ribbon */}
        <div className="glass-panel p-3.5 rounded-2xl flex flex-wrap items-center gap-4 shadow-xl border border-slate-700/60 font-mono text-xs">
          {/* Tracking Source Toggles */}
          <div className="flex items-center gap-2">
            <button
              onClick={onStartCamera}
              className={`px-3 py-1.5 rounded-xl flex items-center gap-1.5 font-bold transition-all ${
                trackingStatus === 'ACTIVE'
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
              }`}
            >
              <Camera size={14} />
              <span>WEBCAM</span>
            </button>

            <button
              onClick={onStartSynthetic}
              className={`px-3 py-1.5 rounded-xl flex items-center gap-1.5 font-bold transition-all ${
                trackingStatus === 'SYNTHETIC'
                  ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
              }`}
            >
              <Radio size={14} />
              <span>ZERO-G SIM</span>
            </button>

            <button
              onClick={onStopTracking}
              title="Stop Tracking"
              className="p-1.5 rounded-xl bg-slate-800 hover:bg-rose-900/60 text-slate-400 hover:text-rose-300 border border-slate-700 transition-all"
            >
              <CameraOff size={14} />
            </button>
          </div>

          <div className="h-6 w-px bg-slate-800 hidden md:block" />

          {/* Prediction Horizon Slider */}
          <div className="flex flex-col gap-1 min-w-[140px]">
            <div className="flex justify-between text-[10px] text-slate-400">
              <span className="flex items-center gap-1">
                <Zap size={11} className="text-cyan-400" /> PREDICT HORIZON
              </span>
              <span className="text-cyan-300 font-bold">{predictionHorizon}ms</span>
            </div>
            <input
              type="range"
              min="0"
              max="200"
              step="10"
              value={predictionHorizon}
              onChange={(e) => onSetPredictionHorizon(Number(e.target.value))}
              className="accent-cyan-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
            />
          </div>

          {/* Zero-G Damping Slider */}
          <div className="flex flex-col gap-1 min-w-[130px]">
            <div className="flex justify-between text-[10px] text-slate-400">
              <span className="flex items-center gap-1">
                <Sliders size={11} className="text-amber-400" /> ZERO-G DAMP
              </span>
              <span className="text-amber-300 font-bold">{(zeroGDamping * 100).toFixed(0)}%</span>
            </div>
            <input
              type="range"
              min="0.2"
              max="1.0"
              step="0.05"
              value={zeroGDamping}
              onChange={(e) => onSetZeroGDamping(Number(e.target.value))}
              className="accent-amber-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
            />
          </div>

          {/* Reset Filters */}
          <button
            onClick={onResetFilters}
            title="Reset Filters & Calibration"
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all flex items-center gap-1"
          >
            <RefreshCw size={13} />
          </button>
        </div>
      </footer>
    </div>
  );
}
