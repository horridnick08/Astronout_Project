import React, { useState, useRef, useEffect } from 'react';
import Scene3D from './components/Scene3D.jsx';
import ControlHUD from './components/ui/ControlHUD.jsx';
import { CAMERA_VIEWS } from './engine/CameraManager.jsx';
import { mocapEngine } from './engine/MocapEngine.js';
import { interactionEngine } from './engine/InteractionEngine.js';
import { useLocomotion } from './engine/useLocomotion.js';
import * as THREE from 'three';

/**
 * App
 * 
 * Root Orchestrator:
 * - Coordinates Locomotion state, Camera Manager presets, and Live Mocap pipeline.
 * - Renders Decoupled 3D Scene3D Canvas and 2D Cybernetic ControlHUD Interface.
 */
export default function App() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  // High-End Camera Preset State
  const [activeCameraView, setActiveCameraView] = useState(CAMERA_VIEWS.FRONT);

  // Live Mocap & Kinematics State
  const [isLiveMocap, setIsLiveMocap] = useState(false);
  const [landmarks, setLandmarks] = useState([]);
  const [latency, setLatency] = useState(0);
  const [lerpFactor, setLerpFactor] = useState(0.22);
  const [zeroGIntensity, setZeroGIntensity] = useState(1.0);
  const [discoveredBones, setDiscoveredBones] = useState([]);

  // WASD Locomotion System with Corridor Bounds
  const { keysRef, positionRef, currentRotationRef, updateLocomotion } = useLocomotion({
    initialPosition: [0, 0, 0],
    corridorBounds: { minX: -2.2, maxX: 2.2, minZ: -14.0, maxZ: 14.0 },
    walkSpeed: 1.8,
    runSpeed: 3.2
  });

  const [locomotionState, setLocomotionState] = useState({
    position: new THREE.Vector3(0, 0, 0),
    rotationY: 0,
    isMoving: false,
    speed: 0
  });

  // Track key press state for UI HUD feedback
  const [keysPressed, setKeysPressed] = useState({
    forward: false,
    backward: false,
    left: false,
    right: false
  });

  // Keep keysPressed synchronized with keyboard events & cancel automated waypoint on manual input
  useEffect(() => {
    const handleKeyChange = () => {
      setKeysPressed({ ...keysRef.current });
      const k = keysRef.current;
      if (k.forward || k.backward || k.left || k.right) {
        if (interactionEngine.isNavigating || interactionEngine.isInteracting) {
          interactionEngine.cancelAction();
        }
      }
    };

    window.addEventListener('keydown', handleKeyChange);
    window.addEventListener('keyup', handleKeyChange);
    return () => {
      window.removeEventListener('keydown', handleKeyChange);
      window.removeEventListener('keyup', handleKeyChange);
    };
  }, [keysRef]);

  // Animation frame loop for locomotion updates in React state
  useEffect(() => {
    let animId;
    let lastTime = performance.now();

    const loop = (currentTime) => {
      const delta = Math.min((currentTime - lastTime) / 1000, 0.1);
      lastTime = currentTime;

      const nextState = updateLocomotion(delta);
      setLocomotionState({
        position: nextState.position.clone(),
        rotationY: nextState.rotationY,
        isMoving: nextState.isMoving,
        speed: nextState.speed
      });

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [updateLocomotion]);

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

  // Handle Live Webcam Toggle
  const handleToggleLiveMocap = async () => {
    if (isLiveMocap) {
      mocapEngine.stopCamera();
      setIsLiveMocap(false);
      setLandmarks([]);
    } else {
      if (videoRef.current) {
        const success = await mocapEngine.startCamera(videoRef.current);
        if (success) {
          setIsLiveMocap(true);
        }
      }
    }
  };

  return (
    <main className="w-screen h-screen relative overflow-hidden bg-slate-950 select-none">
      {/* Decoupled 3D WebGL Scene */}
      <Scene3D
        activeCameraView={activeCameraView}
        locomotion={locomotionState}
        landmarks={landmarks}
        isLiveMocap={isLiveMocap}
        lerpFactor={lerpFactor}
        zeroGIntensity={zeroGIntensity}
        onBonesDiscovered={setDiscoveredBones}
      />

      {/* Cybernetic HUD Interface */}
      <ControlHUD
        activeCameraView={activeCameraView}
        onSelectCameraView={setActiveCameraView}
        isLiveMocap={isLiveMocap}
        onToggleLiveMocap={handleToggleLiveMocap}
        lerpFactor={lerpFactor}
        onChangeLerpFactor={setLerpFactor}
        zeroGIntensity={zeroGIntensity}
        onChangeZeroGIntensity={setZeroGIntensity}
        locomotion={locomotionState}
        keysPressed={keysPressed}
        discoveredBones={discoveredBones}
        videoRef={videoRef}
        canvasRef={canvasRef}
        latency={latency}
        landmarks={landmarks}
      />
    </main>
  );
}
