// src/types/index.ts

export type GameMode = 'VERSUS' | 'TRAINING';

export type GameState = 
  | 'MENU'
  | 'INTRO'
  | 'FIGHTING'
  | 'ROUND_OVER'
  | 'MATCH_OVER'
  | 'PAUSED';

export type FighterState = 
  | 'IDLE'
  | 'WALK_FWD'
  | 'WALK_BWD'
  | 'JUMP'
  | 'CROUCH'
  | 'PUNCH'
  | 'KICK'
  | 'BLOCK'
  | 'HIT_STAGGER'
  | 'KNOCKDOWN';

export type PlayerId = 'P1' | 'P2';

export interface FighterInputs {
  moveLeft: boolean;
  moveRight: boolean;
  jump: boolean;
  crouch: boolean;
  punch: boolean;
  kick: boolean;
  block: boolean;
}

export interface AttackData {
  name: string;
  type: 'PUNCH' | 'KICK';
  damage: number;
  startupTime: number; // seconds
  activeTime: number;  // seconds
  recoveryTime: number; // seconds
  reach: number;
  knockback: number;
  height: 'HIGH' | 'MID' | 'LOW';
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
