// src/game/2d/ParallaxArena2D.ts

export interface SakuraPetal {
  x: number;
  y: number;
  z: number; // 0 = far, 1 = mid, 2 = foreground
  vx: number;
  vy: number;
  rotation: number;
  vRot: number;
  size: number;
  color: string;
  wobble: number;
  wobbleSpeed: number;
}

export class ParallaxArena2D {
  private petals: SakuraPetal[] = [];
  private time = 0;
  public stageWidth = 2400;
  public floorY = 560; // Arena ground Y coordinate in world space

  private bgImage: HTMLImageElement | null = null;
  private isBgLoaded = false;

  constructor() {
    this.initPetals(95);

    // Preload high-resolution anime shrine background
    this.bgImage = new Image();
    this.bgImage.src = '/assets/backgrounds/shrine_night.jpg';
    this.bgImage.onload = () => {
      this.isBgLoaded = true;
    };
  }

  private initPetals(count: number): void {
    const colors = ['#ffb7c5', '#ff94b8', '#ffccd7', '#f8a5c2', '#ea868f'];
    for (let i = 0; i < count; i++) {
      const z = Math.random() < 0.25 ? 2 : Math.random() < 0.6 ? 1 : 0;
      this.petals.push({
        x: Math.random() * this.stageWidth * 1.5 - 600,
        y: Math.random() * 800 - 100,
        z,
        vx: 40 + Math.random() * 60,
        vy: 35 + Math.random() * 45,
        rotation: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 2.5,
        size: z === 2 ? 14 + Math.random() * 8 : z === 1 ? 8 + Math.random() * 5 : 5 + Math.random() * 3,
        color: colors[Math.floor(Math.random() * colors.length)],
        wobble: Math.random() * Math.PI * 2,
        wobbleSpeed: 2 + Math.random() * 3,
      });
    }
  }

  public update(dt: number): void {
    this.time += dt;

    // Wind gust formula
    const wind = Math.sin(this.time * 0.8) * 25 + 50;

    for (const p of this.petals) {
      p.wobble += p.wobbleSpeed * dt;
      p.x += (p.vx + wind * (0.8 + p.z * 0.4) + Math.cos(p.wobble) * 20) * dt;
      p.y += (p.vy + Math.sin(p.wobble) * 12) * dt;
      p.rotation += p.vRot * dt;

      // Wrap around bounds
      if (p.x > this.stageWidth + 400) {
        p.x = -400;
        p.y = Math.random() * 400 - 150;
      }
      if (p.y > this.floorY + 120) {
        p.y = -100;
        p.x = Math.random() * this.stageWidth - 200;
      }
    }
  }

  /**
   * Draws the full-screen edge-to-edge backdrop in screen coordinates.
   * Clears canvas with rich midnight sky gradient to guarantee 0% black gaps.
   */
  public renderScreenBackdrop(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    _camX?: number
  ): void {
    const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
    skyGrad.addColorStop(0, '#040714');
    skyGrad.addColorStop(0.35, '#071026');
    skyGrad.addColorStop(0.7, '#111832');
    skyGrad.addColorStop(1, '#181224');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, width, height);
  }

  public renderBackground(
    ctx: CanvasRenderingContext2D,
    camX: number,
    camY: number,
    _camZoom: number,
    viewportW: number,
    viewportH: number
  ): void {
    // ==============================================================
    // 1. HIGH-RESOLUTION ILLUSTRATED 2D ARENA BACKGROUND
    // ==============================================================
    if (this.isBgLoaded && this.bgImage) {
      // Subtle parallax offset synchronized to camera world coordinates
      const bgParallaxX = (camX - 1200) * 0.15;
      const bgParallaxY = (camY - 525) * 0.06;

      ctx.save();
      // Draw high-resolution illustrated Japanese Temple stage covering full bounds
      // Align floor flagstones strictly to world floorY = 560
      const imgW = 3200;
      const imgH = 3200 * (768 / 1376); // ~1786.6px
      const floorInImg = imgH * 0.84635; // ~1512px
      const bgX = 1200 - imgW / 2; // -400
      const bgY = this.floorY - floorInImg; // 560 - 1512 = -952

      // Sky background extension above
      ctx.fillStyle = '#040714';
      ctx.fillRect(-1500, -2200, 5400, 1300);

      // Floor extension below
      const floorGrad = ctx.createLinearGradient(0, bgY + imgH - 10, 0, bgY + imgH + 500);
      floorGrad.addColorStop(0, '#0c1322');
      floorGrad.addColorStop(0.5, '#070a14');
      floorGrad.addColorStop(1, '#020307');
      ctx.fillStyle = floorGrad;
      ctx.fillRect(-1500, bgY + imgH - 10, 5400, 600);

      // Draw the main illustrated stage
      ctx.drawImage(
        this.bgImage,
        bgX - bgParallaxX,
        bgY - bgParallaxY,
        imgW,
        imgH
      );
      ctx.restore();

      // Glowing Center Arena X Floor Emblem
      this.drawFloorEmblem(ctx);

      // Mid-layer falling sakura petals
      this.renderPetalsLayer(ctx, 1);
      return;
    }

    // ==============================================================
    // 2. FALLBACK PROCEDURAL SCENERY (PRE-LOAD ONLY)
    // ==============================================================
    const skyOffX = camX * 0.04;
    const skyOffY = camY * 0.04;

    const skyGrad = ctx.createLinearGradient(0, -600, 0, 700);
    skyGrad.addColorStop(0, '#040714');
    skyGrad.addColorStop(0.35, '#071026');
    skyGrad.addColorStop(0.7, '#131b38');
    skyGrad.addColorStop(1, '#1b1226');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(-1500, -800, 4500, 1800);

    const moonX = 850 - skyOffX;
    const moonY = 80 - skyOffY;
    const moonRadius = 68;
    const moonDisc = ctx.createRadialGradient(moonX - 15, moonY - 15, 10, moonX, moonY, moonRadius);
    moonDisc.addColorStop(0, '#ffffff');
    moonDisc.addColorStop(0.65, '#eef6ff');
    moonDisc.addColorStop(1, '#a6c8fa');
    ctx.fillStyle = moonDisc;
    ctx.beginPath();
    ctx.arc(moonX, moonY, moonRadius, 0, Math.PI * 2);
    ctx.fill();

    this.drawCourtyardFloor(ctx, viewportW, viewportH);
    this.renderPetalsLayer(ctx, 1);
  }

  public renderForeground(ctx: CanvasRenderingContext2D, camX: number, camY: number): void {
    // Layer 5: Foreground blurred sakura petals & hanging eaves
    const foreOffX = camX * 1.35;
    const foreOffY = camY * 1.35;

    ctx.save();
    ctx.translate(-foreOffX * 0.2, -foreOffY * 0.2);

    // Foreground falling sakura petals with depth-of-field
    this.renderPetalsLayer(ctx, 2);

    // Left and right foreground temple eave overhangs
    this.drawForegroundEaves(ctx);
    ctx.restore();
  }

  private drawPagodaSilhouette(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number): void {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    ctx.fillStyle = '#070c1e';

    // 5-tiered pagoda spire and roofs
    ctx.fillRect(48, -40, 4, 50); // Spire

    for (let tier = 0; tier < 5; tier++) {
      const ty = tier * 32;
      const width = 85 + tier * 18;
      ctx.beginPath();
      ctx.moveTo(50 - width / 2, ty + 12);
      ctx.quadraticCurveTo(50, ty - 6, 50 + width / 2, ty + 12);
      ctx.lineTo(50 + width / 2 - 8, ty + 20);
      ctx.lineTo(50 - width / 2 + 8, ty + 20);
      ctx.closePath();
      ctx.fill();

      // Tier body
      ctx.fillRect(40 - tier * 4, ty + 20, 20 + tier * 8, 14);

      // Glowing warm window
      ctx.fillStyle = 'rgba(255, 180, 60, 0.6)';
      ctx.fillRect(46, ty + 23, 8, 8);
      ctx.fillStyle = '#070c1e';
    }

    ctx.restore();
  }

  private drawSacredSakuraTree(ctx: CanvasRenderingContext2D, x: number, y: number): void {
    ctx.save();
    ctx.translate(x, y);

    // Gnarled dark wood trunk & branches
    ctx.fillStyle = '#0b0c16';
    ctx.beginPath();
    ctx.moveTo(90, 400);
    ctx.quadraticCurveTo(60, 250, 110, 160);
    ctx.quadraticCurveTo(140, 100, 200, 50);
    ctx.lineTo(180, 50);
    ctx.quadraticCurveTo(120, 110, 90, 180);
    ctx.quadraticCurveTo(40, 260, 40, 400);
    ctx.closePath();
    ctx.fill();

    // Sprawling luminous blossom clusters (Vibrant violet & pink blooms)
    const clusters = [
      { cx: 80, cy: 90, r: 110, col: 'rgba(235, 120, 180, 0.45)' },
      { cx: 180, cy: 60, r: 130, col: 'rgba(215, 95, 170, 0.55)' },
      { cx: 280, cy: 110, r: 105, col: 'rgba(255, 145, 195, 0.50)' },
      { cx: 140, cy: 150, r: 95, col: 'rgba(190, 75, 160, 0.40)' },
      { cx: -10, cy: 140, r: 85, col: 'rgba(240, 130, 185, 0.45)' },
    ];

    for (const c of clusters) {
      const grad = ctx.createRadialGradient(c.cx, c.cy, 10, c.cx, c.cy, c.r);
      grad.addColorStop(0, '#ffd8ea');
      grad.addColorStop(0.4, c.col);
      grad.addColorStop(1, 'transparent');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(c.cx, c.cy, c.r, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  private drawJapaneseTempleShrine(ctx: CanvasRenderingContext2D, x: number, y: number): void {
    ctx.save();
    ctx.translate(x, y);

    // Traditional grand temple foundation
    ctx.fillStyle = '#0c101d';
    ctx.fillRect(-280, 140, 560, 220);

    // Warm glowing shoji screen interior
    const screenGlow = ctx.createLinearGradient(0, 150, 0, 320);
    screenGlow.addColorStop(0, 'rgba(255, 175, 75, 0.85)');
    screenGlow.addColorStop(0.8, 'rgba(255, 115, 30, 0.75)');
    screenGlow.addColorStop(1, 'rgba(180, 40, 15, 0.5)');
    ctx.fillStyle = screenGlow;
    ctx.fillRect(-220, 165, 440, 150);

    // Shoji screen lattice bars
    ctx.strokeStyle = '#1b120c';
    ctx.lineWidth = 3;
    for (let lx = -200; lx <= 200; lx += 40) {
      ctx.beginPath();
      ctx.moveTo(lx, 165);
      ctx.lineTo(lx, 315);
      ctx.stroke();
    }
    for (let ly = 195; ly <= 300; ly += 30) {
      ctx.beginPath();
      ctx.moveTo(-220, ly);
      ctx.lineTo(220, ly);
      ctx.stroke();
    }

    // Wooden red lacquer columns
    ctx.fillStyle = '#7a1420';
    [-235, -115, 0, 115, 235].forEach((cx) => {
      ctx.fillRect(cx - 10, 140, 20, 185);
      ctx.fillStyle = '#b82836';
      ctx.fillRect(cx - 8, 140, 6, 185);
      ctx.fillStyle = '#7a1420';
    });

    // Massive central "ARENA X" wall banner with Kanji
    ctx.fillStyle = 'rgba(12, 16, 26, 0.95)';
    ctx.fillRect(-85, 150, 170, 160);
    ctx.strokeStyle = '#ff1a4b';
    ctx.lineWidth = 2.5;
    ctx.strokeRect(-85, 150, 170, 160);

    ctx.font = "900 24px 'Orbitron', sans-serif";
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.fillText('ARENA', 0, 195);
    ctx.font = "900 44px 'Orbitron', sans-serif";
    ctx.fillStyle = '#ff1a4b';
    ctx.shadowColor = '#ff1a4b';
    ctx.shadowBlur = 18;
    ctx.fillText('X', 0, 250);
    ctx.shadowBlur = 0;

    // Calligraphy "戦" (WAR) banners flanking shrine
    this.drawCalligraphyBanner(ctx, -170, 155, '戦');
    this.drawCalligraphyBanner(ctx, 170, 155, '闘');

    // Upper Sweeping Curved Temple Roof (Irimoya style)
    this.drawCurvedRoof(ctx, 0, 140, 640, 48);
    this.drawCurvedRoof(ctx, 0, 80, 520, 45);

    ctx.restore();
  }

  private drawCurvedRoof(ctx: CanvasRenderingContext2D, cx: number, cy: number, width: number, height: number): void {
    ctx.save();
    ctx.translate(cx, cy);

    ctx.fillStyle = '#101524';
    ctx.beginPath();
    ctx.moveTo(-width / 2 - 20, 0);
    ctx.quadraticCurveTo(0, -height, width / 2 + 20, 0);
    ctx.lineTo(width / 2 + 8, 16);
    ctx.quadraticCurveTo(0, -height + 14, -width / 2 - 8, 16);
    ctx.closePath();
    ctx.fill();

    // Golden ridge cap & eaves trim
    ctx.fillStyle = '#d49b38';
    ctx.fillRect(-width / 2 + 10, -4, width - 20, 4);

    ctx.restore();
  }

  private drawCalligraphyBanner(ctx: CanvasRenderingContext2D, x: number, y: number, kanji: string): void {
    ctx.save();
    ctx.translate(x, y);

    // Banner cloth
    ctx.fillStyle = '#a81328';
    ctx.fillRect(-22, 0, 44, 130);
    ctx.strokeStyle = '#e6b840';
    ctx.lineWidth = 2;
    ctx.strokeRect(-22, 0, 44, 130);

    // Gold Kanji
    ctx.font = "900 28px 'Noto Serif JP', serif";
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.fillText(kanji, 0, 65);

    ctx.restore();
  }

  private drawHangingLanternRow(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number): void {
    ctx.save();
    // Swag wire
    ctx.strokeStyle = '#1a1f30';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.quadraticCurveTo((x1 + x2) / 2, y1 + 35, x2, y2);
    ctx.stroke();

    // 6 Red paper lanterns hanging across
    for (let i = 0; i <= 6; i++) {
      const t = i / 6;
      const lx = x1 + (x2 - x1) * t;
      const ly = y1 + (y2 - y1) * t + Math.sin(t * Math.PI) * 35;
      this.drawRedPaperLantern(ctx, lx, ly);
    }
    ctx.restore();
  }

  private drawRedPaperLantern(ctx: CanvasRenderingContext2D, x: number, y: number): void {
    ctx.save();
    ctx.translate(x, y);

    // Warm radial light aura
    const radGlow = ctx.createRadialGradient(0, 16, 2, 0, 16, 42);
    radGlow.addColorStop(0, 'rgba(255, 140, 40, 0.7)');
    radGlow.addColorStop(0.4, 'rgba(255, 60, 40, 0.3)');
    radGlow.addColorStop(1, 'transparent');
    ctx.fillStyle = radGlow;
    ctx.beginPath();
    ctx.arc(0, 16, 42, 0, Math.PI * 2);
    ctx.fill();

    // Hanging string
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, 6);
    ctx.stroke();

    // Lantern body
    ctx.fillStyle = '#ff283b';
    ctx.beginPath();
    ctx.ellipse(0, 18, 12, 16, 0, 0, Math.PI * 2);
    ctx.fill();

    // Black caps
    ctx.fillStyle = '#111';
    ctx.fillRect(-8, 3, 16, 3);
    ctx.fillRect(-8, 31, 16, 3);

    // Tassel
    ctx.strokeStyle = '#ffcc00';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, 34);
    ctx.lineTo(0, 45);
    ctx.stroke();

    ctx.restore();
  }

  private drawFloorEmblem(ctx: CanvasRenderingContext2D): void {
    const floorY = this.floorY;
    const centerX = this.stageWidth / 2;
    const centerY = floorY + 85;
    const radiusX = 360;
    const radiusY = 95;

    ctx.save();
    // Outer glowing circular border
    ctx.strokeStyle = 'rgba(120, 160, 220, 0.45)';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(70, 100, 150, 0.25)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.ellipse(centerX, centerY, radiusX + 22, radiusY + 6, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Red vs Blue Crossed Arena X lines on floor
    // Crimson line (P1)
    ctx.strokeStyle = 'rgba(255, 26, 75, 0.75)';
    ctx.lineWidth = 5;
    ctx.shadowColor = '#ff1a4b';
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.moveTo(centerX - 240, centerY - 45);
    ctx.lineTo(centerX + 240, centerY + 45);
    ctx.stroke();

    // Cobalt Blue line (P2)
    ctx.strokeStyle = 'rgba(0, 208, 255, 0.75)';
    ctx.shadowColor = '#00d0ff';
    ctx.beginPath();
    ctx.moveTo(centerX - 240, centerY + 45);
    ctx.lineTo(centerX + 240, centerY - 45);
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Floor Center "ARENA X" typography
    ctx.font = "900 30px 'Orbitron', sans-serif";
    ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.textAlign = 'center';
    ctx.fillText('ARENA X', centerX, centerY - 44);

    ctx.restore();
  }

  private drawCourtyardFloor(ctx: CanvasRenderingContext2D, viewportW: number, viewportH: number): void {
    const floorY = this.floorY;

    // Dark wet stone flagstone pavement with seamless floor margins
    const floorGrad = ctx.createLinearGradient(0, floorY, 0, floorY + 450);
    floorGrad.addColorStop(0, 'rgba(16, 21, 36, 0.78)');
    floorGrad.addColorStop(0.35, 'rgba(10, 13, 23, 0.88)');
    floorGrad.addColorStop(1, 'rgba(5, 7, 12, 0.95)');
    ctx.fillStyle = floorGrad;
    ctx.fillRect(-2500, floorY, this.stageWidth + 5000, 1500);

    // Stone flagstone grid lines with wet reflection sheen
    ctx.strokeStyle = 'rgba(40, 56, 85, 0.45)';
    ctx.lineWidth = 1.5;
    for (let x = -1500; x <= this.stageWidth + 1500; x += 110) {
      ctx.beginPath();
      ctx.moveTo(x, floorY);
      ctx.lineTo(x - 220, floorY + 450);
      ctx.stroke();
    }
    for (let y = floorY + 30; y <= floorY + 450; y += 45) {
      ctx.beginPath();
      ctx.moveTo(-2500, y);
      ctx.lineTo(this.stageWidth + 2500, y);
      ctx.stroke();
    }

    // ==============================================================
    // CENTER "ARENA X" CIRCULAR BATTLE EMBLEM ON FLOOR
    // ==============================================================
    const centerX = this.stageWidth / 2;
    const centerY = floorY + 95;
    const radiusX = 360;
    const radiusY = 95;

    ctx.save();
    // Outer glowing circular border
    ctx.strokeStyle = 'rgba(120, 160, 220, 0.55)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(70, 100, 150, 0.35)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(centerX, centerY, radiusX + 22, radiusY + 6, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Red vs Blue Crossed Arena X lines on floor
    // Crimson line (P1)
    ctx.strokeStyle = '#ff1a4b';
    ctx.lineWidth = 6;
    ctx.shadowColor = '#ff1a4b';
    ctx.shadowBlur = 14;
    ctx.beginPath();
    ctx.moveTo(centerX - 240, centerY - 45);
    ctx.lineTo(centerX + 240, centerY + 45);
    ctx.stroke();

    // Cobalt Blue line (P2)
    ctx.strokeStyle = '#00d0ff';
    ctx.shadowColor = '#00d0ff';
    ctx.beginPath();
    ctx.moveTo(centerX - 240, centerY + 45);
    ctx.lineTo(centerX + 240, centerY - 45);
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Floor Center "ARENA X" typography
    ctx.font = "900 32px 'Orbitron', sans-serif";
    ctx.fillStyle = 'rgba(255, 255, 255, 0.32)';
    ctx.textAlign = 'center';
    ctx.fillText('ARENA X', centerX, centerY - 48);

    ctx.restore();
  }

  private drawToriiGate(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number): void {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);

    // Deep vermilion red Torii pillars
    ctx.fillStyle = '#a61726';
    ctx.fillRect(0, 0, 28, 280);
    ctx.fillRect(180, 0, 28, 280);

    // Black column bases
    ctx.fillStyle = '#0f1118';
    ctx.fillRect(-4, 250, 36, 30);
    ctx.fillRect(176, 250, 36, 30);

    // Upper crossbeam (Kasagi) with upturned curved ends
    ctx.fillStyle = '#0f1118';
    ctx.beginPath();
    ctx.moveTo(-45, -20);
    ctx.quadraticCurveTo(104, -38, 253, -20);
    ctx.lineTo(240, -4);
    ctx.quadraticCurveTo(104, -18, -32, -4);
    ctx.closePath();
    ctx.fill();

    // Red secondary crossbeam (Nuki)
    ctx.fillStyle = '#a61726';
    ctx.fillRect(-15, 30, 238, 22);

    ctx.restore();
  }

  private drawFireBrazier(ctx: CanvasRenderingContext2D, x: number, y: number): void {
    ctx.save();
    ctx.translate(x, y);

    // Stone pedestal
    ctx.fillStyle = '#0e121e';
    ctx.fillRect(-18, 0, 36, 95);
    ctx.fillRect(-28, 85, 56, 12);

    // Iron bowl
    ctx.fillStyle = '#1c2235';
    ctx.beginPath();
    ctx.moveTo(-32, 0);
    ctx.lineTo(32, 0);
    ctx.lineTo(20, 25);
    ctx.lineTo(-20, 25);
    ctx.closePath();
    ctx.fill();

    // Warm radial fire glow
    const fireFlicker = Math.sin(this.time * 8 + x) * 6;
    const fireRadius = 55 + fireFlicker;
    const fireGlow = ctx.createRadialGradient(0, -15, 5, 0, -15, fireRadius);
    fireGlow.addColorStop(0, 'rgba(255, 210, 80, 0.85)');
    fireGlow.addColorStop(0.35, 'rgba(255, 90, 20, 0.45)');
    fireGlow.addColorStop(1, 'transparent');
    ctx.fillStyle = fireGlow;
    ctx.beginPath();
    ctx.arc(0, -15, fireRadius, 0, Math.PI * 2);
    ctx.fill();

    // Animated Fire Flame
    ctx.fillStyle = '#ff7a18';
    ctx.beginPath();
    ctx.moveTo(-18, 0);
    ctx.quadraticCurveTo(-22, -25, 0, -45 + fireFlicker * 0.5);
    ctx.quadraticCurveTo(22, -25, 18, 0);
    ctx.closePath();
    ctx.fill();

    // Inner yellow flame core
    ctx.fillStyle = '#ffe042';
    ctx.beginPath();
    ctx.moveTo(-10, 0);
    ctx.quadraticCurveTo(-12, -16, 0, -32 + fireFlicker * 0.4);
    ctx.quadraticCurveTo(12, -16, 10, 0);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }

  private renderPetalsLayer(ctx: CanvasRenderingContext2D, targetZ: number): void {
    ctx.save();
    for (const p of this.petals) {
      if (p.z !== targetZ) continue;

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);

      if (targetZ === 2) {
        // Foreground blurred petal
        ctx.globalAlpha = 0.55;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.ellipse(0, 0, p.size * 1.5, p.size * 0.7, 0, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Crisp falling petal
        ctx.globalAlpha = 0.85;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.moveTo(0, -p.size);
        ctx.quadraticCurveTo(p.size * 0.8, -p.size * 0.3, p.size * 0.6, p.size * 0.6);
        ctx.quadraticCurveTo(0, p.size, -p.size * 0.6, p.size * 0.6);
        ctx.quadraticCurveTo(-p.size * 0.8, -p.size * 0.3, 0, -p.size);
        ctx.fill();
      }
      ctx.restore();
    }
    ctx.restore();
  }

  private drawForegroundEaves(ctx: CanvasRenderingContext2D): void {
    // Left eave framing top corner
    ctx.fillStyle = 'rgba(7, 9, 15, 0.9)';
    ctx.beginPath();
    ctx.moveTo(-200, -100);
    ctx.lineTo(240, -100);
    ctx.lineTo(120, 60);
    ctx.lineTo(-200, 140);
    ctx.closePath();
    ctx.fill();

    // Right eave framing top corner
    ctx.beginPath();
    ctx.moveTo(this.stageWidth + 200, -100);
    ctx.lineTo(this.stageWidth - 240, -100);
    ctx.lineTo(this.stageWidth - 120, 60);
    ctx.lineTo(this.stageWidth + 200, 140);
    ctx.closePath();
    ctx.fill();
  }
}
