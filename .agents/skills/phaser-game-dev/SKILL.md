---
name: phaser-game-dev
description: Phaser 3 and 2D canvas game development patterns, scene lifecycle, 2D sprite animation pipelines, camera tracking, and browser performance optimization for action/fighting games.
metadata:
  origin: GameDev Skills
---

# Phaser 3 & 2D Canvas Game Development

Best practices for building high-performance 2D browser games using Phaser 3 and native HTML5 Canvas.

## Core Architecture Principles

1. **Explicit 2D Rendering:**
   - Use `type: Phaser.CANVAS` or optimized WebGL 2D pipeline.
   - Separate game simulation tick (fixed 60Hz delta) from presentation layer.
2. **Sprite & Texture Management:**
   - Pack sprites into texture atlases to eliminate draw calls.
   - Preload textures in loading scene before combat starts.
3. **Decoupled DOM UI Layer:**
   - Keep heavy text, menus, modals, and complex typography in React/DOM overlays.
   - Use the canvas strictly for high-frequency game objects, projectiles, and particle VFX.
4. **Camera Tracking in Fighting Games:**
   - Smoothly interpolate camera position: `camera.x += (targetX - camera.x) * lerpFactor`.
   - Calculate midpoint between both fighters: `midX = (p1.x + p2.x) / 2`.
   - Scale camera zoom dynamically based on distance: `zoom = clamp(baseWidth / distance, minZoom, maxZoom)`.
   - Clamp camera bounds strictly to stage limits to avoid displaying out-of-bounds voids.
