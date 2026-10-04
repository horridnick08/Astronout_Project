/**
 * TimedAutomatonManager.ts
 *
 * UPPAAL CTL Symbolic Timed Automaton Deadlock Verification Manager:
 * - Manages pre-flight XML timed automata procedure scripts.
 * - Non-blocking async simulation using setTimeout (300ms delay per log line, completing in < 1.5s).
 * - Pure state manager with zero CPU-thrashing RAF loops.
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
  ghostActive: boolean;
  terminalLogs: string[];
  deadlockStateCount: number;
  isVerifying: boolean;
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
      { time: 'T+0.0s', label: 'System Init', offset: [-0.6, 0.2, 0.3] },
      { time: 'T+1.2s', label: 'Valve Lock', offset: [0.0, 0.6, 0.0] },
      { time: 'T+2.5s', label: 'Sync', offset: [0.6, 1.0, -0.3] },
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
      { time: 'T+0.0s', label: 'Purge Chamber', offset: [-0.6, 0.2, 0.3] },
      { time: 'T+1.4s', label: 'O2 Inject', offset: [0.0, 0.6, 0.0] },
      { time: 'T+2.8s', label: '101.3 kPa Lock', offset: [0.6, 1.0, -0.3] },
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
      { time: 'T+0.0s', label: 'Gimbal Arm', offset: [-0.6, 0.2, 0.3] },
      { time: 'T+1.0s', label: 'Ignition Pulse', offset: [0.0, 0.6, 0.0] },
      { time: 'T+2.2s', label: 'Attitude Hold', offset: [0.6, 1.0, -0.3] },
    ],
  },
];

class TimedAutomatonManagerClass {
  private status: TimedAutomatonStatus = 'IDLE';
  private selectedScriptId: string = 'docking';
  private verificationProgress: number = 0;
  private ghostActive: boolean = false;
  private terminalLogs: string[] = [
    '>_ UPPAAL CTL Symbolic Engine ready.',
    '>_ Select a procedure script and run model check.',
  ];
  private deadlockStateCount: number = 0;

  private listeners: Set<(state: TimedAutomatonState) => void> = new Set();
  private timerIds: Array<ReturnType<typeof setTimeout>> = [];

  public subscribe(listener: (state: TimedAutomatonState) => void): () => void {
    this.listeners.add(listener);
    listener(this.getState());
    return () => this.listeners.delete(listener);
  }

  private notify() {
    const s = this.getState();
    this.listeners.forEach((fn) => {
      try {
        fn(s);
      } catch (err) {
        console.error('[TimedAutomatonManager] Listener error:', err);
      }
    });
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
      ghostActive: this.ghostActive,
      terminalLogs: this.terminalLogs,
      deadlockStateCount: this.deadlockStateCount,
      isVerifying: this.status === 'VERIFYING',
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

  private clearTimers() {
    this.timerIds.forEach((id) => clearTimeout(id));
    this.timerIds = [];
  }

  /**
   * Action: Non-blocking async simulation using setTimeout (300ms delay per log line)
   * Completes in < 1.5s total (900ms) with structured execution logs.
   */
  public runModelCheck() {
    this.runVerification();
  }

  public runVerification() {
    if (this.status === 'VERIFYING') return;

    this.clearTimers();
    const script = this.getState().selectedScript;
    this.status = 'VERIFYING';
    this.verificationProgress = 0.1;
    this.ghostActive = true;

    // Line 1: Immediate
    this.terminalLogs = [
      `>_ Loading timed automaton model graph...`,
    ];
    this.notify();

    // Line 2: 300ms
    const t1 = setTimeout(() => {
      this.verificationProgress = 0.45;
      this.terminalLogs = [
        ...this.terminalLogs,
        `>_ Exploring symbolic state space (${script.statesCount.toLocaleString()} states parsed)...`,
      ];
      this.notify();
    }, 300);
    this.timerIds.push(t1);

    // Line 3: 600ms
    const t2 = setTimeout(() => {
      this.verificationProgress = 0.75;
      this.terminalLogs = [
        ...this.terminalLogs,
        `>_ Verifying CTL Formula: AG (not deadlock)`,
      ];
      this.notify();
    }, 600);
    this.timerIds.push(t2);

    // Line 4: 900ms - Property satisfied & Completion (<1.5s)
    const t3 = setTimeout(() => {
      this.verificationProgress = 1.0;
      this.status = 'VERIFIED';
      this.deadlockStateCount = 0;
      this.terminalLogs = [
        ...this.terminalLogs,
        `>_ PROPERTY SATISFIED: Script is 100% deadlock-free.`,
      ];
      this.notify();
    }, 900);
    this.timerIds.push(t3);
  }

  public resetVerification() {
    this.clearTimers();
    this.status = 'IDLE';
    this.verificationProgress = 0;
    this.ghostActive = false;
    this.notify();
  }
}

export const timedAutomatonManager = new TimedAutomatonManagerClass();
