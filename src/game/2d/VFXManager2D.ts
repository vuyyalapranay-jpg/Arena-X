// src/game/2d/VFXManager2D.ts

export interface HitSpark {
  x: number;
  y: number;
  color: string;
  radius: number;
  maxRadius: number;
  alpha: number;
  rotation: number;
  spikes: number;
  lifetime: number;
  age: number;
}

export interface FloatingText {
  x: number;
  y: number;
  text: string;
  color: string;
  size: number;
  alpha: number;
  vy: number;
  lifetime: number;
  age: number;
  isCombo?: boolean;
}

export interface DustParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  alpha: number;
  age: number;
  lifetime: number;
}

export interface SlashTrail {
  points: { x: number; y: number }[];
  color: string;
  width: number;
  alpha: number;
  lifetime: number;
  age: number;
}

export class VFXManager2D {
  public hitSparks: HitSpark[] = [];
  public floatingTexts: FloatingText[] = [];
  public dustParticles: DustParticle[] = [];
  public slashTrails: SlashTrail[] = [];

  // Screen flash for heavy hits or super moves
  public flashColor: string | null = null;
  public flashAlpha = 0;

  public update(dt: number): void {
    // 1. Update Hit Sparks
    for (let i = this.hitSparks.length - 1; i >= 0; i--) {
      const s = this.hitSparks[i];
      s.age += dt;
      const progress = s.age / s.lifetime;
      s.alpha = Math.max(0, 1 - progress);
      s.radius = s.maxRadius * (0.3 + 0.7 * progress);
      s.rotation += 4 * dt;
      if (s.age >= s.lifetime) {
        this.hitSparks.splice(i, 1);
      }
    }

    // 2. Update Floating Text (Combo, Counter, Hit)
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const t = this.floatingTexts[i];
      t.age += dt;
      t.y += t.vy * dt;
      t.vy *= 0.95;
      const progress = t.age / t.lifetime;
      t.alpha = progress < 0.6 ? 1 : Math.max(0, (1 - progress) / 0.4);
      if (t.age >= t.lifetime) {
        this.floatingTexts.splice(i, 1);
      }
    }

    // 3. Update Dust
    for (let i = this.dustParticles.length - 1; i >= 0; i--) {
      const d = this.dustParticles[i];
      d.age += dt;
      d.x += d.vx * dt;
      d.y += d.vy * dt;
      d.vx *= 0.92;
      d.vy *= 0.92;
      const progress = d.age / d.lifetime;
      d.alpha = Math.max(0, 1 - progress);
      d.radius += 8 * dt;
      if (d.age >= d.lifetime) {
        this.dustParticles.splice(i, 1);
      }
    }

    // 4. Update Slash Trails
    for (let i = this.slashTrails.length - 1; i >= 0; i--) {
      const st = this.slashTrails[i];
      st.age += dt;
      const progress = st.age / st.lifetime;
      st.alpha = Math.max(0, 1 - progress);
      if (st.age >= st.lifetime) {
        this.slashTrails.splice(i, 1);
      }
    }

    // 5. Fade Screen Flash
    if (this.flashAlpha > 0) {
      this.flashAlpha = Math.max(0, this.flashAlpha - dt * 4.5);
      if (this.flashAlpha <= 0) {
        this.flashColor = null;
      }
    }
  }

  public triggerScreenFlash(color = '#ffffff', intensity = 0.5): void {
    this.flashColor = color;
    this.flashAlpha = intensity;
  }

  public spawnHitSpark(x: number, y: number, color = '#ff3366', size = 48): void {
    this.hitSparks.push({
      x,
      y,
      color,
      radius: size * 0.3,
      maxRadius: size,
      alpha: 1,
      rotation: Math.random() * Math.PI,
      spikes: 8,
      lifetime: 0.22,
      age: 0,
    });

    // Also spawn a few small spark particles flying outwards
    for (let i = 0; i < 6; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 120 + Math.random() * 220;
      this.dustParticles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: 2 + Math.random() * 3,
        alpha: 1,
        lifetime: 0.25,
        age: 0,
      });
    }
  }

  public spawnBlockSpark(x: number, y: number, color = '#00f0ff'): void {
    this.hitSparks.push({
      x,
      y,
      color,
      radius: 20,
      maxRadius: 55,
      alpha: 1,
      rotation: Math.PI / 4,
      spikes: 6,
      lifetime: 0.18,
      age: 0,
    });
  }

  public spawnDust(x: number, y: number, count = 4, dir = 0): void {
    for (let i = 0; i < count; i++) {
      const vx = (dir * -120) + (Math.random() - 0.5) * 60;
      const vy = -15 - Math.random() * 35;
      this.dustParticles.push({
        x: x + (Math.random() - 0.5) * 20,
        y,
        vx,
        vy,
        radius: 4 + Math.random() * 6,
        alpha: 0.65,
        lifetime: 0.35 + Math.random() * 0.2,
        age: 0,
      });
    }
  }

  public spawnComboText(x: number, y: number, comboCount: number, isP1: boolean): void {
    this.floatingTexts.push({
      x,
      y: y - 40,
      text: `${comboCount} HITS!`,
      color: isP1 ? '#ff1a4b' : '#00b4ff',
      size: 26 + Math.min(18, comboCount * 3),
      alpha: 1,
      vy: -45,
      lifetime: 0.85,
      age: 0,
      isCombo: true,
    });
  }

  public render(ctx: CanvasRenderingContext2D): void {
    // 1. Render Dust
    ctx.save();
    for (const d of this.dustParticles) {
      ctx.fillStyle = `rgba(210, 220, 240, ${d.alpha * 0.6})`;
      ctx.beginPath();
      ctx.arc(d.x, d.y, d.radius, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // 2. Render Hit Sparks (Anime radial starburst)
    ctx.save();
    for (const s of this.hitSparks) {
      ctx.save();
      ctx.translate(s.x, s.y);
      ctx.rotate(s.rotation);
      ctx.globalAlpha = s.alpha;

      // Outer glow circle
      const radGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, s.radius * 1.4);
      radGrad.addColorStop(0, '#ffffff');
      radGrad.addColorStop(0.3, s.color);
      radGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = radGrad;
      ctx.beginPath();
      ctx.arc(0, 0, s.radius * 1.4, 0, Math.PI * 2);
      ctx.fill();

      // Sharp Anime Star Burst
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      const numPoints = s.spikes;
      for (let i = 0; i < numPoints * 2; i++) {
        const radius = i % 2 === 0 ? s.radius : s.radius * 0.28;
        const angle = (i * Math.PI) / numPoints;
        const px = Math.cos(angle) * radius;
        const py = Math.sin(angle) * radius;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();

      ctx.restore();
    }
    ctx.restore();

    // 3. Render Floating Combo Text
    ctx.save();
    for (const t of this.floatingTexts) {
      ctx.save();
      ctx.font = `900 ${t.size}px 'Orbitron', 'Rajdhani', sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.globalAlpha = t.alpha;

      // Dark drop shadow / border
      ctx.lineWidth = 5;
      ctx.strokeStyle = '#050810';
      ctx.strokeText(t.text, t.x, t.y);

      // Core text fill
      ctx.fillStyle = t.color;
      ctx.fillText(t.text, t.x, t.y);

      // Inner highlight
      ctx.fillStyle = '#ffffff';
      ctx.fillText(t.text, t.x, t.y - 1);
      ctx.restore();
    }
    ctx.restore();

    // 4. Screen Flash
    if (this.flashColor && this.flashAlpha > 0) {
      ctx.save();
      ctx.fillStyle = this.flashColor;
      ctx.globalAlpha = this.flashAlpha;
      ctx.fillRect(-2000, -2000, 4000, 4000);
      ctx.restore();
    }
  }
}
