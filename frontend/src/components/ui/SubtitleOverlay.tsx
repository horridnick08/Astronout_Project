import React, { useState, useEffect } from 'react';
import { missionTimeline } from '../../engine/useMissionTimeline.ts';
import { Bot, User, Radio, Cpu, Activity, AlertTriangle } from 'lucide-react';

/**
 * SubtitleOverlay.tsx
 * 
 * Production Aerospace Subtitle & AI Context Detection HUD:
 * - Absolutely positioned at bottom-center of 3D viewport
 * - Displays real-time Edge AI Context Detection states alongside spoken EVA dialogues
 * - Reactive "Oops!" collision detection state with warning indicator and audio alert visual
 * - Monospace typography with glowing cyan, emerald, and amber warning indicators
 */
export default function SubtitleOverlay() {
  const [timelineState, setTimelineState] = useState(missionTimeline.getState());

  useEffect(() => {
    return missionTimeline.subscribe((state) => {
      setTimelineState(state);
    });
  }, []);

  const { subtitle, stepId, stepName, aiDetection, isOopsActive } = timelineState;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '2.5rem',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 35,
        backgroundColor: isOopsActive ? 'rgba(20, 10, 5, 0.96)' : 'rgba(3, 7, 18, 0.95)',
        border: isOopsActive ? '1px solid rgba(245, 158, 11, 0.65)' : '1px solid rgba(6, 182, 212, 0.35)',
        boxShadow: isOopsActive
          ? '0 20px 50px rgba(0, 0, 0, 0.85), 0 0 35px rgba(245, 158, 11, 0.35)'
          : '0 20px 50px rgba(0, 0, 0, 0.8), 0 0 25px rgba(6, 182, 212, 0.2)'
      }}
      className="pointer-events-auto flex flex-col gap-2.5 px-6 py-4 rounded-2xl backdrop-blur-xl max-w-2xl select-none transition-all duration-300"
    >
      {/* Top Header Row */}
      <div className="flex items-center gap-3">
        {/* Accent Indicator Bar */}
        <div
          className={`w-1 h-6 rounded-full ${
            isOopsActive
              ? 'bg-amber-400 shadow-lg shadow-amber-500/50 animate-pulse'
              : subtitle
              ? 'bg-cyan-400 shadow-lg shadow-cyan-500/50'
              : 'bg-emerald-400 shadow-lg shadow-emerald-500/50'
          }`}
        />

        {/* Audio Waveform / Comms Transmission Animation */}
        <div className="flex items-center gap-1.5 shrink-0">
          <div className="relative flex items-center justify-center">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                isOopsActive ? 'bg-amber-400' : subtitle ? 'bg-cyan-400' : 'bg-emerald-400'
              } animate-ping`}
            />
            <span
              className={`w-2 h-2 rounded-full ${
                isOopsActive ? 'bg-amber-400' : subtitle ? 'bg-cyan-400' : 'bg-emerald-400'
              } absolute`}
            />
          </div>
          <div className="flex items-end gap-0.5 h-4 px-1">
            <span
              className={`w-0.5 h-2.5 ${
                isOopsActive ? 'bg-amber-400' : subtitle ? 'bg-cyan-400' : 'bg-emerald-400'
              } animate-pulse`}
            />
            <span
              className={`w-0.5 h-4 ${
                isOopsActive ? 'bg-amber-400' : subtitle ? 'bg-cyan-400' : 'bg-emerald-400'
              } animate-pulse`}
              style={{ animationDelay: '150ms' }}
            />
            <span
              className={`w-0.5 h-2 ${
                isOopsActive ? 'bg-amber-400' : subtitle ? 'bg-cyan-400' : 'bg-emerald-400'
              } animate-pulse`}
              style={{ animationDelay: '300ms' }}
            />
          </div>
        </div>

        {/* Speaker / Mode Tag Badge */}
        <div
          className={`px-2.5 py-0.5 rounded-md text-[10px] font-mono font-bold tracking-wider shrink-0 uppercase border flex items-center gap-1.5 ${
            isOopsActive
              ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-sm shadow-amber-950/40 animate-pulse'
              : subtitle
              ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 shadow-sm shadow-cyan-950/40'
              : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-sm shadow-emerald-950/40'
          }`}
        >
          {isOopsActive ? (
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
          ) : subtitle ? (
            <User className="w-3.5 h-3.5 text-cyan-300" />
          ) : (
            <Cpu className="w-3.5 h-3.5 text-emerald-300" />
          )}
          <span>
            {isOopsActive
              ? 'EVA-1 // COLLISION REBOUND'
              : subtitle
              ? subtitle.speaker
              : `EDGE AI // STATION 0${stepId} ACTIVE`}
          </span>
        </div>

        {/* Operation Title Pill */}
        <span className="text-[11px] font-mono text-slate-400 truncate">
          {stepName}
        </span>
      </div>

      {/* Main Dialogue / Spoken Line */}
      {subtitle && (
        <div
          className={`pl-4 border-l ${
            isOopsActive ? 'border-amber-500/50' : 'border-cyan-500/30'
          }`}
        >
          <p
            className={`font-mono text-xs md:text-sm font-semibold tracking-wide leading-relaxed ${
              isOopsActive ? 'text-amber-200' : 'text-cyan-100'
            }`}
          >
            "{subtitle.text}"
          </p>
        </div>
      )}

      {/* Edge AI Context Detection Feed */}
      <div
        className={`flex items-center gap-2 pl-4 font-mono text-[11px] md:text-xs ${
          isOopsActive ? 'text-amber-300/90' : 'text-emerald-300/90'
        }`}
      >
        <Activity
          className={`w-3 h-3 shrink-0 animate-pulse ${
            isOopsActive ? 'text-amber-400' : 'text-emerald-400'
          }`}
        />
        <span className="font-medium tracking-wide">
          {aiDetection}
        </span>
      </div>
    </div>
  );
}
