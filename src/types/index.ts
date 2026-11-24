// src/types/index.ts

export type GameMode = 'VERSUS' | 'TRAINING' | 'ONLINE';

export type GameState = 
  | 'MENU'
  | 'INTRO'
  | 'FIGHTING'
  | 'ROUND_OVER'
  | 'MATCH_OVER'
  | 'PAUSED';

export type AnimationName =
  | 'idle'
  | 'breathing'
  | 'walk_fwd'
  | 'walk_bwd'
  | 'run'
  | 'jump'
  | 'fall'
  | 'land'
  | 'crouch'
  | 'punch_left'
  | 'punch_right'
  | 'punch_heavy'
  | 'kick_front'
  | 'kick_high'
  | 'kick_low'
  | 'block'
  | 'hit_reaction'
  | 'knockback'
  | 'stagger'
  | 'victory'
  | 'defeat';

export type FighterState = 
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
  | 'PUNCH_LEFT'
  | 'PUNCH_RIGHT'
  | 'PUNCH_LIGHT'
  | 'PUNCH_HEAVY'
  | 'PUNCH_FORWARD'
  | 'UPPERCUT'
  | 'COMBO_PUNCH'
  | 'KICK_FRONT'
  | 'KICK_LIGHT'
  | 'KICK_HEAVY'
  | 'KICK_HIGH'
  | 'KICK_LOW'
  | 'ROUNDHOUSE'
  | 'JUMP_PUNCH'
  | 'JUMP_KICK'
  | 'SPECIAL'
  | 'BLOCK'
  | 'GUARD_STUN'
  | 'GUARD_BREAK'
  | 'HIT_STAGGER'
  | 'KNOCKBACK'
  | 'KNOCKDOWN'
  | 'RECOVERY'
  | 'STAGGER'
  | 'VICTORY'
  | 'DEFEAT';

export type PlayerId = 'P1' | 'P2';

export interface FighterInputs {
  moveLeft: boolean;
  moveRight: boolean;
  jump: boolean;
  crouch: boolean;
  punch: boolean;
  kick: boolean;
  block: boolean;
  run?: boolean;
  punchLight?: boolean;
  punchHeavy?: boolean;
  kickLight?: boolean;
  kickHeavy?: boolean;
  special?: boolean;
  special2?: boolean;
  special3?: boolean;
  charge?: boolean;
  ultimate?: boolean;
}

export type AttackType = 
  // Punches
  | 'PUNCH_LEFT' 
  | 'PUNCH_RIGHT' 
  | 'PUNCH_LIGHT'
  | 'PUNCH_HEAVY' 
  | 'PUNCH_FORWARD'
  | 'UPPERCUT'
  | 'COMBO_PUNCH'
  // Kicks
  | 'KICK_FRONT' 
  | 'KICK_LIGHT'
  | 'KICK_HEAVY'
  | 'KICK_HIGH' 
  | 'KICK_LOW'
  | 'ROUNDHOUSE'
  // Air Attacks
  | 'JUMP_PUNCH'
  | 'JUMP_KICK'
  // Special Attacks — Kai (Blue Energy)
  | 'ENERGY_PUNCH'
  | 'BLUE_WAVE'
  | 'FLASH_DASH'
  | 'SKY_BREAKER'
  | 'ULTIMATE_CELESTIAL_BURST'
  // Special Attacks — Shadow (Dark Purple Energy)
  | 'SHADOW_STRIKE'
  | 'DARK_ORB'
  | 'PHANTOM_DASH'
  | 'VOID_IMPACT'
  | 'ULTIMATE_ECLIPSE_DOMINION'
  // Legacy Aliases
  | 'SPECIAL'
  | 'CRIMSON_FIREBALL'
  | 'SHADOW_SHURIKEN';

export interface AttackData {
  name: string;
  type: AttackType;
  damage: number;
  startupTime: number; // seconds
  activeTime: number;  // seconds
  recoveryTime: number; // seconds
  reach: number;
  knockback: number;
  height: 'HIGH' | 'MID' | 'LOW';
  animation: AnimationName;
}

export interface FighterStats {
  id: PlayerId;
  name: string;
  maxHealth: number;
  currentHealth: number;
  guardMeter: number;
  maxGuardMeter: number;
  superMeter: number;
  isInvulnerable: boolean;
  roundsWon: number;
  isGrounded: boolean;
  facing: 1 | -1; // 1 = right, -1 = left
  state: FighterState;
  currentAnimation?: AnimationName;
  comboCount?: number;
  comboDamage?: number;
  colorScheme: {
    primary: string;
    secondary: string;
    accent: string;
    emissive: string;
  };
}

export type GraphicsQuality = 'low' | 'medium' | 'high';

export interface GameSettings {
  renderMode?: '3D' | '2D';
  graphicsQuality: GraphicsQuality;
  masterVolume: number;
  sfxVolume: number;
  musicVolume: number;
  voiceVolume: number;
  ambienceVolume: number;
  isMuted: boolean;
  showHitboxes: boolean;
  showControlsOverlay: boolean;
  enableTouchControls: boolean;
}

export interface MatchState {
  round: number;
  timeRemaining: number;
  p1RoundsWon: number;
  p2RoundsWon: number;
  winner: PlayerId | 'DRAW' | null;
  announcement: string | null;
}
