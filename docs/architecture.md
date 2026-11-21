# Arena X — System Architecture & Technical Specifications

**Project Name:** Arena X  
**Repository:** ARENA-X  
**Version:** 0.2.0-alpha (Phase 2 Professional 3D Models & Animation System)  
**Primary Engine:** Three.js (WebGL, AnimationMixer, Skeletal Rigs) + Rapier 3D Physics (WASM) + React 18 + TypeScript + Vite  

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
|  |  * MainMenu (Studio)   |  |  * GameEngine (RAF Loop, Delta-Time Step)     |  |
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
|  |              PROFESSIONAL SKELETAL & COMBAT SUBSYSTEM                     |  |
|  |                                                                           |  |
|  |  * RiggedHumanoidBuilder (21-Bone Skeleton, Humanoid Proportions & Gear)  |  |
|  |  * CharacterLoader (GLTFLoader Pipeline + Built-in Humanoid Rig Fallback) |  |
|  |  * FighterAnimationClips (21 Keyframe AnimationClips with Biomechanics)   |  |
|  |  * AnimationStateMachine (Priority Tiers, Interrupt Rules, Loop Specs)    |  |
|  |  * CharacterAnimator (AnimationMixer, Crossfade Blending, Events)        |  |
|  |  * Fighter (Locomotion, Combat Moves, Hitbox/Hurtbox, Pushbox Separation) |  |
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
│   └── architecture.md               # Technical specifications & roadmap
├── public/
│   ├── arena-x-icon.svg              # High-resolution vector brand icon
│   └── assets/
│       └── characters/               # Ready for custom GLTF/GLB character drop-in
├── src/
│   ├── assets/                       # Static assets & textures
│   ├── components/                   # Shared UI widgets
│   │   └── OrientationWarning.tsx    # Mobile landscape orientation prompt
│   ├── config/
│   │   └── gameConfig.ts             # Core constants (Physics, Camera, Fighters, Attacks)
│   ├── game/
│   │   ├── arena/
│   │   │   ├── Arena3D.ts            # 3D stage geometry, background cityscape, lights
│   │   │   └── ParticleSystem.ts     # Additive particle sparks & hit effects
│   │   ├── camera/
│   │   │   └── FightCamera.ts        # Dynamic 2.5D midpoint camera & screen shake
│   │   ├── characters/
│   │   │   ├── AnimationStateMachine.ts # State transition rules, priority & loops
│   │   │   ├── CharacterAnimator.ts  # Three.js AnimationMixer & action controller
│   │   │   ├── CharacterConfig.ts    # Fighter visual profiles & attack tables
│   │   │   ├── CharacterLoader.ts    # GLTFLoader pipeline with procedural fallback
│   │   │   ├── Fighter.ts            # Fighter controller, movement & combat engine
│   │   │   ├── FighterAnimationClips.ts # 21 professional AnimationClips
│   │   │   └── RiggedHumanoidBuilder.ts # 21-bone humanoid skeleton & 3D gear
│   │   ├── controls/
│   │   │   └── InputManager.ts       # Dual-player keyboard & virtual touch bridge
│   │   ├── core/
│   │   │   ├── GameEngine.ts         # Primary game loop, combat resolution, rules
│   │   │   └── SoundManager.ts       # Procedural Web Audio API sound generator
│   │   ├── physics/
│   │   │   └── PhysicsWorld.ts       # Rapier 3D WebAssembly physics engine
│   │   └── ui/
│   │       └── FightHUD.tsx          # Slanted health bars, timer, controls & modals
│   ├── pages/
│   │   ├── GameArenaPage.tsx         # Fighting arena canvas wrapper & HUD connector
│   │   └── MainMenu.tsx              # Dark cinematic main menu & Character Studio
│   ├── styles/
│   │   └── index.css                 # Fighting game typography & styling
│   ├── types/
│   │   └── index.ts                  # TypeScript data models & game interfaces
│   ├── App.tsx                       # Root application router & state manager
│   └── main.tsx                      # React 18 bootstrap
├── .env.example
├── .gitignore
├── index.html
├── package.json
├── tsconfig.json
├── tsconfig.node.json
└── vite.config.ts
```

---

## 3. Phase 2 Character Models & Visual Identity

### 3.1 Player 1 — VORTEX (Crimson Striker)
- **Archetype:** Athletic Martial Artist.
- **Hair & Face:** Spiked black hair with crimson highlights, flowing red combat headband with trailing ribbons, sculpted jawline, nose bridge, and red LED fighter visor.
- **Outfit:** Open sleeveless black combat gi vest with crimson lapels, rear dragon crest, black martial arts sash belt with emissive power buckle.
- **Arms & Hands:** Athletic biceps with wrapped/taped red martial arts wraps covering wrists and knuckles.
- **Legs & Footwear:** Loose black fighting trousers with crimson side racing stripes, reinforced steel-toe red & black kick boots.

### 3.2 Player 2 — ION (Cobalt Vanguard)
- **Archetype:** Cybernetic Kickboxer / Street Striker.
- **Hair & Face:** Modern undercut fade with glowing cyan tips, sculpted jawline with cybernetic optical eye implant and blue accent eye.
- **Outfit:** High-collar tactical cyber combat jacket in dark charcoal with glowing electric blue piping and back thermal power vent.
- **Arms & Hands:** Dark tactical sleeves with fingerless cyber combat gloves and cyan glowing knuckle nodes.
- **Legs & Footwear:** Reinforced dark carbon cargo trousers with tactical blue knee pads, high-top cyber kickboxing sneakers with glowing cyan soles.

---

## 4. 21-Animation Skeletal System

Built on the official Three.js `AnimationMixer`, `AnimationAction`, and `AnimationClip` architecture with 21 distinct clips targeting standard humanoid bone tracks (`QuaternionKeyframeTrack` and `VectorKeyframeTrack`):

| Category | Animation State | Clip Name | Loop Style | Priority | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Locomotion** | `IDLE` | `idle` | LoopRepeat | 0 | Dynamic combat stance with body sway and breathing |
| | `BREATHING` | `breathing` | LoopRepeat | 0 | Deep chest and shoulder heave |
| | `WALK_FWD` | `walk_fwd` | LoopRepeat | 1 | Tactical forward stride with arm swinging |
| | `WALK_BWD` | `walk_bwd` | LoopRepeat | 1 | Defensive backstep with raised high guard |
| | `RUN` | `run` | LoopRepeat | 1 | Aggressive forward sprint with driving knee strides |
| | `CROUCH` | `crouch` | LoopRepeat | 1 | Defensive low-profile crouched guard |
| **Traversal** | `JUMP` | `jump` | LoopOnce | 2 | Leaping takeoff with airborne knee tuck |
| | `FALL` | `fall` | LoopRepeat | 2 | Downward descent in air with stabilizing limbs |
| | `LAND` | `land` | LoopOnce | 2 | Ground impact shock absorption with knee bend |
| **Combat** | `PUNCH_LEFT` | `punch_left` | LoopOnce | 4 | Snappy lead jab with shoulder drive |
| | `PUNCH_RIGHT` | `punch_right` | LoopOnce | 4 | Powerful rear cross with torso rotation |
| | `PUNCH_HEAVY` | `punch_heavy` | LoopOnce | 4 | Overhand power smash with forward step |
| | `KICK_FRONT` | `kick_front` | LoopOnce | 4 | Front snap kick thrusting ball of foot |
| | `KICK_HIGH` | `kick_high` | LoopOnce | 4 | High roundhouse kick with counter-balance tilt |
| | `KICK_LOW` | `kick_low` | LoopOnce | 4 | Low shin sweep from crouch |
| | `BLOCK` | `block` | LoopRepeat | 3 | Crossed-arm high guard with glowing energy shield |
| **Hit Reactions**| `HIT_STAGGER` | `hit_reaction` | LoopOnce | 5 | Snappy torso recoil and head snap |
| | `KNOCKBACK` | `knockback` | LoopOnce | 6 | Heavy strike stumble backwards |
| | `STAGGER` | `stagger` | LoopOnce | 5 | Dazed unsteady reel |
| **Match End** | `VICTORY` | `victory` | LoopOnce | 7 | Triumphant victory pose with raised fist |
| | `DEFEAT` | `defeat` | LoopOnce | 7 | Knockdown collapse to the canvas |

---

## 5. Animation State Management & Blending

- **Crossfade Blending:** `CharacterAnimator` uses `crossFadeFrom` with state-tuned blend durations (e.g., 0.05s for snappy jabs, 0.04s for hit reactions, 0.12s for locomotion transitions) eliminating any visual snapping.
- **Priority & Interruption Rules:**
  - Standard attacks (`Priority 4`) cannot interrupt themselves until completed, but can be interrupted by `HIT_REACTION` (`Priority 5`), `KNOCKBACK` (`Priority 6`), or `DEFEAT` (`Priority 7`).
  - `JUMP` transitions seamlessly into `FALL` upon downward vertical velocity, and into `LAND` upon ground contact.
- **Mixer Finished Callbacks:** Actions configured with `THREE.LoopOnce` notify `CharacterAnimator` on completion to automatically transition back to `IDLE` without stalling.

---

## 6. Phase Roadmap

- [x] **Phase 1:** Project foundation, 3D fighting arena, Rapier physics, camera tracking, combat HUD, mobile touch support.
- [x] **Phase 2:** Professional 3D character models, 21-bone skeletal rigs, 21-animation suite, Character Studio showcase, crossfading controller, GLTFLoader pipeline.
- [ ] **Phase 3:** Advanced combo system, EX meter & super moves, juggle physics, frame data analyzer.
- [ ] **Phase 4:** WebRTC multiplayer rollback netcode, tournament brackets, AI difficulty levels, player career profiles.
