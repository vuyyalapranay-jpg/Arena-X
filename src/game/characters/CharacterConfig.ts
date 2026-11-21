// src/game/characters/CharacterConfig.ts
import { AttackData, AttackType } from '../../types';

export interface FighterVisualProfile {
  name: string;
  subtitle: string;
  archetype: 'MARTIAL_ARTIST' | 'CYBER_STRIKER';
  hairStyle: 'SPIKED_HEADBAND' | 'UNDERCUT_FADE';
  outfitStyle: 'GI_VEST' | 'TACTICAL_JACKET';
  colors: {
    primary: string;      // Team color (Red / Blue)
    secondary: string;    // Dark carbon/black
    accent: string;       // Secondary highlight
    emissive: string;     // Glowing trim / eyes
    skin: string;         // Realistic natural skin tone
    hair: string;         // Hair tone
    clothing: string;     // Main cloth color
    trousers: string;     // Pants color
    boots: string;        // Footwear color
  };
  spawnX: number;
  facing: 1 | -1;
}

export const CHARACTER_PROFILES: Record<'P1' | 'P2', FighterVisualProfile> = {
  P1: {
    name: 'VORTEX',
    subtitle: 'Crimson Striker',
    archetype: 'MARTIAL_ARTIST',
    hairStyle: 'SPIKED_HEADBAND',
    outfitStyle: 'GI_VEST',
    colors: {
      primary: '#ff1a4b',      // Electric Crimson
      secondary: '#12151e',    // Deep Charcoal / Onyx
      accent: '#ff5c26',       // Molten Amber
      emissive: '#ff003c',     // Red Visor / Node
      skin: '#d9a07a',         // Natural athletic skin
      hair: '#141416',         // Dark hair with crimson tint
      clothing: '#181b24',     // Dark martial arts vest
      trousers: '#0f1118',     // Black pants with red stripe
      boots: '#99112a',        // Red & black combat boots
    },
    spawnX: -3.5,
    facing: 1,
  },
  P2: {
    name: 'ION',
    subtitle: 'Cobalt Vanguard',
    archetype: 'CYBER_STRIKER',
    hairStyle: 'UNDERCUT_FADE',
    outfitStyle: 'TACTICAL_JACKET',
    colors: {
      primary: '#00f0ff',      // Electric Cyan
      secondary: '#0e1420',    // Dark Navy Charcoal
      accent: '#0066ff',       // Royal Blue
      emissive: '#00e5ff',     // Cyan Visor / Trim
      skin: '#c8997a',         // Natural tanned skin
      hair: '#252936',         // Undercut with cyan edge
      clothing: '#141a26',     // Tactical cyber jacket
      trousers: '#111722',     // Tactical cargo pants
      boots: '#0d2238',        // High-top cyber sneakers
    },
    spawnX: 3.5,
    facing: -1,
  },
};

export const COMBAT_ATTACKS: Record<AttackType, AttackData> = {
  PUNCH_LEFT: {
    name: 'Lead Jab',
    type: 'PUNCH_LEFT',
    damage: 7,
    startupTime: 0.07,
    activeTime: 0.10,
    recoveryTime: 0.14,
    reach: 1.25,
    knockback: 1.4,
    height: 'HIGH',
    animation: 'punch_left',
  },
  PUNCH_RIGHT: {
    name: 'Straight Cross',
    type: 'PUNCH_RIGHT',
    damage: 11,
    startupTime: 0.11,
    activeTime: 0.13,
    recoveryTime: 0.18,
    reach: 1.38,
    knockback: 2.2,
    height: 'HIGH',
    animation: 'punch_right',
  },
  PUNCH_HEAVY: {
    name: 'Overhand Smash',
    type: 'PUNCH_HEAVY',
    damage: 17,
    startupTime: 0.16,
    activeTime: 0.15,
    recoveryTime: 0.24,
    reach: 1.50,
    knockback: 3.6,
    height: 'MID',
    animation: 'punch_heavy',
  },
  KICK_FRONT: {
    name: 'Front Snap Kick',
    type: 'KICK_FRONT',
    damage: 10,
    startupTime: 0.11,
    activeTime: 0.13,
    recoveryTime: 0.19,
    reach: 1.42,
    knockback: 2.0,
    height: 'MID',
    animation: 'kick_front',
  },
  KICK_HIGH: {
    name: 'Roundhouse Strike',
    type: 'KICK_HIGH',
    damage: 16,
    startupTime: 0.15,
    activeTime: 0.15,
    recoveryTime: 0.26,
    reach: 1.62,
    knockback: 3.4,
    height: 'HIGH',
    animation: 'kick_high',
  },
  KICK_LOW: {
    name: 'Low Shin Sweep',
    type: 'KICK_LOW',
    damage: 12,
    startupTime: 0.13,
    activeTime: 0.14,
    recoveryTime: 0.21,
    reach: 1.35,
    knockback: 1.8,
    height: 'LOW',
    animation: 'kick_low',
  },
};
