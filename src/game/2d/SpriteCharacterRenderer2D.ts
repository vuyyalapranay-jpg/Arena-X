// src/game/2d/SpriteCharacterRenderer2D.ts
// HIGH-RESOLUTION 2D ANIME SPRITE SHEET RENDERER

import { FighterState, PlayerId } from '../../types';

export interface SpriteConfig {
  imageSrc: string;
  framesMax: number;
}

export interface CharacterSprites {
  idle: SpriteConfig;
  run: SpriteConfig;
  jump: SpriteConfig;
  fall: SpriteConfig;
  crouch: SpriteConfig;
  block: SpriteConfig;
  attack1: SpriteConfig;
  attack2: SpriteConfig;
  takeHit: SpriteConfig;
  death: SpriteConfig;
}

export class SpriteCharacterRenderer2D {
  private static imageCache: Map<string, HTMLImageElement> = new Map();
  private static isPreloaded = false;

  public static readonly P1_CONFIG: CharacterSprites = {
    idle: { imageSrc: '/assets/sprites/p1/Idle.png', framesMax: 4 },
    run: { imageSrc: '/assets/sprites/p1/Run.png', framesMax: 6 },
    jump: { imageSrc: '/assets/sprites/p1/Jump.png', framesMax: 3 },
    fall: { imageSrc: '/assets/sprites/p1/Fall.png', framesMax: 2 },
    crouch: { imageSrc: '/assets/sprites/p1/Crouch.png', framesMax: 2 },
    block: { imageSrc: '/assets/sprites/p1/Block.png', framesMax: 2 },
    attack1: { imageSrc: '/assets/sprites/p1/Attack1.png', framesMax: 5 },
    attack2: { imageSrc: '/assets/sprites/p1/Attack2.png', framesMax: 5 },
    takeHit: { imageSrc: '/assets/sprites/p1/Take Hit.png', framesMax: 3 },
    death: { imageSrc: '/assets/sprites/p1/Death.png', framesMax: 4 },
  };

  public static readonly P2_CONFIG: CharacterSprites = {
    idle: { imageSrc: '/assets/sprites/p2/Idle.png', framesMax: 4 },
    run: { imageSrc: '/assets/sprites/p2/Run.png', framesMax: 6 },
    jump: { imageSrc: '/assets/sprites/p2/Jump.png', framesMax: 3 },
    fall: { imageSrc: '/assets/sprites/p2/Fall.png', framesMax: 2 },
    crouch: { imageSrc: '/assets/sprites/p2/Crouch.png', framesMax: 2 },
    block: { imageSrc: '/assets/sprites/p2/Block.png', framesMax: 2 },
    attack1: { imageSrc: '/assets/sprites/p2/Attack1.png', framesMax: 5 },
    attack2: { imageSrc: '/assets/sprites/p2/Attack2.png', framesMax: 5 },
    takeHit: { imageSrc: '/assets/sprites/p2/Take Hit.png', framesMax: 3 },
    death: { imageSrc: '/assets/sprites/p2/Death.png', framesMax: 4 },
  };

  public static preload(): void {
    if (this.isPreloaded) return;
    this.isPreloaded = true;

    const allConfigs = [this.P1_CONFIG, this.P2_CONFIG];
    for (const cfg of allConfigs) {
      for (const sprite of Object.values(cfg)) {
        if (!this.imageCache.has(sprite.imageSrc)) {
          const img = new Image();
          img.src = sprite.imageSrc;
          this.imageCache.set(sprite.imageSrc, img);
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
   * Renders the fighter's ground shadow anchored strictly on the arena floor (Layer 6).
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
   * Renders a fighter using real, high-resolution 2D sprite sheets.
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
    isHitFlashing = false
  ): void {
    this.preload();

    const isP1 = id === 'P1';
    const cfg = isP1 ? this.P1_CONFIG : this.P2_CONFIG;

    // Map fighter combat state to the corresponding sprite sheet
    let activeSprite: SpriteConfig = cfg.idle;
    let holdOnLastFrame = false;
    let frameRate = 9; // frames per second

    switch (state) {
      case 'IDLE':
        activeSprite = cfg.idle;
        frameRate = 8;
        break;
      case 'WALK_FWD':
      case 'RUN':
        activeSprite = cfg.run;
        frameRate = 12;
        break;
      case 'WALK_BWD':
        activeSprite = cfg.run;
        frameRate = 8;
        break;
      case 'JUMP':
        activeSprite = cfg.jump;
        frameRate = 5;
        holdOnLastFrame = true;
        break;
      case 'FALL':
        activeSprite = cfg.fall;
        frameRate = 5;
        holdOnLastFrame = true;
        break;
      case 'LAND':
        activeSprite = cfg.crouch;
        frameRate = 8;
        break;
      case 'CROUCH':
        activeSprite = cfg.crouch;
        frameRate = 6;
        holdOnLastFrame = true;
        break;
      case 'PUNCH_LEFT':
      case 'PUNCH_RIGHT':
        activeSprite = cfg.attack1;
        frameRate = 16;
        break;
      case 'PUNCH_HEAVY':
      case 'KICK_FRONT':
      case 'KICK_HIGH':
      case 'KICK_LOW':
        activeSprite = cfg.attack2;
        frameRate = 14;
        break;
      case 'BLOCK':
        activeSprite = cfg.block;
        frameRate = 6;
        holdOnLastFrame = true;
        break;
      case 'HIT_STAGGER':
      case 'KNOCKBACK':
        activeSprite = cfg.takeHit;
        frameRate = 10;
        break;
      case 'DEFEAT':
        activeSprite = cfg.death;
        frameRate = 8;
        holdOnLastFrame = true;
        break;
      case 'VICTORY':
        activeSprite = cfg.idle;
        frameRate = 8;
        break;
    }

    const img = this.getImage(activeSprite.imageSrc);
    if (!img.complete || img.naturalWidth === 0) {
      // Still loading image
      return;
    }

    const framesMax = activeSprite.framesMax;
    const frameWidth = img.naturalWidth / framesMax;
    const frameHeight = img.naturalHeight; // 200px

    // Compute current frame
    let frameIndex = Math.floor(animTime * frameRate) % framesMax;
    if (holdOnLastFrame) {
      const totalFramesPassed = Math.floor(animTime * frameRate);
      frameIndex = Math.min(framesMax - 1, totalFramesPassed);
    }

    ctx.save();
    ctx.translate(x, y);

    // Hit Flash
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
      ctx.globalAlpha = 0.45 + Math.sin(animTime * 8) * 0.2;
      ctx.beginPath();
      ctx.ellipse(0, -75, 65, 85, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Scale and Orient facing:
    // P1 (Kai) is naturally drawn facing RIGHT (+1).
    // P2 (Shadow) is naturally drawn facing LEFT (-1).
    // When facing opponent:
    // P1 on left facing right: facing = 1 -> flipX = 1
    // P1 crosses over to right: facing = -1 -> flipX = -1
    // P2 on right facing left: facing = -1 -> flipX = 1
    // P2 crosses over to left: facing = 1 -> flipX = -1
    const flipX = isP1 ? facing : (facing === -1 ? 1 : -1);
    ctx.scale(flipX, 1);

    // High-Resolution Character drawing scale and offset (Frame is 400x500 HD)
    const scale = 0.58;
    const scaledWidth = frameWidth * scale;
    const scaledHeight = frameHeight * scale;

    // Center horizontally and align feet cleanly on the floor (y = 0)
    const offsetX = -frameWidth * 0.5 * scale;
    const offsetY = -475 * scale;

    // Draw the sliced sprite frame
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
    if (state === 'BLOCK') {
      ctx.save();
      const shieldColor = isP1 ? '#ff1a4b' : '#00d0ff';
      ctx.strokeStyle = shieldColor;
      ctx.lineWidth = 3.5;
      ctx.shadowColor = shieldColor;
      ctx.shadowBlur = 16;
      ctx.beginPath();
      ctx.arc(35, -65, 48, -Math.PI / 2.2, Math.PI / 2.2);
      ctx.stroke();

      ctx.fillStyle = isP1 ? 'rgba(255, 26, 75, 0.22)' : 'rgba(0, 208, 255, 0.22)';
      ctx.fill();
      ctx.restore();
    }

    ctx.restore();
  }
}
