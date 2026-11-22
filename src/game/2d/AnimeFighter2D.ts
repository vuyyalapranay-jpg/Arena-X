// src/game/2d/AnimeFighter2D.ts
// PHASE 4 ANIME FIGHTER WITH COMPLETE COMBAT STATE MACHINE & COMBAT ENGINE INTEGRATION

import { AttackType, FighterInputs, FighterState, FighterStats, PlayerId } from '../../types';
import { SpriteCharacterRenderer2D } from './SpriteCharacterRenderer2D';
import { Projectile2D } from './Projectile2D';
import { soundManager } from '../core/SoundManager';
import { AnimationController } from '../animation/AnimationController';
import { CharacterAnimationSet, P1_ANIMATIONS, P2_ANIMATIONS, getFighterAnimationSet } from '../animation/AnimationConfig';
import { FighterId, ROSTER_FIGHTERS } from '../characters/RosterConfig';
import { CombatEngine } from '../combat/CombatEngine';
import { HitboxInstance, HurtboxInstance } from '../combat/CombatTypes';

export interface Hitbox2D extends HitboxInstance {}
export interface Hurtbox2D extends HurtboxInstance {}

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
  public guardMeter = 100;
  public readonly maxGuardMeter = 100;
  public superMeter = 0; // 0 to 100
  public roundsWon = 0;
  public isGrounded = true;

  // Dedicated Animation Controller
  public animController: AnimationController;

  // Combat Timers & Attack State
  public currentAttackType: AttackType | null = null;
  public attackTimer = 0;
  public attackDuration = 0;
  public hasHitCurrentAttack = false;
  public canCancelIntoSpecial = false;
  public lastAttackTime = 0;
  public lastAttackKey: string | null = null;

  // Stun, Guard & Damage Timers
  public hitStunTimer = 0;
  public guardStunTimer = 0;
  public guardBreakTimer = 0;
  public knockdownTimer = 0;
  public recoveryTimer = 0;
  public isInvulnerable = false;
  public hitFlashTimer = 0;
  public animTime = 0;

  // Input Buffering Queue (buffers inputs for 0.18s)
  public bufferedAction: { type: string; timestamp: number } | null = null;

  // Projectile spawned by special attack
  public pendingProjectile: Projectile2D | null = null;

  // Phase 5: Super Energy, Charging, Surge & Cinematic Ultimates
  public isCharging = false;
  public isSurging = false;
  public surgeTimer = 0;
  public isCinematic = false;
  public cinematicTimer = 0;
  public afterImageTimer = 0;

  // Constants
  public static readonly MAX_SEPARATION = 760; // Max competitive fighting game engagement distance
  public readonly floorY = 560;
  public readonly minX = 360;
  public readonly maxX = 2040;
  public readonly gravity = 1800; // px / s^2
  public jumpImpulse = -780; // px / s
  public walkSpeed = 280;
  public runSpeed = 480;

  constructor(id: PlayerId, spawnX: number, facing: 1 | -1, fighterId?: FighterId) {
    this.id = id;
    this.x = spawnX;
    this.jumpOffsetY = 0;
    this.facing = facing;

    const isP1 = id === 'P1';
    const fId: FighterId = fighterId || (isP1 ? 'KAI' : 'SHADOW');
    const profile = ROSTER_FIGHTERS[fId] || ROSTER_FIGHTERS[isP1 ? 'KAI' : 'SHADOW'];

    this.name = profile.name.toUpperCase();
    this.walkSpeed = profile.stats.walkSpeed;
    this.runSpeed = profile.stats.runSpeed;
    this.jumpImpulse = profile.stats.jumpImpulse;
    this.maxHealth = profile.stats.health;
    this.currentHealth = profile.stats.health;

    this.appearance = {
      name: this.name,
      isP1,
      primaryColor: profile.colors.primary,
      secondaryColor: profile.colors.secondary,
      accentColor: profile.colors.accent,
      emissiveColor: profile.colors.emissive,
      skinColor: profile.colors.skin,
      hairColor: profile.colors.hair,
    };

    // Initialize Animation Controller with character-specific animations
    this.animController = new AnimationController(getFighterAnimationSet(fId));
  }

  public reset(spawnX: number, facing: 1 | -1): void {
    this.x = spawnX;
    this.jumpOffsetY = 0;
    this.vx = 0;
    this.vy = 0;
    this.facing = facing;
    this.state = 'IDLE';
    this.currentHealth = this.maxHealth;
    this.guardMeter = this.maxGuardMeter;
    this.superMeter = 0;
    this.isGrounded = true;
    this.currentAttackType = null;
    this.attackTimer = 0;
    this.hasHitCurrentAttack = false;
    this.canCancelIntoSpecial = false;
    this.hitStunTimer = 0;
    this.guardStunTimer = 0;
    this.guardBreakTimer = 0;
    this.knockdownTimer = 0;
    this.recoveryTimer = 0;
    this.isInvulnerable = false;
    this.hitFlashTimer = 0;
    this.animTime = 0;
    this.bufferedAction = null;
    this.pendingProjectile = null;
    this.isCharging = false;
    this.isSurging = false;
    this.surgeTimer = 0;
    this.isCinematic = false;
    this.cinematicTimer = 0;
    this.afterImageTimer = 0;
    this.animController.play('idle', true);
  }

  public handleInput(inputs: FighterInputs, opponent: AnimeFighter2D): void {
    const now = performance.now();

    // 1. COMBAT STATE MACHINE GUARDS (Prevent impossible transitions)
    if (
      this.state === 'HIT_STAGGER' ||
      this.state === 'GUARD_STUN' ||
      this.state === 'GUARD_BREAK' ||
      this.state === 'KNOCKBACK' ||
      this.state === 'KNOCKDOWN' ||
      this.state === 'RECOVERY' ||
      this.state === 'DEFEAT' ||
      this.state === 'VICTORY'
    ) {
      // Buffer attack input if pressed near the end of stun/recovery
      if (inputs.punch || inputs.kick || inputs.special) {
        this.bufferedAction = {
          type: inputs.special ? 'SPECIAL' : inputs.punch ? 'PUNCH' : 'KICK',
          timestamp: now,
        };
      }
      return;
    }

    // 2. AUTO-FACING: Face opponent unless locked in an active attack
    if (this.currentAttackType === null) {
      const dirToOpponent = opponent.x > this.x ? 1 : -1;
      if (this.facing !== dirToOpponent) {
        this.facing = dirToOpponent;
      }
    }

    // 3. ATTACK CANCELING & EXECUTION
    const isAttacking = this.currentAttackType !== null;

    if (isAttacking) {
      // Allow canceling into Special on hit if meter available
      if (this.canCancelIntoSpecial && inputs.special && this.superMeter >= 25) {
        const isP1 = this.id === 'P1';
        const move = isP1 ? 'BLUE_WAVE' : 'DARK_ORB';
        this.superMeter -= 25;
        this.startAttack(move, 'special');
        this.fireSpecialProjectile(move);
        return;
      }
      // Cannot interrupt with basic movement during active swing
      return;
    }

    // Check buffered input
    if (this.bufferedAction && now - this.bufferedAction.timestamp < 180) {
      const buffered = this.bufferedAction.type;
      this.bufferedAction = null;
      if (buffered === 'SPECIAL' && this.superMeter >= 25) {
        const isP1 = this.id === 'P1';
        const move = isP1 ? 'BLUE_WAVE' : 'DARK_ORB';
        this.superMeter -= 25;
        this.startAttack(move, 'special');
        this.fireSpecialProjectile(move);
        return;
      }
    }

    // 4. ULTIMATE ATTACK EXECUTION (Requires 100% Super Meter)
    if ((inputs.ultimate || (inputs.special && this.superMeter >= 100)) && this.isGrounded) {
      if (this.superMeter >= 100) {
        const isP1 = this.id === 'P1';
        const ultType = isP1 ? 'ULTIMATE_CELESTIAL_BURST' : 'ULTIMATE_ECLIPSE_DOMINION';
        this.superMeter = 0;
        this.startAttack(ultType, 'special');
        this.isCinematic = true;
        this.cinematicTimer = 0.85;
        soundManager.playUltimateActivation();
        return;
      }
    }

    // 4.5 ENERGY CHARGING POSE (Hold C)
    if (inputs.charge && this.isGrounded && this.currentAttackType === null) {
      this.isCharging = true;
      this.state = 'CHARGING';
      this.vx = 0;
      this.animController.play('idle');
      soundManager.playEnergyCharge();
      return;
    } else {
      this.isCharging = false;
      if (this.state === 'CHARGING') {
        this.state = 'IDLE';
      }
    }

    // 4.6 CHARACTER-SPECIFIC SPECIAL ABILITY EXECUTION (Requires 25-30% Super Meter)
    if (inputs.special && this.superMeter >= 25) {
      const isP1 = this.id === 'P1';

      if (inputs.crouch && this.superMeter >= 30) {
        // Special 4: Anti-Air Sky Breaker (Kai) / Ground Shockwave Void Impact (Shadow)
        const move = isP1 ? 'SKY_BREAKER' : 'VOID_IMPACT';
        this.superMeter -= 30;
        this.startAttack(move, isP1 ? 'uppercut' : 'kickLow');
        if (isP1) {
          this.vy = -620;
          this.jumpOffsetY = -5;
          this.isGrounded = false;
        }
        return;
      }

      if (((inputs.moveRight && this.facing === 1) || (inputs.moveLeft && this.facing === -1)) && this.superMeter >= 25) {
        // Special 3: Flash Dash (Kai) / Phantom Dash (Shadow)
        const move = isP1 ? 'FLASH_DASH' : 'PHANTOM_DASH';
        this.superMeter -= 25;
        this.startAttack(move, 'punchForward');
        this.x += this.facing * 140;
        soundManager.playDashWhoosh();
        return;
      }

      if (inputs.punchHeavy && this.superMeter >= 25) {
        // Special 1: Charged Melee Strike (Energy Punch / Shadow Strike)
        const move = isP1 ? 'ENERGY_PUNCH' : 'SHADOW_STRIKE';
        this.superMeter -= 25;
        this.startAttack(move, 'punchHeavy');
        return;
      }

      // Special 2 (Default): Energy Projectile (Blue Wave / Dark Orb)
      const move = isP1 ? 'BLUE_WAVE' : 'DARK_ORB';
      this.superMeter -= 25;
      this.startAttack(move, 'special');
      this.fireSpecialProjectile(move);
      return;
    }

    // 5. AIR COMBAT ATTACKS (Jumping Punch & Jumping Kick)
    if (!this.isGrounded) {
      if (inputs.punch || inputs.punchLight || inputs.punchHeavy) {
        this.startAttack('JUMP_PUNCH', 'jumpPunch');
        return;
      }
      if (inputs.kick || inputs.kickLight || inputs.kickHeavy) {
        this.startAttack('JUMP_KICK', 'jumpKick');
        return;
      }
    }

    // 6. GROUND COMBAT ATTACKS — PUNCHES
    if (inputs.punch || inputs.punchLight || inputs.punchHeavy) {
      if (inputs.crouch) {
        // Uppercut (Crouch + Punch): Anti-Air rising strike
        this.startAttack('UPPERCUT', 'uppercut');
      } else if (
        (inputs.moveRight && this.facing === 1) ||
        (inputs.moveLeft && this.facing === -1)
      ) {
        // Forward Punch: Lunging straight strike
        this.startAttack('PUNCH_FORWARD', 'punchForward');
      } else if (inputs.punchHeavy || inputs.run) {
        // Heavy Punch: Devastating straight
        this.startAttack('PUNCH_HEAVY', 'punchHeavy');
      } else {
        // Punch combo chain: alternate between light jab and combo punch
        const isChain = this.lastAttackKey === 'punchLight' && now - this.lastAttackTime < 320;
        if (isChain) {
          this.startAttack('COMBO_PUNCH', 'comboPunch');
        } else {
          this.startAttack('PUNCH_LIGHT', 'punchLight');
        }
      }
      this.lastAttackTime = now;
      return;
    }

    // 7. GROUND COMBAT ATTACKS — KICKS
    if (inputs.kick || inputs.kickLight || inputs.kickHeavy) {
      if (inputs.crouch) {
        // Low Shin Sweep (Crouch + Kick): Low attack that beats standing guard!
        this.startAttack('KICK_LOW', 'kickLow');
      } else if (inputs.run) {
        // Spinning Roundhouse Kick
        this.startAttack('ROUNDHOUSE', 'roundhouse');
      } else if (inputs.kickHeavy) {
        // High Crescent Kick
        this.startAttack('KICK_HIGH', 'kickHigh');
      } else if (
        (inputs.moveRight && this.facing === 1) ||
        (inputs.moveLeft && this.facing === -1)
      ) {
        // Heavy Thrust Kick
        this.startAttack('KICK_HEAVY', 'kickHeavy');
      } else {
        // Light Snap Kick
        this.startAttack('KICK_LIGHT', 'kickLight');
      }
      this.lastAttackTime = now;
      return;
    }

    // 8. DEFENSIVE GUARD (Standing Block & Crouching Block)
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

    // 9. JUMP
    if (inputs.jump && this.isGrounded) {
      this.vy = this.jumpImpulse;
      this.isGrounded = false;
      this.state = 'JUMP';
      this.animController.play('jumpStart', true);
      soundManager.playJump();
      return;
    }

    // 10. CROUCH
    if (inputs.crouch && this.isGrounded) {
      this.vx = 0;
      this.state = 'CROUCH';
      this.animController.play('crouch');
      return;
    }

    // 11. LATERAL LOCOMOTION (Walk / Run)
    if (this.isGrounded) {
      const isRunning = !!inputs.run;
      const speed = isRunning ? this.runSpeed : this.walkSpeed;

      if (inputs.moveLeft) {
        // Prevent walking further away if already at max engagement distance
        const isSeparating = this.x < opponent.x;
        const currentDist = Math.abs(opponent.x - this.x);
        if (isSeparating && currentDist >= AnimeFighter2D.MAX_SEPARATION) {
          this.vx = 0;
          this.state = 'IDLE';
          this.animController.play('idle');
        } else {
          this.vx = -speed;
          const isFwd = this.facing === -1;
          this.state = isFwd ? (isRunning ? 'RUN' : 'WALK_FWD') : 'WALK_BWD';
          this.animController.play(
            isFwd ? (isRunning ? 'runFwd' : 'walkFwd') : 'walkBwd'
          );
        }
      } else if (inputs.moveRight) {
        // Prevent walking further away if already at max engagement distance
        const isSeparating = this.x > opponent.x;
        const currentDist = Math.abs(opponent.x - this.x);
        if (isSeparating && currentDist >= AnimeFighter2D.MAX_SEPARATION) {
          this.vx = 0;
          this.state = 'IDLE';
          this.animController.play('idle');
        } else {
          this.vx = speed;
          const isFwd = this.facing === 1;
          this.state = isFwd ? (isRunning ? 'RUN' : 'WALK_FWD') : 'WALK_BWD';
          this.animController.play(
            isFwd ? (isRunning ? 'runFwd' : 'walkFwd') : 'walkBwd'
          );
        }
      } else {
        this.vx = 0;
        this.state = 'IDLE';
        this.animController.play('idle');
      }
    } else {
      // In-air lateral drift
      if (inputs.moveLeft) {
        const isSeparating = this.x < opponent.x;
        if (!isSeparating || Math.abs(opponent.x - this.x) < AnimeFighter2D.MAX_SEPARATION) {
          this.vx = -this.walkSpeed * 0.85;
        }
      } else if (inputs.moveRight) {
        const isSeparating = this.x > opponent.x;
        if (!isSeparating || Math.abs(opponent.x - this.x) < AnimeFighter2D.MAX_SEPARATION) {
          this.vx = this.walkSpeed * 0.85;
        }
      }
    }
  }

  public startAttack(type: AttackType, animKey: keyof CharacterAnimationSet): void {
    this.currentAttackType = type;
    this.state = 'ATTACKING';
    this.attackTimer = 0;
    this.hasHitCurrentAttack = false;
    this.canCancelIntoSpecial = false;
    this.lastAttackKey = animKey as string;

    // Halt ground movement during grounded attack execution
    if (this.isGrounded) {
      this.vx = 0;
    }

    this.animController.play(animKey, true);
    const def = this.animController.currentAnim;
    this.attackDuration = type.startsWith('ULTIMATE') ? 2.2 : def.framesMax / def.frameRate;

    // Audio & Visual trigger
    if (type === 'SPECIAL' || type === 'BLUE_WAVE' || type === 'DARK_ORB') {
      soundManager.playProjectileLaunch(this.id === 'P1');
    } else if (type === 'FLASH_DASH' || type === 'PHANTOM_DASH') {
      soundManager.playDashWhoosh();
    } else if (type === 'ULTIMATE_CELESTIAL_BURST' || type === 'ULTIMATE_ECLIPSE_DOMINION') {
      soundManager.playUltimateActivation();
      this.isCinematic = true;
      this.cinematicTimer = 2.2;
    } else if (type === 'ENERGY_PUNCH' || type === 'SHADOW_STRIKE' || type === 'SKY_BREAKER' || type === 'VOID_IMPACT') {
      soundManager.playSpecialAttack();
    } else {
      soundManager.playPunchWhoosh();
    }
  }

  public fireSpecialProjectile(overrideType?: import('./Projectile2D').ProjectileType): void {
    const isP1 = this.id === 'P1';
    const projType = overrideType || (isP1 ? 'BLUE_WAVE' : 'DARK_ORB');
    this.pendingProjectile = new Projectile2D(
      this.x + this.facing * 50,
      this.y - 85,
      this.facing,
      this.id,
      projType
    );
  }

  public update(dt: number, opponent: AnimeFighter2D): void {
    this.animTime += dt;
    this.animController.update(dt);

    if (this.hitFlashTimer > 0) {
      this.hitFlashTimer -= dt;
    }

    // 0. Energy Charging State (Hold C)
    if (this.isCharging && this.isGrounded) {
      this.superMeter = Math.min(100, this.superMeter + 35 * dt);
      if (this.superMeter >= 100 && !this.isSurging) {
        // Auto-ignite power-up Surge mode upon max charge!
        this.isSurging = true;
        this.surgeTimer = 8.0;
        soundManager.playSurgeActivate();
      }
    }

    // 0.5 Surge Power-Up Processing
    if (this.isSurging) {
      this.surgeTimer -= dt;
      if (this.surgeTimer <= 0) {
        this.isSurging = false;
      }
    }

    // 0.6 Cinematic Ultimate Timer Processing
    if (this.isCinematic) {
      this.cinematicTimer -= dt;
      if (this.cinematicTimer <= 0) {
        this.isCinematic = false;
      }
    }

    // 0.7 After-Image Spawning during Dash attacks
    if (this.currentAttackType === 'FLASH_DASH' || this.currentAttackType === 'PHANTOM_DASH') {
      this.afterImageTimer += dt;
    }

    // 1. Guard Meter Regeneration (Regenerates +20/s when not blocking)
    if (this.state !== 'BLOCK' && this.state !== 'GUARD_STUN' && this.state !== 'GUARD_BREAK') {
      this.guardMeter = Math.min(this.maxGuardMeter, this.guardMeter + 20 * dt);
    }

    // 2. Process Guard Stun & Guard Break
    if (this.guardBreakTimer > 0) {
      this.guardBreakTimer -= dt;
      if (this.guardBreakTimer <= 0) {
        this.guardMeter = 50;
        this.state = 'IDLE';
        this.animController.play('idle');
      }
    } else if (this.guardStunTimer > 0) {
      this.guardStunTimer -= dt;
      if (this.guardStunTimer <= 0) {
        this.state = 'IDLE';
        this.animController.play('idle');
      }
    }

    // 3. Process Hit Stun Recovery
    if (this.hitStunTimer > 0) {
      this.hitStunTimer -= dt;
      if (this.hitStunTimer <= 0) {
        this.state = 'IDLE';
        this.animController.play('idle');
      }
    }

    // 4. Process Knockdown & Wake-Up Recovery
    if (this.knockdownTimer > 0) {
      this.knockdownTimer -= dt;
      if (this.knockdownTimer <= 0) {
        // Transition from flat on ground to getting up with invulnerability
        this.state = 'RECOVERY';
        this.recoveryTimer = 0.35;
        this.isInvulnerable = true;
        this.animController.play('getUp', true);
      }
    } else if (this.recoveryTimer > 0) {
      this.recoveryTimer -= dt;
      if (this.recoveryTimer <= 0) {
        this.isInvulnerable = false;
        this.state = 'IDLE';
        this.animController.play('idle');
      }
    }

    // 5. Process Attack Completion
    if (this.currentAttackType !== null) {
      this.attackTimer += dt;
      if (this.animController.isFinished() || this.attackTimer >= this.attackDuration) {
        this.currentAttackType = null;
        this.hasHitCurrentAttack = false;
        this.canCancelIntoSpecial = false;
        this.state = this.isGrounded ? 'IDLE' : 'FALL';
        this.animController.play(this.isGrounded ? 'idle' : 'jumpFall');
      }
    }

    // 6. Gravity and Vertical Jump Physics (Decoupled from ground position)
    if (!this.isGrounded) {
      this.vy += this.gravity * dt;
      this.jumpOffsetY += this.vy * dt;

      if (this.currentAttackType === null) {
        if (this.vy < -80) {
          this.state = 'JUMP';
          this.animController.play('jumpRise');
        } else if (Math.abs(this.vy) <= 80) {
          this.animController.play('jumpApex');
        } else {
          this.state = 'FALL';
          this.animController.play('jumpFall');
        }
      }

      // Precision Ground Landing
      if (this.jumpOffsetY >= 0) {
        this.jumpOffsetY = 0;
        this.vy = 0;
        this.isGrounded = true;
        if (this.state === 'JUMP' || this.state === 'FALL' || this.state === 'KNOCKBACK') {
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
    }

    // 7. Horizontal Movement & Arena Bounds Clamping
    this.x += this.vx * dt;

    // Hard Clamping to Stage and Maximum Separation
    // In competitive 2D fighting games, fighters can never drift apart into separate screens
    const distToOpp = this.x - opponent.x;
    if (Math.abs(distToOpp) > AnimeFighter2D.MAX_SEPARATION) {
      const sign = distToOpp > 0 ? 1 : -1;
      this.x = opponent.x + sign * AnimeFighter2D.MAX_SEPARATION;
      this.vx = 0;
    }

    if (this.x < this.minX) this.x = this.minX;
    if (this.x > this.maxX) this.x = this.maxX;

    // 8. Pushbox collision (Fighters maintain spacing)
    const dist = opponent.x - this.x;
    const minSeparation = 72;
    if (Math.abs(dist) < minSeparation && this.isGrounded && opponent.isGrounded) {
      const overlap = minSeparation - Math.abs(dist);
      const sign = dist >= 0 ? 1 : -1;
      this.x -= sign * (overlap * 0.5);
      opponent.x += sign * (overlap * 0.5);
    }
  }

  public getActiveHitbox(): HitboxInstance | null {
    if (!this.currentAttackType || this.hasHitCurrentAttack) return null;

    const info = this.animController.getHitboxInfo();
    if (!info.isActive || !info.data) return null;

    const timing = info.data;
    const config = CombatEngine.ATTACK_CONFIGS[this.currentAttackType] || {
      verticalKnockback: 0,
      guardDamage: 20,
      chipDamageRatio: 0.1,
      guardStun: 0.22,
      damage: timing.damage,
      knockback: timing.knockback,
      reach: timing.reach,
      radius: timing.radius,
      heightOffset: timing.heightOffset,
      height: timing.hitType,
      impactSound: timing.impactSound,
    };

    const baseDmg = config.damage !== undefined ? config.damage : timing.damage;
    const finalDamage = this.isSurging ? Math.round(baseDmg * 1.15) : baseDmg;

    return {
      owner: this.id,
      type: this.currentAttackType,
      x: this.x + this.facing * (config.reach !== undefined ? config.reach : timing.reach),
      y: this.groundY + this.jumpOffsetY + (config.heightOffset !== undefined ? config.heightOffset : timing.heightOffset),
      radius: config.radius !== undefined ? config.radius : timing.radius,
      damage: finalDamage,
      knockback: config.knockback !== undefined ? config.knockback : timing.knockback,
      verticalKnockback: config.verticalKnockback || 0,
      height: config.height || timing.hitType,
      hitStun: finalDamage >= 24 ? 0.45 : finalDamage >= 18 ? 0.38 : 0.22,
      guardStun: config.guardStun,
      guardDamage: config.guardDamage,
      chipDamageRatio: config.chipDamageRatio,
      impactSound: config.impactSound || timing.impactSound,
      facing: this.facing,
    };
  }

  public getHurtbox(): HurtboxInstance {
    const isCrouched = this.state === 'CROUCH' || this.animController.currentAnimKey === 'blockCrouch';
    const height = isCrouched ? 85 : 140;
    const width = 56;
    return {
      owner: this.id,
      x: this.x - width / 2,
      y: this.y - height,
      width,
      height,
      isInvulnerable: this.isInvulnerable || this.state === 'DEFEAT',
    };
  }

  public applyHitResult(result: import('../combat/CombatTypes').HitResolutionResult, attackerFacing: number): void {
    if (result.isBlocked) {
      // Guard blocked
      this.currentHealth = Math.max(0, this.currentHealth - result.damageDealt);
      this.guardMeter = Math.max(0, this.guardMeter - result.hitbox.guardDamage);
      this.guardStunTimer = result.hitbox.guardStun;
      this.state = 'GUARD_STUN';
      this.vx = 0;
      this.x += attackerFacing * (result.hitbox.knockback * 0.25);
      this.animController.play(
        this.animController.currentAnimKey === 'blockCrouch' ? 'blockCrouch' : 'blockStand',
        true
      );
      return;
    }

    if (result.isGuardBreak) {
      // Guard broken!
      this.guardMeter = 0;
      this.guardBreakTimer = 0.65;
      this.state = 'GUARD_BREAK';
      this.vx = 0;
      this.currentHealth = Math.max(0, this.currentHealth - result.damageDealt);
      this.x += attackerFacing * (result.hitbox.knockback * 0.5);
      this.animController.play('hitHeavy', true);
      soundManager.playBlockClank();
      return;
    }

    // Clean hit!
    this.currentHealth = Math.max(0, this.currentHealth - result.damageDealt);
    this.x += attackerFacing * result.hitbox.knockback;
    this.vx = 0;
    this.hitFlashTimer = 0.12;

    // Fill super meter on hit
    this.superMeter = Math.min(100, this.superMeter + result.damageDealt * 1.2);

    if (this.currentHealth <= 0) {
      this.state = 'DEFEAT';
      this.currentAttackType = null;
      this.animController.play('defeat', true);
      return;
    }

    if (result.isKnockdown) {
      // Knockdown
      this.state = 'KNOCKDOWN';
      this.knockdownTimer = 0.55;
      this.isInvulnerable = true;
      if (result.hitbox.verticalKnockback < 0) {
        this.vy = result.hitbox.verticalKnockback;
        this.jumpOffsetY = -5;
        this.isGrounded = false;
      }
      this.animController.play('knockdown', true);
    } else if (result.hitbox.knockback > 220 || result.hitbox.verticalKnockback < -100) {
      // Knockback tumble
      this.state = 'KNOCKBACK';
      this.hitStunTimer = result.hitbox.hitStun;
      if (result.hitbox.verticalKnockback < 0) {
        this.vy = result.hitbox.verticalKnockback;
        this.jumpOffsetY = -5;
        this.isGrounded = false;
      }
      this.animController.play('knockback', true);
    } else {
      // Standard Hit Stun
      this.state = 'HIT_STAGGER';
      this.hitStunTimer = result.hitbox.hitStun;
      this.animController.play(result.hitbox.damage >= 16 ? 'hitHeavy' : 'hitLight', true);
    }
  }

  public takeHit(damage: number, knockback: number, isBlocked: boolean, attackerFacing: number): boolean {
    if (this.isInvulnerable) return false;

    if (isBlocked) {
      const chipDamage = Math.max(1, Math.round(damage * 0.12));
      this.currentHealth = Math.max(0, this.currentHealth - chipDamage);
      this.guardMeter = Math.max(0, this.guardMeter - 18);
      this.guardStunTimer = 0.20;
      this.state = 'GUARD_STUN';
      this.x += attackerFacing * (knockback * 0.25);
      this.animController.play(
        this.animController.currentAnimKey === 'blockCrouch' ? 'blockCrouch' : 'blockStand',
        true
      );
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
    } else if (knockback > 240) {
      this.state = 'KNOCKDOWN';
      this.knockdownTimer = 0.55;
      this.isInvulnerable = true;
      this.animController.play('knockdown', true);
    } else if (knockback > 180) {
      this.state = 'KNOCKBACK';
      this.hitStunTimer = 0.40;
      this.vy = -200;
      this.jumpOffsetY = -5;
      this.isGrounded = false;
      this.animController.play('knockback', true);
    } else {
      this.state = 'HIT_STAGGER';
      this.hitStunTimer = 0.28;
      this.animController.play(damage >= 16 ? 'hitHeavy' : 'hitLight', true);
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
      guardMeter: this.guardMeter,
      maxGuardMeter: this.maxGuardMeter,
      superMeter: this.superMeter,
      isInvulnerable: this.isInvulnerable,
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
