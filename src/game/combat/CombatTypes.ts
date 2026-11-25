// src/game/combat/CombatTypes.ts
// COMPREHENSIVE COMBAT SYSTEM TYPES FOR ARENA X (PHASE 4)

import { AttackType, PlayerId } from '../../types';

export type AttackHeight = 'HIGH' | 'MID' | 'LOW';
export type { AttackType };

export type CombatFighterState =
  | 'IDLE'
  | 'WALK_FWD'
  | 'WALK_BWD'
  | 'RUN'
  | 'JUMP'
  | 'FALL'
  | 'LAND'
  | 'CROUCH'
  | 'ATTACKING'
  | 'CHARGING'
  | 'SURGE'
  | 'CINEMATIC_ULTIMATE'
  | 'BLOCK'
  | 'GUARD_STUN'
  | 'GUARD_BREAK'
  | 'HIT_STAGGER'
  | 'KNOCKBACK'
  | 'KNOCKDOWN'
  | 'RECOVERY'
  | 'VICTORY'
  | 'DEFEAT';

export interface AttackConfigData {
  id: AttackType;
  name: string;
  damage: number;
  chipDamageRatio: number; // Percentage of damage dealt through block (0.0 to 0.2)
  startupFrames: number;
  activeFrames: number;
  recoveryFrames: number;
  totalDuration: number;   // In seconds
  reach: number;          // Horizontal distance from character center
  heightOffset: number;   // Vertical distance from ground (negative is up)
  radius: number;         // Circle collision radius
  height: AttackHeight;
  knockback: number;
  verticalKnockback: number; // Upward pop for uppercut / launch attacks
  hitStun: number;        // Hit stun duration in seconds
  guardStun: number;      // Guard stun duration in seconds
  guardDamage: number;    // Depletion to defender's guard meter
  impactSound: 'PUNCH' | 'KICK' | 'HEAVY' | 'SPECIAL';
  isAirAttack?: boolean;
  canCancelIntoSpecial?: boolean;
}

export interface HitboxInstance {
  owner: PlayerId;
  type: AttackType;
  x: number;
  y: number;
  radius: number;
  damage: number;
  knockback: number;
  verticalKnockback: number;
  height: AttackHeight;
  hitStun: number;
  guardStun: number;
  guardDamage: number;
  chipDamageRatio: number;
  impactSound: 'PUNCH' | 'KICK' | 'HEAVY' | 'SPECIAL';
  facing: 1 | -1;
}

export interface HurtboxInstance {
  owner: PlayerId;
  x: number;
  y: number;
  width: number;
  height: number;
  isInvulnerable: boolean;
}

export interface HitResolutionResult {
  hitConnected: boolean;
  isBlocked: boolean;
  isGuardBreak: boolean;
  isKnockdown: boolean;
  damageDealt: number;
  hitbox: HitboxInstance;
  impactX: number;
  impactY: number;
  hitFreezeTime: number;
  screenShakeIntensity: number;
  screenShakeDuration: number;
  shakeDirX?: number;
  shakeDirY?: number;
}
