// src/game/engine/Renderer2D.ts
// MODULAR CENTRALIZED 2D CANVAS RENDERING ENGINE (10-LAYER PRESENTATION)

import { FightCamera2D } from './FightCamera2D';
import { Stage2D } from '../stages/Stage2D';
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
    arena: Stage2D | ParallaxArena2D,
    fighterP1: AnimeFighter2D,
    fighterP2: AnimeFighter2D,
    projectiles: Projectile2D[],
    vfx: VFXManager2D,
    showHitboxes = false
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

    // ==============================================================
    // DEBUG OVERLAY: HITBOXES & HURTBOXES
    // ==============================================================
    if (showHitboxes) {
      this.renderDebugCollision(ctx, fighterP1, fighterP2);
    }

    ctx.restore();

    // ==============================================================
    // LAYER 10: HUD & SCREEN-SPACE OVERLAYS ARE HANDLED BY REACT UI
    // ==============================================================
  }

  private renderDebugCollision(
    ctx: CanvasRenderingContext2D,
    p1: AnimeFighter2D,
    p2: AnimeFighter2D
  ): void {
    const fighters = [p1, p2];

    for (const f of fighters) {
      // 1. Hurtbox (Green/Cyan rectangle)
      const hurt = f.getHurtbox();
      ctx.save();
      ctx.fillStyle = hurt.isInvulnerable
        ? 'rgba(255, 255, 255, 0.35)'
        : 'rgba(0, 255, 120, 0.25)';
      ctx.strokeStyle = hurt.isInvulnerable ? '#ffffff' : '#00ff78';
      ctx.lineWidth = 2;
      ctx.fillRect(hurt.x, hurt.y, hurt.width, hurt.height);
      ctx.strokeRect(hurt.x, hurt.y, hurt.width, hurt.height);

      ctx.fillStyle = '#ffffff';
      ctx.font = '10px monospace';
      ctx.fillText(
        `${f.name} [${f.state}]${hurt.isInvulnerable ? ' (INVULNERABLE)' : ''}`,
        hurt.x,
        hurt.y - 6
      );
      ctx.restore();

      // 2. Active Hitbox (Red circle)
      const hit = f.getActiveHitbox();
      if (hit) {
        ctx.save();
        ctx.fillStyle = 'rgba(255, 30, 60, 0.35)';
        ctx.strokeStyle = '#ff1e3c';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(hit.x, hit.y, hit.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Center crosshair
        ctx.beginPath();
        ctx.moveTo(hit.x - 8, hit.y);
        ctx.lineTo(hit.x + 8, hit.y);
        ctx.moveTo(hit.x, hit.y - 8);
        ctx.lineTo(hit.x, hit.y + 8);
        ctx.stroke();

        ctx.fillStyle = '#ffff00';
        ctx.font = 'bold 11px monospace';
        ctx.fillText(`${hit.type} [${hit.height}]`, hit.x - 24, hit.y - hit.radius - 6);
        ctx.restore();
      }
    }
  }
}
