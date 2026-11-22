// src/game/2d/SpriteCharacterRenderer2D.ts
// HIGH-RESOLUTION 2D ANIME SPRITE SHEET RENDERER & ANIMATION INTEGRATION

import { FighterState, PlayerId } from '../../types';
import { AnimationController } from '../animation/AnimationController';
import { P1_ANIMATIONS, P2_ANIMATIONS } from '../animation/AnimationConfig';

export class SpriteCharacterRenderer2D {
  private static imageCache: Map<string, HTMLImageElement> = new Map();
  private static isPreloaded = false;

  public static preload(): void {
    if (this.isPreloaded) return;
    this.isPreloaded = true;

    const allConfigs = [P1_ANIMATIONS, P2_ANIMATIONS];
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
   * Scales down and fades as the character jumps higher, maintaining physical grounding.
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
    ctx.ellipse(0, 0, 52 * shadowScale, 15 * shadowScale, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  /**
   * Renders a fighter using real, high-resolution 2D sprite sheets driven by AnimationController.
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
    const anim = animController.currentAnim;
    const img = this.getImage(anim.imageSrc);

    if (!img.complete || img.naturalWidth === 0) {
      return; // Image is loading
    }

    const framesMax = anim.framesMax;
    const frameWidth = img.naturalWidth / framesMax;
    const frameHeight = img.naturalHeight; // 500px

    const frameIndex = Math.min(framesMax - 1, Math.max(0, animController.getCurrentFrame()));

    ctx.save();
    ctx.translate(x, y);

    // Hit Flash Effect
    if (isHitFlashing) {
      ctx.filter = 'brightness(3) contrast(1.5) drop-shadow(0 0 16px #ffffff)';
    }

    // Super / EX Aura when super is ready
    if (superMeter >= 100) {
      ctx.save();
      const auraColor = isP1 ? '#ff1a4b' : '#00b4ff';
      const radGlow = ctx.createRadialGradient(0, -75, 10, 0, -75, 90);
      radGlow.addColorStop(0, auraColor);
      radGlow.addColorStop(0.5, 'rgba(255, 255, 255, 0.15)');
      radGlow.addColorStop(1, 'transparent');
      ctx.fillStyle = radGlow;
      ctx.globalAlpha = 0.45 + Math.sin(animController.animTime * 8) * 0.2;
      ctx.beginPath();
      ctx.ellipse(0, -75, 65, 85, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Directional Facing Scale:
    // P1 archetype fighters (Kai, Blaze, Volt, Phantom, Viper, Nova, Aether, Eclipse) are authored facing RIGHT (+1).
    // P2 archetype fighters (Shadow, Frost, Terra, Ronin, Titan, Reaper, Ryuzen, Zenith) are authored facing LEFT (-1).
    // scaleX = facing * baseFacing ensures any fighter facing the opponent will always be oriented face-to-face.
    const rawId = (fighterId || (isP1 ? 'kai' : 'shadow')).toLowerCase();
    const LEFT_FACING_FIGHTERS = new Set(['shadow', 'frost', 'terra', 'ronin', 'titan', 'reaper', 'ryuzen', 'zenith', 'p2']);
    const baseFacing = LEFT_FACING_FIGHTERS.has(rawId) ? -1 : 1;
    const flipX = facing * baseFacing;
    ctx.scale(flipX, 1);

    // High-Resolution Character drawing scale and bottom-center foot anchor
    const scale = 0.58;
    const scaledWidth = frameWidth * scale;
    const scaledHeight = frameHeight * scale;

    const offsetX = -frameWidth * 0.5 * scale;
    const offsetY = -475 * scale; // Soles of shoes contact y=0 (ground contact)

    ctx.drawImage(
      img,
      frameIndex * frameWidth,
      0,
      frameWidth,
      frameHeight,
      offsetX,
      offsetY,
      scaledWidth,
      scaledHeight
    );

    // Block Guard Energy Shield (Anime Hexagonal Barrier)
    if (state === 'BLOCK' || anim.name === 'block_stand' || anim.name === 'block_crouch') {
      ctx.save();
      const shieldColor = isP1 ? '#ff1a4b' : '#00d0ff';
      ctx.strokeStyle = shieldColor;
      ctx.lineWidth = 3.5;
      ctx.shadowColor = shieldColor;
      ctx.shadowBlur = 16;
      ctx.beginPath();
      const barrierY = anim.name === 'block_crouch' ? -45 : -65;
      ctx.arc(35, barrierY, 48, -Math.PI / 2.2, Math.PI / 2.2);
      ctx.stroke();

      ctx.fillStyle = isP1 ? 'rgba(255, 26, 75, 0.22)' : 'rgba(0, 208, 255, 0.22)';
      ctx.fill();
      ctx.restore();
    }

    ctx.restore();
  }

  /**
   * Backwards compatible render method.
   */
  public static render(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    state: FighterState,
    facing: 1 | -1,
    animTime: number,
    id: PlayerId,
    superMeter = 0,
    isHitFlashing = false,
    fighterId?: string
  ): void {
    this.preload();
    // Default fallback
    const isP1 = id === 'P1';
    const set = isP1 ? P1_ANIMATIONS : P2_ANIMATIONS;
    let anim = set.idle;
    switch (state) {
      case 'RUN': anim = set.runFwd; break;
      case 'WALK_FWD': anim = set.walkFwd; break;
      case 'WALK_BWD': anim = set.walkBwd; break;
      case 'JUMP': anim = set.jumpRise; break;
      case 'FALL': anim = set.jumpFall; break;
      case 'LAND': anim = set.land; break;
      case 'CROUCH': anim = set.crouch; break;
      case 'PUNCH_LEFT': anim = set.punchLight; break;
      case 'PUNCH_RIGHT':
      case 'PUNCH_HEAVY': anim = set.punchHeavy; break;
      case 'KICK_FRONT': anim = set.kickLight; break;
      case 'KICK_HIGH': anim = set.kickHigh; break;
      case 'KICK_LOW': anim = set.kickLow; break;
      case 'BLOCK': anim = set.blockStand; break;
      case 'HIT_STAGGER': anim = set.hitLight; break;
      case 'KNOCKBACK': anim = set.knockback; break;
      case 'DEFEAT': anim = set.defeat; break;
      case 'VICTORY': anim = set.victory; break;
    }

    const img = this.getImage(anim.imageSrc);
    if (!img.complete || img.naturalWidth === 0) return;

    const framesMax = anim.framesMax;
    const frameWidth = img.naturalWidth / framesMax;
    const frameHeight = img.naturalHeight;
    const frameIndex = Math.floor(animTime * anim.frameRate) % framesMax;

    ctx.save();
    ctx.translate(x, y);
    if (isHitFlashing) {
      ctx.filter = 'brightness(3) contrast(1.5) drop-shadow(0 0 16px #ffffff)';
    }
    const rawId = (fighterId || (isP1 ? 'kai' : 'shadow')).toLowerCase();
    const LEFT_FACING_FIGHTERS = new Set(['shadow', 'frost', 'terra', 'ronin', 'titan', 'reaper', 'ryuzen', 'zenith', 'p2']);
    const baseFacing = LEFT_FACING_FIGHTERS.has(rawId) ? -1 : 1;
    const flipX = facing * baseFacing;
    ctx.scale(flipX, 1);
    const scale = 0.58;
    ctx.drawImage(
      img,
      frameIndex * frameWidth,
      0,
      frameWidth,
      frameHeight,
      -frameWidth * 0.5 * scale,
      -475 * scale,
      frameWidth * scale,
      frameHeight * scale
    );
    ctx.restore();
  }
}
