// src/game/combat/CombatEngine.ts
// COMPREHENSIVE COMBAT LOGIC, HIT DETECTION, GUARD RULES & FRAME DATA

import {
  AttackConfigData,
  AttackType,
  HitboxInstance,
  HitResolutionResult,
  HurtboxInstance,
} from './CombatTypes';

export class CombatEngine {
  // Centralized, configurable attack frame data & attributes
  public static readonly ATTACK_CONFIGS: Record<AttackType, AttackConfigData> = {
    // 1. Punches
    PUNCH_LEFT: {
      id: 'PUNCH_LEFT',
      name: 'Light Jab Left',
      damage: 8,
      chipDamageRatio: 0,
      startupFrames: 1,
      activeFrames: 1,
      recoveryFrames: 1,
      totalDuration: 0.22,
      reach: 75,
      heightOffset: -95,
      radius: 36,
      height: 'HIGH',
      knockback: 110,
      verticalKnockback: 0,
      hitStun: 0.22,
      guardStun: 0.16,
      guardDamage: 10,
      impactSound: 'PUNCH',
      canCancelIntoSpecial: true,
    },
    PUNCH_RIGHT: {
      id: 'PUNCH_RIGHT',
      name: 'Light Jab Right',
      damage: 8,
      chipDamageRatio: 0,
      startupFrames: 1,
      activeFrames: 1,
      recoveryFrames: 1,
      totalDuration: 0.22,
      reach: 75,
      heightOffset: -95,
      radius: 36,
      height: 'HIGH',
      knockback: 110,
      verticalKnockback: 0,
      hitStun: 0.22,
      guardStun: 0.16,
      guardDamage: 10,
      impactSound: 'PUNCH',
      canCancelIntoSpecial: true,
    },
    KICK_FRONT: {
      id: 'KICK_FRONT',
      name: 'Front Kick',
      damage: 10,
      chipDamageRatio: 0,
      startupFrames: 1,
      activeFrames: 1,
      recoveryFrames: 1,
      totalDuration: 0.24,
      reach: 85,
      heightOffset: -75,
      radius: 40,
      height: 'MID',
      knockback: 130,
      verticalKnockback: 0,
      hitStun: 0.24,
      guardStun: 0.18,
      guardDamage: 12,
      impactSound: 'KICK',
      canCancelIntoSpecial: true,
    },
    PUNCH_LIGHT: {
      id: 'PUNCH_LIGHT',
      name: 'Light Jab',
      damage: 8,
      chipDamageRatio: 0,
      startupFrames: 1,
      activeFrames: 1,
      recoveryFrames: 1,
      totalDuration: 0.22,
      reach: 75,
      heightOffset: -95,
      radius: 36,
      height: 'HIGH',
      knockback: 110,
      verticalKnockback: 0,
      hitStun: 0.22,
      guardStun: 0.16,
      guardDamage: 10,
      impactSound: 'PUNCH',
      canCancelIntoSpecial: true,
    },
    PUNCH_HEAVY: {
      id: 'PUNCH_HEAVY',
      name: 'Heavy Straight',
      damage: 16,
      chipDamageRatio: 0.10,
      startupFrames: 2,
      activeFrames: 1,
      recoveryFrames: 2,
      totalDuration: 0.35,
      reach: 100,
      heightOffset: -95,
      radius: 46,
      height: 'MID',
      knockback: 220,
      verticalKnockback: 0,
      hitStun: 0.35,
      guardStun: 0.26,
      guardDamage: 22,
      impactSound: 'HEAVY',
      canCancelIntoSpecial: true,
    },
    PUNCH_FORWARD: {
      id: 'PUNCH_FORWARD',
      name: 'Forward Strike',
      damage: 14,
      chipDamageRatio: 0.08,
      startupFrames: 2,
      activeFrames: 1,
      recoveryFrames: 2,
      totalDuration: 0.32,
      reach: 115,
      heightOffset: -90,
      radius: 44,
      height: 'MID',
      knockback: 200,
      verticalKnockback: 0,
      hitStun: 0.32,
      guardStun: 0.24,
      guardDamage: 20,
      impactSound: 'PUNCH',
    },
    UPPERCUT: {
      id: 'UPPERCUT',
      name: 'Rising Uppercut',
      damage: 18,
      chipDamageRatio: 0.12,
      startupFrames: 1,
      activeFrames: 2,
      recoveryFrames: 1,
      totalDuration: 0.38,
      reach: 85,
      heightOffset: -125,
      radius: 48,
      height: 'HIGH',
      knockback: 160,
      verticalKnockback: -340, // Launches into air
      hitStun: 0.45,
      guardStun: 0.28,
      guardDamage: 25,
      impactSound: 'HEAVY',
    },
    COMBO_PUNCH: {
      id: 'COMBO_PUNCH',
      name: 'Combo Punch Flurry',
      damage: 20,
      chipDamageRatio: 0.12,
      startupFrames: 1,
      activeFrames: 2,
      recoveryFrames: 2,
      totalDuration: 0.38,
      reach: 92,
      heightOffset: -95,
      radius: 46,
      height: 'MID',
      knockback: 240,
      verticalKnockback: 0,
      hitStun: 0.40,
      guardStun: 0.28,
      guardDamage: 26,
      impactSound: 'HEAVY',
    },

    // 2. Kicks
    KICK_LIGHT: {
      id: 'KICK_LIGHT',
      name: 'Light Snap Kick',
      damage: 10,
      chipDamageRatio: 0,
      startupFrames: 1,
      activeFrames: 1,
      recoveryFrames: 1,
      totalDuration: 0.24,
      reach: 85,
      heightOffset: -75,
      radius: 40,
      height: 'MID',
      knockback: 130,
      verticalKnockback: 0,
      hitStun: 0.24,
      guardStun: 0.18,
      guardDamage: 12,
      impactSound: 'KICK',
      canCancelIntoSpecial: true,
    },
    KICK_HEAVY: {
      id: 'KICK_HEAVY',
      name: 'Heavy Thrust Kick',
      damage: 18,
      chipDamageRatio: 0.10,
      startupFrames: 1,
      activeFrames: 2,
      recoveryFrames: 1,
      totalDuration: 0.36,
      reach: 105,
      heightOffset: -85,
      radius: 48,
      height: 'MID',
      knockback: 250,
      verticalKnockback: 0,
      hitStun: 0.38,
      guardStun: 0.28,
      guardDamage: 25,
      impactSound: 'HEAVY',
    },
    KICK_HIGH: {
      id: 'KICK_HIGH',
      name: 'High Crescent Kick',
      damage: 22,
      chipDamageRatio: 0.12,
      startupFrames: 2,
      activeFrames: 1,
      recoveryFrames: 2,
      totalDuration: 0.42,
      reach: 110,
      heightOffset: -125,
      radius: 54,
      height: 'HIGH',
      knockback: 280,
      verticalKnockback: -180,
      hitStun: 0.42,
      guardStun: 0.30,
      guardDamage: 30,
      impactSound: 'HEAVY',
    },
    KICK_LOW: {
      id: 'KICK_LOW',
      name: 'Low Shin Sweep',
      damage: 12,
      chipDamageRatio: 0,
      startupFrames: 1,
      activeFrames: 1,
      recoveryFrames: 1,
      totalDuration: 0.28,
      reach: 90,
      heightOffset: -25,
      radius: 36,
      height: 'LOW', // LOW: beats standing guard
      knockback: 140,
      verticalKnockback: 0,
      hitStun: 0.30,
      guardStun: 0.20,
      guardDamage: 15,
      impactSound: 'KICK',
    },
    ROUNDHOUSE: {
      id: 'ROUNDHOUSE',
      name: 'Spinning Roundhouse',
      damage: 24,
      chipDamageRatio: 0.14,
      startupFrames: 2,
      activeFrames: 2,
      recoveryFrames: 2,
      totalDuration: 0.46,
      reach: 115,
      heightOffset: -110,
      radius: 56,
      height: 'HIGH',
      knockback: 300,
      verticalKnockback: -240,
      hitStun: 0.46,
      guardStun: 0.32,
      guardDamage: 32,
      impactSound: 'HEAVY',
    },

    // 3. Air Attacks
    JUMP_PUNCH: {
      id: 'JUMP_PUNCH',
      name: 'Jumping Hammerfist',
      damage: 12,
      chipDamageRatio: 0.05,
      startupFrames: 1,
      activeFrames: 2,
      recoveryFrames: 1,
      totalDuration: 0.28,
      reach: 78,
      heightOffset: -70,
      radius: 42,
      height: 'HIGH', // Overhead in air: beats crouch guard
      knockback: 140,
      verticalKnockback: 0,
      hitStun: 0.30,
      guardStun: 0.22,
      guardDamage: 16,
      impactSound: 'PUNCH',
      isAirAttack: true,
    },
    JUMP_KICK: {
      id: 'JUMP_KICK',
      name: 'Jumping Thrust Kick',
      damage: 15,
      chipDamageRatio: 0.08,
      startupFrames: 1,
      activeFrames: 2,
      recoveryFrames: 1,
      totalDuration: 0.32,
      reach: 92,
      heightOffset: -60,
      radius: 46,
      height: 'HIGH', // Overhead in air: beats crouch guard
      knockback: 180,
      verticalKnockback: 0,
      hitStun: 0.34,
      guardStun: 0.26,
      guardDamage: 20,
      impactSound: 'KICK',
      isAirAttack: true,
    },

    // 4. Special Attacks & Projectiles
    SPECIAL: {
      id: 'SPECIAL',
      name: 'Crimson Dragon / Shadow Surge',
      damage: 32,
      chipDamageRatio: 0.18,
      startupFrames: 2,
      activeFrames: 2,
      recoveryFrames: 1,
      totalDuration: 0.45,
      reach: 135,
      heightOffset: -95,
      radius: 65,
      height: 'MID',
      knockback: 340,
      verticalKnockback: -180,
      hitStun: 0.52,
      guardStun: 0.38,
      guardDamage: 45,
      impactSound: 'SPECIAL',
    },
    CRIMSON_FIREBALL: {
      id: 'CRIMSON_FIREBALL',
      name: 'Crimson Dragon Fireball',
      damage: 28,
      chipDamageRatio: 0.15,
      startupFrames: 1,
      activeFrames: 60,
      recoveryFrames: 1,
      totalDuration: 2.0,
      reach: 0,
      heightOffset: 0,
      radius: 40,
      height: 'MID',
      knockback: 260,
      verticalKnockback: -120,
      hitStun: 0.48,
      guardStun: 0.35,
      guardDamage: 38,
      impactSound: 'SPECIAL',
    },
    SHADOW_SHURIKEN: {
      id: 'SHADOW_SHURIKEN',
      name: 'Shadow Energy Shuriken',
      damage: 28,
      chipDamageRatio: 0.15,
      startupFrames: 1,
      activeFrames: 60,
      recoveryFrames: 1,
      totalDuration: 2.0,
      reach: 0,
      heightOffset: 0,
      radius: 40,
      height: 'MID',
      knockback: 260,
      verticalKnockback: -120,
      hitStun: 0.48,
      guardStun: 0.35,
      guardDamage: 38,
      impactSound: 'SPECIAL',
    },
  };

  /**
   * Evaluates standard 2D fighting game Circle vs Rectangle collision.
   */
  public static checkCircleVsRect(
    cx: number,
    cy: number,
    radius: number,
    rx: number,
    ry: number,
    rw: number,
    rh: number
  ): boolean {
    const closestX = Math.max(rx, Math.min(cx, rx + rw));
    const closestY = Math.max(ry, Math.min(cy, ry + rh));
    const dx = cx - closestX;
    const dy = cy - closestY;
    return dx * dx + dy * dy <= radius * radius;
  }

  /**
   * Resolves combat defense and damage based on High, Mid, Low guard rules:
   * - Standing Block blocks HIGH and MID attacks. It is pierced by LOW attacks.
   * - Crouching Block blocks LOW and MID attacks. It is pierced by OVERHEAD air attacks.
   * - Defender must be facing the attacker (opposite directional sign).
   */
  public static evaluateGuard(
    hitbox: HitboxInstance,
    isBlocking: boolean,
    isDefenderCrouching: boolean,
    defenderFacing: 1 | -1,
    attackerFacing: 1 | -1
  ): { isBlocked: boolean; blockFailReason?: string } {
    if (!isBlocking) {
      return { isBlocked: false, blockFailReason: 'NOT_BLOCKING' };
    }

    // Facing rule: Must face towards the opponent to block their incoming attacks
    if (defenderFacing === attackerFacing) {
      return { isBlocked: false, blockFailReason: 'WRONG_DIRECTION' };
    }

    // High / Mid / Low Guard Rules
    if (hitbox.height === 'LOW') {
      // LOW attacks (low sweep) pierce standing guard!
      if (!isDefenderCrouching) {
        return { isBlocked: false, blockFailReason: 'LOW_PIERCES_STAND_GUARD' };
      }
      return { isBlocked: true };
    }

    if (hitbox.height === 'HIGH') {
      // Air overhead attacks pierce crouching guard!
      const config = CombatEngine.ATTACK_CONFIGS[hitbox.type];
      if (config?.isAirAttack && isDefenderCrouching) {
        return { isBlocked: false, blockFailReason: 'OVERHEAD_PIERCES_CROUCH_GUARD' };
      }
      return { isBlocked: true };
    }

    // MID attacks can be blocked either standing or crouching
    return { isBlocked: true };
  }

  /**
   * Full resolution of an attack connecting with an opponent.
   */
  public static resolveAttackHit(
    hitbox: HitboxInstance,
    hurtbox: HurtboxInstance,
    defenderState: string,
    isDefenderCrouching: boolean,
    defenderFacing: 1 | -1,
    defenderGuardMeter: number
  ): HitResolutionResult {
    // 1. Invulnerability check (waking up or defeat)
    if (hurtbox.isInvulnerable) {
      return {
        hitConnected: false,
        isBlocked: false,
        isGuardBreak: false,
        isKnockdown: false,
        damageDealt: 0,
        hitbox,
        impactX: hitbox.x,
        impactY: hitbox.y,
        hitFreezeTime: 0,
        screenShakeIntensity: 0,
        screenShakeDuration: 0,
      };
    }

    // 2. Guard evaluation
    const isBlocking = defenderState === 'BLOCK';
    const guardResult = this.evaluateGuard(
      hitbox,
      isBlocking,
      isDefenderCrouching,
      defenderFacing,
      hitbox.facing
    );

    const isBlocked = guardResult.isBlocked;

    if (isBlocked) {
      // Guard Meter Depletion & Guard Break
      const remainingGuard = defenderGuardMeter - hitbox.guardDamage;
      const isGuardBreak = remainingGuard <= 0;

      // Chip damage calculation
      const chipDmg = isGuardBreak
        ? hitbox.damage
        : Math.max(1, Math.round(hitbox.damage * hitbox.chipDamageRatio));

      return {
        hitConnected: true,
        isBlocked: !isGuardBreak,
        isGuardBreak,
        isKnockdown: false,
        damageDealt: chipDmg,
        hitbox,
        impactX: hitbox.x,
        impactY: hitbox.y,
        hitFreezeTime: isGuardBreak ? 0.08 : 0.04,
        screenShakeIntensity: isGuardBreak ? 10 : 3,
        screenShakeDuration: isGuardBreak ? 0.3 : 0.15,
      };
    }

    // 3. Clean Hit Resolution
    const isHeavy =
      hitbox.damage >= 18 ||
      hitbox.type === 'UPPERCUT' ||
      hitbox.type === 'ROUNDHOUSE' ||
      hitbox.type === 'SPECIAL';

    const isKnockdown = isHeavy && (hitbox.verticalKnockback < -150 || hitbox.knockback >= 260);

    return {
      hitConnected: true,
      isBlocked: false,
      isGuardBreak: false,
      isKnockdown,
      damageDealt: hitbox.damage,
      hitbox,
      impactX: hitbox.x,
      impactY: hitbox.y,
      hitFreezeTime: hitbox.type === 'SPECIAL' ? 0.10 : isHeavy ? 0.07 : 0.04,
      screenShakeIntensity: hitbox.type === 'SPECIAL' ? 16 : isHeavy ? 9 : 4,
      screenShakeDuration: hitbox.type === 'SPECIAL' ? 0.35 : isHeavy ? 0.25 : 0.16,
    };
  }
}
