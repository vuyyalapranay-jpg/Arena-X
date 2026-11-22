// src/game/characters/RosterConfig.ts
// COMPREHENSIVE 16-FIGHTER ROSTER SPECIFICATION & COMBAT STATS

export type FighterId =
  | 'KAI'
  | 'SHADOW'
  | 'BLAZE'
  | 'FROST'
  | 'VOLT'
  | 'TERRA'
  | 'PHANTOM'
  | 'RONIN'
  | 'VIPER'
  | 'TITAN'
  | 'NOVA'
  | 'REAPER'
  | 'AETHER'
  | 'RYUZEN'
  | 'ECLIPSE'
  | 'ZENITH';

export type CombatArchetype =
  | 'ALL_ROUNDER'
  | 'RUSH_DOWN'
  | 'ZONER'
  | 'GRAPPLER'
  | 'STRIKER'
  | 'COUNTER_PUNCHER'
  | 'GLASS_CANNON'
  | 'HEAVY_TANK';

export interface FighterSpecialMove {
  id: string;
  name: string;
  inputDescription: string;
  meterCost: number;
  damage: number;
  knockback: number;
  type: 'MELEE' | 'PROJECTILE' | 'DASH' | 'ANTI_AIR' | 'COMMAND_GRAB' | 'ULTIMATE';
  description: string;
}

export interface FighterProfile {
  id: FighterId;
  name: string;
  title: string;
  archetype: CombatArchetype;
  martialArt: string;
  element: string;
  lore: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    emissive: string;
    aura: string;
    projectile: string;
    skin: string;
    hair: string;
  };
  stats: {
    health: number;
    walkSpeed: number;
    runSpeed: number;
    jumpImpulse: number;
    power: number;     // 1 - 5
    speed: number;     // 1 - 5
    defense: number;   // 1 - 5
    reach: number;     // 1 - 5
    difficulty: number;// 1 - 5
  };
  specials: {
    special1: FighterSpecialMove;
    special2: FighterSpecialMove;
    special3: FighterSpecialMove;
    special4: FighterSpecialMove;
    ultimate: FighterSpecialMove;
  };
  facingBias: 1 | -1;
}

export const ROSTER_FIGHTERS: Record<FighterId, FighterProfile> = {
  KAI: {
    id: 'KAI',
    name: 'Kai',
    title: 'Crimson Striker',
    archetype: 'ALL_ROUNDER',
    martialArt: 'Orthodox Karate & Kickboxing',
    element: 'Radiant Energy',
    lore: 'A disciplined martial artist who channels azure spiritual energy into devastating kinetic strikes.',
    colors: {
      primary: '#0055ff',
      secondary: '#121520',
      accent: '#00e5ff',
      emissive: '#00f0ff',
      aura: '#00e5ff',
      projectile: '#00d9ff',
      skin: '#df9e78',
      hair: '#141416',
    },
    stats: {
      health: 1000,
      walkSpeed: 280,
      runSpeed: 480,
      jumpImpulse: -780,
      power: 4,
      speed: 4,
      defense: 3,
      reach: 3,
      difficulty: 2,
    },
    specials: {
      special1: { id: 'ENERGY_PUNCH', name: 'Energy Punch', inputDescription: 'Special + Heavy', meterCost: 25, damage: 24, knockback: 260, type: 'MELEE', description: 'Charged kinetic strike infused with azure ki.' },
      special2: { id: 'BLUE_WAVE', name: 'Blue Wave', inputDescription: 'Special [Neutral]', meterCost: 25, damage: 18, knockback: 180, type: 'PROJECTILE', description: 'Crescent projectile of compressed spiritual energy.' },
      special3: { id: 'FLASH_DASH', name: 'Flash Dash', inputDescription: 'Special + Forward', meterCost: 25, damage: 20, knockback: 220, type: 'DASH', description: 'High-speed phasing step followed by a lunging straight.' },
      special4: { id: 'SKY_BREAKER', name: 'Sky Breaker', inputDescription: 'Special + Down', meterCost: 30, damage: 26, knockback: 320, type: 'ANTI_AIR', description: 'Skyward rising dragon uppercut cutting through incoming aerial attacks.' },
      ultimate: { id: 'ULTIMATE_CELESTIAL_BURST', name: 'Celestial Burst', inputDescription: 'Ultimate [V]', meterCost: 100, damage: 55, knockback: 450, type: 'ULTIMATE', description: 'Cinematic super: gathers celestial energy and detonates a screen-wide supernova.' },
    },
    facingBias: 1,
  },

  SHADOW: {
    id: 'SHADOW',
    name: 'Shadow',
    title: 'Shadow Fighter',
    archetype: 'RUSH_DOWN',
    martialArt: 'Ninjutsu & Kenpo',
    element: 'Dark Void',
    lore: 'A silent phantom operative from the underworld wielding deceptive void teleportation and abyssal strikes.',
    colors: {
      primary: '#ff1a4b',
      secondary: '#0a101d',
      accent: '#ba68c8',
      emissive: '#ff003c',
      aura: '#ba68c8',
      projectile: '#8e24aa',
      skin: '#d29672',
      hair: '#e6e8f0',
    },
    stats: {
      health: 950,
      walkSpeed: 300,
      runSpeed: 520,
      jumpImpulse: -810,
      power: 3,
      speed: 5,
      defense: 2,
      reach: 3,
      difficulty: 3,
    },
    specials: {
      special1: { id: 'SHADOW_STRIKE', name: 'Shadow Strike', inputDescription: 'Special + Heavy', meterCost: 25, damage: 22, knockback: 240, type: 'MELEE', description: 'Fast dark-infused cross strike emerging from shadows.' },
      special2: { id: 'DARK_ORB', name: 'Dark Orb', inputDescription: 'Special [Neutral]', meterCost: 25, damage: 16, knockback: 160, type: 'PROJECTILE', description: 'Slow pulsating sphere of void gravity that drains momentum.' },
      special3: { id: 'PHANTOM_DASH', name: 'Phantom Dash', inputDescription: 'Special + Forward', meterCost: 25, damage: 18, knockback: 200, type: 'DASH', description: 'Phases through space leaving lingering dark silhouettes.' },
      special4: { id: 'VOID_IMPACT', name: 'Void Impact', inputDescription: 'Special + Down', meterCost: 30, damage: 24, knockback: 300, type: 'ANTI_AIR', description: 'Smashes fists into the ground generating erupting void geysers.' },
      ultimate: { id: 'ULTIMATE_ECLIPSE_DOMINION', name: 'Eclipse Dominion', inputDescription: 'Ultimate [V]', meterCost: 100, damage: 52, knockback: 420, type: 'ULTIMATE', description: 'Cinematic super: plunges the arena into total eclipse and unleashes 50 spectral slashes.' },
    },
    facingBias: -1,
  },

  BLAZE: {
    id: 'BLAZE',
    name: 'Blaze',
    title: 'Infernal Brawler',
    archetype: 'STRIKER',
    martialArt: 'Muay Thai & Lethwei',
    element: 'Combustion Flame',
    lore: 'A fiery street-fighting champion whose elbows and knees ignite with white-hot volcanic embers.',
    colors: {
      primary: '#ff4500',
      secondary: '#1c100b',
      accent: '#ffd700',
      emissive: '#ff6600',
      aura: '#ff5500',
      projectile: '#ff3300',
      skin: '#c68652',
      hair: '#ff2200',
    },
    stats: {
      health: 1020,
      walkSpeed: 275,
      runSpeed: 470,
      jumpImpulse: -770,
      power: 5,
      speed: 3,
      defense: 4,
      reach: 3,
      difficulty: 2,
    },
    specials: {
      special1: { id: 'INFERNO_ELBOW', name: 'Inferno Elbow', inputDescription: 'Special + Heavy', meterCost: 25, damage: 28, knockback: 290, type: 'MELEE', description: 'Devastating downward elbow strike wrapped in blazing heat.' },
      special2: { id: 'FIRE_BURST', name: 'Fire Burst', inputDescription: 'Special [Neutral]', meterCost: 25, damage: 20, knockback: 190, type: 'PROJECTILE', description: 'Hurls an explosive molten fireball that detonates on contact.' },
      special3: { id: 'METEOR_DASH', name: 'Meteor Dash', inputDescription: 'Special + Forward', meterCost: 25, damage: 24, knockback: 250, type: 'DASH', description: 'Ignites thrusters behind boots to rocket forward with a flaming knee.' },
      special4: { id: 'VOLCANO_KICK', name: 'Volcano Kick', inputDescription: 'Special + Down', meterCost: 30, damage: 30, knockback: 340, type: 'ANTI_AIR', description: 'A rising switch-blade high kick leaving a column of magma.' },
      ultimate: { id: 'ULTIMATE_HELLFIRE_CATACLYSM', name: 'Hellfire Cataclysm', inputDescription: 'Ultimate [V]', meterCost: 100, damage: 58, knockback: 480, type: 'ULTIMATE', description: 'Cinematic super: detonates a volcanic eruption beneath the foe and delivers a meteoric axe kick.' },
    },
    facingBias: 1,
  },

  FROST: {
    id: 'FROST',
    name: 'Frost',
    title: 'Glacial Duelist',
    archetype: 'ZONER',
    martialArt: 'Classical Fencing & Cryomancy',
    element: 'Sub-Zero Ice',
    lore: 'An aristocratic duelist from the northern spires who freezes time and space with precise crystalline rapier thrusts.',
    colors: {
      primary: '#00bfff',
      secondary: '#0a1526',
      accent: '#e0f7fa',
      emissive: '#80deea',
      aura: '#4dd0e1',
      projectile: '#26c6da',
      skin: '#f5d6c6',
      hair: '#d0e8ff',
    },
    stats: {
      health: 920,
      walkSpeed: 290,
      runSpeed: 490,
      jumpImpulse: -790,
      power: 3,
      speed: 4,
      defense: 3,
      reach: 5,
      difficulty: 4,
    },
    specials: {
      special1: { id: 'DIAMOND_LUNGE', name: 'Diamond Lunge', inputDescription: 'Special + Heavy', meterCost: 25, damage: 20, knockback: 210, type: 'MELEE', description: 'Flawless fencing lunge piercing through guard with glacial ice.' },
      special2: { id: 'ICE_SHARD', name: 'Ice Shard', inputDescription: 'Special [Neutral]', meterCost: 25, damage: 17, knockback: 150, type: 'PROJECTILE', description: 'Fires high-velocity razor ice stalactites that freeze on hit.' },
      special3: { id: 'BLIZZARD_STEP', name: 'Blizzard Step', inputDescription: 'Special + Forward', meterCost: 25, damage: 16, knockback: 180, type: 'DASH', description: 'Glides across an icy floor layer with frictionless speed.' },
      special4: { id: 'CRYSTAL_SPIRE', name: 'Crystal Spire', inputDescription: 'Special + Down', meterCost: 30, damage: 25, knockback: 310, type: 'ANTI_AIR', description: 'Summons giant glacial spears erupting straight from the ground.' },
      ultimate: { id: 'ULTIMATE_ABSOLUTE_ZERO', name: 'Absolute Zero', inputDescription: 'Ultimate [V]', meterCost: 100, damage: 50, knockback: 400, type: 'ULTIMATE', description: 'Cinematic super: freezes the opponent into a solid diamond glacier before shattering it into millions of crystals.' },
    },
    facingBias: -1,
  },

  VOLT: {
    id: 'VOLT',
    name: 'Volt',
    title: 'Lightning Striker',
    archetype: 'GLASS_CANNON',
    martialArt: 'Wing Chun & Chain Punching',
    element: 'High-Voltage Electric',
    lore: 'A cybernetically enhanced speed prodigy capable of striking thirty times a second with crackling arc lightning.',
    colors: {
      primary: '#ffea00',
      secondary: '#1a1908',
      accent: '#00ffff',
      emissive: '#ffff33',
      aura: '#ffea00',
      projectile: '#ffff66',
      skin: '#e0a98b',
      hair: '#ffff80',
    },
    stats: {
      health: 900,
      walkSpeed: 330,
      runSpeed: 560,
      jumpImpulse: -840,
      power: 4,
      speed: 5,
      defense: 2,
      reach: 2,
      difficulty: 4,
    },
    specials: {
      special1: { id: 'THUNDER_CHAIN', name: 'Thunder Chain', inputDescription: 'Special + Heavy', meterCost: 25, damage: 25, knockback: 230, type: 'MELEE', description: 'Rapid-fire 10-hit electric chain punch overload.' },
      special2: { id: 'VOLT_BOLT', name: 'Volt Bolt', inputDescription: 'Special [Neutral]', meterCost: 25, damage: 18, knockback: 160, type: 'PROJECTILE', description: 'Instantaneous horizontal lightning discharge that zaps through the screen.' },
      special3: { id: 'FLASH_STEP', name: 'Flash Step', inputDescription: 'Special + Forward', meterCost: 25, damage: 19, knockback: 210, type: 'DASH', description: 'Transforms into pure electricity to reappear behind the foe.' },
      special4: { id: 'STORM_RISING', name: 'Storm Rising', inputDescription: 'Special + Down', meterCost: 30, damage: 27, knockback: 330, type: 'ANTI_AIR', description: 'A corkscrew spinning fist charging upward with an electric vortex.' },
      ultimate: { id: 'ULTIMATE_GIGA_VOLT_OVERDRIVE', name: 'Giga Volt Overdrive', inputDescription: 'Ultimate [V]', meterCost: 100, damage: 56, knockback: 460, type: 'ULTIMATE', description: 'Cinematic super: accelerates beyond the speed of light, striking the target from 10 angles simultaneously.' },
    },
    facingBias: 1,
  },

  TERRA: {
    id: 'TERRA',
    name: 'Terra',
    title: 'Earth Titan',
    archetype: 'GRAPPLER',
    martialArt: 'Freestyle Wrestling & Sambo',
    element: 'Granite Earth & Seismic',
    lore: 'A towering mountain defender armed with impenetrable stone armor and unshakeable tectonic force.',
    colors: {
      primary: '#8d6e63',
      secondary: '#1c1512',
      accent: '#ffb300',
      emissive: '#d7ccc8',
      aura: '#a1887f',
      projectile: '#795548',
      skin: '#a66e4e',
      hair: '#4e342e',
    },
    stats: {
      health: 1200,
      walkSpeed: 230,
      runSpeed: 410,
      jumpImpulse: -720,
      power: 5,
      speed: 2,
      defense: 5,
      reach: 4,
      difficulty: 3,
    },
    specials: {
      special1: { id: 'TECTONIC_SLAM', name: 'Tectonic Slam', inputDescription: 'Special + Heavy', meterCost: 25, damage: 32, knockback: 350, type: 'MELEE', description: 'Heavy earthbreaker punch sending tremors rippling through the arena floor.' },
      special2: { id: 'BOULDER_TOSS', name: 'Boulder Toss', inputDescription: 'Special [Neutral]', meterCost: 25, damage: 22, knockback: 240, type: 'PROJECTILE', description: 'Rips a giant granite boulder from the stage and hurls it forward.' },
      special3: { id: 'BULL_CHARGE', name: 'Bull Charge', inputDescription: 'Special + Forward', meterCost: 25, damage: 26, knockback: 300, type: 'DASH', description: 'Armored shoulder tackle that absorbs incoming hits.' },
      special4: { id: 'SEISMIC_QUAKE', name: 'Seismic Quake', inputDescription: 'Special + Down', meterCost: 30, damage: 28, knockback: 360, type: 'ANTI_AIR', description: 'Stomps the earth, knocking down grounded foes and launching air opponents.' },
      ultimate: { id: 'ULTIMATE_EARTH_CRUSHER', name: 'Earth Crusher', inputDescription: 'Ultimate [V]', meterCost: 100, damage: 62, knockback: 520, type: 'ULTIMATE', description: 'Cinematic super: entombs the enemy between two colossal tectonic plates and crushes them to dust.' },
    },
    facingBias: -1,
  },

  PHANTOM: {
    id: 'PHANTOM',
    name: 'Phantom',
    title: 'Ghost Blade',
    archetype: 'COUNTER_PUNCHER',
    martialArt: 'Iaijutsu Quick-Draw & Phasing',
    element: 'Ethereal Spectral',
    lore: 'A cursed swordsman caught between realms, unsheathing his ghostly katana only at the moment of impact.',
    colors: {
      primary: '#7c4dff',
      secondary: '#0e0b1f',
      accent: '#69f0ae',
      emissive: '#b388ff',
      aura: '#7c4dff',
      projectile: '#69f0ae',
      skin: '#e2d3f5',
      hair: '#d1c4e9',
    },
    stats: {
      health: 940,
      walkSpeed: 295,
      runSpeed: 505,
      jumpImpulse: -800,
      power: 4,
      speed: 4,
      defense: 3,
      reach: 4,
      difficulty: 4,
    },
    specials: {
      special1: { id: 'GHOST_SLASH', name: 'Ghost Slash', inputDescription: 'Special + Heavy', meterCost: 25, damage: 24, knockback: 250, type: 'MELEE', description: 'Near-instantaneous unsheathing katana slice cutting through spirits.' },
      special2: { id: 'SPECTRAL_BLADE', name: 'Spectral Blade', inputDescription: 'Special [Neutral]', meterCost: 25, damage: 18, knockback: 170, type: 'PROJECTILE', description: 'Fires a flying wave of spiritual energy that ignores projectile clashes.' },
      special3: { id: 'MIST_EVASION', name: 'Mist Evasion', inputDescription: 'Special + Forward', meterCost: 25, damage: 20, knockback: 220, type: 'DASH', description: 'Dissolves into ghost mist, reappearing with a retaliatory slash.' },
      special4: { id: 'SOUL_ASCENT', name: 'Soul Ascent', inputDescription: 'Special + Down', meterCost: 30, damage: 26, knockback: 310, type: 'ANTI_AIR', description: 'Vertical crescent moon slash cutting down jumping opponents.' },
      ultimate: { id: 'ULTIMATE_PURGATORY_CLEAVE', name: 'Purgatory Cleave', inputDescription: 'Ultimate [V]', meterCost: 100, damage: 54, knockback: 440, type: 'ULTIMATE', description: 'Cinematic super: freezes the screen in monochrome before cleanly bifurcating reality itself.' },
    },
    facingBias: 1,
  },

  RONIN: {
    id: 'RONIN',
    name: 'Ronin',
    title: 'Wandering Blade',
    archetype: 'STRIKER',
    martialArt: 'Dual Katana Kenjutsu',
    element: 'Razor Wind',
    lore: 'A masterless samurai who wanders ruined lands, slicing through gale winds with twin tempered blades.',
    colors: {
      primary: '#2e7d32',
      secondary: '#121a13',
      accent: '#cddc39',
      emissive: '#81c784',
      aura: '#4caf50',
      projectile: '#aed581',
      skin: '#d7a17a',
      hair: '#212121',
    },
    stats: {
      health: 980,
      walkSpeed: 285,
      runSpeed: 495,
      jumpImpulse: -785,
      power: 4,
      speed: 4,
      defense: 3,
      reach: 4,
      difficulty: 3,
    },
    specials: {
      special1: { id: 'TWIN_CROSS', name: 'Twin Cross', inputDescription: 'Special + Heavy', meterCost: 25, damage: 26, knockback: 260, type: 'MELEE', description: 'X-shaped dual katana slash dealing heavy guard chip damage.' },
      special2: { id: 'WIND_GALE', name: 'Wind Gale', inputDescription: 'Special [Neutral]', meterCost: 25, damage: 19, knockback: 180, type: 'PROJECTILE', description: 'Fires a spinning razor-sharp vortex of vacuum blades.' },
      special3: { id: 'CYCLONE_STEP', name: 'Cyclone Step', inputDescription: 'Special + Forward', meterCost: 25, damage: 22, knockback: 230, type: 'DASH', description: 'Spins forward like a top, deflecting minor projectiles.' },
      special4: { id: 'RISING_TYPHOON', name: 'Rising Typhoon', inputDescription: 'Special + Down', meterCost: 30, damage: 28, knockback: 330, type: 'ANTI_AIR', description: 'Twin blades sweep upward in a spiraling tornado.' },
      ultimate: { id: 'ULTIMATE_STORM_OF_BLADES', name: 'Storm of Blades', inputDescription: 'Ultimate [V]', meterCost: 100, damage: 55, knockback: 450, type: 'ULTIMATE', description: 'Cinematic super: executes a hundred synchronized dual-katana cuts in a single heartbeat.' },
    },
    facingBias: -1,
  },

  VIPER: {
    id: 'VIPER',
    name: 'Viper',
    title: 'Venom Assassin',
    archetype: 'RUSH_DOWN',
    martialArt: 'Capoeira & Concealed Daggers',
    element: 'Corrosive Acid & Poison',
    lore: 'An acrobatic assassin whose venom-coated strikes weaken armor and sap fighter stamina over time.',
    colors: {
      primary: '#00e676',
      secondary: '#0c1a11',
      accent: '#d500f9',
      emissive: '#69f0ae',
      aura: '#00e676',
      projectile: '#d500f9',
      skin: '#8d5524',
      hair: '#1b5e20',
    },
    stats: {
      health: 930,
      walkSpeed: 310,
      runSpeed: 530,
      jumpImpulse: -820,
      power: 3,
      speed: 5,
      defense: 2,
      reach: 3,
      difficulty: 3,
    },
    specials: {
      special1: { id: 'VENOM_FANG', name: 'Venom Fang', inputDescription: 'Special + Heavy', meterCost: 25, damage: 22, knockback: 210, type: 'MELEE', description: 'Acrobatic handspring kick delivering an acid needle strike.' },
      special2: { id: 'TOXIC_SPIT', name: 'Toxic Spit', inputDescription: 'Special [Neutral]', meterCost: 25, damage: 16, knockback: 140, type: 'PROJECTILE', description: 'Spits a glob of glowing caustic venom that leaves an acid pool on the floor.' },
      special3: { id: 'SERPENT_SLIDE', name: 'Serpent Slide', inputDescription: 'Special + Forward', meterCost: 25, damage: 20, knockback: 200, type: 'DASH', description: 'Low sweeping ground slide evading standing hitboxes.' },
      special4: { id: 'COBRA_TWIST', name: 'Cobra Twist', inputDescription: 'Special + Down', meterCost: 30, damage: 25, knockback: 300, type: 'ANTI_AIR', description: 'Springs into an inverted vertical helicopter spin kick.' },
      ultimate: { id: 'ULTIMATE_CORROSIVE_CARNAGE', name: 'Corrosive Carnage', inputDescription: 'Ultimate [V]', meterCost: 100, damage: 52, knockback: 410, type: 'ULTIMATE', description: 'Cinematic super: injects a neurotoxin cocktail followed by a lethal multi-kick aerial cascade.' },
    },
    facingBias: 1,
  },

  TITAN: {
    id: 'TITAN',
    name: 'Titan',
    title: 'Colossus Juggernaut',
    archetype: 'HEAVY_TANK',
    martialArt: 'Heavyweight Boxing & Demolition',
    element: 'Kinetic Shockwave',
    lore: 'An unbreakable cyber-gladiator equipped with hydraulic kinetic gauntlets that shatter concrete.',
    colors: {
      primary: '#ff6f00',
      secondary: '#21160a',
      accent: '#cfd8dc',
      emissive: '#ffab00',
      aura: '#ff8f00',
      projectile: '#ff6f00',
      skin: '#5c3826',
      hair: '#37474f',
    },
    stats: {
      health: 1250,
      walkSpeed: 220,
      runSpeed: 390,
      jumpImpulse: -700,
      power: 5,
      speed: 1,
      defense: 5,
      reach: 3,
      difficulty: 2,
    },
    specials: {
      special1: { id: 'GIGA_HOOK', name: 'Giga Hook', inputDescription: 'Special + Heavy', meterCost: 25, damage: 34, knockback: 380, type: 'MELEE', description: 'Massive hydraulic right hook delivering overwhelming kinetic force.' },
      special2: { id: 'SHOCKWAVE_PUNCH', name: 'Shockwave Punch', inputDescription: 'Special [Neutral]', meterCost: 25, damage: 20, knockback: 260, type: 'PROJECTILE', description: 'Punches air with such force that a visible supersonic shockwave blasts forward.' },
      special3: { id: 'IRON_SHOULDER', name: 'Iron Shoulder', inputDescription: 'Special + Forward', meterCost: 25, damage: 28, knockback: 320, type: 'DASH', description: 'Forward bull rush with super armor absorbing a hit without flinching.' },
      special4: { id: 'GROUND_SHATTER', name: 'Ground Shatter', inputDescription: 'Special + Down', meterCost: 30, damage: 30, knockback: 360, type: 'ANTI_AIR', description: 'Two-handed hammer punch into the floor causing debris eruptions.' },
      ultimate: { id: 'ULTIMATE_APOCALYPSE_HAMMER', name: 'Apocalypse Hammer', inputDescription: 'Ultimate [V]', meterCost: 100, damage: 65, knockback: 550, type: 'ULTIMATE', description: 'Cinematic super: charges pistons to 200% pressure and unleashes an earth-splitting overhead pile-driver.' },
    },
    facingBias: -1,
  },

  NOVA: {
    id: 'NOVA',
    name: 'Nova',
    title: 'Starlight Vanguard',
    archetype: 'STRIKER',
    martialArt: 'Acrobatic Taekwondo & Aerial Flips',
    element: 'Cosmic Starlight',
    lore: 'A stellar guardian whose gravity-defying kicks leave dazzling constellation patterns across the sky.',
    colors: {
      primary: '#e91e63',
      secondary: '#1a0b14',
      accent: '#00e5ff',
      emissive: '#ff4081',
      aura: '#f50057',
      projectile: '#ff80ab',
      skin: '#f3cbb4',
      hair: '#ff4081',
    },
    stats: {
      health: 960,
      walkSpeed: 295,
      runSpeed: 510,
      jumpImpulse: -830,
      power: 4,
      speed: 5,
      defense: 2,
      reach: 4,
      difficulty: 3,
    },
    specials: {
      special1: { id: 'SUPERNOVA_KICK', name: 'Supernova Kick', inputDescription: 'Special + Heavy', meterCost: 25, damage: 25, knockback: 270, type: 'MELEE', description: 'Inverted overhead axe kick blazing with starlight.' },
      special2: { id: 'STELLAR_RAY', name: 'Stellar Ray', inputDescription: 'Special [Neutral]', meterCost: 25, damage: 18, knockback: 170, type: 'PROJECTILE', description: 'Fires a beam of prismatic starlight energy.' },
      special3: { id: 'METEOR_CARTWHEEL', name: 'Meteor Cartwheel', inputDescription: 'Special + Forward', meterCost: 25, damage: 21, knockback: 220, type: 'DASH', description: 'Acrobatic spinning cartwheel bridging full-screen distance.' },
      special4: { id: 'COSMIC_CRESCENT', name: 'Cosmic Crescent', inputDescription: 'Special + Down', meterCost: 30, damage: 27, knockback: 320, type: 'ANTI_AIR', description: 'Rising vertical 540-degree hook kick tracing a star constellation.' },
      ultimate: { id: 'ULTIMATE_GALAXY_CONVERGENCE', name: 'Galaxy Convergence', inputDescription: 'Ultimate [V]', meterCost: 100, damage: 54, knockback: 440, type: 'ULTIMATE', description: 'Cinematic super: summons three orbiting nebulas and delivers a blinding orbital divekick.' },
    },
    facingBias: 1,
  },

  REAPER: {
    id: 'REAPER',
    name: 'Reaper',
    title: 'Soul Harvester',
    archetype: 'ZONER',
    martialArt: 'Scythe Combat & Dark Arts',
    element: 'Soul Essence Drain',
    lore: 'An enigmatic wanderer wielding a curved soul scythe that cuts through life-force and absorbs enemy health.',
    colors: {
      primary: '#9c27b0',
      secondary: '#130919',
      accent: '#00e676',
      emissive: '#e040fb',
      aura: '#ab47bc',
      projectile: '#7b1fa2',
      skin: '#e0d2e8',
      hair: '#110c14',
    },
    stats: {
      health: 950,
      walkSpeed: 270,
      runSpeed: 460,
      jumpImpulse: -760,
      power: 4,
      speed: 3,
      defense: 3,
      reach: 5,
      difficulty: 4,
    },
    specials: {
      special1: { id: 'SCYTHE_CLEAVE', name: 'Scythe Cleave', inputDescription: 'Special + Heavy', meterCost: 25, damage: 26, knockback: 280, type: 'MELEE', description: 'Full-reach circular scythe sweep that pulls enemies closer.' },
      special2: { id: 'SOUL_SEEKER', name: 'Soul Seeker', inputDescription: 'Special [Neutral]', meterCost: 25, damage: 17, knockback: 150, type: 'PROJECTILE', description: 'Releases a homing ghostly skull that chases down the opponent.' },
      special3: { id: 'SHADOW_REAP', name: 'Shadow Reap', inputDescription: 'Special + Forward', meterCost: 25, damage: 22, knockback: 240, type: 'DASH', description: 'Vanishes into a pool of darkness, rising under the foe with a scythe strike.' },
      special4: { id: 'DEATH_SPIRAL', name: 'Death Spiral', inputDescription: 'Special + Down', meterCost: 30, damage: 28, knockback: 330, type: 'ANTI_AIR', description: 'Twirls the scythe overhead like a propeller, slicing jumping targets.' },
      ultimate: { id: 'ULTIMATE_SOUL_HARVEST', name: 'Soul Harvest', inputDescription: 'Ultimate [V]', meterCost: 100, damage: 53, knockback: 430, type: 'ULTIMATE', description: 'Cinematic super: reaps the enemy soul into a spectral vortex and restores 15% player health.' },
    },
    facingBias: -1,
  },

  AETHER: {
    id: 'AETHER',
    name: 'Aether',
    title: 'Celestial Monk',
    archetype: 'ALL_ROUNDER',
    martialArt: 'Shaolin Kung Fu & Baguazhang',
    element: 'Pure Divine Light',
    lore: 'An enlightened monk who levitates millimeters above ground, deflecting malice with golden palms of light.',
    colors: {
      primary: '#ffc107',
      secondary: '#1e1604',
      accent: '#ffffff',
      emissive: '#ffe082',
      aura: '#ffd54f',
      projectile: '#ffecb3',
      skin: '#d7a17a',
      hair: '#ffffff',
    },
    stats: {
      health: 1000,
      walkSpeed: 285,
      runSpeed: 485,
      jumpImpulse: -800,
      power: 4,
      speed: 4,
      defense: 4,
      reach: 3,
      difficulty: 3,
    },
    specials: {
      special1: { id: 'BUDDHA_PALM', name: 'Buddha Palm', inputDescription: 'Special + Heavy', meterCost: 25, damage: 26, knockback: 290, type: 'MELEE', description: 'Extends a glowing golden open palm blast that sends enemies flying.' },
      special2: { id: 'LIGHT_CHAKRAM', name: 'Light Chakram', inputDescription: 'Special [Neutral]', meterCost: 25, damage: 18, knockback: 170, type: 'PROJECTILE', description: 'Throws a spinning ring of sacred golden energy.' },
      special3: { id: 'ZEN_DASH', name: 'Zen Dash', inputDescription: 'Special + Forward', meterCost: 25, damage: 20, knockback: 220, type: 'DASH', description: 'Levitates forward smoothly, parrying high attacks during startup.' },
      special4: { id: 'HEAVENLY_PILLAR', name: 'Heavenly Pillar', inputDescription: 'Special + Down', meterCost: 30, damage: 27, knockback: 340, type: 'ANTI_AIR', description: 'Calls down a column of sacred divine sunlight from the heavens.' },
      ultimate: { id: 'ULTIMATE_NIRVANA_ASCENSION', name: 'Nirvana Ascension', inputDescription: 'Ultimate [V]', meterCost: 100, damage: 55, knockback: 460, type: 'ULTIMATE', description: 'Cinematic super: manifests a thousand golden arms that strike in rhythmic harmony.' },
    },
    facingBias: 1,
  },

  RYUZEN: {
    id: 'RYUZEN',
    name: 'Ryuzen',
    title: 'Dragon Fist',
    archetype: 'STRIKER',
    martialArt: 'Dragon Kung Fu & Ki Blasts',
    element: 'Ancient Dragon Flame',
    lore: 'The sole inheritor of the Dragon Fang clan, whose punches manifest the roaring jaws of an elemental dragon.',
    colors: {
      primary: '#d32f2f',
      secondary: '#170606',
      accent: '#ffb300',
      emissive: '#ff5252',
      aura: '#ff1744',
      projectile: '#ff8a80',
      skin: '#c68a4c',
      hair: '#212121',
    },
    stats: {
      health: 1040,
      walkSpeed: 275,
      runSpeed: 475,
      jumpImpulse: -780,
      power: 5,
      speed: 3,
      defense: 4,
      reach: 3,
      difficulty: 2,
    },
    specials: {
      special1: { id: 'DRAGON_FANG', name: 'Dragon Fang', inputDescription: 'Special + Heavy', meterCost: 25, damage: 28, knockback: 300, type: 'MELEE', description: 'Lunging two-fisted thrust accompanied by a roaring dragon jaw effect.' },
      special2: { id: 'DRAGON_BREATH', name: 'Dragon Breath', inputDescription: 'Special [Neutral]', meterCost: 25, damage: 20, knockback: 200, type: 'PROJECTILE', description: 'Exhales an undulating wave of serpentine dragon fire.' },
      special3: { id: 'DRAGON_RUSH', name: 'Dragon Rush', inputDescription: 'Special + Forward', meterCost: 25, damage: 23, knockback: 250, type: 'DASH', description: 'Charges forward surrounded by a fiery dragon barrier.' },
      special4: { id: 'RISING_DRAGON', name: 'Rising Dragon', inputDescription: 'Special + Down', meterCost: 30, damage: 29, knockback: 350, type: 'ANTI_AIR', description: 'The legendary spinning rising dragon uppercut that ascends high into the sky.' },
      ultimate: { id: 'ULTIMATE_DRAGON_GOD_WRATH', name: 'Dragon God Wrath', inputDescription: 'Ultimate [V]', meterCost: 100, damage: 60, knockback: 500, type: 'ULTIMATE', description: 'Cinematic super: summons the colossal Ancient Dragon spirit that swallows and incinerates the opponent.' },
    },
    facingBias: -1,
  },

  ECLIPSE: {
    id: 'ECLIPSE',
    name: 'Eclipse',
    title: 'Lunar Knight',
    archetype: 'COUNTER_PUNCHER',
    martialArt: 'Zweihander Greatsword Combat',
    element: 'Lunar Gravity',
    lore: 'A disgraced dark knight clad in lunar obsidian armor, swinging a colossal blade with gravitational pull.',
    colors: {
      primary: '#303f9f',
      secondary: '#0a0d21',
      accent: '#e040fb',
      emissive: '#7c4dff',
      aura: '#536dfe',
      projectile: '#8c9eff',
      skin: '#eed5c6',
      hair: '#3f51b5',
    },
    stats: {
      health: 1100,
      walkSpeed: 250,
      runSpeed: 430,
      jumpImpulse: -740,
      power: 5,
      speed: 2,
      defense: 5,
      reach: 5,
      difficulty: 3,
    },
    specials: {
      special1: { id: 'MOON_CLEAVE', name: 'Moon Cleave', inputDescription: 'Special + Heavy', meterCost: 25, damage: 30, knockback: 320, type: 'MELEE', description: 'Full overhead greatsword descent that shatters blocks.' },
      special2: { id: 'GRAVITY_WELL', name: 'Gravity Well', inputDescription: 'Special [Neutral]', meterCost: 25, damage: 18, knockback: -80, type: 'PROJECTILE', description: 'Fires a black gravity vortex that pulls the enemy toward Eclipse.' },
      special3: { id: 'LUNAR_CHARGE', name: 'Lunar Charge', inputDescription: 'Special + Forward', meterCost: 25, damage: 25, knockback: 280, type: 'DASH', description: 'Greatsword-forward charge with armor frames.' },
      special4: { id: 'CRESCENT_UPRISING', name: 'Crescent Uprising', inputDescription: 'Special + Down', meterCost: 30, damage: 28, knockback: 340, type: 'ANTI_AIR', description: 'Sweeps greatsword in an upward arc creating a lunar crescent trail.' },
      ultimate: { id: 'ULTIMATE_BLACK_HOLE_COLLAPSE', name: 'Black Hole Collapse', inputDescription: 'Ultimate [V]', meterCost: 100, damage: 58, knockback: 490, type: 'ULTIMATE', description: 'Cinematic super: anchors greatsword into the ground, opening a miniature singularity that implodes.' },
    },
    facingBias: 1,
  },

  ZENITH: {
    id: 'ZENITH',
    name: 'Zenith',
    title: 'Solar Sovereign',
    archetype: 'ALL_ROUNDER',
    martialArt: 'Solar Kung Fu & Radiance',
    element: 'Solar Flare & Corona',
    lore: 'The guardian of the sun crest whose body glows with 10,000 degrees of solar plasma, incinerating corruption.',
    colors: {
      primary: '#ff9800',
      secondary: '#1c1002',
      accent: '#ffffff',
      emissive: '#ffc107',
      aura: '#ffb300',
      projectile: '#ffe082',
      skin: '#e5a676',
      hair: '#ff9800',
    },
    stats: {
      health: 1050,
      walkSpeed: 280,
      runSpeed: 480,
      jumpImpulse: -780,
      power: 4,
      speed: 4,
      defense: 4,
      reach: 3,
      difficulty: 2,
    },
    specials: {
      special1: { id: 'SOLAR_PUNCH', name: 'Solar Punch', inputDescription: 'Special + Heavy', meterCost: 25, damage: 27, knockback: 280, type: 'MELEE', description: 'A blinding straight punch exploding with corona flares.' },
      special2: { id: 'SUN_DISC', name: 'Sun Disc', inputDescription: 'Special [Neutral]', meterCost: 25, damage: 19, knockback: 180, type: 'PROJECTILE', description: 'Hurls a spinning disc of solar plasma that pierces through foes.' },
      special3: { id: 'SOLAR_DASH', name: 'Solar Dash', inputDescription: 'Special + Forward', meterCost: 25, damage: 22, knockback: 230, type: 'DASH', description: 'Blazing forward burst leaving a scorching trail behind.' },
      special4: { id: 'CORONA_RISE', name: 'Corona Rise', inputDescription: 'Special + Down', meterCost: 30, damage: 28, knockback: 330, type: 'ANTI_AIR', description: 'High-jumping rising fist releasing a radiant solar pillar.' },
      ultimate: { id: 'ULTIMATE_SUPERNOVA_CATACLYSM', name: 'Supernova Cataclysm', inputDescription: 'Ultimate [V]', meterCost: 100, damage: 59, knockback: 490, type: 'ULTIMATE', description: 'Cinematic super: ascends above the battlefield and unleashes the core energy of a dying star.' },
    },
    facingBias: -1,
  },
};
