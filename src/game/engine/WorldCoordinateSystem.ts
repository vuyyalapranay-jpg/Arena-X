// src/game/engine/WorldCoordinateSystem.ts
// UNIFIED 2D WORLD COORDINATE SYSTEM FOR ARENA X

export interface Point2D {
  x: number;
  y: number;
}

export interface GroundContact {
  worldX: number;
  groundY: number;
  jumpOffsetY: number;
  facing: 1 | -1;
  width: number;
  height: number;
  bottomCenterAnchor: Point2D;
}

export class WorldCoordinateSystem {
  // Stage Bounds
  public static readonly STAGE_WIDTH = 2400;
  public static readonly STAGE_HEIGHT = 1200;
  public static readonly STAGE_BOUND_LEFT = 260;
  public static readonly STAGE_BOUND_RIGHT = 2140;

  // Ground Reference
  public static readonly GROUND_Y = 560; // Exact arena floor plane in world coordinates
  public static readonly DEFAULT_CAM_Y = 490;

  /**
   * Transforms a point from world coordinates to viewport screen coordinates.
   */
  public static worldToScreen(
    worldX: number,
    worldY: number,
    camX: number,
    camY: number,
    zoom: number,
    viewportW: number,
    viewportH: number
  ): Point2D {
    return {
      x: (worldX - camX) * zoom + viewportW * 0.5,
      y: (worldY - camY) * zoom + viewportH * 0.5,
    };
  }

  /**
   * Transforms a point from viewport screen coordinates back to world coordinates.
   */
  public static screenToWorld(
    screenX: number,
    screenY: number,
    camX: number,
    camY: number,
    zoom: number,
    viewportW: number,
    viewportH: number
  ): Point2D {
    return {
      x: (screenX - viewportW * 0.5) / zoom + camX,
      y: (screenY - viewportH * 0.5) / zoom + camY,
    };
  }

  /**
   * Clamps an entity's horizontal position within the arena fighting boundaries.
   */
  public static clampToStage(x: number, margin = 60): number {
    return Math.max(
      this.STAGE_BOUND_LEFT + margin,
      Math.min(this.STAGE_BOUND_RIGHT - margin, x)
    );
  }
}
