---
name: fighting-game-feel
description: Fighting game combat feel, hitstop freeze-frames, frame data, hitboxes/hurtboxes, screen shake, pushbox separation, input buffering, and combo scaling.
metadata:
  origin: GameDev Skills
---

# Fighting Game Feel & Combat Architecture

Rules and formulas for professional combat responsiveness inspired by Street Fighter, Mortal Kombat, and Shadow Fight.

## 1. Frame Data Hierarchy
- **Startup Frames:** Vulnerable wind-up before hitbox becomes active.
- **Active Frames:** Exact frames where hitboxes can intersect opponent hurtboxes.
- **Recovery Frames:** Vulnerable cooldown before returning to neutral stance.
- **On-Hit Advantage:** Frame advantage after landing a strike (`Opponent Hitstun - Attacker Recovery`).
- **On-Block Advantage:** Frame advantage after strike is blocked (`Opponent Blockstun - Attacker Recovery`).

## 2. Hitstop (Freeze Frames)
When an attack connects, freeze both characters for a brief interval before playing hit reactions:
- Light Attack: 3-4 frames (50-65ms)
- Heavy Attack: 6-8 frames (100-130ms)
- Special / Ultimate: 10-15 frames (160-250ms) with camera zoom and screen flash.

## 3. Screen Shake & VFX
- Directional screen shake matching the angle of the blow.
- High-contrast particle sparks at the exact point of contact.
- Amber trailing life bar damage buffer to visualize chunk damage.

## 4. Combo Scaling
Prevent infinite one-touch-kills using exponential damage decay:
$$\text{Damage}_n = \text{BaseDamage} \times \max(0.20, (0.95)^{n-1})$$
