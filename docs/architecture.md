# Arena X — System Architecture & Technical Specifications

**Project Name:** Arena X  
**Repository:** ARENA-X  
**Version:** 0.1.0-alpha (Phase 1 Playable 3D Prototype)  
**Primary Engine:** Three.js (WebGL) + Rapier 3D Physics (WASM) + React + TypeScript + Vite  

---

## 1. Architectural Overview

Arena X is engineered as a high-performance, modular 2.5D fighting game engine running natively in modern web browsers across desktop, tablet, and mobile devices.

```
+---------------------------------------------------------------------------------+
|                                 ARENA X CLIENT                                  |
|                                                                                 |
|  +------------------------+  +-----------------------------------------------+  |
|  |     REACT UI LAYER     |  |             GAME ENGINE CORE                  |  |
|  |                        |  |                                               |  |
|  |  * MainMenu            |  |  * GameEngine (RAF Loop, Delta-Time Step)     |  |
|  |  * FightHUD            |  |  * SoundManager (Web Audio API Synthesizer)   |  |
|  |  * ControlsOverlay     |  |  * FightCamera (Dynamic 2.5D Tracking & Zoom) |  |
|  |  * TouchControls       |  |  * ParticleSystem (Hit/Block/Embers)          |  |
|  |  * OrientationWarning  |  +-----------------------+-----------------------+  |
|  +-----------+------------+                          |                          |
|              |                                       |                          |
|              +-------------------+-------------------+                          |
|                                  |                                              |
|                                  v                                              |
|  +---------------------------------------------------------------------------+  |
|  |                        FIGHTER & COMBAT SUBSYSTEM                         |  |
|  |                                                                           |  |
|  |  * Fighter State Machine (IDLE, WALK, CROUCH, JUMP, PUNCH, KICK, BLOCK)   |  |
|  |  * ArticulatedHumanoid (19 Articulated Segment Hierarchy & Shaders)       |  |
|  |  * Hitbox / Hurtbox / Pushbox Collision System                            |  |
|  |  * Hitstop Freeze & Screen Shake Controller                               |  |
|  +-------------------------------------+-------------------------------------+  |
|                                        |                                        |
|  +-------------------------------------+-------------------------------------+  |
|  |                     PHYSICS & STAGE ENVIRONMENT                           |  |
|  |                                                                           |  |
|  |  * PhysicsWorld (Rapier 3D WebAssembly Colliders & Ground Raycasting)    |  |
|  |  * Arena3D (Platform, Boundaries, Cityscape, Lighting & Shadows)         |  |
|  |  * InputManager (Simultaneous Dual-Keyboard & Touch Event Bridge)        |  |
|  +---------------------------------------------------------------------------+  |
+---------------------------------------------------------------------------------+
```

---

## 2. Directory Structure

```
arena-x/
├── docs/
│   └── architecture.md            # Technical specifications & roadmap
├── public/
│   └── arena-x-icon.svg           # High-resolution vector brand icon
├── src/
│   ├── assets/                    # Static assets & textures
│   ├── components/                # Shared UI widgets
│   │   └── OrientationWarning.tsx # Mobile landscape orientation prompt
│   ├── config/
│   │   └── gameConfig.ts          # Core constants (Physics, Camera, Fighters, Attacks)
│   ├── game/
│   │   ├── arena/
│   │   │   ├── Arena3D.ts         # 3D stage geometry, background cityscape, lights
│   │   │   └── ParticleSystem.ts  # Additive particle sparks & hit effects
│   │   ├── camera/
│   │   │   └── FightCamera.ts     # Dynamic 2.5D midpoint camera & screen shake
│   │   ├── characters/
│   │   │   ├── ArticulatedHumanoid.ts # 3D articulated humanoid geometry & poses
│   │   │   └── Fighter.ts         # Character state machine & collision boxes
│   │   ├── controls/
│   │   │   └── InputManager.ts    # Dual-player keyboard & virtual touch bridge
│   │   ├── core/
│   │   │   ├── GameEngine.ts      # Primary game loop, combat resolution, rules
│   │   │   └── SoundManager.ts    # Procedural Web Audio API sound generator
│   │   ├── physics/
│   │   │   └── PhysicsWorld.ts    # Rapier 3D WebAssembly physics engine
│   │   └── ui/
│   │       └── FightHUD.tsx       # Slanted health bars, timer, controls & modals
│   ├── pages/
│   │   ├── GameArenaPage.tsx      # Fighting arena canvas wrapper & HUD connector
│   │   └── MainMenu.tsx           # Dark cinematic main menu with particle canvas
│   ├── styles/
│   │   └── index.css              # Fighting game typography & styling
│   ├── types/
│   │   └── index.ts               # TypeScript data models & game interfaces
│   ├── App.tsx                    # Root application router & state manager
│   └── main.tsx                   # React 18 bootstrap
├── .env.example
├── .gitignore
├── index.html
├── package.json
├── tsconfig.json
├── tsconfig.node.json
└── vite.config.ts
```

---

## 3. Core Subsystems

### 3.1 Physics & Movement Plane
- **2.5D Constrained Fighting Plane:** Movement is locked to the X-Y plane (Z = 0) with arena boundaries at X = [-10.5, 10.5].
- **Rapier 3D Integration:** Uses `@dimforge/rapier3d-compat` running WebAssembly. Includes static colliders for stage platform and boundaries, with raycasting for ground verification.
- **Pushbox Separation:** Prevents fighters from passing through or clipping each other during close-quarters combat.

### 3.2 Articulated Humanoid Fighter System
- Built from an articulated 19-segment mesh hierarchy:
  - Pelvis & Spine Joint
  - Armored Chestplate & Emissive Power Core
  - Angular Cyber Helmet with illuminated visor
  - Shoulders, Biceps, Elbows, Armored Forearms, Fists
  - Hips, Thighs, Knees, Armored Shins, Boots
  - Forearm Energy Shield mesh (active during Block state)
- **Procedural Animation Engine:** Computes frame-rate independent procedural poses for:
  - `IDLE`: Staggered guard stance with rhythmic breathing oscillation.
  - `WALK_FWD` & `WALK_BWD`: Dynamic leg strides, counter-arm swinging, and torso tilt.
  - `JUMP`: Airborne tuck with reactive landing anticipation.
  - `CROUCH`: Low-profile defensive crouch.
  - `PUNCH`: Rapid jab/cross extending lead fist, torso torque, and snappy retraction.
  - `KICK`: High roundhouse kick with counter-balance torso tilt.
  - `BLOCK`: High cross-arm guard with glowing cyan energy field.
  - `HIT_STAGGER`: Torso and head recoil with emissive flash.
  - `KNOCKDOWN`: Supine knockdown pose on canvas.
- **Ready for Phase 2 Rigged Models:** Structured cleanly to drop in skinned GLTF/GLB humanoid skeletons without breaking combat logic.

### 3.3 Dynamic 2.5D Fight Camera
- **Midpoint Tracking:** Smoothly tracks the X-Y center between both fighters.
- **Dynamic Zoom:** Smoothly zooms in (min distance: 6.8m) when fighters engage up close, and zooms out (max distance: 11.5m) when fighters separate.
- **Screen Shake:** Frequency-decayed camera rumble on heavy impacts.

### 3.4 Procedural Sound Synthesis (Web Audio API)
- Zero external audio files required — immune to missing asset 404s and network latency.
- Custom synthesized punch whooshes, crunch impacts, kick whooshes, heavy bass kicks, energy shield resonant clanks, jump swooshes, menu blips, and round start/K.O. gongs.

### 3.5 Mobile-First & Adaptive Performance
- **Adaptive Pixel Ratio:** Automatically clamps DPR between 1.0 and 2.0 based on graphics quality preset and mobile detection.
- **Quality Presets:** Low, Medium, High (adjusting shadow map resolution, antialiasing, and particle counts).
- **Virtual Touch Controls:** Complete dual-control support with left virtual D-pad and right action buttons.
- **Landscape Warning:** Automatic portrait mode detector prompting device rotation.

---

## 4. Phase Roadmap

- **Phase 1 (Complete):** Project foundation, 3D fighting arena, 2 articulated humanoid fighters, local 2-player controls, camera tracking, Rapier physics, particle combat effects, sound engine, HUD, mobile touch support.
- **Phase 2 (Upcoming):** Rigged 3D GLTF models, skeletal bone animations, Character Studio customization, special move meter & EX moves.
- **Phase 3 (Upcoming):** Extended combo system, juggle physics, frame data visualization, hit stun scaling, wall bounces, sound packs.
- **Phase 4 (Upcoming):** WebRTC multiplayer rollback netcode, tournament brackets, AI difficulty levels, player profiles & ranked ladder.
