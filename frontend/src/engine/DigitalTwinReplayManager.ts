import * as THREE from 'three';
import { StationEventBus } from './StationEventBus.ts';
import { cryptographicLedger } from './CryptographicLedger.ts';
import { zeroGKinematics } from './useZeroGKinematics.ts';

export interface ReplayKeyframe {
  time: number;          // 0 to 300 seconds
  position: THREE.Vector3;
  elevationY: number;
  quaternion: THREE.Quaternion;
  yaw: number;
  stationId: number;
  stationName: string;
  isTransit: boolean;
  jointKinematics: {
    handMotionDelta: number;
    wristDelta: number;
    fingerJitterDelta: number;
    totalDelta: number;
  };
}

export interface DigitalTwinReplayState {
  isActive: boolean;
  isPlaying: boolean;
  playbackSpeed: 1 | 2 | 4;
  currentTime: number;      // in seconds (0.0 to 300.0)
  duration: number;         // 300 seconds (05:00 min)
  bandwidth: string;        // '<10 KB/min'
  currentKeyframe: ReplayKeyframe;
  isReportGenerated: boolean;
  lastReportPacket: {
    payloadSize: string;    // '8.4 KB'
    timestamp: string;
    hashDisplay: string;
    signatureLine: string;
  } | null;
}

interface Waypoint {
  time: number;
  pos: [number, number, number];
  yaw: number;
  stationId: number;
  stationName: string;
  isTransit: boolean;
}

// 5-minute deterministic traversal schedule across all 6 space station workstations
const REPLAY_WAYPOINTS: Waypoint[] = [
  { time: 0, pos: [-1.00, 0.08, 0.80], yaw: -Math.PI / 2, stationId: 1, stationName: 'Avionics Console A', isTransit: false },
  { time: 42, pos: [-1.00, 0.08, 0.80], yaw: -Math.PI / 2, stationId: 1, stationName: 'Avionics Console A', isTransit: false },
  { time: 60, pos: [-1.00, 0.08, -1.80], yaw: -Math.PI * 0.7, stationId: 2, stationName: 'Cargo Storage Bay', isTransit: true },
  { time: 70, pos: [-1.00, 0.08, -3.80], yaw: -Math.PI * 0.75, stationId: 2, stationName: 'Cargo Storage Bay', isTransit: false },
  { time: 105, pos: [-1.00, 0.08, -3.80], yaw: -Math.PI * 0.75, stationId: 2, stationName: 'Cargo Storage Bay', isTransit: false },
  { time: 122, pos: [0.05, 0.12, -2.80], yaw: 0, stationId: 5, stationName: 'Quantum Core Chamber', isTransit: true },
  { time: 135, pos: [1.10, 0.08, -1.80], yaw: Math.PI / 2, stationId: 5, stationName: 'Quantum Core Chamber', isTransit: false },
  { time: 170, pos: [1.10, 0.08, -1.80], yaw: Math.PI / 2, stationId: 5, stationName: 'Quantum Core Chamber', isTransit: false },
  { time: 185, pos: [1.10, 0.10, -0.80], yaw: Math.PI / 2, stationId: 4, stationName: 'Earth Hologram Radar', isTransit: true },
  { time: 195, pos: [1.10, 0.08, 0.20], yaw: Math.PI / 2, stationId: 4, stationName: 'Earth Hologram Radar', isTransit: false },
  { time: 228, pos: [1.10, 0.08, 0.20], yaw: Math.PI / 2, stationId: 4, stationName: 'Earth Hologram Radar', isTransit: false },
  { time: 242, pos: [1.10, 0.11, -1.80], yaw: Math.PI * 0.6, stationId: 3, stationName: 'Hull Viewport Sector', isTransit: true },
  { time: 252, pos: [1.10, 0.08, -3.80], yaw: Math.PI / 2, stationId: 3, stationName: 'Hull Viewport Sector', isTransit: false },
  { time: 278, pos: [1.10, 0.08, -3.80], yaw: Math.PI / 2, stationId: 3, stationName: 'Hull Viewport Sector', isTransit: false },
  { time: 288, pos: [0.10, 0.10, -0.80], yaw: 0, stationId: 6, stationName: 'Downlink Terminal', isTransit: true },
  { time: 300, pos: [1.10, 0.08, 2.20], yaw: Math.PI / 2, stationId: 6, stationName: 'Downlink Terminal', isTransit: false },
];

export class DigitalTwinReplayManager {
  private isActive: boolean = false;
  private isPlaying: boolean = false;
  private playbackSpeed: 1 | 2 | 4 = 1;
  private currentTime: number = 0; // seconds
  private readonly duration: number = 300; // 5:00 min
  private readonly bandwidth: string = '<10 KB/min';
  private isReportGenerated: boolean = false;
  private lastReportPacket: DigitalTwinReplayState['lastReportPacket'] = null;

  private currentKeyframe: ReplayKeyframe;
  private listeners: Set<(state: DigitalTwinReplayState) => void> = new Set();

  constructor() {
    this.currentKeyframe = this.interpolateKeyframe(0);
  }

  public subscribe(listener: (state: DigitalTwinReplayState) => void): () => void {
    this.listeners.add(listener);
    listener(this.getState());
    return () => this.listeners.delete(listener);
  }

  private notify() {
    const s = this.getState();
    this.listeners.forEach((fn) => fn(s));
  }

  public getState(): DigitalTwinReplayState {
    return {
      isActive: this.isActive,
      isPlaying: this.isPlaying,
      playbackSpeed: this.playbackSpeed,
      currentTime: this.currentTime,
      duration: this.duration,
      bandwidth: this.bandwidth,
      currentKeyframe: this.currentKeyframe,
      isReportGenerated: this.isReportGenerated,
      lastReportPacket: this.lastReportPacket,
    };
  }

  public setActive(active: boolean) {
    this.isActive = active;
    if (!active) {
      this.isPlaying = false;
    }
    this.notify();
  }

  public play() {
    this.isPlaying = true;
    this.notify();
  }

  public pause() {
    this.isPlaying = false;
    this.notify();
  }

  public togglePlay() {
    this.isPlaying = !this.isPlaying;
    this.notify();
  }

  public rewind(seconds: number = 10) {
    this.seek(Math.max(0, this.currentTime - seconds));
  }

  public cycleSpeed() {
    if (this.playbackSpeed === 1) this.playbackSpeed = 2;
    else if (this.playbackSpeed === 2) this.playbackSpeed = 4;
    else this.playbackSpeed = 1;
    this.notify();
  }

  public seek(seconds: number) {
    this.currentTime = Math.max(0, Math.min(this.duration, seconds));
    this.currentKeyframe = this.interpolateKeyframe(this.currentTime);
    zeroGKinematics.position.copy(this.currentKeyframe.position);
    zeroGKinematics.elevationY = this.currentKeyframe.elevationY;
    zeroGKinematics.quaternion.copy(this.currentKeyframe.quaternion);
    this.notify();
  }

  public update(delta: number) {
    if (!this.isActive || !this.isPlaying) return;

    let nextTime = this.currentTime + delta * this.playbackSpeed;
    if (nextTime >= this.duration) {
      nextTime = 0; // loop seamlessly
    }
    this.currentTime = nextTime;
    this.currentKeyframe = this.interpolateKeyframe(this.currentTime);
    zeroGKinematics.position.copy(this.currentKeyframe.position);
    zeroGKinematics.elevationY = this.currentKeyframe.elevationY;
    zeroGKinematics.quaternion.copy(this.currentKeyframe.quaternion);
    this.notify();
  }

  public getCurrentTransform(): {
    position: THREE.Vector3;
    elevationY: number;
    quaternion: THREE.Quaternion;
  } {
    return {
      position: this.currentKeyframe.position,
      elevationY: this.currentKeyframe.elevationY,
      quaternion: this.currentKeyframe.quaternion,
    };
  }

  /**
   * Deterministic mathematical interpolation of telemetry coordinates across 0..300s
   */
  private interpolateKeyframe(t: number): ReplayKeyframe {
    const clampedT = Math.max(0, Math.min(this.duration, t));

    // Find bounding waypoints
    let idx0 = 0;
    for (let i = 0; i < REPLAY_WAYPOINTS.length - 1; i++) {
      if (clampedT >= REPLAY_WAYPOINTS[i].time && clampedT <= REPLAY_WAYPOINTS[i + 1].time) {
        idx0 = i;
        break;
      }
    }
    const idx1 = Math.min(REPLAY_WAYPOINTS.length - 1, idx0 + 1);
    const w0 = REPLAY_WAYPOINTS[idx0];
    const w1 = REPLAY_WAYPOINTS[idx1];

    const span = Math.max(0.001, w1.time - w0.time);
    const rawAlpha = Math.max(0, Math.min(1, (clampedT - w0.time) / span));
    // Smooth cosine ease
    const alpha = 0.5 * (1 - Math.cos(rawAlpha * Math.PI));

    const posX = w0.pos[0] + (w1.pos[0] - w0.pos[0]) * alpha;
    const posZ = w0.pos[2] + (w1.pos[2] - w0.pos[2]) * alpha;

    // Micro-G elevation with subtle floating undulation
    const baseElevation = w0.pos[1] + (w1.pos[1] - w0.pos[1]) * alpha;
    const elevationY = baseElevation + Math.sin(clampedT * 1.6) * 0.025;

    // Yaw angle interpolation
    let yawDiff = w1.yaw - w0.yaw;
    while (yawDiff > Math.PI) yawDiff -= Math.PI * 2;
    while (yawDiff < -Math.PI) yawDiff += Math.PI * 2;
    const yaw = w0.yaw + yawDiff * alpha;

    // Pitch variation in transit
    const isTransit = w0.isTransit || w1.isTransit || rawAlpha > 0.05 && rawAlpha < 0.95 && (w0.pos[0] !== w1.pos[0] || w0.pos[2] !== w1.pos[2]);
    const pitch = isTransit ? Math.sin(rawAlpha * Math.PI) * 0.08 : 0;

    const euler = new THREE.Euler(pitch, yaw, 0, 'YXZ');
    const quat = new THREE.Quaternion().setFromEuler(euler);

    // Realistic deterministic biomechanical joint deltas (< 0.35 m/s safe threshold)
    const handMotionDelta = Math.round((0.18 + Math.sin(clampedT * 2.2) * 0.06) * 100) / 100;
    const wristDelta = Math.round((0.11 + Math.cos(clampedT * 1.8) * 0.03) * 100) / 100;
    const fingerJitterDelta = Math.round((0.08 + Math.sin(clampedT * 3.5) * 0.02) * 100) / 100;
    const totalDelta = Math.round((handMotionDelta + wristDelta + fingerJitterDelta) / 3 * 100) / 100;

    return {
      time: clampedT,
      position: new THREE.Vector3(posX, 0, posZ),
      elevationY,
      quaternion: quat,
      yaw,
      stationId: rawAlpha > 0.5 ? w1.stationId : w0.stationId,
      stationName: rawAlpha > 0.5 ? w1.stationName : w0.stationName,
      isTransit,
      jointKinematics: {
        handMotionDelta,
        wristDelta,
        fingerJitterDelta,
        totalDelta,
      },
    };
  }

  /**
   * Action: Generate Downlink Packet & Report for ultra-low bandwidth Earth downlink (<10 KB/min)
   */
  public generateReplayPacketAndReport(): { payloadSize: string; signatureLine: string; hashDisplay: string } {
    const sign = cryptographicLedger.signLog('[DIGITAL TWIN // PACKET GENERATED]');

    const payload = {
      payloadSize: '8.4 KB',
      timestamp: new Date().toISOString(),
      hashDisplay: sign.hashDisplay,
      signatureLine: sign.signatureLine,
    };

    this.isReportGenerated = true;
    this.lastReportPacket = payload;

    // Emit event to StationEventBus for EDGE AI Chat reception
    StationEventBus.emit('digitalTwinPacketGenerated', {
      payloadSize: payload.payloadSize,
      signature: payload.signatureLine,
      timestamp: payload.timestamp,
    });

    this.notify();
    return payload;
  }
}

export const digitalTwinReplayManager = new DigitalTwinReplayManager();

if (typeof window !== 'undefined') {
  (window as any).digitalTwinReplayManager = digitalTwinReplayManager;
}
