/**
 * browserPoseTracker.js
 * 
 * Production-Grade Pure JS MediaPipe Pose Tracker using @mediapipe/tasks-vision
 * - WebAssembly-based PoseLandmarker in VIDEO running mode
 * - 3D World Landmarks (metric coordinates) + Normalized 2D Landmarks
 * - Lightweight 1-Euro jitter filtering on key kinematic joints
 * - High-fidelity zero-G astronaut kinematic synthesis fallback
 * - Frame rate (FPS) and inference latency instrumentation
 */

import { FilesetResolver, PoseLandmarker } from '@mediapipe/tasks-vision';

// Adaptive 1-Euro Filter for Jitter Reduction
class LowPassFilter {
  constructor(alpha = 0.5) {
    this.alpha = alpha;
    this.y = null;
  }
  filter(v) {
    if (this.y === null) {
      this.y = v;
      return v;
    }
    this.y = this.alpha * v + (1 - this.alpha) * this.y;
    return this.y;
  }
}

class JointSmoother {
  constructor(minCutoff = 1.0, beta = 0.008) {
    this.minCutoff = minCutoff;
    this.beta = beta;
    this.xFilter = new LowPassFilter(0.7);
    this.yFilter = new LowPassFilter(0.7);
    this.zFilter = new LowPassFilter(0.7);
    this.lastVal = null;
    this.lastTime = null;
  }

  filter(pos, timestamp) {
    if (!pos) return null;
    if (!this.lastTime) {
      this.lastTime = timestamp;
      this.lastVal = { ...pos };
      return pos;
    }

    const dt = Math.max((timestamp - this.lastTime) / 1000, 0.005);
    const dx = (pos.x - this.lastVal.x) / dt;
    const dy = (pos.y - this.lastVal.y) / dt;
    const dz = (pos.z - this.lastVal.z) / dt;
    const speed = Math.sqrt(dx * dx + dy * dy + dz * dz);

    // Dynamic alpha: smooth when still, fast when moving
    const alpha = Math.min(Math.max(0.2 + speed * this.beta, 0.25), 0.85);
    this.xFilter.alpha = alpha;
    this.yFilter.alpha = alpha;
    this.zFilter.alpha = alpha;

    const filtered = {
      x: this.xFilter.filter(pos.x),
      y: this.yFilter.filter(pos.y),
      z: this.zFilter.filter(pos.z),
      visibility: pos.visibility ?? 1.0
    };

    this.lastVal = filtered;
    this.lastTime = timestamp;
    return filtered;
  }

  reset() {
    this.xFilter.y = null;
    this.yFilter.y = null;
    this.zFilter.y = null;
    this.lastVal = null;
    this.lastTime = null;
  }
}

class BrowserPoseTracker {
  constructor() {
    this.poseLandmarker = null;
    this.videoElement = null;
    this.isRunning = false;
    this.isSynthetic = false;
    this.animationFrameId = null;
    this.statusListeners = new Set();
    this.poseListeners = new Set();
    this.status = 'STANDBY';
    this.fps = 0;
    this.latency = 0;
    this.lastVideoTime = -1;
    this.lastFrameTime = performance.now();
    this.frameCount = 0;
    this.fpsTimer = performance.now();
    this.syntheticPhase = 0;

    // Smoothers map per landmark index
    this.smoothers = new Map();
    this.worldSmoothers = new Map();
  }

  subscribeStatus(fn) {
    this.statusListeners.add(fn);
    fn(this.status);
    return () => this.statusListeners.delete(fn);
  }

  subscribe(fn) {
    this.poseListeners.add(fn);
    return () => this.poseListeners.delete(fn);
  }

  notifyStatus(status) {
    this.status = status;
    this.statusListeners.forEach((fn) => fn(status));
  }

  notifyPose(landmarks, worldLandmarks, latency, isSynthetic = false) {
    this.poseListeners.forEach((fn) => fn({
      landmarks,
      worldLandmarks,
      latency,
      fps: this.fps,
      isSynthetic,
      timestamp: performance.now()
    }));
  }

  /**
   * Initializes @mediapipe/tasks-vision PoseLandmarker
   */
  async initPoseLandmarker() {
    if (this.poseLandmarker) return this.poseLandmarker;

    this.notifyStatus('INITIALIZING');

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
      minPoseDetectionConfidence: 0.5,
      minPosePresenceConfidence: 0.5,
      minTrackingConfidence: 0.5
    });

    return this.poseLandmarker;
  }

  /**
   * Starts tracking via physical user webcam
   */
  async startCamera(videoElement) {
    this.stop();
    this.notifyStatus('INITIALIZING');

    try {
      this.videoElement = videoElement;

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Webcam API is unavailable in this environment');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        },
        audio: false
      });

      videoElement.srcObject = stream;
      await new Promise((resolve) => {
        videoElement.onloadedmetadata = () => {
          videoElement.play();
          resolve();
        };
      });

      await this.initPoseLandmarker();
      this.isRunning = true;
      this.isSynthetic = false;
      this.notifyStatus('ACTIVE');

      const renderLoop = () => {
        if (!this.isRunning || this.isSynthetic) return;

        if (this.videoElement && this.videoElement.currentTime !== this.lastVideoTime && this.videoElement.readyState >= 2) {
          const startTime = performance.now();
          this.lastVideoTime = this.videoElement.currentTime;

          const results = this.poseLandmarker.detectForVideo(this.videoElement, startTime);
          const now = performance.now();
          this.latency = Math.round(now - startTime);

          // Update FPS calculation
          this.frameCount++;
          if (now - this.fpsTimer >= 1000) {
            this.fps = this.frameCount;
            this.frameCount = 0;
            this.fpsTimer = now;
          }

          if (results && results.landmarks && results.landmarks[0]) {
            const rawNorm = results.landmarks[0];
            const rawWorld = results.worldLandmarks ? results.worldLandmarks[0] : rawNorm;

            // Apply 1-Euro smoothing to eliminate jitter
            const smoothedNorm = rawNorm.map((lm, idx) => {
              if (!this.smoothers.has(idx)) {
                this.smoothers.set(idx, new JointSmoother());
              }
              return this.smoothers.get(idx).filter(lm, now);
            });

            const smoothedWorld = rawWorld.map((wlm, idx) => {
              if (!this.worldSmoothers.has(idx)) {
                this.worldSmoothers.set(idx, new JointSmoother());
              }
              return this.worldSmoothers.get(idx).filter(wlm, now);
            });

            this.notifyPose(smoothedNorm, smoothedWorld, this.latency, false);
          }
        }

        if (this.isRunning && !this.isSynthetic) {
          this.animationFrameId = requestAnimationFrame(renderLoop);
        }
      };

      this.animationFrameId = requestAnimationFrame(renderLoop);
      return true;
    } catch (err) {
      console.warn('[PoseTracker] Webcam initialization error, falling back to Zero-G Sim:', err.message);
      this.startSyntheticTelemetry();
      return false;
    }
  }

  /**
   * Generates continuous high-fidelity 33-landmark Zero-G astronaut kinematic telemetry
   */
  startSyntheticTelemetry() {
    this.stopCameraStream();
    this.isRunning = true;
    this.isSynthetic = true;
    this.notifyStatus('SYNTHETIC');

    const generateLoop = () => {
      if (!this.isRunning || !this.isSynthetic) return;

      const now = performance.now();
      this.syntheticPhase += 0.025;
      const t = this.syntheticPhase;

      this.frameCount++;
      if (now - this.fpsTimer >= 1000) {
        this.fps = this.frameCount;
        this.frameCount = 0;
        this.fpsTimer = now;
      }

      const { norm, world } = this._generateZeroGLandmarks(t);
      this.latency = 2 + Math.floor(Math.sin(t * 2) * 1.5);
      this.notifyPose(norm, world, this.latency, true);

      this.animationFrameId = requestAnimationFrame(generateLoop);
    };

    this.animationFrameId = requestAnimationFrame(generateLoop);
  }

  _generateZeroGLandmarks(t) {
    const floatY = Math.sin(t * 0.8) * 0.04;
    const swayX = Math.cos(t * 0.5) * 0.03;
    const breathing = Math.sin(t * 1.5) * 0.01;

    // Head / Nose
    const noseX = 0.5 + swayX;
    const noseY = 0.28 + floatY;
    const noseZ = -0.15;

    // Shoulders
    const lsX = 0.62 + swayX + breathing;
    const lsY = 0.38 + floatY;
    const lsZ = -0.05;

    const rsX = 0.38 + swayX - breathing;
    const rsY = 0.38 + floatY;
    const rsZ = -0.05;

    // Right Arm (EVA panel manipulation / wave)
    const relbowX = 0.26 + Math.cos(t * 1.2) * 0.06;
    const relbowY = 0.48 + Math.sin(t * 1.2) * 0.08 + floatY;
    const relbowZ = 0.12 + Math.sin(t) * 0.06;

    const rwristX = 0.20 + Math.cos(t * 1.2 + 0.4) * 0.08;
    const rwristY = 0.62 + Math.sin(t * 1.2 + 0.4) * 0.10 + floatY;
    const rwristZ = 0.25 + Math.cos(t * 1.5) * 0.10;

    // Left Arm (Zero-g floating tether grip)
    const lelbowX = 0.74 + Math.sin(t * 0.9) * 0.04;
    const lelbowY = 0.50 + Math.cos(t * 0.9) * 0.05 + floatY;
    const lelbowZ = -0.08;

    const lwristX = 0.82 + Math.sin(t * 0.9 + 0.5) * 0.06;
    const lwristY = 0.64 + Math.cos(t * 0.9 + 0.5) * 0.08 + floatY;
    const lwristZ = -0.12;

    // Hips
    const lhX = 0.56 + swayX * 0.7;
    const lhY = 0.68 + floatY;
    const lhZ = 0.0;

    const rhX = 0.44 + swayX * 0.7;
    const rhY = 0.68 + floatY;
    const rhZ = 0.0;

    const norm = new Array(33).fill(null).map(() => ({ x: 0.5, y: 0.5, z: 0, visibility: 0.95 }));
    const world = new Array(33).fill(null).map(() => ({ x: 0, y: 0, z: 0, visibility: 0.95 }));

    // Assign key joints
    norm[0] = { x: noseX, y: noseY, z: noseZ, visibility: 0.99 };
    norm[11] = { x: lsX, y: lsY, z: lsZ, visibility: 0.99 };
    norm[12] = { x: rsX, y: rsY, z: rsZ, visibility: 0.99 };
    norm[13] = { x: lelbowX, y: lelbowY, z: lelbowZ, visibility: 0.98 };
    norm[14] = { x: relbowX, y: relbowY, z: relbowZ, visibility: 0.98 };
    norm[15] = { x: lwristX, y: lwristY, z: lwristZ, visibility: 0.95 };
    norm[16] = { x: rwristX, y: rwristY, z: rwristZ, visibility: 0.95 };
    norm[23] = { x: lhX, y: lhY, z: lhZ, visibility: 0.99 };
    norm[24] = { x: rhX, y: rhY, z: rhZ, visibility: 0.99 };

    // Convert normalized coords to approximate 3D metric world space for bone kinematics
    for (let i = 0; i < 33; i++) {
      const p = norm[i];
      world[i] = {
        x: (p.x - 0.5) * 1.6,
        y: -(p.y - 0.5) * 1.8,
        z: -(p.z || 0) * 1.5,
        visibility: p.visibility
      };
    }

    return { norm, world };
  }

  stopCameraStream() {
    if (this.videoElement && this.videoElement.srcObject) {
      const tracks = this.videoElement.srcObject.getTracks();
      tracks.forEach((track) => track.stop());
      this.videoElement.srcObject = null;
    }
  }

  stop() {
    this.isRunning = false;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    this.stopCameraStream();
    this.notifyStatus('STANDBY');
  }
}

export const browserPoseTracker = new BrowserPoseTracker();
