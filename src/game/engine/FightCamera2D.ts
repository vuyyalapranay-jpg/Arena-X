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

export interface VisibleWorldBounds2D {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

export class FightCamera2D {
  public x = 1200;
  public y = WorldCoordinateSystem.DEFAULT_CAM_Y;
  public zoom = 1.0;

  // Zoom limits
  public minZoom = 0.45;
  public maxZoom = 1.08;

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
   * Smoothly tracks midpoint between two fighters, guarantees comfortable side margins,
   * dynamically adjusts zoom according to distance and vertical framing,
   * keeps the ground horizon rock-stable, and decays screen shake.
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

    // 2. Dynamic Zoom Calculation with Guaranteed Side Margins
    // Both fighters must have generous breathing room (paddingX on both sides)
    const paddingX = 240; // World coordinates margin per side
    const dist = Math.abs(p1X - p2X);
    const requiredWorldW = Math.max(760, dist + paddingX * 2);

    // Vertical framing to ensure heads and ground shadows remain fully in frame
    const highestFighterY = Math.min(p1Y - 240, p2Y - 240) - 40;
    const lowestFighterY = WorldCoordinateSystem.GROUND_Y + 50;
    const requiredWorldH = Math.max(500, lowestFighterY - highestFighterY);

    const zoomX = viewportW / requiredWorldW;
    const zoomY = viewportH / requiredWorldH;

    const desiredZoom = Math.max(
      this.minZoom,
      Math.min(this.maxZoom, Math.min(zoomX, zoomY))
    );

    // 3. Stage Bounds Clamping for Camera X
    const halfVisibleW = (viewportW * 0.5) / desiredZoom;
    const stageLeft = WorldCoordinateSystem.STAGE_BOUND_LEFT;
    const stageRight = WorldCoordinateSystem.STAGE_BOUND_RIGHT;

    let targetX = midX;
    if (halfVisibleW * 2 >= (stageRight - stageLeft)) {
      // If the stage fully fits within the visible viewport, lock camera to stage center
      targetX = (stageLeft + stageRight) * 0.5;
    } else {
      const minCamX = stageLeft + halfVisibleW;
      const maxCamX = stageRight - halfVisibleW;
      targetX = Math.max(minCamX, Math.min(maxCamX, midX));
    }

    // 4. Stable Fighting Horizon (Camera Y)
    // The ground plane (y = 560) is held stable near the bottom third (~73% viewport height)
    const targetGroundRatio = 0.73;
    const baseY = WorldCoordinateSystem.GROUND_Y - (viewportH * (targetGroundRatio - 0.5)) / desiredZoom;

    // Subtle aerial follow if fighters jump or get juggled
    const p1Air = Math.min(0, p1Y - WorldCoordinateSystem.GROUND_Y);
    const p2Air = Math.min(0, p2Y - WorldCoordinateSystem.GROUND_Y);
    const highestAir = Math.min(p1Air, p2Air);
    const jumpFollow = highestAir * 0.22; // subtle 22% upward follow
    const targetY = baseY + jumpFollow;

    // 5. Smooth Exponential Interpolation
    const lerpRate = 1 - Math.exp(-10.0 * dt);
    const zoomLerpRate = 1 - Math.exp(-8.0 * dt);

    this.x += (targetX - this.x) * lerpRate;
    this.y += (targetY - this.y) * lerpRate;
    this.zoom += (desiredZoom - this.zoom) * zoomLerpRate;

    // 6. Screen Shake Processing
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
   * Computes the visible bounding rectangle in world coordinates.
   */
  public getVisibleWorldBounds(viewportW: number, viewportH: number): VisibleWorldBounds2D {
    const halfW = (viewportW * 0.5) / this.zoom;
    const halfH = (viewportH * 0.5) / this.zoom;
    return {
      minX: this.x - halfW,
      maxX: this.x + halfW,
      minY: this.y - halfH,
      maxY: this.y + halfH,
    };
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
