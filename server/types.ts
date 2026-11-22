// server/types.ts
// SHARED MULTIPLAYER PROTOCOL & COMBAT TYPES FOR ARENA X

export type OnlineCharacter = 'KAI' | 'SHADOW';
export type PlayerSlot = 'P1' | 'P2';
export type RoomVisibility = 'PUBLIC' | 'PRIVATE';
export type RoomStatus = 'WAITING' | 'IN_LOBBY' | 'FIGHTING' | 'FINISHED';

export interface RoomMetadata {
  id: string;
  code: string;
  name: string;
  hostName: string;
  visibility: RoomVisibility;
  hasPassword: boolean;
  status: RoomStatus;
  playerCount: number;
  maxPlayers: number;
  stage: string;
  createdAt: number;
}

export interface NetworkPlayerInput {
  seq: number;
  left: boolean;
  right: boolean;
  jump: boolean;
  crouch: boolean;
  lightPunch: boolean;
  heavyPunch: boolean;
  lightKick: boolean;
  heavyKick: boolean;
  block: boolean;
  charge: boolean;
  special: boolean;
  ultimate: boolean;
}

export interface SynchronizedPlayerState {
  sessionId: string;
  slot: PlayerSlot;
  name: string;
  character: OnlineCharacter;
  isHost: boolean;
  isReady: boolean;
  isConnected: boolean;
  reconnectToken: string;
  disconnectTimer: number; // Seconds remaining to reconnect
  ping: number;

  // Combat State
  x: number;
  y: number;
  vx: number;
  vy: number;
  facing: 1 | -1;
  state: string; // 'IDLE' | 'WALK' | 'JUMP' | 'ATTACK' | 'BLOCK' | 'HIT_STUN' | 'KNOCKDOWN' | 'CHARGING' | 'SURGE' | 'CINEMATIC_ULTIMATE'
  animKey: string;
  health: number;
  maxHealth: number;
  guardMeter: number;
  superMeter: number;
  isCharging: boolean;
  isSurging: boolean;
  isCinematic: boolean;
  currentAttackType: string | null;
  comboCount: number;
  roundsWon: number;
}

export interface SynchronizedProjectile {
  id: string;
  owner: PlayerSlot;
  type: string; // 'BLUE_WAVE' | 'DARK_ORB'
  x: number;
  y: number;
  vx: number;
  radius: number;
}

export interface SynchronizedMatchState {
  roomId: string;
  roomCode: string;
  stage: string;
  status: RoomStatus;
  round: number;
  timeRemaining: number;
  announcement: string | null;
  winner: PlayerSlot | null;
  lastHitEvent?: {
    x: number;
    y: number;
    type: string;
    isBlocked: boolean;
    timestamp: number;
  };
}

export interface FullRoomSnapshot {
  timestamp: number;
  match: SynchronizedMatchState;
  p1: SynchronizedPlayerState | null;
  p2: SynchronizedPlayerState | null;
  projectiles: SynchronizedProjectile[];
}

// Client -> Server Message Types
export type ClientMessageType =
  | 'join_room'
  | 'set_name'
  | 'select_character'
  | 'select_stage'
  | 'toggle_ready'
  | 'start_match'
  | 'player_input'
  | 'ping'
  | 'leave_room'
  | 'reconnect';

export interface ClientMessage<T = any> {
  type: ClientMessageType;
  payload: T;
}

// Server -> Client Message Types
export type ServerMessageType =
  | 'room_joined'
  | 'room_list'
  | 'state_snapshot'
  | 'player_joined'
  | 'player_left'
  | 'match_started'
  | 'hit_event'
  | 'reconnect_success'
  | 'opponent_reconnecting'
  | 'opponent_reconnected'
  | 'ping'
  | 'error';

export interface ServerMessage<T = any> {
  type: ServerMessageType;
  payload: T;
}
