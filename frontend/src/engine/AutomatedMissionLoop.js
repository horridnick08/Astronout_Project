import * as THREE from 'three';

/**
 * AUTOMATED ASTRONAUT 30-40s MISSION LOOP
 * 
 * Runs a continuous, cinematic 12-step task loop (~37.5 seconds total):
 * Step 1: Astronaut floats backwards inside corridor (3.0s)
 * Step 2: Moves toward first window to look outside (3.0s)
 * Step 3: Floats to second window to observe (3.0s)
 * Step 4: Moves to first computer desk & performs typing action (3.5s)
 * Step 5: Moves to opposite side computer desk & types (3.5s)
 * Step 6: Turns to look straight ahead down the aisle (2.5s)
 * Step 7: Floats towards storage barrels to inspect them (3.0s)
 * Step 8: Returns to look out window briefly (2.5s)
 * Step 9: Reaches out to grab Quantum Core & says: "I have to use quantum core for energy." (3.5s)
 * Step 10: Puts quantum core back in its place (2.5s)
 * Step 11: Floats to center of room, faces forward & prompts: "Hey Edge AI, what's the next step I need to do?" (3.0s)
 * Step 12: Edge AI responds: "Telemetry stable. Proceed to calibrate oxygen valves and verify sector 4 pressure." (3.5s)
 * -> Loops back to Step 1 seamlessly.
 */

export const MISSION_STEPS = [
  {
    stepIndex: 1,
    name: 'Float Backwards',
    duration: 3.0,
    startPos: new THREE.Vector3(0, 0, 0),
    targetPos: new THREE.Vector3(0, 0, 1.6),
    targetYaw: 0,
    poseType: 'FLOAT_BACKWARDS',
    isCoreAttached: false,
    subtitle: null
  },
  {
    stepIndex: 2,
    name: 'Inspect Window 1',
    duration: 3.0,
    startPos: new THREE.Vector3(0, 0, 1.6),
    targetPos: new THREE.Vector3(-1.1, 0, 0.6),
    targetYaw: -Math.PI / 2, // Face left window
    poseType: 'LOOK_OUT_WINDOW_1',
    isCoreAttached: false,
    subtitle: null
  },
  {
    stepIndex: 3,
    name: 'Observe Window 2',
    duration: 3.0,
    startPos: new THREE.Vector3(-1.1, 0, 0.6),
    targetPos: new THREE.Vector3(-1.2, 0, -2.8),
    targetYaw: -Math.PI / 2, // Face deep space observation window
    poseType: 'LOOK_OUT_WINDOW_2',
    isCoreAttached: false,
    subtitle: null
  },
  {
    stepIndex: 4,
    name: 'Type at Desk 1',
    duration: 3.5,
    startPos: new THREE.Vector3(-1.2, 0, -2.8),
    targetPos: new THREE.Vector3(-0.95, 0, -0.4),
    targetYaw: -Math.PI / 2, // Face Flight Ops laptop
    poseType: 'TYPE_LAPTOP',
    isCoreAttached: false,
    subtitle: null
  },
  {
    stepIndex: 5,
    name: 'Type at Desk 2',
    duration: 3.5,
    startPos: new THREE.Vector3(-0.95, 0, -0.4),
    targetPos: new THREE.Vector3(0.95, 0, -1.3),
    targetYaw: Math.PI / 2, // Face Diagnostic Comms console
    poseType: 'TYPE_CONSOLE',
    isCoreAttached: false,
    subtitle: null
  },
  {
    stepIndex: 6,
    name: 'Look Down Aisle',
    duration: 2.5,
    startPos: new THREE.Vector3(0.95, 0, -1.3),
    targetPos: new THREE.Vector3(0, 0, -1.3),
    targetYaw: Math.PI, // Look straight down corridor aisle
    poseType: 'LOOK_AHEAD',
    isCoreAttached: false,
    subtitle: null
  },
  {
    stepIndex: 7,
    name: 'Inspect Storage Barrels',
    duration: 3.0,
    startPos: new THREE.Vector3(0, 0, -1.3),
    targetPos: new THREE.Vector3(-1.3, 0, -3.0),
    targetYaw: -Math.PI * 0.72, // Face cargo alcove barrels
    poseType: 'INSPECT_BARRELS',
    isCoreAttached: false,
    subtitle: null
  },
  {
    stepIndex: 8,
    name: 'Look Out Window Briefly',
    duration: 2.5,
    startPos: new THREE.Vector3(-1.3, 0, -3.0),
    targetPos: new THREE.Vector3(-1.1, 0, -1.8),
    targetYaw: -Math.PI / 2, // Face observation window
    poseType: 'LOOK_WINDOW_BRIEF',
    isCoreAttached: false,
    subtitle: null
  },
  {
    stepIndex: 9,
    name: 'Grab Quantum Core',
    duration: 3.5,
    startPos: new THREE.Vector3(-1.1, 0, -1.8),
    targetPos: new THREE.Vector3(1.3, 0, -2.2),
    targetYaw: Math.PI / 2, // Face reactor wall socket
    poseType: 'GRAB_CORE',
    isCoreAttached: true,
    subtitle: {
      speaker: 'EVA-1 // ASTRONAUT',
      type: 'astronaut',
      text: 'I have to use quantum core for energy.'
    }
  },
  {
    stepIndex: 10,
    name: 'Put Core Back in Place',
    duration: 2.5,
    startPos: new THREE.Vector3(1.3, 0, -2.2),
    targetPos: new THREE.Vector3(1.3, 0, -2.2),
    targetYaw: Math.PI / 2,
    poseType: 'PLACE_CORE_BACK',
    isCoreAttached: false,
    subtitle: null
  },
  {
    stepIndex: 11,
    name: 'Prompt Edge AI',
    duration: 3.0,
    startPos: new THREE.Vector3(1.3, 0, -2.2),
    targetPos: new THREE.Vector3(0, 0, 0),
    targetYaw: 0, // Face forward toward camera/center
    poseType: 'PROMPT_AI',
    isCoreAttached: false,
    subtitle: {
      speaker: 'EVA-1 // ASTRONAUT',
      type: 'astronaut',
      text: "Hey Edge AI, what's the next step I need to do?"
    }
  },
  {
    stepIndex: 12,
    name: 'Edge AI Response',
    duration: 3.5,
    startPos: new THREE.Vector3(0, 0, 0),
    targetPos: new THREE.Vector3(0, 0, 0),
    targetYaw: 0, // Face forward
    poseType: 'AI_RESPONSE',
    isCoreAttached: false,
    subtitle: {
      speaker: 'EDGE AI // CORE INTEL',
      type: 'ai',
      text: 'Telemetry stable. Proceed to calibrate oxygen valves and verify sector 4 pressure.'
    }
  }
];

export const TOTAL_LOOP_DURATION = MISSION_STEPS.reduce((sum, s) => sum + s.duration, 0);

class AutomatedMissionLoop {
  constructor() {
    this.elapsedTime = 0;
    this.currentStep = MISSION_STEPS[0];
    this.currentPosition = new THREE.Vector3(0, 0, 0);
    this.currentRotationY = 0;
    this.isCoreAttached = false;
    this.currentSubtitle = null;
    this.listeners = new Set();
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notify() {
    const state = this.getState();
    this.listeners.forEach((listener) => listener(state));
  }

  getState() {
    return {
      elapsedTime: this.elapsedTime,
      totalDuration: TOTAL_LOOP_DURATION,
      stepIndex: this.currentStep ? this.currentStep.stepIndex : 1,
      stepName: this.currentStep ? this.currentStep.name : '',
      poseType: this.currentStep ? this.currentStep.poseType : 'FLOAT_BACKWARDS',
      position: this.currentPosition.clone(),
      rotationY: this.currentRotationY,
      isCoreAttached: this.isCoreAttached,
      subtitle: this.currentSubtitle
    };
  }

  /**
   * Advances loop timeline by delta seconds
   */
  update(delta) {
    this.elapsedTime = (this.elapsedTime + delta) % TOTAL_LOOP_DURATION;

    // Determine current step based on cumulative time
    let accumulatedTime = 0;
    let activeStep = MISSION_STEPS[0];
    let stepStartTime = 0;

    for (const step of MISSION_STEPS) {
      if (this.elapsedTime >= accumulatedTime && this.elapsedTime < accumulatedTime + step.duration) {
        activeStep = step;
        stepStartTime = accumulatedTime;
        break;
      }
      accumulatedTime += step.duration;
    }

    const timeInStep = this.elapsedTime - stepStartTime;
    const stepDuration = activeStep.duration;

    // Movement interpolation: first 65% of step duration is smooth traversal
    const moveDuration = Math.min(stepDuration * 0.65, 2.2);
    let moveProgress = 1.0;
    if (moveDuration > 0.05) {
      moveProgress = Math.min(1.0, timeInStep / moveDuration);
    }
    const smoothT = THREE.MathUtils.smoothstep(moveProgress, 0, 1);

    this.currentPosition.lerpVectors(activeStep.startPos, activeStep.targetPos, smoothT);

    // Smooth heading rotation toward targetYaw
    let diff = activeStep.targetYaw - this.currentRotationY;
    while (diff < -Math.PI) diff += Math.PI * 2;
    while (diff > Math.PI) diff -= Math.PI * 2;
    this.currentRotationY += diff * Math.min(1.0, delta * 5.0);

    const prevStepIndex = this.currentStep ? this.currentStep.stepIndex : null;
    const prevCoreAttached = this.isCoreAttached;
    const prevSubtitleText = this.currentSubtitle ? this.currentSubtitle.text : null;

    this.currentStep = activeStep;
    this.isCoreAttached = activeStep.isCoreAttached;
    this.currentSubtitle = activeStep.subtitle;

    const newSubtitleText = this.currentSubtitle ? this.currentSubtitle.text : null;

    // Notify React listeners whenever step, core state, or subtitle changes
    if (
      prevStepIndex !== activeStep.stepIndex ||
      prevCoreAttached !== this.isCoreAttached ||
      prevSubtitleText !== newSubtitleText
    ) {
      this.notify();
    }

    return {
      position: this.currentPosition,
      rotationY: this.currentRotationY,
      poseType: activeStep.poseType,
      isCoreAttached: this.isCoreAttached,
      timeInStep
    };
  }
}

export const automatedMissionLoop = new AutomatedMissionLoop();
