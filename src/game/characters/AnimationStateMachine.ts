// src/game/characters/AnimationStateMachine.ts
import * as THREE from 'three';
import { AnimationName, FighterState } from '../../types';

export interface StateConfig {
  name: FighterState;
  clipName: AnimationName;
  loop: THREE.AnimationActionLoopStyles;
  repetitions: number;
  priority: number;
  fadeDuration: number;
  canInterrupt: (nextState: FighterState) => boolean;
}

export class AnimationStateMachine {
  private static states: Record<FighterState, StateConfig> = {
    IDLE: {
      name: 'IDLE',
      clipName: 'idle',
      loop: THREE.LoopRepeat,
      repetitions: Infinity,
      priority: 0,
      fadeDuration: 0.15,
      canInterrupt: () => true,
    },
    WALK_FWD: {
      name: 'WALK_FWD',
      clipName: 'walk_fwd',
      loop: THREE.LoopRepeat,
      repetitions: Infinity,
      priority: 1,
      fadeDuration: 0.12,
      canInterrupt: () => true,
    },
    WALK_BWD: {
      name: 'WALK_BWD',
      clipName: 'walk_bwd',
      loop: THREE.LoopRepeat,
      repetitions: Infinity,
      priority: 1,
      fadeDuration: 0.12,
      canInterrupt: () => true,
    },
    RUN: {
      name: 'RUN',
      clipName: 'run',
      loop: THREE.LoopRepeat,
      repetitions: Infinity,
      priority: 1,
      fadeDuration: 0.10,
      canInterrupt: () => true,
    },
    CROUCH: {
      name: 'CROUCH',
      clipName: 'crouch',
      loop: THREE.LoopRepeat,
      repetitions: Infinity,
      priority: 1,
      fadeDuration: 0.08,
      canInterrupt: () => true,
    },
    JUMP: {
      name: 'JUMP',
      clipName: 'jump',
      loop: THREE.LoopOnce,
      repetitions: 1,
      priority: 2,
      fadeDuration: 0.08,
      canInterrupt: (next) => next === 'FALL' || next === 'HIT_STAGGER' || next === 'KNOCKBACK',
    },
    FALL: {
      name: 'FALL',
      clipName: 'fall',
      loop: THREE.LoopRepeat,
      repetitions: Infinity,
      priority: 2,
      fadeDuration: 0.10,
      canInterrupt: (next) => next === 'LAND' || next === 'HIT_STAGGER' || next === 'KNOCKBACK',
    },
    LAND: {
      name: 'LAND',
      clipName: 'land',
      loop: THREE.LoopOnce,
      repetitions: 1,
      priority: 2,
      fadeDuration: 0.06,
      canInterrupt: (next) => next === 'HIT_STAGGER' || next === 'KNOCKBACK' || next === 'IDLE',
    },
    BLOCK: {
      name: 'BLOCK',
      clipName: 'block',
      loop: THREE.LoopRepeat,
      repetitions: Infinity,
      priority: 3,
      fadeDuration: 0.06,
      canInterrupt: () => true,
    },
    PUNCH_LEFT: {
      name: 'PUNCH_LEFT',
      clipName: 'punch_left',
      loop: THREE.LoopOnce,
      repetitions: 1,
      priority: 4,
      fadeDuration: 0.05,
      canInterrupt: (next) => next === 'HIT_STAGGER' || next === 'KNOCKBACK' || next === 'STAGGER' || next === 'DEFEAT',
    },
    PUNCH_RIGHT: {
      name: 'PUNCH_RIGHT',
      clipName: 'punch_right',
      loop: THREE.LoopOnce,
      repetitions: 1,
      priority: 4,
      fadeDuration: 0.06,
      canInterrupt: (next) => next === 'HIT_STAGGER' || next === 'KNOCKBACK' || next === 'STAGGER' || next === 'DEFEAT',
    },
    PUNCH_HEAVY: {
      name: 'PUNCH_HEAVY',
      clipName: 'punch_heavy',
      loop: THREE.LoopOnce,
      repetitions: 1,
      priority: 4,
      fadeDuration: 0.07,
      canInterrupt: (next) => next === 'HIT_STAGGER' || next === 'KNOCKBACK' || next === 'STAGGER' || next === 'DEFEAT',
    },
    KICK_FRONT: {
      name: 'KICK_FRONT',
      clipName: 'kick_front',
      loop: THREE.LoopOnce,
      repetitions: 1,
      priority: 4,
      fadeDuration: 0.06,
      canInterrupt: (next) => next === 'HIT_STAGGER' || next === 'KNOCKBACK' || next === 'STAGGER' || next === 'DEFEAT',
    },
    KICK_HIGH: {
      name: 'KICK_HIGH',
      clipName: 'kick_high',
      loop: THREE.LoopOnce,
      repetitions: 1,
      priority: 4,
      fadeDuration: 0.07,
      canInterrupt: (next) => next === 'HIT_STAGGER' || next === 'KNOCKBACK' || next === 'STAGGER' || next === 'DEFEAT',
    },
    KICK_LOW: {
      name: 'KICK_LOW',
      clipName: 'kick_low',
      loop: THREE.LoopOnce,
      repetitions: 1,
      priority: 4,
      fadeDuration: 0.06,
      canInterrupt: (next) => next === 'HIT_STAGGER' || next === 'KNOCKBACK' || next === 'STAGGER' || next === 'DEFEAT',
    },
    HIT_STAGGER: {
      name: 'HIT_STAGGER',
      clipName: 'hit_reaction',
      loop: THREE.LoopOnce,
      repetitions: 1,
      priority: 5,
      fadeDuration: 0.04,
      canInterrupt: (next) => next === 'KNOCKBACK' || next === 'DEFEAT',
    },
    STAGGER: {
      name: 'STAGGER',
      clipName: 'stagger',
      loop: THREE.LoopOnce,
      repetitions: 1,
      priority: 5,
      fadeDuration: 0.06,
      canInterrupt: (next) => next === 'KNOCKBACK' || next === 'DEFEAT',
    },
    KNOCKBACK: {
      name: 'KNOCKBACK',
      clipName: 'knockback',
      loop: THREE.LoopOnce,
      repetitions: 1,
      priority: 6,
      fadeDuration: 0.05,
      canInterrupt: (next) => next === 'DEFEAT',
    },
    VICTORY: {
      name: 'VICTORY',
      clipName: 'victory',
      loop: THREE.LoopOnce,
      repetitions: 1,
      priority: 7,
      fadeDuration: 0.2,
      canInterrupt: () => false,
    },
    DEFEAT: {
      name: 'DEFEAT',
      clipName: 'defeat',
      loop: THREE.LoopOnce,
      repetitions: 1,
      priority: 7,
      fadeDuration: 0.15,
      canInterrupt: () => false,
    },
  };

  public static getConfig(state: FighterState): StateConfig {
    return this.states[state] || this.states.IDLE;
  }

  public static canTransition(current: FighterState, next: FighterState): boolean {
    if (current === next) return false;
    const currentCfg = this.getConfig(current);
    const nextCfg = this.getConfig(next);

    // Higher priority can always interrupt lower priority
    if (nextCfg.priority > currentCfg.priority) {
      return true;
    }

    // Otherwise check state specific interrupt rule
    return currentCfg.canInterrupt(next);
  }
}
