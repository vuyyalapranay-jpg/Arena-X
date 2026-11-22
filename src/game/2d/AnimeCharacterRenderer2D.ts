// src/game/2d/AnimeCharacterRenderer2D.ts
import { FighterState, PlayerId } from '../../types';

export interface FighterAppearance {
  name: string;
  isP1: boolean;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  emissiveColor: string;
  skinColor: string;
  hairColor: string;
}

export class AnimeCharacterRenderer2D {
  public static renderFighter(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    state: FighterState,
    facing: 1 | -1,
    animTime: number,
    appearance: FighterAppearance,
    superMeter = 100,
    isHitFlashing = false
  ): void {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(facing, 1);

    // Hit Flash (Pure white or yellow flash on impact)
    if (isHitFlashing) {
      ctx.filter = 'brightness(2.5) drop-shadow(0 0 15px #ffffff)';
    }

    // 1. Dynamic Drop Shadow on ground
    const shadowScale = Math.max(0.3, 1 - Math.max(0, -y + 560) / 400);
    ctx.save();
    ctx.fillStyle = 'rgba(5, 7, 12, 0.65)';
    ctx.beginPath();
    ctx.ellipse(0, 0, 52 * shadowScale, 14 * shadowScale, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 2. High Super Meter Aura (Subtle anime flaming aura when super is ready)
    if (superMeter >= 100) {
      this.drawSuperAura(ctx, animTime, appearance);
    }

    // 3. Render Anime Character Body Parts according to state
    this.drawAnimeBody(ctx, state, animTime, appearance);

    // 4. Render State-specific Visual Effects (Slashes, Shields, Trails)
    this.drawActionVFX(ctx, state, animTime, appearance);

    ctx.restore();
  }

  private static drawSuperAura(ctx: CanvasRenderingContext2D, time: number, app: FighterAppearance): void {
    ctx.save();
    ctx.globalAlpha = 0.28 + Math.sin(time * 6) * 0.12;
    const auraGrad = ctx.createRadialGradient(0, -90, 20, 0, -90, 110);
    auraGrad.addColorStop(0, app.emissiveColor);
    auraGrad.addColorStop(0.5, app.primaryColor);
    auraGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = auraGrad;
    ctx.beginPath();
    ctx.ellipse(0, -90, 75, 105, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  private static drawAnimeBody(
    ctx: CanvasRenderingContext2D,
    state: FighterState,
    t: number,
    app: FighterAppearance
  ): void {
    // Determine joint poses and body offsets based on state and animation time
    let hipY = -92;
    let hipX = 0;
    let torsoAngle = 0;
    let headAngle = 0;

    let lLegAngle = 0.15;
    let rLegAngle = -0.25;
    let lKneeAngle = 0.3;
    let rKneeAngle = 0.25;

    let lArmAngle = -0.4;
    let rArmAngle = 0.5;
    let lForearmAngle = -1.1;
    let rForearmAngle = 0.9;

    const breathe = Math.sin(t * 3.5);

    // Posing state machine
    switch (state) {
      case 'IDLE':
        hipY = -92 + breathe * 2.5;
        torsoAngle = 0.05 + breathe * 0.02;
        lLegAngle = 0.25;
        rLegAngle = -0.32;
        lKneeAngle = 0.35;
        rKneeAngle = 0.40;
        lArmAngle = -0.65;
        lForearmAngle = -1.25; // Guard chin
        rArmAngle = 0.55;
        rForearmAngle = 1.15;  // Guard ribs
        break;

      case 'WALK_FWD':
        hipY = -92 + Math.abs(Math.sin(t * 8)) * 4;
        hipX = Math.sin(t * 8) * 4;
        lLegAngle = Math.sin(t * 8) * 0.65;
        rLegAngle = -Math.sin(t * 8) * 0.65;
        lKneeAngle = Math.max(0, -lLegAngle);
        rKneeAngle = Math.max(0, -rLegAngle);
        lArmAngle = -Math.sin(t * 8) * 0.55 - 0.2;
        rArmAngle = Math.sin(t * 8) * 0.55 + 0.2;
        break;

      case 'WALK_BWD':
        hipY = -92 + Math.abs(Math.sin(t * 7)) * 3;
        torsoAngle = -0.12; // Leaning back defensively
        lLegAngle = -Math.sin(t * 7) * 0.5;
        rLegAngle = Math.sin(t * 7) * 0.5;
        break;

      case 'RUN':
        hipY = -84 + Math.abs(Math.sin(t * 14)) * 6;
        torsoAngle = 0.42; // Aggressive forward tilt
        lLegAngle = Math.sin(t * 14) * 0.95;
        rLegAngle = -Math.sin(t * 14) * 0.95;
        lArmAngle = -Math.sin(t * 14) * 0.9;
        rArmAngle = Math.sin(t * 14) * 0.9;
        break;

      case 'CROUCH':
        hipY = -62; // Deep defensive squat
        torsoAngle = 0.28;
        lLegAngle = 0.85;
        rLegAngle = -0.75;
        lKneeAngle = 1.45;
        rKneeAngle = 1.40;
        lArmAngle = -0.85;
        lForearmAngle = -1.5; // Tucked guard
        rArmAngle = 0.4;
        rForearmAngle = 1.4;
        break;

      case 'JUMP':
        hipY = -115;
        lLegAngle = 0.35;
        rLegAngle = 0.55;
        lKneeAngle = 1.1;
        rKneeAngle = 0.9;
        lArmAngle = -1.1;
        rArmAngle = -0.8;
        break;

      case 'FALL':
        hipY = -105;
        lLegAngle = -0.2;
        rLegAngle = 0.4;
        lKneeAngle = 0.4;
        rKneeAngle = 0.7;
        break;

      case 'LAND':
        hipY = -68;
        torsoAngle = 0.35;
        lLegAngle = 0.75;
        rLegAngle = -0.65;
        lKneeAngle = 1.3;
        rKneeAngle = 1.25;
        break;

      case 'PUNCH_LEFT': // Lead Jab
        torsoAngle = 0.18;
        lArmAngle = 0.1;
        lForearmAngle = 0.05; // Full horizontal punch extension
        rArmAngle = 0.6;
        rForearmAngle = 1.35; // Guarding ribs
        break;

      case 'PUNCH_RIGHT': // Straight Cross
        torsoAngle = 0.38;
        hipX = 14;
        rArmAngle = 0.2;
        rForearmAngle = 0.05; // Deep thrusting straight punch
        lArmAngle = -0.7;
        lForearmAngle = -1.3;
        lLegAngle = 0.45;
        rLegAngle = -0.55;
        break;

      case 'PUNCH_HEAVY': // Leaping Overhead Hammer Smash
        hipY = -105 + Math.sin(Math.min(1, t / 0.35) * Math.PI) * 25;
        torsoAngle = 0.45;
        rArmAngle = -1.4 + Math.min(1, t / 0.25) * 2.2; // Overhead slam down
        rForearmAngle = 0.2;
        lArmAngle = -0.6;
        break;

      case 'KICK_FRONT': // Front Snap Kick
        torsoAngle = -0.25; // Counter balance
        lLegAngle = -0.15;
        rLegAngle = 1.45;   // Extended high front kick
        rKneeAngle = 0.1;
        lArmAngle = -0.7;
        rArmAngle = 0.45;
        break;

      case 'KICK_HIGH': // Crescent Roundhouse Kick
        torsoAngle = -0.45;
        hipX = 8;
        lLegAngle = -0.35;
        rLegAngle = 1.65;   // High 120° roundhouse kick
        rKneeAngle = 0.15;
        lArmAngle = -1.1;
        rArmAngle = 0.3;
        break;

      case 'KICK_LOW': // Shin Sweep
        hipY = -52; // Very low to floor
        torsoAngle = 0.4;
        lLegAngle = -0.8;
        lKneeAngle = 1.5;
        rLegAngle = 1.55;   // Sweeping out along ground
        rKneeAngle = 0.1;
        break;

      case 'BLOCK':
        torsoAngle = -0.15; // Braced back
        lArmAngle = -0.75;
        lForearmAngle = -1.45;
        rArmAngle = -0.55;
        rForearmAngle = -1.40; // Both arms crossed in front of head/chest
        lLegAngle = 0.45;
        rLegAngle = -0.55;
        lKneeAngle = 0.7;
        rKneeAngle = 0.65;
        break;

      case 'HIT_STAGGER':
        hipY = -88;
        torsoAngle = -0.38; // Head thrown back
        headAngle = -0.45;
        lArmAngle = -0.85;
        rArmAngle = -0.65;
        lLegAngle = -0.2;
        rLegAngle = -0.45;
        break;

      case 'KNOCKBACK':
        hipY = -110;
        torsoAngle = -0.75;
        lLegAngle = -0.6;
        rLegAngle = 0.4;
        lArmAngle = -1.2;
        rArmAngle = -1.4;
        break;

      case 'VICTORY':
        hipY = -94;
        torsoAngle = 0.05;
        lArmAngle = -0.45;
        lForearmAngle = -1.3;
        rArmAngle = 0.35;
        rForearmAngle = 1.2;
        break;

      case 'DEFEAT':
        hipY = -35; // Collapsed on knees
        torsoAngle = 0.65;
        headAngle = 0.55;
        lLegAngle = 1.2;
        rLegAngle = 1.1;
        lKneeAngle = 1.6;
        rKneeAngle = 1.5;
        lArmAngle = 0.4;
        rArmAngle = 0.5;
        break;
    }

    // ==============================================================
    // 1. BACK LEG (Drawn first behind torso)
    // ==============================================================
    this.drawLeg(ctx, hipX - 6, hipY + 12, rLegAngle, rKneeAngle, app, false);

    // ==============================================================
    // 2. BACK ARM (Drawn behind torso)
    // ==============================================================
    this.drawArm(ctx, hipX - 12, hipY - 34, rArmAngle, rForearmAngle, app, false);

    // ==============================================================
    // 3. TORSO & WAIST SASH
    // ==============================================================
    this.drawTorso(ctx, hipX, hipY, torsoAngle, app);

    // ==============================================================
    // 4. FRONT LEG
    // ==============================================================
    this.drawLeg(ctx, hipX + 8, hipY + 12, lLegAngle, lKneeAngle, app, true);

    // ==============================================================
    // 5. ANIME HEAD & HAIRSTYLE
    // ==============================================================
    this.drawHead(ctx, hipX + Math.sin(torsoAngle) * 44, hipY - 48, headAngle + torsoAngle * 0.5, app, t);

    // ==============================================================
    // 6. FRONT ARM (Drawn in front of torso)
    // ==============================================================
    this.drawArm(ctx, hipX + 12, hipY - 34, lArmAngle, lForearmAngle, app, true);
  }

  private static drawTorso(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    angle: number,
    app: FighterAppearance
  ): void {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);

    // Muscular Bare Chest / Dark Undershirt
    ctx.fillStyle = app.skinColor;
    ctx.beginPath();
    ctx.moveTo(-16, -42);
    ctx.lineTo(16, -42);
    ctx.lineTo(12, 0);
    ctx.lineTo(-12, 0);
    ctx.closePath();
    ctx.fill();

    // Defined Pectorals and Abdomen lines
    ctx.strokeStyle = 'rgba(150, 80, 50, 0.45)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    // Pecs
    ctx.moveTo(-12, -30);
    ctx.quadraticCurveTo(0, -25, 12, -30);
    // Abs
    ctx.moveTo(0, -25);
    ctx.lineTo(0, -6);
    ctx.moveTo(-8, -16);
    ctx.lineTo(8, -16);
    ctx.moveTo(-7, -8);
    ctx.lineTo(7, -8);
    ctx.stroke();

    // Martial Arts Gi / Combat Vest (Sleeveless, open collar)
    ctx.fillStyle = app.primaryColor;
    // Left vest flap
    ctx.beginPath();
    ctx.moveTo(-18, -44);
    ctx.lineTo(-6, -44);
    ctx.lineTo(-10, -8);
    ctx.lineTo(-18, -4);
    ctx.closePath();
    ctx.fill();

    // Right vest flap
    ctx.beginPath();
    ctx.moveTo(18, -44);
    ctx.lineTo(6, -44);
    ctx.lineTo(10, -8);
    ctx.lineTo(18, -4);
    ctx.closePath();
    ctx.fill();

    // Gold / Dark Trim on vest lapel
    ctx.strokeStyle = app.accentColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-18, -44);
    ctx.lineTo(-6, -44);
    ctx.lineTo(-10, -8);
    ctx.moveTo(18, -44);
    ctx.lineTo(6, -44);
    ctx.lineTo(10, -8);
    ctx.stroke();

    // Waist Belt Sash with flying cloth tails
    ctx.fillStyle = app.isP1 ? '#a01228' : '#0a3278';
    ctx.fillRect(-15, -4, 30, 8);
    ctx.fillStyle = app.accentColor;
    ctx.fillRect(-6, -3, 12, 6); // Buckle

    // Trailing sash cloth fluttering
    ctx.fillStyle = app.primaryColor;
    ctx.beginPath();
    ctx.moveTo(-4, 4);
    ctx.quadraticCurveTo(-14, 18, -20, 36);
    ctx.lineTo(-12, 38);
    ctx.quadraticCurveTo(-6, 20, 2, 4);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }

  private static drawHead(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    angle: number,
    app: FighterAppearance,
    time: number
  ): void {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);

    // Athletic jawline & face
    ctx.fillStyle = app.skinColor;
    ctx.beginPath();
    ctx.moveTo(0, -18);
    ctx.quadraticCurveTo(15, -15, 14, 2);
    ctx.quadraticCurveTo(8, 16, 2, 19); // Chin
    ctx.quadraticCurveTo(-10, 14, -13, 2);
    ctx.quadraticCurveTo(-14, -15, 0, -18);
    ctx.closePath();
    ctx.fill();

    // Fierce Anime Eye (Sharp fighting gaze)
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(3, -2);
    ctx.lineTo(13, -3);
    ctx.lineTo(11, 4);
    ctx.lineTo(4, 3);
    ctx.closePath();
    ctx.fill();

    // Glowing Iris (Crimson for Kai, Electric Cyan for Zen)
    ctx.fillStyle = app.emissiveColor;
    ctx.beginPath();
    ctx.arc(8, 0, 2.5, 0, Math.PI * 2);
    ctx.fill();

    // Sharp eyebrow
    ctx.strokeStyle = '#111';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(2, -6);
    ctx.lineTo(14, -4);
    ctx.stroke();

    // Determined mouth line
    ctx.beginPath();
    ctx.moveTo(3, 11);
    ctx.lineTo(9, 10);
    ctx.stroke();

    // ==============================================================
    // SPIKY ANIME HAIRSTYLE & HEADBAND
    // ==============================================================
    if (app.isP1) {
      // KAI: Red combat headband
      ctx.fillStyle = '#ff1a4b';
      ctx.fillRect(-14, -13, 28, 6);

      // Trailing headband tails floating back
      const sway = Math.sin(time * 8) * 8;
      ctx.beginPath();
      ctx.moveTo(-12, -10);
      ctx.quadraticCurveTo(-28, -8 + sway, -44, -18 + sway);
      ctx.lineTo(-40, -12 + sway);
      ctx.quadraticCurveTo(-26, -4 + sway, -12, -6);
      ctx.closePath();
      ctx.fill();

      // Spiky Anime Hair (Jet black with fiery crimson fringe)
      ctx.fillStyle = app.hairColor;
      ctx.beginPath();
      ctx.moveTo(-14, -10);
      ctx.lineTo(-24, -28); // Spikes
      ctx.lineTo(-12, -22);
      ctx.lineTo(-8, -38);
      ctx.lineTo(0, -25);
      ctx.lineTo(12, -36);
      ctx.lineTo(10, -20);
      ctx.lineTo(20, -26);
      ctx.lineTo(14, -8);
      ctx.lineTo(8, -12);
      ctx.closePath();
      ctx.fill();

      // Front Anime Fringe/Bangs covering forehead
      ctx.fillStyle = '#ff2b55'; // Crimson fringe tip
      ctx.beginPath();
      ctx.moveTo(-2, -14);
      ctx.lineTo(4, 2);
      ctx.lineTo(7, -8);
      ctx.lineTo(11, 0);
      ctx.lineTo(13, -12);
      ctx.closePath();
      ctx.fill();
    } else {
      // ZEN: Silver Forehead Protector Plate
      ctx.fillStyle = '#101a2e';
      ctx.fillRect(-14, -13, 28, 6);
      ctx.fillStyle = '#d0d8e8'; // Metallic plate
      ctx.fillRect(-4, -14, 16, 7);
      ctx.strokeStyle = '#223355';
      ctx.lineWidth = 1;
      ctx.strokeRect(-4, -14, 16, 7);

      // Dark navy flowing ninja hair
      ctx.fillStyle = app.hairColor;
      ctx.beginPath();
      ctx.moveTo(-14, -10);
      ctx.lineTo(-20, -24);
      ctx.lineTo(-10, -20);
      ctx.lineTo(-4, -36);
      ctx.lineTo(4, -22);
      ctx.lineTo(14, -34);
      ctx.lineTo(12, -18);
      ctx.lineTo(18, -22);
      ctx.lineTo(14, -8);
      ctx.closePath();
      ctx.fill();

      // Sleek side bangs
      ctx.fillStyle = '#00c8ff';
      ctx.beginPath();
      ctx.moveTo(3, -13);
      ctx.lineTo(7, 3);
      ctx.lineTo(9, -7);
      ctx.lineTo(12, 1);
      ctx.lineTo(14, -11);
      ctx.closePath();
      ctx.fill();
    }

    ctx.restore();
  }

  private static drawArm(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    shoulderAngle: number,
    elbowAngle: number,
    app: FighterAppearance,
    isFront: boolean
  ): void {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(shoulderAngle);

    // 1. Upper Arm (Biceps / Triceps)
    ctx.fillStyle = isFront ? app.skinColor : '#b57852'; // Slightly darker for back arm
    ctx.beginPath();
    ctx.ellipse(0, 14, 7, 16, 0, 0, Math.PI * 2);
    ctx.fill();

    // Shoulder strap/pad
    ctx.fillStyle = app.primaryColor;
    ctx.fillRect(-6, -4, 12, 8);

    // 2. Forearm
    ctx.translate(0, 26);
    ctx.rotate(elbowAngle);

    // Forearm muscle
    ctx.fillStyle = isFront ? app.skinColor : '#b57852';
    ctx.beginPath();
    ctx.ellipse(0, 14, 6, 14, 0, 0, Math.PI * 2);
    ctx.fill();

    // Combat Bracer / Forearm Wraps
    ctx.fillStyle = app.isP1 ? '#a81328' : '#0b2a66';
    ctx.fillRect(-6, 6, 12, 16);
    ctx.strokeStyle = app.accentColor;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(-6, 6, 12, 16);

    // 3. Fist with MMA Combat Glove
    ctx.translate(0, 22);
    ctx.fillStyle = app.isP1 ? '#ff1a4b' : '#0088ff';
    ctx.beginPath();
    ctx.arc(0, 5, 8, 0, Math.PI * 2);
    ctx.fill();

    // Metal knuckles / studs
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(4, 5, 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  private static drawLeg(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    hipAngle: number,
    kneeAngle: number,
    app: FighterAppearance,
    isFront: boolean
  ): void {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(hipAngle);

    // 1. Thigh (Baggy martial arts pants)
    ctx.fillStyle = isFront ? app.secondaryColor : '#090c14';
    ctx.beginPath();
    ctx.ellipse(0, 18, 11, 20, 0, 0, Math.PI * 2);
    ctx.fill();

    // Colored vertical racing stripe on trousers
    ctx.fillStyle = app.primaryColor;
    ctx.fillRect(-2, 4, 4, 30);

    // 2. Lower Leg (Calf & Shin)
    ctx.translate(0, 36);
    ctx.rotate(kneeAngle);

    ctx.fillStyle = isFront ? app.secondaryColor : '#090c14';
    ctx.beginPath();
    ctx.ellipse(0, 16, 9, 18, 0, 0, Math.PI * 2);
    ctx.fill();

    // Shin Armor Plate / Shin Straps
    ctx.fillStyle = app.isP1 ? '#800e20' : '#081f4a';
    ctx.fillRect(-7, 8, 14, 18);
    ctx.strokeStyle = app.accentColor;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(-7, 8, 14, 18);

    // 3. Combat Boots
    ctx.translate(0, 32);
    ctx.fillStyle = app.isP1 ? '#c81b36' : '#0a3a8a';
    ctx.beginPath();
    ctx.moveTo(-8, -4);
    ctx.lineTo(8, -4);
    ctx.lineTo(14, 12);
    ctx.lineTo(-8, 12);
    ctx.closePath();
    ctx.fill();

    // Steel toe cap
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(8, 6, 6, 6);

    ctx.restore();
  }

  private static drawActionVFX(
    ctx: CanvasRenderingContext2D,
    state: FighterState,
    time: number,
    app: FighterAppearance
  ): void {
    // 1. Block Energy Barrier
    if (state === 'BLOCK') {
      ctx.save();
      ctx.translate(28, -75);
      const shieldGrad = ctx.createRadialGradient(0, 0, 10, 0, 0, 65);
      shieldGrad.addColorStop(0, 'rgba(255, 255, 255, 0.85)');
      shieldGrad.addColorStop(0.4, app.emissiveColor);
      shieldGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = shieldGrad;
      ctx.beginPath();
      ctx.ellipse(0, 0, 22, 65, 0, 0, Math.PI * 2);
      ctx.fill();

      // Hexagonal anime energy barrier lines
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(0, 0, 52, -Math.PI / 2.3, Math.PI / 2.3);
      ctx.stroke();
      ctx.restore();
    }

    // 2. High Kick Crescent Arc (Neon sweeping slash curve)
    if (state === 'KICK_HIGH') {
      ctx.save();
      ctx.translate(20, -85);
      ctx.strokeStyle = app.emissiveColor;
      ctx.lineWidth = 8;
      ctx.shadowColor = app.emissiveColor;
      ctx.shadowBlur = 18;
      ctx.beginPath();
      ctx.arc(0, 0, 75, -Math.PI / 2, Math.PI / 3);
      ctx.stroke();

      // Inner white core
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.restore();
    }

    // 3. Heavy Punch Dragon Shockwave
    if (state === 'PUNCH_HEAVY') {
      ctx.save();
      ctx.translate(45, -75);
      const blastGrad = ctx.createRadialGradient(0, 0, 5, 0, 0, 55);
      blastGrad.addColorStop(0, '#ffffff');
      blastGrad.addColorStop(0.3, app.emissiveColor);
      blastGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = blastGrad;
      ctx.beginPath();
      ctx.arc(0, 0, 55, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }
}
