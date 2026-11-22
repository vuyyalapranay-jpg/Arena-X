// src/game/2d/AnimeFighter2D.ts
import { AttackType, FighterInputs, FighterState, FighterStats, PlayerId } from '../../types';
import { AnimeCharacterRenderer2D, FighterAppearance } from './AnimeCharacterRenderer2D';
import { SpriteCharacterRenderer2D } from './SpriteCharacterRenderer2D';
import { Projectile2D } from './Projectile2D';
import { soundManager } from '../core/SoundManager';

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
  public appearance: FighterAppearance;

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

  // New projectile spawned by special attack
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
  }

  public reset(spawnX: number, facing: 1 | -1): void {
    this.x = spawnX;
    this.jumpOffsetY = 0;
    this.vx = 0;
    this.vy = 0;
    this.facing = facing;
    this.state = 'IDLE';
    this.currentHealth = this.maxHealth;
    this.attackTimer = 0;
    this.currentAttackType = null;
    this.hasHitCurrentAttack = false;
    this.hitStunTimer = 0;
    this.hitFlashTimer = 0;
    this.isGrounded = true;
    this.pendingProjectile = null;
  }

  public handleInput(inputs: FighterInputs, opponent: AnimeFighter2D): void {
    // Cannot act while stunned or knocked out
    if (
      this.state === 'HIT_STAGGER' ||
      this.state === 'KNOCKBACK' ||
      this.state === 'DEFEAT' ||
      this.state === 'VICTORY'
    ) {
      return;
    }

    // Auto-face opponent when grounded and not mid-attack
    const isAttacking = this.currentAttackType !== null;
    if (this.isGrounded && !isAttacking && this.state !== 'LAND') {
      const dirToOpp = opponent.x > this.x ? 1 : -1;
      if (this.facing !== dirToOpp) {
        this.facing = dirToOpp;
      }
    }

    if (isAttacking || this.state === 'LAND') {
      return;
    }

    const now = performance.now();

    // 1. COMBAT ATTACKS (Punch)
    if (inputs.punch && this.isGrounded) {
      if (inputs.crouch) {
        this.startAttack('PUNCH_LEFT', 0.22); // Low jab
      } else if (
        (inputs.moveRight && this.facing === 1) ||
        (inputs.moveLeft && this.facing === -1)
      ) {
        this.startAttack('PUNCH_HEAVY', 0.38); // Forward Heavy Hammer Smash
      } else {
        // Combo sequence: Jab -> Cross
        if (now - this.lastAttackTime < 500 && this.comboStep === 1) {
          this.startAttack('PUNCH_RIGHT', 0.26);
          this.comboStep = 0;
        } else {
          this.startAttack('PUNCH_LEFT', 0.22);
          this.comboStep = 1;
        }
      }
      this.lastAttackTime = now;
      soundManager.playPunchWhoosh();
      return;
    }

    // 2. COMBAT ATTACKS (Kick)
    if (inputs.kick && this.isGrounded) {
      if (inputs.crouch) {
        this.startAttack('KICK_LOW', 0.32); // Low Shin Sweep
      } else if (
        (inputs.moveRight && this.facing === 1) ||
        (inputs.moveLeft && this.facing === -1)
      ) {
        this.startAttack('KICK_HIGH', 0.35); // Crescent Roundhouse Kick
      } else {
        this.startAttack('KICK_FRONT', 0.28); // Front Snap Kick
      }
      this.lastAttackTime = now;
      soundManager.playPunchWhoosh();
      return;
    }

    // 3. DEFENSIVE GUARD (Block)
    if (inputs.block && this.isGrounded) {
      this.state = 'BLOCK';
      this.vx = 0;
      return;
    }

    // 4. JUMP
    if (inputs.jump && this.isGrounded) {
      this.vy = this.jumpImpulse;
      this.isGrounded = false;
      this.state = 'JUMP';
      soundManager.playJump();
      return;
    }

    // 5. CROUCH
    if (inputs.crouch && this.isGrounded) {
      this.state = 'CROUCH';
      this.vx = 0;
      return;
    }

    // 6. LATERAL LOCOMOTION (Walk / Run)
    if (this.isGrounded) {
      const isRunning = !!inputs.run;
      const speed = isRunning ? this.runSpeed : this.walkSpeed;

      if (inputs.moveLeft) {
        this.vx = -speed;
        this.state = this.facing === 1 ? 'WALK_BWD' : isRunning ? 'RUN' : 'WALK_FWD';
      } else if (inputs.moveRight) {
        this.vx = speed;
        this.state = this.facing === 1 ? (isRunning ? 'RUN' : 'WALK_FWD') : 'WALK_BWD';
      } else {
        this.vx = 0;
        this.state = 'IDLE';
      }
    } else {
      // In-air drift
      if (inputs.moveLeft) this.vx = -this.walkSpeed * 0.85;
      else if (inputs.moveRight) this.vx = this.walkSpeed * 0.85;
    }
  }

  public startAttack(type: AttackType | 'SPECIAL', duration: number): void {
    this.currentAttackType = type;
    this.state = type as FighterState;
    this.attackTimer = 0;
    this.attackDuration = duration;
    this.hasHitCurrentAttack = false;
    this.vx = 0;
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

    if (this.hitFlashTimer > 0) {
      this.hitFlashTimer -= dt;
    }

    // 1. Process Hit Stun Recovery
    if (this.hitStunTimer > 0) {
      this.hitStunTimer -= dt;
      if (this.hitStunTimer <= 0) {
        this.state = 'IDLE';
      }
    }

    // 2. Process Attack Progress
    if (this.currentAttackType !== null) {
      this.attackTimer += dt;
      if (this.attackTimer >= this.attackDuration) {
        this.currentAttackType = null;
        this.hasHitCurrentAttack = false;
        this.state = 'IDLE';
      }
    }

    // 3. Gravity and Vertical Jump Physics (Decoupled from ground position)
    if (!this.isGrounded) {
      this.vy += this.gravity * dt;
      this.jumpOffsetY += this.vy * dt;

      if (this.vy > 100 && this.state === 'JUMP') {
        this.state = 'FALL';
      }

      // Precision Ground landing
      if (this.jumpOffsetY >= 0) {
        this.jumpOffsetY = 0;
        this.vy = 0;
        this.isGrounded = true;
        this.state = 'LAND';
        soundManager.playLanding();
        setTimeout(() => {
          if (this.state === 'LAND') this.state = 'IDLE';
        }, 120);
      }
    }

    // 4. Horizontal Movement & Arena Bounds Clamping
    this.x += this.vx * dt;
    if (this.x < this.minX) this.x = this.minX;
    if (this.x > this.maxX) this.x = this.maxX;

    // 5. Pushbox collision (Fighters don't walk through each other)
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

    const progress = this.attackTimer / this.attackDuration;

    // Active frames occur in middle window of attack (between 30% and 75% duration)
    if (progress >= 0.3 && progress <= 0.75) {
      let reach = 65;
      let hitY = this.y - 78;
      let radius = 32;
      let damage = 10;
      let knockback = 120;

      switch (this.currentAttackType) {
        case 'PUNCH_LEFT':
          reach = 60;
          damage = 8;
          knockback = 90;
          break;
        case 'PUNCH_RIGHT':
          reach = 78;
          damage = 14;
          knockback = 160;
          break;
        case 'PUNCH_HEAVY':
          reach = 85;
          hitY = this.y - 60;
          radius = 42;
          damage = 22;
          knockback = 280;
          break;
        case 'KICK_FRONT':
          reach = 82;
          hitY = this.y - 70;
          damage = 12;
          knockback = 140;
          break;
        case 'KICK_HIGH':
          reach = 88;
          hitY = this.y - 95;
          damage = 16;
          knockback = 200;
          break;
        case 'KICK_LOW':
          reach = 75;
          hitY = this.y - 18; // Low strike
          damage = 11;
          knockback = 110;
          break;
      }

      return {
        x: this.x + this.facing * reach,
        y: hitY,
        radius,
        damage,
        knockback,
        type: this.currentAttackType,
      };
    }

    return null;
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
      // 85% damage reduction when blocking
      const chipDamage = Math.max(1, Math.round(damage * 0.15));
      this.currentHealth = Math.max(0, this.currentHealth - chipDamage);
      this.x += attackerFacing * (knockback * 0.25);
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
    } else if (knockback > 220) {
      this.state = 'KNOCKBACK';
      this.hitStunTimer = 0.45;
      this.vy = -220; // Slight upward pop on heavy knockback
      this.jumpOffsetY = -5;
      this.isGrounded = false;
    } else {
      this.state = 'HIT_STAGGER';
      this.hitStunTimer = 0.28;
    }

    return true; // clean hit
  }

  public playVictory(): void {
    this.state = 'VICTORY';
    this.vx = 0;
  }

  public playDefeat(): void {
    this.state = 'DEFEAT';
    this.vx = 0;
  }

  public renderShadow(ctx: CanvasRenderingContext2D): void {
    SpriteCharacterRenderer2D.renderShadow(ctx, this.x, this.groundY, this.jumpOffsetY);
  }

  public render(ctx: CanvasRenderingContext2D): void {
    SpriteCharacterRenderer2D.render(
      ctx,
      this.x,
      this.groundY + this.jumpOffsetY,
      this.state,
      this.facing,
      this.animTime,
      this.id,
      this.superMeter,
      this.hitFlashTimer > 0
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
    // No-op for 2D fighter
  }
}
