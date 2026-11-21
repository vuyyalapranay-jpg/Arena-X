# ARENA X — 2.5D Fighting Game

![Arena X Logo](public/arena-x-icon.svg)

> **Phase 2: Professional 3D Character Models & Animation System**  
> A high-performance, real-time 3D fighting game prototype built with React, TypeScript, Vite, Three.js, and Rapier 3D Physics.

---

## 🎮 Overview

**Arena X** is a competitive 2.5D fighting game. Movement and combat take place along a strictly constrained 2D fighting plane within a fully rendered 3D cyberpunk arena, featuring dynamic camera tracking, **fully rigged 3D humanoid fighters with 21 skeletal animations**, real-time physics collisions, hit reactions, and responsive controls.

---

## ⚡ Technology Stack

- **Framework:** React 18 & TypeScript
- **Build Tool:** Vite 5
- **3D Graphics & Animation:** Three.js (`AnimationMixer`, `AnimationAction`, `AnimationClip`, `Skeleton`, `GLTFLoader`)
- **Physics Engine:** Rapier 3D (`@dimforge/rapier3d-compat` WebAssembly)
- **Audio Engine:** Web Audio API (procedural synthesis for zero-latency combat audio)
- **UI & Styling:** Modern CSS3 with hardware-accelerated layouts
- **Icons:** Lucide React

---

## 🥋 Fighters & Visual Identity (Phase 2)

### Player 1 — VORTEX (Crimson Striker)
- **Aesthetic:** Athletic Martial Artist.
- **Hair & Face:** Spiked black hair with crimson highlights, flowing red combat headband with trailing ribbons, sculpted jawline, nose bridge, and red LED fighter visor.
- **Outfit:** Open sleeveless black combat gi vest with crimson lapels, rear dragon crest, black martial arts sash belt with emissive power buckle.
- **Hands & Legs:** Wrapped/taped red martial arts wraps covering wrists and knuckles, loose black fighting trousers with crimson side racing stripes, reinforced steel-toe red & black kick boots.

### Player 2 — ION (Cobalt Vanguard)
- **Aesthetic:** Cybernetic Kickboxer / Street Striker.
- **Hair & Face:** Modern undercut fade with glowing cyan tips, sculpted jawline with cybernetic optical eye implant and blue accent eye.
- **Outfit:** High-collar tactical cyber combat jacket in dark charcoal with glowing electric blue piping and back thermal power vent.
- **Hands & Legs:** Tactical fingerless cyber combat gloves with cyan glowing knuckle nodes, reinforced dark carbon cargo trousers with tactical blue knee pads, high-top cyber kickboxing sneakers with glowing cyan soles.

---

## 🏃 21-Animation Skeletal System

Built on the official Three.js `AnimationMixer` and `AnimationAction` architecture with smooth crossfade blending:

1. **Idle:** Dynamic combat stance with body sway and breathing.
2. **Breathing:** Deep chest and shoulder heave.
3. **Walk Forward:** Tactical forward stride with arm swinging.
4. **Walk Backward:** Defensive backstep with raised high guard.
5. **Run:** Aggressive forward sprint with driving knee strides.
6. **Jump:** Leaping takeoff with airborne knee tuck.
7. **Fall:** Downward descent in air with stabilizing limbs.
8. **Land:** Ground impact shock absorption with knee bend.
9. **Crouch:** Defensive low-profile crouched guard.
10. **Lead Jab:** Snappy left punch with shoulder drive.
11. **Straight Cross:** Powerful right punch with torso rotation.
12. **Overhand Smash:** Heavy power punch with forward step.
13. **Front Snap Kick:** Quick front kick thrusting ball of foot.
14. **High Roundhouse:** Martial arts head kick with counter-balance tilt.
15. **Low Shin Sweep:** Sweeping low kick from crouch.
16. **Guard / Block:** Crossed-arm high guard with glowing energy shield.
17. **Hit Reaction:** Snappy torso recoil and head snap.
18. **Knockback:** Heavy strike stumble backwards.
19. **Stagger:** Dazed unsteady reel.
20. **Victory:** Triumphant victory pose with raised fist.
21. **Defeat:** Knockdown collapse to the canvas.

---

## 🕹️ Controls Guide

### Player 1 (Crimson Striker — VORTEX)
| Action | Keyboard Key | Mobile Touch |
| :--- | :--- | :--- |
| **Move Left / Right** | `A` / `D` | D-Pad Left ◀ / Right ▶ |
| **Jump** | `W` | D-Pad Up ▲ |
| **Crouch** | `S` | D-Pad Down ▼ |
| **Punch (Jab / Cross / Heavy)** | `F` | [PUNCH] Button |
| **Kick (Front / Roundhouse / Low)** | `G` | [KICK] Button |
| **Block (Guard)** | `H` | [BLOCK] Button |

### Player 2 (Cobalt Vanguard — ION)
| Action | Keyboard Key |
| :--- | :--- |
| **Move Left / Right** | `Arrow Left` (←) / `Arrow Right` (→) |
| **Jump** | `Arrow Up` (↑) |
| **Crouch** | `Arrow Down` (↓) |
| **Punch (Jab / Cross / Heavy)** | `J` |
| **Kick (Front / Roundhouse / Low)** | `K` |
| **Block (Guard)** | `L` |

*Move Combinations:*
- Hold `F` or tap rapidly: Jab -> Straight Cross combo.
- Hold Forward + `F`: Heavy Overhand Smash.
- Crouch (`S`) + `F`: Low Jab.
- Neutral `G`: Front Snap Kick.
- Forward + `G`: High Roundhouse Kick.
- Crouch (`S`) + `G`: Low Shin Sweep.

---

## 🚀 Getting Started

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
Open `http://localhost:3000` in any modern web browser.

### Building for Production
```bash
npm run build
```

---

## 🗺️ Development Roadmap

- [x] **Phase 1: Project Setup & First Playable 3D Prototype**
- [x] **Phase 2: Professional 3D Character Models & Animation System**
- [ ] **Phase 3: Deep Combat Mechanics, Special Moves & Combos**
- [ ] **Phase 4: WebRTC Multiplayer, Tournaments & Career Profiles**

---

## 📄 License
ISC License — Arena X Team.
