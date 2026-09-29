import React, { useState } from 'react';
import { Activity, Compass, ShieldAlert, Cpu, ChevronRight, ChevronDown, Eye } from 'lucide-react';

const TRACKED_JOINTS = [
  { id: 0, label: 'Cranium / Nose' },
  { id: 11, label: 'L Shoulder (EVA)' },
  { id: 12, label: 'R Shoulder (EVA)' },
  { id: 13, label: 'L Elbow Joint' },
  { id: 14, label: 'R Elbow Joint' },
  { id: 15, label: 'L Manipulator / Wrist' },
  { id: 16, label: 'R Manipulator / Wrist' },
  { id: 23, label: 'L Pelvic Gimbal' },
  { id: 24, label: 'R Pelvic Gimbal' }
];

export default function TelemetryPanel({
  filteredLandmarks = [],
  predictedLandmarks = [],
  orientation = { pitch: 0, yaw: 0, roll: 0 },
  metrics = {},
  isCollapsed = false,
  onToggleCollapse
}) {
  const [selectedJointId, setSelectedJointId] = useState(14); // Default to Right Elbow

  const filteredJoint = filteredLandmarks[selectedJointId] || { x: 0, y: 0, z: 0 };
  const predictedJoint = predictedLandmarks[selectedJointId] || { x: 0, y: 0, z: 0 };

  const deltaX = (predictedJoint.x - filteredJoint.x) * 1000;
  const deltaY = (predictedJoint.y - filteredJoint.y) * 1000;
  const deltaZ = (predictedJoint.z - filteredJoint.z) * 1000;

  const stateColors = {
    LOCKED: 'text-emerald-400 border-emerald-500/40 bg-emerald-950/40',
    PREDICTING: 'text-cyan-400 border-cyan-500/40 bg-cyan-950/40',
    OCCLUSION_RECOVERY: 'text-amber-400 border-amber-500/40 bg-amber-950/40',
    SEARCHING: 'text-rose-400 border-rose-500/40 bg-rose-950/40'
  };

  const currentBadgeClass = stateColors[metrics.trackingState] || stateColors.LOCKED;

  if (isCollapsed) {
    return (
      <button
        onClick={onToggleCollapse}
        className="glass-panel p-2.5 rounded-xl flex items-center gap-2 hover:bg-slate-800/80 transition-all text-xs font-mono text-cyan-400 border border-cyan-500/30"
      >
        <Activity size={16} />
        <span>EXPAND TELEMETRY</span>
        <ChevronRight size={14} />
      </button>
    );
  }

  return (
    <div className="glass-panel rounded-2xl p-4 w-80 md:w-88 flex flex-col gap-3 font-mono text-xs select-none backdrop-blur-md shadow-2xl border border-slate-700/60 text-slate-200">
      {/* Panel Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Activity size={16} className="text-cyan-400 animate-pulse" />
          <span className="font-semibold tracking-wider text-slate-100">KINEMATIC TELEMETRY</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold border ${currentBadgeClass}`}>
            {metrics.trackingState || 'SYNC'}
          </span>
          <button
            onClick={onToggleCollapse}
            className="text-slate-400 hover:text-white transition-colors p-1"
          >
            <ChevronDown size={15} />
          </button>
        </div>
      </div>

      {/* Flight Attitude / Torso Orientation (Pitch, Yaw, Roll) */}
      <div className="grid grid-cols-3 gap-2 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/80 text-center">
        <div>
          <div className="text-[10px] text-slate-400 flex items-center justify-center gap-1">
            <Compass size={11} className="text-cyan-400" /> PITCH
          </div>
          <div className="text-sm font-bold text-cyan-300 mt-0.5">
            {orientation.pitch > 0 ? `+${orientation.pitch}` : orientation.pitch}°
          </div>
        </div>
        <div>
          <div className="text-[10px] text-slate-400 flex items-center justify-center gap-1">
            <Compass size={11} className="text-amber-400" /> YAW
          </div>
          <div className="text-sm font-bold text-amber-300 mt-0.5">
            {orientation.yaw > 0 ? `+${orientation.yaw}` : orientation.yaw}°
          </div>
        </div>
        <div>
          <div className="text-[10px] text-slate-400 flex items-center justify-center gap-1">
            <Compass size={11} className="text-emerald-400" /> ROLL
          </div>
          <div className="text-sm font-bold text-emerald-300 mt-0.5">
            {orientation.roll > 0 ? `+${orientation.roll}` : orientation.roll}°
          </div>
        </div>
      </div>

      {/* Joint Selector */}
      <div className="flex flex-col gap-1">
        <label className="text-[10px] uppercase text-slate-400 font-medium flex items-center gap-1">
          <Eye size={12} className="text-cyan-400" /> Joint Stream Channel
        </label>
        <select
          value={selectedJointId}
          onChange={(e) => setSelectedJointId(Number(e.target.value))}
          className="bg-slate-900/90 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-cyan-300 focus:outline-none focus:border-cyan-400"
        >
          {TRACKED_JOINTS.map((j) => (
            <option key={j.id} value={j.id}>
              #{j.id.toString().padStart(2, '0')} - {j.label}
            </option>
          ))}
        </select>
      </div>

      {/* Coordinate Vector Comparison */}
      <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800 flex flex-col gap-1.5">
        <div className="text-[10px] uppercase text-slate-400 flex justify-between">
          <span>Vector Component</span>
          <span>Filtered → Pred (Δ)</span>
        </div>

        {/* X Axis */}
        <div className="flex items-center justify-between text-[11px] py-0.5">
          <span className="text-rose-400 font-bold">X (Norm)</span>
          <div className="flex items-center gap-1.5">
            <span className="text-slate-300">{filteredJoint.x.toFixed(3)}</span>
            <span className="text-slate-500">→</span>
            <span className="text-cyan-300">{predictedJoint.x.toFixed(3)}</span>
            <span className={`text-[10px] ${deltaX >= 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
              ({deltaX > 0 ? '+' : ''}{deltaX.toFixed(1)}mm)
            </span>
          </div>
        </div>

        {/* Y Axis */}
        <div className="flex items-center justify-between text-[11px] py-0.5">
          <span className="text-emerald-400 font-bold">Y (Norm)</span>
          <div className="flex items-center gap-1.5">
            <span className="text-slate-300">{filteredJoint.y.toFixed(3)}</span>
            <span className="text-slate-500">→</span>
            <span className="text-cyan-300">{predictedJoint.y.toFixed(3)}</span>
            <span className={`text-[10px] ${deltaY >= 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
              ({deltaY > 0 ? '+' : ''}{deltaY.toFixed(1)}mm)
            </span>
          </div>
        </div>

        {/* Z Axis */}
        <div className="flex items-center justify-between text-[11px] py-0.5">
          <span className="text-blue-400 font-bold">Z (Norm)</span>
          <div className="flex items-center gap-1.5">
            <span className="text-slate-300">{(filteredJoint.z || 0).toFixed(3)}</span>
            <span className="text-slate-500">→</span>
            <span className="text-cyan-300">{(predictedJoint.z || 0).toFixed(3)}</span>
            <span className={`text-[10px] ${deltaZ >= 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
              ({deltaZ > 0 ? '+' : ''}{deltaZ.toFixed(1)}mm)
            </span>
          </div>
        </div>
      </div>

      {/* Edge AI Engine Metrics */}
      <div className="grid grid-cols-2 gap-2 text-[10px]">
        <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800">
          <div className="text-slate-400 flex items-center gap-1">
            <Cpu size={11} className="text-cyan-400" /> HORIZON PROJ
          </div>
          <div className="text-cyan-300 font-bold text-xs mt-0.5">
            +{metrics.predictionHorizonMs || 80} ms
          </div>
        </div>
        <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800">
          <div className="text-slate-400 flex items-center gap-1">
            <ShieldAlert size={11} className="text-amber-400" /> ANOMALY REJECT
          </div>
          <div className="text-amber-300 font-bold text-xs mt-0.5">
            {metrics.anomalyCount || 0} events
          </div>
        </div>
      </div>

      {/* Live Confidence Bar */}
      <div className="flex flex-col gap-1">
        <div className="flex justify-between text-[10px] text-slate-400">
          <span>EDGE AI CONFIDENCE</span>
          <span className="text-emerald-400 font-bold">{metrics.confidence || 98}%</span>
        </div>
        <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 transition-all duration-300"
            style={{ width: `${metrics.confidence || 98}%` }}
          />
        </div>
      </div>
    </div>
  );
}
