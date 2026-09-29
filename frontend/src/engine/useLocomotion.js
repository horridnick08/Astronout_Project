import { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';

/**
 * useLocomotion
 * 
 * Provides keyboard input processing (WASD / Arrows / Shift),
 * smooth position updates, and heading angle calculation within
 * spaceship corridor boundaries.
 */
export function useLocomotion({
  initialPosition = [0, 0, 0],
  corridorBounds = { minX: -2.2, maxX: 2.2, minZ: -14.0, maxZ: 14.0 },
  walkSpeed = 1.8,
  runSpeed = 3.2,
  turnSpeed = 8.0,
  enabled = true
} = {}) {
  const keysRef = useRef({
    forward: false,
    backward: false,
    left: false,
    right: false,
    sprint: false
  });

  const positionRef = useRef(new THREE.Vector3(...initialPosition));
  const currentRotationRef = useRef(0);
  const targetRotationRef = useRef(0);

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e) => {
      // Don't intercept if typing in an input
      if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;

      switch (e.code) {
        case 'KeyW':
        case 'ArrowUp':
          keysRef.current.forward = true;
          break;
        case 'KeyS':
        case 'ArrowDown':
          keysRef.current.backward = true;
          break;
        case 'KeyA':
        case 'ArrowLeft':
          keysRef.current.left = true;
          break;
        case 'KeyD':
        case 'ArrowRight':
          keysRef.current.right = true;
          break;
        case 'ShiftLeft':
        case 'ShiftRight':
          keysRef.current.sprint = true;
          break;
        default:
          break;
      }
    };

    const handleKeyUp = (e) => {
      switch (e.code) {
        case 'KeyW':
        case 'ArrowUp':
          keysRef.current.forward = false;
          break;
        case 'KeyS':
        case 'ArrowDown':
          keysRef.current.backward = false;
          break;
        case 'KeyA':
        case 'ArrowLeft':
          keysRef.current.left = false;
          break;
        case 'KeyD':
        case 'ArrowRight':
          keysRef.current.right = false;
          break;
        case 'ShiftLeft':
        case 'ShiftRight':
          keysRef.current.sprint = false;
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [enabled]);

  /**
   * Called every frame from useFrame(state, delta)
   */
  const updateLocomotion = (delta) => {
    const keys = keysRef.current;
    let moveX = 0;
    let moveZ = 0;

    if (keys.forward) moveZ -= 1;
    if (keys.backward) moveZ += 1;
    if (keys.left) moveX -= 1;
    if (keys.right) moveX += 1;

    const isMoving = moveX !== 0 || moveZ !== 0;
    const isSprinting = isMoving && keys.sprint;
    const speed = isMoving ? (isSprinting ? runSpeed : walkSpeed) : 0;

    if (isMoving) {
      // Normalize direction vector
      const len = Math.hypot(moveX, moveZ);
      const dirX = moveX / len;
      const dirZ = moveZ / len;

      // Update position
      const nextX = positionRef.current.x + dirX * speed * delta;
      const nextZ = positionRef.current.z + dirZ * speed * delta;

      // Clamp inside corridor boundaries
      positionRef.current.x = Math.max(corridorBounds.minX, Math.min(corridorBounds.maxX, nextX));
      positionRef.current.z = Math.max(corridorBounds.minZ, Math.min(corridorBounds.maxZ, nextZ));

      // Calculate target yaw angle: facing direction of movement
      targetRotationRef.current = Math.atan2(dirX, dirZ) + Math.PI; // Face forward
    }

    // Smooth rotation towards target heading
    let diff = targetRotationRef.current - currentRotationRef.current;
    // Shortest angular distance
    while (diff < -Math.PI) diff += Math.PI * 2;
    while (diff > Math.PI) diff -= Math.PI * 2;
    currentRotationRef.current += diff * Math.min(1.0, turnSpeed * delta);

    return {
      position: positionRef.current,
      rotationY: currentRotationRef.current,
      isMoving,
      isSprinting,
      speed
    };
  };

  return {
    keysRef,
    positionRef,
    currentRotationRef,
    updateLocomotion
  };
}
