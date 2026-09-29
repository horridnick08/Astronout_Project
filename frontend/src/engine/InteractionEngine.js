import * as THREE from 'three';

/**
 * WAYPOINT DEFINITIONS
 * Calibrated for the Spaceship Corridor with Central Walkway (X: -0.8 to +0.8 clear)
 */
export const INTERACTION_ACTIONS = {
  OPERATE_PRIMARY_CONSOLE: 'OPERATE_PRIMARY_CONSOLE',
  OPERATE_SECONDARY_CONSOLE: 'OPERATE_SECONDARY_CONSOLE',
  INSPECT_WINDOW: 'INSPECT_WINDOW',
  GRAB_QUANTUM_CORE: 'GRAB_QUANTUM_CORE',
  MANUAL: 'MANUAL'
};

export const WAYPOINTS = {
  [INTERACTION_ACTIONS.OPERATE_PRIMARY_CONSOLE]: {
    id: INTERACTION_ACTIONS.OPERATE_PRIMARY_CONSOLE,
    name: 'Flight Operations Console',
    station: 'Station 1 (Front Left Wall)',
    targetPosition: new THREE.Vector3(-0.9, 0, -0.4),
    targetYaw: -Math.PI / 2, // Face left towards [-1.6, 0.81, -0.4]
    lookAtTarget: new THREE.Vector3(-1.6, 0.81, -0.4),
    description: 'Walks down clear aisle to [-0.9, 0, -0.4], faces Station 1 Laptop, and extends gauntlet to type.',
    poseType: 'TYPE_PRIMARY'
  },
  [INTERACTION_ACTIONS.OPERATE_SECONDARY_CONSOLE]: {
    id: INTERACTION_ACTIONS.OPERATE_SECONDARY_CONSOLE,
    name: 'Diagnostic Comms Mainframe',
    station: 'Station 2 (Mid Right Wall)',
    targetPosition: new THREE.Vector3(0.9, 0, -1.3),
    targetYaw: Math.PI / 2, // Face right towards [1.6, 0.81, -1.3]
    lookAtTarget: new THREE.Vector3(1.6, 0.81, -1.3),
    description: 'Walks to [0.9, 0, -1.3], faces Station 2 Console, and operates telemetry.',
    poseType: 'OPERATE_TELEMETRY'
  },
  [INTERACTION_ACTIONS.INSPECT_WINDOW]: {
    id: INTERACTION_ACTIONS.INSPECT_WINDOW,
    name: 'Observation Window EVA View',
    station: 'Deep Space Observation Window',
    targetPosition: new THREE.Vector3(0, 0, -2.5),
    targetYaw: Math.PI, // Face straight down corridor toward deep space window
    lookAtTarget: new THREE.Vector3(0, 1.2, -5.0),
    description: 'Walks straight down aisle to [0, 0, -2.5] (0.6m from glass) and turns 180° toward outer space.',
    poseType: 'INSPECT_COSMOS'
  },
  [INTERACTION_ACTIONS.GRAB_QUANTUM_CORE]: {
    id: INTERACTION_ACTIONS.GRAB_QUANTUM_CORE,
    name: 'Harvest Quantum Core',
    station: 'Station 4 (Far Right Wall Socket)',
    targetPosition: new THREE.Vector3(1.3, 0, -2.2),
    targetYaw: Math.PI / 2, // Face right towards [2.2, 0.75, -2.2]
    lookAtTarget: new THREE.Vector3(2.2, 0.75, -2.2),
    description: 'Walks to [1.3, 0, -2.2], reaches hand, and attaches Core to gauntlet.',
    poseType: 'GRAB_CORE'
  }
};

/**
 * InteractionEngine
 * 
 * Waypoint navigation & procedural kinematics state machine:
 * - Coordinates astronaut pathing down the central aisle (-0.8 to +0.8)
 * - Manages orientation and reaching / typing poses
 * - Controls Quantum Core attachment state to astronaut gauntlet
 */
class InteractionEngine {
  constructor() {
    this.currentAction = INTERACTION_ACTIONS.MANUAL;
    this.targetWaypoint = null;
    this.isNavigating = false;
    this.isInteracting = false;
    this.isCoreAttached = false;
    this.interactionTime = 0;
    this.walkSpeed = 1.6;
    this.listeners = new Set();

    // Intermediate path points to ensure astronaut stays in walkway
    this.pathQueue = [];
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
      currentAction: this.currentAction,
      targetWaypoint: this.targetWaypoint,
      isNavigating: this.isNavigating,
      isInteracting: this.isInteracting,
      isCoreAttached: this.isCoreAttached,
      interactionTime: this.interactionTime
    };
  }

  /**
   * Triggers an automated waypoint navigation action
   */
  executeAction(actionKey, currentPosition) {
    const waypoint = WAYPOINTS[actionKey];
    if (!waypoint) {
      this.cancelAction();
      return;
    }

    this.currentAction = actionKey;
    this.targetWaypoint = waypoint;
    this.isNavigating = true;
    this.isInteracting = false;
    this.interactionTime = 0;

    // Build corridor-safe path using clear central aisle:
    // 1. Move from current position to nearest aisle centerline (X in [-0.4, 0.4])
    // 2. Walk along Z aisle to waypoint.z
    // 3. Step sideways to destination targetPosition
    const curPos = currentPosition ? currentPosition.clone() : new THREE.Vector3(0, 0, 0);
    this.pathQueue = [];

    const aisleX = Math.max(-0.4, Math.min(0.4, curPos.x));
    const isAlreadyInAisle = Math.abs(curPos.x) <= 0.6;

    if (!isAlreadyInAisle) {
      // Step into aisle first
      this.pathQueue.push(new THREE.Vector3(aisleX, 0, curPos.z));
    }

    // Aisle waypoint along Z
    const targetAisleX = Math.max(-0.4, Math.min(0.4, waypoint.targetPosition.x));
    this.pathQueue.push(new THREE.Vector3(targetAisleX, 0, waypoint.targetPosition.z));

    // Final destination
    this.pathQueue.push(waypoint.targetPosition.clone());

    console.log(`[InteractionEngine] Executing action: ${actionKey}. Path steps: ${this.pathQueue.length}`);
    this.notify();
  }

  cancelAction() {
    this.currentAction = INTERACTION_ACTIONS.MANUAL;
    this.targetWaypoint = null;
    this.isNavigating = false;
    this.isInteracting = false;
    this.pathQueue = [];
    this.notify();
  }

  toggleCoreAttached(overrideVal) {
    this.isCoreAttached = overrideVal !== undefined ? !!overrideVal : !this.isCoreAttached;
    console.log(`[InteractionEngine] Quantum Core attached state: ${this.isCoreAttached}`);
    this.notify();
  }

  /**
   * Updates waypoint navigation and procedural interaction kinematics per frame
   */
  update(delta, astronautPos, currentRotationY, applyPoseCallback) {
    if (!this.isNavigating && !this.isInteracting) return null;

    if (this.isNavigating && this.pathQueue.length > 0) {
      const nextTarget = this.pathQueue[0];
      const dist = Math.hypot(nextTarget.x - astronautPos.x, nextTarget.z - astronautPos.z);

      if (dist < 0.08) {
        this.pathQueue.shift();
        if (this.pathQueue.length === 0) {
          // Reached final waypoint
          this.isNavigating = false;
          this.isInteracting = true;
          this.interactionTime = 0;

          // If action is GRAB_QUANTUM_CORE, schedule core attachment
          if (this.currentAction === INTERACTION_ACTIONS.GRAB_QUANTUM_CORE) {
            setTimeout(() => {
              this.toggleCoreAttached(true);
            }, 800);
          }

          this.notify();
        }
      } else {
        // Move towards next target in path
        const dirX = (nextTarget.x - astronautPos.x) / dist;
        const dirZ = (nextTarget.z - astronautPos.z) / dist;
        const moveDist = Math.min(dist, this.walkSpeed * delta);

        astronautPos.x += dirX * moveDist;
        astronautPos.z += dirZ * moveDist;

        // Facing direction of movement
        const targetAngle = Math.atan2(dirX, dirZ) + Math.PI;
        let diff = targetAngle - currentRotationY;
        while (diff < -Math.PI) diff += Math.PI * 2;
        while (diff > Math.PI) diff -= Math.PI * 2;
        const newRotationY = currentRotationY + diff * Math.min(1.0, delta * 9.0);

        return {
          isMoving: true,
          position: astronautPos,
          rotationY: newRotationY,
          speed: this.walkSpeed
        };
      }
    }

    if (this.isInteracting && this.targetWaypoint) {
      this.interactionTime += delta;

      // Smoothly rotate to face the station target
      const targetAngle = this.targetWaypoint.targetYaw;
      let diff = targetAngle - currentRotationY;
      while (diff < -Math.PI) diff += Math.PI * 2;
      while (diff > Math.PI) diff -= Math.PI * 2;
      const newRotationY = currentRotationY + diff * Math.min(1.0, delta * 6.0);

      // Procedural bone interaction poses applied via callback
      if (applyPoseCallback) {
        applyPoseCallback(this.targetWaypoint.poseType, this.interactionTime);
      }

      return {
        isMoving: false,
        position: astronautPos,
        rotationY: newRotationY,
        speed: 0
      };
    }

    return null;
  }
}

export const interactionEngine = new InteractionEngine();
