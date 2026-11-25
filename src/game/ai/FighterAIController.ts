// src/game/ai/FighterAIController.ts
// Autonomous Fighting Game AI Opponent with Humanized Pacing, Reaction Latency, and Spacing

import { FighterInputs } from '../../types';
import { AnimeFighter2D } from '../2d/AnimeFighter2D';

export type AIDifficulty = 'EASY' | 'NORMAL' | 'HARD';

export class FighterAIController {
  public difficulty: AIDifficulty;
  public enabled: boolean = true;

  private decisionTimer: number = 0;
  private currentInputs: FighterInputs;
  private attackCooldown: number = 0;
  private hesitationTimer: number = 0;
  private opponentAttackDuration: number = 0;
  private lastOpponentAttack: string | null = null;

  constructor(difficulty: AIDifficulty = 'NORMAL') {
    this.difficulty = difficulty;
    this.currentInputs = this.emptyInputs();
  }

  public reset(): void {
    this.decisionTimer = 0;
    this.attackCooldown = 0;
    this.hesitationTimer = 0;
    this.opponentAttackDuration = 0;
    this.lastOpponentAttack = null;
    this.currentInputs = this.emptyInputs();
  }

  public emptyInputs(): FighterInputs {
    return {
      moveLeft: false,
      moveRight: false,
      jump: false,
      crouch: false,
      punch: false,
      punchLight: false,
      punchHeavy: false,
      kick: false,
      kickLight: false,
      kickHeavy: false,
      block: false,
      run: false,
      charge: false,
      special: false,
      ultimate: false,
    };
  }

  /**
   * Evaluates opponent state, distance, and combat situations to compute realistic fighter inputs.
   * Incorporates humanized reaction delay and thinking/breathing pauses so the player has time to strike and think.
   */
  public update(self: AnimeFighter2D, opponent: AnimeFighter2D, dt: number): FighterInputs {
    if (!this.enabled) return this.emptyInputs();

    this.decisionTimer -= dt;
    this.attackCooldown -= dt;
    this.hesitationTimer -= dt;

    // Track how long the opponent's current attack has been winding up
    if (opponent.currentAttackType !== null) {
      if (this.lastOpponentAttack === opponent.currentAttackType) {
        this.opponentAttackDuration += dt;
      } else {
        this.lastOpponentAttack = opponent.currentAttackType;
        this.opponentAttackDuration = dt;
      }
    } else {
      this.lastOpponentAttack = null;
      this.opponentAttackDuration = 0;
    }

    // Reaction times aligned with human neurological baselines:
    // Easy: ~450ms | Normal: ~280ms | Hard: ~180ms
    const decisionInterval =
      this.difficulty === 'HARD' ? 0.18 : this.difficulty === 'NORMAL' ? 0.28 : 0.45;

    if (this.decisionTimer <= 0) {
      this.decisionTimer = decisionInterval;
      this.currentInputs = this.makeDecision(self, opponent);
    }

    return this.currentInputs;
  }

  private makeDecision(self: AnimeFighter2D, opponent: AnimeFighter2D): FighterInputs {
    const inputs = this.emptyInputs();

    const dx = opponent.x - self.x;
    const distance = Math.abs(dx);
    const dirToOpponent = dx > 0 ? 1 : -1;

    // Difficulty-tuned parameters
    const blockChance =
      this.difficulty === 'HARD' ? 0.70 : this.difficulty === 'NORMAL' ? 0.45 : 0.25;
    const attackAggression =
      this.difficulty === 'HARD' ? 0.60 : this.difficulty === 'NORMAL' ? 0.38 : 0.22;
    // Human reaction window before AI can recognize and react to an incoming attack
    const reactionLatency =
      this.difficulty === 'HARD' ? 0.16 : this.difficulty === 'NORMAL' ? 0.26 : 0.40;
    // Cooldown duration after an attack to give the player an opening to punish or strike back
    const baseAttackCooldown =
      this.difficulty === 'HARD' ? 0.35 : this.difficulty === 'NORMAL' ? 0.65 : 1.05;

    // ==============================================================
    // 1. DEFENSIVE REACTION (Humanized Reaction Latency)
    // ==============================================================
    // The AI only blocks if the attack has been active longer than its reaction latency!
    // Fast strikes will hit before the AI can react, giving the player satisfying hit confirms.
    if (
      opponent.currentAttackType !== null &&
      distance < 360 &&
      this.opponentAttackDuration >= reactionLatency
    ) {
      if (Math.random() < blockChance) {
        inputs.block = true;
        // Low attack -> Crouch block
        if (opponent.currentAttackType.includes('LOW')) {
          inputs.crouch = true;
        }
        return inputs;
      }
    }

    // ==============================================================
    // 2. BREATHING / HESITATION WINDOW
    // ==============================================================
    // If the AI is currently in a thinking pause or on attack cooldown,
    // it will NOT attack. Instead it spaces, backs up, or holds neutral.
    if (this.hesitationTimer > 0 || this.attackCooldown > 0) {
      // 40% chance to take a tactical step back to create breathing room
      if (Math.random() < 0.40 && distance < 320) {
        if (dirToOpponent === 1) inputs.moveLeft = true;
        else inputs.moveRight = true;
      }
      return inputs;
    }

    // Random neutral pause trigger (creates natural martial arts pacing)
    if (Math.random() < (this.difficulty === 'EASY' ? 0.45 : this.difficulty === 'NORMAL' ? 0.35 : 0.20)) {
      this.hesitationTimer = (Math.random() * 0.4 + 0.35) * (this.difficulty === 'EASY' ? 1.4 : 1.0);
      // Gentle spacing while observing
      if (distance < 240) {
        if (dirToOpponent === 1) inputs.moveLeft = true;
        else inputs.moveRight = true;
      }
      return inputs;
    }

    // ==============================================================
    // 3. ANTI-AIR (Jumping Opponent)
    // ==============================================================
    if (!opponent.isGrounded && opponent.jumpOffsetY < -60 && distance < 260) {
      if (Math.random() < attackAggression) {
        // Uppercut anti-air
        inputs.crouch = true;
        inputs.punch = true;
        inputs.punchHeavy = true;
        this.attackCooldown = baseAttackCooldown;
        return inputs;
      } else {
        inputs.block = true;
        return inputs;
      }
    }

    // ==============================================================
    // 4. ULTIMATE ATTACK (Cinematic Finisher when 100% Meter)
    // ==============================================================
    if (self.superMeter >= 100 && distance < 400 && self.isGrounded) {
      // 50% chance to trigger when in range, giving player time to react
      if (Math.random() < 0.50) {
        inputs.ultimate = true;
        inputs.special = true;
        this.attackCooldown = baseAttackCooldown + 0.5;
        return inputs;
      }
    }

    // ==============================================================
    // 5. ENERGY CHARGE (When Safe & Far Away)
    // ==============================================================
    if (distance > 500 && self.superMeter < 70 && opponent.currentAttackType === null) {
      if (Math.random() < 0.30) {
        inputs.charge = true;
        this.hesitationTimer = 0.5;
        return inputs;
      }
    }

    // ==============================================================
    // 6. DISTANCE EVALUATION & COMBAT DECISIONS
    // ==============================================================

    // A. LONG RANGE (dist > 380px): Approach or Step In
    if (distance > 380) {
      // 20% chance to fire projectile if meter has energy
      if (self.superMeter >= 30 && Math.random() < 0.25) {
        inputs.special = true;
        this.attackCooldown = baseAttackCooldown;
        return inputs;
      }

      // Close distance at controlled pace (walking toward opponent)
      if (dirToOpponent === 1) {
        inputs.moveRight = true;
      } else {
        inputs.moveLeft = true;
      }
      return inputs;
    }

    // B. MID RANGE (180px - 380px): Prime Strike Zone
    if (distance >= 180 && distance <= 380) {
      const roll = Math.random();

      if (roll < attackAggression) {
        // Commit to an attack and enter cooldown
        this.attackCooldown = baseAttackCooldown + Math.random() * 0.3;
        const attackTypeRoll = Math.random();

        if (attackTypeRoll < 0.40) {
          // Forward Lunging Punch
          if (dirToOpponent === 1) inputs.moveRight = true;
          else inputs.moveLeft = true;
          inputs.punch = true;
          inputs.punchLight = true;
        } else if (attackTypeRoll < 0.75) {
          // Thrust Kick
          inputs.kick = true;
          inputs.kickHeavy = true;
          if (dirToOpponent === 1) inputs.moveRight = true;
          else inputs.moveLeft = true;
        } else if (self.superMeter >= 30) {
          // Special Melee
          inputs.special = true;
          inputs.punchHeavy = true;
        } else {
          inputs.punch = true;
          inputs.punchHeavy = true;
        }
        return inputs;
      } else {
        // Spacing: step back or circle
        if (dirToOpponent === 1) inputs.moveLeft = true;
        else inputs.moveRight = true;
        this.hesitationTimer = 0.4;
        return inputs;
      }
    }

    // C. CLOSE RANGE (dist < 180px): In-Fighting
    if (distance < 180) {
      const closeRoll = Math.random();

      if (closeRoll < attackAggression) {
        this.attackCooldown = baseAttackCooldown + Math.random() * 0.3;
        const subRoll = Math.random();

        if (subRoll < 0.35) {
          // Low Shin Sweep
          inputs.crouch = true;
          inputs.kick = true;
          inputs.kickLight = true;
        } else if (subRoll < 0.70) {
          // Light Strike
          inputs.punch = true;
          inputs.punchLight = true;
        } else {
          // Heavy Kick
          inputs.kick = true;
          inputs.kickHeavy = true;
        }
        return inputs;
      } else {
        // Tactical step back to create space for player
        if (dirToOpponent === 1) inputs.moveLeft = true;
        else inputs.moveRight = true;
        this.hesitationTimer = 0.5;
        return inputs;
      }
    }

    return inputs;
  }
}
