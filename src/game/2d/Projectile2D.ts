// src/game/2d/Projectile2D.ts
import { PlayerId } from '../../types';

export class Projectile2D {
  public x: number;
  public y: number;
  public vx: number;
  public radius = 22;
  public damage = 18;
  public owner: PlayerId;
  public type: 'CRIMSON_FIREBALL' | 'SHADOW_SHURIKEN';
  public lifetime = 2.2;
  public age = 0;
  public isDestroyed = false;
  private rotation = 0;

  constructor(
    x: number,
    y: number,
    direction: 1 | -1,
    owner: PlayerId,
    type: 'CRIMSON_FIREBALL' | 'SHADOW_SHURIKEN'
  ) {
    this.x = x;
    this.y = y;
    this.vx = direction * 580; // Speed across the arena
    this.owner = owner;
    this.type = type;
  }

  public update(dt: number): void {
    this.age += dt;
    this.x += this.vx * dt;
    this.rotation += (this.vx > 0 ? 12 : -12) * dt;

    if (this.age >= this.lifetime) {
      this.isDestroyed = true;
    }
  }

  public render(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotation);

    if (this.type === 'CRIMSON_FIREBALL') {
      // Kai: Crimson Hadouken / Fireball
      const radGlow = ctx.createRadialGradient(0, 0, 4, 0, 0, 38);
      radGlow.addColorStop(0, '#ffffff');
      radGlow.addColorStop(0.3, '#ff7a18');
      radGlow.addColorStop(0.7, '#ff1a4b');
      radGlow.addColorStop(1, 'transparent');
      ctx.fillStyle = radGlow;
      ctx.beginPath();
      ctx.arc(0, 0, 38, 0, Math.PI * 2);
      ctx.fill();

      // Flame energy spikes
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
      // Zen: Shadow Crescent Shuriken
      const radGlow = ctx.createRadialGradient(0, 0, 4, 0, 0, 38);
      radGlow.addColorStop(0, '#ffffff');
      radGlow.addColorStop(0.4, '#00d9ff');
      radGlow.addColorStop(0.8, '#0055ff');
      radGlow.addColorStop(1, 'transparent');
      ctx.fillStyle = radGlow;
      ctx.beginPath();
      ctx.arc(0, 0, 38, 0, Math.PI * 2);
      ctx.fill();

      // Spinning 4-pointed ninja star
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
