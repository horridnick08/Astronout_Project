import React, { useRef, useEffect } from 'react';
import { Camera, VideoOff, Activity } from 'lucide-react';
import { MP_LANDMARKS } from '../../engine/MocapEngine.js';

// MediaPipe 33 Landmark Skeleton Connections
const POSE_CONNECTIONS = [
  [MP_LANDMARKS.LEFT_SHOULDER, MP_LANDMARKS.RIGHT_SHOULDER],
  [MP_LANDMARKS.LEFT_SHOULDER, MP_LANDMARKS.LEFT_ELBOW],
  [MP_LANDMARKS.LEFT_ELBOW, MP_LANDMARKS.LEFT_WRIST],
  [MP_LANDMARKS.RIGHT_SHOULDER, MP_LANDMARKS.RIGHT_ELBOW],
  [MP_LANDMARKS.RIGHT_ELBOW, MP_LANDMARKS.RIGHT_WRIST],
  [MP_LANDMARKS.LEFT_SHOULDER, MP_LANDMARKS.LEFT_HIP],
  [MP_LANDMARKS.RIGHT_SHOULDER, MP_LANDMARKS.RIGHT_HIP],
  [MP_LANDMARKS.LEFT_HIP, MP_LANDMARKS.RIGHT_HIP],
  [MP_LANDMARKS.LEFT_HIP, MP_LANDMARKS.LEFT_KNEE],
  [MP_LANDMARKS.LEFT_KNEE, MP_LANDMARKS.LEFT_ANKLE],
  [MP_LANDMARKS.RIGHT_HIP, MP_LANDMARKS.RIGHT_KNEE],
  [MP_LANDMARKS.RIGHT_KNEE, MP_LANDMARKS.RIGHT_ANKLE],
  [MP_LANDMARKS.NOSE, MP_LANDMARKS.LEFT_SHOULDER],
  [MP_LANDMARKS.NOSE, MP_LANDMARKS.RIGHT_SHOULDER]
];

/**
 * WebcamFeed
 * 
 * Corner PiP webcam feed with live MediaPipe 33-point skeleton overlay.
 */
export default function WebcamFeed({
  videoRef,
  canvasRef,
  isLive = false,
  latency = 0,
  landmarks = []
}) {
  // Render 2D skeleton on the canvas overlay
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Match canvas dimensions to client dimensions
    if (canvas.width !== canvas.clientWidth || canvas.height !== canvas.clientHeight) {
      canvas.width = canvas.clientWidth || 240;
      canvas.height = canvas.clientHeight || 180;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!isLive || !landmarks || landmarks.length === 0) return;

    // Draw Skeleton Lines
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = '#06b6d4'; // Glowing Cyan
    ctx.shadowColor = '#06b6d4';
    ctx.shadowBlur = 6;

    POSE_CONNECTIONS.forEach(([startIdx, endIdx]) => {
      const p1 = landmarks[startIdx];
      const p2 = landmarks[endIdx];
      if (p1 && p2 && (p1.visibility ?? 1) > 0.4 && (p2.visibility ?? 1) > 0.4) {
        ctx.beginPath();
        // Flip x for webcam mirror view
        ctx.moveTo((1.0 - p1.x) * canvas.width, p1.y * canvas.height);
        ctx.lineTo((1.0 - p2.x) * canvas.width, p2.y * canvas.height);
        ctx.stroke();
      }
    });

    ctx.shadowBlur = 0;

    // Draw Joint Nodes
    landmarks.forEach((p, idx) => {
      if ((p.visibility ?? 1) > 0.4) {
        ctx.beginPath();
        ctx.arc((1.0 - p.x) * canvas.width, p.y * canvas.height, 3.5, 0, 2 * Math.PI);
        // Orange for face/hands, cyan for body
        ctx.fillStyle = [0, 15, 16, 27, 28].includes(idx) ? '#f59e0b' : '#38bdf8';
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    });
  }, [landmarks, isLive, canvasRef]);

  return (
    <div className="relative rounded-xl overflow-hidden border border-cyan-500/30 bg-slate-900/80 backdrop-blur-md shadow-2xl shadow-cyan-950/40 w-full h-48 flex flex-col">
      {/* Video Header Bar */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-slate-950/60 border-b border-cyan-500/20 text-xs font-mono">
        <div className="flex items-center gap-1.5">
          <span className={`w-2 h-2 rounded-full ${isLive ? 'bg-red-500 animate-pulse' : 'bg-slate-600'}`} />
          <span className="text-slate-300 font-semibold">{isLive ? 'LIVE MOCAP' : 'CAM STANDBY'}</span>
        </div>
        {isLive && (
          <div className="flex items-center gap-1 text-cyan-400">
            <Activity className="w-3 h-3 animate-spin" />
            <span>{latency}ms</span>
          </div>
        )}
      </div>

      {/* Video & Canvas Viewport */}
      <div className="relative flex-1 bg-black flex items-center justify-center">
        {/* Hidden / Stream Video Element */}
        <video
          ref={videoRef}
          className={`absolute inset-0 w-full h-full object-cover transform -scale-x-100 ${isLive ? 'opacity-80' : 'opacity-0'}`}
          playsInline
          muted
        />

        {/* 2D Landmark Overlay Canvas */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full pointer-events-none z-10"
        />

        {/* Inactive Standby Placeholder */}
        {!isLive && (
          <div className="flex flex-col items-center justify-center text-slate-500 gap-2 p-4 text-center">
            <VideoOff className="w-8 h-8 text-slate-600" />
            <p className="text-xs font-mono">Webcam Offline.<br />Toggle "Live Cam" to track.</p>
          </div>
        )}
      </div>
    </div>
  );
}
