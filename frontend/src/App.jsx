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
  const [activeCameraView, setActiveCameraView] = useState(CAMERA_VIEWS.WIDE);

  // Modular System Dashboard State
  const [activeModule, setActiveModule] = useState('CORE');

  // Phase 1 (Group A) USP States
  const [usp1Active, setUsp1Active] = useState(false); // Payload-Rack Reference Frame
  const [usp2Active, setUsp2Active] = useState(false); // Volumetric Workspace Anchor
  const [usp3Active, setUsp3Active] = useState(false); // Adaptive ROI Controller

  // Phase 2 (Group B) USP States
  const [usp4Active, setUsp4Active] = useState(false);
  const [usp5Active, setUsp5Active] = useState(false);
  const [usp6Active, setUsp6Active] = useState(false);
  const [usp7Active, setUsp7Active] = useState(false);
  const [usp8Active, setUsp8Active] = useState(false);
  const [usp9Active, setUsp9Active] = useState(false);
  const [usp10Active, setUsp10Active] = useState(false);
  const [usp11Active, setUsp11Active] = useState(false);
  // Phase 3 (Group C) USP States
  const [usp12Active, setUsp12Active] = useState(false);
  const [usp13Active, setUsp13Active] = useState(false);
  const [usp14Active, setUsp14Active] = useState(false);
  const [usp23Active, setUsp23Active] = useState(false);
  const [usp24Active, setUsp24Active] = useState(false);

  // Phase 4 (Group D) USP States
  const [usp15Active, setUsp15Active] = useState(false);
  const [usp16Active, setUsp16Active] = useState(false);
  const [usp17Active, setUsp17Active] = useState(false);
  const [usp18Active, setUsp18Active] = useState(false);
  const [usp19Active, setUsp19Active] = useState(false);
  const [usp20Active, setUsp20Active] = useState(false);
  const [usp21Active, setUsp21Active] = useState(false);
  const [usp22Active, setUsp22Active] = useState(false);
  const [usp25Active, setUsp25Active] = useState(false);

  // Live Mocap & Kinematics State
  const [isLiveMocap, setIsLiveMocap] = useState(false);
  const [landmarks, setLandmarks] = useState([]);
  const [latency, setLatency] = useState(0);
  const [lerpFactor, setLerpFactor] = useState(0.22);
  const [zeroGIntensity, setZeroGIntensity] = useState(1.0);
  const [discoveredBones, setDiscoveredBones] = useState([]);

  // WASD Locomotion System with Central Aisle Corridor Bounds
  const { keysRef, positionRef, currentRotationRef, updateLocomotion } = useLocomotion({
    initialPosition: [0, 0, 0],
    corridorBounds: { minX: -0.8, maxX: 0.8, minZ: -14.0, maxZ: 14.0 },
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

      const eState = interactionEngine.getState();
      let nextState;
      
      if (eState.isNavigating || eState.isInteracting) {
        const navResult = interactionEngine.update(delta, positionRef.current.clone(), currentRotationRef.current);
        if (navResult) {
          positionRef.current.copy(navResult.position);
          currentRotationRef.current = navResult.rotationY;
          nextState = navResult;
        } else {
          nextState = updateLocomotion(delta);
        }
      } else {
        nextState = updateLocomotion(delta);
      }

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
        usp1Active={usp1Active}
        usp2Active={usp2Active}
        usp4Active={usp4Active}
        usp5Active={usp5Active}
        usp6Active={usp6Active}
        usp7Active={usp7Active}
        usp8Active={usp8Active}
        usp9Active={usp9Active}
        usp10Active={usp10Active}
        usp11Active={usp11Active}
        usp12Active={usp12Active}
        usp19Active={usp19Active}
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
        activeModule={activeModule}
        onSelectModule={setActiveModule}
        usp1Active={usp1Active}
        onToggleUsp1={() => setUsp1Active(!usp1Active)}
        usp2Active={usp2Active}
        onToggleUsp2={() => setUsp2Active(!usp2Active)}
        usp3Active={usp3Active}
        onToggleUsp3={() => setUsp3Active(!usp3Active)}
        usp4Active={usp4Active}
        onToggleUsp4={() => setUsp4Active(!usp4Active)}
        usp5Active={usp5Active}
        onToggleUsp5={() => setUsp5Active(!usp5Active)}
        usp6Active={usp6Active}
        onToggleUsp6={() => setUsp6Active(!usp6Active)}
        usp7Active={usp7Active}
        onToggleUsp7={() => setUsp7Active(!usp7Active)}
        usp8Active={usp8Active}
        onToggleUsp8={() => setUsp8Active(!usp8Active)}
        usp9Active={usp9Active}
        onToggleUsp9={() => setUsp9Active(!usp9Active)}
        usp10Active={usp10Active}
        onToggleUsp10={() => setUsp10Active(!usp10Active)}
        usp11Active={usp11Active}
        onToggleUsp11={() => setUsp11Active(!usp11Active)}
        usp12Active={usp12Active}
        onToggleUsp12={() => setUsp12Active(!usp12Active)}
        usp13Active={usp13Active}
        onToggleUsp13={() => setUsp13Active(!usp13Active)}
        usp14Active={usp14Active}
        onToggleUsp14={() => setUsp14Active(!usp14Active)}
        usp23Active={usp23Active}
        onToggleUsp23={() => setUsp23Active(!usp23Active)}
        usp24Active={usp24Active}
        onToggleUsp24={() => setUsp24Active(!usp24Active)}
        usp15Active={usp15Active}
        onToggleUsp15={() => setUsp15Active(!usp15Active)}
        usp16Active={usp16Active}
        onToggleUsp16={() => setUsp16Active(!usp16Active)}
        usp17Active={usp17Active}
        onToggleUsp17={() => setUsp17Active(!usp17Active)}
        usp18Active={usp18Active}
        onToggleUsp18={() => setUsp18Active(!usp18Active)}
        usp19Active={usp19Active}
        onToggleUsp19={() => setUsp19Active(!usp19Active)}
        usp20Active={usp20Active}
        onToggleUsp20={() => setUsp20Active(!usp20Active)}
        usp21Active={usp21Active}
        onToggleUsp21={() => setUsp21Active(!usp21Active)}
        usp22Active={usp22Active}
        onToggleUsp22={() => setUsp22Active(!usp22Active)}
        usp25Active={usp25Active}
        onToggleUsp25={() => setUsp25Active(!usp25Active)}
      />
    </main>
  );
}
