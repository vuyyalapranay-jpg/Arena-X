// src/game/animation/AnimationConfig.ts
// COMPREHENSIVE 2D FIGHTING ANIMATION CONFIGURATION & HITBOX METADATA

export type AnimationCategory =
  | 'MOVEMENT'
  | 'JUMP'
  | 'PUNCH'
  | 'KICK'
  | 'DEFENSE'
  | 'DAMAGE'
  | 'SPECIAL';

export interface HitboxTimingData {
  startupFrames: number;  // Frames before attack becomes active
  activeFrames: number;   // Frames where hitbox deals damage
  recoveryFrames: number; // Frames of recovery before next action
  damage: number;
  knockback: number;
  reach: number;          // Horizontal reach in pixels from character center
  heightOffset: number;   // Vertical reach in pixels from groundY (negative is upward)
  radius: number;         // Collision radius
  hitType: 'HIGH' | 'MID' | 'LOW';
  impactSound: 'PUNCH' | 'KICK' | 'HEAVY' | 'SPECIAL';
}

export interface AnimationDefinition {
  name: string;
  category: AnimationCategory;
  imageSrc: string;
  framesMax: number;
  frameRate: number;      // Frames per second
  loop: boolean;
  priority: number;       // Higher priority interrupts lower
  holdLastFrame?: boolean;
  hitboxTiming?: HitboxTimingData;
}

export interface CharacterAnimationSet {
  // 1. Basic Movement
  idle: AnimationDefinition;
  idleBlink: AnimationDefinition;
  walkFwd: AnimationDefinition;
  walkBwd: AnimationDefinition;
  runFwd: AnimationDefinition;
  runBwd: AnimationDefinition;
  crouch: AnimationDefinition;
  standUp: AnimationDefinition;

  // 2. Jumping
  jumpStart: AnimationDefinition;
  jumpRise: AnimationDefinition;
  jumpApex: AnimationDefinition;
  jumpFall: AnimationDefinition;
  land: AnimationDefinition;

  // 3. Punching
  punchLight: AnimationDefinition;
  punchHeavy: AnimationDefinition;
  punchForward: AnimationDefinition;
  uppercut: AnimationDefinition;
  comboPunch: AnimationDefinition;

  // 4. Kicking
  kickLight: AnimationDefinition;
  kickHeavy: AnimationDefinition;
  kickHigh: AnimationDefinition;
  kickLow: AnimationDefinition;
  roundhouse: AnimationDefinition;

  // 5. Air Attacks
  jumpPunch: AnimationDefinition;
  jumpKick: AnimationDefinition;

  // 6. Defense & Damage
  blockStand: AnimationDefinition;
  blockCrouch: AnimationDefinition;
  hitLight: AnimationDefinition;
  hitHeavy: AnimationDefinition;
  knockback: AnimationDefinition;
  knockdown: AnimationDefinition;
  getUp: AnimationDefinition;

  // 7. Special & Match States
  special: AnimationDefinition;
  victory: AnimationDefinition;
  defeat: AnimationDefinition;
}

export const ANIMATION_PRIORITIES = {
  IDLE: 1,
  MOVE: 2,
  JUMP: 3,
  ATTACK: 4,
  HIT: 5,
  KNOCKDOWN: 6,
  CINEMATIC: 7,
};

export const createFighterAnimationSet = (fighterPrefix: string): CharacterAnimationSet => {
  const base = fighterPrefix.startsWith('/') ? fighterPrefix : `/assets/sprites/${fighterPrefix}`;

  return {
    // 1. Movement
    idle: {
      name: 'idle',
      category: 'MOVEMENT',
      imageSrc: `${base}/Idle.png`,
      framesMax: 10,
      frameRate: 8,
      loop: true,
      priority: ANIMATION_PRIORITIES.IDLE,
    },
    idleBlink: {
      name: 'idle_blink',
      category: 'MOVEMENT',
      imageSrc: `${base}/Idle_Blink.png`,
      framesMax: 10,
      frameRate: 8,
      loop: true,
      priority: ANIMATION_PRIORITIES.IDLE,
    },
    walkFwd: {
      name: 'walk_fwd',
      category: 'MOVEMENT',
      imageSrc: `${base}/Walk_Fwd.png`,
      framesMax: 8,
      frameRate: 10,
      loop: true,
      priority: ANIMATION_PRIORITIES.MOVE,
    },
    walkBwd: {
      name: 'walk_bwd',
      category: 'MOVEMENT',
      imageSrc: `${base}/Walk_Bwd.png`,
      framesMax: 8,
      frameRate: 8,
      loop: true,
      priority: ANIMATION_PRIORITIES.MOVE,
    },
    runFwd: {
      name: 'run_fwd',
      category: 'MOVEMENT',
      imageSrc: `${base}/Run.png`,
      framesMax: 8,
      frameRate: 13,
      loop: true,
      priority: ANIMATION_PRIORITIES.MOVE,
    },
    runBwd: {
      name: 'run_bwd',
      category: 'MOVEMENT',
      imageSrc: `${base}/Run.png`,
      framesMax: 8,
      frameRate: 10,
      loop: true,
      priority: ANIMATION_PRIORITIES.MOVE,
    },
    crouch: {
      name: 'crouch',
      category: 'MOVEMENT',
      imageSrc: `${base}/Crouch.png`,
      framesMax: 2,
      frameRate: 8,
      loop: false,
      holdLastFrame: true,
      priority: ANIMATION_PRIORITIES.MOVE,
    },
    standUp: {
      name: 'stand_up',
      category: 'MOVEMENT',
      imageSrc: `${base}/Crouch.png`,
      framesMax: 2,
      frameRate: 10,
      loop: false,
      priority: ANIMATION_PRIORITIES.MOVE,
    },

    // 2. Jumping
    jumpStart: {
      name: 'jump_start',
      category: 'JUMP',
      imageSrc: `${base}/Jump.png`,
      framesMax: 3,
      frameRate: 10,
      loop: false,
      priority: ANIMATION_PRIORITIES.JUMP,
    },
    jumpRise: {
      name: 'jump_rise',
      category: 'JUMP',
      imageSrc: `${base}/Jump.png`,
      framesMax: 3,
      frameRate: 6,
      loop: false,
      holdLastFrame: true,
      priority: ANIMATION_PRIORITIES.JUMP,
    },
    jumpApex: {
      name: 'jump_apex',
      category: 'JUMP',
      imageSrc: `${base}/Jump.png`,
      framesMax: 3,
      frameRate: 5,
      loop: false,
      holdLastFrame: true,
      priority: ANIMATION_PRIORITIES.JUMP,
    },
    jumpFall: {
      name: 'jump_fall',
      category: 'JUMP',
      imageSrc: `${base}/Fall.png`,
      framesMax: 2,
      frameRate: 6,
      loop: false,
      holdLastFrame: true,
      priority: ANIMATION_PRIORITIES.JUMP,
    },
    land: {
      name: 'land',
      category: 'JUMP',
      imageSrc: `${base}/Crouch.png`,
      framesMax: 2,
      frameRate: 12,
      loop: false,
      priority: ANIMATION_PRIORITIES.JUMP,
    },

    // 3. Punching
    punchLight: {
      name: 'punch_light',
      category: 'PUNCH',
      imageSrc: `${base}/Punch_Light.png`,
      framesMax: 3,
      frameRate: 18,
      loop: false,
      priority: ANIMATION_PRIORITIES.ATTACK,
      hitboxTiming: {
        startupFrames: 1,
        activeFrames: 1,
        recoveryFrames: 1,
        damage: 8,
        knockback: 110,
        reach: 75,
        heightOffset: -95,
        radius: 36,
        hitType: 'HIGH',
        impactSound: 'PUNCH',
      },
    },
    punchHeavy: {
      name: 'punch_heavy',
      category: 'PUNCH',
      imageSrc: `${base}/Attack1.png`,
      framesMax: 5,
      frameRate: 15,
      loop: false,
      priority: ANIMATION_PRIORITIES.ATTACK,
      hitboxTiming: {
        startupFrames: 2,
        activeFrames: 1,
        recoveryFrames: 2,
        damage: 16,
        knockback: 230,
        reach: 98,
        heightOffset: -95,
        radius: 46,
        hitType: 'MID',
        impactSound: 'HEAVY',
      },
    },
    uppercut: {
      name: 'uppercut',
      category: 'PUNCH',
      imageSrc: `${base}/Uppercut.png`,
      framesMax: 4,
      frameRate: 14,
      loop: false,
      priority: ANIMATION_PRIORITIES.ATTACK,
      hitboxTiming: {
        startupFrames: 1,
        activeFrames: 2,
        recoveryFrames: 1,
        damage: 18,
        knockback: 160,
        reach: 85,
        heightOffset: -125,
        radius: 48,
        hitType: 'HIGH',
        impactSound: 'HEAVY',
      },
    },
    punchForward: {
      name: 'punch_forward',
      category: 'PUNCH',
      imageSrc: `${base}/Attack1.png`,
      framesMax: 5,
      frameRate: 16,
      loop: false,
      priority: ANIMATION_PRIORITIES.ATTACK,
      hitboxTiming: {
        startupFrames: 2,
        activeFrames: 1,
        recoveryFrames: 2,
        damage: 14,
        knockback: 200,
        reach: 115,
        heightOffset: -90,
        radius: 44,
        hitType: 'MID',
        impactSound: 'PUNCH',
      },
    },
    comboPunch: {
      name: 'combo_punch',
      category: 'PUNCH',
      imageSrc: `${base}/Punch_Light.png`,
      framesMax: 3,
      frameRate: 20,
      loop: false,
      priority: ANIMATION_PRIORITIES.ATTACK,
      hitboxTiming: {
        startupFrames: 1,
        activeFrames: 1,
        recoveryFrames: 1,
        damage: 12,
        knockback: 220,
        reach: 85,
        heightOffset: -95,
        radius: 44,
        hitType: 'MID',
        impactSound: 'HEAVY',
      },
    },

    // 4. Kicking
    kickLight: {
      name: 'kick_light',
      category: 'KICK',
      imageSrc: `${base}/Kick_Light.png`,
      framesMax: 3,
      frameRate: 16,
      loop: false,
      priority: ANIMATION_PRIORITIES.ATTACK,
      hitboxTiming: {
        startupFrames: 1,
        activeFrames: 1,
        recoveryFrames: 1,
        damage: 10,
        knockback: 130,
        reach: 85,
        heightOffset: -75,
        radius: 40,
        hitType: 'MID',
        impactSound: 'KICK',
      },
    },
    kickHeavy: {
      name: 'kick_heavy',
      category: 'KICK',
      imageSrc: `${base}/Kick_Heavy.png`,
      framesMax: 4,
      frameRate: 14,
      loop: false,
      priority: ANIMATION_PRIORITIES.ATTACK,
      hitboxTiming: {
        startupFrames: 1,
        activeFrames: 2,
        recoveryFrames: 1,
        damage: 18,
        knockback: 250,
        reach: 105,
        heightOffset: -85,
        radius: 48,
        hitType: 'MID',
        impactSound: 'HEAVY',
      },
    },
    kickHigh: {
      name: 'kick_high',
      category: 'KICK',
      imageSrc: `${base}/Attack2.png`,
      framesMax: 5,
      frameRate: 14,
      loop: false,
      priority: ANIMATION_PRIORITIES.ATTACK,
      hitboxTiming: {
        startupFrames: 2,
        activeFrames: 1,
        recoveryFrames: 2,
        damage: 22,
        knockback: 280,
        reach: 110,
        heightOffset: -125,
        radius: 54,
        hitType: 'HIGH',
        impactSound: 'HEAVY',
      },
    },
    kickLow: {
      name: 'kick_low',
      category: 'KICK',
      imageSrc: `${base}/Kick_Low.png`,
      framesMax: 3,
      frameRate: 15,
      loop: false,
      priority: ANIMATION_PRIORITIES.ATTACK,
      hitboxTiming: {
        startupFrames: 1,
        activeFrames: 1,
        recoveryFrames: 1,
        damage: 12,
        knockback: 140,
        reach: 88,
        heightOffset: -25,
        radius: 36,
        hitType: 'LOW',
        impactSound: 'KICK',
      },
    },
    roundhouse: {
      name: 'roundhouse',
      category: 'KICK',
      imageSrc: `${base}/Kick_Heavy.png`,
      framesMax: 4,
      frameRate: 15,
      loop: false,
      priority: ANIMATION_PRIORITIES.ATTACK,
      hitboxTiming: {
        startupFrames: 2,
        activeFrames: 2,
        recoveryFrames: 2,
        damage: 24,
        knockback: 300,
        reach: 115,
        heightOffset: -110,
        radius: 56,
        hitType: 'HIGH',
        impactSound: 'HEAVY',
      },
    },

    // 5. Air Attacks
    jumpPunch: {
      name: 'jump_punch',
      category: 'PUNCH',
      imageSrc: `${base}/Punch_Light.png`,
      framesMax: 3,
      frameRate: 16,
      loop: false,
      priority: ANIMATION_PRIORITIES.ATTACK,
      hitboxTiming: {
        startupFrames: 1,
        activeFrames: 2,
        recoveryFrames: 1,
        damage: 12,
        knockback: 140,
        reach: 78,
        heightOffset: -70,
        radius: 42,
        hitType: 'HIGH',
        impactSound: 'PUNCH',
      },
    },
    jumpKick: {
      name: 'jump_kick',
      category: 'KICK',
      imageSrc: `${base}/Kick_Light.png`,
      framesMax: 3,
      frameRate: 15,
      loop: false,
      priority: ANIMATION_PRIORITIES.ATTACK,
      hitboxTiming: {
        startupFrames: 1,
        activeFrames: 2,
        recoveryFrames: 1,
        damage: 15,
        knockback: 180,
        reach: 92,
        heightOffset: -60,
        radius: 46,
        hitType: 'HIGH',
        impactSound: 'KICK',
      },
    },

    // 5. Defense & Damage
    blockStand: {
      name: 'block_stand',
      category: 'DEFENSE',
      imageSrc: `${base}/Block.png`,
      framesMax: 2,
      frameRate: 8,
      loop: false,
      holdLastFrame: true,
      priority: ANIMATION_PRIORITIES.MOVE,
    },
    blockCrouch: {
      name: 'block_crouch',
      category: 'DEFENSE',
      imageSrc: `${base}/Block_Crouch.png`,
      framesMax: 2,
      frameRate: 8,
      loop: false,
      holdLastFrame: true,
      priority: ANIMATION_PRIORITIES.MOVE,
    },
    hitLight: {
      name: 'hit_light',
      category: 'DAMAGE',
      imageSrc: `${base}/Take Hit.png`,
      framesMax: 3,
      frameRate: 14,
      loop: false,
      priority: ANIMATION_PRIORITIES.HIT,
    },
    hitHeavy: {
      name: 'hit_heavy',
      category: 'DAMAGE',
      imageSrc: `${base}/Take Hit.png`,
      framesMax: 3,
      frameRate: 10,
      loop: false,
      priority: ANIMATION_PRIORITIES.HIT,
    },
    knockback: {
      name: 'knockback',
      category: 'DAMAGE',
      imageSrc: `${base}/Take Hit.png`,
      framesMax: 3,
      frameRate: 8,
      loop: false,
      holdLastFrame: true,
      priority: ANIMATION_PRIORITIES.KNOCKDOWN,
    },
    knockdown: {
      name: 'knockdown',
      category: 'DAMAGE',
      imageSrc: `${base}/Death.png`,
      framesMax: 4,
      frameRate: 10,
      loop: false,
      holdLastFrame: true,
      priority: ANIMATION_PRIORITIES.KNOCKDOWN,
    },
    getUp: {
      name: 'get_up',
      category: 'DAMAGE',
      imageSrc: `${base}/Crouch.png`,
      framesMax: 2,
      frameRate: 8,
      loop: false,
      priority: ANIMATION_PRIORITIES.KNOCKDOWN,
    },

    // 6. Special & Outcomes
    special: {
      name: 'special',
      category: 'SPECIAL',
      imageSrc: `${base}/Special.png`,
      framesMax: 5,
      frameRate: 14,
      loop: false,
      priority: ANIMATION_PRIORITIES.ATTACK,
      hitboxTiming: {
        startupFrames: 2,
        activeFrames: 2,
        recoveryFrames: 1,
        damage: 32,
        knockback: 340,
        reach: 130,
        heightOffset: -95,
        radius: 65,
        hitType: 'MID',
        impactSound: 'SPECIAL',
      },
    },
    victory: {
      name: 'victory',
      category: 'SPECIAL',
      imageSrc: `${base}/Victory.png`,
      framesMax: 4,
      frameRate: 8,
      loop: true,
      priority: ANIMATION_PRIORITIES.CINEMATIC,
    },
    defeat: {
      name: 'defeat',
      category: 'SPECIAL',
      imageSrc: `${base}/Death.png`,
      framesMax: 4,
      frameRate: 8,
      loop: false,
      holdLastFrame: true,
      priority: ANIMATION_PRIORITIES.CINEMATIC,
    },
  };
};

export const P1_ANIMATIONS = createFighterAnimationSet('p1');
export const P2_ANIMATIONS = createFighterAnimationSet('p2');

export const getFighterAnimationSet = (fighterId: string): CharacterAnimationSet => {
  const upper = fighterId.toUpperCase();
  if (upper === 'KAI' || upper === 'P1') return P1_ANIMATIONS;
  if (upper === 'SHADOW' || upper === 'P2') return P2_ANIMATIONS;
  return createFighterAnimationSet(`roster/${fighterId.toLowerCase()}`);
};
