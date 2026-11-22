// src/game/characters/Fighter.ts
import * as THREE from 'three';
import { AttackData, AttackType, FighterInputs, FighterState, FighterStats, PlayerId } from '../../types';
import { GAME_CONFIG } from '../../config/gameConfig';
import { CHARACTER_PROFILES, COMBAT_ATTACKS, FighterVisualProfile } from './CharacterConfig';
import { CharacterLoader, LoadedFighterModel } from './CharacterLoader';
import { CharacterAnimator } from './CharacterAnimator';

export class Fighter {
  public id: PlayerId;
  public name: string;
  public profile: FighterVisualProfile;
  public modelRoot: THREE.Group;
  public animator!: CharacterAnimator;
  public position: THREE.Vector3;
  public velocity: THREE.Vector2; // vx, vy

  public state: FighterState = 'IDLE';
  public facing: 1 | -1 = 1;
  public currentHealth: number;
  public maxHealth: number;
  public isGrounded = true;
  public roundsWon = 0;

  // Attack & Action tracking
  private currentAttackData: AttackData | null = null;
  private attackTimer = 0;
  public hasHitCurrentAttack = false;
  private comboStep = 0;
  private lastAttackTime = 0;

  // Stun tracking
  private hitStunTimer = 0;
  private landingTimer = 0;

  // Visual effects
  private shieldMesh: THREE.Mesh | null = null;
  private loadedModel: LoadedFighterModel | null = null;
  private flashTimer = 0;

  constructor(id: PlayerId, profile?: FighterVisualProfile) {
    this.id = id;
    this.profile = profile || (id === 'P1' ? CHARACTER_PROFILES.P1 : CHARACTER_PROFILES.P2);
    this.name = this.profile.name;
    this.maxHealth = GAME_CONFIG.MATCH.DEFAULT_MAX_HEALTH;
    this.currentHealth = this.maxHealth;
    this.position = new THREE.Vector3(this.profile.spawnX, GAME_CONFIG.ARENA.FLOOR_Y, GAME_CONFIG.ARENA.FIGHT_PLANE_Z);
    this.velocity = new THREE.Vector2(0, 0);
    this.facing = this.profile.facing;

    this.modelRoot = new THREE.Group();
    this.modelRoot.position.copy(this.position);
    this.modelRoot.rotation.y = this.facing === 1 ? Math.PI / 2 : -Math.PI / 2;

    this.initModel();
  }

  private initModel(): void {
    CharacterLoader.loadFighter(this.profile, this.id === 'P1').then((loaded) => {
      this.loadedModel = loaded;
      this.animator = loaded.animator;
      this.shieldMesh = loaded.shieldMesh;
      this.modelRoot.add(loaded.root);

      // Register animation completion listener
      this.animator.setOnFinishedCallback((finishedState) => {
        this.handleAnimationFinished(finishedState);
      });

      this.animator.playState('IDLE', true);
    });
  }

  private handleAnimationFinished(finishedState: FighterState): void {
    // If attack finished, return to IDLE
    if (
      finishedState.startsWith('PUNCH_') ||
      finishedState.startsWith('KICK_') ||
      finishedState === 'LAND' ||
      finishedState === 'HIT_STAGGER' ||
      finishedState === 'KNOCKBACK' ||
      finishedState === 'STAGGER'
    ) {
      if (this.currentHealth > 0) {
        this.state = 'IDLE';
        this.currentAttackData = null;
        this.hasHitCurrentAttack = false;
        if (this.animator) {
          this.animator.playState('IDLE');
        }
      }
    }
  }

  public reset(spawnX: number, facing: 1 | -1): void {
    this.position.set(spawnX, GAME_CONFIG.ARENA.FLOOR_Y, GAME_CONFIG.ARENA.FIGHT_PLANE_Z);
    this.velocity.set(0, 0);
    this.facing = facing;
    this.state = 'IDLE';
    this.currentHealth = this.maxHealth;
    this.attackTimer = 0;
    this.hitStunTimer = 0;
    this.landingTimer = 0;
    this.isGrounded = true;
    this.hasHitCurrentAttack = false;
    this.currentAttackData = null;
    this.comboStep = 0;

    this.modelRoot.position.copy(this.position);
    this.modelRoot.rotation.y = this.facing === 1 ? Math.PI / 2 : -Math.PI / 2;

    if (this.shieldMesh) {
      (this.shieldMesh.material as THREE.MeshBasicMaterial).opacity = 0;
    }

    if (this.animator) {
      this.animator.playState('IDLE', true);
    }
  }

  public handleInput(inputs: FighterInputs, opponent: Fighter): void {
    // Cannot act while stunned or defeated
    if (
      this.state === 'HIT_STAGGER' ||
      this.state === 'KNOCKBACK' ||
      this.state === 'STAGGER' ||
      this.state === 'DEFEAT' ||
      this.state === 'VICTORY'
    ) {
      return;
    }

    // Dynamic Facing: face opponent when grounded and not mid-attack
    const isAttacking = this.state.startsWith('PUNCH_') || this.state.startsWith('KICK_');
    if (this.isGrounded && !isAttacking && this.state !== 'LAND') {
      const dirToOpponent = opponent.position.x > this.position.x ? 1 : -1;
      if (this.facing !== dirToOpponent) {
        this.facing = dirToOpponent;
      }
    }

    // If currently locked in attack or landing, prevent movement overrides
    if (isAttacking || this.state === 'LAND') {
      return;
    }

    const now = performance.now();

    // 1. COMBAT ATTACKS (Punch Variations)
    if (inputs.punch && this.isGrounded) {
      if (inputs.crouch) {
        this.startAttack('PUNCH_LEFT'); // Low jab
      } else if (inputs.moveRight && this.facing === 1 || inputs.moveLeft && this.facing === -1) {
        this.startAttack('PUNCH_HEAVY'); // Forward heavy punch
      } else {
        // Alternating combo chain: Jab -> Cross
        if (now - this.lastAttackTime < 500 && this.comboStep === 1) {
          this.startAttack('PUNCH_RIGHT');
          this.comboStep = 0;
        } else {
          this.startAttack('PUNCH_LEFT');
          this.comboStep = 1;
        }
      }
      this.lastAttackTime = now;
      return;
    }

    // 2. COMBAT ATTACKS (Kick Variations)
    if (inputs.kick && this.isGrounded) {
      if (inputs.crouch) {
        this.startAttack('KICK_LOW'); // Low shin sweep
      } else if (inputs.moveRight && this.facing === 1 || inputs.moveLeft && this.facing === -1) {
        this.startAttack('KICK_HIGH'); // Forward high roundhouse
      } else {
        this.startAttack('KICK_FRONT'); // Neutral front snap kick
      }
      this.lastAttackTime = now;
      return;
    }

    // 3. DEFENSIVE GUARD (Block)
    if (inputs.block && this.isGrounded) {
      this.state = 'BLOCK';
      this.velocity.x = 0;
      if (this.animator) {
        this.animator.playState('BLOCK');
      }
      if (this.shieldMesh) {
        (this.shieldMesh.material as THREE.MeshBasicMaterial).opacity = 0.55;
      }
      return;
    } else if (this.shieldMesh) {
      (this.shieldMesh.material as THREE.MeshBasicMaterial).opacity = 0;
    }

    // 4. JUMP
    if (inputs.jump && this.isGrounded) {
      this.velocity.y = GAME_CONFIG.PHYSICS.JUMP_IMPULSE;
      this.isGrounded = false;
      this.state = 'JUMP';
      if (this.animator) {
        this.animator.playState('JUMP');
      }
      return;
    }

    // 5. CROUCH
    if (inputs.crouch && this.isGrounded) {
      this.state = 'CROUCH';
      this.velocity.x = 0;
      if (this.animator) {
        this.animator.playState('CROUCH');
      }
      return;
    }

    // 6. LATERAL LOCOMOTION (Walk / Run)
    if (this.isGrounded) {
      const isRunning = !!inputs.run;
      const speed = isRunning ? GAME_CONFIG.PHYSICS.DASH_SPEED : GAME_CONFIG.PHYSICS.WALK_SPEED;

      if (inputs.moveLeft) {
        this.velocity.x = -speed;
        const moveState = this.facing === 1 ? 'WALK_BWD' : isRunning ? 'RUN' : 'WALK_FWD';
        this.state = moveState;
        if (this.animator) this.animator.playState(moveState);
      } else if (inputs.moveRight) {
        this.velocity.x = speed;
        const moveState = this.facing === 1 ? (isRunning ? 'RUN' : 'WALK_FWD') : 'WALK_BWD';
        this.state = moveState;
        if (this.animator) this.animator.playState(moveState);
      } else {
        this.velocity.x = 0;
        this.state = 'IDLE';
        if (this.animator) this.animator.playState('IDLE');
      }
    } else {
      // In-air lateral drift
      if (inputs.moveLeft) {
        this.velocity.x = -GAME_CONFIG.PHYSICS.WALK_SPEED * 0.85;
      } else if (inputs.moveRight) {
        this.velocity.x = GAME_CONFIG.PHYSICS.WALK_SPEED * 0.85;
      }
    }
  }

  private startAttack(type: AttackType): void {
    this.state = type as FighterState;
    this.currentAttackData = COMBAT_ATTACKS[type] || null;
    this.attackTimer = 0;
    this.hasHitCurrentAttack = false;
    this.velocity.x = 0;

    if (this.animator) {
      this.animator.playState(type as FighterState, true);
    }
  }

  public update(dt: number, opponent: Fighter): void {
    // 1. Process Hit Flash
    if (this.flashTimer > 0) {
      this.flashTimer -= dt;
    }

    // 2. Process Hit Stun / Recovery
    if (this.hitStunTimer > 0) {
      this.hitStunTimer -= dt;
      if (this.hitStunTimer <= 0) {
        this.state = 'IDLE';
        if (this.animator) this.animator.playState('IDLE');
      }
    }

    // 3. Process Attack Progress
    if (this.currentAttackData) {
      this.attackTimer += dt;
      const totalDuration =
        this.currentAttackData.startupTime +
        this.currentAttackData.activeTime +
        this.currentAttackData.recoveryTime;

      if (this.attackTimer >= totalDuration) {
        this.state = 'IDLE';
        this.currentAttackData = null;
        this.hasHitCurrentAttack = false;
        if (this.animator) this.animator.playState('IDLE');
      }
    }

    // 4. Gravity and Vertical Movement
    if (!this.isGrounded) {
      this.velocity.y += GAME_CONFIG.PHYSICS.GRAVITY * dt;
      this.position.y += this.velocity.y * dt;

      // In-air state transition to FALL
      if (this.velocity.y < -1.5 && this.state === 'JUMP') {
        this.state = 'FALL';
        if (this.animator) this.animator.playState('FALL');
      }

      // Landing check
      if (this.position.y <= GAME_CONFIG.ARENA.FLOOR_Y) {
        this.position.y = GAME_CONFIG.ARENA.FLOOR_Y;
        this.velocity.y = 0;
        this.isGrounded = true;

        // Transition to LAND animation
        this.state = 'LAND';
        this.landingTimer = 0.18;
        if (this.animator) this.animator.playState('LAND', true);
      }
    }

    // Process landing recovery
    if (this.state === 'LAND') {
      this.landingTimer -= dt;
      if (this.landingTimer <= 0) {
        this.state = 'IDLE';
        if (this.animator) this.animator.playState('IDLE');
      }
    }

    // 5. Horizontal Movement & Arena Clamping
    this.position.x += this.velocity.x * dt;
    if (this.position.x < GAME_CONFIG.ARENA.WALL_LIMIT_LEFT) {
      this.position.x = GAME_CONFIG.ARENA.WALL_LIMIT_LEFT;
    } else if (this.position.x > GAME_CONFIG.ARENA.WALL_LIMIT_RIGHT) {
      this.position.x = GAME_CONFIG.ARENA.WALL_LIMIT_RIGHT;
    }

    // 6. Sync Model Position and Smooth Facing
    this.modelRoot.position.copy(this.position);
    const targetYRot = this.facing === 1 ? Math.PI / 2 : -Math.PI / 2;
    this.modelRoot.rotation.y = THREE.MathUtils.lerp(this.modelRoot.rotation.y, targetYRot, 0.25);

    // 7. Update Skeletal Animation Mixer
    if (this.animator) {
      this.animator.update(dt);
    }
  }

  public getActiveHitbox(): {
    x: number;
    y: number;
    radius: number;
    damage: number;
    knockback: number;
    type: AttackType;
  } | null {
    if (!this.currentAttackData || this.hasHitCurrentAttack) return null;

    const startup = this.currentAttackData.startupTime;
    const activeEnd = startup + this.currentAttackData.activeTime;

    if (this.attackTimer >= startup && this.attackTimer <= activeEnd) {
      const reach = this.currentAttackData.reach;
      const hitX = this.position.x + this.facing * reach;
      let hitY = this.position.y + 1.25;

      if (this.currentAttackData.height === 'HIGH') hitY = this.position.y + 1.48;
      if (this.currentAttackData.height === 'LOW') hitY = this.position.y + 0.35;

      return {
        x: hitX,
        y: hitY,
        radius: 0.52,
        damage: this.currentAttackData.damage,
        knockback: this.currentAttackData.knockback,
        type: this.currentAttackData.type,
      };
    }

    return null;
  }

  public getHurtbox(): { x: number; y: number; width: number; height: number } {
    const isCrouched = this.state === 'CROUCH' || this.state === 'KICK_LOW';
    const height = isCrouched ? 1.15 : GAME_CONFIG.PHYSICS.CHARACTER_HEIGHT;
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
      this.currentHealth = Math.max(0, this.currentHealth - Math.round(damage * 0.15));
      this.position.x += attackerFacing * (knockback * 0.3);
      return false; // blocked
    }

    this.currentHealth = Math.max(0, this.currentHealth - damage);
    this.velocity.x = 0;
    this.position.x += attackerFacing * knockback;

    if (this.currentHealth <= 0) {
      this.state = 'DEFEAT';
      if (this.animator) this.animator.playState('DEFEAT', true);
    } else if (knockback > 2.8) {
      this.state = 'KNOCKBACK';
      this.hitStunTimer = 0.42;
      if (this.animator) this.animator.playState('KNOCKBACK', true);
    } else {
      this.state = 'HIT_STAGGER';
      this.hitStunTimer = 0.28;
      if (this.animator) this.animator.playState('HIT_STAGGER', true);
    }

    return true; // clean hit
  }

  public playVictory(): void {
    this.state = 'VICTORY';
    if (this.animator) {
      this.animator.playState('VICTORY', true);
    }
  }

  public playDefeat(): void {
    this.state = 'DEFEAT';
    if (this.animator) {
      this.animator.playState('DEFEAT', true);
    }
  }

  public getStats(): FighterStats {
    return {
      id: this.id,
      name: this.name,
      maxHealth: this.maxHealth,
      currentHealth: this.currentHealth,
      guardMeter: 100,
      maxGuardMeter: 100,
      superMeter: 0,
      isInvulnerable: false,
      roundsWon: this.roundsWon,
      isGrounded: this.isGrounded,
      facing: this.facing,
      state: this.state,
      colorScheme: this.profile.colors,
    };
  }

  public dispose(): void {
    if (this.loadedModel) {
      this.loadedModel.dispose();
    }
  }
}
