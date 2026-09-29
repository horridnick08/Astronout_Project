/**
 * motionPredictionEngine.js
 * 
 * 100% Client-Side Edge AI Motion Prediction & Filtering Engine
 * - 1-Euro Adaptive Low-Pass Filter for jitter suppression
 * - Kinematic velocity and acceleration calculation for 33 MediaPipe landmarks
 * - Predictive dead-reckoning extrapolation for zero-latency 3D avatar responsiveness
 * - Zero-G microgravity drift & orbital inertia stabilization
 * - Biomechanical anomaly detection & occlusion recovery
 */

class OneEuroFilter {
  constructor(minCutoff = 1.0, beta = 0.007, dCutoff = 1.0) {
    this.minCutoff = minCutoff;
    this.beta = beta;
    this.dCutoff = dCutoff;
    this.xPrev = null;
    this.dxPrev = 0;
    this.tPrev = null;
  }

  alpha(rate, cutoff) {
    const tau = 1.0 / (2 * Math.PI * cutoff);
    const te = 1.0 / rate;
    return 1.0 / (1.0 + tau / te);
  }

  filter(x, timestamp) {
    if (this.tPrev === null) {
      this.xPrev = x;
      this.dxPrev = 0;
      this.tPrev = timestamp;
      return x;
    }

    const dt = Math.max((timestamp - this.tPrev) / 1000.0, 0.001);
    const rate = 1.0 / dt;

    // Estimate derivative
    const dx = (x - this.xPrev) / dt;
    const edx = this.dxPrev + this.alpha(rate, this.dCutoff) * (dx - this.dxPrev);

    // Compute dynamic cutoff frequency
    const cutoff = this.minCutoff + this.beta * Math.abs(edx);
    const a = this.alpha(rate, cutoff);

    // Filter value
    const filteredX = this.xPrev + a * (x - this.xPrev);

    this.xPrev = filteredX;
    this.dxPrev = edx;
    this.tPrev = timestamp;

    return filteredX;
  }

  reset() {
    this.xPrev = null;
    this.dxPrev = 0;
    this.tPrev = null;
  }
}

export class MotionPredictionEngine {
  constructor() {
    this.predictionHorizonMs = 80; // Default: +80ms forward projection
    this.zeroGDamping = 0.85;       // Zero-G inertia factor
    this.filters = new Map();      // Map of OneEuroFilters per landmark (x, y, z)
    this.lastLandmarks = null;
    this.lastTimestamp = null;
    this.velocities = [];
    this.accelerations = [];
    this.anomalyCount = 0;
    this.maxAllowedDisplacement = 0.45; // Max normalized jump per frame before occlusion alert
  }

  setPredictionHorizon(ms) {
    this.predictionHorizonMs = Math.max(0, Math.min(ms, 300));
  }

  setZeroGDamping(damping) {
    this.zeroGDamping = Math.max(0.1, Math.min(damping, 1.0));
  }

  getOrCreateFilter(key, minCutoff = 1.2, beta = 0.008) {
    if (!this.filters.has(key)) {
      this.filters.set(key, new OneEuroFilter(minCutoff, beta));
    }
    return this.filters.get(key);
  }

  /**
   * Processes raw 33 landmarks from MediaPipe Pose.
   * Returns filtered, predicted, and kinematic aerospace telemetry data.
   */
  process(rawLandmarks, timestamp = performance.now()) {
    if (!rawLandmarks || rawLandmarks.length === 0) {
      return {
        filteredLandmarks: [],
        predictedLandmarks: [],
        orientation: { pitch: 0, yaw: 0, roll: 0 },
        metrics: {
          predictionHorizonMs: this.predictionHorizonMs,
          avgVelocity: 0,
          confidence: 0,
          trackingState: 'SEARCHING',
          anomalyDetected: false,
          driftOffset: { x: 0, y: 0, z: 0 }
        }
      };
    }

    const dt = this.lastTimestamp ? Math.max((timestamp - this.lastTimestamp) / 1000, 0.005) : 0.033;
    const horizonSec = this.predictionHorizonMs / 1000.0;

    const filtered = [];
    const predicted = [];
    let totalVelocity = 0;
    let anomalyDetected = false;
    let confidenceSum = 0;

    for (let i = 0; i < rawLandmarks.length; i++) {
      const raw = rawLandmarks[i];
      confidenceSum += raw.visibility ?? 0.9;

      // Anomaly detection: Sudden huge teleports typically mean tracking jitter or occlusion
      let safeX = raw.x;
      let safeY = raw.y;
      let safeZ = raw.z || 0;

      if (this.lastLandmarks && this.lastLandmarks[i]) {
        const prev = this.lastLandmarks[i];
        const dist = Math.sqrt(
          (safeX - prev.x) ** 2 +
          (safeY - prev.y) ** 2 +
          (safeZ - prev.z) ** 2
        );

        if (dist > this.maxAllowedDisplacement) {
          anomalyDetected = true;
          this.anomalyCount++;
          // Clamp jump to realistic kinematic limit
          const factor = this.maxAllowedDisplacement / dist;
          safeX = prev.x + (safeX - prev.x) * factor;
          safeY = prev.y + (safeY - prev.y) * factor;
          safeZ = prev.z + (safeZ - prev.z) * factor;
        }
      }

      // 1-Euro adaptive low-pass filter
      const fx = this.getOrCreateFilter(`${i}_x`).filter(safeX, timestamp);
      const fy = this.getOrCreateFilter(`${i}_y`).filter(safeY, timestamp);
      const fz = this.getOrCreateFilter(`${i}_z`).filter(safeZ, timestamp);

      filtered.push({
        x: fx,
        y: fy,
        z: fz,
        visibility: raw.visibility ?? 1.0
      });

      // Kinematic derivatives (Velocity & Acceleration)
      let vx = 0, vy = 0, vz = 0;
      let ax = 0, ay = 0, az = 0;

      if (this.lastLandmarks && this.lastLandmarks[i]) {
        const prevF = this.lastLandmarks[i];
        vx = (fx - prevF.x) / dt;
        vy = (fy - prevF.y) / dt;
        vz = (fz - prevF.z) / dt;

        if (this.velocities[i]) {
          const prevV = this.velocities[i];
          ax = (vx - prevV.x) / dt;
          ay = (vy - prevV.y) / dt;
          az = (vz - prevV.z) / dt;
        }
      }

      this.velocities[i] = { x: vx, y: vy, z: vz };
      this.accelerations[i] = { x: ax, y: ay, z: az };

      const vMag = Math.sqrt(vx * vx + vy * vy + vz * vz);
      totalVelocity += vMag;

      // 2nd-Order Dead-Reckoning Trajectory Extrapolation
      // x_pred = x + v * dt + 0.5 * a * dt^2
      // with zero-g dampening to prevent overshoot
      const damp = Math.pow(this.zeroGDamping, horizonSec * 10);
      const px = fx + (vx * horizonSec + 0.5 * ax * horizonSec * horizonSec) * damp;
      const py = fy + (vy * horizonSec + 0.5 * ay * horizonSec * horizonSec) * damp;
      const pz = fz + (vz * horizonSec + 0.5 * az * horizonSec * horizonSec) * damp;

      predicted.push({
        x: px,
        y: py,
        z: pz,
        visibility: raw.visibility ?? 1.0
      });
    }

    // Biomechanical Body Orientation (Pitch, Yaw, Roll)
    const orientation = this.computeBodyOrientation(filtered);

    // Telemetry & Edge AI stats
    const avgVelocity = totalVelocity / rawLandmarks.length;
    const avgConfidence = Math.min(100, Math.round((confidenceSum / rawLandmarks.length) * 100));

    let trackingState = 'LOCKED';
    if (anomalyDetected) {
      trackingState = 'OCCLUSION_RECOVERY';
    } else if (this.predictionHorizonMs > 50 && avgVelocity > 0.05) {
      trackingState = 'PREDICTING';
    }

    this.lastLandmarks = filtered;
    this.lastTimestamp = timestamp;

    return {
      filteredLandmarks: filtered,
      predictedLandmarks: predicted,
      orientation,
      velocities: this.velocities,
      metrics: {
        predictionHorizonMs: this.predictionHorizonMs,
        avgVelocity: Number(avgVelocity.toFixed(4)),
        confidence: avgConfidence,
        trackingState,
        anomalyDetected,
        anomalyCount: this.anomalyCount
      }
    };
  }

  /**
   * Computes Torso Pitch, Yaw, Roll from shoulders (11, 12) and hips (23, 24)
   */
  computeBodyOrientation(landmarks) {
    if (!landmarks || landmarks.length < 25) {
      return { pitch: 0, yaw: 0, roll: 0 };
    }

    const ls = landmarks[11]; // Left Shoulder
    const rs = landmarks[12]; // Right Shoulder
    const lh = landmarks[23]; // Left Hip
    const rh = landmarks[24]; // Right Hip

    if (!ls || !rs || !lh || !rh) {
      return { pitch: 0, yaw: 0, roll: 0 };
    }

    // Shoulder mid-point and Hip mid-point (Spine vector)
    const midShoulder = {
      x: (ls.x + rs.x) / 2,
      y: (ls.y + rs.y) / 2,
      z: (ls.z + rs.z) / 2
    };
    const midHip = {
      x: (lh.x + rh.x) / 2,
      y: (lh.y + rh.y) / 2,
      z: (lh.z + rh.z) / 2
    };

    // Roll: angle of shoulder line in XY plane
    const dxShoulders = rs.x - ls.x;
    const dyShoulders = rs.y - ls.y;
    const roll = Math.atan2(dyShoulders, dxShoulders) * (180 / Math.PI);

    // Yaw: depth difference between shoulders
    const dzShoulders = (rs.z || 0) - (ls.z || 0);
    const yaw = Math.atan2(dzShoulders, Math.abs(dxShoulders) || 0.001) * (180 / Math.PI);

    // Pitch: forward/backward tilt of spine vector
    const dySpine = midShoulder.y - midHip.y;
    const dzSpine = (midShoulder.z || 0) - (midHip.z || 0);
    const pitch = Math.atan2(dzSpine, Math.abs(dySpine) || 0.001) * (180 / Math.PI);

    return {
      pitch: Number(pitch.toFixed(1)),
      yaw: Number(yaw.toFixed(1)),
      roll: Number(roll.toFixed(1))
    };
  }

  reset() {
    this.filters.clear();
    this.lastLandmarks = null;
    this.lastTimestamp = null;
    this.velocities = [];
    this.accelerations = [];
    this.anomalyCount = 0;
  }
}

export const motionPredictionEngine = new MotionPredictionEngine();
