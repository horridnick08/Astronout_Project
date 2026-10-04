import React, { useRef, useEffect } from 'react';
import { Maximize2, Minimize2 } from 'lucide-react';
import { videoPoseTracker, SKELETON_CONNECTIONS } from '../../engine/VideoPoseTracker.ts';

interface LiveAstronautFeedProps {
  isSwapped: boolean;
  onToggleSwap: () => void;
}

/**
 * LiveAstronautFeed.tsx
 *
 * Real-Time Computer Vision (CV) Pose Landmark Skeleton & Dynamic Object Detection Overlay:
 * 1. Looping video source: /videos/astronaut_feed.mp4 (<video id="astronaut-feed">)
 * 2. Canvas 2D Skeleton Layer:
 *    - 33-point MediaPipe Pose landmarks mapped dynamically to the astronaut's body.
 *    - Glowing vector lines connecting shoulders, spine, arms, hands, hips, and legs (#00ff99 / #00f0ff).
 *    - Glowing joint keypoints with pulse rings and solid white cores.
 *    - Dynamic Hand & Cargo/Tool Bounding Box tracking the astronaut's active hand.
 *    - Sub-label tag: [OBJECT DETECTED: CARGO / TOOL] with dynamic confidence (96.8%).
 *    - Dynamic Head Pose HUD tag: [TARGET: ASTRONAUT EVA-1 | POSE TRACKED].
 * 3. Bidirectional Viewport Swap between bottom-right card (310x192) and fullscreen main screen.
 */
export default function LiveAstronautFeed({
  isSwapped,
  onToggleSwap,
}: LiveAstronautFeedProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Guarantee continuous looping playback on mount & swap transitions
  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      video.muted = true;
      video.play().catch(() => {
        // Fallback for strict browser autoplay policies
      });
    }
  }, [isSwapped]);

  // Real-time Canvas 2D Pose Landmark Skeleton & Object Tracking Loop
  useEffect(() => {
    let animId: number;

    const render = () => {
      const canvas = canvasRef.current;
      const video = videoRef.current;

      if (canvas && video && video.readyState >= 2) {
        const rect = canvas.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        const w = Math.round(rect.width * dpr);
        const h = Math.round(rect.height * dpr);

        if (canvas.width !== w || canvas.height !== h) {
          canvas.width = w;
          canvas.height = h;
        }

        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.save();
          ctx.scale(dpr, dpr);
          ctx.clearRect(0, 0, rect.width, rect.height);

          // Update CV pose tracker engine
          const { landmarks, kinematics, objectBox } = videoPoseTracker.update(video);

          // Calculate aspect-ratio cover projection for accurate landmark overlay
          const vW = video.videoWidth || 1920;
          const vH = video.videoHeight || 1080;
          const scale = Math.max(rect.width / vW, rect.height / vH);
          const offsetX = (rect.width - vW * scale) / 2;
          const offsetY = (rect.height - vH * scale) / 2;

          const toScreen = (lm: { x: number; y: number }) => ({
            x: offsetX + lm.x * vW * scale,
            y: offsetY + lm.y * vH * scale,
          });

          const pts = landmarks.map(toScreen);

          // ─── 1. DRAW CONNECTING SKELETON VECTOR LINES ──────────────────
          ctx.save();
          ctx.lineWidth = isSwapped ? 2.5 : 1.5;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';

          for (const [i, j] of SKELETON_CONNECTIONS) {
            const p1 = pts[i];
            const p2 = pts[j];
            if (!p1 || !p2) continue;

            // Semi-transparent glowing cybernetic vector lines
            ctx.shadowColor = '#00f0ff';
            ctx.shadowBlur = isSwapped ? 8 : 4;
            ctx.strokeStyle = 'rgba(0, 255, 153, 0.75)';

            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
          ctx.restore();

          // ─── 2. DRAW GLOWING JOINT KEYPOINTS ─────────────────────────
          ctx.save();
          for (let idx = 0; idx < pts.length; idx++) {
            const pt = pts[idx];
            if (!pt) continue;

            const isHeadFace = idx <= 10;
            const isHand = idx >= 15 && idx <= 22;
            const isTorso = idx === 11 || idx === 12 || idx === 23 || idx === 24;

            const radius = isSwapped
              ? isHand || isTorso
                ? 4.5
                : 3.5
              : isHand || isTorso
              ? 2.8
              : 1.8;

            // Glowing Outer Ring
            ctx.shadowColor = isHand ? '#00e5ff' : '#00ff99';
            ctx.shadowBlur = isSwapped ? 10 : 5;
            ctx.fillStyle = isHand ? '#00e5ff' : isHeadFace ? '#38bdf8' : '#00ff99';

            ctx.beginPath();
            ctx.arc(pt.x, pt.y, radius, 0, Math.PI * 2);
            ctx.fill();

            // High-intensity white center core
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(pt.x, pt.y, radius * 0.45, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.restore();

          // ─── 3. DYNAMIC HAND & OBJECT TRACKING BOUNDING BOX ───────────
          // Dynamically anchored to the astronaut's active hand (right wrist: pts[16])
          const handPt = pts[16] || pts[15];
          if (handPt) {
            const boxW = isSwapped ? 136 : 68;
            const boxH = isSwapped ? 98 : 48;
            const bx = handPt.x - boxW * 0.45;
            const by = handPt.y - boxH * 0.42;

            ctx.save();
            // Glowing cyan corner brackets
            ctx.strokeStyle = '#00f0ff';
            ctx.lineWidth = isSwapped ? 2 : 1.5;
            ctx.shadowColor = '#00f0ff';
            ctx.shadowBlur = isSwapped ? 12 : 6;

            const cornerLen = isSwapped ? 14 : 7;
            // Top-left
            ctx.beginPath();
            ctx.moveTo(bx, by + cornerLen);
            ctx.lineTo(bx, by);
            ctx.lineTo(bx + cornerLen, by);
            ctx.stroke();

            // Top-right
            ctx.beginPath();
            ctx.moveTo(bx + boxW - cornerLen, by);
            ctx.lineTo(bx + boxW, by);
            ctx.lineTo(bx + boxW, by + cornerLen);
            ctx.stroke();

            // Bottom-left
            ctx.beginPath();
            ctx.moveTo(bx, by + boxH - cornerLen);
            ctx.lineTo(bx, by + boxH);
            ctx.lineTo(bx + cornerLen, by + boxH);
            ctx.stroke();

            // Bottom-right
            ctx.beginPath();
            ctx.moveTo(bx + boxW - cornerLen, by + boxH);
            ctx.lineTo(bx + boxW, by + boxH);
            ctx.lineTo(bx + boxW, by + boxH - cornerLen);
            ctx.stroke();

            // Subtle target crosshair inside cargo box
            ctx.strokeStyle = 'rgba(0, 240, 255, 0.45)';
            ctx.lineWidth = 1;
            const cx = bx + boxW / 2;
            const cy = by + boxH / 2;
            ctx.beginPath();
            ctx.moveTo(cx - 5, cy);
            ctx.lineTo(cx + 5, cy);
            ctx.moveTo(cx, cy - 5);
            ctx.lineTo(cx, cy + 5);
            ctx.stroke();

            // Sub-label tag on object box: [OBJECT DETECTED: CARGO / TOOL] with confidence metrics (96.8%)
            const tagText = `[OBJECT DETECTED: CARGO / TOOL | ${objectBox.confidence}]`;
            ctx.font = isSwapped ? 'bold 10px monospace' : 'bold 7px monospace';
            const tagWidth = ctx.measureText(tagText).width;
            const tagX = bx;
            const tagY = by + boxH + (isSwapped ? 13 : 9);

            // Tag background badge
            ctx.fillStyle = 'rgba(2, 16, 26, 0.92)';
            ctx.fillRect(tagX, tagY - (isSwapped ? 11 : 8), tagWidth + 8, isSwapped ? 14 : 10);
            ctx.strokeStyle = 'rgba(0, 240, 255, 0.6)';
            ctx.strokeRect(tagX, tagY - (isSwapped ? 11 : 8), tagWidth + 8, isSwapped ? 14 : 10);

            // Tag text
            ctx.fillStyle = '#00f0ff';
            ctx.fillText(tagText, tagX + 4, tagY);
            ctx.restore();
          }

          // ─── 4. DYNAMIC POSE TARGET LABEL (ABOVE ASTRONAUT'S HEAD) ───
          const headPt = pts[0];
          if (headPt) {
            ctx.save();
            const poseText = `[TARGET: ASTRONAUT EVA-1 | POSE TRACKED]`;
            ctx.font = isSwapped ? 'bold 10px monospace' : 'bold 7.5px monospace';
            const pW = ctx.measureText(poseText).width;
            const pX = headPt.x - pW / 2;
            const pY = Math.max(isSwapped ? 45 : 20, headPt.y - (isSwapped ? 38 : 16));

            ctx.fillStyle = 'rgba(2, 20, 12, 0.94)';
            ctx.fillRect(pX - 4, pY - (isSwapped ? 11 : 8), pW + 8, isSwapped ? 14 : 10);
            ctx.strokeStyle = 'rgba(0, 255, 153, 0.6)';
            ctx.strokeRect(pX - 4, pY - (isSwapped ? 11 : 8), pW + 8, isSwapped ? 14 : 10);

            ctx.fillStyle = '#00ff99';
            ctx.fillText(poseText, pX, pY);
            ctx.restore();
          }

          // ─── 5. FLOATING REAL-TIME VELOCITIES NEAR WRISTS ─────────────
          if (pts[15] && isSwapped) {
            ctx.save();
            ctx.font = 'bold 9px monospace';
            ctx.fillStyle = '#00ff99';
            ctx.fillText(`LH: ${kinematics.lhVel} m/s`, pts[15].x - 65, pts[15].y);
            ctx.restore();
          }
          if (pts[16] && isSwapped) {
            ctx.save();
            ctx.font = 'bold 9px monospace';
            ctx.fillStyle = '#00f0ff';
            ctx.fillText(`RH: ${kinematics.rhVel} m/s`, pts[16].x + 12, pts[16].y);
            ctx.restore();
          }

          ctx.restore();
        }
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [isSwapped]);

  return (
    <div
      id="live-astronaut-feed-container"
      style={
        isSwapped
          ? {
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              zIndex: 0,
              overflow: 'hidden',
              backgroundColor: '#020617',
              transition: 'all 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
            }
          : {
              position: 'fixed',
              right: '1rem',
              bottom: '1rem',
              width: '310px',
              height: '192px',
              zIndex: 25,
              borderRadius: '0.75rem',
              overflow: 'hidden',
              backgroundColor: 'rgba(10, 20, 30, 0.92)',
              borderColor: 'rgba(0, 240, 255, 0.35)',
              boxShadow:
                '0 20px 50px rgba(0, 0, 0, 0.85), 0 0 25px rgba(0, 240, 255, 0.15)',
              transition: 'all 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
            }
      }
      className={`${!isSwapped ? 'border backdrop-blur-xl' : ''} pointer-events-auto select-none`}
    >
      {/* ─── 1. VIDEO SOURCE ELEMENT WITH ID ─────────────────────────── */}
      <video
        id="astronaut-feed"
        ref={videoRef}
        src="/videos/astronaut_feed.mp4"
        autoPlay
        loop
        muted
        playsInline
        className="w-full h-full object-cover"
        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
      />

      {/* ─── 2. REAL-TIME CV POSE SKELETON & OBJECT TRACKING CANVAS ─── */}
      <canvas
        ref={canvasRef}
        id="astronaut-pose-canvas"
        className="absolute inset-0 w-full h-full pointer-events-none z-15"
      />

      {/* ─── 3. SUBTLE SCANNING SCANLINE (AMBIENT CABIN SCAN) ───────── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-10">
        {/* Animated Horizontal Laser Scanline */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            height: '2px',
            background: 'linear-gradient(90deg, transparent 0%, rgba(0, 240, 255, 0.8) 50%, transparent 100%)',
            boxShadow: '0 0 10px rgba(0, 240, 255, 0.6), 0 0 20px rgba(0, 240, 255, 0.3)',
            animation: 'astronautFeedScan 4s linear infinite',
          }}
        />

        {/* Ambient Grid Overlay Texture */}
        <div
          style={{
            backgroundImage:
              'linear-gradient(rgba(0, 240, 255, 0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 240, 255, 0.04) 1px, transparent 1px)',
            backgroundSize: isSwapped ? '40px 40px' : '20px 20px',
          }}
          className="absolute inset-0 opacity-40"
        />
      </div>

      {/* ─── 4. TOP STATUS BAR OVERLAY (UNIFORM 10PX MONOSPACE) ─────── */}
      <div
        style={
          isSwapped
            ? {
                position: 'absolute',
                top: '1rem',
                left: '190px',
                padding: '6px 14px',
                backgroundColor: 'rgba(2, 6, 23, 0.92)',
                border: '1px solid rgba(0, 240, 255, 0.4)',
                borderRadius: '0.5rem',
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.8), 0 0 16px rgba(0, 240, 255, 0.25)',
                zIndex: 25,
                gap: '14px',
              }
            : {
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                padding: '5px 8px',
                backgroundColor: 'rgba(2, 6, 23, 0.88)',
                borderBottom: '1px solid rgba(0, 240, 255, 0.25)',
                zIndex: 20,
              }
        }
        className="flex items-center justify-between font-mono backdrop-blur-md pointer-events-auto select-none"
      >
        {/* Left: Blinking Red Dot Indicator */}
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_#ef4444] shrink-0" />
          <span
            style={{ fontSize: isSwapped ? '10px' : '8.5px', whiteSpace: 'nowrap' }}
            className="font-mono font-bold text-red-400 tracking-[0.05em] uppercase truncate"
          >
            🔴 LIVE CAM // SPACESHIP EVA-1 STREAM
          </span>
        </div>

        {/* Right: Viewport Swap Action Button */}
        <button
          id="btn-swap-viewport"
          onClick={onToggleSwap}
          title={isSwapped ? 'Restore 3D Simulation as Main Viewport' : 'Expand Video to Main Viewport'}
          style={{
            padding: '2px 6px',
            fontSize: isSwapped ? '9.5px' : '8px',
            borderColor: 'rgba(0, 240, 255, 0.45)',
            backgroundColor: 'rgba(10, 25, 40, 0.85)',
            whiteSpace: 'nowrap',
          }}
          className="flex items-center gap-1 rounded border text-cyan-300 hover:text-white hover:border-cyan-300 hover:bg-cyan-950 transition-all font-mono font-bold uppercase tracking-[0.05em] shrink-0 cursor-pointer shadow-sm active:scale-95 ml-2"
        >
          {isSwapped ? (
            <>
              <Minimize2 className="w-3 h-3 text-[#00f0ff]" />
              <span>[⛶ RESTORE]</span>
            </>
          ) : (
            <>
              <Maximize2 className="w-2.5 h-2.5 text-[#00f0ff]" />
              <span>[⛶ SWAP / FULLSCREEN]</span>
            </>
          )}
        </button>
      </div>

      {/* ─── 5. ENVIRONMENT SCANNING GRID BADGE (LOWER-RIGHT) ───────── */}
      <div
        style={{
          position: 'absolute',
          bottom: '8px',
          right: '8px',
          padding: '2px 6px',
          backgroundColor: 'rgba(2, 6, 23, 0.85)',
          border: '1px solid rgba(0, 240, 255, 0.35)',
          fontSize: isSwapped ? '9.5px' : '8px',
          whiteSpace: 'nowrap',
          zIndex: 15,
        }}
        className="rounded font-mono font-bold text-slate-300 uppercase tracking-[0.05em] flex items-center gap-1.5 shadow-sm"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
        <span>[AMBIENT CABIN SCAN: NOMINAL]</span>
      </div>
    </div>
  );
}
