// src/types/index.ts

export type GameMode = 'VERSUS' | 'TRAINING';

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
  | 'PUNCH_LEFT'
  | 'PUNCH_RIGHT'
  | 'PUNCH_HEAVY'
  | 'KICK_FRONT'
  | 'KICK_HIGH'
  | 'KICK_LOW'
  | 'BLOCK'
  | 'HIT_STAGGER'
  | 'KNOCKBACK'
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
}

export type AttackType = 
  | 'PUNCH_LEFT' 
  | 'PUNCH_RIGHT' 
  | 'PUNCH_HEAVY' 
  | 'KICK_FRONT' 
  | 'KICK_HIGH' 
  | 'KICK_LOW';

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
  roundsWon: number;
  isGrounded: boolean;
  facing: 1 | -1; // 1 = right, -1 = left
  state: FighterState;
  currentAnimation?: AnimationName;
  colorScheme: {
    primary: string;
    secondary: string;
    accent: string;
    emissive: string;
  };
}

export type GraphicsQuality = 'low' | 'medium' | 'high';

export interface GameSettings {
  graphicsQuality: GraphicsQuality;
  masterVolume: number;
  sfxVolume: number;
  musicVolume: number;
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
