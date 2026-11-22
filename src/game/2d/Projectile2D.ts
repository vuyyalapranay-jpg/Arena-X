// src/game/2d/Projectile2D.ts
import { PlayerId } from '../../types';

export type ProjectileType =
  | 'BLUE_WAVE'
  | 'DARK_ORB'
  | 'CRIMSON_FIREBALL'
  | 'SHADOW_SHURIKEN';

export interface ProjectileTrailPoint {
  x: number;
  y: number;
  alpha: number;
  radius: number;
}

export class Projectile2D {
  public x: number;
  public y: number;
  public vx: number;
  public radius = 26;
  public damage = 24;
  public owner: PlayerId;
  public type: ProjectileType;
  public direction: 1 | -1;
  public lifetime = 2.2;
  public age = 0;
  public isDestroyed = false;
  private rotation = 0;
  public trail: ProjectileTrailPoint[] = [];

  constructor(
    x: number,
    y: number,
    direction: 1 | -1,
    owner: PlayerId,
    type: ProjectileType
  ) {
    this.x = x;
    this.y = y;
    this.direction = direction;
    this.owner = owner;
    this.type = type;

    // Fast dynamic projectile speeds
    if (type === 'BLUE_WAVE') {
      this.vx = direction * 720;
      this.damage = 24;
      this.radius = 28;
    } else if (type === 'DARK_ORB') {
      this.vx = direction * 540;
      this.damage = 26;
      this.radius = 30;
    } else {
      this.vx = direction * 600;
      this.damage = 22;
      this.radius = 24;
    }
  }

  public update(dt: number): void {
    this.age += dt;
    this.x += this.vx * dt;
    this.rotation += (this.vx > 0 ? 14 : -14) * dt;

    // Record trail positions
    this.trail.unshift({
      x: this.x,
      y: this.y,
      alpha: 0.8,
      radius: this.radius * 0.75,
    });
    if (this.trail.length > 8) {
      this.trail.pop();
    }
    for (const pt of this.trail) {
      pt.alpha -= dt * 3.5;
    }

    // Arena boundary cleanup
    if (this.x < 180 || this.x > 2220 || this.age >= this.lifetime) {
      this.isDestroyed = true;
    }
  }

  public render(ctx: CanvasRenderingContext2D): void {
    // 1. Draw Energy Trail
    ctx.save();
    for (const pt of this.trail) {
      if (pt.alpha <= 0) continue;
      ctx.save();
      ctx.globalAlpha = Math.max(0, pt.alpha * 0.5);
      const trailGrad = ctx.createRadialGradient(pt.x, pt.y, 0, pt.x, pt.y, pt.radius);
      if (this.type === 'BLUE_WAVE') {
        trailGrad.addColorStop(0, '#ffffff');
        trailGrad.addColorStop(0.4, '#00e5ff');
        trailGrad.addColorStop(1, 'transparent');
      } else if (this.type === 'DARK_ORB') {
        trailGrad.addColorStop(0, '#e0b0ff');
        trailGrad.addColorStop(0.5, '#7b1fa2');
        trailGrad.addColorStop(1, 'transparent');
      } else {
        trailGrad.addColorStop(0, '#ffffff');
        trailGrad.addColorStop(0.5, '#ff3366');
        trailGrad.addColorStop(1, 'transparent');
      }
      ctx.fillStyle = trailGrad;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, pt.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    ctx.restore();

    // 2. Main Projectile Body
    ctx.save();
    ctx.translate(this.x, this.y);

    if (this.type === 'BLUE_WAVE') {
      // Kai: High-speed Cyan Crescent Energy Wave
      ctx.scale(this.direction, 1);

      // Outer plasma aura
      const auraGrad = ctx.createRadialGradient(0, 0, 4, 0, 0, 42);
      auraGrad.addColorStop(0, '#ffffff');
      auraGrad.addColorStop(0.35, '#00e5ff');
      auraGrad.addColorStop(0.75, '#0052cc');
      auraGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = auraGrad;
      ctx.beginPath();
      ctx.arc(0, 0, 42, 0, Math.PI * 2);
      ctx.fill();

      // Sharp Anime Crescent Arc
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = '#00f0ff';
      ctx.shadowBlur = 18;
      ctx.beginPath();
      ctx.ellipse(10, 0, 18, 36, 0, -Math.PI / 2, Math.PI / 2, false);
      ctx.quadraticCurveTo(-12, 0, 10, -36);
      ctx.fill();

      // Inner electric core
      ctx.strokeStyle = '#e0ffff';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(12, -26);
      ctx.quadraticCurveTo(-4, 0, 12, 26);
      ctx.stroke();

    } else if (this.type === 'DARK_ORB') {
      // Shadow: Dark Violet Pulsing Void Sphere
      ctx.rotate(this.rotation);

      // Deep void event horizon
      const voidGrad = ctx.createRadialGradient(0, 0, 5, 0, 0, 40);
      voidGrad.addColorStop(0, '#0a0015');
      voidGrad.addColorStop(0.3, '#38006b');
      voidGrad.addColorStop(0.7, '#9c27b0');
      voidGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = voidGrad;
      ctx.beginPath();
      ctx.arc(0, 0, 40, 0, Math.PI * 2);
      ctx.fill();

      // Pulsing dark core
      ctx.fillStyle = '#05000a';
      ctx.beginPath();
      ctx.arc(0, 0, 16, 0, Math.PI * 2);
      ctx.fill();

      // Swirling orbital energy tentacles / rings
      ctx.strokeStyle = '#ba68c8';
      ctx.lineWidth = 3;
      ctx.shadowColor = '#e1bee7';
      ctx.shadowBlur = 12;
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.ellipse(0, 0, 24, 8, (i * Math.PI) / 3, 0, Math.PI * 2);
        ctx.stroke();
      }

    } else if (this.type === 'CRIMSON_FIREBALL') {
      // Legacy Crimson Fireball
      ctx.rotate(this.rotation);
      const radGlow = ctx.createRadialGradient(0, 0, 4, 0, 0, 38);
      radGlow.addColorStop(0, '#ffffff');
      radGlow.addColorStop(0.3, '#ff7a18');
      radGlow.addColorStop(0.7, '#ff1a4b');
      radGlow.addColorStop(1, 'transparent');
      ctx.fillStyle = radGlow;
      ctx.beginPath();
      ctx.arc(0, 0, 38, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      for (let i = 0; i < 8; i++) {
        const angle = (i * Math.PI) / 4;
        const r = i % 2 === 0 ? 20 : 10;
        const px = Math.cos(angle) * r;
        const py = Math.sin(angle) * r;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();

    } else {
      // Legacy Shadow Shuriken
      ctx.rotate(this.rotation);
      const radGlow = ctx.createRadialGradient(0, 0, 4, 0, 0, 38);
      radGlow.addColorStop(0, '#ffffff');
      radGlow.addColorStop(0.4, '#00d9ff');
      radGlow.addColorStop(0.8, '#0055ff');
      radGlow.addColorStop(1, 'transparent');
      ctx.fillStyle = radGlow;
      ctx.beginPath();
      ctx.arc(0, 0, 38, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      for (let i = 0; i < 8; i++) {
        const angle = (i * Math.PI) / 4;
        const r = i % 2 === 0 ? 24 : 7;
        const px = Math.cos(angle) * r;
        const py = Math.sin(angle) * r;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
    }

    ctx.restore();
  }
}
