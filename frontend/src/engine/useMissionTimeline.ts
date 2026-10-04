import * as THREE from 'three';
import { StationEventBus } from './StationEventBus.ts';

/**
 * useMissionTimeline.ts
 * 
 * Principal 3D Traversal & State Machine Engine:
 * 
 * 1. Comprehensive & Dynamic Station Navigation (No Loop Traps):
 *    Guarantees full coverage across all 6 workstations using Fisher-Yates array shuffling
 *    with anti-repetition constraints (avoiding back-to-back duplicate visits):
 *    - Station 1: Primary Flight Deck Console (Port Wall)
 *    - Station 2: Inventory Supply Barrels (Port Cargo Bay)
 *    - Station 3: Hull Observation Window (Starboard Wall)
 *    - Station 4: Earth Hologram & Orbit Radar Panel (Starboard Mid)
 *    - Station 5: Quantum Core Experiment Station (Starboard Wall Socket)
 *    - Station 6: Secondary Telemetry & Downlink Screens (Starboard Forward)
 * 
 * 2. Exact Target Proximity:
 *    Each waypoint brings the astronaut to exact 0.3m - 0.5m proximity distance,
 *    facing directly towards the station before interacting.
 * 
 * 3. Physical Collision Detection & "Oops!" Reaction:
 *    When momentum causes bounding boundary collision:
 *    - Displays: "Oops! Watch the micro-G momentum!"
 *    - AI Context: "Edge AI: Micro-G momentum rebound detected. Restabilizing attitude."
 */

export interface SubtitleData {
  speaker: string;
  text: string;
  variant: 'cyan' | 'emerald' | 'amber';
}

export interface WorkstationDef {
  id: number;
  key: string;
  name: string;
  targetPosition: THREE.Vector3;
  targetYaw: number;
  poseType: string;
  duration: number;
  isCoreAttached: boolean;
  isHologramActive: boolean;
  astronautDialogue: string;
  aiDetection: string;
  actionType: 'INSPECT' | 'INTERACT' | 'MONITOR' | 'TRANSMIT' | 'OBSERVE';
}

export const WORKSTATIONS: Record<number, WorkstationDef> = {
  1: {
    id: 1,
    key: 'FLIGHT_DECK',
    name: 'Primary Flight Deck Console',
    targetPosition: new THREE.Vector3(-1.00, 0, 0.80),
    targetYaw: -Math.PI / 2,
    poseType: 'PILOT_CALIBRATION',
    duration: 6.5,
    isCoreAttached: false,
    isHologramActive: false,
    actionType: 'MONITOR',
    astronautDialogue: 'Astronaut: Calibrating attitude thrusters.',
    aiDetection: 'Edge AI: Pressure nominal. Recalibrating sector 4 oxygen valves as next step.'
  },
  2: {
    id: 2,
    key: 'SUPPLY_BARRELS',
    name: 'Inventory Supply Barrels',
    targetPosition: new THREE.Vector3(-1.00, 0, -3.80),
    targetYaw: -Math.PI * 0.75,
    poseType: 'BARREL_SEARCH',
    duration: 6.5,
    isCoreAttached: false,
    isHologramActive: false,
    actionType: 'INSPECT',
    astronautDialogue: 'Astronaut: Scanning outer hull and supply barrels.',
    aiDetection: 'Edge AI: Hull integrity 100%. Inventory check complete.'
  },
  3: {
    id: 3,
    key: 'HULL_WINDOW',
    name: 'Hull Observation Window',
    targetPosition: new THREE.Vector3(0.80, 0, -2.90),
    targetYaw: Math.PI / 2,
    poseType: 'WINDOW_INSPECTION',
    duration: 6.5,
    isCoreAttached: false,
    isHologramActive: false,
    actionType: 'OBSERVE',
    astronautDialogue: 'Astronaut: Observing deep space through hull window.',
    aiDetection: 'Edge AI: Hull integrity 100%. Zero anomalies detected in viewport sector.'
  },
  4: {
    id: 4,
    key: 'EARTH_DOWNLINK',
    name: 'Earth Hologram & Orbit Radar Panel',
    targetPosition: new THREE.Vector3(0.75, 0, -2.30),
    targetYaw: Math.PI / 2,
    poseType: 'BUTTON_PRESS',
    duration: 6.5,
    isCoreAttached: false,
    isHologramActive: true,
    actionType: 'TRANSMIT',
    astronautDialogue: 'Astronaut: Accessing Earth Downlink Terminal.',
    aiDetection: 'Edge AI: 3 weeks of telemetry and satellite position logs ready. Initiating transmission to Earth Ground Control.'
  },
  5: {
    id: 5,
    key: 'QUANTUM_CORE',
    name: 'Quantum Core Experiment Station',
    targetPosition: new THREE.Vector3(0.80, 0, -1.55),
    targetYaw: Math.PI / 2,
    poseType: 'QUANTUM_CORE_LIFT',
    duration: 7.0,
    isCoreAttached: true,
    isHologramActive: false,
    actionType: 'INSPECT',
    astronautDialogue: 'Astronaut: Inspecting Quantum Core power cell.',
    aiDetection: 'Edge AI: Alert: Primary battery capacity at 30%. Insert Quantum Core into auxiliary slot to restore main grid.'
  },
  6: {
    id: 6,
    key: 'DOWNLINK_SCREENS',
    name: 'Secondary Telemetry & Downlink Screens',
    targetPosition: new THREE.Vector3(0.80, 0, 1.00),
    targetYaw: Math.PI / 2,
    poseType: 'EARTH_TRANSMISSION',
    duration: 6.5,
    isCoreAttached: false,
    isHologramActive: false,
    actionType: 'TRANSMIT',
    astronautDialogue: 'Astronaut: Accessing Earth Downlink Terminal.',
    aiDetection: 'Edge AI: 3 weeks of telemetry and satellite position logs ready. Initiating transmission to Earth Ground Control.'
  }
};

class MissionTimelineEngine {
  private currentStationId: number = 1;
  private prevStationId: number = 1;
  private timeInStation: number = 0;
  private travelDuration: number = 0;
  private dwellDuration: number = 6.0;
  private totalDuration: number = 6.5;

  // Distance-Proportional Multi-Hop Traversal State
  private numHops: number = 1;
  private hopDuration: number = 2.6;
  private hopIndex: number = 0;
  private hopProgress: number = 0;
  private isTransit: boolean = false;
  private hopStartPos: THREE.Vector3 = new THREE.Vector3(-1.00, 0, 0.80);
  private hopEndPos: THREE.Vector3 = new THREE.Vector3(-1.00, 0, 0.80);

  // Station Queue & Shuffle Engine
  private stationQueue: number[] = [];
  private visitedStats: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
  private roundCount: number = 1;

  // Manual Overrides & Event-Driven Hologram
  private manualHologramOverride: boolean | null = null;
  private isHologramActive: boolean = false;
  private isCoreAttached: boolean = false;

  // Collision "Oops!" Reaction State
  private isOopsActive: boolean = false;
  private oopsTimer: number = 0;
  private oopsSubtitle: SubtitleData | null = null;
  private oopsAiDetection: string | null = null;

  // Traversal Interpolation State
  private startPosition: THREE.Vector3 = new THREE.Vector3(-1.00, 0, 0.80);
  private currentPosition: THREE.Vector3 = new THREE.Vector3(-1.00, 0, 0.80);
  private targetPosition: THREE.Vector3 = new THREE.Vector3(-1.00, 0, 0.80);
  private targetYaw: number = -Math.PI / 2;

  // Event Bus: track whether we've already emitted stationArrival for current dwell phase
  private hasEmittedArrivalForCurrentDwell: boolean = false;

  private listeners: Set<(state: ReturnType<MissionTimelineEngine['getState']>) => void> = new Set();

  constructor() {
    this.initStationQueue();
    this.currentStationId = this.stationQueue.shift() || 1;
    this.applyStation(this.currentStationId);
  }

  /**
   * Generates a randomized permutation of all 6 stations using Fisher-Yates,
   * guaranteeing 100% full coverage of every station per round with NO duplicate repeats.
   */
  private generateShuffledRound(lastId?: number): number[] {
    const list = [1, 2, 3, 4, 5, 6];
    for (let i = list.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [list[i], list[j]] = [list[j], list[i]];
    }

    if (lastId !== undefined && list[0] === lastId && list.length > 1) {
      const swapIdx = 1 + Math.floor(Math.random() * (list.length - 1));
      [list[0], list[swapIdx]] = [list[swapIdx], list[0]];
    }

    return list;
  }

  private initStationQueue() {
    const round1 = [1, 2, 5, 4, 3, 6];
    const round2 = this.generateShuffledRound(6);
    this.stationQueue = [...round1, ...round2];
  }

  private replenishQueueIfNeeded() {
    if (this.stationQueue.length < 6) {
      const lastId = this.stationQueue.length > 0 ? this.stationQueue[this.stationQueue.length - 1] : this.currentStationId;
      const nextRound = this.generateShuffledRound(lastId);
      this.stationQueue.push(...nextRound);
      this.roundCount++;
    }
  }

  public subscribe(listener: (state: ReturnType<MissionTimelineEngine['getState']>) => void) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public notify() {
    const state = this.getState();
    this.listeners.forEach((listener) => listener(state));
  }

  public toggleHologram() {
    // If currently dwelling at Station 4, toggle projection
    if (this.currentStationId === 4 && !this.isTransit) {
      this.manualHologramOverride = !this.isHologramActive;
      this.isHologramActive = this.manualHologramOverride;
      this.notify();
    }
  }

  public getIsHologramActive(): boolean {
    return this.isHologramActive;
  }

  public getIsCoreAttached(): boolean {
    return this.isCoreAttached;
  }

  public setHologramActive(active: boolean) {
    if (this.currentStationId === 4 && !this.isTransit) {
      this.manualHologramOverride = active;
      this.isHologramActive = active;
      this.notify();
    }
  }

  /**
   * Jump directly to a chosen station (via UI or 3D viewport click)
   */
  public jumpToStation(stationId: number) {
    if (!WORKSTATIONS[stationId]) return;
    this.prevStationId = this.currentStationId;
    this.currentStationId = stationId;
    this.applyStation(stationId);
    this.notify();
  }

  /**
   * Trigger "Oops!" collision reaction from physics engine
   */
  public triggerOops() {
    if (this.isOopsActive) return;
    this.isOopsActive = true;
    this.oopsTimer = 2.4;
    this.oopsSubtitle = {
      speaker: 'EVA-1 // ASTRONAUT',
      text: 'Oops! Watch the micro-G momentum!',
      variant: 'cyan'
    };
    this.oopsAiDetection = 'Edge AI: Micro-G momentum rebound detected. Restabilizing attitude.';
    // Emit event-driven oops signal to EdgeAIChatLog
    StationEventBus.emit('oopsRebound', { severity: 'MINOR' });
    this.notify();
  }

  public clearOops() {
    if (!this.isOopsActive) return;
    this.isOopsActive = false;
    this.oopsSubtitle = null;
    this.oopsAiDetection = null;
    this.notify();
  }

  /**
   * Calculate distance-proportional multi-hop traversal parameters:
   * Number of Hops = ceil(d / Hop Distance), with Hop Distance ~ 0.70m.
   * Linear translation velocity reduced by 50% for realistic slow-motion low-G traversal.
   */
  private applyStation(stationId: number) {
    const station = WORKSTATIONS[stationId] || WORKSTATIONS[1];
    this.startPosition.copy(this.currentPosition);
    this.targetPosition.copy(station.targetPosition);
    this.targetYaw = station.targetYaw;
    this.isCoreAttached = false;

    // Calculate distance and multi-hop count
    const dx = this.targetPosition.x - this.startPosition.x;
    const dz = this.targetPosition.z - this.startPosition.z;
    const dist = Math.hypot(dx, dz);

    const hopDistance = 0.70;
    this.numHops = Math.max(1, Math.ceil(dist / hopDistance));
    this.hopDuration = 2.6;
    this.travelDuration = this.numHops * this.hopDuration;
    this.dwellDuration = 6.0;
    this.totalDuration = this.travelDuration + this.dwellDuration;
    this.timeInStation = 0;
    this.isTransit = this.travelDuration > 0.1;
    this.hopIndex = 0;
    this.hopProgress = 0;
    this.hopStartPos.copy(this.startPosition);
    this.hopEndPos.copy(this.startPosition);

    // Reset hologram and arrival-emit guard on every new station transition
    this.manualHologramOverride = null;
    this.isHologramActive = false;
    this.hasEmittedArrivalForCurrentDwell = false;

    this.visitedStats[stationId] = (this.visitedStats[stationId] || 0) + 1;
  }

  public getState() {
    const station = WORKSTATIONS[this.currentStationId] || WORKSTATIONS[1];

    let subtitle: SubtitleData;
    let aiDetection: string;

    const displayHop = Math.min(this.numHops, Math.max(1, this.hopIndex + 1));

    if (this.isOopsActive && this.oopsSubtitle) {
      subtitle = this.oopsSubtitle;
      aiDetection = this.oopsAiDetection || 'Edge AI: Micro-G momentum rebound detected. Restabilizing attitude.';
    } else if (this.isTransit) {
      subtitle = {
        speaker: 'EVA-1 // ASTRONAUT',
        text: `Low-G traversal in progress to ${station.name}... [Hop ${displayHop}/${this.numHops}]`,
        variant: 'cyan'
      };
      aiDetection = `Edge AI: Low-G traversal in progress (Hop ${displayHop}/${this.numHops}) towards ${station.name}.`;
    } else {
      subtitle = {
        speaker: 'EVA-1 // ASTRONAUT',
        text: station.astronautDialogue,
        variant: 'cyan'
      };
      aiDetection = station.aiDetection;
    }

    return {
      stepId: station.id,
      stepName: station.name,
      poseType: this.isTransit ? 'GUIDANCE_RECEPTION' : station.poseType,
      isTransit: this.isTransit,
      hopIndex: this.hopIndex,
      numHops: this.numHops,
      hopProgress: this.hopProgress,
      targetPosition: this.targetPosition.clone(),
      targetYaw: this.targetYaw,
      isCoreAttached: this.isCoreAttached,
      isHologramActive: this.isHologramActive,
      isOopsActive: this.isOopsActive,
      aiDetection,
      subtitle,
      roundCount: this.roundCount,
      visitedStats: { ...this.visitedStats }
    };
  }

  public update(delta: number) {
    // 1. Manage Oops reaction timer
    if (this.isOopsActive) {
      this.oopsTimer -= delta;
      if (this.oopsTimer <= 0) {
        this.clearOops();
      }
    }

    // 2. Advance time in current station
    const prevHologram = this.isHologramActive;
    const prevTransit = this.isTransit;
    const prevHopIndex = this.hopIndex;
    const prevCoreAttached = this.isCoreAttached;

    this.timeInStation += delta;

    const station = WORKSTATIONS[this.currentStationId] || WORKSTATIONS[1];
    this.isTransit = this.timeInStation < this.travelDuration;

    if (this.isTransit) {
      // IN TRANSIT: Earth Hologram & Core Attachment are strictly inactive
      this.isHologramActive = false;
      this.isCoreAttached = false;
      this.manualHologramOverride = null;

      this.hopIndex = Math.min(this.numHops - 1, Math.floor(this.timeInStation / this.hopDuration));
      const hopElapsed = this.timeInStation - this.hopIndex * this.hopDuration;
      this.hopProgress = Math.min(1.0, Math.max(0.0, hopElapsed / this.hopDuration));

      const fracStart = this.hopIndex / this.numHops;
      const fracEnd = (this.hopIndex + 1) / this.numHops;
      this.hopStartPos.lerpVectors(this.startPosition, this.targetPosition, fracStart);
      this.hopEndPos.lerpVectors(this.startPosition, this.targetPosition, fracEnd);

      const s = this.hopProgress * this.hopProgress * (3 - 2 * this.hopProgress);
      this.currentPosition.lerpVectors(this.hopStartPos, this.hopEndPos, s);
    } else {
      // DWELL PHASE AT STATION
      this.hopIndex = this.numHops - 1;
      this.hopProgress = 0.0;
      this.currentPosition.copy(this.targetPosition);

      // â”€â”€ EVENT-DRIVEN STATION ARRIVAL EMIT â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
      // Fired exactly ONCE per dwell-phase entry (transitâ†’dwell transition).
      // EdgeAIChatLog subscribes to this event independently of missionTimeline state.
      if (!this.hasEmittedArrivalForCurrentDwell) {
        this.hasEmittedArrivalForCurrentDwell = true;
        StationEventBus.emit('stationArrival', {
          stationId: station.id,
          key: station.key,
          actionType: station.actionType
        });
      }

      // Conditional Earth Hologram Activation (Station 4 only)
      if (station.id === 4) {
        if (this.manualHologramOverride !== null) {
          this.isHologramActive = this.manualHologramOverride;
        } else {
          const dwellElapsed = this.timeInStation - this.travelDuration;
          this.isHologramActive = dwellElapsed >= 0.8 && dwellElapsed < (this.dwellDuration - 0.5);
        }
      } else {
        this.isHologramActive = false;
        this.manualHologramOverride = null;
      }

      // Dynamic Quantum Core Pick-Up & Release Cycle (Station 5 only)
      if (station.id === 5) {
        const dwellElapsed = this.timeInStation - this.travelDuration;
        this.isCoreAttached = dwellElapsed >= 0.6 && dwellElapsed < (this.dwellDuration - 0.6);
      } else {
        this.isCoreAttached = false;
      }
    }

    // Trigger instant UI re-render on hop, transit, or hologram state transitions
    if (prevHologram !== this.isHologramActive || prevTransit !== this.isTransit || prevHopIndex !== this.hopIndex || prevCoreAttached !== this.isCoreAttached) {
      this.notify();
    }

    // 3. Station Completion & Dynamic Next Station Selection
    if (this.timeInStation >= this.totalDuration) {
      this.replenishQueueIfNeeded();
      const nextStationId = this.stationQueue.shift() || 1;
      this.jumpToStation(nextStationId);
    }

    return {
      targetPosition: this.targetPosition,
      targetYaw: this.targetYaw,
      poseType: this.isTransit ? 'GUIDANCE_RECEPTION' : station.poseType,
      isTransit: this.isTransit,
      hopIndex: this.hopIndex,
      numHops: this.numHops,
      hopProgress: this.hopProgress,
      hopStartPos: this.hopStartPos,
      hopEndPos: this.hopEndPos,
      startPosition: this.startPosition,
      isCoreAttached: this.isCoreAttached,
      isHologramActive: this.isHologramActive,
      aiDetection: this.isOopsActive && this.oopsAiDetection
        ? this.oopsAiDetection
        : this.isTransit
        ? `Edge AI: Low-G traversal in progress (Hop ${this.hopIndex + 1}/${this.numHops}) towards ${station.name}.`
        : station.aiDetection,
      timeInStation: this.timeInStation
    };
  }
}

export const missionTimeline = new MissionTimelineEngine();
