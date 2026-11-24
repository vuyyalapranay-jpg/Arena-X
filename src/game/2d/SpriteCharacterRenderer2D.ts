// src/game/2d/SpriteCharacterRenderer2D.ts
// COMPREHENSIVE 16-FIGHTER 2D COMBAT MODEL RENDERER & JOINT-CONNECTED MARTIAL ARTS ENGINE

import { FighterState, PlayerId } from '../../types';
import { AnimationController } from '../animation/AnimationController';
import { P1_ANIMATIONS, P2_ANIMATIONS } from '../animation/AnimationConfig';
import { FighterId, ROSTER_FIGHTERS } from '../characters/RosterConfig';

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
   * Renders any of the 16 unique fighters with authentic martial arts anatomy,
   * unbroken kinematic joint connections (zero severed/floating limbs), signature weapons,
   * element-specific effects, and dynamic combat states.
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
    const animTime = animController.animTime;

    this.drawKinematicMartialFighter(
      ctx,
      x,
      y,
      facing,
      state,
      animTime,
      profile,
      superMeter,
      isHitFlashing,
      isP1
    );
  }

  /**
   * Core kinematic 2D martial arts rendering algorithm.
   * Renders continuous forward-kinematic chains for arms and legs,
   * guaranteeing zero frame-slicing artifacts and zero disconnected limbs.
   */
  private static drawKinematicMartialFighter(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    facing: 1 | -1,
    state: FighterState,
    animTime: number,
    profile: typeof ROSTER_FIGHTERS[FighterId],
    superMeter: number,
    isHitFlashing: boolean,
    isP1: boolean
  ): void {
    ctx.save();
    ctx.translate(x, y);

    // Hit Flash Effect
    if (isHitFlashing) {
      ctx.filter = 'brightness(3) contrast(1.5) drop-shadow(0 0 16px #ffffff)';
    }

    // Facing direction
    ctx.scale(facing, 1);

    const pCol = profile.colors.primary;
    const sCol = profile.colors.secondary;
    const aCol = profile.colors.accent;
    const auraCol = profile.colors.aura || profile.colors.primary;
    const skinCol = profile.colors.skin || '#df9e78';
    const hairCol = profile.colors.hair || '#141416';

    // Super / EX Aura when super is ready (100% meter)
    if (superMeter >= 100) {
      ctx.save();
      const radGlow = ctx.createRadialGradient(0, -75, 10, 0, -75, 95);
      radGlow.addColorStop(0, auraCol);
      radGlow.addColorStop(0.5, 'rgba(255, 255, 255, 0.18)');
      radGlow.addColorStop(1, 'transparent');
      ctx.fillStyle = radGlow;
      ctx.globalAlpha = 0.45 + Math.sin(animTime * 8) * 0.2;
      ctx.beginPath();
      ctx.ellipse(0, -75, 68, 88, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Kinematic Joint Angles
    let bodyTilt = 0;
    let hipY = -120;
    let leadLegAngle = 0.2;
    let rearLegAngle = -0.2;
    let leadKneeAngle = 0.3;
    let rearKneeAngle = 0.2;
    let leadArmAngle = 0.5;
    let leadElbowAngle = 1.2;
    let rearArmAngle = -0.3;
    let rearElbowAngle = 1.4;
    let lungeX = 0;
    let scaleY = 1;
    let scaleX = 1;

    const breath = Math.sin(animTime * 3.5);

    // State-specific martial arts kinematics
    switch (state) {
      case 'IDLE':
        hipY += breath * 3;
        bodyTilt = breath * 0.02;
        leadArmAngle += breath * 0.05;
        rearArmAngle -= breath * 0.04;
        break;

      case 'WALK_FWD':
        hipY += Math.abs(Math.sin(animTime * 6)) * 4;
        leadLegAngle = Math.sin(animTime * 6) * 0.45;
        rearLegAngle = -Math.sin(animTime * 6) * 0.45;
        leadArmAngle = -Math.sin(animTime * 6) * 0.35 + 0.3;
        rearArmAngle = Math.sin(animTime * 6) * 0.35 - 0.2;
        break;

      case 'WALK_BWD':
        hipY += Math.abs(Math.sin(animTime * 5)) * 3;
        leadLegAngle = -Math.sin(animTime * 5) * 0.35;
        rearLegAngle = Math.sin(animTime * 5) * 0.35;
        bodyTilt = -0.06;
        break;

      case 'RUN':
        lungeX = 20;
        bodyTilt = 0.25;
        hipY += Math.abs(Math.sin(animTime * 10)) * 6;
        leadLegAngle = Math.sin(animTime * 10) * 0.7;
        rearLegAngle = -Math.sin(animTime * 10) * 0.7;
        leadArmAngle = -Math.sin(animTime * 10) * 0.6;
        rearArmAngle = Math.sin(animTime * 10) * 0.6;
        break;

      case 'JUMP':
        hipY -= 15;
        bodyTilt = 0.1;
        leadLegAngle = 0.7;
        leadKneeAngle = 1.0;
        rearLegAngle = 0.5;
        rearKneeAngle = 0.9;
        leadArmAngle = -0.6;
        rearArmAngle = 0.6;
        break;

      case 'FALL':
        hipY -= 5;
        bodyTilt = 0.05;
        leadLegAngle = 0.2;
        leadKneeAngle = 0.2;
        rearLegAngle = -0.1;
        rearKneeAngle = 0.2;
        leadArmAngle = -0.3;
        rearArmAngle = 0.4;
        break;

      case 'LAND':
      case 'CROUCH':
        hipY = -90;
        bodyTilt = 0.15;
        leadLegAngle = 0.8;
        leadKneeAngle = 1.3;
        rearLegAngle = -0.7;
        rearKneeAngle = 1.4;
        leadArmAngle = -0.2;
        leadElbowAngle = 1.6;
        rearArmAngle = 0.2;
        rearElbowAngle = 1.6;
        break;

      case 'PUNCH_LEFT':
        lungeX = 25;
        bodyTilt = 0.12;
        leadArmAngle = -0.15;
        leadElbowAngle = 0.08; // Straight snappy jab
        rearArmAngle = 0.5;
        rearElbowAngle = 1.7;
        leadLegAngle = 0.4;
        rearLegAngle = -0.5;
        break;

      case 'PUNCH_RIGHT':
      case 'PUNCH_HEAVY':
        lungeX = 40;
        bodyTilt = 0.22;
        leadArmAngle = -0.05;
        leadElbowAngle = 0.04; // Powerful lunging cross / reverse punch
        rearArmAngle = 0.7;
        rearElbowAngle = 1.9;
        leadLegAngle = 0.6;
        rearLegAngle = -0.7;
        scaleX = 1.08;
        break;

      case 'KICK_FRONT':
        lungeX = 20;
        bodyTilt = -0.15;
        hipY -= 8;
        leadLegAngle = -1.1;
        leadKneeAngle = 0.1;
        rearLegAngle = 0.2;
        rearKneeAngle = 0.25;
        leadArmAngle = -0.3;
        rearArmAngle = 0.6;
        break;

      case 'KICK_HIGH':
        lungeX = 45;
        bodyTilt = -0.28; // Lean back for balance
        hipY -= 20;
        leadLegAngle = -1.55; // Extended high roundhouse kick
        leadKneeAngle = 0.04;
        rearLegAngle = 0.18;
        rearKneeAngle = 0.22;
        leadArmAngle = -0.45;
        rearArmAngle = 0.85;
        break;

      case 'KICK_LOW':
        hipY = -85;
        bodyTilt = -0.2;
        leadLegAngle = -1.4;
        leadKneeAngle = 0.1;
        rearLegAngle = 0.7;
        rearKneeAngle = 1.3;
        break;

      case 'SPECIAL':
        lungeX = 50;
        bodyTilt = 0.3;
        hipY -= 10;
        leadArmAngle = -0.2;
        leadElbowAngle = 0.02; // Full kinetic attack extension
        rearArmAngle = 0.9;
        rearElbowAngle = 2.0;
        leadLegAngle = 0.7;
        rearLegAngle = -0.8;
        scaleX = 1.15;
        break;

      case 'BLOCK':
        lungeX = -10;
        bodyTilt = -0.08;
        leadArmAngle = -0.42;
        leadElbowAngle = 1.85;
        rearArmAngle = -0.22;
        rearElbowAngle = 1.75;
        break;

      case 'HIT_STAGGER':
        lungeX = -25;
        bodyTilt = -0.28; // Head and torso snapped back
        hipY -= 8;
        leadArmAngle = -0.7;
        rearArmAngle = -0.5;
        leadLegAngle = -0.3;
        rearLegAngle = -0.6;
        break;

      case 'KNOCKBACK':
        lungeX = -45;
        bodyTilt = -0.4;
        hipY -= 15;
        leadArmAngle = -0.8;
        rearArmAngle = -0.7;
        leadLegAngle = -0.5;
        rearLegAngle = -0.8;
        break;

      case 'KNOCKDOWN':
      case 'DEFEAT':
        hipY = -35;
        bodyTilt = -1.4; // Down on the ground
        leadArmAngle = -1.2;
        rearArmAngle = -1.0;
        leadLegAngle = 0.2;
        rearLegAngle = 0.5;
        break;

      case 'VICTORY':
        lungeX = 0;
        bodyTilt = 0.0;
        hipY = -125;
        leadArmAngle = -1.8; // Arm raised victorious to the sky!
        leadElbowAngle = 0.2;
        rearArmAngle = 0.4;
        rearElbowAngle = 1.5;
        break;
    }

    ctx.translate(lungeX, 0);
    ctx.scale(scaleX, scaleY);
    ctx.rotate(bodyTilt);

    // Titan has a massive frame (+15% scale)
    if (profile.id === 'TITAN') {
      ctx.scale(1.15, 1.15);
    }

    // 1. REAR ARM & WEAPON
    ctx.save();
    ctx.strokeStyle = sCol;
    ctx.lineWidth = 14;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    const rShoulderX = -12, rShoulderY = hipY - 70;
    const rElbowX = rShoulderX + Math.sin(rearArmAngle) * 36;
    const rElbowY = rShoulderY + Math.cos(rearArmAngle) * 36;
    ctx.beginPath();
    ctx.moveTo(rShoulderX, rShoulderY);
    ctx.lineTo(rElbowX, rElbowY);
    ctx.stroke();

    ctx.strokeStyle = skinCol;
    ctx.lineWidth = 11;
    const rWristX = rElbowX + Math.sin(rearArmAngle + rearElbowAngle) * 32;
    const rWristY = rElbowY + Math.cos(rearArmAngle + rearElbowAngle) * 32;
    ctx.beginPath();
    ctx.moveTo(rElbowX, rElbowY);
    ctx.lineTo(rWristX, rWristY);
    ctx.stroke();

    ctx.fillStyle = pCol;
    ctx.beginPath();
    ctx.arc(rWristX, rWristY, 8, 0, Math.PI * 2);
    ctx.fill();

    // Reaper Rear Scythe Shaft
    if (profile.id === 'REAPER') {
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(rWristX - 32, rWristY - 95);
      ctx.lineTo(rWristX + 25, rWristY + 75);
      ctx.stroke();
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 6;
      ctx.shadowColor = '#ef4444';
      ctx.shadowBlur = 14;
      ctx.beginPath();
      ctx.arc(rWristX - 32, rWristY - 95, 48, 0, Math.PI * 0.8, true);
      ctx.stroke();
    }
    ctx.restore();

    // 2. REAR LEG
    ctx.save();
    ctx.strokeStyle = sCol;
    ctx.lineWidth = 18;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    const rHipX = -10, rHipY = hipY;
    const rKneeX = rHipX + Math.sin(rearLegAngle) * 54;
    const rKneeY = rHipY + Math.cos(rearLegAngle) * 54;
    ctx.beginPath();
    ctx.moveTo(rHipX, rHipY);
    ctx.lineTo(rKneeX, rKneeY);
    ctx.stroke();

    ctx.strokeStyle = pCol;
    ctx.lineWidth = 15;
    const rAnkleX = rKneeX + Math.sin(rearLegAngle + rearKneeAngle) * 56;
    const rAnkleY = rKneeY + Math.cos(rearLegAngle + rearKneeAngle) * 56;
    ctx.beginPath();
    ctx.moveTo(rKneeX, rKneeY);
    ctx.lineTo(rAnkleX, rAnkleY);
    ctx.stroke();

    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.ellipse(rAnkleX + 6, rAnkleY + 3, 16, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 3. TORSO, GI & BELT
    ctx.save();
    ctx.fillStyle = sCol;
    ctx.beginPath();
    ctx.moveTo(-22, hipY);
    ctx.lineTo(24, hipY);
    ctx.lineTo(28, hipY - 80);
    ctx.lineTo(-24, hipY - 80);
    ctx.closePath();
    ctx.fill();

    // Gi Trim / Vest Accent
    ctx.strokeStyle = pCol;
    ctx.lineWidth = 5;
    ctx.stroke();

    // Martial Arts Sash / Belt
    ctx.fillStyle = aCol;
    ctx.fillRect(-22, hipY - 10, 46, 12);
    ctx.beginPath();
    ctx.moveTo(-4, hipY - 2);
    ctx.lineTo(-12 + Math.sin(animTime * 4) * 4, hipY + 38);
    ctx.lineTo(0, hipY + 34);
    ctx.closePath();
    ctx.fill();

    // Pauldrons / Heavy Shoulder Armor (Titan, Frost, Terra)
    if (profile.id === 'TITAN' || profile.id === 'FROST' || profile.id === 'TERRA') {
      ctx.fillStyle = aCol;
      ctx.beginPath();
      ctx.arc(-24, hipY - 78, 14, 0, Math.PI * 2);
      ctx.arc(28, hipY - 78, 14, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // 4. LEAD LEG
    ctx.save();
    ctx.strokeStyle = sCol;
    ctx.lineWidth = 19;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    const lHipX = 12, lHipY = hipY;
    const lKneeX = lHipX + Math.sin(leadLegAngle) * 56;
    const lKneeY = lHipY + Math.cos(leadLegAngle) * 56;
    ctx.beginPath();
    ctx.moveTo(lHipX, lHipY);
    ctx.lineTo(lKneeX, lKneeY);
    ctx.stroke();

    ctx.strokeStyle = pCol;
    ctx.lineWidth = 16;
    const lAnkleX = lKneeX + Math.sin(leadLegAngle + leadKneeAngle) * 58;
    const lAnkleY = lKneeY + Math.cos(leadLegAngle + leadKneeAngle) * 58;
    ctx.beginPath();
    ctx.moveTo(lKneeX, lKneeY);
    ctx.lineTo(lAnkleX, lAnkleY);
    ctx.stroke();

    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.ellipse(lAnkleX + 8, lAnkleY + 4, 18, 9, 0, 0, Math.PI * 2);
    ctx.fill();

    // High Kick Shockwave Trail
    if (state === 'KICK_HIGH' || state === 'KICK_FRONT') {
      ctx.strokeStyle = auraCol;
      ctx.lineWidth = 8;
      ctx.shadowColor = auraCol;
      ctx.shadowBlur = 20;
      ctx.beginPath();
      ctx.arc(lAnkleX, lAnkleY, 52, -Math.PI * 0.4, Math.PI * 0.5);
      ctx.stroke();
    }
    ctx.restore();

    // 5. HEAD, HAIR & ACCESSORIES
    ctx.save();
    const headX = 2, headY = hipY - 105;

    // Neck
    ctx.fillStyle = skinCol;
    ctx.fillRect(headX - 6, headY + 12, 12, 16);

    // Face
    ctx.fillStyle = skinCol;
    ctx.beginPath();
    ctx.arc(headX, headY, 17, 0, Math.PI * 2);
    ctx.fill();

    // Anime Eye
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(headX + 5, headY - 4, 7, 4);
    ctx.fillStyle = auraCol;
    ctx.fillRect(headX + 8, headY - 3, 4, 3);

    // Unique Fighter Headgear / Hair
    if (profile.id === 'RONIN') {
      // Traditional Straw Hat (Kasa)
      ctx.fillStyle = '#b45309';
      ctx.beginPath();
      ctx.moveTo(headX - 38, headY - 6);
      ctx.lineTo(headX + 38, headY - 6);
      ctx.lineTo(headX, headY - 26);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#fef3c7';
      ctx.lineWidth = 2;
      ctx.stroke();
    } else if (profile.id === 'SHADOW' || profile.id === 'PHANTOM') {
      // Ninja Cowl & Mask
      ctx.fillStyle = sCol;
      ctx.beginPath();
      ctx.arc(headX - 2, headY - 2, 21, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = pCol;
      ctx.fillRect(headX + 2, headY + 1, 14, 12);
    } else if (profile.id === 'REAPER') {
      // Grim Hood
      ctx.fillStyle = '#09090b';
      ctx.beginPath();
      ctx.arc(headX - 2, headY - 4, 23, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(headX + 6, headY - 2, 6, 3);
    } else {
      // Dynamic Anime Hair
      ctx.fillStyle = hairCol;
      ctx.beginPath();
      ctx.arc(headX - 2, headY - 5, 18, Math.PI * 0.7, Math.PI * 2.2);
      ctx.lineTo(headX + 20, headY - 16);
      ctx.lineTo(headX + 8, headY - 24);
      ctx.lineTo(headX - 6, headY - 26);
      ctx.lineTo(headX - 18, headY - 18);
      ctx.closePath();
      ctx.fill();

      // Kai's Flowing Martial Headband
      if (profile.id === 'KAI') {
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(headX - 15, headY - 8, 30, 6);
        ctx.beginPath();
        ctx.moveTo(headX - 15, headY - 5);
        ctx.lineTo(headX - 40 + Math.sin(animTime * 6) * 6, headY - 12);
        ctx.lineTo(headX - 15, headY - 1);
        ctx.closePath();
        ctx.fill();
      }
    }

    // Aether Solar Halo
    if (profile.id === 'AETHER') {
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 4;
      ctx.shadowColor = '#fbbf24';
      ctx.shadowBlur = 16;
      ctx.beginPath();
      ctx.arc(headX, headY - 10, 42, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();

    // 6. LEAD ARM & WEAPON
    ctx.save();
    ctx.strokeStyle = sCol;
    ctx.lineWidth = 16;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    const lShoulderX = 14, lShoulderY = hipY - 72;
    const lElbowX = lShoulderX + Math.sin(leadArmAngle) * 38;
    const lElbowY = lShoulderY + Math.cos(leadArmAngle) * 38;
    ctx.beginPath();
    ctx.moveTo(lShoulderX, lShoulderY);
    ctx.lineTo(lElbowX, lElbowY);
    ctx.stroke();

    ctx.strokeStyle = skinCol;
    ctx.lineWidth = 13;
    const lWristX = lElbowX + Math.sin(leadArmAngle + leadElbowAngle) * 34;
    const lWristY = lElbowY + Math.cos(leadArmAngle + leadElbowAngle) * 34;
    ctx.beginPath();
    ctx.moveTo(lElbowX, lElbowY);
    ctx.lineTo(lWristX, lWristY);
    ctx.stroke();

    ctx.fillStyle = pCol;
    ctx.beginPath();
    ctx.arc(lWristX, lWristY, 9, 0, Math.PI * 2);
    ctx.fill();

    // Signature Weapons
    if (profile.id === 'RONIN') {
      // Katana with Golden Guard & Curved Blade
      ctx.save();
      ctx.translate(lWristX, lWristY);
      ctx.rotate(state === 'PUNCH_RIGHT' || state === 'PUNCH_HEAVY' || state === 'SPECIAL' ? -0.2 : 0.8);
      ctx.strokeStyle = '#b91c1c';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(-14, 8);
      ctx.stroke();
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(-2, -4, 5, 10);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 4;
      ctx.shadowColor = '#00e5ff';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(75, -12);
      ctx.stroke();
      ctx.restore();
    } else if (profile.id === 'FROST') {
      // Dual Cryo Blades
      ctx.save();
      ctx.translate(lWristX, lWristY);
      ctx.rotate(0.3);
      ctx.fillStyle = 'rgba(0, 229, 255, 0.85)';
      ctx.shadowColor = '#00e5ff';
      ctx.shadowBlur = 15;
      ctx.beginPath();
      ctx.moveTo(0, -6);
      ctx.lineTo(55, 0);
      ctx.lineTo(0, 6);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    } else if (profile.id === 'PHANTOM' || profile.id === 'SHADOW') {
      // Kunai / Void Daggers
      ctx.save();
      ctx.translate(lWristX, lWristY);
      ctx.rotate(0.4);
      ctx.fillStyle = auraCol;
      ctx.shadowColor = auraCol;
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.moveTo(-6, -4);
      ctx.lineTo(36, 0);
      ctx.lineTo(-6, 4);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    } else if (profile.id === 'VIPER') {
      // Venom Whip
      ctx.save();
      ctx.translate(lWristX, lWristY);
      ctx.strokeStyle = '#22c55e';
      ctx.lineWidth = 4;
      ctx.shadowColor = '#d946ef';
      ctx.shadowBlur = 14;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.bezierCurveTo(25, -20, 50, 25, 75, -10);
      ctx.stroke();
      ctx.restore();
    }

    // Strike / Punch Impact Shockwave
    if (state === 'PUNCH_LEFT' || state === 'PUNCH_RIGHT' || state === 'PUNCH_HEAVY' || state === 'SPECIAL') {
      ctx.strokeStyle = auraCol;
      ctx.lineWidth = 5;
      ctx.shadowColor = auraCol;
      ctx.shadowBlur = 24;
      ctx.beginPath();
      ctx.arc(lWristX + 20, lWristY, 32, -Math.PI * 0.6, Math.PI * 0.6);
      ctx.stroke();
    }

    // Block Guard Energy Shield (Anime Hexagonal Barrier)
    if (state === 'BLOCK') {
      ctx.strokeStyle = auraCol;
      ctx.lineWidth = 4;
      ctx.shadowColor = auraCol;
      ctx.shadowBlur = 18;
      ctx.beginPath();
      ctx.arc(35, hipY - 50, 52, -Math.PI * 0.45, Math.PI * 0.45);
      ctx.stroke();
      ctx.fillStyle = auraCol + '33';
      ctx.fill();
    }

    ctx.restore();
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
    const isP1 = id === 'P1';
    const rawId = (fighterId || (isP1 ? 'KAI' : 'SHADOW')).toUpperCase() as FighterId;
    const profile = ROSTER_FIGHTERS[rawId] || ROSTER_FIGHTERS[isP1 ? 'KAI' : 'SHADOW'];

    this.drawKinematicMartialFighter(
      ctx,
      x,
      y,
      facing,
      state,
      animTime,
      profile,
      superMeter,
      isHitFlashing,
      isP1
    );
  }
}
