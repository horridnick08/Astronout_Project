import * as THREE from 'three';
import { FilesetResolver, PoseLandmarker } from '@mediapipe/tasks-vision';

/**
 * MOCAP BONE DICTIONARY
 */
export const BONE_DICTIONARY = {
  head: ['head_054', 'head_045', 'mixamorigHead', 'mixamorig:Head', 'Head', 'head'],
  neck: ['neck_053', 'neck_044', 'mixamorigNeck', 'mixamorig:Neck', 'Neck', 'neck'],
  spine: ['spine2_03', 'spine3_04', 'spine1_02', 'mixamorigSpine1', 'mixamorig:Spine1', 'mixamorigSpine', 'mixamorig:Spine', 'Spine', 'spine'],
  chest: ['spine3_04', 'spine4_05', 'mixamorigSpine2', 'mixamorig:Spine2', 'Chest', 'chest', 'UpperBody'],
  hips: ['master_01', '_rootJoint', 'hip_joint_060', 'hip_joint_048', 'mixamorigHips', 'mixamorig:Hips', 'Hips', 'Pelvis', 'hips'],
  leftUpperArm: ['arm_1L_07', 'arm_1.L_07', 'mixamorigLeftArm', 'mixamorig:LeftArm', 'LeftArm', 'upper_arm.L', 'arm_1.L', 'left_upper_arm'],
  leftLowerArm: ['arm_2L_08', 'arm_2.L_08', 'mixamorigLeftForeArm', 'mixamorig:LeftForeArm', 'LeftForeArm', 'forearm.L', 'arm_2.L', 'left_forearm'],
  leftHand: ['handL_09', 'hand.L_09', 'mixamorigLeftHand', 'mixamorig:LeftHand', 'LeftHand', 'hand.L', 'wrist.L', 'left_hand'],
  leftIndex: ['finger1_1.L_014', 'mixamorigLeftHandIndex1', 'LeftHandIndex1', 'finger_index.L', 'left_index'],
  leftMiddle: ['finger2_1.L_010', 'mixamorigLeftHandMiddle1', 'LeftHandMiddle1', 'finger_middle.L', 'left_middle'],
  leftThumb: ['thumb1.L_022', 'mixamorigLeftHandThumb1', 'LeftHandThumb1', 'thumb.L', 'left_thumb'],
  rightUpperArm: ['arm_1R_030', 'arm_1.R_026', 'arm_1.R_030', 'mixamorigRightArm', 'mixamorig:RightArm', 'RightArm', 'upper_arm.R', 'arm_1.R', 'right_upper_arm'],
  rightLowerArm: ['arm_2R_031', 'arm_2.R_027', 'arm_2.R_031', 'mixamorigRightForeArm', 'mixamorig:RightForeArm', 'RightForeArm', 'forearm.R', 'arm_2.R', 'right_forearm'],
  rightHand: ['handR_032', 'hand.R_028', 'hand.R_032', 'mixamorigRightHand', 'mixamorig:RightHand', 'RightHand', 'hand.R', 'wrist.R', 'right_hand'],
  rightIndex: ['finger1_1.R_037', 'mixamorigRightHandIndex1', 'RightHandIndex1', 'finger_index.R', 'right_index'],
  rightMiddle: ['finger2_1.R_033', 'mixamorigRightHandMiddle1', 'RightHandMiddle1', 'finger_middle.R', 'right_middle'],
  rightThumb: ['thumb1.R_045', 'mixamorigRightHandThumb1', 'RightHandThumb1', 'thumb.R', 'right_thumb'],
  leftThigh: ['leg_1.L_062', 'leg_1L_062', 'hip.L_061', 'hipL_061', 'leg_1.L_050', 'hip.L_049', 'mixamorigLeftUpLeg', 'mixamorig:LeftUpLeg', 'LeftUpLeg', 'thigh.L', 'left_thigh'],
  leftCalf: ['leg_2.L_063', 'leg_2L_063', 'leg_2.L_00', 'mixamorigLeftLeg', 'mixamorig:LeftLeg', 'LeftLeg', 'shin.L', 'left_calf'],
  leftFoot: ['foot.L_064', 'footL_064', 'foot.L_051', 'mixamorigLeftFoot', 'mixamorig:LeftFoot', 'LeftFoot', 'foot.L', 'ankle.L', 'left_foot'],
  rightThigh: ['leg_1.R_068', 'leg_1R_068', 'hip.R_067', 'hipR_067', 'leg_1.R_054', 'hip.R_053', 'mixamorigRightUpLeg', 'mixamorig:RightUpLeg', 'RightUpLeg', 'thigh.R', 'right_thigh'],
  rightCalf: ['leg_2.R_069', 'leg_2R_069', 'leg_2.R_055', 'mixamorigRightLeg', 'mixamorig:RightLeg', 'RightLeg', 'shin.R', 'right_calf'],
  rightFoot: ['foot.R_070', 'footR_070', 'foot.R_056', 'mixamorigRightFoot', 'mixamorig:RightFoot', 'RightFoot', 'foot.R', 'ankle.R', 'right_foot']
};

export const BONE_PATTERNS = {
  head: [/head/i, /neck.*head/i],
  neck: [/neck/i],
  spine: [/spine.*[12]/i, /mixamorig.*spine$/i, /spine/i],
  chest: [/chest/i, /upperbody/i, /spine.*[234]/i, /mixamorig.*spine[12]/i],
  hips: [/hips/i, /pelvis/i, /master/i, /_root/i],
  leftUpperArm: [/(left|l_|\.l|mixamorig.*left).*arm(?!_2|2)/i, /arm_1\.l/i, /upper_arm.*l/i, /left.*upper.*arm/i],
  leftLowerArm: [/(left|l_|\.l|mixamorig.*left).*forearm/i, /arm_2\.l/i, /lower_arm.*l/i, /forearm.*l/i],
  leftHand: [/(left|l_|\.l|mixamorig.*left).*(hand|wrist)/i, /hand.*l/i, /wrist.*l/i],
  leftIndex: [/finger1.*\.l/i, /(left|l_|\.l|mixamorig.*left).*index/i],
  leftMiddle: [/finger2.*\.l/i, /(left|l_|\.l|mixamorig.*left).*middle/i],
  leftThumb: [/thumb1.*\.l/i, /(left|l_|\.l|mixamorig.*left).*thumb/i],
  rightUpperArm: [/(right|r_|\.r|mixamorig.*right).*arm(?!_2|2)/i, /arm_1\.r/i, /upper_arm.*r/i, /right.*upper.*arm/i],
  rightLowerArm: [/(right|r_|\.r|mixamorig.*right).*forearm/i, /arm_2\.r/i, /lower_arm.*r/i, /forearm.*r/i],
  rightHand: [/(right|r_|\.r|mixamorig.*right).*(hand|wrist)/i, /hand.*r/i, /wrist.*r/i],
  rightIndex: [/finger1.*\.r/i, /(right|r_|\.r|mixamorig.*right).*index/i],
  rightMiddle: [/finger2.*\.r/i, /(right|r_|\.r|mixamorig.*right).*middle/i],
  rightThumb: [/thumb1.*\.r/i, /(right|r_|\.r|mixamorig.*right).*thumb/i],
  leftThigh: [/(left|l_|\.l|mixamorig.*left).*(thigh|upleg)/i, /leg_1.*\.l/i, /leg_1.*l/i, /thigh.*l/i, /hip\.l/i],
  leftCalf: [/leg_2.*\.l/i, /leg_2.*l/i, /(left|l_|\.l).*(calf|shin|(?:^|:)leftleg$|leg_2)/i, /mixamorig.*leftleg$/i, /(left|l_|\.l).*leg(?! [_1-9]|upleg)/i],
  leftFoot: [/foot.*\.l/i, /(left|l_|\.l|mixamorig.*left).*(foot|ankle)/i, /foot.*l/i, /ankle.*l/i],
  rightThigh: [/(right|r_|\.r|mixamorig.*right).*(thigh|upleg)/i, /leg_1.*\.r/i, /leg_1.*r/i, /thigh.*r/i, /hip\.r/i],
  rightCalf: [/leg_2.*\.r/i, /leg_2.*r/i, /(right|r_|\.r).*(calf|shin|(?:^|:)rightleg$|leg_2)/i, /mixamorig.*rightleg$/i, /(right|r_|\.r).*leg(?! [_1-9]|upleg)/i],
  rightFoot: [/foot.*\.r/i, /(right|r_|\.r|mixamorig.*right).*(foot|ankle)/i, /foot.*r/i, /ankle.*r/i]
};

export const MP_LANDMARKS = {
  NOSE: 0, LEFT_EYE_INNER: 1, LEFT_EYE: 2, LEFT_EYE_OUTER: 3, RIGHT_EYE_INNER: 4, RIGHT_EYE: 5, RIGHT_EYE_OUTER: 6,
  LEFT_EAR: 7, RIGHT_EAR: 8, MOUTH_LEFT: 9, MOUTH_RIGHT: 10, LEFT_SHOULDER: 11, RIGHT_SHOULDER: 12,
  LEFT_ELBOW: 13, RIGHT_ELBOW: 14, LEFT_WRIST: 15, RIGHT_WRIST: 16, LEFT_PINKY: 17, RIGHT_PINKY: 18,
  LEFT_INDEX: 19, RIGHT_INDEX: 20, LEFT_THUMB: 21, RIGHT_THUMB: 22, LEFT_HIP: 23, RIGHT_HIP: 24,
  LEFT_KNEE: 25, RIGHT_KNEE: 26, LEFT_ANKLE: 27, RIGHT_ANKLE: 28, LEFT_HEEL: 29, RIGHT_HEEL: 30,
  LEFT_FOOT_INDEX: 31, RIGHT_FOOT_INDEX: 32
};

export function discoverBones(rootObject) {
  if (!rootObject) return {};
  const bones = {};
  const allNodesMap = new Map();
  const allNodeNames = [];

  rootObject.traverse((node) => {
    if (node.isSkinnedMesh && node.skeleton && node.skeleton.bones) {
      node.skeleton.bones.forEach((b) => {
        if (b && b.name) {
          allNodesMap.set(b.name, b);
          allNodeNames.push(b.name);
        }
      });
    }
    if (node.name) {
      allNodesMap.set(node.name, node);
      allNodeNames.push(node.name);
    }
  });

  Object.entries(BONE_DICTIONARY).forEach(([key, candidateNames]) => {
    for (const name of candidateNames) {
      if (allNodesMap.has(name)) {
        bones[key] = allNodesMap.get(name);
        break;
      }
    }
  });

  Object.entries(BONE_PATTERNS).forEach(([key, patterns]) => {
    if (!bones[key]) {
      for (const pattern of patterns) {
        const matchName = allNodeNames.find((name) => pattern.test(name));
        if (matchName && allNodesMap.has(matchName)) {
          bones[key] = allNodesMap.get(matchName);
          break;
        }
      }
    }
  });

  return bones;
}

export function captureRestPose(bones, rootObject) {
  if (rootObject) rootObject.updateMatrixWorld(true);
  const restPose = {};

  const getBoneDirection = (parentBone, childBone, fallback) => {
    if (!parentBone || !childBone) return fallback.clone().normalize();
    const p = new THREE.Vector3();
    const c = new THREE.Vector3();
    parentBone.getWorldPosition(p);
    childBone.getWorldPosition(c);
    const dir = new THREE.Vector3().subVectors(c, p);
    if (dir.lengthSq() < 0.0001) return fallback.clone().normalize();
    return dir.normalize();
  };

  if (bones.leftUpperArm) restPose.leftUpperArm = { restVec: getBoneDirection(bones.leftUpperArm, bones.leftLowerArm, new THREE.Vector3(1, 0, 0)), restQ: bones.leftUpperArm.quaternion.clone() };
  if (bones.leftLowerArm) restPose.leftLowerArm = { restVec: getBoneDirection(bones.leftLowerArm, bones.leftHand, new THREE.Vector3(1, 0, 0)), restQ: bones.leftLowerArm.quaternion.clone() };
  if (bones.leftHand) restPose.leftHand = { restVec: new THREE.Vector3(1, 0, 0), restQ: bones.leftHand.quaternion.clone() };

  if (bones.rightUpperArm) restPose.rightUpperArm = { restVec: getBoneDirection(bones.rightUpperArm, bones.rightLowerArm, new THREE.Vector3(-1, 0, 0)), restQ: bones.rightUpperArm.quaternion.clone() };
  if (bones.rightLowerArm) restPose.rightLowerArm = { restVec: getBoneDirection(bones.rightLowerArm, bones.rightHand, new THREE.Vector3(-1, 0, 0)), restQ: bones.rightLowerArm.quaternion.clone() };
  if (bones.rightHand) restPose.rightHand = { restVec: new THREE.Vector3(-1, 0, 0), restQ: bones.rightHand.quaternion.clone() };

  if (bones.head) restPose.head = { restVec: new THREE.Vector3(0, 0, 1), restQ: bones.head.quaternion.clone() };
  if (bones.neck) restPose.neck = { restVec: getBoneDirection(bones.neck, bones.head, new THREE.Vector3(0, 1, 0)), restQ: bones.neck.quaternion.clone() };
  if (bones.spine) restPose.spine = { restVec: getBoneDirection(bones.spine, bones.neck || bones.head, new THREE.Vector3(0, 1, 0)), restQ: bones.spine.quaternion.clone() };
  if (bones.chest) restPose.chest = { restVec: new THREE.Vector3(0, 1, 0), restQ: bones.chest.quaternion.clone() };

  if (bones.leftThigh) restPose.leftThigh = { restVec: getBoneDirection(bones.leftThigh, bones.leftCalf, new THREE.Vector3(0, -1, 0)), restQ: bones.leftThigh.quaternion.clone() };
  if (bones.leftCalf) restPose.leftCalf = { restVec: getBoneDirection(bones.leftCalf, bones.leftFoot, new THREE.Vector3(0, -1, 0)), restQ: bones.leftCalf.quaternion.clone() };
  if (bones.leftFoot) restPose.leftFoot = { restVec: new THREE.Vector3(0, 0, 1), restQ: bones.leftFoot.quaternion.clone() };

  if (bones.rightThigh) restPose.rightThigh = { restVec: getBoneDirection(bones.rightThigh, bones.rightCalf, new THREE.Vector3(0, -1, 0)), restQ: bones.rightThigh.quaternion.clone() };
  if (bones.rightCalf) restPose.rightCalf = { restVec: getBoneDirection(bones.rightCalf, bones.rightFoot, new THREE.Vector3(0, -1, 0)), restQ: bones.rightCalf.quaternion.clone() };
  if (bones.rightFoot) restPose.rightFoot = { restVec: new THREE.Vector3(0, 0, 1), restQ: bones.rightFoot.quaternion.clone() };

  return restPose;
}

let baselineHip = null;

export function resetBaselineHip() {
  baselineHip = null;
}

export function computeRootTranslation(landmarks, options = {}) {
  if (!landmarks || landmarks.length < 25) return null;
  const lh = landmarks[MP_LANDMARKS.LEFT_HIP];
  const rh = landmarks[MP_LANDMARKS.RIGHT_HIP];
  if (!lh || !rh) return null;

  const { scaleX = 3.2, scaleZ = 3.0, boundsX = [-2.2, 2.2], boundsZ = [-14.0, 14.0] } = options;

  const currentHip = {
    x: (lh.x + rh.x) * 0.5,
    y: (lh.y + rh.y) * 0.5,
    z: (lh.z + rh.z) * 0.5
  };

  if (!baselineHip) {
    baselineHip = { ...currentHip };
    return { dx: 0, dy: 0, dz: 0, raw: { dx: 0, dy: 0, dz: 0 } };
  }

  const rawDx = currentHip.x - baselineHip.x;
  const rawDy = currentHip.y - baselineHip.y;
  const rawDz = currentHip.z - baselineHip.z;

  let dx = -rawDx * scaleX;
  let dz = rawDz * scaleZ + (rawDy * 0.8);

  dx = THREE.MathUtils.clamp(dx, boundsX[0], boundsX[1]);
  dz = THREE.MathUtils.clamp(dz, boundsZ[0], boundsZ[1]);

  return { dx, dy: -rawDy * 1.5, dz, raw: { dx: rawDx, dy: rawDy, dz: rawDz } };
}

function lmToVec(lm) {
  if (!lm || typeof lm.x !== 'number' || isNaN(lm.x)) return null;
  return new THREE.Vector3(-(lm.x - 0.5), -(lm.y - 0.5), -lm.z);
}

/**
 * FIXED BONE ROTATION MATH
 * Calculates World Delta, transforms to Parent's Local Coordinate Frame, and updates matrix world.
 */
function applyBoneRotation(bone, restData, targetDirWorld, lerpFactor) {
  if (!bone || !restData || !targetDirWorld || targetDirWorld.lengthSq() < 0.0001) return;

  const restDirWorld = restData.restVec.clone().normalize();
  const targetDir = targetDirWorld.clone().normalize();

  if (restDirWorld.lengthSq() < 0.0001 || targetDir.lengthSq() < 0.0001) return;

  // 1. Calculate World-space Delta Quaternion
  const deltaQWorld = new THREE.Quaternion().setFromUnitVectors(restDirWorld, targetDir);

  // 2. Transform World Delta to Parent's Local Space
  const parentWorldQ = new THREE.Quaternion();
  if (bone.parent) {
    bone.parent.getWorldQuaternion(parentWorldQ);
  }

  const parentInv = parentWorldQ.clone().invert();
  const localDeltaQ = parentInv.clone().multiply(deltaQWorld).multiply(parentWorldQ);

  // 3. Combine with rest pose local quaternion
  const targetQ = localDeltaQ.multiply(restData.restQ.clone());

  if (!isNaN(targetQ.x) && !isNaN(targetQ.y) && !isNaN(targetQ.z) && !isNaN(targetQ.w)) {
    bone.quaternion.slerp(targetQ, lerpFactor);
    bone.updateMatrixWorld(true);
  }
}

export function applyKinematics({ bones, restPose, landmarks, lerpFactor = 0.35, blendWeight = 1.0 }) {
  if (!bones || !restPose || !landmarks || landmarks.length < 33 || blendWeight <= 0.001) return;

  try {
    const effectiveLerp = Math.min(1.0, Math.max(0.01, lerpFactor * blendWeight));

    const ls = lmToVec(landmarks[MP_LANDMARKS.LEFT_SHOULDER]);
    const rs = lmToVec(landmarks[MP_LANDMARKS.RIGHT_SHOULDER]);
    const le = lmToVec(landmarks[MP_LANDMARKS.LEFT_ELBOW]);
    const re = lmToVec(landmarks[MP_LANDMARKS.RIGHT_ELBOW]);
    const lw = lmToVec(landmarks[MP_LANDMARKS.LEFT_WRIST]);
    const rw = lmToVec(landmarks[MP_LANDMARKS.RIGHT_WRIST]);
    const lh = lmToVec(landmarks[MP_LANDMARKS.LEFT_HIP]);
    const rh = lmToVec(landmarks[MP_LANDMARKS.RIGHT_HIP]);
    const lk = lmToVec(landmarks[MP_LANDMARKS.LEFT_KNEE]);
    const rk = lmToVec(landmarks[MP_LANDMARKS.RIGHT_KNEE]);
    const la = lmToVec(landmarks[MP_LANDMARKS.LEFT_ANKLE]);
    const ra = lmToVec(landmarks[MP_LANDMARKS.RIGHT_ANKLE]);

    // 1. LEFT ARM
    if (bones.leftUpperArm && restPose.leftUpperArm && ls && le) {
      applyBoneRotation(bones.leftUpperArm, restPose.leftUpperArm, new THREE.Vector3().subVectors(le, ls), effectiveLerp);
    }
    if (bones.leftLowerArm && restPose.leftLowerArm && le && lw) {
      applyBoneRotation(bones.leftLowerArm, restPose.leftLowerArm, new THREE.Vector3().subVectors(lw, le), effectiveLerp);
    }

    // 2. RIGHT ARM
    if (bones.rightUpperArm && restPose.rightUpperArm && rs && re) {
      applyBoneRotation(bones.rightUpperArm, restPose.rightUpperArm, new THREE.Vector3().subVectors(re, rs), effectiveLerp);
    }
    if (bones.rightLowerArm && restPose.rightLowerArm && re && rw) {
      applyBoneRotation(bones.rightLowerArm, restPose.rightLowerArm, new THREE.Vector3().subVectors(rw, re), effectiveLerp);
    }

    // 3. LEFT LEG
    if (bones.leftThigh && restPose.leftThigh && lh && lk) {
      applyBoneRotation(bones.leftThigh, restPose.leftThigh, new THREE.Vector3().subVectors(lk, lh), effectiveLerp);
    }
    if (bones.leftCalf && restPose.leftCalf && lk && la) {
      applyBoneRotation(bones.leftCalf, restPose.leftCalf, new THREE.Vector3().subVectors(la, lk), effectiveLerp);
    }

    // 4. RIGHT LEG
    if (bones.rightThigh && restPose.rightThigh && rh && rk) {
      applyBoneRotation(bones.rightThigh, restPose.rightThigh, new THREE.Vector3().subVectors(rk, rh), effectiveLerp);
    }
    if (bones.rightCalf && restPose.rightCalf && rk && ra) {
      applyBoneRotation(bones.rightCalf, restPose.rightCalf, new THREE.Vector3().subVectors(ra, rk), effectiveLerp);
    }

    // 5. SPINE
    if (bones.spine && restPose.spine && ls && rs && lh && rh) {
      const midShoulder = new THREE.Vector3().addVectors(ls, rs).multiplyScalar(0.5);
      const midHip = new THREE.Vector3().addVectors(lh, rh).multiplyScalar(0.5);
      applyBoneRotation(bones.spine, restPose.spine, new THREE.Vector3().subVectors(midShoulder, midHip), effectiveLerp * 0.65);
    }

    // 6. HEAD
    const nose = lmToVec(landmarks[MP_LANDMARKS.NOSE]);
    const lEar = lmToVec(landmarks[MP_LANDMARKS.LEFT_EAR]);
    const rEar = lmToVec(landmarks[MP_LANDMARKS.RIGHT_EAR]);
    if (bones.head && restPose.head && nose && lEar && rEar) {
      const midEar = new THREE.Vector3().addVectors(lEar, rEar).multiplyScalar(0.5);
      applyBoneRotation(bones.head, restPose.head, new THREE.Vector3().subVectors(nose, midEar), effectiveLerp * 0.85);
    }
  } catch (err) {
    console.error("[MocapEngine] Kinematics update safe recovery:", err);
  }
}

export function blendToRestPose(bones, restPose, blendSpeed = 0.08) {
  if (!bones || !restPose) return;
  Object.entries(restPose).forEach(([key, data]) => {
    const bone = bones[key];
    if (bone && data.restQ) {
      bone.quaternion.slerp(data.restQ, blendSpeed);
      bone.updateMatrixWorld(true);
    }
  });
}

class MocapManager {
  constructor() {
    this.poseLandmarker = null;
    this.isInitializing = false;
    this.isTracking = false;
    this.videoElement = null;
    this.animFrameId = null;
    this.lastVideoTime = -1;
    this.latency = 0;
    this.callbacks = new Set();
  }

  async init() {
    if (this.poseLandmarker || this.isInitializing) return;
    this.isInitializing = true;
    try {
      const vision = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
      );
      this.poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task',
          delegate: 'GPU'
        },
        runningMode: 'VIDEO',
        numPoses: 1,
        minPoseDetectionConfidence: 0.3,
        minPosePresenceConfidence: 0.3,
        minTrackingConfidence: 0.3
      });
    } catch (err) {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
        );
        this.poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task',
            delegate: 'CPU'
          },
          runningMode: 'VIDEO',
          numPoses: 1
        });
      } catch (cpuErr) {
        console.error('[MocapEngine] MediaPipe Init Error:', cpuErr);
      }
    } finally {
      this.isInitializing = false;
    }
  }

  async startCamera(videoElement) {
    await this.init();
    if (!this.poseLandmarker || !videoElement) return false;
    this.videoElement = videoElement;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, frameRate: { ideal: 30 } },
        audio: false
      });
      videoElement.srcObject = stream;
      await videoElement.play();
      this.isTracking = true;
      this.loop();
      return true;
    } catch (err) {
      console.error('[MocapEngine] Webcam Error:', err);
      return false;
    }
  }

  loop = () => {
    if (!this.isTracking) return;

    try {
      if (this.videoElement && this.videoElement.readyState >= 2 && this.videoElement.currentTime !== this.lastVideoTime) {
        const startTime = performance.now();
        this.lastVideoTime = this.videoElement.currentTime;

        if (this.poseLandmarker) {
          const results = this.poseLandmarker.detectForVideo(this.videoElement, startTime);
          this.latency = Math.max(1, Math.round(performance.now() - startTime));

          if (results && results.landmarks && results.landmarks.length > 0) {
            const lms = results.landmarks[0];
            this.callbacks.forEach((cb) => {
              try { cb(lms, this.latency); } catch (e) { console.error(e); }
            });
          }
        }
      }
    } catch (err) {
      console.warn('[MocapEngine] Frame skipped safely:', err);
    }

    this.animFrameId = requestAnimationFrame(this.loop);
  };

  stopCamera() {
    this.isTracking = false;
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    if (this.videoElement && this.videoElement.srcObject) {
      const tracks = this.videoElement.srcObject.getTracks();
      tracks.forEach((track) => track.stop());
      this.videoElement.srcObject = null;
    }
  }

  subscribe(callback) {
    this.callbacks.add(callback);
    return () => this.callbacks.delete(callback);
  }
}

export const mocapEngine = new MocapManager();
