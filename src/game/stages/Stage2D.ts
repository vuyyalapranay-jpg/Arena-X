// src/game/stages/Stage2D.ts
// COMPREHENSIVE 2.5D STAGE RENDERING SYSTEM FOR ARENA X

import { STAGES, StageDefinition, StageId } from './StageConfig';
import { StageParticleSystem } from './StageParticleSystem';
import { WorldCoordinateSystem } from '../engine/WorldCoordinateSystem';

export class Stage2D {
  public currentStageId: StageId = 'ANCIENT_TEMPLE';
  public currentStage: StageDefinition;
  public particleSystem: StageParticleSystem;

  private bgImages: Map<StageId, HTMLImageElement> = new Map();
  private loadedStages: Set<StageId> = new Set();
  private failedStages: Set<StageId> = new Set();

  public stageWidth = WorldCoordinateSystem.STAGE_WIDTH; // 2400
  public floorY = WorldCoordinateSystem.GROUND_Y; // 560

  private time = 0;
  private impactFlickerTimer = 0;
  private ultimateSurgeTimer = 0;
  private windGustTimer = 0;

  constructor(initialStageId: StageId = 'ANCIENT_TEMPLE') {
    this.currentStageId = initialStageId;
    this.currentStage = STAGES[initialStageId];
    this.particleSystem = new StageParticleSystem(
      this.currentStage.particleRules,
      this.stageWidth,
      this.floorY
    );

    this.loadStageBackground(initialStageId);
  }

  private loadStageBackground(stageId: StageId): void {
    if (this.bgImages.has(stageId) || this.failedStages.has(stageId)) return;

    const img = new Image();
    img.decoding = 'async';
    this.bgImages.set(stageId, img);
    img.onload = () => {
      this.loadedStages.add(stageId);
    };
    img.onerror = () => {
      // A missing stage image keeps the procedural backdrop available without
      // repeatedly retrying a failed request on every render.
      this.bgImages.delete(stageId);
      this.failedStages.add(stageId);
    };
    img.src = STAGES[stageId].bgImage;
  }

  public setStage(stageId: StageId): void {
    if (!STAGES[stageId]) return;
    this.currentStageId = stageId;
    this.currentStage = STAGES[stageId];
    this.particleSystem.setRules(this.currentStage.particleRules);
    this.loadStageBackground(stageId);
  }

  public update(dt: number): void {
    this.time += dt;

    if (this.impactFlickerTimer > 0) {
      this.impactFlickerTimer -= dt;
    }
    if (this.ultimateSurgeTimer > 0) {
      this.ultimateSurgeTimer -= dt;
    }
    if (this.windGustTimer > 0) {
      this.windGustTimer -= dt;
    }

    const windMod = this.windGustTimer > 0 ? 2.2 : 1.0;
    this.particleSystem.update(dt, windMod);
  }

  /**
   * Triggers environmental reaction to combat impacts (ground dust, sign flicker, lava surge).
   */
  public triggerImpactReaction(x: number, y: number, isHeavy = false): void {
    this.impactFlickerTimer = isHeavy ? 0.35 : 0.15;
    this.windGustTimer = isHeavy ? 0.8 : 0.3;

    // Spawn stage-specific ground contact particles
    const dustColor = this.currentStage.groundDustColor;
    const count = isHeavy ? 18 : 8;
    this.particleSystem.spawnGroundImpact(x, y, dustColor, count);
  }

  /**
   * Triggers dramatic environmental surge during cinematic ultimate attacks.
   */
  public triggerUltimateSurge(): void {
    this.ultimateSurgeTimer = 1.2;
    this.windGustTimer = 1.5;
  }

  /**
   * LAYER 1: Fullscreen edge-to-edge backdrop sky gradient in screen coordinates.
   * Guarantees 0% black gaps regardless of viewport aspect ratio.
   */
  public renderScreenBackdrop(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number
  ): void {
    const sky = this.currentStage.skyGradient;
    const grad = ctx.createLinearGradient(0, 0, 0, height);
    grad.addColorStop(0, sky[0]);
    grad.addColorStop(0.35, sky[1]);
    grad.addColorStop(0.7, sky[2]);
    grad.addColorStop(1, sky[3]);

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);
  }

  /**
   * LAYERS 2-6: Environmental 2.5D Background, Parallax Scenery, and Dynamic Ground Floor.
   */
  public renderBackground(
    ctx: CanvasRenderingContext2D,
    camX: number,
    camY: number,
    _camZoom: number,
    _viewportW: number,
    _viewportH: number
  ): void {
    const img = this.bgImages.get(this.currentStageId);
    const isLoaded = img && img.complete && img.naturalWidth > 0;

    // 1. High-Resolution Parallax Background Illustration
    if (isLoaded) {
      const pX = (camX - 1200) * this.currentStage.parallaxFactorX;
      const pY = (camY - 525) * this.currentStage.parallaxFactorY;

      ctx.save();
      // Draw background centered with generous margins covering 2400x1200 world space
      const bgW = 2600;
      const bgH = 3200 * (img.naturalHeight / img.naturalWidth);
      const drawX = 1200 - bgW * 0.5 - pX;
      const drawY = this.floorY - bgH * 0.68 - pY;

      // Environmental flicker on heavy hit
      if (this.impactFlickerTimer > 0 && this.currentStage.bgReactivity.flickerOnImpact) {
        ctx.filter = `brightness(${1 + Math.sin(this.time * 40) * 0.4})`;
      }

      ctx.drawImage(img, drawX, drawY, bgW, bgH);
      ctx.restore();
    } else {
      // Procedural fallback while image loads
      this.renderProceduralStageBackdrop(ctx);
    }

    // 2. Dynamic 2.5D Arena Floor & Perspective Surface
    this.renderStageFloor(ctx);

    // 3. Stage Midground Particles (Rain, leaves, embers, snow)
    this.particleSystem.renderMidground(ctx);

    // 4. Atmospheric Ambient Overlay Tint
    this.renderAmbientOverlay(ctx);
  }

  /**
   * Renders the stage ground plane with 2.5D perspective, reflections, and surface details.
   */
  private renderStageFloor(ctx: CanvasRenderingContext2D): void {
    const stage = this.currentStage;
    const floorY = this.floorY;
    const left = -400;
    const right = this.stageWidth + 400;
    const floorDepth = 700;

    ctx.save();

    // Base Floor Plane Gradient
    const floorGrad = ctx.createLinearGradient(0, floorY, 0, floorY + floorDepth);
    floorGrad.addColorStop(0, stage.groundFloorColor);
    floorGrad.addColorStop(0.3, '#08080c');
    floorGrad.addColorStop(1, '#020204');
    ctx.fillStyle = floorGrad;
    ctx.fillRect(left, floorY, right - left, floorDepth);

    // Stage-specific 2D Perspective Floor Artwork
    if (stage.groundType === 'WET_ASPHALT') {
      // Neon City: Wet asphalt reflections & road markings
      this.renderWetStreetFloor(ctx, floorY, left, right);
    } else if (stage.groundType === 'ANCIENT_STONE') {
      // Ancient Temple: Flagstone courtyard pattern & snow patches
      this.renderAncientStoneFloor(ctx, floorY, left, right);
    } else if (stage.groundType === 'LAVA_FISSURE') {
      // Volcanic: Runic stone slabs over glowing lava cracks
      this.renderVolcanicLavaFloor(ctx, floorY, left, right);
    } else if (stage.groundType === 'GLACIAL_ICE') {
      // Frozen Wasteland: Crystalline ice fissures & frosty sheen
      this.renderGlacialIceFloor(ctx, floorY, left, right);
    } else if (stage.groundType === 'METAL_HELIPAD') {
      // Cyberpunk Rooftop: Metal plates, hazard stripes & neon landing ring
      this.renderHelipadFloor(ctx, floorY, left, right);
    } else if (stage.groundType === 'ENCHANTED_FLAGSTONE') {
      // Mystic Forest: Mossy stones & glowing turquoise runes
      this.renderMysticForestFloor(ctx, floorY, left, right);
    }

    ctx.restore();
  }

  private renderWetStreetFloor(ctx: CanvasRenderingContext2D, y: number, left: number, right: number): void {
    // Wet road sheen
    const grad = ctx.createLinearGradient(0, y, 0, y + 250);
    grad.addColorStop(0, 'rgba(0, 229, 255, 0.18)');
    grad.addColorStop(0.4, 'rgba(255, 0, 128, 0.12)');
    grad.addColorStop(1, 'transparent');
    ctx.fillStyle = grad;
    ctx.fillRect(left, y, right - left, 250);

    // Perspective lane markings
    ctx.strokeStyle = 'rgba(255, 230, 0, 0.45)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(1200, y);
    ctx.lineTo(1200, y + 500);
    ctx.stroke();

    // Road curb rim
    ctx.strokeStyle = '#00e5ff';
    ctx.lineWidth = 2.5;
    ctx.shadowColor = '#00e5ff';
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.moveTo(left, y);
    ctx.lineTo(right, y);
    ctx.stroke();
  }

  private renderAncientStoneFloor(ctx: CanvasRenderingContext2D, y: number, left: number, right: number): void {
    // Stone flagstone rim line
    ctx.strokeStyle = 'rgba(214, 200, 178, 0.55)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(left, y);
    ctx.lineTo(right, y);
    ctx.stroke();

    // Center circular martial arena emblem (like Tekken / reference image 2)
    ctx.save();
    ctx.translate(1200, y + 90);
    ctx.scale(1.0, 0.32); // 2.5D perspective flattening

    ctx.strokeStyle = 'rgba(214, 200, 178, 0.4)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(0, 0, 320, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(196, 46, 35, 0.45)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(0, 0, 180, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();
  }

  private renderVolcanicLavaFloor(ctx: CanvasRenderingContext2D, y: number, left: number, right: number): void {
    // Molten lava fissures glowing between runic stones (like reference image 1)
    const surge = this.ultimateSurgeTimer > 0 ? 1.8 : 1.0;
    const pulse = Math.sin(this.time * 3) * 0.2 + 0.8;

    ctx.save();
    ctx.strokeStyle = `rgba(255, 68, 0, ${0.75 * pulse * surge})`;
    ctx.lineWidth = 4;
    ctx.shadowColor = '#ff3300';
    ctx.shadowBlur = 18 * surge;

    // Glowing horizon lava fault line
    ctx.beginPath();
    ctx.moveTo(left, y);
    ctx.lineTo(right, y);
    ctx.stroke();

    // Radiating ground cracks
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(700, y);
    ctx.lineTo(820, y + 160);
    ctx.lineTo(950, y + 240);

    ctx.moveTo(1500, y);
    ctx.lineTo(1420, y + 180);
    ctx.lineTo(1300, y + 280);

    ctx.moveTo(1100, y + 40);
    ctx.lineTo(1250, y + 150);
    ctx.stroke();
    ctx.restore();
  }

  private renderGlacialIceFloor(ctx: CanvasRenderingContext2D, y: number, left: number, right: number): void {
    // Translucent ice rim & permafrost cracks
    ctx.save();
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.65)';
    ctx.lineWidth = 3;
    ctx.shadowColor = '#00f0ff';
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.moveTo(left, y);
    ctx.lineTo(right, y);
    ctx.stroke();

    // Frost crack lines
    ctx.strokeStyle = 'rgba(200, 240, 255, 0.4)';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(900, y);
    ctx.lineTo(1050, y + 140);
    ctx.lineTo(1150, y + 220);

    ctx.moveTo(1600, y);
    ctx.lineTo(1480, y + 120);
    ctx.stroke();
    ctx.restore();
  }

  private renderHelipadFloor(ctx: CanvasRenderingContext2D, y: number, left: number, right: number): void {
    // Metal rim with magenta glow
    ctx.save();
    ctx.strokeStyle = '#ff00aa';
    ctx.lineWidth = 3;
    ctx.shadowColor = '#ff00aa';
    ctx.shadowBlur = 16;
    ctx.beginPath();
    ctx.moveTo(left, y);
    ctx.lineTo(right, y);
    ctx.stroke();

    // Helipad circle & "H" mark
    ctx.translate(1200, y + 110);
    ctx.scale(1.0, 0.35);

    ctx.strokeStyle = 'rgba(0, 229, 255, 0.55)';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(0, 0, 280, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = 'rgba(0, 229, 255, 0.45)';
    ctx.font = '900 120px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('H', 0, 0);
    ctx.restore();
  }

  private renderMysticForestFloor(ctx: CanvasRenderingContext2D, y: number, left: number, right: number): void {
    // Mossy ground with glowing turquoise rune lines
    ctx.save();
    ctx.strokeStyle = 'rgba(0, 255, 180, 0.55)';
    ctx.lineWidth = 3;
    ctx.shadowColor = '#00ffc8';
    ctx.shadowBlur = 14;
    ctx.beginPath();
    ctx.moveTo(left, y);
    ctx.lineTo(right, y);
    ctx.stroke();

    // Ancient circular glyph
    ctx.translate(1200, y + 100);
    ctx.scale(1.0, 0.32);
    ctx.beginPath();
    ctx.arc(0, 0, 260, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  private renderAmbientOverlay(ctx: CanvasRenderingContext2D): void {
    const stage = this.currentStage;
    ctx.save();
    ctx.fillStyle = stage.ambientOverlay;
    ctx.globalCompositeOperation = stage.ambientOverlayBlendMode;
    ctx.fillRect(-600, -200, this.stageWidth + 1200, 1600);
    ctx.restore();
  }

  private renderProceduralStageBackdrop(ctx: CanvasRenderingContext2D): void {
    // Elegant procedural backdrop while textures are loading
    const grad = ctx.createLinearGradient(0, 0, 0, this.floorY);
    grad.addColorStop(0, '#0a0d18');
    grad.addColorStop(0.7, '#151d32');
    grad.addColorStop(1, '#1b2440');
    ctx.fillStyle = grad;
    ctx.fillRect(-400, 0, this.stageWidth + 800, this.floorY);
  }

  /**
   * LAYER 9: Foreground framing objects (eaves, pillars, hanging lanterns, chains)
   * Rendered with high parallax factor (1.15x) in front of the fighters for true 2.5D depth.
   */
  public renderForeground(
    ctx: CanvasRenderingContext2D,
    camX: number,
    _camY: number
  ): void {
    const fgParallax = (camX - 1200) * -0.18;

    ctx.save();
    ctx.translate(fgParallax, 0);

    if (this.currentStageId === 'ANCIENT_TEMPLE') {
      // Silhouetted temple roof eaves & hanging paper lanterns in top corners
      ctx.fillStyle = '#06080e';
      ctx.beginPath();
      // Left temple eave
      ctx.moveTo(-100, -50);
      ctx.lineTo(260, -50);
      ctx.lineTo(190, 80);
      ctx.lineTo(-100, 40);
      ctx.fill();

      // Right temple eave
      ctx.moveTo(this.stageWidth + 100, -50);
      ctx.lineTo(this.stageWidth - 260, -50);
      ctx.lineTo(this.stageWidth - 190, 80);
      ctx.lineTo(this.stageWidth + 100, 40);
      ctx.fill();

      // Hanging lantern with warm red glow
      ctx.fillStyle = '#ff1a4b';
      ctx.shadowColor = '#ff1a4b';
      ctx.shadowBlur = 25;
      ctx.fillRect(170, 75, 22, 34);
      ctx.fillRect(this.stageWidth - 192, 75, 22, 34);
    } else if (this.currentStageId === 'NEON_CITY') {
      // Foreground street lamp / neon sign pole on far edges
      ctx.fillStyle = '#05070d';
      ctx.fillRect(40, -100, 24, 700);
      ctx.fillRect(this.stageWidth - 64, -100, 24, 700);

      // Cyan neon strip
      ctx.fillStyle = '#00e5ff';
      ctx.shadowColor = '#00e5ff';
      ctx.shadowBlur = 18;
      ctx.fillRect(44, 120, 6, 140);
      ctx.fillRect(this.stageWidth - 50, 120, 6, 140);
    } else if (this.currentStageId === 'VOLCANIC_BATTLEFIELD') {
      // Floating sharp volcanic basalt crags in foreground corners
      ctx.fillStyle = '#0c0404';
      ctx.beginPath();
      ctx.moveTo(-80, -20);
      ctx.lineTo(180, -20);
      ctx.lineTo(90, 140);
      ctx.lineTo(-80, 180);
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(this.stageWidth + 80, -20);
      ctx.lineTo(this.stageWidth - 180, -20);
      ctx.lineTo(this.stageWidth - 90, 140);
      ctx.lineTo(this.stageWidth + 80, 180);
      ctx.fill();
    }

    // Foreground atmospheric particles (big leaves, heavy raindrops, big snow flakes)
    this.particleSystem.renderForeground(ctx);

    ctx.restore();
  }
}
