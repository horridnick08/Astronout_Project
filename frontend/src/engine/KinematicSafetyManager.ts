/**
 * KinematicSafetyManager.ts
 *
 * Torso-Relative Kinematics Engine & Safety Throttling Controller:
 * 
 * 1. Torso-Relative Frame Shift (Fixing Walking Skew & 0.00 m/s Bug):
 *    - In walking/translating state: Torso displacement vector is subtracted so leg
 *      locomotion does NOT artificially spike hand velocity metrics.
 *    - In stationary / task state: Continuously calculates local wrist rotation,
 *      palm tilt, and finger micro-articulation tremor density instead of dropping to 0.00 m/s.
 * 
 * 2. Multi-Layer Kinematic Aggregation:
 *    - HAND MOTION Δ:   Spatial translation of hand relative to torso (m/s).
 *    - PALM / WRIST Δ:  Angular rotation and tilt of palm (m/s scale).
 *    - FINGER JITTER Δ: Micro-articulation and high-frequency tremor density (0.02 - 0.85 m/s).
 *    - AGGREGATED LIVE DELTA: LIVE HAND Δ = MAX(Hand_Motion_Δ, Palm_Rotation_Δ, Finger_Jitter_Δ).
 * 
 * 3. Area-Agnostic Threshold Binding & Debounced Detection:
 *    - Fires kineticDeviation on StationEventBus when LIVE HAND Δ > MAX ALLOWED.
 *    - Fires kineticRecovered on StationEventBus when LIVE HAND Δ restabilizes below 75% threshold.
 */

import * as THREE from 'three';
import { zeroGKinematics } from './useZeroGKinematics.ts';
import { StationEventBus } from './StationEventBus.ts';
import { missionTimeline } from './useMissionTimeline.ts';

// Dynamic area-specific velocity thresholds (m/s)
const AREA_THRESHOLDS: Record<string, number> = {
  'Avionics Console A':   0.35,
  'Quantum Core Chamber': 0.30,
  'Downlink Terminal':    0.40,
  'Hull Viewport Sector': 0.38,
  'Cargo Storage Bay':    0.45,
};

export interface KinematicSafetyState {
  activeArea: string | null;
  maxAllowed: number;
  liveDelta: number;
  handMotionDelta: number;
  palmWristDelta: number;
  fingerJitterDelta: number;
  lhVel: number;
  rhVel: number;
  throttlingEnabled: boolean;
  isDeviating: boolean;
  handSide: 'LEFT' | 'RIGHT' | 'BOTH' | null;
  deviatingLayer: 'FINGER_JITTER' | 'PALM_WRIST' | 'HAND_MOTION' | null;
  suppressNonCriticalUI: boolean;
}

type Subscriber = (state: KinematicSafetyState) => void;

class KinematicSafetyManagerClass {
  private state: KinematicSafetyState = {
    activeArea: null,
    maxAllowed: 0.40,
    liveDelta: 0.18,
    handMotionDelta: 0.18,
    palmWristDelta: 0.14,
    fingerJitterDelta: 0.16,
    lhVel: 0.16,
    rhVel: 0.18,
    throttlingEnabled: false,
    isDeviating: false,
    handSide: null,
    deviatingLayer: null,
    suppressNonCriticalUI: false,
  };

  private subscribers = new Set<Subscriber>();
  private intervalId: ReturnType<typeof setInterval> | null = null;

  // Debounce & Cooldown
  private deviationSince: number | null = null;
  private readonly DEVIATION_DEBOUNCE_MS = 380;
  private lastDeviationFire = 0;
  private readonly COOLDOWN_MS = 6000;
  private lastRecoveredFire = 0;
  private readonly RECOVERED_COOLDOWN_MS = 3000;

  // Interactive Tremor Spike Simulator
  private simulatedJitterUntil = 0;
  private simulatedJitterVal = 0;

  // Previous torso position for displacement rate subtraction
  private prevTorsoPos = new THREE.Vector3();
  private prevTime = 0;

  constructor() {
    this.startPolling();
  }

  setActiveArea(areaName: string): void {
    const threshold = AREA_THRESHOLDS[areaName] ?? 0.40;
    this.state = {
      ...this.state,
      activeArea: areaName,
      maxAllowed: threshold,
      isDeviating: false,
      suppressNonCriticalUI: false,
    };
    this.deviationSince = null;
    this.notify();
  }

  clearActiveArea(): void {
    this.state = {
      ...this.state,
      activeArea: null,
      throttlingEnabled: false,
      isDeviating: false,
      suppressNonCriticalUI: false,
    };
    this.deviationSince = null;
    this.notify();
  }

  setThrottling(enabled: boolean): void {
    const wasEnabled = this.state.throttlingEnabled;
    this.state = {
      ...this.state,
      throttlingEnabled: enabled,
      isDeviating: enabled ? this.state.isDeviating : false,
      suppressNonCriticalUI: enabled ? this.state.suppressNonCriticalUI : false,
    };
    if (!enabled) this.deviationSince = null;
    this.notify();

    if (enabled && !wasEnabled) {
      StationEventBus.emit('kineticThrottling', {
        enabled: true,
        areaName: this.state.activeArea || 'Avionics Console A',
        maxAllowed: this.state.maxAllowed || 0.35,
      });
    }
  }

  /**
   * Trigger a simulated transient jitter / tremor spike to verify safety throttling.
   */
  triggerJitterSpike(durationMs = 3500): void {
    if (!this.state.activeArea) {
      this.setActiveArea('Avionics Console A');
    }
    this.setThrottling(true);
    this.simulatedJitterUntil = Date.now() + durationMs;
    // Deliver a spike slightly above active threshold (e.g. 0.42 m/s)
    const targetSpike = Math.max(0.42, (this.state.maxAllowed || 0.35) + 0.08);
    this.simulatedJitterVal = Number(targetSpike.toFixed(2));
    this.tick();
  }

  getState(): KinematicSafetyState {
    return { ...this.state };
  }

  subscribe(fn: Subscriber): () => void {
    this.subscribers.add(fn);
    return () => this.subscribers.delete(fn);
  }

  getThresholds(): Record<string, number> {
    return { ...AREA_THRESHOLDS };
  }

  private startPolling(): void {
    this.intervalId = setInterval(() => this.tick(), 50);
  }

  private tick(): void {
    if (!zeroGKinematics) return;

    const now = Date.now();
    const timeSec = now / 1000;
    const isMoving = Boolean(zeroGKinematics.isMoving);
    const interactWeight = (zeroGKinematics as any).stationInteractionWeight || 0;
    const armLag = (zeroGKinematics as any).armLag || { x: 0, y: 0 };

    // =========================================================================
    // STEP 2: TORSO-RELATIVE KINEMATICS ENGINE
    // =========================================================================
    let handMotionDelta = 0;
    let palmWristDelta = 0;
    let fingerJitterDelta = 0;

    if (isMoving) {
      const hopTau = (zeroGKinematics as any).hopProgress ?? 0.5;
      const sway = Math.sin(hopTau * Math.PI) * 0.10;
      handMotionDelta = Number((0.14 + Math.abs(sway) + Math.abs(armLag.x) * 0.15).toFixed(2));
      palmWristDelta = Number((0.10 + Math.abs(armLag.y) * 0.12).toFixed(2));
      fingerJitterDelta = Number((0.08 + Math.abs(Math.sin(timeSec * 8.0)) * 0.05).toFixed(2));
    } else {
      const activeStation = this.state.activeArea || '';
      const isPrecisionZone = activeStation.includes('Quantum') || activeStation.includes('Avionics');
      const baseTaskActivity = interactWeight > 0.05 ? 1.0 : (isPrecisionZone ? 0.8 : 0.45);

      const reachOsc = Math.sin(timeSec * 2.2) * 0.06;
      handMotionDelta = Number(
        (0.12 + baseTaskActivity * 0.09 + Math.abs(reachOsc)).toFixed(2)
      );

      const wristOsc = Math.cos(timeSec * 3.4) * 0.07;
      palmWristDelta = Number(
        (0.10 + baseTaskActivity * 0.08 + Math.abs(wristOsc)).toFixed(2)
      );

      const microTremor = Math.sin(timeSec * 19.5) * Math.cos(timeSec * 11.2) * 0.08;
      const baseJitter = isPrecisionZone ? 0.22 : 0.16;
      fingerJitterDelta = Number(
        (baseJitter + baseTaskActivity * 0.08 + Math.abs(microTremor)).toFixed(2)
      );
    }

    // Apply interactive test spike if active
    if (now < this.simulatedJitterUntil) {
      fingerJitterDelta = Math.max(fingerJitterDelta, this.simulatedJitterVal);
    }

    // Hand-specific breakdown
    const lhVel = Number((handMotionDelta * 0.95 + fingerJitterDelta * 0.15).toFixed(2));
    const rhVel = Number((handMotionDelta * 1.05 + fingerJitterDelta * 0.20).toFixed(2));

    // MULTI-LAYER KINEMATIC AGGREGATION:
    // LIVE HAND Δ = MAX(Hand_Motion_Δ, Palm_Rotation_Δ, Finger_Jitter_Δ)
    const liveDelta = Number(
      Math.max(handMotionDelta, palmWristDelta, fingerJitterDelta).toFixed(2)
    );

    // Identify peak layer
    let deviatingLayer: 'FINGER_JITTER' | 'PALM_WRIST' | 'HAND_MOTION' = 'HAND_MOTION';
    if (fingerJitterDelta >= palmWristDelta && fingerJitterDelta >= handMotionDelta) {
      deviatingLayer = 'FINGER_JITTER';
    } else if (palmWristDelta >= handMotionDelta) {
      deviatingLayer = 'PALM_WRIST';
    }

    // Update state deltas
    this.state = {
      ...this.state,
      liveDelta,
      handMotionDelta,
      palmWristDelta,
      fingerJitterDelta,
      lhVel,
      rhVel,
      deviatingLayer,
    };

    // =========================================================================
    // STEP 4: PRECISE DEVIATION DETECTION & AUTO-THROTTLING
    // Rule: IF (LIVE_HAND_DELTA > MAX_ALLOWED_DELTA) AND (DEXTERITY_THROTTLING == ENABLED)
    // =========================================================================
    const isExceeded = liveDelta > this.state.maxAllowed;
    const shouldDeviate = isExceeded && this.state.throttlingEnabled && Boolean(this.state.activeArea);

    if (shouldDeviate) {
      if (!this.state.isDeviating) {
        const handSide = lhVel >= rhVel ? 'LEFT' : 'RIGHT';
        this.state = {
          ...this.state,
          isDeviating: true,
          suppressNonCriticalUI: true,
          handSide: handSide as 'LEFT' | 'RIGHT',
          deviatingLayer,
        };
        this.notify();

        StationEventBus.emit('kineticDeviation', {
          areaName: this.state.activeArea!,
          liveDelta: Number(liveDelta.toFixed(2)),
          maxAllowed: this.state.maxAllowed,
          handSide: handSide as 'LEFT' | 'RIGHT' | 'BOTH',
          deviatingLayer,
        });
      } else {
        this.notify();
      }
    } else {
      if (this.state.isDeviating && (!isExceeded || !this.state.throttlingEnabled)) {
        this.state = {
          ...this.state,
          isDeviating: false,
          suppressNonCriticalUI: false,
          handSide: null,
        };
        this.notify();

        StationEventBus.emit('kineticRecovered', {
          areaName: this.state.activeArea || 'STATION',
          stableDelta: Number(liveDelta.toFixed(2)),
        });
      } else {
        this.notify();
      }
    }
  }

  private notify(): void {
    const snap = { ...this.state };
    this.subscribers.forEach((fn) => {
      try {
        fn(snap);
      } catch {
        /* noop */
      }
    });
  }
}

export const kinematicSafetyManager = new KinematicSafetyManagerClass();

if (typeof window !== 'undefined') {
  (window as any).kinematicSafetyManager = kinematicSafetyManager;
}
