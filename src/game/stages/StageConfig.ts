// src/game/stages/StageConfig.ts
// COMPREHENSIVE CONFIGURATION & METADATA FOR ALL SIX ARENA X FIGHTING ARENAS

export type StageId = 
  | 'NEON_CITY'
  | 'ANCIENT_TEMPLE'
  | 'VOLCANIC_BATTLEFIELD'
  | 'FROZEN_WASTELAND'
  | 'CYBERPUNK_ROOFTOP'
  | 'MYSTIC_FOREST';

export interface StageParticleRule {
  type: 'RAIN' | 'LEAVES' | 'EMBERS' | 'SNOW' | 'VEHICLES' | 'SPORES';
  count: number;
  colors: string[];
  baseSpeedX: number;
  baseSpeedY: number;
  sizeRange: [number, number];
  hasWind: boolean;
  windStrength: number;
  groundReaction: boolean; // creates ripple or ground puff on hitting groundY
}

export interface StageDefinition {
  id: StageId;
  name: string;
  kanji: string;
  subtitle: string;
  description: string;
  bgImage: string;
  thumbnail: string;
  skyGradient: [string, string, string, string];
  ambientOverlay: string; // Color overlay for atmospheric color grading
  ambientOverlayBlendMode: GlobalCompositeOperation;
  groundType: 'WET_ASPHALT' | 'ANCIENT_STONE' | 'LAVA_FISSURE' | 'GLACIAL_ICE' | 'METAL_HELIPAD' | 'ENCHANTED_FLAGSTONE';
  groundDustColor: string;
  groundReflection: boolean;
  groundReflectionAlpha: number;
  groundFloorColor: string;
  particleRules: StageParticleRule[];
  parallaxFactorX: number;
  parallaxFactorY: number;
  bgReactivity: {
    flickerOnImpact: boolean;
    surgeOnUltimate: boolean;
    blastParticlesOnKnockdown: boolean;
  };
}

export const STAGES: Record<StageId, StageDefinition> = {
  NEON_CITY: {
    id: 'NEON_CITY',
    name: 'NEON CITY',
    kanji: 'ネオン街区',
    subtitle: 'DOWNTOWN SECTOR 7 • RAIN & HOLOGRAPHIC BILLBOARDS',
    description: 'Towering cyberpunk skyscrapers, glowing kanji signs, rain reflections on wet asphalt, and flying transit vehicles.',
    bgImage: '/assets/backgrounds/neon_city.jpg',
    thumbnail: '/assets/backgrounds/neon_city.jpg',
    skyGradient: ['#030511', '#060a22', '#0c1236', '#120d29'],
    ambientOverlay: 'rgba(0, 229, 255, 0.08)',
    ambientOverlayBlendMode: 'screen',
    groundType: 'WET_ASPHALT',
    groundDustColor: '#00f0ff',
    groundReflection: true,
    groundReflectionAlpha: 0.28,
    groundFloorColor: '#090d18',
    particleRules: [
      {
        type: 'RAIN',
        count: 120,
        colors: ['#a0e6ff', '#70ccff', '#c8f0ff', '#40b0ff'],
        baseSpeedX: 180,
        baseSpeedY: 650,
        sizeRange: [18, 32],
        hasWind: true,
        windStrength: 45,
        groundReaction: true,
      },
      {
        type: 'VEHICLES',
        count: 6,
        colors: ['#00e5ff', '#ff0055', '#ffe600'],
        baseSpeedX: 85,
        baseSpeedY: 0,
        sizeRange: [12, 24],
        hasWind: false,
        windStrength: 0,
        groundReaction: false,
      },
    ],
    parallaxFactorX: 0.16,
    parallaxFactorY: 0.06,
    bgReactivity: {
      flickerOnImpact: true,
      surgeOnUltimate: true,
      blastParticlesOnKnockdown: true,
    },
  },

  ANCIENT_TEMPLE: {
    id: 'ANCIENT_TEMPLE',
    name: 'ANCIENT TEMPLE',
    kanji: '古代寺院',
    subtitle: 'SANCTUARY OF THE HEAVENS • FALLING MAPLE LEAVES',
    description: 'Ancient mountain sanctuary with colossal chained stone fists, red maple trees, snow-dusted stone pavement, and distant pagoda.',
    bgImage: '/assets/backgrounds/ancient_temple.jpg',
    thumbnail: '/assets/backgrounds/ancient_temple.jpg',
    skyGradient: ['#121829', '#1e2942', '#2f3d58', '#404f6b'],
    ambientOverlay: 'rgba(255, 120, 60, 0.07)',
    ambientOverlayBlendMode: 'screen',
    groundType: 'ANCIENT_STONE',
    groundDustColor: '#d6c8b2',
    groundReflection: false,
    groundReflectionAlpha: 0,
    groundFloorColor: '#2b2c28',
    particleRules: [
      {
        type: 'LEAVES',
        count: 75,
        colors: ['#c42e23', '#d94b26', '#e06b2b', '#b31e1e', '#f58b38'],
        baseSpeedX: 60,
        baseSpeedY: 45,
        sizeRange: [7, 15],
        hasWind: true,
        windStrength: 60,
        groundReaction: true,
      },
    ],
    parallaxFactorX: 0.14,
    parallaxFactorY: 0.05,
    bgReactivity: {
      flickerOnImpact: false,
      surgeOnUltimate: true,
      blastParticlesOnKnockdown: true,
    },
  },

  VOLCANIC_BATTLEFIELD: {
    id: 'VOLCANIC_BATTLEFIELD',
    name: 'VOLCANIC BATTLEFIELD',
    kanji: '焦熱地獄',
    subtitle: 'NETHER FISSURE • ACTIVE LAVA CRUST & RISING EMBERS',
    description: 'Gothic ruins suspended over a roaring sea of magma, glowing stone runic floor with fiery fissures, and volcanic smoke plumes.',
    bgImage: '/assets/backgrounds/volcanic_battlefield.jpg',
    thumbnail: '/assets/backgrounds/volcanic_battlefield.jpg',
    skyGradient: ['#140303', '#240606', '#3b0d07', '#2e0a05'],
    ambientOverlay: 'rgba(255, 68, 0, 0.14)',
    ambientOverlayBlendMode: 'screen',
    groundType: 'LAVA_FISSURE',
    groundDustColor: '#ff5500',
    groundReflection: true,
    groundReflectionAlpha: 0.18,
    groundFloorColor: '#1a0a08',
    particleRules: [
      {
        type: 'EMBERS',
        count: 90,
        colors: ['#ff3300', '#ff6600', '#ffaa00', '#ffd54f', '#ff1a4b'],
        baseSpeedX: -25,
        baseSpeedY: -95,
        sizeRange: [3, 8],
        hasWind: true,
        windStrength: 35,
        groundReaction: false,
      },
    ],
    parallaxFactorX: 0.12,
    parallaxFactorY: 0.05,
    bgReactivity: {
      flickerOnImpact: true,
      surgeOnUltimate: true,
      blastParticlesOnKnockdown: true,
    },
  },

  FROZEN_WASTELAND: {
    id: 'FROZEN_WASTELAND',
    name: 'FROZEN WASTELAND',
    kanji: '極寒氷原',
    subtitle: 'GLACIAL SUMMIT • AURORA BOREALIS & BLIZZARD',
    description: 'Towering sapphire crystal glaciers, whistling snow flurries, translucent icy ground with permafrost cracks under the shimmering aurora.',
    bgImage: '/assets/backgrounds/frozen_wasteland.jpg',
    thumbnail: '/assets/backgrounds/frozen_wasteland.jpg',
    skyGradient: ['#030914', '#07182e', '#0e2b4f', '#133e69'],
    ambientOverlay: 'rgba(70, 200, 255, 0.12)',
    ambientOverlayBlendMode: 'screen',
    groundType: 'GLACIAL_ICE',
    groundDustColor: '#c8f0ff',
    groundReflection: true,
    groundReflectionAlpha: 0.32,
    groundFloorColor: '#0a1d33',
    particleRules: [
      {
        type: 'SNOW',
        count: 110,
        colors: ['#ffffff', '#e1f5fe', '#b3e5fc', '#81d4fa'],
        baseSpeedX: 160,
        baseSpeedY: 90,
        sizeRange: [4, 11],
        hasWind: true,
        windStrength: 75,
        groundReaction: true,
      },
    ],
    parallaxFactorX: 0.13,
    parallaxFactorY: 0.05,
    bgReactivity: {
      flickerOnImpact: false,
      surgeOnUltimate: true,
      blastParticlesOnKnockdown: true,
    },
  },

  CYBERPUNK_ROOFTOP: {
    id: 'CYBERPUNK_ROOFTOP',
    name: 'CYBERPUNK ROOFTOP',
    kanji: '電脳屋上',
    subtitle: 'MEGACITY SKYLINE • HIGH-ALTITUDE HELIPAD',
    description: 'High-tech helipad with glowing neon boundary lines overlooking an endless neon skyline with aerial traffic and communication towers.',
    bgImage: '/assets/backgrounds/cyberpunk_rooftop.jpg',
    thumbnail: '/assets/backgrounds/cyberpunk_rooftop.jpg',
    skyGradient: ['#060411', '#100824', '#1d0e3b', '#130826'],
    ambientOverlay: 'rgba(218, 0, 255, 0.10)',
    ambientOverlayBlendMode: 'screen',
    groundType: 'METAL_HELIPAD',
    groundDustColor: '#ff00aa',
    groundReflection: true,
    groundReflectionAlpha: 0.22,
    groundFloorColor: '#0d0818',
    particleRules: [
      {
        type: 'VEHICLES',
        count: 10,
        colors: ['#00e5ff', '#ff00aa', '#ffe600', '#00ff88'],
        baseSpeedX: 110,
        baseSpeedY: 0,
        sizeRange: [14, 28],
        hasWind: false,
        windStrength: 0,
        groundReaction: false,
      },
      {
        type: 'EMBERS',
        count: 40,
        colors: ['#ff00aa', '#00e5ff', '#a855f7'],
        baseSpeedX: 20,
        baseSpeedY: -45,
        sizeRange: [2, 5],
        hasWind: true,
        windStrength: 25,
        groundReaction: false,
      },
    ],
    parallaxFactorX: 0.18,
    parallaxFactorY: 0.07,
    bgReactivity: {
      flickerOnImpact: true,
      surgeOnUltimate: true,
      blastParticlesOnKnockdown: true,
    },
  },

  MYSTIC_FOREST: {
    id: 'MYSTIC_FOREST',
    name: 'MYSTIC FOREST',
    kanji: '幽玄の森',
    subtitle: 'SACRED GROVE • BIOLUMINESCENT FLORA & ANCIENT RUINS',
    description: 'Enchanted moonlit forest with colossal sacred trees, bioluminescent turquoise flora, drifting magical spores, and mossy stone altar.',
    bgImage: '/assets/backgrounds/mystic_forest.jpg',
    thumbnail: '/assets/backgrounds/mystic_forest.jpg',
    skyGradient: ['#020b0d', '#05181a', '#0a2624', '#0d332d'],
    ambientOverlay: 'rgba(0, 255, 180, 0.09)',
    ambientOverlayBlendMode: 'screen',
    groundType: 'ENCHANTED_FLAGSTONE',
    groundDustColor: '#00ffcc',
    groundReflection: false,
    groundReflectionAlpha: 0,
    groundFloorColor: '#0a1a15',
    particleRules: [
      {
        type: 'SPORES',
        count: 85,
        colors: ['#00ffc8', '#64ffda', '#b2fef7', '#d1c4e9', '#e040fb'],
        baseSpeedX: 15,
        baseSpeedY: -22,
        sizeRange: [3, 9],
        hasWind: true,
        windStrength: 20,
        groundReaction: false,
      },
    ],
    parallaxFactorX: 0.14,
    parallaxFactorY: 0.06,
    bgReactivity: {
      flickerOnImpact: false,
      surgeOnUltimate: true,
      blastParticlesOnKnockdown: true,
    },
  },
};

export const STAGE_LIST: StageDefinition[] = Object.values(STAGES);
