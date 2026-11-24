// src/game/ai/FighterAIController.ts
// Autonomous Fighting Game AI Opponent with Spacing, Defense, Combos, and Specials

import { FighterInputs } from '../../types';
import { AnimeFighter2D } from '../2d/AnimeFighter2D';

export type AIDifficulty = 'EASY' | 'NORMAL' | 'HARD';

export class FighterAIController {
  public difficulty: AIDifficulty;
  public enabled: boolean = true;

  private decisionTimer: number = 0;
  private currentInputs: FighterInputs;
  private actionCooldown: number = 0;
  private comboStep: number = 0;

  constructor(difficulty: AIDifficulty = 'NORMAL') {
    this.difficulty = difficulty;
    this.currentInputs = this.emptyInputs();
  }

  public reset(): void {
    this.decisionTimer = 0;
    this.actionCooldown = 0;
    this.comboStep = 0;
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
   */
  public update(self: AnimeFighter2D, opponent: AnimeFighter2D, dt: number): FighterInputs {
    if (!this.enabled) return this.emptyInputs();

    this.decisionTimer -= dt;
    this.actionCooldown -= dt;

    // React faster on harder difficulties
    const reactionDelay =
      this.difficulty === 'HARD' ? 0.08 : this.difficulty === 'NORMAL' ? 0.16 : 0.28;

    if (this.decisionTimer <= 0) {
      this.decisionTimer = reactionDelay;
      this.currentInputs = this.makeDecision(self, opponent);
    }

    return this.currentInputs;
  }

  private makeDecision(self: AnimeFighter2D, opponent: AnimeFighter2D): FighterInputs {
    const inputs = this.emptyInputs();

    const dx = opponent.x - self.x;
    const distance = Math.abs(dx);
    const dirToOpponent = dx > 0 ? 1 : -1;
    const facingOpponent = self.facing === dirToOpponent;

    // Reaction probabilities based on difficulty
    const blockChance = this.difficulty === 'HARD' ? 0.82 : this.difficulty === 'NORMAL' ? 0.65 : 0.35;
    const attackAggression = this.difficulty === 'HARD' ? 0.85 : this.difficulty === 'NORMAL' ? 0.70 : 0.50;

    // ==============================================================
    // 1. DEFENSIVE REACTION: Block incoming enemy attacks
    // ==============================================================
    if (opponent.currentAttackType !== null && distance < 380) {
      if (Math.random() < blockChance) {
        inputs.block = true;
        // Low attack -> Crouch block!
        if (opponent.currentAttackType.includes('LOW')) {
          inputs.crouch = true;
        }
        return inputs;
      }
    }

    // ==============================================================
    // 2. ANTI-AIR: Opponent jumping toward AI
    // ==============================================================
    if (!opponent.isGrounded && opponent.jumpOffsetY < -50 && distance < 260) {
      if (Math.random() < attackAggression) {
        // Uppercut anti-air (Crouch + Punch)
        inputs.crouch = true;
        inputs.punch = true;
        inputs.punchHeavy = true;
        return inputs;
      } else {
        inputs.block = true;
        return inputs;
      }
    }

    // ==============================================================
    // 3. ULTIMATE ATTACK: Unleash cinematic finisher when meter is 100%
    // ==============================================================
    if (self.superMeter >= 100 && distance < 420 && self.isGrounded) {
      inputs.ultimate = true;
      inputs.special = true;
      return inputs;
    }

    // ==============================================================
    // 4. ENERGY CHARGE: If opponent is far away and safe, charge meter
    // ==============================================================
    if (distance > 520 && self.superMeter < 75 && opponent.currentAttackType === null) {
      if (Math.random() < 0.35) {
        inputs.charge = true;
        return inputs;
      }
    }

    // ==============================================================
    // 5. DISTANCE EVALUATION & COMBAT DECISIONS
    // ==============================================================

    // A. LONG RANGE (dist > 380px): Approach or Fire Projectile
    if (distance > 380) {
      // 30% chance to fire projectile if meter has 25%+
      if (self.superMeter >= 25 && Math.random() < 0.35) {
        inputs.special = true;
        return inputs;
      }

      // Close distance: walk or dash toward opponent
      if (dirToOpponent === 1) {
        inputs.moveRight = true;
      } else {
        inputs.moveLeft = true;
      }

      // Dash forward with special if meter has energy
      if (self.superMeter >= 25 && Math.random() < 0.25) {
        inputs.special = true;
      }

      return inputs;
    }

    // B. MID RANGE (180px - 380px): Prime Strike Zone
    if (distance >= 180 && distance <= 380) {
      const roll = Math.random();

      if (roll < attackAggression) {
        // Attack selection:
        const attackTypeRoll = Math.random();

        if (attackTypeRoll < 0.35) {
          // Forward Lunging Punch
          if (dirToOpponent === 1) inputs.moveRight = true;
          else inputs.moveLeft = true;
          inputs.punch = true;
          inputs.punchLight = true;
        } else if (attackTypeRoll < 0.65) {
          // Heavy Thrust Kick / High Crescent Kick
          inputs.kick = true;
          inputs.kickHeavy = true;
          if (dirToOpponent === 1) inputs.moveRight = true;
          else inputs.moveLeft = true;
        } else if (self.superMeter >= 25) {
          // Special Melee Strike (Energy Punch / Shadow Strike)
          inputs.special = true;
          inputs.punchHeavy = true;
        } else {
          // Heavy Straight Punch
          inputs.punch = true;
          inputs.punchHeavy = true;
        }
        return inputs;
      } else {
        // Spacing: step back or shimmy
        if (dirToOpponent === 1) {
          inputs.moveLeft = true;
        } else {
          inputs.moveRight = true;
        }
        return inputs;
      }
    }

    // C. CLOSE RANGE (dist < 180px): In-Fighting & Mixups
    if (distance < 180) {
      const closeRoll = Math.random();

      if (closeRoll < 0.30) {
        // Low Shin Sweep (Crouch + Kick) - breaks standing guards
        inputs.crouch = true;
        inputs.kick = true;
        inputs.kickLight = true;
      } else if (closeRoll < 0.60) {
        // Fast Light Jab Combo
        inputs.punch = true;
        inputs.punchLight = true;
      } else if (closeRoll < 0.85) {
        // Heavy Kick / Roundhouse
        inputs.kick = true;
        inputs.kickHeavy = true;
      } else {
        // Tactical retreat to space out
        if (dirToOpponent === 1) {
          inputs.moveLeft = true;
        } else {
          inputs.moveRight = true;
        }
      }
      return inputs;
    }

    return inputs;
  }
}
