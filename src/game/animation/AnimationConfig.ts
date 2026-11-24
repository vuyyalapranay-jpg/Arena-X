// src/game/animation/AnimationConfig.ts
// COMPREHENSIVE 2D FIGHTING ANIMATION CONFIGURATION WITH OPEN-SOURCE SPRITE ANIMATIONS

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

/**
 * Creates Samurai animation set (LuizMelo open-source sprite sheets, 200x200 frames).
 */
export const createSamuraiAnimationSet = (folder = 'samuraiMack'): CharacterAnimationSet => {
  const base = `/assets/sprites/${folder}`;
  return {
    idle: {
      name: 'idle',
      category: 'MOVEMENT',
      imageSrc: `${base}/Idle.png`,
      framesMax: 8,
      frameRate: 8,
      loop: true,
      priority: ANIMATION_PRIORITIES.IDLE,
    },
    idleBlink: {
      name: 'idle_blink',
      category: 'MOVEMENT',
      imageSrc: `${base}/Idle.png`,
      framesMax: 8,
      frameRate: 8,
      loop: true,
      priority: ANIMATION_PRIORITIES.IDLE,
    },
    walkFwd: {
      name: 'walk_fwd',
      category: 'MOVEMENT',
      imageSrc: `${base}/Run.png`,
      framesMax: 8,
      frameRate: 8,
      loop: true,
      priority: ANIMATION_PRIORITIES.MOVE,
    },
    walkBwd: {
      name: 'walk_bwd',
      category: 'MOVEMENT',
      imageSrc: `${base}/Run.png`,
      framesMax: 8,
      frameRate: 7,
      loop: true,
      priority: ANIMATION_PRIORITIES.MOVE,
    },
    runFwd: {
      name: 'run_fwd',
      category: 'MOVEMENT',
      imageSrc: `${base}/Run.png`,
      framesMax: 8,
      frameRate: 12,
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
      imageSrc: `${base}/Idle.png`,
      framesMax: 8,
      frameRate: 6,
      loop: false,
      holdLastFrame: true,
      priority: ANIMATION_PRIORITIES.MOVE,
    },
    standUp: {
      name: 'stand_up',
      category: 'MOVEMENT',
      imageSrc: `${base}/Idle.png`,
      framesMax: 8,
      frameRate: 10,
      loop: false,
      priority: ANIMATION_PRIORITIES.MOVE,
    },

    // 2. Jumping
    jumpStart: {
      name: 'jump_start',
      category: 'JUMP',
      imageSrc: `${base}/Jump.png`,
      framesMax: 2,
      frameRate: 8,
      loop: false,
      priority: ANIMATION_PRIORITIES.JUMP,
    },
    jumpRise: {
      name: 'jump_rise',
      category: 'JUMP',
      imageSrc: `${base}/Jump.png`,
      framesMax: 2,
      frameRate: 5,
      loop: false,
      holdLastFrame: true,
      priority: ANIMATION_PRIORITIES.JUMP,
    },
    jumpApex: {
      name: 'jump_apex',
      category: 'JUMP',
      imageSrc: `${base}/Jump.png`,
      framesMax: 2,
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
      imageSrc: `${base}/Idle.png`,
      framesMax: 8,
      frameRate: 14,
      loop: false,
      priority: ANIMATION_PRIORITIES.JUMP,
    },

    // 3. Attacks
    punchLight: {
      name: 'punch_light',
      category: 'PUNCH',
      imageSrc: `${base}/Attack1.png`,
      framesMax: 6,
      frameRate: 16,
      loop: false,
      priority: ANIMATION_PRIORITIES.ATTACK,
      hitboxTiming: {
        startupFrames: 3,
        activeFrames: 3,
        recoveryFrames: 0,
        damage: 10,
        knockback: 120,
        reach: 220,
        heightOffset: -140,
        radius: 95,
        hitType: 'HIGH',
        impactSound: 'PUNCH',
      },
    },
    punchHeavy: {
      name: 'punch_heavy',
      category: 'PUNCH',
      imageSrc: `${base}/Attack2.png`,
      framesMax: 6,
      frameRate: 14,
      loop: false,
      priority: ANIMATION_PRIORITIES.ATTACK,
      hitboxTiming: {
        startupFrames: 3,
        activeFrames: 3,
        recoveryFrames: 0,
        damage: 18,
        knockback: 220,
        reach: 260,
        heightOffset: -140,
        radius: 120,
        hitType: 'MID',
        impactSound: 'HEAVY',
      },
    },
    punchForward: {
      name: 'punch_forward',
      category: 'PUNCH',
      imageSrc: `${base}/Attack1.png`,
      framesMax: 6,
      frameRate: 14,
      loop: false,
      priority: ANIMATION_PRIORITIES.ATTACK,
      hitboxTiming: {
        startupFrames: 3,
        activeFrames: 3,
        recoveryFrames: 0,
        damage: 12,
        knockback: 160,
        reach: 250,
        heightOffset: -140,
        radius: 110,
        hitType: 'HIGH',
        impactSound: 'PUNCH',
      },
    },
    uppercut: {
      name: 'uppercut',
      category: 'PUNCH',
      imageSrc: `${base}/Attack2.png`,
      framesMax: 6,
      frameRate: 14,
      loop: false,
      priority: ANIMATION_PRIORITIES.ATTACK,
      hitboxTiming: {
        startupFrames: 3,
        activeFrames: 3,
        recoveryFrames: 0,
        damage: 22,
        knockback: 260,
        reach: 210,
        heightOffset: -180,
        radius: 115,
        hitType: 'HIGH',
        impactSound: 'HEAVY',
      },
    },
    comboPunch: {
      name: 'combo_punch',
      category: 'PUNCH',
      imageSrc: `${base}/Attack1.png`,
      framesMax: 6,
      frameRate: 18,
      loop: false,
      priority: ANIMATION_PRIORITIES.ATTACK,
    },

    // 4. Kicking
    kickLight: {
      name: 'kick_light',
      category: 'KICK',
      imageSrc: `${base}/Attack1.png`,
      framesMax: 6,
      frameRate: 16,
      loop: false,
      priority: ANIMATION_PRIORITIES.ATTACK,
      hitboxTiming: {
        startupFrames: 3,
        activeFrames: 3,
        recoveryFrames: 0,
        damage: 10,
        knockback: 130,
        reach: 230,
        heightOffset: -130,
        radius: 100,
        hitType: 'MID',
        impactSound: 'KICK',
      },
    },
    kickHeavy: {
      name: 'kick_heavy',
      category: 'KICK',
      imageSrc: `${base}/Attack2.png`,
      framesMax: 6,
      frameRate: 13,
      loop: false,
      priority: ANIMATION_PRIORITIES.ATTACK,
      hitboxTiming: {
        startupFrames: 3,
        activeFrames: 3,
        recoveryFrames: 0,
        damage: 20,
        knockback: 250,
        reach: 270,
        heightOffset: -130,
        radius: 120,
        hitType: 'MID',
        impactSound: 'HEAVY',
      },
    },
    kickHigh: {
      name: 'kick_high',
      category: 'KICK',
      imageSrc: `${base}/Attack2.png`,
      framesMax: 6,
      frameRate: 14,
      loop: false,
      priority: ANIMATION_PRIORITIES.ATTACK,
      hitboxTiming: {
        startupFrames: 3,
        activeFrames: 3,
        recoveryFrames: 0,
        damage: 16,
        knockback: 200,
        reach: 260,
        heightOffset: -190,
        radius: 115,
        hitType: 'HIGH',
        impactSound: 'KICK',
      },
    },
    kickLow: {
      name: 'kick_low',
      category: 'KICK',
      imageSrc: `${base}/Attack1.png`,
      framesMax: 6,
      frameRate: 16,
      loop: false,
      priority: ANIMATION_PRIORITIES.ATTACK,
      hitboxTiming: {
        startupFrames: 3,
        activeFrames: 3,
        recoveryFrames: 0,
        damage: 9,
        knockback: 90,
        reach: 220,
        heightOffset: -45,
        radius: 95,
        hitType: 'LOW',
        impactSound: 'KICK',
      },
    },
    roundhouse: {
      name: 'roundhouse',
      category: 'KICK',
      imageSrc: `${base}/Attack2.png`,
      framesMax: 6,
      frameRate: 12,
      loop: false,
      priority: ANIMATION_PRIORITIES.ATTACK,
      hitboxTiming: {
        startupFrames: 3,
        activeFrames: 3,
        recoveryFrames: 0,
        damage: 24,
        knockback: 280,
        reach: 280,
        heightOffset: -140,
        radius: 130,
        hitType: 'MID',
        impactSound: 'HEAVY',
      },
    },

    // 5. Air Attacks
    jumpPunch: {
      name: 'jump_punch',
      category: 'PUNCH',
      imageSrc: `${base}/Attack1.png`,
      framesMax: 6,
      frameRate: 14,
      loop: false,
      priority: ANIMATION_PRIORITIES.ATTACK,
      hitboxTiming: {
        startupFrames: 2,
        activeFrames: 3,
        recoveryFrames: 1,
        damage: 14,
        knockback: 180,
        reach: 200,
        heightOffset: -120,
        radius: 95,
        hitType: 'MID',
        impactSound: 'PUNCH',
      },
    },
    jumpKick: {
      name: 'jump_kick',
      category: 'KICK',
      imageSrc: `${base}/Attack2.png`,
      framesMax: 6,
      frameRate: 14,
      loop: false,
      priority: ANIMATION_PRIORITIES.ATTACK,
      hitboxTiming: {
        startupFrames: 2,
        activeFrames: 3,
        recoveryFrames: 1,
        damage: 16,
        knockback: 210,
        reach: 230,
        heightOffset: -110,
        radius: 105,
        hitType: 'MID',
        impactSound: 'KICK',
      },
    },

    // 6. Defense & Damage
    blockStand: {
      name: 'block_stand',
      category: 'DEFENSE',
      imageSrc: `${base}/Idle.png`,
      framesMax: 8,
      frameRate: 8,
      loop: true,
      priority: ANIMATION_PRIORITIES.MOVE,
    },
    blockCrouch: {
      name: 'block_crouch',
      category: 'DEFENSE',
      imageSrc: `${base}/Idle.png`,
      framesMax: 8,
      frameRate: 8,
      loop: true,
      priority: ANIMATION_PRIORITIES.MOVE,
    },
    hitLight: {
      name: 'hit_light',
      category: 'DAMAGE',
      imageSrc: `${base}/Take Hit.png`,
      framesMax: 4,
      frameRate: 14,
      loop: false,
      priority: ANIMATION_PRIORITIES.HIT,
    },
    hitHeavy: {
      name: 'hit_heavy',
      category: 'DAMAGE',
      imageSrc: `${base}/Take Hit.png`,
      framesMax: 4,
      frameRate: 12,
      loop: false,
      priority: ANIMATION_PRIORITIES.HIT,
    },
    knockback: {
      name: 'knockback',
      category: 'DAMAGE',
      imageSrc: `${base}/Take Hit.png`,
      framesMax: 4,
      frameRate: 10,
      loop: false,
      holdLastFrame: true,
      priority: ANIMATION_PRIORITIES.KNOCKDOWN,
    },
    knockdown: {
      name: 'knockdown',
      category: 'DAMAGE',
      imageSrc: `${base}/Death.png`,
      framesMax: 6,
      frameRate: 9,
      loop: false,
      holdLastFrame: true,
      priority: ANIMATION_PRIORITIES.KNOCKDOWN,
    },
    getUp: {
      name: 'get_up',
      category: 'DAMAGE',
      imageSrc: `${base}/Idle.png`,
      framesMax: 8,
      frameRate: 12,
      loop: false,
      priority: ANIMATION_PRIORITIES.KNOCKDOWN,
    },

    // 7. Special & Outcomes
    special: {
      name: 'special',
      category: 'SPECIAL',
      imageSrc: `${base}/Attack2.png`,
      framesMax: 6,
      frameRate: 16,
      loop: false,
      priority: ANIMATION_PRIORITIES.ATTACK,
      hitboxTiming: {
        startupFrames: 2,
        activeFrames: 2,
        recoveryFrames: 2,
        damage: 34,
        knockback: 350,
        reach: 135,
        heightOffset: -95,
        radius: 65,
        hitType: 'MID',
        impactSound: 'SPECIAL',
      },
    },
    victory: {
      name: 'victory',
      category: 'SPECIAL',
      imageSrc: `${base}/Idle.png`,
      framesMax: 8,
      frameRate: 8,
      loop: true,
      priority: ANIMATION_PRIORITIES.CINEMATIC,
    },
    defeat: {
      name: 'defeat',
      category: 'SPECIAL',
      imageSrc: `${base}/Death.png`,
      framesMax: 6,
      frameRate: 8,
      loop: false,
      holdLastFrame: true,
      priority: ANIMATION_PRIORITIES.CINEMATIC,
    },
  };
};

/**
 * Creates Kenji animation set (LuizMelo open-source sprite sheets, 200x200 frames).
 */
export const createKenjiAnimationSet = (folder = 'kenji'): CharacterAnimationSet => {
  const base = `/assets/sprites/${folder}`;
  return {
    idle: {
      name: 'idle',
      category: 'MOVEMENT',
      imageSrc: `${base}/Idle.png`,
      framesMax: 4,
      frameRate: 6,
      loop: true,
      priority: ANIMATION_PRIORITIES.IDLE,
    },
    idleBlink: {
      name: 'idle_blink',
      category: 'MOVEMENT',
      imageSrc: `${base}/Idle.png`,
      framesMax: 4,
      frameRate: 6,
      loop: true,
      priority: ANIMATION_PRIORITIES.IDLE,
    },
    walkFwd: {
      name: 'walk_fwd',
      category: 'MOVEMENT',
      imageSrc: `${base}/Run.png`,
      framesMax: 8,
      frameRate: 8,
      loop: true,
      priority: ANIMATION_PRIORITIES.MOVE,
    },
    walkBwd: {
      name: 'walk_bwd',
      category: 'MOVEMENT',
      imageSrc: `${base}/Run.png`,
      framesMax: 8,
      frameRate: 7,
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
      imageSrc: `${base}/Idle.png`,
      framesMax: 4,
      frameRate: 6,
      loop: false,
      holdLastFrame: true,
      priority: ANIMATION_PRIORITIES.MOVE,
    },
    standUp: {
      name: 'stand_up',
      category: 'MOVEMENT',
      imageSrc: `${base}/Idle.png`,
      framesMax: 4,
      frameRate: 10,
      loop: false,
      priority: ANIMATION_PRIORITIES.MOVE,
    },

    // 2. Jumping
    jumpStart: {
      name: 'jump_start',
      category: 'JUMP',
      imageSrc: `${base}/Jump.png`,
      framesMax: 2,
      frameRate: 8,
      loop: false,
      priority: ANIMATION_PRIORITIES.JUMP,
    },
    jumpRise: {
      name: 'jump_rise',
      category: 'JUMP',
      imageSrc: `${base}/Jump.png`,
      framesMax: 2,
      frameRate: 5,
      loop: false,
      holdLastFrame: true,
      priority: ANIMATION_PRIORITIES.JUMP,
    },
    jumpApex: {
      name: 'jump_apex',
      category: 'JUMP',
      imageSrc: `${base}/Jump.png`,
      framesMax: 2,
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
      imageSrc: `${base}/Idle.png`,
      framesMax: 4,
      frameRate: 12,
      loop: false,
      priority: ANIMATION_PRIORITIES.JUMP,
    },

    // 3. Attacks
    punchLight: {
      name: 'punch_light',
      category: 'PUNCH',
      imageSrc: `${base}/Attack1.png`,
      framesMax: 4,
      frameRate: 15,
      loop: false,
      priority: ANIMATION_PRIORITIES.ATTACK,
      hitboxTiming: {
        startupFrames: 1,
        activeFrames: 2,
        recoveryFrames: 1,
        damage: 10,
        knockback: 120,
        reach: 220,
        heightOffset: -140,
        radius: 95,
        hitType: 'HIGH',
        impactSound: 'PUNCH',
      },
    },
    punchHeavy: {
      name: 'punch_heavy',
      category: 'PUNCH',
      imageSrc: `${base}/Attack2.png`,
      framesMax: 4,
      frameRate: 13,
      loop: false,
      priority: ANIMATION_PRIORITIES.ATTACK,
      hitboxTiming: {
        startupFrames: 1,
        activeFrames: 2,
        recoveryFrames: 1,
        damage: 18,
        knockback: 220,
        reach: 260,
        heightOffset: -140,
        radius: 120,
        hitType: 'MID',
        impactSound: 'HEAVY',
      },
    },
    punchForward: {
      name: 'punch_forward',
      category: 'PUNCH',
      imageSrc: `${base}/Attack1.png`,
      framesMax: 4,
      frameRate: 14,
      loop: false,
      priority: ANIMATION_PRIORITIES.ATTACK,
      hitboxTiming: {
        startupFrames: 1,
        activeFrames: 2,
        recoveryFrames: 1,
        damage: 12,
        knockback: 150,
        reach: 250,
        heightOffset: -140,
        radius: 110,
        hitType: 'HIGH',
        impactSound: 'PUNCH',
      },
    },
    uppercut: {
      name: 'uppercut',
      category: 'PUNCH',
      imageSrc: `${base}/Attack2.png`,
      framesMax: 4,
      frameRate: 13,
      loop: false,
      priority: ANIMATION_PRIORITIES.ATTACK,
      hitboxTiming: {
        startupFrames: 1,
        activeFrames: 2,
        recoveryFrames: 1,
        damage: 22,
        knockback: 260,
        reach: 210,
        heightOffset: -180,
        radius: 115,
        hitType: 'HIGH',
        impactSound: 'HEAVY',
      },
    },
    comboPunch: {
      name: 'combo_punch',
      category: 'PUNCH',
      imageSrc: `${base}/Attack1.png`,
      framesMax: 4,
      frameRate: 16,
      loop: false,
      priority: ANIMATION_PRIORITIES.ATTACK,
    },

    // 4. Kicking
    kickLight: {
      name: 'kick_light',
      category: 'KICK',
      imageSrc: `${base}/Attack1.png`,
      framesMax: 4,
      frameRate: 15,
      loop: false,
      priority: ANIMATION_PRIORITIES.ATTACK,
      hitboxTiming: {
        startupFrames: 1,
        activeFrames: 2,
        recoveryFrames: 1,
        damage: 10,
        knockback: 130,
        reach: 230,
        heightOffset: -130,
        radius: 100,
        hitType: 'MID',
        impactSound: 'KICK',
      },
    },
    kickHeavy: {
      name: 'kick_heavy',
      category: 'KICK',
      imageSrc: `${base}/Attack2.png`,
      framesMax: 4,
      frameRate: 13,
      loop: false,
      priority: ANIMATION_PRIORITIES.ATTACK,
      hitboxTiming: {
        startupFrames: 1,
        activeFrames: 2,
        recoveryFrames: 1,
        damage: 20,
        knockback: 250,
        reach: 270,
        heightOffset: -130,
        radius: 120,
        hitType: 'MID',
        impactSound: 'HEAVY',
      },
    },
    kickHigh: {
      name: 'kick_high',
      category: 'KICK',
      imageSrc: `${base}/Attack2.png`,
      framesMax: 4,
      frameRate: 14,
      loop: false,
      priority: ANIMATION_PRIORITIES.ATTACK,
      hitboxTiming: {
        startupFrames: 1,
        activeFrames: 2,
        recoveryFrames: 1,
        damage: 16,
        knockback: 200,
        reach: 260,
        heightOffset: -190,
        radius: 115,
        hitType: 'HIGH',
        impactSound: 'KICK',
      },
    },
    kickLow: {
      name: 'kick_low',
      category: 'KICK',
      imageSrc: `${base}/Attack1.png`,
      framesMax: 4,
      frameRate: 15,
      loop: false,
      priority: ANIMATION_PRIORITIES.ATTACK,
      hitboxTiming: {
        startupFrames: 1,
        activeFrames: 2,
        recoveryFrames: 1,
        damage: 9,
        knockback: 90,
        reach: 220,
        heightOffset: -45,
        radius: 95,
        hitType: 'LOW',
        impactSound: 'KICK',
      },
    },
    roundhouse: {
      name: 'roundhouse',
      category: 'KICK',
      imageSrc: `${base}/Attack2.png`,
      framesMax: 4,
      frameRate: 12,
      loop: false,
      priority: ANIMATION_PRIORITIES.ATTACK,
      hitboxTiming: {
        startupFrames: 1,
        activeFrames: 2,
        recoveryFrames: 1,
        damage: 24,
        knockback: 280,
        reach: 280,
        heightOffset: -140,
        radius: 130,
        hitType: 'MID',
        impactSound: 'HEAVY',
      },
    },

    // 5. Air Attacks
    jumpPunch: {
      name: 'jump_punch',
      category: 'PUNCH',
      imageSrc: `${base}/Attack1.png`,
      framesMax: 4,
      frameRate: 14,
      loop: false,
      priority: ANIMATION_PRIORITIES.ATTACK,
      hitboxTiming: {
        startupFrames: 1,
        activeFrames: 2,
        recoveryFrames: 1,
        damage: 14,
        knockback: 180,
        reach: 80,
        heightOffset: -75,
        radius: 45,
        hitType: 'MID',
        impactSound: 'PUNCH',
      },
    },
    jumpKick: {
      name: 'jump_kick',
      category: 'KICK',
      imageSrc: `${base}/Attack2.png`,
      framesMax: 4,
      frameRate: 14,
      loop: false,
      priority: ANIMATION_PRIORITIES.ATTACK,
      hitboxTiming: {
        startupFrames: 1,
        activeFrames: 2,
        recoveryFrames: 1,
        damage: 16,
        knockback: 210,
        reach: 90,
        heightOffset: -65,
        radius: 48,
        hitType: 'MID',
        impactSound: 'KICK',
      },
    },

    // 6. Defense & Damage
    blockStand: {
      name: 'block_stand',
      category: 'DEFENSE',
      imageSrc: `${base}/Idle.png`,
      framesMax: 4,
      frameRate: 6,
      loop: true,
      priority: ANIMATION_PRIORITIES.MOVE,
    },
    blockCrouch: {
      name: 'block_crouch',
      category: 'DEFENSE',
      imageSrc: `${base}/Idle.png`,
      framesMax: 4,
      frameRate: 6,
      loop: true,
      priority: ANIMATION_PRIORITIES.MOVE,
    },
    hitLight: {
      name: 'hit_light',
      category: 'DAMAGE',
      imageSrc: `${base}/Take hit.png`,
      framesMax: 3,
      frameRate: 12,
      loop: false,
      priority: ANIMATION_PRIORITIES.HIT,
    },
    hitHeavy: {
      name: 'hit_heavy',
      category: 'DAMAGE',
      imageSrc: `${base}/Take hit.png`,
      framesMax: 3,
      frameRate: 10,
      loop: false,
      priority: ANIMATION_PRIORITIES.HIT,
    },
    knockback: {
      name: 'knockback',
      category: 'DAMAGE',
      imageSrc: `${base}/Take hit.png`,
      framesMax: 3,
      frameRate: 9,
      loop: false,
      holdLastFrame: true,
      priority: ANIMATION_PRIORITIES.KNOCKDOWN,
    },
    knockdown: {
      name: 'knockdown',
      category: 'DAMAGE',
      imageSrc: `${base}/Death.png`,
      framesMax: 7,
      frameRate: 9,
      loop: false,
      holdLastFrame: true,
      priority: ANIMATION_PRIORITIES.KNOCKDOWN,
    },
    getUp: {
      name: 'get_up',
      category: 'DAMAGE',
      imageSrc: `${base}/Idle.png`,
      framesMax: 4,
      frameRate: 10,
      loop: false,
      priority: ANIMATION_PRIORITIES.KNOCKDOWN,
    },

    // 7. Special & Outcomes
    special: {
      name: 'special',
      category: 'SPECIAL',
      imageSrc: `${base}/Attack2.png`,
      framesMax: 4,
      frameRate: 15,
      loop: false,
      priority: ANIMATION_PRIORITIES.ATTACK,
      hitboxTiming: {
        startupFrames: 1,
        activeFrames: 2,
        recoveryFrames: 1,
        damage: 34,
        knockback: 350,
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
      imageSrc: `${base}/Idle.png`,
      framesMax: 4,
      frameRate: 6,
      loop: true,
      priority: ANIMATION_PRIORITIES.CINEMATIC,
    },
    defeat: {
      name: 'defeat',
      category: 'SPECIAL',
      imageSrc: `${base}/Death.png`,
      framesMax: 7,
      frameRate: 8,
      loop: false,
      holdLastFrame: true,
      priority: ANIMATION_PRIORITIES.CINEMATIC,
    },
  };
};

/**
 * Creates Huntress animation set (150x150 frames).
 */
export const createHuntressAnimationSet = (folder = 'huntress'): CharacterAnimationSet => {
  const base = `/assets/sprites/${folder}`;
  return {
    idle: {
      name: 'idle',
      category: 'MOVEMENT',
      imageSrc: `${base}/Idle.png`,
      framesMax: 8,
      frameRate: 8,
      loop: true,
      priority: ANIMATION_PRIORITIES.IDLE,
    },
    idleBlink: {
      name: 'idle_blink',
      category: 'MOVEMENT',
      imageSrc: `${base}/Idle.png`,
      framesMax: 8,
      frameRate: 8,
      loop: true,
      priority: ANIMATION_PRIORITIES.IDLE,
    },
    walkFwd: {
      name: 'walk_fwd',
      category: 'MOVEMENT',
      imageSrc: `${base}/Run.png`,
      framesMax: 8,
      frameRate: 8,
      loop: true,
      priority: ANIMATION_PRIORITIES.MOVE,
    },
    walkBwd: {
      name: 'walk_bwd',
      category: 'MOVEMENT',
      imageSrc: `${base}/Run.png`,
      framesMax: 8,
      frameRate: 7,
      loop: true,
      priority: ANIMATION_PRIORITIES.MOVE,
    },
    runFwd: {
      name: 'run_fwd',
      category: 'MOVEMENT',
      imageSrc: `${base}/Run.png`,
      framesMax: 8,
      frameRate: 12,
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
      imageSrc: `${base}/Idle.png`,
      framesMax: 8,
      frameRate: 6,
      loop: false,
      holdLastFrame: true,
      priority: ANIMATION_PRIORITIES.MOVE,
    },
    standUp: {
      name: 'stand_up',
      category: 'MOVEMENT',
      imageSrc: `${base}/Idle.png`,
      framesMax: 8,
      frameRate: 10,
      loop: false,
      priority: ANIMATION_PRIORITIES.MOVE,
    },

    // 2. Jumping
    jumpStart: {
      name: 'jump_start',
      category: 'JUMP',
      imageSrc: `${base}/Jump.png`,
      framesMax: 2,
      frameRate: 8,
      loop: false,
      priority: ANIMATION_PRIORITIES.JUMP,
    },
    jumpRise: {
      name: 'jump_rise',
      category: 'JUMP',
      imageSrc: `${base}/Jump.png`,
      framesMax: 2,
      frameRate: 5,
      loop: false,
      holdLastFrame: true,
      priority: ANIMATION_PRIORITIES.JUMP,
    },
    jumpApex: {
      name: 'jump_apex',
      category: 'JUMP',
      imageSrc: `${base}/Jump.png`,
      framesMax: 2,
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
      imageSrc: `${base}/Idle.png`,
      framesMax: 8,
      frameRate: 12,
      loop: false,
      priority: ANIMATION_PRIORITIES.JUMP,
    },

    // 3. Attacks
    punchLight: {
      name: 'punch_light',
      category: 'PUNCH',
      imageSrc: `${base}/Attack1.png`,
      framesMax: 5,
      frameRate: 16,
      loop: false,
      priority: ANIMATION_PRIORITIES.ATTACK,
      hitboxTiming: {
        startupFrames: 2,
        activeFrames: 2,
        recoveryFrames: 1,
        damage: 10,
        knockback: 120,
        reach: 240,
        heightOffset: -140,
        radius: 100,
        hitType: 'HIGH',
        impactSound: 'PUNCH',
      },
    },
    punchHeavy: {
      name: 'punch_heavy',
      category: 'PUNCH',
      imageSrc: `${base}/Attack2.png`,
      framesMax: 5,
      frameRate: 14,
      loop: false,
      priority: ANIMATION_PRIORITIES.ATTACK,
      hitboxTiming: {
        startupFrames: 2,
        activeFrames: 2,
        recoveryFrames: 1,
        damage: 18,
        knockback: 220,
        reach: 270,
        heightOffset: -140,
        radius: 120,
        hitType: 'MID',
        impactSound: 'HEAVY',
      },
    },
    punchForward: {
      name: 'punch_forward',
      category: 'PUNCH',
      imageSrc: `${base}/Attack1.png`,
      framesMax: 5,
      frameRate: 14,
      loop: false,
      priority: ANIMATION_PRIORITIES.ATTACK,
    },
    uppercut: {
      name: 'uppercut',
      category: 'PUNCH',
      imageSrc: `${base}/Attack2.png`,
      framesMax: 5,
      frameRate: 14,
      loop: false,
      priority: ANIMATION_PRIORITIES.ATTACK,
    },
    comboPunch: {
      name: 'combo_punch',
      category: 'PUNCH',
      imageSrc: `${base}/Attack1.png`,
      framesMax: 5,
      frameRate: 16,
      loop: false,
      priority: ANIMATION_PRIORITIES.ATTACK,
    },

    // 4. Kicking
    kickLight: {
      name: 'kick_light',
      category: 'KICK',
      imageSrc: `${base}/Attack1.png`,
      framesMax: 5,
      frameRate: 16,
      loop: false,
      priority: ANIMATION_PRIORITIES.ATTACK,
    },
    kickHeavy: {
      name: 'kick_heavy',
      category: 'KICK',
      imageSrc: `${base}/Attack2.png`,
      framesMax: 5,
      frameRate: 13,
      loop: false,
      priority: ANIMATION_PRIORITIES.ATTACK,
    },
    kickHigh: {
      name: 'kick_high',
      category: 'KICK',
      imageSrc: `${base}/Attack2.png`,
      framesMax: 5,
      frameRate: 14,
      loop: false,
      priority: ANIMATION_PRIORITIES.ATTACK,
    },
    kickLow: {
      name: 'kick_low',
      category: 'KICK',
      imageSrc: `${base}/Attack1.png`,
      framesMax: 5,
      frameRate: 16,
      loop: false,
      priority: ANIMATION_PRIORITIES.ATTACK,
    },
    roundhouse: {
      name: 'roundhouse',
      category: 'KICK',
      imageSrc: `${base}/Attack2.png`,
      framesMax: 5,
      frameRate: 12,
      loop: false,
      priority: ANIMATION_PRIORITIES.ATTACK,
    },

    // 5. Air Attacks
    jumpPunch: {
      name: 'jump_punch',
      category: 'PUNCH',
      imageSrc: `${base}/Attack1.png`,
      framesMax: 5,
      frameRate: 14,
      loop: false,
      priority: ANIMATION_PRIORITIES.ATTACK,
    },
    jumpKick: {
      name: 'jump_kick',
      category: 'KICK',
      imageSrc: `${base}/Attack2.png`,
      framesMax: 5,
      frameRate: 14,
      loop: false,
      priority: ANIMATION_PRIORITIES.ATTACK,
    },

    // 6. Defense & Damage
    blockStand: {
      name: 'block_stand',
      category: 'DEFENSE',
      imageSrc: `${base}/Idle.png`,
      framesMax: 8,
      frameRate: 8,
      loop: true,
      priority: ANIMATION_PRIORITIES.MOVE,
    },
    blockCrouch: {
      name: 'block_crouch',
      category: 'DEFENSE',
      imageSrc: `${base}/Idle.png`,
      framesMax: 8,
      frameRate: 8,
      loop: true,
      priority: ANIMATION_PRIORITIES.MOVE,
    },
    hitLight: {
      name: 'hit_light',
      category: 'DAMAGE',
      imageSrc: `${base}/Take hit.png`,
      framesMax: 3,
      frameRate: 12,
      loop: false,
      priority: ANIMATION_PRIORITIES.HIT,
    },
    hitHeavy: {
      name: 'hit_heavy',
      category: 'DAMAGE',
      imageSrc: `${base}/Take hit.png`,
      framesMax: 3,
      frameRate: 10,
      loop: false,
      priority: ANIMATION_PRIORITIES.HIT,
    },
    knockback: {
      name: 'knockback',
      category: 'DAMAGE',
      imageSrc: `${base}/Take hit.png`,
      framesMax: 3,
      frameRate: 10,
      loop: false,
      holdLastFrame: true,
      priority: ANIMATION_PRIORITIES.KNOCKDOWN,
    },
    knockdown: {
      name: 'knockdown',
      category: 'DAMAGE',
      imageSrc: `${base}/Death.png`,
      framesMax: 8,
      frameRate: 9,
      loop: false,
      holdLastFrame: true,
      priority: ANIMATION_PRIORITIES.KNOCKDOWN,
    },
    getUp: {
      name: 'get_up',
      category: 'DAMAGE',
      imageSrc: `${base}/Idle.png`,
      framesMax: 8,
      frameRate: 12,
      loop: false,
      priority: ANIMATION_PRIORITIES.KNOCKDOWN,
    },

    // 7. Special & Outcomes
    special: {
      name: 'special',
      category: 'SPECIAL',
      imageSrc: `${base}/Attack3.png`,
      framesMax: 7,
      frameRate: 15,
      loop: false,
      priority: ANIMATION_PRIORITIES.ATTACK,
      hitboxTiming: {
        startupFrames: 2,
        activeFrames: 3,
        recoveryFrames: 2,
        damage: 36,
        knockback: 360,
        reach: 145,
        heightOffset: -95,
        radius: 68,
        hitType: 'MID',
        impactSound: 'SPECIAL',
      },
    },
    victory: {
      name: 'victory',
      category: 'SPECIAL',
      imageSrc: `${base}/Idle.png`,
      framesMax: 8,
      frameRate: 8,
      loop: true,
      priority: ANIMATION_PRIORITIES.CINEMATIC,
    },
    defeat: {
      name: 'defeat',
      category: 'SPECIAL',
      imageSrc: `${base}/Death.png`,
      framesMax: 8,
      frameRate: 8,
      loop: false,
      holdLastFrame: true,
      priority: ANIMATION_PRIORITIES.CINEMATIC,
    },
  };
};

export const P1_ANIMATIONS = createSamuraiAnimationSet('samuraiMack');
export const P2_ANIMATIONS = createKenjiAnimationSet('kenji');

export const getFighterAnimationSet = (fighterId: string): CharacterAnimationSet => {
  const upper = (fighterId || '').toUpperCase();
  if (
    upper === 'KAI' ||
    upper === 'P1' ||
    upper === 'RONIN' ||
    upper === 'RYUZEN' ||
    upper === 'TITAN' ||
    upper === 'BLAZE' ||
    upper === 'VOLT' ||
    upper === 'TERRA'
  ) {
    return createSamuraiAnimationSet('samuraiMack');
  } else if (upper === 'VIPER' || upper === 'AETHER' || upper === 'NOVA') {
    return createHuntressAnimationSet('huntress');
  } else {
    // SHADOW, KENJI, P2, REAPER, ECLIPSE, PHANTOM, ZENITH, FROST
    return createKenjiAnimationSet('kenji');
  }
};
