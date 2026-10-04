/**
 * TimedAutomatonManager.ts
 *
 * UPPAAL CTL Symbolic Timed Automaton Deadlock Verification Manager:
 * - Manages pre-flight XML timed automata procedure scripts.
 * - Simulates symbolic state-space exploration & CTL verification.
 * - Drives 3D Holographic Ghost Sequence, temporal timeline nodes, and laser sweep in the 3D Viewport.
 */

export type TimedAutomatonStatus = 'IDLE' | 'VERIFYING' | 'VERIFIED';

export interface ProcedureScript {
  id: string;
  filename: string;
  name: string;
  description: string;
  statesCount: number;
  clocksCount: number;
  formula: string;
  timelineSteps: Array<{ time: string; label: string; offset: [number, number, number] }>;
}

export interface TimedAutomatonState {
  status: TimedAutomatonStatus;
  selectedScriptId: string;
  selectedScript: ProcedureScript;
  scripts: ProcedureScript[];
  verificationProgress: number; // 0.0 to 1.0
  laserSweepX: number; // For 3D laser plane positioning
  ghostActive: boolean;
  ghostProgress: number; // For ghost fast-forward motion
  terminalLogs: string[];
  deadlockStateCount: number;
}

export const PROCEDURE_SCRIPTS: ProcedureScript[] = [
  {
    id: 'docking',
    filename: '01. AUTON_DOCKING_SEQUENCE.xml',
    name: 'Autonomous Docking Sequence',
    description: 'Proximity RCS pulse & soft-capture latch sequence',
    statesCount: 142850,
    clocksCount: 6,
    formula: 'A[] not deadlock',
    timelineSteps: [
      { time: 'T+0.0s', label: 'System Init', offset: [-1.2, 0.4, 0.0] },
      { time: 'T+1.2s', label: 'Valve Lock', offset: [-0.4, 0.8, -0.6] },
      { time: 'T+2.5s', label: 'Sync', offset: [0.6, 1.3, -1.2] },
    ],
  },
  {
    id: 'pressurization',
    filename: '02. CABIN_PRESSURIZATION_PROCEDURE.xml',
    name: 'Cabin Pressurization Procedure',
    description: 'Dual-chamber nitrogen/oxygen isobaric gradient stabilization',
    statesCount: 189420,
    clocksCount: 8,
    formula: 'A[] not deadlock',
    timelineSteps: [
      { time: 'T+0.0s', label: 'Purge Chamber', offset: [-1.2, 0.4, 0.0] },
      { time: 'T+1.4s', label: 'O2 Inject', offset: [-0.4, 0.8, -0.6] },
      { time: 'T+2.8s', label: '101.3 kPa Lock', offset: [0.6, 1.3, -1.2] },
    ],
  },
  {
    id: 'thruster',
    filename: '03. THRUSTER_STABILIZATION.xml',
    name: 'Thruster Stabilization',
    description: 'Four-quadrant hydrazine pulse attitude correction',
    statesCount: 215600,
    clocksCount: 5,
    formula: 'A[] not deadlock',
    timelineSteps: [
      { time: 'T+0.0s', label: 'Gimbal Arm', offset: [-1.2, 0.4, 0.0] },
      { time: 'T+1.0s', label: 'Ignition Pulse', offset: [-0.4, 0.8, -0.6] },
      { time: 'T+2.2s', label: 'Attitude Hold', offset: [0.6, 1.3, -1.2] },
    ],
  },
];

class TimedAutomatonManagerClass {
  private status: TimedAutomatonStatus = 'IDLE';
  private selectedScriptId: string = 'docking';
  private verificationProgress: number = 0;
  private laserSweepX: number = -1.5;
  private ghostActive: boolean = false;
  private ghostProgress: number = 0;
  private terminalLogs: string[] = [
    '>_ UPPAAL CTL Symbolic Engine ready.',
    '>_ Select a procedure script and run model check.',
  ];
  private deadlockStateCount: number = 0;

  private listeners: Set<(state: TimedAutomatonState) => void> = new Set();
  private animFrameId: number | null = null;

  public subscribe(listener: (state: TimedAutomatonState) => void): () => void {
    this.listeners.add(listener);
    listener(this.getState());
    return () => this.listeners.delete(listener);
  }

  private notify() {
    const s = this.getState();
    this.listeners.forEach((fn) => fn(s));
  }

  public getState(): TimedAutomatonState {
    const selectedScript =
      PROCEDURE_SCRIPTS.find((s) => s.id === this.selectedScriptId) || PROCEDURE_SCRIPTS[0];
    return {
      status: this.status,
      selectedScriptId: this.selectedScriptId,
      selectedScript,
      scripts: PROCEDURE_SCRIPTS,
      verificationProgress: this.verificationProgress,
      laserSweepX: this.laserSweepX,
      ghostActive: this.ghostActive,
      ghostProgress: this.ghostProgress,
      terminalLogs: this.terminalLogs,
      deadlockStateCount: this.deadlockStateCount,
    };
  }

  public selectScript(scriptId: string) {
    if (this.status === 'VERIFYING') return;
    this.selectedScriptId = scriptId;
    const script = PROCEDURE_SCRIPTS.find((s) => s.id === scriptId) || PROCEDURE_SCRIPTS[0];
    this.status = 'IDLE';
    this.verificationProgress = 0;
    this.ghostActive = false;
    this.terminalLogs = [
      `>_ Selected model: ${script.filename}`,
      `>_ Specification: ${script.name} (${script.clocksCount} clocks)`,
      `>_ CTL Goal: ${script.formula}`,
      `>_ Click [RUN SYMBOLIC MODEL CHECK] to verify.`,
    ];
    this.notify();
  }

  /**
   * Action: Run UPPAAL CTL Symbolic Model Check
   * 1. Appends live logs in real time
   * 2. Sweeps 3D laser plane across spatial temporal timeline nodes
   * 3. Activates holographic ghost motion simulation in 3D viewport
   * 4. Concludes with [TIMED AUTOMATON PROVEN: ZERO DEADLOCKS]
   */
  public runVerification() {
    if (this.status === 'VERIFYING') return;

    const script = this.getState().selectedScript;
    this.status = 'VERIFYING';
    this.verificationProgress = 0;
    this.ghostActive = true;
    this.ghostProgress = 0;
    this.terminalLogs = [
      `>_ [INIT] Parsing timed automaton XML: ${script.filename}`,
      `>_ Loading timed automaton model graph...`,
    ];
    this.notify();

    // Log stages
    setTimeout(() => {
      this.terminalLogs.push(
        `>_ Exploring symbolic state space (${script.statesCount.toLocaleString()} states parsed)...`
      );
      this.notify();
    }, 600);

    setTimeout(() => {
      this.terminalLogs.push(`>_ Verifying CTL Formula: AG (not deadlock)`);
      this.notify();
    }, 1300);

    // Laser & Ghost Animation Loop (~2.6s total)
    const startTime = performance.now();
    const duration = 2600;

    const animate = () => {
      const elapsed = performance.now() - startTime;
      const t = Math.min(1.0, elapsed / duration);
      this.verificationProgress = t;
      this.laserSweepX = -1.5 + t * 2.8; // Sweeps from -1.5m to +1.3m in scene space
      this.ghostProgress = (t * 3.5) % 1.0; // Fast-forward procedural cycle

      if (t < 1.0) {
        this.notify();
        this.animFrameId = requestAnimationFrame(animate);
      } else {
        // Complete Verification
        this.status = 'VERIFIED';
        this.verificationProgress = 1.0;
        this.laserSweepX = 1.3;
        this.deadlockStateCount = 0;
        this.terminalLogs.push(
          `>_ PROPERTY SATISFIED: Script is 100% deadlock-free.`,
          `>_ [SUCCESS] 0 deadlocks found across ${script.statesCount.toLocaleString()} states.`
        );
        this.notify();
      }
    };

    if (this.animFrameId) cancelAnimationFrame(this.animFrameId);
    this.animFrameId = requestAnimationFrame(animate);
  }

  public resetVerification() {
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    this.status = 'IDLE';
    this.verificationProgress = 0;
    this.ghostActive = false;
    this.ghostProgress = 0;
    this.notify();
  }
}

export const timedAutomatonManager = new TimedAutomatonManagerClass();
