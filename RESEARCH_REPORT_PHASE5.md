# ARENA X — Phase 5 Open-Source Research & Technical Architecture

## 1. Executive Summary
Phase 5 integrates high-impact special abilities, projectiles, super meter mechanics, power-up states, and 2D cinematic ultimate sequences into ARENA X. In strict accordance with project requirements, all visuals are rendered through the HTML5 Canvas 2D API (`CanvasRenderingContext2D`) without WebGL or 3D engines.

---

## 2. Open-Source Research & Technical References

### 2.1 HTML5 Canvas 2D Particle Synthesis & Additive Blending
- **Source**: MDN Web Docs — `CanvasRenderingContext2D.globalCompositeOperation`
- **Application**:
  - `ctx.globalCompositeOperation = 'lighter'` (additive blending) produces vibrant energy auras, glowing plasma arcs, and anime-style beam flares without performance degradation.
  - Multi-stop radial gradients (`createRadialGradient`) cached onto offscreen canvas patterns enable high-frame-rate rendering of glowing energy projectiles (Kai's cyan *Blue Wave* and Shadow's violet *Dark Orb*).
- **License**: CC0 / Public Domain documentation.

### 2.2 Fighting Game Cinematic Camera System (2.5D Illusion via 2D Canvas)
- **Reference**: Capcom / Arc System Works 2D Fighting Game Camera Design Literature (*Guilty Gear*, *Street Fighter III: 3rd Strike*, *BlazBlue*).
- **Application**:
  - **Super Freeze (Hit-Stop)**: Halting simulation time for 0.3s while triggering a dramatic screen flash and radial darken vignette.
  - **Dynamic 2D Focal Zoom**: Seamlessly transitioning camera zoom from normal gameplay (~0.85) to dramatic close-up (1.35x–1.45x) centered on the attacker during ultimate startup.
  - **Camera Shake & Restoration**: Applying high-frequency 2D screen shake on ultimate impact, followed by exponential return to standard two-fighter framing.
- **Strict 2D Compliance**: Implemented purely via 2D affine transformation matrices (`ctx.translate`, `ctx.scale`) and world coordinate mathematics.

### 2.3 Web Audio API Procedural Sound Design
- **Source**: Web Audio API Specification (W3C Recommendation)
- **Application**:
  - Eliminates external audio asset licensing issues by procedurally synthesizing original audio:
    - **Energy Charging**: Dual sawtooth oscillators with a sweeping resonant low-pass filter (`200Hz` to `900Hz`) and subtle LFO vibrato.
    - **Projectile Launch**: Snappy pitch-down triangle chirp (`850Hz` to `120Hz`) combined with band-pass filtered white noise burst.
    - **Flash/Phantom Dash**: Filtered noise whoosh with exponential decay (120ms).
    - **Ultimate Activation**: Majestic dual-tone chord riser (C minor 9th) with sub-bass pulse.
    - **Energy Explosion**: Overdriven noise generator feeding a 60Hz resonant sub-bass filter with exponential decay.
- **License**: W3C Open Standard.

### 2.4 Anime Visual Effects Synthesis
- **Reference**: Krita & LibreSprite Animation Pipelines; OpenGameArt CC0 FX guides.
- **Application**:
  - **After-Image Trails (Ghosting)**: Storing recent character transform snapshots to render fading chromatic after-images during dashes.
  - **Procedural Lightning Arcs**: Recursive midpoint displacement generator for electric energy sparks.
  - **Ground Shockwave Rings**: Expanding elliptical wave rings projected along the 2.5D floor perspective plane (`floorY = 560`).

---

## 3. Implementation Plan
1. **Sound Design (`SoundManager.ts`)**: Add procedural audio for charging, projectiles, dashes, and ultimate explosions.
2. **Visual Effects Engine (`VFXManager2D.ts`)**: Add energy auras, lightning sparks, after-image trails, shockwave rings, and cinematic dark vignette.
3. **Projectile Engine (`Projectile2D.ts`)**: Add *Blue Wave* (crescent blade) and *Dark Orb* (pulsing void sphere) with particle trails.
4. **Combat Types & Engine (`CombatTypes.ts` & `CombatEngine.ts`)**: Register all 10 special abilities and ultimates with framedata, hitbox radiuses, damages, and meter costs.
5. **Character Controller (`AnimeFighter2D.ts`)**: Add charge pose (holding `C`), surge mode, and character-specific movesets.
6. **Cinematic Ultimate Sequence (`GameEngine.ts`)**: Multi-stage ultimate cutscene orchestrator (Freeze -> Focus Zoom -> Unleash -> Mega Impact Shake -> Smooth Restore).
7. **HUD & Input (`FightHUD.tsx` & `InputManager.ts`)**: Add super meter bars, Ultimate Ready pulse, and touch controls for Charge and Ultimate.
8. **Automated Verification**: Playwright test suite `tests/phase5-special-abilities.spec.ts`.
