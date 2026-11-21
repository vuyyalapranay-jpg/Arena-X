// src/game/characters/Fighter.ts
import * as THREE from 'three';
import { FighterInputs, FighterState, FighterStats, PlayerId } from '../../types';
import { GAME_CONFIG } from '../../config/gameConfig';
import { ArticulatedHumanoid } from './ArticulatedHumanoid';

export interface FighterConfig {
  name: string;
  subtitle: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    emissive: string;
  };
  spawnX: number;
  facing: 1 | -1;
}

export class Fighter {
  public id: PlayerId;
  public name: string;
  public model: ArticulatedHumanoid;
  public position: THREE.Vector3;
  public velocity: THREE.Vector2; // vx, vy

  public state: FighterState = 'IDLE';
  public facing: 1 | -1 = 1;
  public currentHealth: number;
  public maxHealth: number;
  public isGrounded = true;
  public roundsWon = 0;

  // Attack & Action tracking
  private currentActionProgress = 0;
  private actionDuration = 0;
  private actionTimer = 0;
  private currentAttackType: 'PUNCH' | 'KICK' | null = null;
  public hasHitCurrentAttack = false;

  // Stun / hit-stun
  private hitStunTimer = 0;

  // Colors
  public colorScheme: {
    primary: string;
    secondary: string;
    accent: string;
    emissive: string;
  };

  constructor(id: PlayerId, config: FighterConfig) {
    this.id = id;
    this.name = config.name;
    this.colorScheme = config.colors;
    this.maxHealth = GAME_CONFIG.MATCH.DEFAULT_MAX_HEALTH;
    this.currentHealth = this.maxHealth;
    this.position = new THREE.Vector3(config.spawnX, GAME_CONFIG.ARENA.FLOOR_Y, GAME_CONFIG.ARENA.FIGHT_PLANE_Z);
    this.velocity = new THREE.Vector2(0, 0);
    this.facing = config.facing;

    this.model = new ArticulatedHumanoid({
      primaryColor: config.colors.primary,
      secondaryColor: config.colors.secondary,
      accentColor: config.colors.accent,
      emissiveColor: config.colors.emissive,
      isPlayer1: id === 'P1',
    });

    this.model.root.position.copy(this.position);
    this.model.setFacing(this.facing);
  }

  public reset(spawnX: number, facing: 1 | -1): void {
    this.position.set(spawnX, GAME_CONFIG.ARENA.FLOOR_Y, GAME_CONFIG.ARENA.FIGHT_PLANE_Z);
    this.velocity.set(0, 0);
    this.facing = facing;
    this.state = 'IDLE';
    this.currentHealth = this.maxHealth;
    this.currentActionProgress = 0;
    this.actionTimer = 0;
    this.hitStunTimer = 0;
    this.isGrounded = true;
    this.hasHitCurrentAttack = false;
    this.currentAttackType = null;

    this.model.root.position.copy(this.position);
    this.model.setFacing(this.facing);
    this.model.update(0.016, this.state, 0);
  }

  public handleInput(inputs: FighterInputs, opponent: Fighter): void {
    // Cannot act while in hit stagger or knocked down
    if (this.state === 'HIT_STAGGER' || this.state === 'KNOCKDOWN') {
      return;
    }

    // Dynamic Facing check: face opponent if grounded and not mid-attack
    if (this.isGrounded && this.state !== 'PUNCH' && this.state !== 'KICK') {
      const dirToOpponent = opponent.position.x > this.position.x ? 1 : -1;
      if (this.facing !== dirToOpponent) {
        this.facing = dirToOpponent;
        this.model.setFacing(this.facing);
      }
    }

    // Active Attack in progress
    if (this.state === 'PUNCH' || this.state === 'KICK') {
      return;
    }

    // 1. Attacks (Punch / Kick)
    if (inputs.punch && this.isGrounded) {
      this.startAttack('PUNCH');
      return;
    }

    if (inputs.kick && this.isGrounded) {
      this.startAttack('KICK');
      return;
    }

    // 2. Block
    if (inputs.block && this.isGrounded) {
      this.state = 'BLOCK';
      this.velocity.x = 0;
      return;
    }

    // 3. Jump
    if (inputs.jump && this.isGrounded) {
      this.velocity.y = GAME_CONFIG.PHYSICS.JUMP_IMPULSE;
      this.isGrounded = false;
      this.state = 'JUMP';
      return;
    }

    // 4. Crouch
    if (inputs.crouch && this.isGrounded) {
      this.state = 'CROUCH';
      this.velocity.x = 0;
      return;
    }

    // 5. Left / Right Movement
    if (this.isGrounded) {
      if (inputs.moveLeft) {
        this.velocity.x = -GAME_CONFIG.PHYSICS.WALK_SPEED;
        this.state = this.facing === 1 ? 'WALK_BWD' : 'WALK_FWD';
      } else if (inputs.moveRight) {
        this.velocity.x = GAME_CONFIG.PHYSICS.WALK_SPEED;
        this.state = this.facing === 1 ? 'WALK_FWD' : 'WALK_BWD';
      } else {
        this.velocity.x = 0;
        this.state = 'IDLE';
      }
    } else {
      // In air lateral drift
      if (inputs.moveLeft) {
        this.velocity.x = -GAME_CONFIG.PHYSICS.WALK_SPEED * 0.85;
      } else if (inputs.moveRight) {
        this.velocity.x = GAME_CONFIG.PHYSICS.WALK_SPEED * 0.85;
      }
    }
  }

  private startAttack(type: 'PUNCH' | 'KICK'): void {
    this.state = type;
    this.currentAttackType = type;
    this.actionTimer = 0;
    this.hasHitCurrentAttack = false;
    const config = type === 'PUNCH' ? GAME_CONFIG.ATTACKS.PUNCH : GAME_CONFIG.ATTACKS.KICK;
    this.actionDuration = config.startupTime + config.activeTime + config.recoveryTime;
    this.velocity.x = 0; // stop moving while attacking
  }

  public update(dt: number, opponent: Fighter): void {
    // 1. Process Stun Timer
    if (this.hitStunTimer > 0) {
      this.hitStunTimer -= dt;
      if (this.hitStunTimer <= 0) {
        this.state = 'IDLE';
      }
    }

    // 2. Process Attack Progress
    if (this.state === 'PUNCH' || this.state === 'KICK') {
      this.actionTimer += dt;
      this.currentActionProgress = Math.min(1, this.actionTimer / this.actionDuration);

      if (this.actionTimer >= this.actionDuration) {
        this.state = 'IDLE';
        this.currentAttackType = null;
        this.hasHitCurrentAttack = false;
        this.currentActionProgress = 0;
      }
    }

    // 3. Gravity and Vertical Movement
    if (!this.isGrounded) {
      this.velocity.y += GAME_CONFIG.PHYSICS.GRAVITY * dt;
      this.position.y += this.velocity.y * dt;

      // Landing check
      if (this.position.y <= GAME_CONFIG.ARENA.FLOOR_Y) {
        this.position.y = GAME_CONFIG.ARENA.FLOOR_Y;
        this.velocity.y = 0;
        this.isGrounded = true;
        if (this.state === 'JUMP') {
          this.state = 'IDLE';
        }
      }
    }

    // 4. Horizontal Movement & Arena Clamping
    this.position.x += this.velocity.x * dt;

    if (this.position.x < GAME_CONFIG.ARENA.WALL_LIMIT_LEFT) {
      this.position.x = GAME_CONFIG.ARENA.WALL_LIMIT_LEFT;
    } else if (this.position.x > GAME_CONFIG.ARENA.WALL_LIMIT_RIGHT) {
      this.position.x = GAME_CONFIG.ARENA.WALL_LIMIT_RIGHT;
    }

    // 5. Sync 3D Model position & animation
    this.model.root.position.copy(this.position);
    this.model.update(dt, this.state, this.currentActionProgress);
  }

  public getActiveHitbox(): {
    x: number;
    y: number;
    radius: number;
    damage: number;
    knockback: number;
    type: 'PUNCH' | 'KICK';
  } | null {
    if (!this.currentAttackType || this.hasHitCurrentAttack) return null;

    const attackData = this.currentAttackType === 'PUNCH' 
      ? GAME_CONFIG.ATTACKS.PUNCH 
      : GAME_CONFIG.ATTACKS.KICK;

    const startup = attackData.startupTime;
    const activeWindow = startup + attackData.activeTime;

    // Only active during the active window
    if (this.actionTimer >= startup && this.actionTimer <= activeWindow) {
      const reach = attackData.reach;
      const hitX = this.position.x + this.facing * reach;
      const hitY = this.currentAttackType === 'PUNCH' ? this.position.y + 1.45 : this.position.y + 1.15;
      const radius = this.currentAttackType === 'PUNCH' ? 0.45 : 0.55;

      return {
        x: hitX,
        y: hitY,
        radius,
        damage: attackData.damage,
        knockback: attackData.knockback,
        type: this.currentAttackType,
      };
    }

    return null;
  }

  public getHurtbox(): {
    x: number;
    y: number;
    width: number;
    height: number;
  } {
    const isCrouched = this.state === 'CROUCH';
    const height = isCrouched ? 1.2 : GAME_CONFIG.PHYSICS.CHARACTER_HEIGHT;
    return {
      x: this.position.x - 0.4,
      y: this.position.y,
      width: 0.8,
      height,
    };
  }

  public getPushbox(): { x: number; y: number; radius: number } {
    return {
      x: this.position.x,
      y: this.position.y + 0.9,
      radius: GAME_CONFIG.PHYSICS.PUSH_BOX_RADIUS,
    };
  }

  public takeHit(damage: number, knockback: number, isBlocked: boolean, attackerFacing: number): boolean {
    if (isBlocked) {
      // Chip damage / block effect
      this.currentHealth = Math.max(0, this.currentHealth - Math.round(damage * 0.15));
      this.position.x += attackerFacing * (knockback * 0.35);
      this.model.flashHit();
      return false; // blocked
    }

    // Full hit
    this.currentHealth = Math.max(0, this.currentHealth - damage);
    this.state = this.currentHealth <= 0 ? 'KNOCKDOWN' : 'HIT_STAGGER';
    this.hitStunTimer = 0.28;
    this.velocity.x = 0;
    this.position.x += attackerFacing * knockback;
    this.model.flashHit();
    return true; // clean hit
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
      colorScheme: this.colorScheme,
    };
  }

  public dispose(): void {
    this.model.dispose();
  }
}
