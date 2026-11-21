// src/config/gameConfig.ts
import { GameSettings } from '../types';
import { CHARACTER_PROFILES, COMBAT_ATTACKS } from '../game/characters/CharacterConfig';

export const GAME_CONFIG = {
  // Arena Geometry & Bounds
  ARENA: {
    WIDTH: 24,           // Arena boundary from X = -12 to X = +12
    DEPTH: 8,            // Z visual width
    FIGHT_PLANE_Z: 0,    // Strictly constrained to Z = 0 for 2.5D
    FLOOR_Y: 0,
    WALL_LIMIT_LEFT: -10.5,
    WALL_LIMIT_RIGHT: 10.5,
    CEILING_LIMIT: 8.0,
  },

  // Physics tuning
  PHYSICS: {
    GRAVITY: -28.0,
    JUMP_IMPULSE: 12.5,
    WALK_SPEED: 5.5,
    WALK_BACK_SPEED: 4.0,
    DASH_SPEED: 8.5,
    FRICTION: 0.85,
    PUSH_BOX_RADIUS: 0.65,
    CHARACTER_HEIGHT: 1.9,
    CHARACTER_RADIUS: 0.45,
  },

  // Camera settings
  CAMERA: {
    FOV: 46,
    BASE_DISTANCE: 8.2,
    MIN_DISTANCE: 6.8,
    MAX_DISTANCE: 11.5,
    BASE_HEIGHT: 2.1,
    MAX_HEIGHT_OFFSET: 1.5,
    TRACKING_SMOOTHING: 0.08,
    ZOOM_SMOOTHING: 0.06,
    MAX_X_OFFSET: 6.0,
  },

  // Match rules
  MATCH: {
    ROUND_DURATION: 99, // seconds
    ROUNDS_TO_WIN: 2,
    DEFAULT_MAX_HEALTH: 100,
    HIT_FREEZE_DURATION: 0.06, // hitstop in seconds
  },

  // Combat Attacks & Fighter Archetypes
  ATTACKS: COMBAT_ATTACKS,
  FIGHTERS: CHARACTER_PROFILES,

  // Default Game Settings
  DEFAULT_SETTINGS: {
    graphicsQuality: 'high',
    masterVolume: 0.8,
    sfxVolume: 0.9,
    musicVolume: 0.7,
    showHitboxes: false,
    showControlsOverlay: true,
    enableTouchControls: false,
  } as GameSettings,
};
