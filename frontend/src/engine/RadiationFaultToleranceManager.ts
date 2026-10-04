import { StationEventBus } from './StationEventBus.ts';
import { cryptographicLedger } from './CryptographicLedger.ts';

export type RadiationScanStatus = 'IDLE' | 'SCANNING' | 'ANOMALY_DETECTED' | 'REPAIRING' | 'REPAIRED';

export interface RadiationFaultState {
  status: RadiationScanStatus;
  memoryReplicas: string;
  radiationProtection: string;
  votingEngine: string;
  laserColor: string;
  laserProgress: number; // 0 (top) to 1 (bottom)
  activeAnomalyBlock: number | null;
  cameraFocused: boolean;
  scanLog: string | null;
}

class RadiationFaultToleranceManagerClass {
  private status: RadiationScanStatus = 'IDLE';
  private memoryReplicas: string = '3/3 SYNCED';
  private radiationProtection: string = '100% ACTIVE';
  private votingEngine: string = 'DYNAMIC VOTING ENGINE: ENABLED';
  private laserColor: string = '#ff0055';
  private laserProgress: number = 0;
  private activeAnomalyBlock: number | null = null;
  private cameraFocused: boolean = false;
  private scanLog: string | null = null;

  private listeners: Set<(state: RadiationFaultState) => void> = new Set();
  private animFrameId: number | null = null;

  public subscribe(listener: (state: RadiationFaultState) => void): () => void {
    this.listeners.add(listener);
    listener(this.getState());
    return () => this.listeners.delete(listener);
  }

  private notify() {
    const s = this.getState();
    this.listeners.forEach((fn) => fn(s));
  }

  public getState(): RadiationFaultState {
    return {
      status: this.status,
      memoryReplicas: this.memoryReplicas,
      radiationProtection: this.radiationProtection,
      votingEngine: this.votingEngine,
      laserColor: this.laserColor,
      laserProgress: this.laserProgress,
      activeAnomalyBlock: this.activeAnomalyBlock,
      cameraFocused: this.cameraFocused,
      scanLog: this.scanLog,
    };
  }

  /**
   * Action 1: Initiate Cosmic Radiation Scan
   * - Switches camera to Server Rack
   * - Sweeps red laser from top to bottom
   * - Detects bit-flip anomaly in RAM Block #04
   * - Pushes warning to Edge AI chat stream
   */
  public initiateScan() {
    if (this.status === 'SCANNING' || this.status === 'REPAIRING') return;

    if (this.animFrameId) cancelAnimationFrame(this.animFrameId);

    this.status = 'SCANNING';
    this.laserColor = '#ff0055';
    this.laserProgress = 0;
    this.activeAnomalyBlock = null;
    this.cameraFocused = true;
    this.scanLog = 'SCAN IN PROGRESS // SWEEPING MEMORY BLOCKS 01-06';
    this.notify();

    const startTime = performance.now();
    const duration = 2400; // 2.4s sweep

    const step = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);
      this.laserProgress = progress;
      this.notify();

      if (progress < 1) {
        this.animFrameId = requestAnimationFrame(step);
      } else {
        // Scan completed: Anomaly Detected in Block #04
        this.status = 'ANOMALY_DETECTED';
        this.activeAnomalyBlock = 4;
        this.memoryReplicas = '2/3 FAULT (BLOCK #04)';
        this.votingEngine = 'DYNAMIC VOTING ENGINE: ACTIVE';
        this.scanLog = 'CRITICAL: COSMIC RAY BIT-FLIP IN RAM BLOCK #04';
        this.notify();

        // Sign and emit to StationEventBus for Edge AI Chat
        cryptographicLedger.signLog('WARNING: Cosmic Ray Bit-Flip detected in RAM Block #04');
        StationEventBus.emit('radiationBitFlipDetected', {
          blockNumber: 4,
          memoryAddress: '0x04F8A9'
        });
      }
    };

    this.animFrameId = requestAnimationFrame(step);
  }

  /**
   * Action 2: Execute Memory Auto-Repair
   * - Turns laser emerald green
   * - Sweeps green calibration laser
   * - Restores 3/3 replicas via dynamic voting
   * - Pushes resolution log to Edge AI chat stream
   */
  public executeAutoRepair() {
    if (this.status !== 'ANOMALY_DETECTED') return;

    if (this.animFrameId) cancelAnimationFrame(this.animFrameId);

    this.status = 'REPAIRING';
    this.laserColor = '#00ff99';
    this.laserProgress = 0;
    this.scanLog = 'DYNAMIC VOTING ENGINE // RECONSTRUCTING PARITY';
    this.notify();

    const startTime = performance.now();
    const duration = 1800; // 1.8s repair sweep

    const step = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);
      this.laserProgress = progress;
      this.notify();

      if (progress < 1) {
        this.animFrameId = requestAnimationFrame(step);
      } else {
        // Repair completed
        this.status = 'REPAIRED';
        this.activeAnomalyBlock = null;
        this.memoryReplicas = 'TRIPLE MEMORY REPLICAS: 3/3 SYNCED';
        this.votingEngine = 'DYNAMIC VOTING ENGINE: ENABLED';
        this.scanLog = 'AUTO-REPAIR COMPLETE // 100% INTEGRITY RESTORED';
        this.notify();

        // Sign and emit to StationEventBus for Edge AI Chat
        cryptographicLedger.signLog('RESOLVED: Bit-flip corrected via dynamic memory voting');
        StationEventBus.emit('radiationAutoRepaired', {
          blockNumber: 4,
          correctedVia: 'dynamic memory voting'
        });
      }
    };

    this.animFrameId = requestAnimationFrame(step);
  }

  public reset() {
    if (this.animFrameId) cancelAnimationFrame(this.animFrameId);
    this.status = 'IDLE';
    this.memoryReplicas = '3/3 SYNCED';
    this.votingEngine = 'DYNAMIC VOTING ENGINE: ENABLED';
    this.laserColor = '#ff0055';
    this.laserProgress = 0;
    this.activeAnomalyBlock = null;
    this.cameraFocused = false;
    this.scanLog = null;
    this.notify();
  }
}

export const radiationFaultToleranceManager = new RadiationFaultToleranceManagerClass();

if (typeof window !== 'undefined') {
  (window as any).radiationFaultToleranceManager = radiationFaultToleranceManager;
}
