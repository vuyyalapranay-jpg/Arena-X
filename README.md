# ARENA X — 2D/2.5D High-Impact Fighting Game & Shadow Fight 2 Clone

![Arena X Logo](public/arena-x-icon.svg)

> **Competitive Action Combat • Shadow Fight 2 Sunset Silhouettes • 2–16 Player Custom Multiplayer Rooms • Autonomous AI**  
> Built with React 18, TypeScript, Vite, Three.js, Canvas 2D, Cloudflare Workers & Durable Objects, and Web Audio API.

---

## 🎮 Overview

**Arena X** is a competitive fighting game combining classical 2D arcade martial arts combat with modern web rendering and authentic *Shadow Fight 2* mechanics. It features iconic sunset dusk silhouette fighters with radiant neon cyan and crimson rim auras, a minimalist clean battle HUD, an ACT combat feel engine (Sakurai 4 hit-stop methodology and directional camera shockwaves), autonomous AI opponents with humanized reaction pacing, mobile touch controls with a floating virtual joystick and circular thumb cluster, and custom multiplayer rooms supporting **2 to 16 players** with Room IDs (`SF2-XXXX`), optional password protection, and 1-click shareable invitation links.

---

## ⚡ Core Systems & Features

### 1. 🌅 Shadow Fight 2 Sunset Silhouette Aesthetics & Clean HUD
- **Iconic Sunset Horizon (`SHADOW_SUNSET`)**: Radiant setting sun sitting over layered plum and charcoal mountain ridges with a multi-stop twilight dusk gradient.
- **Inky Black Ninja Silhouettes**: Pure shadow silhouettes with high-impact neon rim lighting (electric cyan for Player 1 / YOU, vibrant crimson for Player 2 / SHADOW) that pop with martial arts intensity.
- **Minimalist Shadow Fight 2 Combat HUD**:
  - **Left**: Solid cyan health bar with a crisp white border, trailing ghost damage bar, and `YOU` tag with circular round-win pips.
  - **Right**: Solid coral red health bar with a crisp white border, trailing ghost damage bar, and `SHADOW` tag with circular round-win pips.
  - **Center**: Bold, clean white countdown timer (`99` / `59`) positioned between the life bars with zero visual clutter.
  - **Unobstructed Battleground**: Clean floor and stage with no distracting avatars or bulky telemetry boxes covering the martial artists.

### 2. 🌐 Custom Multiplayer Mode (2 to 16 Players)
- **Flexible Room Capacity**: Host a direct 1v1 duel (2 players) or expand up to a 16-player single-elimination tournament bracket (`Min: 2, Max: 16`).
- **Room IDs**: Clean room identifiers supporting `SF2-XXXX` and `AXT-XXXX` formats.
- **Password Protection**: Hosts can optionally lock rooms with a password to keep lobbies private among friends.
- **1-Click Shareable Invitation Links**: Instantly copy room links (`?room=SF2-XXXX&key=...`) that automatically populate the room ID and password when friends click to join.
- **Dynamic Tournament Brackets**:
  - **2 Players**: Single round Championship match (`r1m1`).
  - **3–4 Players**: 2 rounds (Semifinals & Final).
  - **5–8 Players**: 3 rounds (Quarterfinals, Semifinals & Final).
  - **9–16 Players**: 4 rounds (Round of 16, Quarterfinals, Semifinals & Final) with automatic bye progression.
- **Real-Time Synchronization**: Durable Object architecture on Cloudflare Workers orchestrates live entrant readiness, bracket progression, and match outcomes.

### 3. 🥋 16 Animated Fighters Roster
- **Rich Diverse Roster**: Kai (Crimson Striker), Shadow (Phantom Shinobi), Blaze (Infernal Monk), Frost (Cryo Blade), Ronin (Exiled Blade), Storm (Lightning Brawler), Titan (Heavy Colossus), Viper (Venom Assassin), Huntress, Kenji, Samurai Mack, and more.
- **Accurate Hitbox & Hurtbox Physics**: Tuned collision detection calibrated for high-precision spacing, active attack frames, whiff punishes, and grounded foot alignment.

### 4. 💥 ACT Combat Feel Engine & Shadow Fight 2 Architecture
- **Sakurai 4 Hit-Stop Tiers**: Symmetric frame freezes for authentic fighting impact:
  - **Light Attacks**: 3–4 frames (`0.05s`)
  - **Medium Attacks**: 5–6 frames (`0.08s`)
  - **Heavy Attacks**: 8–9 frames (`0.13s` — $\ge 50\%$ longer than light hits)
  - **Special Attacks**: 10–12 frames (`0.16s`)
  - **Cinematic Ultimates**: 17–20 frames (`0.28s`)
  - **Guard Blocks**: `0.06s` | **Guard Breaks**: `0.15s`
- **Strike Zones & Head-Hit Mechanics (Reverse-Engineered from SF2 `STRIKE_ZONE_HEAD`)**:
  - Attacks targeting the upper 32% of the opponent's hurtbox trigger `HEAD_HIT` multipliers (+25% bonus critical damage, golden sparks, and hit-freeze extensions).
- **First Strike Bonus (SF2 `CreateFirstStrike`)**:
  - The first clean strike connecting in any round rewards the initiator with +15% bonus Super meter and an on-screen `FIRST STRIKE!` banner.
- **Dynamic Combat Style Ratings (SF2 `ComboModel`)**:
  - Combo chains dynamically evaluate martial arts performance: `AGGRESSIVE` (2 hits), `HARD` (3–4 hits), `BRUTAL` (5–6 hits), `FANTASTIC` (7–9 hits), and `CRAZY STYLE` (10+ hits).
- **Directional Camera Shockwave with Exponential Decay**:
  - Attacks impart directional force vectors (e.g. uppercuts deliver vertical impulses `[facing * 0.35, -1.0]`).
  - Exponential decay curve ($\text{progress}^{1.8}$) with 26Hz vibration decay for heavy, physical feedback.
  - Camera shake updates continuously through freeze frames and cinematic ultimate zooms.

### 3. 📟 Console Arcade Fighting HUD & Clean Battle Arena
- **Sleek Console Arcade Aesthetic**: Angled status cards, bold typography (`KAI`, `SHADOW`), golden round victory gems (`◆ ◆ ◆`), and a floating center chrono node (`ROUND 1` badge + glowing `99` timer).
- **Slanted Angular Life Bars**: High-visibility health bars with trailing ghost damage buffer for visceral hit registration.
- **Unobstructed Arena Floor**: Zero in-match keyboard banners or bottom text strips covering the arena floor, fighters' feet, or shadows.
- **Console-Grade Pause Dashboard**: Pressing Pause or the Help button opens an arcade dashboard featuring match context, high-contrast action cards (`RESUME BATTLE`, `RESTART MATCH`, `MAIN MENU`), and an integrated command list with fighter moves (Strike, Kick, Sweep, Uppercut, Guard, Special, and Overdrive Burst).
- **Full Accessibility & Contrast**: Meets WCAG AA contrast standards, includes screen-reader role labels, auto-focuses the primary action, and supports `Escape` dismissal.

### 4. 📱 Mobile-First Controls & Screen Optimization
- **Dynamic Floating Virtual Joystick**: Left side of the screen features an invisible/translucent touch zone. Touching anywhere anchors a dynamic joystick with smooth directional clamping for walking, jumping, crouching, and diagonal dashes.
- **Shadow Fight-Style Action Cluster**: Ergonomic circular thumb layout on the right side:
  - **Strike (Fist/Sword)**: Primary large circular attack button placed in the natural thumb arc.
  - **Kick**: Secondary large circular attack button placed down-left.
  - **Burst / Ultimate**: Glowing top-center orb with animated energy pulse at 100% Super.
  - **Special / Ranged**: Top-left circular technique button.
  - **Guard**: Shield button placed for immediate thumb rest blocking.
  - **Charge**: Inner utility disc for meter charging.
- **Screen-Packed Viewport**: Full-bleed `viewport-fit=cover` scaling with safe-area insets, compact mobile top bars, and zero screen clipping.

### 5. 🧠 Autonomous Humanized AI Opponent
- **Humanized Reaction Latency**: The AI responds to player attacks after a realistic neurological latency (260ms on Normal, 400ms on Easy) rather than frame-1 blocking, making fast attacks and combos rewarding.
- **Breathing & Hesitation Windows**: Natural neutral pauses and whiff punishment opportunities (0.5s–0.8s attack cooldown) allow the player time to react, think, and strike.
- **Tactical Spacing**: Backsteps, shimmies, and range checks recreate organic martial arts combat rhythm.

### 6. 🌐 Multiplayer & 16-Player Private Tournaments
- **Real-Time Netplay**: Low-latency peer-to-peer WebRTC and WebSocket netplay rooms.
- **Flexible Bracket System**: Host private rooms supporting **4 to 16 players** with automated single-elimination tournament bracket generation.
- **Progression & Career Profiles**: Post-match XP, AX Coins, Rank Rating (RP), achievements, and customizable player profiles.

---

## 🕹️ Controls Guide

### PC Keyboard Controls
| Action | Player 1 (Kai / Left) | Player 2 (Shadow / Right) |
| :--- | :--- | :--- |
| **Move Left / Right** | `A` / `D` | `Arrow Left` (←) / `Arrow Right` (→) |
| **Jump** | `W` | `Arrow Up` (↑) |
| **Crouch** | `S` | `Arrow Down` (↓) |
| **Strike (Light / Medium)** | `F` | `J` |
| **Heavy Strike** | `R` | `U` |
| **Kick** | `G` | `K` |
| **Guard / Block** | `H` | `L` |
| **Charge Meter** | `C` | `P` |
| **Special Attack** | `SPACE` | `O` |
| **Burst Overdrive** | `V` | `]` |

### Mobile Touch Controls
| Control | Position | Behavior |
| :--- | :--- | :--- |
| **Virtual Joystick** | Left Screen Half (Touch Anywhere) | Floating dynamic thumbstick: Move, Crouch, Jump, Diagonal |
| **Strike** | Right Side (Large Red Disc) | Primary weapon / punch attack combo |
| **Kick** | Right Side (Large Orange Disc) | Martial arts snap, roundhouse, and low kicks |
| **Burst (Ultimate)** | Right Side (Top Amber Orb) | Cinematic super finisher (pulses at 100% meter) |
| **Special** | Right Side (Purple Disc) | Elemental ranged / special technique |
| **Guard** | Right Side (Cyan Disc) | Defensive block stance against strikes |
| **Charge** | Right Side (Blue Disc) | Power charge burst meter |

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- `npm` or `pnpm`

### Installation
```bash
# Clone the repository
git clone https://github.com/vuyyalapranay-jpg/Arena-X.git
cd Arena-X

# Install project dependencies
npm install
```

### Running Locally
```bash
# Start Vite development server
npm run dev
```
Open `http://localhost:5173` (or the terminal port) in your browser.

### Building for Production
```bash
# Typecheck and build production bundle
npm run build

# Preview production build locally
npm run preview
```

---

## 🏗️ Project Architecture

```
Arena-X/
├── public/                 # Static assets, backgrounds, sprite sheets, portraits
├── server/                 # Multiplayer WebSocket room server & matchmaker
├── src/
│   ├── config/             # Global game configurations & presets
│   ├── game/
│   │   ├── 2d/             # Sprite animations, fighter physics, particle systems
│   │   ├── ai/             # Autonomous AI opponent controller & pacing engine
│   │   ├── characters/     # Roster profiles (16 fighters), stats, and archetypes
│   │   ├── combat/         # ACT combat engine, hitboxes, frame data, hit-stop
│   │   ├── core/           # Main game loop, sound manager, input manager
│   │   ├── engine/         # 2D fight camera with directional decay shockwaves
│   │   ├── progression/    # XP, AX coins, rank rating, unlocked achievements
│   │   ├── stages/         # Stage select configs & environmental backdrops
│   │   └── ui/             # FightHUD, VirtualJoystick, ShadowFightTouchControls
│   ├── components/         # Character select, stage select, tournament lobbies
│   ├── pages/              # Main menu, game arena, and online netplay pages
│   └── styles/             # Industrial brutalist HUD, tournament, and theme CSS
└── scripts/                # Headless visual verification & QA test scripts
```

---

## 📄 License
MIT License. Created for the Arena X community.
