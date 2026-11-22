// src/game/engine/FightCamera2D.ts
// DEDICATED 2D FIGHTING GAME CAMERA SYSTEM

import { WorldCoordinateSystem } from './WorldCoordinateSystem';

export interface CameraState2D {
  x: number;
  y: number;
  zoom: number;
  shakeX: number;
  shakeY: number;
}

export class FightCamera2D {
  public x = 1200;
  public y = WorldCoordinateSystem.DEFAULT_CAM_Y;
  public zoom = 1.0;

  // Clamping limits
  public minX = 750;
  public maxX = 1650;
  public minY = 420;
  public maxY = 550;

  // Zoom limits
  public minZoom = 0.82;
  public maxZoom = 1.18;

  // Screen Shake
  private shakeTimer = 0;
  private shakeIntensity = 0;
  public shakeX = 0;
  public shakeY = 0;

  constructor(startX = 1200, startY = WorldCoordinateSystem.DEFAULT_CAM_Y) {
    this.x = startX;
    this.y = startY;
  }

  /**
   * Smoothly tracks midpoint between two fighters, applies bounding constraints,
   * dynamically adjusts zoom according to distance, and decays screen shake.
   */
  public update(
    dt: number,
    p1X: number,
    p1Y: number,
    p2X: number,
    p2Y: number,
    viewportW: number,
    viewportH: number
  ): void {
    // 1. Calculate midpoint
    const midX = (p1X + p2X) * 0.5;
    const midY = (p1Y + p2Y) * 0.5 - 35; // Slight upward bias to capture heads and jump apexes

    // 2. Dynamic Zoom Calculation based on fighter separation and viewport aspect
    const dist = Math.abs(p1X - p2X);
    const aspect = viewportW / Math.max(1, viewportH);
    const aspectMultiplier = aspect < 1.2 ? 0.88 : 1.0; // zoom out slightly on narrow/portrait screens

    const desiredZoom = Math.max(
      this.minZoom,
      Math.min(this.maxZoom, (960 / (dist + 380)) * aspectMultiplier)
    );

    // 3. Smooth Exponential Interpolation
    const lerpRate = 1 - Math.exp(-9.0 * dt);
    const targetX = Math.max(this.minX, Math.min(this.maxX, midX));
    const targetY = Math.max(this.minY, Math.min(this.maxY, midY));

    this.x += (targetX - this.x) * lerpRate;
    this.y += (targetY - this.y) * (lerpRate * 0.8);
    this.zoom += (desiredZoom - this.zoom) * (lerpRate * 0.7);

    // 4. Screen Shake Processing
    if (this.shakeTimer > 0) {
      this.shakeTimer -= dt;
      const progress = Math.max(0, this.shakeTimer / 0.3);
      this.shakeX = (Math.random() - 0.5) * this.shakeIntensity * 2 * progress;
      this.shakeY = (Math.random() - 0.5) * this.shakeIntensity * 2 * progress;
      if (this.shakeTimer <= 0) {
        this.shakeIntensity = 0;
        this.shakeX = 0;
        this.shakeY = 0;
      }
    } else {
      this.shakeX = 0;
      this.shakeY = 0;
    }
  }

  /**
   * Triggers an authentic fighting-game camera impact shake.
   */
  public addShake(intensity: number, duration = 0.22): void {
    this.shakeIntensity = intensity;
    this.shakeTimer = duration;
  }

  public getState(): CameraState2D {
    return {
      x: this.x,
      y: this.y,
      zoom: this.zoom,
      shakeX: this.shakeX,
      shakeY: this.shakeY,
    };
  }
}
