// src/config/gameConfig.ts
import { AttackData, GameSettings } from '../types';

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

  // Attacks
  ATTACKS: {
    PUNCH: {
      name: 'Straight Jab',
      type: 'PUNCH',
      damage: 8,
      startupTime: 0.08,
      activeTime: 0.12,
      recoveryTime: 0.18,
      reach: 1.25,
      knockback: 1.8,
      height: 'HIGH',
    } as AttackData,
    KICK: {
      name: 'High Roundhouse',
      type: 'KICK',
      damage: 14,
      startupTime: 0.14,
      activeTime: 0.16,
      recoveryTime: 0.28,
      reach: 1.55,
      knockback: 3.2,
      height: 'MID',
    } as AttackData,
  },

  // Fighter archetypes / colors
  FIGHTERS: {
    P1: {
      name: 'VORTEX',
      subtitle: 'Crimson Striker',
      colors: {
        primary: '#ff1a4b',      // Electric Crimson
        secondary: '#161922',    // Dark Titanium
        accent: '#ff5c26',       // Molten Amber
        emissive: '#ff003c',     // Red Visor / Core
      },
      spawnX: -3.5,
      facing: 1 as const,
    },
    P2: {
      name: 'ION',
      subtitle: 'Cobalt Vanguard',
      colors: {
        primary: '#00f0ff',      // Electric Cyan
        secondary: '#131b26',    // Dark Cobalt
        accent: '#0066ff',       // Deep Royal Blue
        emissive: '#00e5ff',     // Cyan Visor / Core
      },
      spawnX: 3.5,
      facing: -1 as const,
    },
  },

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
