/**
 * ProtocolInterpreterManager.ts
 *
 * Mission Control Protocol Interpreter & JSON-LD 3D Runtime Graph State Manager:
 * - Manages selectable JSON-LD payload experiment scripts.
 * - Controls 3D Runtime Graph expansion into main viewport.
 * - Manages interactive node hover states and live data streams.
 */

export interface JsonLdPayload {
  id: string;
  filename: string;
  title: string;
  subtitle: string;
  contextUri: string;
  type: string;
  payloadScript: string;
  telemetryHook: string;
  schema: Record<string, any>;
  attributes: Array<{ key: string; value: string; type: string }>;
}

export interface ProtocolInterpreterState {
  selectedPayloadId: string;
  isGraphActive: boolean;
  hoveredNodeId: string | null;
  payloads: JsonLdPayload[];
  activePayload: JsonLdPayload;
}

export const PROTOCOL_PAYLOADS: JsonLdPayload[] = [
  {
    id: 'spectrometer',
    filename: 'SPECTROMETER_ATMOSPHERE_SCAN.jsonld',
    title: 'Atmospheric Spectrometry Scan',
    subtitle: 'Exosphere Trace Gas Analysis',
    contextUri: 'https://w3id.org/aerospace/v2/telemetry',
    type: 'AtmosphericSpectrometryScan',
    payloadScript: 'eva_spectrometer_v4.py',
    telemetryHook: 'BUS_01_SPECTRO_STREAM',
    schema: {
      '@context': 'https://w3id.org/aerospace/v2/telemetry',
      '@type': 'AtmosphericSpectrometryScan',
      payloadScript: 'eva_spectrometer_v4.py',
      telemetry_hook: 'BUS_01_SPECTRO_STREAM',
      scan_resolution: '0.02 nm',
      spectral_bands: ['O2_A_BAND', 'CO2_SWIR', 'CH4_TRACE'],
      target_vector: 'NADIR_ATMOSPHERE',
      sample_rate_hz: 100,
    },
    attributes: [
      { key: 'scan_resolution', value: '0.02 nm', type: 'Float' },
      { key: 'spectral_bands', value: 'O2_A, CO2_SWIR, CH4', type: 'Array<Band>' },
      { key: 'target_vector', value: 'NADIR_ATMOSPHERE', type: 'Vector3' },
      { key: 'sample_rate_hz', value: '100 Hz', type: 'Integer' },
    ],
  },
  {
    id: 'quantum',
    filename: 'QUANTUM_RESONANCE_EXPERIMENT.jsonld',
    title: 'Quantum Resonance Experiment',
    subtitle: 'Cavity QED Particle Decoherence',
    contextUri: 'https://w3id.org/aerospace/v2/quantum',
    type: 'QuantumResonanceExperiment',
    payloadScript: 'q_cavity_sweep.rs',
    telemetryHook: 'BUS_02_QUANTUM_CORE',
    schema: {
      '@context': 'https://w3id.org/aerospace/v2/quantum',
      '@type': 'QuantumResonanceExperiment',
      payloadScript: 'q_cavity_sweep.rs',
      telemetry_hook: 'BUS_02_QUANTUM_CORE',
      resonator_freq: '7.42 GHz',
      coherence_time_us: 142.5,
      qubit_state: '|Ψ⟩ = 0.707|0⟩ + 0.707|1⟩',
      error_mitigation: 'TMR_VOTER',
    },
    attributes: [
      { key: 'resonator_freq', value: '7.42 GHz', type: 'Frequency' },
      { key: 'coherence_time_us', value: '142.5 µs', type: 'Microseconds' },
      { key: 'qubit_state', value: '|Ψ⟩ = 0.707|0⟩ + 0.707|1⟩', type: 'Superposition' },
      { key: 'error_mitigation', value: 'TMR_VOTER', type: 'FaultTolerance' },
    ],
  },
  {
    id: 'biometrics',
    filename: 'EVA_BIOMETRIC_TELEMETRY.jsonld',
    title: 'EVA Biometric Telemetry',
    subtitle: 'Crew Kinematics & Metabolic Flux',
    contextUri: 'https://w3id.org/aerospace/v2/biometrics',
    type: 'EvaBiometricTelemetry',
    payloadScript: 'biomech_tracker.wasm',
    telemetryHook: 'BUS_03_SUIT_SE3',
    schema: {
      '@context': 'https://w3id.org/aerospace/v2/biometrics',
      '@type': 'EvaBiometricTelemetry',
      payloadScript: 'biomech_tracker.wasm',
      telemetry_hook: 'BUS_03_SUIT_SE3',
      metabolic_rate: '240 W',
      heart_rate_bpm: 74,
      suit_pressure_kpa: 29.6,
      joint_invariance: 'SE(3)_ISOMORPHIC',
    },
    attributes: [
      { key: 'metabolic_rate', value: '240 W', type: 'Wattage' },
      { key: 'heart_rate_bpm', value: '74 BPM', type: 'Cardiac' },
      { key: 'suit_pressure_kpa', value: '29.6 kPa', type: 'Pressure' },
      { key: 'joint_invariance', value: 'SE(3)_ISOMORPHIC', type: 'LieAlgebra' },
    ],
  },
  {
    id: 'orbital',
    filename: 'ORBITAL_KINEMATICS_SCHEMA.jsonld',
    title: 'Orbital Kinematics Schema',
    subtitle: 'Relativistic Keplerian Trajectory',
    contextUri: 'https://w3id.org/aerospace/v2/orbital',
    type: 'OrbitalKinematicsSchema',
    payloadScript: 'kepler_propagator.cu',
    telemetryHook: 'BUS_04_EPHEMERIS',
    schema: {
      '@context': 'https://w3id.org/aerospace/v2/orbital',
      '@type': 'OrbitalKinematicsSchema',
      payloadScript: 'kepler_propagator.cu',
      telemetry_hook: 'BUS_04_EPHEMERIS',
      semi_major_axis_km: 6782.4,
      inclination_deg: 51.64,
      eccentricity: 0.00032,
      anomaly_rate: '0.063 rad/s',
    },
    attributes: [
      { key: 'semi_major_axis_km', value: '6782.4 km', type: 'Distance' },
      { key: 'inclination_deg', value: '51.64°', type: 'Angle' },
      { key: 'eccentricity', value: '0.00032', type: 'OrbitalShape' },
      { key: 'anomaly_rate', value: '0.063 rad/s', type: 'AngularVelocity' },
    ],
  },
];

class ProtocolInterpreterManagerClass {
  private selectedPayloadId: string = 'spectrometer';
  private isGraphActive: boolean = false;
  private hoveredNodeId: string | null = null;
  private listeners: Set<(state: ProtocolInterpreterState) => void> = new Set();

  public subscribe(listener: (state: ProtocolInterpreterState) => void): () => void {
    this.listeners.add(listener);
    listener(this.getState());
    return () => this.listeners.delete(listener);
  }

  private notify() {
    const s = this.getState();
    this.listeners.forEach((fn) => fn(s));
  }

  public getState(): ProtocolInterpreterState {
    const activePayload =
      PROTOCOL_PAYLOADS.find((p) => p.id === this.selectedPayloadId) || PROTOCOL_PAYLOADS[0];
    return {
      selectedPayloadId: this.selectedPayloadId,
      isGraphActive: this.isGraphActive,
      hoveredNodeId: this.hoveredNodeId,
      payloads: PROTOCOL_PAYLOADS,
      activePayload,
    };
  }

  public selectPayload(id: string) {
    this.selectedPayloadId = id;
    this.notify();
  }

  public setGraphActive(active: boolean) {
    this.isGraphActive = active;
    this.notify();
  }

  public toggleGraph() {
    this.isGraphActive = !this.isGraphActive;
    this.notify();
  }

  public setHoveredNode(nodeId: string | null) {
    this.hoveredNodeId = nodeId;
    this.notify();
  }
}

export const protocolInterpreterManager = new ProtocolInterpreterManagerClass();
