// src/game/engine/Renderer2D.ts
// MODULAR CENTRALIZED 2D CANVAS RENDERING ENGINE (10-LAYER PRESENTATION)

import { FightCamera2D } from './FightCamera2D';
import { ParallaxArena2D } from '../2d/ParallaxArena2D';
import { AnimeFighter2D } from '../2d/AnimeFighter2D';
import { Projectile2D } from '../2d/Projectile2D';
import { VFXManager2D } from '../2d/VFXManager2D';

export class Renderer2D {
  private ctx: CanvasRenderingContext2D;
  private canvas: HTMLCanvasElement;
  private camera: FightCamera2D;

  constructor(
    canvas: HTMLCanvasElement,
    ctx: CanvasRenderingContext2D,
    camera: FightCamera2D
  ) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.camera = camera;
  }

  /**
   * Executes the strict 10-layer 2.5D visual presentation pipeline.
   */
  public render(
    viewportW: number,
    viewportH: number,
    arena: ParallaxArena2D,
    fighterP1: AnimeFighter2D,
    fighterP2: AnimeFighter2D,
    projectiles: Projectile2D[],
    vfx: VFXManager2D
  ): void {
    const ctx = this.ctx;
    const cam = this.camera;

    // ==============================================================
    // LAYER 1: SKY (FULLSCREEN SCREEN-SPACE MIDNIGHT ATMOSPHERE)
    // ==============================================================
    arena.renderScreenBackdrop(ctx, viewportW, viewportH);

    ctx.save();

    // ==============================================================
    // CAMERA TRANSFORMATION MATRIX (WORLD COORDINATES)
    // ==============================================================
    ctx.translate(viewportW * 0.5 + cam.shakeX, viewportH * 0.5 + cam.shakeY);
    ctx.scale(cam.zoom, cam.zoom);
    ctx.translate(-cam.x, -cam.y);

    // ==============================================================
    // LAYERS 2-6: ENVIRONMENTAL STAGE & ARENA FLOOR
    // Layer 2: Distant scenery (Moon, distant peaks)
    // Layer 3: Pagoda architecture & temple roofs
    // Layer 4: Midground lanterns & sakura groves
    // Layer 5: Fighting arena stone floor (locked strictly at worldY = 560)
    // Layer 6: Center "ARENA X" battle emblem & floor markings
    // ==============================================================
    arena.renderBackground(ctx, cam.x, cam.y, cam.zoom, viewportW, viewportH);

    // ==============================================================
    // LAYER 7: GROUND SHADOWS (DECOUPLED AT GROUND PLANE groundY = 560)
    // ==============================================================
    fighterP1.renderShadow(ctx);
    fighterP2.renderShadow(ctx);

    // ==============================================================
    // LAYER 8: CHARACTERS (ANIME FIGHTERS GROUNDED AT WORLD groundY + jumpOffsetY)
    // ==============================================================
    fighterP1.render(ctx);
    fighterP2.render(ctx);

    // Render in-flight energy projectiles
    for (const p of projectiles) {
      p.render(ctx);
    }

    // ==============================================================
    // LAYER 9: FOREGROUND PARTICLES & OBJECTS (SAKURA PETALS & FRAMING EAVES)
    // ==============================================================
    vfx.render(ctx);
    arena.renderForeground(ctx, cam.x, cam.y);

    ctx.restore();

    // ==============================================================
    // LAYER 10: HUD & SCREEN-SPACE OVERLAYS ARE HANDLED BY REACT UI (FightHUD.tsx)
    // ==============================================================
  }
}
