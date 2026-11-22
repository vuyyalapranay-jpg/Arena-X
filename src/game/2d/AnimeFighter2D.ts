// src/game/2d/AnimeFighter2D.ts
// PHASE 3 ANIME FIGHTER WITH DEDICATED ANIMATION CONTROLLER & SYNCHRONIZED COMBAT

import { AttackType, FighterInputs, FighterState, FighterStats, PlayerId } from '../../types';
import { SpriteCharacterRenderer2D } from './SpriteCharacterRenderer2D';
import { Projectile2D } from './Projectile2D';
import { soundManager } from '../core/SoundManager';
import { AnimationController } from '../animation/AnimationController';
import { CharacterAnimationSet, P1_ANIMATIONS, P2_ANIMATIONS } from '../animation/AnimationConfig';

export interface Hitbox2D {
  x: number;
  y: number;
  radius: number;
  damage: number;
  knockback: number;
  type: AttackType | 'SPECIAL' | 'ULTIMATE';
}

export interface Hurtbox2D {
  x: number;
  y: number;
  width: number;
  height: number;
}

export class AnimeFighter2D {
  public id: PlayerId;
  public name: string;
  public appearance: {
    name: string;
    isP1: boolean;
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
    emissiveColor: string;
    skinColor: string;
    hairColor: string;
  };

  // 2D World Coordinates (Floor at groundY = 560)
  public x: number;
  public readonly groundY = 560;
  public jumpOffsetY = 0; // Negative when airborne, 0 when grounded
  public vx = 0;
  public vy = 0;
  public facing: 1 | -1;

  public get y(): number {
    return this.groundY + this.jumpOffsetY;
  }

  public set y(val: number) {
    this.jumpOffsetY = val - this.groundY;
  }

  public state: FighterState = 'IDLE';
  public currentHealth = 100;
  public maxHealth = 100;
  public superMeter = 0; // 0 to 100
  public roundsWon = 0;
  public isGrounded = true;

  // Dedicated Phase 3 Animation Controller
  public animController: AnimationController;

  // Combat Timers & Attack State
  public currentAttackType: AttackType | 'SPECIAL' | 'ULTIMATE' | null = null;
  public attackTimer = 0;
  public attackDuration = 0;
  public hasHitCurrentAttack = false;
  public comboStep = 0;
  public lastAttackTime = 0;

  public hitStunTimer = 0;
  public hitFlashTimer = 0;
  public animTime = 0;

  // Projectile spawned by special attack
  public pendingProjectile: Projectile2D | null = null;

  // Constants
  public readonly floorY = 560;
  public readonly minX = 280;
  public readonly maxX = 2120;
  public readonly gravity = 1800; // px / s^2
  public readonly jumpImpulse = -780; // px / s
  public readonly walkSpeed = 280;
  public readonly runSpeed = 480;

  constructor(id: PlayerId, spawnX: number, facing: 1 | -1) {
    this.id = id;
    this.x = spawnX;
    this.jumpOffsetY = 0;
    this.facing = facing;

    const isP1 = id === 'P1';
    this.name = isP1 ? 'KAI' : 'SHADOW';
    this.appearance = {
      name: this.name,
      isP1,
      primaryColor: isP1 ? '#00b4ff' : '#ff1a4b',
      secondaryColor: isP1 ? '#11131a' : '#0a101d',
      accentColor: isP1 ? '#00f0ff' : '#ff3366',
      emissiveColor: isP1 ? '#00d9ff' : '#ff003c',
      skinColor: isP1 ? '#df9e78' : '#d29672',
      hairColor: isP1 ? '#141416' : '#f0f0f5',
    };

    // Initialize Animation Controller with character-specific animations
    this.animController = new AnimationController(isP1 ? P1_ANIMATIONS : P2_ANIMATIONS);
  }

  public reset(spawnX: number, facing: 1 | -1): void {
    this.x = spawnX;
    this.jumpOffsetY = 0;
    this.vx = 0;
    this.vy = 0;
    this.facing = facing;
    this.state = 'IDLE';
    this.currentHealth = this.maxHealth;
    this.superMeter = 0;
    this.isGrounded = true;
    this.currentAttackType = null;
    this.attackTimer = 0;
    this.hasHitCurrentAttack = false;
    this.hitStunTimer = 0;
    this.hitFlashTimer = 0;
    this.animTime = 0;
    this.pendingProjectile = null;
    this.animController.play('idle', true);
  }

  public handleInput(inputs: FighterInputs, opponent: AnimeFighter2D): void {
    // Cannot act while stunned, knocked down, or defeated
    if (
      this.state === 'HIT_STAGGER' ||
      this.state === 'KNOCKBACK' ||
      this.state === 'DEFEAT' ||
      this.state === 'VICTORY'
    ) {
      return;
    }

    // Auto-facing: turn towards opponent unless performing an attack
    if (this.currentAttackType === null) {
      const dirToOpponent = opponent.x > this.x ? 1 : -1;
      if (this.facing !== dirToOpponent) {
        this.facing = dirToOpponent;
      }
    }

    // If an attack is actively executing, cannot interrupt with basic movement
    if (this.currentAttackType !== null) {
      return;
    }

    const now = performance.now();

    // 1. COMBAT ATTACKS (Punching)
    if (inputs.punch && this.isGrounded) {
      if (inputs.crouch) {
        // Uppercut
        this.startAttack('PUNCH_HEAVY', 'uppercut');
      } else if (
        (inputs.moveRight && this.facing === 1) ||
        (inputs.moveLeft && this.facing === -1)
      ) {
        // Heavy Straight Forward Punch (Kyo Flame Strike)
        this.startAttack('PUNCH_HEAVY', 'punchHeavy');
      } else {
        // Light Jab
        this.startAttack('PUNCH_LEFT', 'punchLight');
      }
      this.lastAttackTime = now;
      soundManager.playPunchWhoosh();
      return;
    }

    // 2. COMBAT ATTACKS (Kicking)
    if (inputs.kick && this.isGrounded) {
      if (inputs.crouch) {
        // Low Shin Sweep
        this.startAttack('KICK_LOW', 'kickLow');
      } else if (
        (inputs.moveRight && this.facing === 1) ||
        (inputs.moveLeft && this.facing === -1)
      ) {
        // High Crescent Roundhouse Kick (180° shockwave)
        this.startAttack('KICK_HIGH', 'kickHigh');
      } else {
        // Light Front Snap Kick
        this.startAttack('KICK_FRONT', 'kickLight');
      }
      this.lastAttackTime = now;
      soundManager.playPunchWhoosh();
      return;
    }

    // 3. DEFENSIVE GUARD (Block)
    if (inputs.block && this.isGrounded) {
      this.state = 'BLOCK';
      this.vx = 0;
      if (inputs.crouch) {
        this.animController.play('blockCrouch');
      } else {
        this.animController.play('blockStand');
      }
      return;
    }

    // 4. JUMP
    if (inputs.jump && this.isGrounded) {
      this.vy = this.jumpImpulse;
      this.isGrounded = false;
      this.state = 'JUMP';
      this.animController.play('jumpStart', true);
      soundManager.playJump();
      return;
    }

    // 5. CROUCH
    if (inputs.crouch && this.isGrounded) {
      this.state = 'CROUCH';
      this.vx = 0;
      this.animController.play('crouch');
      return;
    }

    // 6. LATERAL LOCOMOTION (Walk / Run)
    if (this.isGrounded) {
      const isRunning = !!inputs.run;
      const speed = isRunning ? this.runSpeed : this.walkSpeed;

      if (inputs.moveLeft) {
        this.vx = -speed;
        const isFwd = this.facing === -1;
        this.state = isFwd ? (isRunning ? 'RUN' : 'WALK_FWD') : 'WALK_BWD';
        this.animController.play(
          isFwd ? (isRunning ? 'runFwd' : 'walkFwd') : 'walkBwd'
        );
      } else if (inputs.moveRight) {
        this.vx = speed;
        const isFwd = this.facing === 1;
        this.state = isFwd ? (isRunning ? 'RUN' : 'WALK_FWD') : 'WALK_BWD';
        this.animController.play(
          isFwd ? (isRunning ? 'runFwd' : 'walkFwd') : 'walkBwd'
        );
      } else {
        this.vx = 0;
        this.state = 'IDLE';
        this.animController.play('idle');
      }
    } else {
      // In-air lateral drift
      if (inputs.moveLeft) this.vx = -this.walkSpeed * 0.85;
      else if (inputs.moveRight) this.vx = this.walkSpeed * 0.85;
    }
  }

  public startAttack(type: AttackType | 'SPECIAL', animKey: keyof CharacterAnimationSet): void {
    this.currentAttackType = type;
    this.state = type as FighterState;
    this.attackTimer = 0;
    this.hasHitCurrentAttack = false;
    this.vx = 0;

    this.animController.play(animKey, true);
    const def = this.animController.currentAnim;
    this.attackDuration = def.framesMax / def.frameRate;
  }

  public fireSpecialProjectile(): void {
    const projType = this.id === 'P1' ? 'CRIMSON_FIREBALL' : 'SHADOW_SHURIKEN';
    this.pendingProjectile = new Projectile2D(
      this.x + this.facing * 45,
      this.y - 75,
      this.facing,
      this.id,
      projType
    );
    this.superMeter = Math.max(0, this.superMeter - 40);
  }

  public update(dt: number, opponent: AnimeFighter2D): void {
    this.animTime += dt;
    this.animController.update(dt);

    if (this.hitFlashTimer > 0) {
      this.hitFlashTimer -= dt;
    }

    // 1. Process Hit Stun Recovery
    if (this.hitStunTimer > 0) {
      this.hitStunTimer -= dt;
      if (this.hitStunTimer <= 0) {
        this.state = 'IDLE';
        this.animController.play('idle');
      }
    }

    // 2. Process Attack Completion
    if (this.currentAttackType !== null) {
      this.attackTimer += dt;
      if (this.animController.isFinished() || this.attackTimer >= this.attackDuration) {
        this.currentAttackType = null;
        this.hasHitCurrentAttack = false;
        this.state = 'IDLE';
        this.animController.play('idle');
      }
    }

    // 3. Gravity and Vertical Jump Physics (Decoupled from ground position)
    if (!this.isGrounded) {
      this.vy += this.gravity * dt;
      this.jumpOffsetY += this.vy * dt;

      if (this.vy < -80) {
        this.state = 'JUMP';
        this.animController.play('jumpRise');
      } else if (Math.abs(this.vy) <= 80) {
        this.animController.play('jumpApex');
      } else {
        this.state = 'FALL';
        this.animController.play('jumpFall');
      }

      // Precision Ground Landing
      if (this.jumpOffsetY >= 0) {
        this.jumpOffsetY = 0;
        this.vy = 0;
        this.isGrounded = true;
        this.state = 'LAND';
        this.animController.play('land', true);
        soundManager.playLanding();
        setTimeout(() => {
          if (this.state === 'LAND') {
            this.state = 'IDLE';
            this.animController.play('idle');
          }
        }, 120);
      }
    }

    // 4. Horizontal Movement & Arena Bounds Clamping
    this.x += this.vx * dt;
    if (this.x < this.minX) this.x = this.minX;
    if (this.x > this.maxX) this.x = this.maxX;

    // 5. Pushbox collision (Fighters maintain spacing)
    const dist = opponent.x - this.x;
    const minSeparation = 72;
    if (Math.abs(dist) < minSeparation && this.isGrounded && opponent.isGrounded) {
      const overlap = minSeparation - Math.abs(dist);
      const sign = dist >= 0 ? 1 : -1;
      this.x -= sign * (overlap * 0.5);
      opponent.x += sign * (overlap * 0.5);
    }
  }

  public getActiveHitbox(): Hitbox2D | null {
    if (!this.currentAttackType || this.hasHitCurrentAttack) return null;

    const info = this.animController.getHitboxInfo();
    if (!info.isActive || !info.data) return null;

    const timing = info.data;
    return {
      x: this.x + this.facing * timing.reach,
      y: this.groundY + this.jumpOffsetY + timing.heightOffset,
      radius: timing.radius,
      damage: timing.damage,
      knockback: timing.knockback,
      type: this.currentAttackType,
    };
  }

  public getHurtbox(): Hurtbox2D {
    const isCrouched = this.state === 'CROUCH' || this.state === 'KICK_LOW';
    const height = isCrouched ? 80 : 135;
    const width = 55;
    return {
      x: this.x - width / 2,
      y: this.y - height,
      width,
      height,
    };
  }

  public takeHit(damage: number, knockback: number, isBlocked: boolean, attackerFacing: number): boolean {
    if (isBlocked) {
      const chipDamage = Math.max(1, Math.round(damage * 0.15));
      this.currentHealth = Math.max(0, this.currentHealth - chipDamage);
      this.x += attackerFacing * (knockback * 0.25);
      this.animController.play(this.state === 'CROUCH' ? 'blockCrouch' : 'blockStand', true);
      return false; // blocked
    }

    this.currentHealth = Math.max(0, this.currentHealth - damage);
    this.x += attackerFacing * knockback;
    this.vx = 0;
    this.hitFlashTimer = 0.12;

    // Fill super meter on hit
    this.superMeter = Math.min(100, this.superMeter + damage * 1.2);

    if (this.currentHealth <= 0) {
      this.state = 'DEFEAT';
      this.currentAttackType = null;
      this.animController.play('defeat', true);
    } else if (knockback > 220) {
      this.state = 'KNOCKBACK';
      this.hitStunTimer = 0.45;
      this.vy = -220;
      this.jumpOffsetY = -5;
      this.isGrounded = false;
      this.animController.play('knockback', true);
    } else {
      this.state = 'HIT_STAGGER';
      this.hitStunTimer = 0.28;
      this.animController.play('hitHeavy', true);
    }

    return true; // clean hit
  }

  public playVictory(): void {
    this.state = 'VICTORY';
    this.vx = 0;
    this.animController.play('victory', true);
  }

  public playDefeat(): void {
    this.state = 'DEFEAT';
    this.vx = 0;
    this.animController.play('defeat', true);
  }

  public renderShadow(ctx: CanvasRenderingContext2D): void {
    SpriteCharacterRenderer2D.renderShadow(ctx, this.x, this.groundY, this.jumpOffsetY);
  }

  public render(ctx: CanvasRenderingContext2D): void {
    SpriteCharacterRenderer2D.renderAnimatedFighter(
      ctx,
      this.x,
      this.groundY + this.jumpOffsetY,
      this.animController,
      this.facing,
      this.id,
      this.superMeter,
      this.hitFlashTimer > 0,
      this.state
    );
  }

  public getStats(): FighterStats {
    return {
      id: this.id,
      name: this.name,
      maxHealth: this.maxHealth,
      currentHealth: this.currentHealth,
      roundsWon: this.roundsWon,
      isGrounded: this.isGrounded,
      facing: this.facing,
      state: this.state,
      colorScheme: {
        primary: this.appearance.primaryColor,
        secondary: this.appearance.secondaryColor,
        accent: this.appearance.accentColor,
        emissive: this.appearance.emissiveColor,
      },
    };
  }

  public dispose(): void {
    // No-op
  }
}
