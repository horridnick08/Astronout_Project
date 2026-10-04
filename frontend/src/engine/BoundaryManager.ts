import { StationEventBus } from './StationEventBus.ts';
import { missionTimeline } from './useMissionTimeline.ts';

export type ZoneType = 'OPERATIONAL' | 'MAINTENANCE' | 'HAZARD';

export interface FocusZoneDef {
  stationId: number;
  key: string;
  name: string;
  zoneType: ZoneType;
  hullName: string;
  color: string; // '#00f0ff' | '#ff9900' | '#ff2200'
  center: [number, number, number];
  size: [number, number, number];
  systemLog: string;
  astronautText: string;
  aiText: string;
  isAlert?: boolean;
  bayesK?: number;
}

export const WORKSPACE_ZONES: Record<number, FocusZoneDef> = {
  1: {
    stationId: 1,
    key: 'FLIGHT_DECK',
    name: 'Primary Flight Deck Console',
    zoneType: 'OPERATIONAL',
    hullName: 'Avionics Console A',
    color: '#00f0ff', // Cyan
    center: [-1.74, 0.9, 0.8],
    size: [0.65, 1.7, 1.6],
    systemLog: '[FOCUS ZONE ACTIVATED: Cyan Convex Hull created around Avionics Console A]',
    astronautText: 'Approaching Flight Deck interface.',
    aiText: 'Boundary locked. Step 1: Flip Toggle Switch 3 to bypass secondary circuit. Step 2: Recalibrate RCS thruster alignment.',
    isAlert: false,
    bayesK: 14.8,
  },
  2: {
    stationId: 2,
    key: 'SUPPLY_BARRELS',
    name: 'Inventory Supply Barrels',
    zoneType: 'MAINTENANCE',
    hullName: 'Cargo Storage Bay Barrels',
    color: '#ff9900', // Orange
    center: [-1.70, 0.75, -3.8],
    size: [0.75, 1.45, 1.4],
    systemLog: '[DATA ZONE ACTIVATED: Orange Convex Hull created around Cargo Storage Bay Barrels]',
    astronautText: 'Scanning cargo manifest and barrel seal integrity.',
    aiText: 'Inventory verified. Step 1: Check cryo pack pressure valves. Step 2: Log container C-041 mass discrepancy.',
    isAlert: false,
    bayesK: 8.5,
  },
  3: {
    stationId: 3,
    key: 'HULL_WINDOW',
    name: 'Hull Observation Window',
    zoneType: 'OPERATIONAL',
    hullName: 'Hull Viewport Sector',
    color: '#00f0ff', // Cyan
    center: [1.84, 1.35, -2.9],
    size: [0.5, 1.7, 1.4],
    systemLog: '[FOCUS ZONE ACTIVATED: Cyan Convex Hull created around Hull Viewport Sector]',
    astronautText: 'Inspecting external hull and orbital debris field.',
    aiText: 'Viewport clarity nominal. Step 1: Monitor object TLE-2847 proximity. Step 2: Capture mesosphere airglow telemetry.',
    isAlert: false,
    bayesK: 16.2,
  },
  4: {
    stationId: 4,
    key: 'EARTH_DOWNLINK',
    name: 'Earth Hologram & Orbit Radar Panel',
    zoneType: 'MAINTENANCE',
    hullName: 'Downlink Terminal',
    color: '#ff9900', // Orange
    center: [1.50, 1.0, -2.3],
    size: [0.9, 1.8, 1.1],
    systemLog: '[DATA ZONE ACTIVATED: Orange Convex Hull created around Downlink Terminal]',
    astronautText: 'Accessing satellite transmission panel.',
    aiText: 'Isolated noise clutter. Step 1: Type security passkey \'DELTA-7\'. Step 2: Confirm 3-week orbital log broadcast to Earth Ground Control.',
    isAlert: false,
    bayesK: 9.4,
  },
  5: {
    stationId: 5,
    key: 'QUANTUM_CORE',
    name: 'Quantum Core Experiment Station',
    zoneType: 'HAZARD',
    hullName: 'Quantum Core Chamber',
    color: '#ff2200', // Red
    center: [1.82, 1.25, -1.55],
    size: [0.6, 1.6, 1.2],
    systemLog: '[HAZARD ZONE ACTIVATED: Red Convex Hull created around Quantum Core Chamber]',
    astronautText: 'Handling Quantum Core cell.',
    aiText: 'High energy flux detected. Step 1: Align core pins within the red target ring. Step 2: Check auxiliary voltage levels on display B.',
    isAlert: true,
    bayesK: 2.1,
  },
  6: {
    stationId: 6,
    key: 'DOWNLINK_SCREENS',
    name: 'Secondary Telemetry & Downlink Screens',
    zoneType: 'MAINTENANCE',
    hullName: 'Downlink Terminal',
    color: '#ff9900', // Orange
    center: [1.84, 1.3, 1.0],
    size: [0.55, 1.6, 1.3],
    systemLog: '[DATA ZONE ACTIVATED: Orange Convex Hull created around Downlink Terminal]',
    astronautText: 'Accessing satellite transmission panel.',
    aiText: 'Isolated noise clutter. Step 1: Type security passkey \'DELTA-7\'. Step 2: Confirm 3-week orbital log broadcast to Earth Ground Control.',
    isAlert: false,
    bayesK: 8.2,
  },
};

export interface BoundaryState {
  activeStationId: number;
  isAutoMode: boolean;
  wireframeVisible: boolean;
  activeZone: FocusZoneDef;
}

class BoundaryManagerClass {
  private activeStationId: number = 1;
  private isAutoMode: boolean = true;
  private wireframeVisible: boolean = true;
  private listeners: Set<(state: BoundaryState) => void> = new Set();
  private lastActivatedId: number = 0;

  constructor() {
    // Listen to autonomous station arrivals from the mission timeline
    StationEventBus.on('stationArrival', (evt) => {
      if (this.isAutoMode) {
        this.activateZone(evt.stationId, false);
      }
    });
  }

  public subscribe(listener: (state: BoundaryState) => void): () => void {
    this.listeners.add(listener);
    listener(this.getState());
    return () => {
      this.listeners.delete(listener);
    };
  }

  public getState(): BoundaryState {
    const activeZone = WORKSPACE_ZONES[this.activeStationId] || WORKSPACE_ZONES[1];
    return {
      activeStationId: this.activeStationId,
      isAutoMode: this.isAutoMode,
      wireframeVisible: this.wireframeVisible,
      activeZone,
    };
  }

  private notify(): void {
    const state = this.getState();
    this.listeners.forEach((fn) => fn(state));
  }

  public setFocusStation(stationId: number | 'AUTO'): void {
    if (stationId === 'AUTO') {
      this.isAutoMode = true;
      const currentStation = missionTimeline.getState().stepId;
      this.activateZone(currentStation, true);
    } else {
      this.isAutoMode = false;
      this.activateZone(stationId, true);
      // Also command character traversal to selected workstation
      missionTimeline.jumpToStation(stationId);
    }
  }

  public toggleWireframe(visible?: boolean): void {
    this.wireframeVisible = visible !== undefined ? visible : !this.wireframeVisible;
    this.notify();
  }

  public activateZone(stationId: number, forceEmit: boolean = false): void {
    if (!WORKSPACE_ZONES[stationId]) return;
    this.activeStationId = stationId;
    this.notify();

    // Prevent duplicate spam if already activated for this station
    if (this.lastActivatedId === stationId && !forceEmit) return;
    this.lastActivatedId = stationId;

    const zone = WORKSPACE_ZONES[stationId];
    StationEventBus.emit('boundaryActivated' as any, zone as any);
  }
}

export const boundaryManager = new BoundaryManagerClass();