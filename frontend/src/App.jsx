import React, { useState, useRef, useEffect } from 'react';
import SpaceStationScene from './components/SpaceStationScene.tsx';
import ControlHUD from './components/ui/ControlHUD.tsx';
import LiveAstronautFeed from './components/ui/LiveAstronautFeed.tsx';
import ProtocolGraphCanvas from './components/ui/ProtocolGraphCanvas.tsx';
import { CAMERA_VIEWS } from './engine/CameraManager.jsx';
import { mocapEngine } from './engine/MocapEngine.js';

/**
 * App.jsx
 * 
 * SpaceStation Mission Telemetry & Interactive Viewport Orchestrator:
 * - 3D WebGL Space Station Simulation (Main Viewport / Minified PiP on Viewport Swap)
 * - Live Looping Astronaut Video Feed with AI HUD Tracking Overlays (PiP / Main Viewport)
 * - Transparent Cybernetic HUD & Controls
 */
export default function App() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  // Camera Preset State
  const [activeCameraView, setActiveCameraView] = useState(CAMERA_VIEWS.FRONT);

  // Viewport Swap State: Live Video Feed <-> 3D WebGL Simulation
  const [isCameraSwapped, setIsCameraSwapped] = useState(false);

  // Live Mocap & Kinematics State
  const [isLiveMocap, setIsLiveMocap] = useState(false);
  const [landmarks, setLandmarks] = useState([]);
  const [latency, setLatency] = useState(0);
  const [discoveredBones, setDiscoveredBones] = useState([]);

  // Subscribe to MediaPipe Mocap Stream
  useEffect(() => {
    const unsubscribe = mocapEngine.subscribe((lms, lat) => {
      setLandmarks(lms);
      setLatency(lat);
    });

    return () => {
      unsubscribe();
      mocapEngine.stopCamera();
    };
  }, []);

  const handleToggleViewportSwap = () => {
    setIsCameraSwapped((prev) => !prev);
  };

  return (
    <main className="w-screen h-screen relative overflow-hidden bg-slate-950 select-none">
      {/* 3D WebGL Space Station Simulation */}
      <SpaceStationScene
        activeCameraView={activeCameraView}
        onBonesDiscovered={setDiscoveredBones}
        isSwapped={isCameraSwapped}
        onToggleSwap={handleToggleViewportSwap}
      />

      {/* Live Looping Video Feed with AI Object/Pose Tracking Overlays */}
      <LiveAstronautFeed
        isSwapped={isCameraSwapped}
        onToggleSwap={handleToggleViewportSwap}
      />

      {/* Cybernetic HUD Interface with Subtitle Overlay & Utility Sidebar */}
      <ControlHUD
        activeCameraView={activeCameraView}
        onSelectCameraView={setActiveCameraView}
        isLiveMocap={isLiveMocap}
        videoRef={videoRef}
        canvasRef={canvasRef}
        latency={latency}
        landmarks={landmarks}
      />

      {/* Fullscreen 3D Interactive JSON-LD Runtime Node Graph Simulation Viewport */}
      <ProtocolGraphCanvas />
    </main>
  );
}


