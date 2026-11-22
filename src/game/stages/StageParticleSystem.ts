// src/game/stages/StageParticleSystem.ts
// HIGH-PERFORMANCE 2D PARTICLE SIMULATION FOR ATMOSPHERIC ARENA EFFECTS

import { StageParticleRule } from './StageConfig';

export interface StageParticle {
  x: number;
  y: number;
  z: number; // 0 = far, 1 = mid, 2 = foreground
  vx: number;
  vy: number;
  size: number;
  color: string;
  rotation: number;
  vRot: number;
  wobble: number;
  wobbleSpeed: number;
  alpha: number;
  life: number;
  maxLife: number;
  type: string;
}

export interface GroundRipple {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  alpha: number;
  color: string;
}

export interface GroundPuff {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  alpha: number;
  color: string;
}

export class StageParticleSystem {
  private particles: StageParticle[] = [];
  private ripples: GroundRipple[] = [];
  private groundPuffs: GroundPuff[] = [];
  private time = 0;
  private stageWidth = 2400;
  private floorY = 560;

  constructor(rules: StageParticleRule[], stageWidth = 2400, floorY = 560) {
    this.stageWidth = stageWidth;
    this.floorY = floorY;
    this.initFromRules(rules);
  }

  public setRules(rules: StageParticleRule[]): void {
    this.particles = [];
    this.ripples = [];
    this.groundPuffs = [];
    this.initFromRules(rules);
  }

  private initFromRules(rules: StageParticleRule[]): void {
    for (const rule of rules) {
      for (let i = 0; i < rule.count; i++) {
        const z = Math.random() < 0.25 ? 2 : Math.random() < 0.65 ? 1 : 0;
        const color = rule.colors[Math.floor(Math.random() * rule.colors.length)];
        const sizeMin = rule.sizeRange[0];
        const sizeMax = rule.sizeRange[1];
        const size = sizeMin + Math.random() * (sizeMax - sizeMin);

        // Vehicles travel horizontally in the distant upper sky
        const isVehicle = rule.type === 'VEHICLES';
        const startY = isVehicle 
          ? 60 + Math.random() * 260 
          : Math.random() * (this.floorY + 100) - 100;
        const startX = Math.random() * (this.stageWidth + 800) - 400;

        const dir = Math.random() < 0.5 ? 1 : -1;
        const vx = isVehicle ? dir * (rule.baseSpeedX * (0.8 + Math.random() * 0.4)) : rule.baseSpeedX * (0.7 + Math.random() * 0.6);
        const vy = rule.baseSpeedY * (0.8 + Math.random() * 0.4);

        this.particles.push({
          x: startX,
          y: startY,
          z,
          vx,
          vy,
          size: z === 2 ? size * 1.3 : z === 0 ? size * 0.7 : size,
          color,
          rotation: Math.random() * Math.PI * 2,
          vRot: (Math.random() - 0.5) * 3,
          wobble: Math.random() * Math.PI * 2,
          wobbleSpeed: 2 + Math.random() * 3,
          alpha: z === 0 ? 0.45 : z === 1 ? 0.75 : 0.95,
          life: Math.random() * 8,
          maxLife: 6 + Math.random() * 4,
          type: rule.type,
        });
      }
    }
  }

  public update(dt: number, windGustModifier = 1.0): void {
    this.time += dt;

    // Ambient sinusoidal wind cycle
    const globalWind = (Math.sin(this.time * 0.7) * 35 + 25) * windGustModifier;

    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      p.life += dt;

      if (p.type === 'RAIN') {
        p.x += (p.vx + globalWind * 0.5) * dt;
        p.y += p.vy * dt;

        // Ground splash when rain hits the floor
        if (p.y >= this.floorY - 5) {
          if (p.z >= 1 && this.ripples.length < 40 && Math.random() < 0.25) {
            this.ripples.push({
              x: p.x,
              y: this.floorY + (Math.random() * 24 - 12),
              radius: 1,
              maxRadius: p.z === 2 ? 14 : 9,
              alpha: 0.65,
              color: p.color,
            });
          }
          p.y = -60 - Math.random() * 120;
          p.x = Math.random() * (this.stageWidth + 600) - 300;
        }
      } else if (p.type === 'LEAVES') {
        p.wobble += p.wobbleSpeed * dt;
        p.x += (p.vx + globalWind * (0.8 + p.z * 0.4) + Math.cos(p.wobble) * 30) * dt;
        p.y += (p.vy + Math.sin(p.wobble) * 16) * dt;
        p.rotation += p.vRot * dt;

        if (p.x > this.stageWidth + 300) {
          p.x = -300;
          p.y = Math.random() * 400 - 100;
        }
        if (p.y > this.floorY + 80) {
          p.y = -80;
          p.x = Math.random() * this.stageWidth - 200;
        }
      } else if (p.type === 'EMBERS') {
        p.wobble += p.wobbleSpeed * dt;
        p.x += (p.vx + Math.sin(p.wobble) * 22) * dt;
        p.y += p.vy * dt;
        p.alpha = Math.max(0, 0.95 - (p.life / p.maxLife));

        if (p.life >= p.maxLife || p.y < -50) {
          p.y = this.floorY + Math.random() * 60 - 20;
          p.x = Math.random() * (this.stageWidth + 400) - 200;
          p.life = 0;
          p.alpha = 0.95;
        }
      } else if (p.type === 'SNOW') {
        p.wobble += p.wobbleSpeed * dt;
        p.x += (p.vx + globalWind * (0.7 + p.z * 0.5) + Math.sin(p.wobble) * 20) * dt;
        p.y += (p.vy + Math.cos(p.wobble) * 10) * dt;
        p.rotation += p.vRot * 0.4 * dt;

        if (p.x > this.stageWidth + 250) {
          p.x = -250;
          p.y = Math.random() * (this.floorY + 50) - 100;
        }
        if (p.y > this.floorY + 40) {
          p.y = -50;
          p.x = Math.random() * this.stageWidth - 100;
        }
      } else if (p.type === 'VEHICLES') {
        p.x += p.vx * dt;
        if (p.vx > 0 && p.x > this.stageWidth + 400) {
          p.x = -400;
          p.y = 60 + Math.random() * 260;
        } else if (p.vx < 0 && p.x < -400) {
          p.x = this.stageWidth + 400;
          p.y = 60 + Math.random() * 260;
        }
      } else if (p.type === 'SPORES') {
        p.wobble += p.wobbleSpeed * dt;
        p.x += (p.vx + Math.sin(p.wobble) * 15) * dt;
        p.y += (p.vy + Math.cos(p.wobble) * 12) * dt;
        p.alpha = 0.35 + Math.sin(this.time * 2 + p.wobble) * 0.3;

        if (p.y < 80) {
          p.y = this.floorY + 20;
          p.x = Math.random() * this.stageWidth;
        }
      }
    }

    // Update ground ripples (water puddles)
    for (let i = this.ripples.length - 1; i >= 0; i--) {
      const r = this.ripples[i];
      r.radius += dt * 24;
      r.alpha -= dt * 1.8;
      if (r.alpha <= 0 || r.radius >= r.maxRadius) {
        this.ripples.splice(i, 1);
      }
    }

    // Update ground puffs (landing dust)
    for (let i = this.groundPuffs.length - 1; i >= 0; i--) {
      const puff = this.groundPuffs[i];
      puff.x += puff.vx * dt;
      puff.y += puff.vy * dt;
      puff.radius += dt * 14;
      puff.alpha -= dt * 2.2;
      if (puff.alpha <= 0) {
        this.groundPuffs.splice(i, 1);
      }
    }
  }

  /**
   * Spawns ground contact dust/water splashes/embers on fighter landing or hard impact.
   */
  public spawnGroundImpact(x: number, y: number, color: string, count = 10): void {
    for (let i = 0; i < count; i++) {
      const dir = (Math.random() - 0.5) * 2;
      this.groundPuffs.push({
        x: x + dir * 18,
        y: y - 2 + Math.random() * 4,
        vx: dir * (70 + Math.random() * 110),
        vy: -20 - Math.random() * 45,
        radius: 4 + Math.random() * 6,
        alpha: 0.85,
        color,
      });
    }
  }

  /**
   * Renders background & midground atmospheric particles (z = 0 and z = 1).
   */
  public renderMidground(ctx: CanvasRenderingContext2D): void {
    // 1. Render Ground Ripples
    for (const r of this.ripples) {
      ctx.save();
      ctx.strokeStyle = r.color;
      ctx.globalAlpha = Math.max(0, r.alpha);
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      // Draw 2.5D perspective flattened ellipse
      ctx.ellipse(r.x, r.y, r.radius * 2.2, r.radius * 0.7, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // 2. Render Ground Puffs
    for (const puff of this.groundPuffs) {
      ctx.save();
      ctx.fillStyle = puff.color;
      ctx.globalAlpha = Math.max(0, puff.alpha * 0.7);
      ctx.beginPath();
      ctx.arc(puff.x, puff.y, puff.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // 3. Render Mid/Back Particles
    for (const p of this.particles) {
      if (p.z === 2) continue; // Foreground particles drawn in renderForeground
      this.renderParticle(ctx, p);
    }
  }

  /**
   * Renders foreground atmospheric particles (z = 2) in front of the fighters.
   */
  public renderForeground(ctx: CanvasRenderingContext2D): void {
    for (const p of this.particles) {
      if (p.z !== 2) continue;
      this.renderParticle(ctx, p);
    }
  }

  private renderParticle(ctx: CanvasRenderingContext2D, p: StageParticle): void {
    ctx.save();
    ctx.globalAlpha = Math.max(0, Math.min(1, p.alpha));

    if (p.type === 'RAIN') {
      ctx.strokeStyle = p.color;
      ctx.lineWidth = p.z === 2 ? 1.8 : 1.1;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x - p.vx * 0.035, p.y - p.size);
      ctx.stroke();
    } else if (p.type === 'LEAVES') {
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      // Stylized Japanese Maple/Sakura leaf polygon
      ctx.ellipse(0, 0, p.size, p.size * 0.5, 0, 0, Math.PI * 2);
      ctx.fill();
    } else if (p.type === 'EMBERS') {
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = p.size * 2.5;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    } else if (p.type === 'SNOW') {
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    } else if (p.type === 'VEHICLES') {
      ctx.translate(p.x, p.y);
      const isRight = p.vx > 0;
      // Headlight & taillight streak
      const headColor = '#00f0ff';
      const tailColor = '#ff1a4b';
      ctx.fillStyle = isRight ? headColor : tailColor;
      ctx.fillRect(isRight ? p.size * 0.5 : -p.size * 0.5, -2, 6, 4);

      ctx.fillStyle = isRight ? tailColor : headColor;
      ctx.fillRect(isRight ? -p.size * 0.5 : p.size * 0.5, -2, 6, 4);

      // Vehicle body silhouette
      ctx.fillStyle = '#0a0d18';
      ctx.fillRect(-p.size * 0.45, -3, p.size * 0.9, 6);
    } else if (p.type === 'SPORES') {
      const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 1.8);
      grad.addColorStop(0, p.color);
      grad.addColorStop(1, 'transparent');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * 1.8, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }
}
