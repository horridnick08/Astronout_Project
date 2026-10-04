import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Bot, User, Cpu, AlertTriangle, Radio, ShieldCheck, Zap } from 'lucide-react';
import { StationEventBus, StationArrivalEvent } from '../../engine/StationEventBus.ts';
import { zeroGKinematics } from '../../engine/useZeroGKinematics.ts';

// ─────────────────────────────────────────────────────────────────────────────
// Types & USP 5 Confidence Metrics
// ─────────────────────────────────────────────────────────────────────────────
export interface BayesState {
  kValue: number;
  state: 'HIGH' | 'MODERATE' | 'LOW';
  label: string;
  color: string;
  badgeBg: string;
  badgeBorder: string;
}

export interface ConfidenceMetric {
  kValue: number;
  confidencePct: number;
  certaintyLabel: string;
  color: string;
  bgColor: string;
  borderColor: string;
}

function computeBayesConfidence(k: number): ConfidenceMetric {
  const confidencePct = (k / (1 + k)) * 100;
  if (confidencePct > 90) {
    return {
      kValue: k,
      confidencePct,
      certaintyLabel: 'High Certainty',
      color: '#00f0ff', // Muted Cyan
      bgColor: 'rgba(0, 240, 255, 0.08)',
      borderColor: 'rgba(0, 240, 255, 0.35)',
    };
  } else if (confidencePct >= 70) {
    return {
      kValue: k,
      confidencePct,
      certaintyLabel: 'Moderate Evidence',
      color: '#ffaa00', // Amber Yellow
      bgColor: 'rgba(255, 170, 0, 0.08)',
      borderColor: 'rgba(255, 170, 0, 0.35)',
    };
  } else {
    return {
      kValue: k,
      confidencePct,
      certaintyLabel: 'Low Confidence / Re-verify',
      color: '#ff2200', // Warning Red
      bgColor: 'rgba(255, 34, 0, 0.12)',
      borderColor: 'rgba(255, 34, 0, 0.45)',
    };
  }
}

function getBayesState(k: number): BayesState {
  if (k > 10) {
    return {
      kValue: k,
      state: 'HIGH',
      label: 'HIGH CERTAINTY',
      color: '#00f0ff', // Cyan / Emerald Green
      badgeBg: 'rgba(0, 240, 255, 0.12)',
      badgeBorder: 'rgba(0, 240, 255, 0.4)',
    };
  } else if (k > 3) {
    return {
      kValue: k,
      state: 'MODERATE',
      label: 'MODERATE EVIDENCE',
      color: '#ffaa00', // Amber/Yellow
      badgeBg: 'rgba(255, 170, 0, 0.12)',
      badgeBorder: 'rgba(255, 170, 0, 0.4)',
    };
  } else {
    return {
      kValue: k,
      state: 'LOW',
      label: 'RE-VERIFY',
      color: '#ff2200', // Warning Red
      badgeBg: 'rgba(255, 34, 0, 0.15)',
      badgeBorder: 'rgba(255, 34, 0, 0.45)',
    };
  }
}

function parseSystemLog(
  rawText: string,
  kValue?: number,
  existingTopLine?: string,
  existingSubText?: string
): {
  topLine: string;
  subText: string;
  confidenceMetric: ConfidenceMetric;
} {
  let k = kValue;
  if (k === undefined) {
    const kMatch = rawText.match(/K\s*=\s*([0-9.]+)/i);
    if (kMatch) {
      k = parseFloat(kMatch[1]);
    } else {
      k = 14.8;
    }
  }

  const metric = computeBayesConfidence(k);

  if (existingTopLine && existingSubText) {
    return {
      topLine: existingTopLine,
      subText: existingSubText,
      confidenceMetric: metric,
    };
  }

  let topLine = existingTopLine || '';
  if (!topLine) {
    if (rawText.includes('DATA ZONE ACTIVATED')) {
      topLine = '>_ [DATA ZONE ACTIVATED]';
    } else if (rawText.includes('FOCUS ZONE ACTIVATED')) {
      topLine = '>_ [FOCUS ZONE ACTIVATED]';
    } else if (rawText.includes('HAZARD ZONE ACTIVATED')) {
      topLine = '>_ [HAZARD ZONE ACTIVATED]';
    } else if (rawText.includes('BAYES ANOMALY')) {
      topLine = `>_ [BAYES ANOMALY DETECTED // K = ${k.toFixed(1)}]`;
    } else if (rawText.includes('BAYES VERIFIED')) {
      topLine = `>_ [BAYES VERIFIED // K = ${k.toFixed(1)}]`;
    } else if (rawText.includes('Neural Core') || rawText.includes('INITIALIZED')) {
      topLine = '>_ [SYSTEM INITIALIZED]';
      return {
        topLine,
        subText: '   Neural Core Online // Autonomous Local LLM',
        confidenceMetric: metric,
      };
    } else {
      topLine = `>_ [${rawText.slice(0, 24).toUpperCase()}]`;
    }
  }

  const subText = existingSubText || `   Confidence: ${metric.confidencePct.toFixed(1)}% (${metric.certaintyLabel})`;

  return {
    topLine,
    subText,
    confidenceMetric: metric,
  };
}

interface ChatMessage {
  id: string;
  sender: 'ASTRONAUT' | 'EDGE_AI' | 'SYSTEM';
  speakerLabel: string;
  text: string;
  timestamp: string;
  isAlert?: boolean;
  bayesK?: number;
  bayesState?: BayesState;
  topLine?: string;
  subText?: string;
}

interface EdgeAIChatLogProps {
  timelineState: {
    stepId: number;
    stepName: string;
    isTransit: boolean;
    isOopsActive: boolean;
    roundCount: number;
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Spatial Analysis Matrix
// Dynamic context-aware AI response generator keyed by station key + actionType.
// ─────────────────────────────────────────────────────────────────────────────
interface DialoguePair {
  astronaut: string;
  ai: string;
  isAlert?: boolean;
}

type StationDialoguePool = {
  INSPECT?: DialoguePair[];
  INTERACT?: DialoguePair[];
  MONITOR?: DialoguePair[];
  TRANSMIT?: DialoguePair[];
  OBSERVE?: DialoguePair[];
};

const SPATIAL_CONTEXT_MATRIX: Record<string, StationDialoguePool> = {
  SUPPLY_BARRELS: {
    INSPECT: [
      {
        astronaut: 'Scanning cargo manifest — checking barrel seal integrity.',
        ai: 'Barrel seals nominal. O2 reserve at 94%. Methane propellant containers show zero thermal stress markers.',
        isAlert: false,
      },
      {
        astronaut: 'Running RFID sweep on supply inventory.',
        ai: 'RFID sweep complete. 7 containers verified. 1 container (ID: C-041) flagged — mass discrepancy +1.2kg. Manual verification recommended.',
        isAlert: true,
      },
      {
        astronaut: 'Cross-referencing stored modules against mission log.',
        ai: 'Inventory delta detected: Cryo Pack #3 was consumed during resupply burn. Manifest updated. Remaining mission payload within tolerance.',
        isAlert: false,
      },
    ],
  },
  QUANTUM_CORE: {
    INSPECT: [
      {
        astronaut: 'Extracting Quantum Core from experiment dock.',
        ai: 'ALERT: Core cell capacity at 30%. Auxiliary power drain confirmed. Insert into slot B-7 to restore primary grid within 14 minutes.',
        isAlert: true,
      },
      {
        astronaut: 'Initiating quantum resonance handshake protocol.',
        ai: 'Resonance lock acquired at 47.2 THz. Quantum coherence time: 1.8ms — within operational margin. Cell isotope decay normal.',
        isAlert: false,
      },
      {
        astronaut: 'Running thermal scan on the Core housing.',
        ai: 'Core temp: 3.7°K above expected baseline. Micro-fracture stress pattern detected on housing ring. Flag for post-mission inspection.',
        isAlert: true,
      },
    ],
  },
  EARTH_DOWNLINK: {
    TRANSMIT: [
      {
        astronaut: 'Activating Earth Downlink terminal — initiating burst transmission.',
        ai: '3 weeks of telemetry queued. Satellite window open: 11 min 42 sec. Encoding orbit-phased S-band packet. Transmitting now.',
        isAlert: false,
      },
      {
        astronaut: 'Running ground station handshake verification.',
        ai: 'Handshake confirmed with Goldstone DSN. Signal-to-noise ratio: 38 dB. Holographic Earth model syncing with live orbital position data.',
        isAlert: false,
      },
      {
        astronaut: 'Uploading crew health biometrics to mission control.',
        ai: 'Biometric uplink complete. Heart rate, O2 sat, and cortisol markers transmitted. Flight surgeon response ETA: 47 minutes.',
        isAlert: false,
      },
    ],
  },
  FLIGHT_DECK: {
    MONITOR: [
      {
        astronaut: 'Calibrating attitude control thrusters — checking RCS alignment.',
        ai: 'Thruster bank A: nominal. Bank B: 0.3° azimuth drift detected. Auto-correcting via gyro compensation. Sector 4 O2 valves nominal.',
        isAlert: false,
      },
      {
        astronaut: 'Running orbital insertion trajectory check.',
        ai: 'Trajectory nominal. ΔV budget remaining: 48.2 m/s. Next station-keeping burn window: T+06:14:32. Recommend standby.',
        isAlert: false,
      },
      {
        astronaut: 'Reviewing system alert log on primary console.',
        ai: '2 low-priority warnings active: coolant loop pressure variance (within spec), star tracker calibration drift. No critical flags.',
        isAlert: false,
      },
    ],
  },
  HULL_WINDOW: {
    OBSERVE: [
      {
        astronaut: 'Visual inspection through hull viewport — checking external truss.',
        ai: 'External thermal shield reads nominal. Micro-debris impact density: 0.04 events/m²/day — within ISS-class tolerance. No structural compromise.',
        isAlert: false,
      },
      {
        astronaut: 'Tracking orbital debris field through the observation window.',
        ai: 'Active debris catalog: 3 objects within 2km proximity. Closest approach: Object TLE-2847 at 1.1km in T+00:08:22. No avoidance maneuver required.',
        isAlert: true,
      },
      {
        astronaut: 'Photographing Earth limb for atmospheric research payload.',
        ai: 'Spectrometer array active. Capturing mesosphere airglow event at 87km altitude. Data routed to payload science drive.',
        isAlert: false,
      },
    ],
  },
  DOWNLINK_SCREENS: {
    TRANSMIT: [
      {
        astronaut: 'Pulling latest telemetry from secondary screens.',
        ai: 'Secondary downlink buffer: 4.2 GB queued. Satellite antenna slewing to Intelsat-37. Estimated uplink window: 8 min 15 sec.',
        isAlert: false,
      },
      {
        astronaut: 'Reviewing mission ops reports on telemetry screens.',
        ai: 'Mission elapsed time: 14d 07h 22m. Total EVA suit runtime: 112h. Consumable margin: oxygen 78%, water 65%, food 80%.',
        isAlert: false,
      },
    ],
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
function getTimestamp(): string {
  return new Date().toTimeString().split(' ')[0];
}

const lastPickIndex: Record<string, number> = {};
function pickRandom<T>(pool: T[], poolKey: string): T {
  if (pool.length === 1) return pool[0];
  let idx: number;
  do {
    idx = Math.floor(Math.random() * pool.length);
  } while (idx === lastPickIndex[poolKey]);
  lastPickIndex[poolKey] = idx;
  return pool[idx];
}

function resolveSpatialContext(evt: StationArrivalEvent): DialoguePair | null {
  const stationMatrix = SPATIAL_CONTEXT_MATRIX[evt.key];
  if (!stationMatrix) return null;

  const pool =
    stationMatrix[evt.actionType] ||
    Object.values(stationMatrix).find((p) => p && p.length > 0) ||
    null;

  if (!pool || pool.length === 0) return null;
  return pickRandom(pool, evt.key);
}

let msgCounter = 0;
function uid(prefix: string): string {
  return `${prefix}-${Date.now()}-${++msgCounter}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────
export default function EdgeAIChatLog({ timelineState }: EdgeAIChatLogProps) {
  // USP 5: Spatial-Bayes Factor Confidence Metrics State
  const [currentBayes, setCurrentBayes] = useState<BayesState>(() => getBayesState(14.8));

  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: 'init-sys',
      sender: 'SYSTEM',
      speakerLabel: 'SYSTEM // ONBOARD TELEMETRY',
      text: 'Edge AI Neural Core online. Autonomous local LLM active (0ms cloud latency).',
      timestamp: getTimestamp(),
      topLine: '>_ [SYSTEM INITIALIZED]',
      subText: '   Neural Core Online // Autonomous Local LLM',
      bayesK: 14.8,
    },
    {
      id: 'init-bayes',
      sender: 'SYSTEM',
      speakerLabel: 'SYSTEM // SPATIAL-BAYES',
      text: '[BAYES VERIFIED: K = 14.8 // HIGH CERTAINTY]',
      timestamp: getTimestamp(),
      topLine: '>_ [BAYES VERIFIED // K = 14.8]',
      subText: '   Confidence: 93.7% (High Certainty)',
      bayesK: 14.8,
      bayesState: getBayesState(14.8),
    },
    {
      id: 'init-astro',
      sender: 'ASTRONAUT',
      speakerLabel: 'EVA-1 // ASTRONAUT',
      text: 'Beginning station inspection sweep. All systems nominal.',
      timestamp: getTimestamp(),
    },
    {
      id: 'init-ai',
      sender: 'EDGE_AI',
      speakerLabel: 'EDGE AI // LOCAL LLM',
      text: 'Confirmed. Spatial analysis matrix loaded. Monitoring all 6 station nodes in real time.',
      timestamp: getTimestamp(),
      bayesK: 14.8,
      bayesState: getBayesState(14.8),
    },
  ]);

  const [isTyping, setIsTyping] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-focus to bottom element on updates
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Helper: push astronaut + trigger AI response after inference delay
  const pushDialogue = useCallback((pair: DialoguePair, explicitK?: number) => {
    const kVal = explicitK ?? (pair.isAlert ? 6.2 : 12.8);
    const bState = getBayesState(kVal);
    setCurrentBayes(bState);

    const astroMsg: ChatMessage = {
      id: uid('astro'),
      sender: 'ASTRONAUT',
      speakerLabel: 'EVA-1 // ASTRONAUT',
      text: pair.astronaut,
      timestamp: getTimestamp(),
    };
    setMessages((prev) => {
      const next = [...prev, astroMsg];
      return next.length > 20 ? next.slice(next.length - 20) : next;
    });

    setIsTyping(true);
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);

    // Simulate local edge model inference latency (380–620ms random)
    const latency = 380 + Math.random() * 240;
    typingTimerRef.current = setTimeout(() => {
      const aiMsg: ChatMessage = {
        id: uid('ai'),
        sender: 'EDGE_AI',
        speakerLabel: 'EDGE AI // LOCAL LLM',
        text: pair.ai,
        timestamp: getTimestamp(),
        isAlert: pair.isAlert,
        bayesK: kVal,
        bayesState: bState,
      };
      setMessages((prev) => {
        const next = [...prev, aiMsg];
        return next.length > 20 ? next.slice(next.length - 20) : next;
      });
      setIsTyping(false);
    }, latency);
  }, []);

  // Helper: push boundary activation sequence (System Log + Bayes Log + EVA-1 dialogue + Edge AI instructions)
  const pushBoundarySequence = useCallback((zone: any) => {
    const kVal = zone.bayesK ?? (
      zone.zoneType === 'HAZARD'
        ? 2.1
        : zone.isAlert
        ? 6.8
        : zone.stationId === 1
        ? 14.8
        : zone.stationId === 3
        ? 16.2
        : 8.5
    );
    const bState = getBayesState(kVal);
    const metric = computeBayesConfidence(kVal);
    setCurrentBayes(bState);

    const tag = zone.zoneType === 'HAZARD'
      ? '[HAZARD ZONE ACTIVATED]'
      : zone.zoneType === 'OPERATIONAL'
      ? '[FOCUS ZONE ACTIVATED]'
      : '[DATA ZONE ACTIVATED]';

    const sysMsg: ChatMessage = {
      id: uid('sys-boundary'),
      sender: 'SYSTEM',
      speakerLabel: 'SYSTEM // BOUNDARY CONVEX HULL',
      text: zone.systemLog,
      timestamp: getTimestamp(),
      topLine: `>_ ${tag}`,
      subText: `   Confidence: ${metric.confidencePct.toFixed(1)}% (${metric.certaintyLabel})`,
      bayesK: kVal,
      bayesState: bState,
    };

    const bayesLogMsg: ChatMessage = {
      id: uid('sys-bayes'),
      sender: 'SYSTEM',
      speakerLabel: 'SYSTEM // SPATIAL-BAYES',
      text: `[BAYES VERIFIED // K = ${kVal.toFixed(1)}]`,
      timestamp: getTimestamp(),
      topLine: `>_ [BAYES VERIFIED // K = ${kVal.toFixed(1)}]`,
      subText: `   Confidence: ${metric.confidencePct.toFixed(1)}% (${metric.certaintyLabel})`,
      bayesK: kVal,
      bayesState: bState,
    };

    const astroMsg: ChatMessage = {
      id: uid('astro'),
      sender: 'ASTRONAUT',
      speakerLabel: 'EVA-1 // ASTRONAUT',
      text: zone.astronautText,
      timestamp: getTimestamp(),
    };

    setMessages((prev) => {
      const next = [...prev, sysMsg, bayesLogMsg, astroMsg];
      return next.length > 24 ? next.slice(next.length - 24) : next;
    });

    setIsTyping(true);
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);

    // Simulate local edge model inference latency
    const latency = 380 + Math.random() * 200;
    typingTimerRef.current = setTimeout(() => {
      const aiMsg: ChatMessage = {
        id: uid('ai'),
        sender: 'EDGE_AI',
        speakerLabel: 'EDGE AI // LOCAL LLM',
        text: zone.aiText,
        timestamp: getTimestamp(),
        isAlert: zone.isAlert,
        bayesK: kVal,
        bayesState: bState,
      };
      setMessages((prev) => {
        const next = [...prev, aiMsg];
        return next.length > 24 ? next.slice(next.length - 24) : next;
      });
      setIsTyping(false);
    }, latency);
  }, []);

  // ── Event-Driven Station Arrival & Boundary Listeners ────────────────────────
  useEffect(() => {
    const unsubArrival = StationEventBus.on('stationArrival', (evt: StationArrivalEvent) => {
      const pair = resolveSpatialContext(evt);
      if (pair) {
        pushDialogue(pair);
      }
    });

    const unsubBoundary = StationEventBus.on('boundaryActivated', (zone: any) => {
      pushBoundarySequence(zone);
    });

    const unsubOops = StationEventBus.on('oopsRebound', () => {
      const kVal = 1.8;
      const bState = getBayesState(kVal);
      const metric = computeBayesConfidence(kVal);
      setCurrentBayes(bState);

      const bayesAlertMsg: ChatMessage = {
        id: uid('sys-bayes-oops'),
        sender: 'SYSTEM',
        speakerLabel: 'SYSTEM // SPATIAL-BAYES',
        text: `[BAYES ANOMALY DETECTED // K = ${kVal.toFixed(1)}]`,
        timestamp: getTimestamp(),
        topLine: `>_ [BAYES ANOMALY DETECTED // K = ${kVal.toFixed(1)}]`,
        subText: `   Confidence: ${metric.confidencePct.toFixed(1)}% (${metric.certaintyLabel})`,
        bayesK: kVal,
        bayesState: bState,
      };
      setMessages((prev) => [...prev, bayesAlertMsg]);

      pushDialogue({
        astronaut: 'Oops! Watch the micro-G momentum!',
        ai: 'Micro-G momentum rebound detected. IMU spike logged. Restabilizing attitude control.',
        isAlert: true,
      }, kVal);
    });

    const unsubCbd = StationEventBus.on('cbdDiagnosticComplete', (evt) => {
      const bState = getBayesState(evt.bayesK);
      setCurrentBayes(bState);

      const cbdMsg: ChatMessage = {
        id: uid('sys-cbd'),
        sender: 'SYSTEM',
        speakerLabel: 'SYSTEM // REITER-CBD',
        text: `${evt.topLine}\n${evt.subText}`,
        timestamp: getTimestamp(),
        topLine: evt.topLine,
        subText: evt.subText,
        bayesK: evt.bayesK,
        bayesState: bState,
      };

      setMessages((prev) => {
        const next = [...prev, cbdMsg];
        return next.length > 24 ? next.slice(next.length - 24) : next;
      });
    });

    return () => {
      unsubArrival();
      unsubBoundary();
      unsubOops();
      unsubCbd();
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    };
  }, [pushDialogue, pushBoundarySequence]);

  return (
    <div className="pointer-events-auto flex-1 mb-3 flex flex-col rounded-xl overflow-hidden border border-cyan-500/30 bg-slate-900/85 backdrop-blur-md shadow-xl shadow-cyan-950/30 min-h-0">
      {/* ───────────────────── HEADER BAR ───────────────────── */}
      <div className="flex items-center justify-between px-3 py-2.5 bg-slate-950/80 border-b border-cyan-500/20 text-xs font-mono">
        <div className="flex items-center gap-2">
          <div className="relative flex items-center justify-center">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping absolute opacity-75" />
            <span className="w-2 h-2 rounded-full bg-cyan-400" />
          </div>
          <span className="text-cyan-200 font-bold tracking-widest uppercase text-[11px] flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5 text-cyan-400" />
            EDGE AI
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[9px] text-emerald-400 font-mono font-semibold px-2 py-0.5 rounded-full bg-emerald-950/50 border border-emerald-500/30 tracking-wider flex items-center gap-1">
            <ShieldCheck className="w-2.5 h-2.5 text-emerald-400" />
            OFFLINE ASSISTANT
          </span>
        </div>
      </div>

      {/* ───────────────────── TELEMETRY STRIP WITH BAYES BADGE ───────────────────── */}
      <div className="px-3 py-1.5 bg-slate-950/60 border-b border-cyan-500/15 flex items-center justify-between text-[9px] font-mono">
        <div className="flex items-center gap-2 text-slate-400">
          <span className="flex items-center gap-1">
            <Radio className="w-2.5 h-2.5 text-cyan-400 animate-pulse" />
            LOCAL LLM
          </span>
          <span className="text-slate-600">|</span>
          <span className="flex items-center gap-1">
            <Zap className="w-2.5 h-2.5 text-amber-400" />
            <span className="text-cyan-400/90 font-semibold">0ms</span>
          </span>
          <span className="text-slate-600">|</span>
          <span className="text-slate-500 font-mono">R{timelineState.roundCount}</span>
        </div>

        {/* Dynamic Bayes Factor Indicator Badge (USP 5) */}
        <div
          id="badge-bayes-factor"
          style={{
            backgroundColor: currentBayes.badgeBg,
            borderColor: currentBayes.badgeBorder,
            boxShadow: `0 0 10px ${currentBayes.color}30`,
          }}
          className="flex items-center gap-1 px-1.5 py-0.5 rounded border transition-all duration-300"
          title={`Spatial-Bayes Factor Confidence: K = ${currentBayes.kValue.toFixed(1)} (${currentBayes.label})`}
        >
          <span
            style={{ backgroundColor: currentBayes.color }}
            className="w-1.5 h-1.5 rounded-full animate-pulse shrink-0"
          />
          <span
            style={{ color: currentBayes.color }}
            className="font-bold text-[8.5px] tracking-wider whitespace-nowrap"
          >
            BAYES K = {currentBayes.kValue.toFixed(1)}
          </span>
        </div>
      </div>

      {/* ───────────────────── CHAT HISTORY ───────────────────── */}
      <div
        ref={chatContainerRef}
        className="edge-ai-chat-messages flex-1 p-2.5 flex flex-col gap-2 min-h-0 scroll-smooth"
        style={{
          overflowY: 'auto',
          overflowX: 'hidden',
          paddingBottom: '24px'
        }}
      >
        {messages.map((msg) => {
          if (msg.sender === 'SYSTEM') {
            const parsed = parseSystemLog(msg.text, msg.bayesK, msg.topLine, msg.subText);
            const metric = parsed.confidenceMetric;

            return (
              <div
                key={msg.id}
                style={{
                  padding: '6px 10px',
                  borderColor: metric.borderColor,
                  backgroundColor: 'rgba(8, 16, 26, 0.88)',
                  boxShadow: `0 0 10px ${metric.color}18`,
                }}
                className="w-full rounded-lg border font-mono flex flex-col gap-1 transition-all duration-200"
              >
                {/* Top Line: Core Event Tag + K-Value */}
                <div
                  style={{ fontSize: '10.5px' }}
                  className="flex items-center font-bold text-slate-100 tracking-tight leading-tight whitespace-nowrap"
                >
                  <span>{parsed.topLine}</span>
                </div>

                {/* Bottom Line (Subtext): Confidence Percentage + Certainty Level */}
                <div
                  style={{ color: metric.color, fontSize: '10px' }}
                  className="font-medium tracking-normal leading-tight whitespace-pre-wrap break-words"
                >
                  {parsed.subText}
                </div>
              </div>
            );
          }

          const isAstronaut = msg.sender === 'ASTRONAUT';
          return (
            <div
              key={msg.id}
              className={`flex flex-col gap-1 w-full transition-all duration-300 ${
                isAstronaut ? 'items-start' : 'items-end'
              }`}
            >
              {/* Speaker metadata */}
              <div className="flex items-center justify-between w-full px-1">
                <div className="flex items-center gap-1.5 min-w-0">
                  {isAstronaut ? (
                    <>
                      <User className="w-3 h-3 text-cyan-400 shrink-0" />
                      <span className="text-[10px] font-mono font-bold text-cyan-300 tracking-wide truncate">
                        {msg.speakerLabel}
                      </span>
                    </>
                  ) : (
                    <>
                      <Bot className="w-3 h-3 text-emerald-400 shrink-0" />
                      <span className="text-[10px] font-mono font-bold text-emerald-300 tracking-wide truncate">
                        {msg.speakerLabel}
                      </span>
                    </>
                  )}
                  <span className="text-[8px] font-mono text-slate-500 shrink-0">{msg.timestamp}</span>
                </div>
                {!isAstronaut && msg.bayesK !== undefined && (
                  <span
                    style={{
                      color: msg.bayesState?.color || '#00f0ff',
                      borderColor: msg.bayesState?.badgeBorder || 'rgba(0, 240, 255, 0.4)',
                      backgroundColor: msg.bayesState?.badgeBg || 'rgba(0, 240, 255, 0.12)',
                    }}
                    className="text-[7.5px] font-bold px-1.5 py-0.2 rounded border uppercase tracking-wider shrink-0 ml-1.5"
                  >
                    K = {msg.bayesK.toFixed(1)}
                  </span>
                )}
              </div>

              {/* Chat bubble */}
              <div
                className={`max-w-[92%] px-2.5 py-2 rounded-xl text-[11px] font-mono leading-relaxed backdrop-blur-md shadow-md ${
                  isAstronaut
                    ? 'bg-cyan-950/40 border border-cyan-500/35 text-cyan-100 shadow-cyan-950/30'
                    : msg.isAlert
                    ? 'bg-amber-950/40 border border-amber-500/50 text-amber-100 shadow-amber-950/40'
                    : 'bg-slate-950/80 border border-emerald-500/30 text-slate-200 shadow-emerald-950/20'
                }`}
              >
                {msg.isAlert && (
                  <div className="flex items-center gap-1 text-[9px] font-bold text-amber-400 mb-1 uppercase tracking-wider">
                    <AlertTriangle className="w-3 h-3 text-amber-400" />
                    <span>CRITICAL TELEMETRY ADVISORY</span>
                  </div>
                )}
                <p>{msg.text}</p>
              </div>
            </div>
          );
        })}

        {/* Live inference animation */}
        {isTyping && (
          <div className="flex flex-col gap-1 items-end w-full">
            <div className="flex items-center gap-1.5 px-1">
              <Bot className="w-3 h-3 text-emerald-400" />
              <span className="text-[10px] font-mono font-bold text-emerald-300 tracking-wide">
                EDGE AI // LOCAL LLM
              </span>
            </div>
            <div className="px-3 py-1.5 rounded-xl bg-slate-950/80 border border-emerald-500/30 flex items-center gap-1.5 text-emerald-400 text-[10px] font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" style={{ animationDelay: '0.15s' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" style={{ animationDelay: '0.30s' }} />
              <span className="ml-1">Inference in progress...</span>
            </div>
          </div>
        )}

        {/* Gemini / ChatGPT style auto-focus bottom anchor */}
        <div ref={chatEndRef} />
      </div>

      {/* ───────────────────── FOOTER / CONTROLS ───────────────────── */}
      <div className="p-2.5 bg-slate-950/70 border-t border-cyan-500/20 flex flex-col gap-1.5">
        <button
          id="btn-test-collision"
          onClick={() => zeroGKinematics.triggerOopsRebound()}
          className="w-full py-1.5 px-2 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 rounded-lg text-[10px] font-mono font-bold flex items-center justify-center gap-1.5 transition-all shadow-sm shadow-amber-950/20 cursor-pointer"
        >
          <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
          <span>TEST COLLISION "OOPS!" IMPULSE</span>
        </button>
      </div>
    </div>
  );
}
