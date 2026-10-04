import React, { useState, useRef, useEffect } from 'react';
import SpaceStationScene from './components/SpaceStationScene.tsx';
import ControlHUD from './components/ui/ControlHUD.tsx';
import { CAMERA_VIEWS } from './engine/CameraManager.jsx';
import { mocapEngine } from './engine/MocapEngine.js';

/**
 * App.jsx
 * 
 * SpaceBuddy Production Aerospace Simulation Orchestrator:
 * - Decoupled R3F SpaceStationScene with modular assets:
 *   1. SpaceshipCorridor (Static interior hull shell)
 *   2. AstronautAvatar (Rigged character driven by useZeroGKinematics & useMissionTimeline)
 *   3. WorkstationModules (Dispersed 10m-20m apart, ergonomically scaled with child hardware)
 *   4. StorageBayBarrels (Separately loaded at far-end storage bay [-1.85, 0, -16.0])
 *   5. QuantumReactorBay (Separately loaded at [2.15, 0.9, -16.5])
 *   6. SatelliteBulkheadDisplay (Central bulkhead radar monitor & 3D Earth Hologram)
 * - Clean Viewport:
 *   - Left side completely transparent (no left control panel)
 *   - Top utility rail with camera preset buttons
 *   - Bottom-center Subtitle HUD Overlay
 *   - Right sidebar with empty expansion bay + bottom CAM STANDBY
 */
export default function App() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  // Camera Preset State
  const [activeCameraView, setActiveCameraView] = useState(CAMERA_VIEWS.FRONT);

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

  return (
    <main className="w-screen h-screen relative overflow-hidden bg-slate-950 select-none">
      {/* Decoupled 3D WebGL Space Station Simulation */}
      <SpaceStationScene
        activeCameraView={activeCameraView}
        onBonesDiscovered={setDiscoveredBones}
      />

      {/* Cybernetic HUD Interface with Subtitle Overlay & Transparent Left Area */}
      <ControlHUD
        activeCameraView={activeCameraView}
        onSelectCameraView={setActiveCameraView}
        isLiveMocap={isLiveMocap}
        videoRef={videoRef}
        canvasRef={canvasRef}
        latency={latency}
        landmarks={landmarks}
      />
    </main>
  );
}

