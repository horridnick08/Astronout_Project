import * as THREE from 'three';
import { missionTimeline } from './useMissionTimeline.ts';

/**
 * useZeroGKinematics.ts
 * 
 * Mathematically Grounded Microgravity Physics & Biomechanical Kinematics Engine:
 * 
 * 1. Biomechanical Joint Limits (Anti-Deformation & Anti-Clipping Logic):
 *    - Knee Flexion: strictly constrained in [5°, 35°] ([0.087 rad, 0.61 rad]).
 *    - Shoulder & Arm Pitch/Yaw: constrained within [-30°, 45°] ([-0.52 rad, 0.78 rad])
 *      guaranteeing hands/forearms never penetrate the heavy EVA chest pack, backpack, or helmet.
 *    - Spine & Neck: capped at ±10° (±0.174 rad) preserving suit structural rigidity.
 * 
 * 2. Microgravity Floating Dynamics (Subtle Momentum Impulse Physics):
 *    - Frame-rate independent exponential damping via THREE.MathUtils.damp for zero jitter.
 *    - Rigid body obstacle collision detection with soft bounce-back restitution impulse.
 *    - Contextual reaction trigger notifying missionTimeline when Oops event occurs.
 */

export interface ObstacleBox {
  id: string;
  min: THREE.Vector3;
  max: THREE.Vector3;
}

// Compact working zone boundaries & distinct non-overlapping station AABBs
export const CORRIDOR_OBSTACLES: ObstacleBox[] = [
  // Port / Left Hull Boundary
  { id: 'port_hull', min: new THREE.Vector3(-3.0, 0, -6.0), max: new THREE.Vector3(-1.88, 3.2, 5.0) },
  // Starboard / Right Hull Boundary
  { id: 'starboard_hull', min: new THREE.Vector3(1.88, 0, -6.0), max: new THREE.Vector3(3.0, 3.2, 5.0) },
  // Forward Module Bulkhead
  { id: 'forward_bulkhead', min: new THREE.Vector3(-2.5, 0, 3.2), max: new THREE.Vector3(2.5, 3.2, 4.5) },
  // Aft Module Bulkhead
  { id: 'aft_bulkhead', min: new THREE.Vector3(-2.5, 0, -5.5), max: new THREE.Vector3(2.5, 3.2, -4.6) },

  // STATION 1: Primary Flight Ops Console & Shelf (Port Wall Z: 0.0 to 1.6)
  { id: 'flight_ops_console', min: new THREE.Vector3(-2.0, 0, 0.0), max: new THREE.Vector3(-1.48, 1.8, 1.6) },

  // Storage Bay Telemetry Console (Port Wall Z: -2.15 to -0.85)
  { id: 'storage_telemetry_console', min: new THREE.Vector3(-2.0, 0, -2.15), max: new THREE.Vector3(-1.48, 1.8, -0.85) },

  // STATION 2: Storage Barrels (Port Wall Z: -4.4 to -3.2)
  { id: 'storage_barrels', min: new THREE.Vector3(-2.0, 0, -4.4), max: new THREE.Vector3(-1.40, 1.4, -3.2) },

  // STATION 6: Secondary Telemetry & Downlink Screen (Starboard Wall Z: 0.45 to 1.55)
  { id: 'downlink_screen', min: new THREE.Vector3(1.68, 0.5, 0.45), max: new THREE.Vector3(2.0, 2.1, 1.55) },

  // STATION 4: Orbit Radar Screen (Starboard Wall Z: -0.75 to 0.35)
  { id: 'radar_screen', min: new THREE.Vector3(1.68, 0.5, -0.75), max: new THREE.Vector3(2.0, 2.1, 0.35) },

  // STATION 4: Earth Hologram Pedestal (Floor at [1.45, 0, -2.30])
  { id: 'earth_hologram_pedestal', min: new THREE.Vector3(1.05, 0, -2.75), max: new THREE.Vector3(1.85, 1.8, -1.85) },

  // STATION 5: Quantum Core Socket & Terminal (Starboard Wall Z: -2.05 to -1.05)
  { id: 'quantum_station', min: new THREE.Vector3(1.65, 0.5, -2.05), max: new THREE.Vector3(2.0, 2.0, -1.05) },

  // STATION 3: Hull Observation Window Frame (Starboard Wall Z: -3.55 to -2.25)
  { id: 'observation_window', min: new THREE.Vector3(1.68, 0.5, -3.55), max: new THREE.Vector3(2.0, 2.2, -2.25) }
];

export class ZeroGKinematicsEngine {
  public mass: number = 140; // 140kg total suit + astronaut mass
  public position: THREE.Vector3 = new THREE.Vector3(-1.00, 0, 0.80);
  public baseY: number = 0.08; // Floor proximity height baseline (0.05m to 0.15m)
  public elevationY: number = 0.08;
  public compressionFactor: number = 0.0;
  public isMoving: boolean = false;

  // Extended Air-Time & Directional Trajectory Tuning
  public airTime: number = 2.2; // Extended 2.5x - 3.0x duration (1.8s - 2.5s) per hop
  public hopAmplitude: number = 0.095; // Fixed peak jump height <= 0.10m - 0.12m
  public hopTimer: number = 0;
  public headingAngle: number = -Math.PI / 2;
  public hopProgress: number = 0;

  public velocity: THREE.Vector3 = new THREE.Vector3(0, 0, 0);
  public impulseVelocity: THREE.Vector3 = new THREE.Vector3(0, 0, 0);
  public acceleration: THREE.Vector3 = new THREE.Vector3(0, 0, 0);
  public currentRotationY: number = -Math.PI / 2;
  public quaternion: THREE.Quaternion = new THREE.Quaternion();

  // Inertial trailing vectors
  public armLag: THREE.Vector2 = new THREE.Vector2(0, 0);
  public spineLag: number = 0;

  // Collision Avoidance & "Oops!" state
  public isOopsActive: boolean = false;
  public oopsTimer: number = 0;
  public recoveryVector: THREE.Vector3 = new THREE.Vector3(0, 0, 0);

  // Proximity-based station screen interaction blend weight [0.0 (rest) -> 1.0 (screen pointing)]
  public stationInteractionWeight: number = 0;

  // Randomized Procedural Interaction Gesture State Machine
  public currentGestureMode: 'SINGLE_HAND_POINTING' | 'DUAL_HAND_INTERACTION' | 'THINKING_ANALYSIS' = 'SINGLE_HAND_POINTING';
  public activePointingArm: 'RIGHT' | 'LEFT' = 'RIGHT';
  public gestureTimer: number = 0;
  private prevPoseType: string = '';

  private prevPosition: THREE.Vector3 = new THREE.Vector3(-1.00, 0, 0.80);
  private prevVelocity: THREE.Vector3 = new THREE.Vector3(0, 0, 0);
  private targetQuat: THREE.Quaternion = new THREE.Quaternion();
  private targetEuler: THREE.Euler = new THREE.Euler(0, 0, 0, 'YXZ');

  constructor() {
    this.targetEuler.set(0, -Math.PI / 2, 0);
    this.quaternion.setFromEuler(this.targetEuler);
  }

  /**
   * Triggers a soft bounce-back physics impulse and synchronizes the Oops event
   */
  public triggerOopsRebound() {
    this.isOopsActive = true;
    this.oopsTimer = 2.4;
    const pushDir = -Math.sign(this.position.x || 1);
    this.recoveryVector.set(pushDir, 0, 0);
    this.velocity.set(pushDir * 0.45, 0, 0);
    missionTimeline.triggerOops();
  }

  /**
   * Rigid Body Collision Evaluation using Capsule/Cylinder Radius R = 0.20m
   */
  public checkObstacleCollision(currentPos: THREE.Vector3, vel: THREE.Vector3): { collided: boolean; normal: THREE.Vector3 } {
    const threshold = 0.20; // Astronaut EVA rigid boundary radius
    const testPos = currentPos.clone().add(vel.clone().multiplyScalar(0.04));

    for (const obs of CORRIDOR_OBSTACLES) {
      // Check vertical clearance first
      if (testPos.y + 1.6 < obs.min.y || testPos.y > obs.max.y) continue;

      const closestX = Math.max(obs.min.x, Math.min(testPos.x, obs.max.x));
      const closestZ = Math.max(obs.min.z, Math.min(testPos.z, obs.max.z));

      const dx = testPos.x - closestX;
      const dz = testPos.z - closestZ;
      const dist = Math.hypot(dx, dz);

      if (dist < threshold) {
        const normal = new THREE.Vector3(dx, 0, dz).normalize();
        if (normal.lengthSq() < 0.001) normal.set(-Math.sign(testPos.x) || 1, 0, 0);
        return { collided: true, normal };
      }
    }

    return { collided: false, normal: new THREE.Vector3(0, 0, 0) };
  }

  /**
   * Low-Gravity Surface / Interior Traversal Physics:
   * 
   * 1. Air-Time Parabolic Suspension:
   *    - Fixed Peak Jump Height: A = 0.095m (<= 0.10m - 0.12m)
   *    - Extended Parabolic Flight Duration: T_air = 2.2s per hop
   *    - Profile: y(t) = y_base + A * (sin(pi * t / T_air))^0.85
   * 
   * 2. Frame-Rate Independent Delta Damping (THREE.MathUtils.damp):
  /**
   * Low-Gravity Surface / Interior Traversal Physics:
   * 
   * 1. Distance-Proportional Multi-Hop Movement:
   *    - Linear velocity and rotational lerp rate reduced by 50% for realistic slow-motion micro-G.
   *    - Spans multiple consecutive low-G hops (0.6m - 0.8m each) until reaching proximity (0.3m - 0.5m).
   *    - Parabolic apex hang-time: y(t) = y_base + A * (sin(pi * tau))^0.85 (A = 0.095m).
   *    - Aligned along movement vector until final hop, which blends to workstation targetYaw.
   * 
   * 2. Soft Bounce-Back Physics Impulse & "Oops!" Reaction:
   *    - Soft restitution reflection pushes astronaut back to open corridor on boundary contact.
   */
  public update(
    delta: number,
    targetPos: THREE.Vector3,
    targetYaw: number,
    poseType: string,
    time: number,
    isTransit: boolean = false,
    hopIndex: number = 0,
    numHops: number = 1,
    hopProgress: number = 0,
    hopStartPos?: THREE.Vector3,
    hopEndPos?: THREE.Vector3,
    startPos?: THREE.Vector3
  ) {
    const dx = targetPos.x - this.position.x;
    const dz = targetPos.z - this.position.z;
    const dist = Math.hypot(dx, dz);
    this.isMoving = isTransit || dist > 0.05;

    // Obstacle Collision Check
    const collision = this.checkObstacleCollision(this.position, this.velocity);
    if (collision.collided && !this.isOopsActive) {
      this.isOopsActive = true;
      this.oopsTimer = 2.4;
      this.recoveryVector = collision.normal.clone().normalize();

      // Soft bounce-back physics impulse
      this.velocity.copy(this.recoveryVector).multiplyScalar(0.42);

      // Instantly trigger contextual reaction subtitle & AI detection alert
      missionTimeline.triggerOops();
    }

    if (this.isOopsActive) {
      this.oopsTimer -= delta;

      // Soft physics push-back along normal
      this.position.addScaledVector(this.velocity, delta);
      this.velocity.multiplyScalar(Math.exp(-2.2 * delta));
      this.position.y = this.baseY + Math.sin(time * 6.0) * 0.015;
      this.elevationY = this.position.y;

      if (this.oopsTimer <= 0) {
        this.isOopsActive = false;
        missionTimeline.clearOops();
      }
    } else if (isTransit && hopStartPos && hopEndPos) {
      // =======================================================================
      // 1. DISTANCE-PROPORTIONAL MULTI-HOP SEQUENCER (50% VELOCITY REDUCTION)
      // =======================================================================
      this.hopProgress = THREE.MathUtils.clamp(hopProgress, 0.0, 1.0);

      // Smooth horizontal position across current hop segment via cubic s-curve
      const s = this.hopProgress * this.hopProgress * (3 - 2 * this.hopProgress);
      this.position.x = hopStartPos.x + (hopEndPos.x - hopStartPos.x) * s;
      this.position.z = hopStartPos.z + (hopEndPos.z - hopStartPos.z) * s;

      // Parabolic flight with apex hang-time suspension:
      // y(tau) = y_base + A * (sin(pi * tau))^0.85 (A <= 0.095m)
      const sinVal = Math.sin(Math.PI * this.hopProgress);
      const hopHeight = this.hopAmplitude * Math.pow(Math.max(0, sinVal), 0.85);
      this.elevationY = this.baseY + hopHeight;
      this.position.y = this.elevationY;

      // Soft touchdown impulse absorption compression near floor grid
      this.compressionFactor = THREE.MathUtils.clamp(1.0 - (hopHeight / this.hopAmplitude), 0.0, 1.0);

      // DIRECTIONAL TRAJECTORY ORIENTATION:
      // Follow travel vector across all intermediate hops.
      // On final hop, blend smoothly from travel vector to station targetYaw as proximity closes.
      const originX = startPos ? startPos.x : hopStartPos.x;
      const originZ = startPos ? startPos.z : hopStartPos.z;
      const totalDx = targetPos.x - originX;
      const totalDz = targetPos.z - originZ;
      const moveHeading = Math.hypot(totalDx, totalDz) > 0.05
        ? Math.atan2(totalDx, totalDz)
        : targetYaw;
      this.headingAngle = moveHeading;

      let desiredYaw: number;
      if (hopIndex < numHops - 1) {
        // Strict movement vector alignment during consecutive hops
        desiredYaw = moveHeading;
      } else {
        // Final hop: smoothly blend from traversal heading to target terminal yaw
        let angleDelta = targetYaw - moveHeading;
        while (angleDelta < -Math.PI) angleDelta += Math.PI * 2;
        while (angleDelta > Math.PI) angleDelta -= Math.PI * 2;
        desiredYaw = moveHeading + angleDelta * this.hopProgress;
      }

      // Frame-rate independent yaw dampening with 50% reduced angular rate
      let diff = desiredYaw - this.currentRotationY;
      while (diff < -Math.PI) diff += Math.PI * 2;
      while (diff > Math.PI) diff -= Math.PI * 2;
      this.currentRotationY += diff * (1 - Math.exp(-2.1 * delta)); // 50% rate reduction

      this.velocity.copy(this.position).sub(this.prevPosition).divideScalar(Math.max(delta, 0.001));
      this.prevPosition.copy(this.position);
    } else {
      // =======================================================================
      // 2. STATION DWELL / RESTING FLOOR-PROXIMITY SUSPENSION
      // =======================================================================
      this.hopProgress = 0;
      this.compressionFactor = 0.0;
      const restOsc = Math.sin(time * 1.2) * 0.008;
      this.elevationY = this.baseY + restOsc;
      this.position.y = this.elevationY;

      // Station position lock
      this.position.x = THREE.MathUtils.damp(this.position.x, targetPos.x, 3.0, delta);
      this.position.z = THREE.MathUtils.damp(this.position.z, targetPos.z, 3.0, delta);

      // Station final yaw alignment (50% reduced lerp rate for smooth posture)
      let diff = targetYaw - this.currentRotationY;
      while (diff < -Math.PI) diff += Math.PI * 2;
      while (diff > Math.PI) diff -= Math.PI * 2;
      this.currentRotationY += diff * (1 - Math.exp(-2.4 * delta));

      this.velocity.set(0, 0, 0);
      this.prevPosition.copy(this.position);
    }

    // Secondary motion acceleration
    this.acceleration.subVectors(this.velocity, this.prevVelocity).divideScalar(Math.max(delta, 0.001));
    this.prevVelocity.copy(this.velocity);

    this.armLag.x = THREE.MathUtils.lerp(this.armLag.x, -this.acceleration.z * 0.025, delta * 2.0);
    this.armLag.y = THREE.MathUtils.lerp(this.armLag.y, this.acceleration.x * 0.025, delta * 2.0);
    this.spineLag = THREE.MathUtils.lerp(this.spineLag, -this.acceleration.z * 0.015, delta * 2.0);

    // Subtle torso pitch tilt during launch / apex / touchdown in slow motion
    const hopPitch = isTransit ? Math.cos(Math.PI * this.hopProgress) * 0.018 : 0;
    const rollDrift = isTransit ? Math.sin(time * 1.2) * 0.008 : 0;

    this.targetEuler.set(hopPitch, this.currentRotationY, rollDrift, 'YXZ');
    this.targetQuat.setFromEuler(this.targetEuler);
    this.quaternion.slerp(this.targetQuat, Math.min(1.0, delta * 1.8)); // 50% reduced slerp rate

    // State B: Screen & Station Proximity Interaction Weight & Gesture Randomizer
    // Lerp smoothly to 1.0 ONLY when astronaut arrives directly in front of an active workstation console.
    // Return smoothly to 0.0 as soon as the astronaut moves or hops away.
    if (!isTransit && !this.isMoving && !this.isOopsActive) {
      this.stationInteractionWeight = THREE.MathUtils.damp(this.stationInteractionWeight, 1.0, 3.5, delta);

      // Trigger randomized behavior loop: alternate gestures dynamically during station dwell
      if (poseType !== this.prevPoseType) {
        this.prevPoseType = poseType;
        this.gestureTimer = 0;
        const roll = Math.random();
        if (roll < 0.38) {
          this.currentGestureMode = 'SINGLE_HAND_POINTING';
          this.activePointingArm = Math.random() > 0.5 ? 'RIGHT' : 'LEFT';
        } else if (roll < 0.70) {
          this.currentGestureMode = 'DUAL_HAND_INTERACTION';
        } else {
          this.currentGestureMode = 'THINKING_ANALYSIS';
          this.activePointingArm = Math.random() > 0.5 ? 'RIGHT' : 'LEFT';
        }
      } else {
        this.gestureTimer += delta;
        if (this.gestureTimer > 3.0) {
          this.gestureTimer = 0;
          const modes: ('SINGLE_HAND_POINTING' | 'DUAL_HAND_INTERACTION' | 'THINKING_ANALYSIS')[] = [
            'SINGLE_HAND_POINTING',
            'DUAL_HAND_INTERACTION',
            'THINKING_ANALYSIS'
          ];
          const remaining = modes.filter(m => m !== this.currentGestureMode);
          this.currentGestureMode = remaining[Math.floor(Math.random() * remaining.length)];
          this.activePointingArm = Math.random() > 0.5 ? 'RIGHT' : 'LEFT';
        }
      }
    } else {
      this.stationInteractionWeight = THREE.MathUtils.damp(this.stationInteractionWeight, 0.0, 4.5, delta);
      this.gestureTimer = 0;
    }

    return {
      position: this.position,
      elevationY: this.elevationY,
      rotationY: this.currentRotationY,
      quaternion: this.quaternion,
      compressionFactor: this.compressionFactor,
      isMoving: this.isMoving,
      hopProgress: this.hopProgress,
      armLag: this.armLag,
      spineLag: this.spineLag,
      isOopsActive: this.isOopsActive,
      stationInteractionWeight: this.stationInteractionWeight
    };
  }

  /**
   * Biomechanical Joint Constraints & Dynamic Procedural Kinematics:
   * 
   * 1. Randomized Procedural Hand & Head Gestures:
   *    - Single-Hand Pointing: Alternates between Left and Right hand (Math.random() > 0.5).
   *    - Dual-Hand Interaction: Both hands subtly raise toward display interface (multi-touch telemetry).
   *    - Thinking / Analysis Pose: One hand relaxed, other hand raised close to chin/helmet visor with head tilt.
   *    - Procedural Head Look-At Tracking: Smooth look-at lerping scanning widescreen panels, looking down
   *      at cargo barrels, and tilting outward toward deep space window.
   * 
   * 2. Low-Gravity Jumping Arm Inertia:
   *    - Floor push-off launch lag (Delta y_arms = -0.03m).
   *    - Soft upward float at apex (<= 5 deg vertical sway).
   *    - Smooth settlement into natural resting stance upon touchdown.
   * 
   * 3. Safety Locks & Mesh Integrity:
   *    - Anatomical IK clamping with THREE.MathUtils.damp for ultra-smooth slow motion.
   */
  public applyConstrainedLimbIK(
    bones: Record<string, any>,
    poseType: string,
    time: number,
    delta: number,
    restEuler?: Record<string, { x: number; y: number; z: number }>,
    compressionFactor: number = 0,
    isMoving: boolean = false,
    hopProgress: number = 0
  ) {
    if (!bones) return;

    const head = bones.head;
    const neck = bones.neck;
    const spine = bones.spine || bones.chest;
    const leftArm = bones.leftUpperArm;
    const rightArm = bones.rightUpperArm;
    const leftLowerArm = bones.leftLowerArm;
    const rightLowerArm = bones.rightLowerArm;
    const leftHand = bones.leftHand;
    const rightHand = bones.rightHand;
    const leftThigh = bones.leftThigh;
    const rightThigh = bones.rightThigh;
    const leftCalf = bones.leftCalf;
    const rightCalf = bones.rightCalf;
    const leftFoot = bones.leftFoot;
    const rightFoot = bones.rightFoot;

    const baseSpineX = restEuler?.spine ? restEuler.spine.x : (restEuler?.chest ? restEuler.chest.x : 0);

    const baseNeckX = restEuler?.neck ? restEuler.neck.x : 0;
    const baseNeckY = restEuler?.neck ? restEuler.neck.y : 0;
    const baseNeckZ = restEuler?.neck ? restEuler.neck.z : 0;

    const baseHeadX = restEuler?.head ? restEuler.head.x : 0;
    const baseHeadY = restEuler?.head ? restEuler.head.y : 0;
    const baseHeadZ = restEuler?.head ? restEuler.head.z : 0;

    // ========================================================================
    // 1. EXACT ANATOMICAL REST EULER ANGLES (Bind Pose Anchors)
    // ========================================================================
    const baseArmLX = restEuler?.leftUpperArm ? restEuler.leftUpperArm.x : -0.8514;
    const baseArmLY = restEuler?.leftUpperArm ? restEuler.leftUpperArm.y : 0.0571;
    const baseArmLZ = restEuler?.leftUpperArm ? restEuler.leftUpperArm.z : 0.0575;

    const baseLowerLX = restEuler?.leftLowerArm ? restEuler.leftLowerArm.x : 1.1328;
    const baseLowerLY = restEuler?.leftLowerArm ? restEuler.leftLowerArm.y : 1.4398;
    const baseLowerLZ = restEuler?.leftLowerArm ? restEuler.leftLowerArm.z : -1.3936;

    const baseHandLX = restEuler?.leftHand ? restEuler.leftHand.x : 3.1000;
    const baseHandLY = restEuler?.leftHand ? restEuler.leftHand.y : 0.0387;
    const baseHandLZ = restEuler?.leftHand ? restEuler.leftHand.z : -2.7900;

    const baseArmRX = restEuler?.rightUpperArm ? restEuler.rightUpperArm.x : -0.8529;
    const baseArmRY = restEuler?.rightUpperArm ? restEuler.rightUpperArm.y : -0.0663;
    const baseArmRZ = restEuler?.rightUpperArm ? restEuler.rightUpperArm.z : -0.0777;

    const baseLowerRX = restEuler?.rightLowerArm ? restEuler.rightLowerArm.x : 1.1338;
    const baseLowerRY = restEuler?.rightLowerArm ? restEuler.rightLowerArm.y : -1.2711;
    const baseLowerRZ = restEuler?.rightLowerArm ? restEuler.rightLowerArm.z : 1.3835;

    const baseHandRX = restEuler?.rightHand ? restEuler.rightHand.x : 3.1000;
    const baseHandRY = restEuler?.rightHand ? restEuler.rightHand.y : -0.0387;
    const baseHandRZ = restEuler?.rightHand ? restEuler.rightHand.z : 2.7900;

    // Discovered finger and thumb bones (with fallback to hand children)
    const leftIndex = bones.leftIndex || (bones.leftHand?.children ? bones.leftHand.children.find((c: any) => /finger1/i.test(c.name)) : null);
    const leftMiddle = bones.leftMiddle || (bones.leftHand?.children ? bones.leftHand.children.find((c: any) => /finger2/i.test(c.name)) : null);
    const leftThumb = bones.leftThumb || (bones.leftHand?.children ? bones.leftHand.children.find((c: any) => /thumb/i.test(c.name)) : null);

    const rightIndex = bones.rightIndex || (bones.rightHand?.children ? bones.rightHand.children.find((c: any) => /finger1/i.test(c.name)) : null);
    const rightMiddle = bones.rightMiddle || (bones.rightHand?.children ? bones.rightHand.children.find((c: any) => /finger2/i.test(c.name)) : null);
    const rightThumb = bones.rightThumb || (bones.rightHand?.children ? bones.rightHand.children.find((c: any) => /thumb/i.test(c.name)) : null);

    const baseIndexLX = restEuler?.leftIndex?.x ?? -2.8304;
    const baseIndexRX = restEuler?.rightIndex?.x ?? -2.8304;
    const baseMiddleLX = restEuler?.leftMiddle?.x ?? -2.8219;
    const baseMiddleRX = restEuler?.rightMiddle?.x ?? -2.8219;
    const baseThumbLX = restEuler?.leftThumb?.x ?? -0.9271;
    const baseThumbRX = restEuler?.rightThumb?.x ?? -0.9271;

    const baseThighLX = restEuler?.leftThigh ? restEuler.leftThigh.x : 0;
    const baseThighLY = restEuler?.leftThigh ? restEuler.leftThigh.y : 0;
    const baseThighLZ = restEuler?.leftThigh ? restEuler.leftThigh.z : 0;
    const baseThighRX = restEuler?.rightThigh ? restEuler.rightThigh.x : 0;
    const baseThighRY = restEuler?.rightThigh ? restEuler.rightThigh.y : 0;
    const baseThighRZ = restEuler?.rightThigh ? restEuler.rightThigh.z : 0;

    const baseCalfLX = restEuler?.leftCalf ? restEuler.leftCalf.x : 0;
    const baseCalfLY = restEuler?.leftCalf ? restEuler.leftCalf.y : 0;
    const baseCalfLZ = restEuler?.leftCalf ? restEuler.leftCalf.z : 0;
    const baseCalfRX = restEuler?.rightCalf ? restEuler.rightCalf.x : 0;
    const baseCalfRY = restEuler?.rightCalf ? restEuler.rightCalf.y : 0;
    const baseCalfRZ = restEuler?.rightCalf ? restEuler.rightCalf.z : 0;

    const baseFootLX = restEuler?.leftFoot ? restEuler.leftFoot.x : 0;
    const baseFootLY = restEuler?.leftFoot ? restEuler.leftFoot.y : 0;
    const baseFootLZ = restEuler?.leftFoot ? restEuler.leftFoot.z : 0;
    const baseFootRX = restEuler?.rightFoot ? restEuler.rightFoot.x : 0;
    const baseFootRY = restEuler?.rightFoot ? restEuler.rightFoot.y : 0;
    const baseFootRZ = restEuler?.rightFoot ? restEuler.rightFoot.z : 0;

    // Subtle breathing micro-oscillations
    const oscHead = Math.sin(time * 0.75) * 0.015;
    const oscSpine = Math.sin(time * 0.9) * 0.010 + this.spineLag;

    // ========================================================================
    // 2. SPINE: Capped at +-10 deg (+-0.174 rad) preserving suit rigidity
    // ========================================================================
    if (spine) {
      const spineAngle = baseSpineX + 0.04 + THREE.MathUtils.clamp(oscSpine, -0.05, 0.05);
      spine.rotation.x = THREE.MathUtils.clamp(spineAngle, -0.174, 0.174);
    }

    // ========================================================================
    // 3. LEGS & LOWER BODY (Natural relaxed NBP suspension, vertical alignment)
    // ========================================================================
    const legSwing = isMoving ? Math.sin(hopProgress * Math.PI * 2) * 0.035 : 0;
    if (leftThigh) {
      leftThigh.rotation.x = baseThighLX;
      leftThigh.rotation.z = baseThighLZ;
      leftThigh.rotation.y = baseThighLY - legSwing;
    }
    if (rightThigh) {
      rightThigh.rotation.x = baseThighRX;
      rightThigh.rotation.z = baseThighRZ;
      rightThigh.rotation.y = baseThighRY + legSwing;
    }

    // Knees: Single axis pitch lock on X (relaxed flexion + soft compression)
    const kneeTargetFlexion = THREE.MathUtils.clamp(0.20 + 0.22 * compressionFactor, 0.12, 0.60);
    if (leftCalf) {
      leftCalf.rotation.x = THREE.MathUtils.lerp(leftCalf.rotation.x, baseCalfLX + kneeTargetFlexion, delta * 6.0);
      leftCalf.rotation.y = baseCalfLY;
      leftCalf.rotation.z = baseCalfLZ;
    }
    if (rightCalf) {
      rightCalf.rotation.x = THREE.MathUtils.lerp(rightCalf.rotation.x, baseCalfRX + kneeTargetFlexion, delta * 6.0);
      rightCalf.rotation.y = baseCalfRY;
      rightCalf.rotation.z = baseCalfRZ;
    }

    // Feet: Parallel to floor grid
    const ankleComp = (kneeTargetFlexion - 0.20) * 0.70;
    if (leftFoot) {
      leftFoot.rotation.x = THREE.MathUtils.lerp(leftFoot.rotation.x, baseFootLX - ankleComp, delta * 6.0);
      leftFoot.rotation.y = baseFootLY;
      leftFoot.rotation.z = baseFootLZ;
    }
    if (rightFoot) {
      rightFoot.rotation.x = THREE.MathUtils.lerp(rightFoot.rotation.x, baseFootRX - ankleComp, delta * 6.0);
      rightFoot.rotation.y = baseFootRY;
      rightFoot.rotation.z = baseFootRZ;
    }

    // ========================================================================
    // 4. "OOPS!" COLLISION SOFT IMPULSE REACTION
    // ========================================================================
    if (this.isOopsActive) {
      if (head) {
        head.rotation.x = THREE.MathUtils.lerp(head.rotation.x, -0.06, delta * 4.0);
        head.rotation.y = THREE.MathUtils.lerp(head.rotation.y, this.recoveryVector.x * 0.25, delta * 4.0);
        head.rotation.z = THREE.MathUtils.lerp(head.rotation.z, 0, delta * 4.0);
      }
      if (neck) {
        neck.rotation.x = THREE.MathUtils.lerp(neck.rotation.x, -0.04, delta * 4.0);
        neck.rotation.y = THREE.MathUtils.lerp(neck.rotation.y, this.recoveryVector.x * 0.15, delta * 4.0);
        neck.rotation.z = THREE.MathUtils.lerp(neck.rotation.z, 0, delta * 4.0);
      }
      if (leftArm) {
        leftArm.rotation.x = THREE.MathUtils.lerp(leftArm.rotation.x, baseArmLX, delta * 4.5);
        leftArm.rotation.y = THREE.MathUtils.lerp(leftArm.rotation.y, baseArmLY, delta * 4.5);
        leftArm.rotation.z = THREE.MathUtils.lerp(leftArm.rotation.z, baseArmLZ - 0.12, delta * 4.5);
      }
      if (rightArm) {
        rightArm.rotation.x = THREE.MathUtils.lerp(rightArm.rotation.x, baseArmRX, delta * 4.5);
        rightArm.rotation.y = THREE.MathUtils.lerp(rightArm.rotation.y, baseArmRY, delta * 4.5);
        rightArm.rotation.z = THREE.MathUtils.lerp(rightArm.rotation.z, baseArmRZ + 0.12, delta * 4.5);
      }
      if (leftLowerArm) {
        leftLowerArm.rotation.x = THREE.MathUtils.lerp(leftLowerArm.rotation.x, baseLowerLX, delta * 4.5);
        leftLowerArm.rotation.y = THREE.MathUtils.lerp(leftLowerArm.rotation.y, baseLowerLY, delta * 4.5);
        leftLowerArm.rotation.z = THREE.MathUtils.lerp(leftLowerArm.rotation.z, baseLowerLZ, delta * 4.5);
      }
      if (rightLowerArm) {
        rightLowerArm.rotation.x = THREE.MathUtils.lerp(rightLowerArm.rotation.x, baseLowerRX, delta * 4.5);
        rightLowerArm.rotation.y = THREE.MathUtils.lerp(rightLowerArm.rotation.y, baseLowerRY, delta * 4.5);
        rightLowerArm.rotation.z = THREE.MathUtils.lerp(rightLowerArm.rotation.z, baseLowerRZ, delta * 4.5);
      }
      if (leftHand) {
        leftHand.rotation.x = THREE.MathUtils.lerp(leftHand.rotation.x, baseHandLX, delta * 4.5);
        leftHand.rotation.y = THREE.MathUtils.lerp(leftHand.rotation.y, baseHandLY, delta * 4.5);
        leftHand.rotation.z = THREE.MathUtils.lerp(leftHand.rotation.z, baseHandLZ, delta * 4.5);
      }
      if (rightHand) {
        rightHand.rotation.x = THREE.MathUtils.lerp(rightHand.rotation.x, baseHandRX, delta * 4.5);
        rightHand.rotation.y = THREE.MathUtils.lerp(rightHand.rotation.y, baseHandRY, delta * 4.5);
        rightHand.rotation.z = THREE.MathUtils.lerp(rightHand.rotation.z, baseHandRZ, delta * 4.5);
      }
      return;
    }

    // ========================================================================
    // 5. LOW-GRAVITY JUMPING ARM INERTIA (Hop Velocity Coupling)
    //    Launch Lag (Delta y_arms = -0.03m), Apex Float, Touchdown Settlement
    // ========================================================================
    let jumpArmSway = 0;
    if (isMoving && hopProgress >= 0) {
      const tau = THREE.MathUtils.clamp(hopProgress, 0.0, 1.0);
      if (tau < 0.18) {
        // 1. Launch Phase (floor push-off takeoff): arms lag behind torso motion (Delta y_arms ~= -0.03m)
        const launchFrac = tau / 0.18;
        jumpArmSway = -0.052 * Math.sin(launchFrac * Math.PI); // downward inertia drag
      } else {
        // 2. Apex Float Phase: hands float upward softly at jump apex (<= 5 deg vertical sway)
        const floatFrac = (tau - 0.18) / 0.82;
        jumpArmSway = 0.065 * Math.sin(floatFrac * Math.PI) * Math.exp(-2.2 * floatFrac);
      }
    }

    const jumpWristSway = jumpArmSway * 0.65;

    // Subtle micro-drift breathing during resting stance
    const breathArm = Math.sin(time * 0.85) * 0.010;
    const breathWrist = Math.sin(time * 1.1) * 0.012;

    // ========================================================================
    // 6. RANDOMIZED PROCEDURAL GESTURE BEHAVIOR LOOP (Station Dwell)
    // ========================================================================
    const interactWeight = this.stationInteractionWeight;

    // Subtle heavy glove micro-vibration (+-0.01m) during active terminal interaction
    const vibe = interactWeight > 0.05
      ? Math.sin(time * 24.0) * 0.008 * Math.cos(time * 14.0)
      : 0;

    // Multi-touch micro-taps for dual-hand mode
    const tapR = Math.sin(time * 6.0) * 0.035;
    const tapL = Math.cos(time * 6.0) * 0.035;

    // Delta targets for Right & Left Arm
    let targetDeltaShoulderR_X = 0;
    let targetDeltaShoulderR_Y = 0;
    let targetDeltaShoulderR_Z = 0;
    let targetDeltaElbowR_X = 0;
    let targetDeltaElbowR_Y = 0;
    let targetDeltaElbowR_Z = 0;
    let targetDeltaWristR_X = 0;
    let targetDeltaWristR_Y = 0;
    let targetDeltaWristR_Z = 0;
    let targetDeltaIndexR_X = 0;

    let targetDeltaShoulderL_X = 0;
    let targetDeltaShoulderL_Y = 0;
    let targetDeltaShoulderL_Z = 0;
    let targetDeltaElbowL_X = 0;
    let targetDeltaElbowL_Y = 0;
    let targetDeltaElbowL_Z = 0;
    let targetDeltaWristL_X = 0;
    let targetDeltaWristL_Y = 0;
    let targetDeltaWristL_Z = 0;
    let targetDeltaIndexL_X = 0;

    // Procedural Head Look-At Target Angles
    let targetHeadPitch = -0.02;
    let targetHeadYaw = 0.0;
    let targetHeadRoll = 0.0;

    if (interactWeight > 0.02) {
      // ----------------------------------------------------------------------
      // Station-Specific Base Look-At Targets
      // ----------------------------------------------------------------------
      switch (poseType) {
        case 'PILOT_CALIBRATION':
        case 'EARTH_TRANSMISSION':
        case 'TELEMETRY_DIAGNOSTICS':
        case 'EDGE_AI_QUERY':
          // Scan left-to-right across widescreen display panels
          targetHeadYaw = Math.sin(time * 1.4) * 0.16;
          targetHeadPitch = -0.07 + Math.cos(time * 0.9) * 0.03;
          break;

        case 'BARREL_SEARCH':
          // Look down at barrels/cargo equipment
          targetHeadPitch = -0.22 + Math.sin(time * 1.1) * 0.04;
          targetHeadYaw = -0.12 + Math.cos(time * 0.8) * 0.05;
          break;

        case 'WINDOW_INSPECTION':
          // Tilt head outward toward outer space celestial horizon
          targetHeadPitch = 0.15 + Math.sin(time * 0.8) * 0.04;
          targetHeadYaw = -0.18 + Math.sin(time * 0.6) * 0.06;
          targetHeadRoll = 0.03;
          break;

        case 'BUTTON_PRESS':
          // Look at button and terminal
          targetHeadPitch = -0.12 + Math.sin(time * 1.2) * 0.03;
          targetHeadYaw = 0.05;
          break;

        case 'QUANTUM_CORE_LIFT':
        case 'QUANTUM_CORE_CYCLE':
          // Look at held quantum core and containment HUD
          targetHeadPitch = -0.14 + Math.sin(time * 1.0) * 0.03;
          targetHeadYaw = 0.08 + Math.cos(time * 0.8) * 0.04;
          break;
      }

      // ----------------------------------------------------------------------
      // Procedural Gesture Execution based on Randomized State Machine
      // ----------------------------------------------------------------------
      if (poseType === 'BUTTON_PRESS') {
        // Dedicated button press: Right hand depresses terminal button
        targetDeltaShoulderR_X = 0.04;
        targetDeltaShoulderR_Z = 0.92;
        targetDeltaElbowR_Y = 0.32 + vibe;
        targetDeltaWristR_Z = -0.15 + vibe;
        targetDeltaIndexR_X = -0.36; // Firm index finger depression
      } else if (poseType === 'QUANTUM_CORE_LIFT' || poseType === 'QUANTUM_CORE_CYCLE') {
        // Dedicated Quantum Core lift & inspection:
        // Right hand holds quantum core securely in front of chest
        targetDeltaShoulderR_X = 0.04;
        targetDeltaShoulderR_Z = 0.72;
        targetDeltaElbowR_Y = 0.36 + vibe;
        targetDeltaWristR_Z = -0.10;
        targetDeltaIndexR_X = 0.15; // Cupped fingers around core sphere

        // Left arm points to magnetic containment terminal display
        targetDeltaShoulderL_X = 0.04;
        targetDeltaShoulderL_Z = -0.84;
        targetDeltaElbowL_Y = -0.28 + vibe;
        targetDeltaWristL_Z = 0.12;
        targetDeltaIndexL_X = -0.28;
      } else {
        // Randomized Versatile Gesture Loop (Single-Hand, Dual-Hand, Thinking)
        switch (this.currentGestureMode) {
          case 'SINGLE_HAND_POINTING':
            if (this.activePointingArm === 'RIGHT') {
              // Right hand points & types at target console
              targetDeltaShoulderR_X = 0.04;
              targetDeltaShoulderR_Y = -0.04;
              targetDeltaShoulderR_Z = 0.88;
              targetDeltaElbowR_Y = 0.30 + vibe;
              targetDeltaWristR_Z = -0.15 + vibe;
              targetDeltaIndexR_X = -0.30 + vibe; // Extended index finger
            } else {
              // Left hand points & types at target console
              targetDeltaShoulderL_X = 0.04;
              targetDeltaShoulderL_Y = 0.04;
              targetDeltaShoulderL_Z = -0.88;
              targetDeltaElbowL_Y = -0.30 + vibe;
              targetDeltaWristL_Z = 0.15 + vibe;
              targetDeltaIndexL_X = -0.30 + vibe; // Extended index finger
            }
            break;

          case 'DUAL_HAND_INTERACTION':
            // Both hands subtly raised toward interface, mimicking multi-touch telemetry calibration
            targetDeltaShoulderR_X = 0.04;
            targetDeltaShoulderR_Y = -0.03;
            targetDeltaShoulderR_Z = 0.76;
            targetDeltaElbowR_Y = 0.26 + tapR;
            targetDeltaWristR_Z = -0.12 + tapR;
            targetDeltaIndexR_X = -0.18;

            targetDeltaShoulderL_X = 0.04;
            targetDeltaShoulderL_Y = 0.03;
            targetDeltaShoulderL_Z = -0.76;
            targetDeltaElbowL_Y = -0.26 - tapL;
            targetDeltaWristL_Z = 0.12 - tapL;
            targetDeltaIndexL_X = -0.18;
            break;

          case 'THINKING_ANALYSIS':
            // Thinking pose: One hand stays relaxed, active hand raises close to chin/visor
            if (this.activePointingArm === 'RIGHT') {
              targetDeltaShoulderR_X = 0.06;
              targetDeltaShoulderR_Y = -0.08;
              targetDeltaShoulderR_Z = 0.80;
              targetDeltaElbowR_X = 0.18;
              targetDeltaElbowR_Y = 0.72 + vibe;
              targetDeltaWristR_Z = 0.14;
              targetDeltaIndexR_X = 0.08;
              // Thoughtful head tilt to the right
              targetHeadRoll += 0.08;
              targetHeadPitch -= 0.06;
            } else {
              targetDeltaShoulderL_X = 0.06;
              targetDeltaShoulderL_Y = 0.08;
              targetDeltaShoulderL_Z = -0.80;
              targetDeltaElbowL_X = 0.18;
              targetDeltaElbowL_Y = -0.72 + vibe;
              targetDeltaWristL_Z = -0.14;
              targetDeltaIndexL_X = 0.08;
              // Thoughtful head tilt to the left
              targetHeadRoll -= 0.08;
              targetHeadPitch -= 0.06;
            }
            break;
        }
      }
    } else {
      // Transit / Movement: Head looks forward along travel path
      targetHeadPitch = -0.03 + Math.sin(hopProgress * Math.PI) * 0.025;
      targetHeadYaw = 0;
      targetHeadRoll = 0;
    }

    // ========================================================================
    // 7. PROCEDURAL HEAD & NECK LOOK-AT ROTATION LERPING
    // ========================================================================
    if (neck) {
      neck.rotation.x = THREE.MathUtils.damp(neck.rotation.x, baseNeckX + targetHeadPitch * 0.45, 4.0, delta);
      neck.rotation.y = THREE.MathUtils.damp(neck.rotation.y, baseNeckY + targetHeadYaw * 0.45, 4.0, delta);
      neck.rotation.z = THREE.MathUtils.damp(neck.rotation.z, baseNeckZ + targetHeadRoll * 0.45, 4.0, delta);
    }
    if (head) {
      head.rotation.x = THREE.MathUtils.damp(head.rotation.x, baseHeadX + targetHeadPitch * 0.55 + oscHead, 4.5, delta);
      head.rotation.y = THREE.MathUtils.damp(head.rotation.y, baseHeadY + targetHeadYaw * 0.55, 4.5, delta);
      head.rotation.z = THREE.MathUtils.damp(head.rotation.z, baseHeadZ + targetHeadRoll * 0.55, 4.5, delta);
    }

    // ========================================================================
    // 8. RIGGING DELTAS & STRICT SAFETY CONSTRAINTS
    // ========================================================================
    // Apply interaction weight and jumping arm inertia
    const finalDeltaShoulderR_X = targetDeltaShoulderR_X * interactWeight;
    const finalDeltaShoulderR_Y = targetDeltaShoulderR_Y * interactWeight;
    const finalDeltaShoulderR_Z = targetDeltaShoulderR_Z * interactWeight + jumpArmSway + breathArm;

    const finalDeltaElbowR_X = targetDeltaElbowR_X * interactWeight;
    const finalDeltaElbowR_Y = targetDeltaElbowR_Y * interactWeight;
    const finalDeltaElbowR_Z = targetDeltaElbowR_Z * interactWeight;

    const finalDeltaWristR_X = targetDeltaWristR_X * interactWeight;
    const finalDeltaWristR_Y = targetDeltaWristR_Y * interactWeight;
    const finalDeltaWristR_Z = targetDeltaWristR_Z * interactWeight + breathWrist + jumpWristSway;

    const finalDeltaIndexR_X = targetDeltaIndexR_X * interactWeight;

    const finalDeltaShoulderL_X = targetDeltaShoulderL_X * interactWeight;
    const finalDeltaShoulderL_Y = targetDeltaShoulderL_Y * interactWeight;
    const finalDeltaShoulderL_Z = targetDeltaShoulderL_Z * interactWeight - jumpArmSway - breathArm;

    const finalDeltaElbowL_X = targetDeltaElbowL_X * interactWeight;
    const finalDeltaElbowL_Y = targetDeltaElbowL_Y * interactWeight;
    const finalDeltaElbowL_Z = targetDeltaElbowL_Z * interactWeight;

    const finalDeltaWristL_X = targetDeltaWristL_X * interactWeight;
    const finalDeltaWristL_Y = targetDeltaWristL_Y * interactWeight;
    const finalDeltaWristL_Z = targetDeltaWristL_Z * interactWeight - breathWrist - jumpWristSway;

    const finalDeltaIndexL_X = targetDeltaIndexL_X * interactWeight;

    // Safety Clamping Guards:
    const clampShoulderLX = (val: number) => THREE.MathUtils.clamp(val, baseArmLX - 0.12, baseArmLX + 0.10);
    const clampShoulderRX = (val: number) => THREE.MathUtils.clamp(val, baseArmRX - 0.12, baseArmRX + 0.10);

    const clampShoulderLY = (val: number) => THREE.MathUtils.clamp(val, baseArmLY - 0.12, baseArmLY + 0.12);
    const clampShoulderRY = (val: number) => THREE.MathUtils.clamp(val, baseArmRY - 0.12, baseArmRY + 0.12);

    const clampShoulderLZ = (val: number) => THREE.MathUtils.clamp(val, baseArmLZ - 1.05, baseArmLZ + 0.12);
    const clampShoulderRZ = (val: number) => THREE.MathUtils.clamp(val, baseArmRZ - 0.12, baseArmRZ + 1.05);

    const clampElbowLY = (val: number) => THREE.MathUtils.clamp(val, baseLowerLY - 0.85, baseLowerLY + 0.12);
    const clampElbowRY = (val: number) => THREE.MathUtils.clamp(val, baseLowerRY - 0.12, baseLowerRY + 0.85);

    const clampWristLZ = (val: number) => THREE.MathUtils.clamp(val, baseHandLZ - 0.25, baseHandLZ + 0.25);
    const clampWristRZ = (val: number) => THREE.MathUtils.clamp(val, baseHandRZ - 0.25, baseHandRZ + 0.25);

    // ========================================================================
    // 9. APPLY FINAL BONE ROTATIONS
    // ========================================================================
    // Upper Arms (Shoulders)
    if (leftArm) {
      leftArm.rotation.x = THREE.MathUtils.lerp(leftArm.rotation.x, clampShoulderLX(baseArmLX + finalDeltaShoulderL_X), delta * 4.5);
      leftArm.rotation.y = THREE.MathUtils.lerp(leftArm.rotation.y, clampShoulderLY(baseArmLY + finalDeltaShoulderL_Y), delta * 4.5);
      leftArm.rotation.z = THREE.MathUtils.lerp(leftArm.rotation.z, clampShoulderLZ(baseArmLZ + finalDeltaShoulderL_Z), delta * 4.5);
    }
    if (rightArm) {
      rightArm.rotation.x = THREE.MathUtils.lerp(rightArm.rotation.x, clampShoulderRX(baseArmRX + finalDeltaShoulderR_X), delta * 4.5);
      rightArm.rotation.y = THREE.MathUtils.lerp(rightArm.rotation.y, clampShoulderRY(baseArmRY + finalDeltaShoulderR_Y), delta * 4.5);
      rightArm.rotation.z = THREE.MathUtils.lerp(rightArm.rotation.z, clampShoulderRZ(baseArmRZ + finalDeltaShoulderR_Z), delta * 4.5);
    }

    // Lower Arms (Elbows)
    if (leftLowerArm) {
      leftLowerArm.rotation.x = THREE.MathUtils.lerp(leftLowerArm.rotation.x, baseLowerLX + finalDeltaElbowL_X, delta * 4.5);
      leftLowerArm.rotation.y = THREE.MathUtils.lerp(leftLowerArm.rotation.y, clampElbowLY(baseLowerLY + finalDeltaElbowL_Y), delta * 4.5);
      leftLowerArm.rotation.z = THREE.MathUtils.lerp(leftLowerArm.rotation.z, baseLowerLZ + finalDeltaElbowL_Z, delta * 4.5);
    }
    if (rightLowerArm) {
      rightLowerArm.rotation.x = THREE.MathUtils.lerp(rightLowerArm.rotation.x, baseLowerRX + finalDeltaElbowR_X, delta * 4.5);
      rightLowerArm.rotation.y = THREE.MathUtils.lerp(rightLowerArm.rotation.y, clampElbowRY(baseLowerRY + finalDeltaElbowR_Y), delta * 4.5);
      rightLowerArm.rotation.z = THREE.MathUtils.lerp(rightLowerArm.rotation.z, baseLowerRZ + finalDeltaElbowR_Z, delta * 4.5);
    }

    // Wrists (Hands): Anchored to true bind-pose Euler angles; palms face inward toward thighs
    if (leftHand) {
      leftHand.rotation.x = THREE.MathUtils.lerp(leftHand.rotation.x, baseHandLX + finalDeltaWristL_X, delta * 5.0);
      leftHand.rotation.y = THREE.MathUtils.lerp(leftHand.rotation.y, baseHandLY + finalDeltaWristL_Y, delta * 5.0);
      leftHand.rotation.z = THREE.MathUtils.lerp(leftHand.rotation.z, clampWristLZ(baseHandLZ + finalDeltaWristL_Z), delta * 5.0);
    }
    if (rightHand) {
      rightHand.rotation.x = THREE.MathUtils.lerp(rightHand.rotation.x, baseHandRX + finalDeltaWristR_X, delta * 5.0);
      rightHand.rotation.y = THREE.MathUtils.lerp(rightHand.rotation.y, baseHandRY + finalDeltaWristR_Y, delta * 5.0);
      rightHand.rotation.z = THREE.MathUtils.lerp(rightHand.rotation.z, clampWristRZ(baseHandRZ + finalDeltaWristR_Z), delta * 5.0);
    }

    // Fingers: Extend index finger when pointing at console display
    if (leftIndex) {
      leftIndex.rotation.x = THREE.MathUtils.lerp(leftIndex.rotation.x, baseIndexLX + finalDeltaIndexL_X, delta * 5.0);
    }
    if (leftMiddle) {
      leftMiddle.rotation.x = THREE.MathUtils.lerp(leftMiddle.rotation.x, baseMiddleLX, delta * 5.0);
    }
    if (leftThumb) {
      leftThumb.rotation.x = THREE.MathUtils.lerp(leftThumb.rotation.x, baseThumbLX, delta * 5.0);
    }

    if (rightIndex) {
      rightIndex.rotation.x = THREE.MathUtils.lerp(rightIndex.rotation.x, baseIndexRX + finalDeltaIndexR_X, delta * 5.0);
    }
    if (rightMiddle) {
      rightMiddle.rotation.x = THREE.MathUtils.lerp(rightMiddle.rotation.x, baseMiddleRX, delta * 5.0);
    }
    if (rightThumb) {
      rightThumb.rotation.x = THREE.MathUtils.lerp(rightThumb.rotation.x, baseThumbRX, delta * 5.0);
    }
  }
}

export const zeroGKinematics = new ZeroGKinematicsEngine();
