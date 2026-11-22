// src/game/characters/CharacterConfig.ts
import { AttackData, AttackType } from '../../types';

export interface FighterVisualProfile {
  name: string;
  subtitle: string;
  archetype: 'MARTIAL_ARTIST' | 'SHADOW_FIGHTER';
  colors: {
    primary: string;      // Team color (Red / Blue)
    secondary: string;    // Deep Charcoal / Black
    accent: string;       // Secondary highlight
    emissive: string;     // Glowing eye / trim accent
    skin: string;         // Natural athletic skin tone
    hair: string;         // Hair tone
    clothing: string;     // Vest & gear tone
    trousers: string;     // Pants tone
    boots: string;        // Footwear tone
  };
  spawnX: number;
  facing: 1 | -1;
}

export const CHARACTER_PROFILES: Record<'P1' | 'P2', FighterVisualProfile> = {
  P1: {
    name: 'KAI',
    subtitle: 'CRIMSON STRIKER',
    archetype: 'MARTIAL_ARTIST',
    colors: {
      primary: '#ff1a4b',      // Fiery Crimson
      secondary: '#11131a',    // Charcoal Black
      accent: '#ff5c26',       // Molten Amber
      emissive: '#ff003c',     // Crimson Glow
      skin: '#e2a77f',         // Athletic natural skin
      hair: '#141416',         // Jet black hair with fringe
      clothing: '#c81b36',     // Crimson martial arts hooded gi
      trousers: '#101217',     // Black fighting trousers with red trim
      boots: '#a8132d',        // Red & black strapped combat boots
    },
    spawnX: -3.6,
    facing: 1,
  },
  P2: {
    name: 'ZEN',
    subtitle: 'SHADOW FIGHTER',
    archetype: 'SHADOW_FIGHTER',
    colors: {
      primary: '#0077ff',      // Royal Blue
      secondary: '#0b1019',    // Deep Midnight Charcoal
      accent: '#00d9ff',       // Electric Cyan
      emissive: '#00f0ff',     // Cyan Eye / Core Glow
      skin: '#d49b77',         // Natural athletic skin
      hair: '#162238',         // Dark blue-tinted hair with bangs
      clothing: '#0f4cb8',     // Cobalt blue tactical martial arts gi
      trousers: '#0d1017',     // Black ninja trousers with blue straps
      boots: '#09275e',        // Blue & black strapped shinobi boots
    },
    spawnX: 3.6,
    facing: -1,
  },
};

export const COMBAT_ATTACKS: Record<AttackType, AttackData> = {
  PUNCH_LEFT: {
    name: 'Lead Jab',
    type: 'PUNCH_LEFT',
    damage: 8,
    startupTime: 0.06,
    activeTime: 0.08,
    recoveryTime: 0.12,
    reach: 1.30,
    knockback: 1.2,
    height: 'HIGH',
    animation: 'punch_left',
  },
  PUNCH_RIGHT: {
    name: 'Straight Cross',
    type: 'PUNCH_RIGHT',
    damage: 13,
    startupTime: 0.10,
    activeTime: 0.12,
    recoveryTime: 0.16,
    reach: 1.45,
    knockback: 2.2,
    height: 'HIGH',
    animation: 'punch_right',
  },
  PUNCH_HEAVY: {
    name: 'Overhand Smash',
    type: 'PUNCH_HEAVY',
    damage: 18,
    startupTime: 0.14,
    activeTime: 0.14,
    recoveryTime: 0.22,
    reach: 1.55,
    knockback: 3.8,
    height: 'MID',
    animation: 'punch_heavy',
  },
  KICK_FRONT: {
    name: 'Front Snap Kick',
    type: 'KICK_FRONT',
    damage: 11,
    startupTime: 0.09,
    activeTime: 0.11,
    recoveryTime: 0.17,
    reach: 1.48,
    knockback: 2.0,
    height: 'MID',
    animation: 'kick_front',
  },
  KICK_HIGH: {
    name: 'Roundhouse Kick',
    type: 'KICK_HIGH',
    damage: 17,
    startupTime: 0.13,
    activeTime: 0.14,
    recoveryTime: 0.24,
    reach: 1.68,
    knockback: 3.6,
    height: 'HIGH',
    animation: 'kick_high',
  },
  KICK_LOW: {
    name: 'Low Shin Sweep',
    type: 'KICK_LOW',
    damage: 12,
    startupTime: 0.11,
    activeTime: 0.12,
    recoveryTime: 0.19,
    reach: 1.40,
    knockback: 1.8,
    height: 'LOW',
    animation: 'kick_low',
  },
};
