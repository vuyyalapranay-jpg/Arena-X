// src/game/arena/ParticleSystem.ts
import * as THREE from 'three';

interface SparkParticle {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  color: THREE.Color;
  life: number;
  maxLife: number;
  size: number;
}

export class ParticleSystem {
  public group: THREE.Group;
  private particles: SparkParticle[] = [];
  private pointGeometry: THREE.BufferGeometry;
  private pointMaterial: THREE.PointsMaterial;
  private pointsMesh: THREE.Points;
  private maxParticles = 300;
  private positions: Float32Array;
  private colors: Float32Array;

  constructor() {
    this.group = new THREE.Group();
    this.group.name = 'Combat_Particle_System';

    this.positions = new Float32Array(this.maxParticles * 3);
    this.colors = new Float32Array(this.maxParticles * 3);

    this.pointGeometry = new THREE.BufferGeometry();
    this.pointGeometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
    this.pointGeometry.setAttribute('color', new THREE.BufferAttribute(this.colors, 3));

    this.pointMaterial = new THREE.PointsMaterial({
      size: 0.14,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    this.pointsMesh = new THREE.Points(this.pointGeometry, this.pointMaterial);
    this.group.add(this.pointsMesh);
  }

  public emitHitSparks(x: number, y: number, z: number, colorHex: number, count = 18): void {
    const baseColor = new THREE.Color(colorHex);

    for (let i = 0; i < count; i++) {
      if (this.particles.length >= this.maxParticles) break;

      const angle = Math.random() * Math.PI * 2;
      const speed = 2.5 + Math.random() * 4.5;
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed + 1.2;
      const vz = (Math.random() - 0.5) * 1.5;

      this.particles.push({
        position: new THREE.Vector3(x, y, z),
        velocity: new THREE.Vector3(vx, vy, vz),
        color: baseColor.clone().offsetHSL((Math.random() - 0.5) * 0.1, 0, (Math.random() - 0.5) * 0.2),
        life: 0,
        maxLife: 0.18 + Math.random() * 0.22,
        size: 0.12 + Math.random() * 0.08,
      });
    }
  }

  public emitBlockSparks(x: number, y: number, z: number): void {
    const shieldColor = new THREE.Color(0x00f0ff);
    for (let i = 0; i < 22; i++) {
      if (this.particles.length >= this.maxParticles) break;

      const angle = (Math.random() - 0.5) * Math.PI;
      const speed = 3.0 + Math.random() * 3.0;

      this.particles.push({
        position: new THREE.Vector3(x, y, z),
        velocity: new THREE.Vector3(Math.cos(angle) * speed, Math.sin(angle) * speed, (Math.random() - 0.5) * 1.5),
        color: Math.random() > 0.5 ? shieldColor : new THREE.Color(0xffffff),
        life: 0,
        maxLife: 0.2 + Math.random() * 0.15,
        size: 0.1,
      });
    }
  }

  public update(deltaTime: number): void {
    let activeCount = 0;

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life += deltaTime;

      if (p.life >= p.maxLife) {
        this.particles.splice(i, 1);
        continue;
      }

      // Physics update: gravity & drag
      p.velocity.y -= 15.0 * deltaTime;
      p.position.addScaledVector(p.velocity, deltaTime);

      // Fade factor
      const alpha = 1 - p.life / p.maxLife;

      this.positions[activeCount * 3] = p.position.x;
      this.positions[activeCount * 3 + 1] = p.position.y;
      this.positions[activeCount * 3 + 2] = p.position.z;

      this.colors[activeCount * 3] = p.color.r * alpha;
      this.colors[activeCount * 3 + 1] = p.color.g * alpha;
      this.colors[activeCount * 3 + 2] = p.color.b * alpha;

      activeCount++;
    }

    // Zero out unused
    for (let i = activeCount; i < this.maxParticles; i++) {
      this.positions[i * 3] = 0;
      this.positions[i * 3 + 1] = -100;
      this.positions[i * 3 + 2] = 0;
    }

    this.pointGeometry.attributes.position.needsUpdate = true;
    this.pointGeometry.attributes.color.needsUpdate = true;
  }

  public dispose(): void {
    this.pointGeometry.dispose();
    this.pointMaterial.dispose();
    this.particles = [];
  }
}
