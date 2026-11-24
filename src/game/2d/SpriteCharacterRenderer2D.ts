// src/game/2d/SpriteCharacterRenderer2D.ts
// COMPREHENSIVE 16-FIGHTER 2D OPEN-SOURCE SPRITE ANIMATION RENDERER

import { FighterState, PlayerId } from '../../types';
import { AnimationController } from '../animation/AnimationController';
import { P1_ANIMATIONS, P2_ANIMATIONS, createHuntressAnimationSet } from '../animation/AnimationConfig';
import { FighterId, ROSTER_FIGHTERS } from '../characters/RosterConfig';

export class SpriteCharacterRenderer2D {
  private static imageCache: Map<string, HTMLImageElement> = new Map();
  private static isPreloaded = false;

  public static preload(): void {
    if (this.isPreloaded) return;
    this.isPreloaded = true;

    const allConfigs = [P1_ANIMATIONS, P2_ANIMATIONS, createHuntressAnimationSet('huntress')];
    for (const cfg of allConfigs) {
      for (const anim of Object.values(cfg)) {
        if (!this.imageCache.has(anim.imageSrc)) {
          const img = new Image();
          img.src = anim.imageSrc;
          this.imageCache.set(anim.imageSrc, img);
        }
      }
    }
  }

  public static getImage(src: string): HTMLImageElement {
    let img = this.imageCache.get(src);
    if (!img) {
      img = new Image();
      img.src = src;
      this.imageCache.set(src, img);
    }
    return img;
  }

  /**
   * Renders the fighter's ground shadow anchored strictly on the arena floor (Layer 7).
   */
  public static renderShadow(
    ctx: CanvasRenderingContext2D,
    worldX: number,
    groundY: number,
    jumpOffsetY: number
  ): void {
    const jumpHeight = Math.max(0, -jumpOffsetY);
    const shadowScale = Math.max(0.35, 1.0 - jumpHeight / 500);
    const shadowAlpha = Math.max(0.18, 0.72 - jumpHeight / 600);

    ctx.save();
    ctx.translate(worldX, groundY);
    ctx.fillStyle = `rgba(5, 8, 15, ${shadowAlpha})`;
    ctx.beginPath();
    ctx.ellipse(0, 0, 75 * shadowScale, 20 * shadowScale, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  /**
   * Renders any of the 16 unique fighters with authentic open-source animated behavior,
   * smooth sprite playback, custom element auras, and hit effects.
   */
  public static renderAnimatedFighter(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    animController: AnimationController,
    facing: 1 | -1,
    id: PlayerId,
    superMeter = 0,
    isHitFlashing = false,
    state: FighterState = 'IDLE',
    fighterId?: string
  ): void {
    this.preload();

    const isP1 = id === 'P1';
    const rawId = (fighterId || (isP1 ? 'KAI' : 'SHADOW')).toUpperCase() as FighterId;
    const profile = ROSTER_FIGHTERS[rawId] || ROSTER_FIGHTERS[isP1 ? 'KAI' : 'SHADOW'];
    const anim = animController.currentAnim;
    const animTime = animController.animTime;

    ctx.save();
    ctx.translate(x, y);

    // Render Open-Source Sprite Frame
    const img = this.getImage(anim.imageSrc);
    const frameH = img && img.naturalHeight > 0 ? img.naturalHeight : 200;

    // Scale: 4.0 for authentic arcade fighting game proportion (approx 350-380px tall)
    let scale = 4.0;
    if (frameH <= 150) {
      scale = 4.6; // Huntress 150x150 scaling
    }

    // Titan has a 15% larger frame
    if (profile.id === 'TITAN') {
      scale *= 1.15;
    }

    // High visibility rim lighting & edge definition
    // Guarantees characters pop distinctly against any stage background
    const rimColor = isP1 ? 'rgba(0, 240, 255, 0.55)' : 'rgba(255, 50, 100, 0.55)';
    ctx.filter = `drop-shadow(0 0 2px rgba(255,255,255,0.85)) drop-shadow(0 2px 8px ${rimColor}) contrast(1.15) brightness(1.1)`;

    // Hit Flash Effect (High impact visual on clean strikes overrides rim)
    if (isHitFlashing) {
      ctx.filter = 'brightness(3.5) contrast(1.5) drop-shadow(0 0 20px #ffffff)';
    }

    // Directional facing
    ctx.scale(facing, 1);

    // Super / EX Aura when meter is full (100%)
    if (superMeter >= 100) {
      ctx.save();
      const auraCol = profile.colors.aura || profile.colors.primary;
      const radGlow = ctx.createRadialGradient(0, -110, 20, 0, -110, 140);
      radGlow.addColorStop(0, auraCol);
      radGlow.addColorStop(0.5, 'rgba(255, 255, 255, 0.28)');
      radGlow.addColorStop(1, 'transparent');
      ctx.fillStyle = radGlow;
      ctx.globalAlpha = 0.55 + Math.sin(animTime * 8) * 0.25;
      ctx.beginPath();
      ctx.ellipse(0, -110, 95, 140, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Render Open-Source Sprite Frame
    if (img && img.complete && img.naturalWidth > 0) {
      const framesMax = Math.max(1, anim.framesMax);
      const frameW = img.naturalWidth / framesMax;
      const actualH = img.naturalHeight;
      const frameIndex = Math.min(animController.frameIndex, framesMax - 1);

      // Foot anchor offset: in 200x200 frames, feet contact ground at y = ~145-148px
      const footAnchorY = frameH <= 150 ? frameH * 0.74 : frameH * 0.725;
      const centerFootX = frameW * 0.5;

      // Crisp pixel/canvas rendering
      ctx.imageSmoothingEnabled = false;

      // Draw the exact sprite frame anchored precisely at ground contact feet
      ctx.drawImage(
        img,
        frameIndex * frameW,
        0,
        frameW,
        frameH,
        -centerFootX * scale,
        -footAnchorY * scale,
        frameW * scale,
        frameH * scale
      );
    } else {
      // Minimal silhouette while sprite downloads
      this.drawLoadingSilhouette(ctx, profile);
    }

    ctx.restore();
  }

  /**
   * Provides distinct elemental color shifts for all 16 fighters
   * so every fighter has a unique aesthetic identity on screen.
   */
  private static getCharacterHueShift(fighterId: string): number {
    switch (fighterId) {
      case 'KAI':
        return 0; // Natural Red/Black Samurai
      case 'SHADOW':
        return 0; // Natural Dark Shinobi
      case 'BLAZE':
        return 20; // Burning Amber/Orange
      case 'FROST':
        return 180; // Icy Blue
      case 'VOLT':
        return 60; // Electric Yellow/Cyan
      case 'TITAN':
        return 30; // Heavy Earth/Bronze
      case 'TERRA':
        return 90; // Jade/Green
      case 'RYUZEN':
        return -30; // Crimson Dragon
      case 'RONIN':
        return 240; // Deep Indigo
      case 'VIPER':
        return 80; // Toxic Emerald
      case 'REAPER':
        return 270; // Violet Nether
      case 'NOVA':
        return 45; // Solar Gold
      case 'PHANTOM':
        return 200; // Ghost Cyan
      case 'AETHER':
        return 160; // Celestial Turquoise
      case 'ECLIPSE':
        return 290; // Dark Magenta
      case 'ZENITH':
        return 135; // Pure White / Prismatic
      default:
        return 0;
    }
  }

  /**
   * Minimal fallback while sprite sheet is downloading into cache.
   */
  private static drawLoadingSilhouette(
    ctx: CanvasRenderingContext2D,
    profile: typeof ROSTER_FIGHTERS[FighterId]
  ): void {
    ctx.save();
    ctx.fillStyle = profile.colors.primary || '#3b82f6';
    ctx.globalAlpha = 0.4;
    ctx.beginPath();
    ctx.ellipse(0, -90, 35, 75, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}
