// src/game/camera/FightCamera.ts
import * as THREE from 'three';
import { GAME_CONFIG } from '../../config/gameConfig';

export class FightCamera {
  public camera: THREE.PerspectiveCamera;
  private currentTarget = new THREE.Vector3(0, GAME_CONFIG.CAMERA.BASE_HEIGHT, 0);
  private currentPosition = new THREE.Vector3(0, GAME_CONFIG.CAMERA.BASE_HEIGHT, GAME_CONFIG.CAMERA.BASE_DISTANCE);

  // Screen shake
  private shakeIntensity = 0;
  private shakeTimer = 0;
  private shakeOffset = new THREE.Vector3(0, 0, 0);

  constructor(aspectRatio: number) {
    this.camera = new THREE.PerspectiveCamera(
      GAME_CONFIG.CAMERA.FOV,
      aspectRatio,
      0.1,
      100
    );
    this.camera.position.copy(this.currentPosition);
    this.camera.lookAt(this.currentTarget);
  }

  public update(deltaTime: number, p1Pos: THREE.Vector3, p2Pos: THREE.Vector3): void {
    // 1. Calculate midpoint between fighters
    const midpointX = (p1Pos.x + p2Pos.x) / 2;
    const midpointY = Math.max(0, (p1Pos.y + p2Pos.y) / 2);
    const fighterDistance = Math.abs(p1Pos.x - p2Pos.x);

    // 2. Clamp target X within arena bounds
    const clampedMidpointX = THREE.MathUtils.clamp(
      midpointX,
      -GAME_CONFIG.CAMERA.MAX_X_OFFSET,
      GAME_CONFIG.CAMERA.MAX_X_OFFSET
    );

    // 3. Dynamic distance (Zoom in when close, Zoom out when far)
    const targetDistance = THREE.MathUtils.clamp(
      GAME_CONFIG.CAMERA.BASE_DISTANCE + (fighterDistance - 4.0) * 0.42,
      GAME_CONFIG.CAMERA.MIN_DISTANCE,
      GAME_CONFIG.CAMERA.MAX_DISTANCE
    );

    const targetHeight = GAME_CONFIG.CAMERA.BASE_HEIGHT + midpointY * 0.35;

    // 4. Smooth lerping towards target
    const smoothFactor = 1 - Math.exp(-8.0 * deltaTime);
    this.currentPosition.x = THREE.MathUtils.lerp(this.currentPosition.x, clampedMidpointX, smoothFactor);
    this.currentPosition.y = THREE.MathUtils.lerp(this.currentPosition.y, targetHeight, smoothFactor);
    this.currentPosition.z = THREE.MathUtils.lerp(this.currentPosition.z, targetDistance, smoothFactor);

    this.currentTarget.x = THREE.MathUtils.lerp(this.currentTarget.x, clampedMidpointX, smoothFactor);
    this.currentTarget.y = THREE.MathUtils.lerp(this.currentTarget.y, targetHeight - 0.2, smoothFactor);
    this.currentTarget.z = GAME_CONFIG.ARENA.FIGHT_PLANE_Z;

    // 5. Screen shake computation
    if (this.shakeTimer > 0) {
      this.shakeTimer -= deltaTime;
      const decay = Math.max(0, this.shakeTimer / 0.2);
      this.shakeOffset.set(
        (Math.random() - 0.5) * 2 * this.shakeIntensity * decay,
        (Math.random() - 0.5) * 2 * this.shakeIntensity * decay,
        0
      );
    } else {
      this.shakeOffset.set(0, 0, 0);
    }

    // Apply final position + shake
    this.camera.position.copy(this.currentPosition).add(this.shakeOffset);
    this.camera.lookAt(this.currentTarget);
  }

  public addScreenShake(intensity = 0.2, duration = 0.15): void {
    this.shakeIntensity = intensity;
    this.shakeTimer = duration;
  }

  public setAspect(aspect: number): void {
    this.camera.aspect = aspect;
    this.camera.updateProjectionMatrix();
  }
}
