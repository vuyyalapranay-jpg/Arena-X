# ARENA X — System Architecture & Technical Specifications

**Version:** 1.0.0 (Master 2D Engine Architecture)  
**Target Platform:** Modern Web Browsers (Desktop & Mobile Landscape)  
**Core Technologies:** HTML5 Canvas / Phaser 3 / React 18 / TypeScript 5 / Vite 5 / WebSockets / Web Audio API  

---

## 1. Architectural Philosophy

ARENA X is designed with a strict decoupled layer architecture:

1. **Rendering & Game Loop Layer (Canvas 2D / Phaser 3):**
   - High-throughput 60 FPS deterministic game loop.
   - Zero DOM overhead for active combat rendering.
   - Pure 2D sprites, particle arrays, and multi-layer parallax stages.

2. **Presentation & UI Overlay Layer (React 18 + Lucide):**
   - Renders menus, lobby, fighter selection, profile modals, and responsive in-match HUD.
   - Synchronized via lightweight event callbacks without causing canvas re-renders.

3. **Audio Architecture (SoundManager & Web Audio API):**
   - Fully procedural and synthesized multi-bus sound system.
   - Sub-millisecond latency for hit impacts, voice grunts, and dynamic fight music.

4. **Authoritative Multiplayer Backend (Node.js + WebSockets):**
   - Server-authoritative 60Hz tick simulation.
   - Prevents client-side manipulation of match outcomes, health, or hits.

```
+-----------------------------------------------------------------------------------+
|                                 ARENA X CLIENT                                    |
|                                                                                   |
|  +--------------------------+   +----------------------------------------------+  |
|  |     REACT 18 UI LAYER    |   |           CANVAS 2D / PHASER CORE            |  |
|  |                          |   |                                              |  |
|  |  * MainMenu / Lobby      |   |  * GameEngine (Fixed 60Hz RAF Step)          |  |
|  |  * FightHUD (DOM Overlay)|   |  * FightCamera2D (Dynamic Zoom & Pan)        |  |
|  |  * CharacterSelectModal  |   |  * Stage2D (Multi-layer Parallax)            |  |
|  |  * StageSelectModal      |   |  * VFXManager2D (Hitsparks, Embers, Dust)    |  |
|  |  * PlayerProfileModal    |   |  * Projectile2D (Fireballs & Energy Waves)   |  |
|  |  * TouchControls         |   +----------------------+-----------------------+  |
|  +------------+-------------+                          |                          |
|               |                                        |                          |
|               +--------------------+-------------------+                          |
|                                    |                                              |
|                                    v                                              |
|  +-----------------------------------------------------------------------------+  |
|  |                           COMBAT & PHYSICS CORE                             |  |
|  |                                                                             |  |
|  |  * AnimeFighter2D (States, Positions, Velocities, Pushboxes, Hurtboxes)     |  |
|  |  * CombatEngine (Frame Data, Startup/Active/Recovery, Hitboxes, Combos)     |  |
|  |  * InputManager (Keyboard P1/P2, Gamepad API, Mobile Virtual Joystick)      |  |
|  |  * SoundManager (Web Audio API Multi-Bus Synthesizer & BGM Sequencer)       |  |
|  |  * ProgressionManager (XP, Ranks, AX Coins, Character Unlocks)              |  |
|  +-------------------------------------+---------------------------------------+  |
+----------------------------------------|------------------------------------------+
                                         |
                                         | WebSocket Protocol (ws://:2567)
                                         v
+-----------------------------------------------------------------------------------+
|                            AUTHORITATIVE NODE.JS SERVER                           |
|                                                                                   |
|  * RoomManager: Matchmaking queue, public lobby browser, private room codes       |
|  * ArenaFightRoom: Authoritative 60Hz physics tick, input buffer, state snapshots |
+-----------------------------------------------------------------------------------+
```

---

## 2. Component Specifications

### 2.1 GameEngine (`src/game/core/GameEngine.ts`)
- Implements `requestAnimationFrame` with delta-time clamping (maximum 0.1s to prevent spiral-of-death on background tabs).
- Manages discrete game states: `INTRO`, `COUNTDOWN`, `FIGHTING`, `ROUND_OVER`, `MATCH_OVER`, `PAUSED`.
- Coordinates fighter updates, projectile collisions, stage particle ticks, and camera framing.

### 2.2 Combat Engine (`src/game/combat/CombatEngine.ts`)
- **Hit Detection:** AABB (Axis-Aligned Bounding Box) intersection between active attacker `hitboxes` and defender `hurtboxes`.
- **Combat Resolution:**
  - Evaluates defense state: High Block, Low Block, Parry, Counter.
  - Applies hitstun or blockstun frames according to move data.
  - Triggers camera hit-freeze (`hitstop`) for visceral impact feel (40ms light, 80ms heavy, 120ms ultimate).
  - Calculates combo damage scaling: $Damage = BaseDamage \times (0.95)^{hits - 1}$ (floored at 20% minimum).
  - Charges Defender and Attacker Super Meters proportionally.

### 2.3 Audio System (`src/game/core/SoundManager.ts`)
- Utilizes pure Web Audio API without relying on bulky external audio downloads.
- Multi-bus architecture:
  - `MasterBus`: Master volume and mute attenuation.
  - `BgmBus`: Real-time FM/additive synthesizers generating dynamic synthwave/cyber-chime stage soundtracks.
  - `SfxBus`: Filtered white-noise burst generators and frequency-modulated oscillators creating punch impacts, sword slashes, fire whooshes, and guard blocks.
  - `VoiceBus`: Formant synthesizers tailored to 16 fighter pitch identities.
  - `AmbienceBus`: Environmental rain, wind, and industrial rumble loops.

### 2.4 Authoritative Multiplayer (`server/rooms/ArenaFightRoom.ts`)
- 60Hz tick loop executing identical combat rules on the server.
- Clients send inputs (`up`, `down`, `left`, `right`, `light`, `heavy`, `kick`, `special`, `ultimate`, `block`, `dodge`) tagged with sequential input numbers.
- Server broadcasts authoritative delta snapshots at 30Hz; client interpolates smooth 60 FPS visuals while predicting local actions.
