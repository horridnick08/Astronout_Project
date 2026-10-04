/**
 * StationEventBus.ts
 *
 * Typed singleton event emitter for the Edge AI event-driven context system.
 * Decouples the MissionTimelineEngine from EdgeAIChatLog — no polling required.
 *
 * Events:
 *   stationArrival  - Fired once per dwell-phase entry (transit ? dwell transition)
 *   oopsRebound     - Fired when a micro-G collision rebound is detected
 *
 * Usage:
 *   const unsub = StationEventBus.on('stationArrival', handler);
 *   StationEventBus.emit('stationArrival', { stationId: 5, key: 'QUANTUM_CORE', actionType: 'INSPECT' });
 *   unsub(); // clean up
 */

export interface StationArrivalEvent {
  stationId: number;
  key: string;
  actionType: 'INSPECT' | 'INTERACT' | 'MONITOR' | 'TRANSMIT' | 'OBSERVE';
}

export interface OopsReboundEvent {
  severity: 'MINOR' | 'MAJOR';
}

export interface KineticDeviationEvent {
  areaName: string;
  liveDelta: number;    // m/s
  maxAllowed: number;   // m/s
  handSide: 'LEFT' | 'RIGHT' | 'BOTH';
  deviatingLayer?: 'FINGER_JITTER' | 'PALM_WRIST' | 'HAND_MOTION' | null;
}

export interface KineticRecoveredEvent {
  areaName: string;
  stableDelta: number;
}

export interface KineticThrottlingEvent {
  enabled: boolean;
  areaName: string;
  maxAllowed: number;
}

export interface CbdDiagnosticCompleteEvent {
  scanType: 'GLARE_ADAPTATION' | 'CAMERA_PIPELINE' | 'EDGE_AI_MODULES';
  topLine: string;
  subText: string;
  confidencePct: number;
  bayesK: number;
}

export interface DigitalTwinPacketEvent {
  payloadSize: string;
  signature?: string;
  timestamp?: string;
}

export interface RadiationBitFlipDetectedEvent {
  blockNumber: number;
  memoryAddress?: string;
}

export interface RadiationAutoRepairedEvent {
  blockNumber: number;
  correctedVia: string;
}

type EventMap = {
  stationArrival: StationArrivalEvent;
  oopsRebound: OopsReboundEvent;
  boundaryActivated: any;
  cbdDiagnosticComplete: CbdDiagnosticCompleteEvent;
  kineticDeviation: KineticDeviationEvent;
  kineticRecovered: KineticRecoveredEvent;
  kineticThrottling: KineticThrottlingEvent;
  digitalTwinPacketGenerated: DigitalTwinPacketEvent;
  radiationBitFlipDetected: RadiationBitFlipDetectedEvent;
  radiationAutoRepaired: RadiationAutoRepairedEvent;
};

type Listener<T> = (payload: T) => void;

class StationEventBusClass {
  private registry: {
    [K in keyof EventMap]?: Set<Listener<EventMap[K]>>;
  } = {};

  on<K extends keyof EventMap>(event: K, listener: Listener<EventMap[K]>): () => void {
    if (!this.registry[event]) {
      this.registry[event] = new Set() as Set<Listener<EventMap[K]>>;
    }
    (this.registry[event] as Set<Listener<EventMap[K]>>).add(listener);
    return () => this.off(event, listener);
  }

  off<K extends keyof EventMap>(event: K, listener: Listener<EventMap[K]>): void {
    (this.registry[event] as Set<Listener<EventMap[K]>> | undefined)?.delete(listener);
  }

  emit<K extends keyof EventMap>(event: K, payload: EventMap[K]): void {
    (this.registry[event] as Set<Listener<EventMap[K]>> | undefined)?.forEach((fn) => {
      try {
        fn(payload);
      } catch (e) {
        console.error('[StationEventBus] Listener error in "' + event + '":', e);
      }
    });
  }
}

export const StationEventBus = new StationEventBusClass();
