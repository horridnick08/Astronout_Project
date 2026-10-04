import React, { useState, useEffect } from 'react';
import { automatedMissionLoop } from '../../engine/AutomatedMissionLoop.js';
import { Radio, Bot, User } from 'lucide-react';

/**
 * SubtitleOverlay
 * 
 * Sleek HUD Subtitle Overlay at the bottom center of the 3D viewport.
 * Dynamically displays spoken dialogues during the automated astronaut loop:
 * - Step 9: Astronaut: "I have to use quantum core for energy."
 * - Step 11: Astronaut: "Hey Edge AI, what's the next step I need to do?"
 * - Step 12: Edge AI: "Telemetry stable. Proceed to calibrate oxygen valves and verify sector 4 pressure."
 */
export default function SubtitleOverlay() {
  const [subtitle, setSubtitle] = useState(automatedMissionLoop.currentSubtitle);

  useEffect(() => {
    return automatedMissionLoop.subscribe((state) => {
      setSubtitle(state.subtitle);
    });
  }, []);

  if (!subtitle) return null;

  const isAI = subtitle.type === 'ai';

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '2rem',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 30
      }}
      className="pointer-events-auto flex items-center gap-3.5 px-6 py-3 rounded-2xl bg-slate-950/85 backdrop-blur-md border border-cyan-500/40 shadow-2xl shadow-cyan-950/60 max-w-2xl select-none transition-all duration-300"
    >
      {/* Audio Wave / Transmission Indicator */}
      <div className="flex items-center gap-1.5 shrink-0">
        <div className="relative flex items-center justify-center">
          <span className={`w-2.5 h-2.5 rounded-full ${isAI ? 'bg-purple-400' : 'bg-cyan-400'} animate-ping`} />
          <span className={`w-2 h-2 rounded-full ${isAI ? 'bg-purple-400' : 'bg-cyan-400'} absolute`} />
        </div>
        <div className="flex items-end gap-0.5 h-3.5 px-1">
          <span className={`w-0.5 h-2 ${isAI ? 'bg-purple-400' : 'bg-cyan-400'} animate-pulse`} />
          <span className={`w-0.5 h-3.5 ${isAI ? 'bg-purple-400' : 'bg-cyan-400'} animate-pulse`} style={{ animationDelay: '150ms' }} />
          <span className={`w-0.5 h-1.5 ${isAI ? 'bg-purple-400' : 'bg-cyan-400'} animate-pulse`} style={{ animationDelay: '300ms' }} />
        </div>
      </div>

      {/* Speaker Tag */}
      <div
        className={`px-2.5 py-0.5 rounded text-[10px] font-mono font-bold tracking-wider shrink-0 uppercase border flex items-center gap-1.5 ${
          isAI
            ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
            : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
        }`}
      >
        {isAI ? <Bot className="w-3 h-3 text-purple-300" /> : <User className="w-3 h-3 text-cyan-300" />}
        <span>{subtitle.speaker}</span>
      </div>

      {/* Dialogue Spoken Line */}
      <p className="font-mono text-xs md:text-sm text-slate-100 font-medium tracking-wide leading-snug">
        "{subtitle.text}"
      </p>
    </div>
  );
}
