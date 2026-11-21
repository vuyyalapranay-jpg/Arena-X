# ARENA X — 2.5D Fighting Game

![Arena X Logo](public/arena-x-icon.svg)

> **Phase 1: Project Setup & First Playable 3D Prototype**  
> A high-performance, real-time 3D fighting game prototype built with React, TypeScript, Vite, Three.js, and Rapier 3D Physics.

---

## 🎮 Overview

**Arena X** is a competitive 2.5D fighting game prototype. Movement and combat take place along a strictly constrained 2D fighting plane within a fully rendered 3D cyberpunk arena, featuring dynamic camera tracking, articulated 3D humanoid fighters, real-time physics collisions, hit reactions, and responsive controls.

---

## ⚡ Technology Stack

- **Framework:** React 18 & TypeScript
- **Build Tool:** Vite 5
- **3D Graphics:** Three.js (WebGL with shadow mapping & ACES Filmic tone mapping)
- **Physics Engine:** Rapier 3D (`@dimforge/rapier3d-compat` WebAssembly)
- **Audio Engine:** Web Audio API (procedural synthesis for zero-latency combat audio)
- **UI & Styling:** Modern CSS3 with hardware-accelerated layouts
- **Icons:** Lucide React

---

## 🕹️ Controls Guide

### Player 1 (Crimson Striker — VORTEX)
| Action | Keyboard Key | Mobile Touch |
| :--- | :--- | :--- |
| **Move Left** | `A` | D-Pad Left ◀ |
| **Move Right** | `D` | D-Pad Right ▶ |
| **Jump** | `W` | D-Pad Up ▲ |
| **Crouch** | `S` | D-Pad Down ▼ |
| **Punch** | `F` | [PUNCH] Button |
| **Kick** | `G` | [KICK] Button |
| **Block** | `H` | [BLOCK] Button |

### Player 2 (Cobalt Vanguard — ION)
| Action | Keyboard Key |
| :--- | :--- |
| **Move Left** | `Arrow Left` (←) |
| **Move Right** | `Arrow Right` (→) |
| **Jump** | `Arrow Up` (↑) |
| **Crouch** | `Arrow Down` (↓) |
| **Punch** | `J` |
| **Kick** | `K` |
| **Block** | `L` |

---

## 🌟 Key Features Implemented in Phase 1

1. **3D Fighting Arena ("The Nexus Collider"):**
   - High-tech combat platform with hexagonal grid markings and team perimeter lines.
   - Atmospheric background architecture: monolithic cyberpunk skyscrapers, illuminated antennas, and a rotating holographic arena ring.
   - Dynamic stage lighting: Directional shadow-casting key light, atmospheric fog, and red/cyan rim lights tracking fighters.
   - Floating atmospheric ember/dust particle system.

2. **Articulated Humanoid Fighters:**
   - 19-segment articulated 3D humanoid models with cyber armor, glowing visor helmets, power cores, and defensive forearm energy shields.
   - Distinct visual identities: **VORTEX** (Electric Crimson) and **ION** (Electric Cobalt Cyan).
   - Dynamic facing controller (fighters smoothly turn to face each other across the 2D plane).
   - Real-time procedural animation system for **IDLE**, **WALK**, **CROUCH**, **JUMP**, **PUNCH**, **KICK**, **BLOCK**, and **HIT STAGGER**.

3. **Combat & Collision Systems:**
   - Pushbox collision separation preventing fighters from passing through each other.
   - Active attack hitboxes with startup, active, and recovery frame data.
   - Defensive blocking system with damage reduction and radiant energy shield visual effects.
   - Combat spark particle bursts for clean hits and metallic deflect sparks for blocks.
   - Hitstop freeze frames (0.06s) and dynamic camera screen shake for punchy combat impact.

4. **Dynamic 2.5D Camera:**
   - Midpoint tracking smoothly framing both fighters.
   - Contextual zoom: smoothly zooms in for close quarters and pulls back when fighters separate.
   - Clamped bounds preventing viewing beyond arena borders.

5. **Fighting Game HUD:**
   - Angled metallic health bars with delayed yellow ghost damage indicators.
   - Center digital match countdown timer (99s) with low-time warning pulsation.
   - Round counter and victory badges.
   - Floating fighter identification nameplates.
   - Quick utility bar: Audio mute toggle, Desktop controls guide toggle, Touch controls toggle, Fullscreen button, and Pause menu.

6. **Mobile-First Foundation:**
   - Responsive UI adapting to phones, tablets, and desktop displays.
   - Portrait orientation warning prompting rotation to landscape mode.
   - Full virtual touch D-pad and action button overlay for touchscreen devices.
   - Adjustable graphics presets (Low / Medium / High) and adaptive pixel ratio clamp for solid 60 FPS performance.

7. **Zero-Dependency Audio Synthesizer:**
   - Web Audio API procedural sound engine generating punch impacts, kick swooshes, block clanks, jump whooshes, menu blips, and round start/K.O. gongs without requiring external audio files.

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18.0.0 or higher recommended)
- npm or yarn

### Installation
```bash
# Clone the repository
git clone https://github.com/vuyyav/ARENA-X.git
cd ARENA-X

# Install dependencies
npm install
```

### Running Development Server
```bash
npm run dev
```
The game will start at `http://localhost:3000`.

### Building for Production
```bash
npm run build
```
The production bundle will be generated in `dist/`.

### Previewing Production Build
```bash
npm run preview
```

---

## 📁 Project Structure

```
src/
  components/       # Reusable components (e.g. OrientationWarning)
  pages/            # Main pages (MainMenu, GameArenaPage)
  game/
    arena/          # 3D stage environment & particle spark systems
    camera/         # 2.5D dynamic camera controller
    characters/     # Articulated humanoid model & Fighter state machine
    controls/       # Dual keyboard & touch input management
    core/           # Main GameEngine loop & SoundManager synthesizer
    physics/        # Rapier 3D WebAssembly physics world
    ui/             # FightHUD, health bars, timer, and overlays
  assets/           # Icons and vector graphics
  styles/           # Complete fighting game theme CSS
  config/           # Core configuration parameters (physics, camera, attacks)
  types/            # TypeScript interfaces & types
```

---

## 🗺️ Development Roadmap

- [x] **Phase 1: Project Setup & First Playable 3D Prototype**
- [ ] **Phase 2: Rigged Humanoid Models & Character Studio**
- [ ] **Phase 3: Deep Combat Mechanics, Special Moves & Combos**
- [ ] **Phase 4: WebRTC Multiplayer, Tournaments & Career Profiles**

---

## 📄 License
ISC License — Arena X Team.
