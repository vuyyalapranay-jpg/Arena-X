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

interface ShockwaveRing {
  mesh: THREE.Mesh;
  life: number;
  maxLife: number;
  startScale: number;
  endScale: number;
}

export class ParticleSystem {
  public group: THREE.Group;
  private particles: SparkParticle[] = [];
  private shockwaves: ShockwaveRing[] = [];
  private pointGeometry: THREE.BufferGeometry;
  private pointMaterial: THREE.PointsMaterial;
  private pointsMesh: THREE.Points;
  private maxParticles = 350;
  private positions: Float32Array;
  private colors: Float32Array;

  // Reusable ring geometry & materials
  private ringGeometry: THREE.RingGeometry;

  constructor() {
    this.group = new THREE.Group();
    this.group.name = 'Combat_Particle_System';

    this.positions = new Float32Array(this.maxParticles * 3);
    this.colors = new Float32Array(this.maxParticles * 3);

    this.pointGeometry = new THREE.BufferGeometry();
    this.pointGeometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
    this.pointGeometry.setAttribute('color', new THREE.BufferAttribute(this.colors, 3));

    this.pointMaterial = new THREE.PointsMaterial({
      size: 0.16,
      vertexColors: true,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    this.pointsMesh = new THREE.Points(this.pointGeometry, this.pointMaterial);
    this.group.add(this.pointsMesh);

    // Shared ring geometry for impact shockwaves
    this.ringGeometry = new THREE.RingGeometry(0.12, 0.28, 24);
  }

  public emitHitSparks(x: number, y: number, z: number, colorHex: number, count = 24): void {
    const baseColor = new THREE.Color(colorHex);

    // 1. Expanding Impact Shockwave Ring (Street Fighter / Tekken style)
    const ringMat = new THREE.MeshBasicMaterial({
      color: baseColor,
      transparent: true,
      opacity: 0.95,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const ringMesh = new THREE.Mesh(this.ringGeometry, ringMat);
    ringMesh.position.set(x, y, z + 0.05);
    ringMesh.scale.set(0.6, 0.6, 0.6);
    this.group.add(ringMesh);

    this.shockwaves.push({
      mesh: ringMesh,
      life: 0,
      maxLife: 0.22,
      startScale: 0.5,
      endScale: 3.2,
    });

    // 2. High-speed kinetic burst particles
    for (let i = 0; i < count; i++) {
      if (this.particles.length >= this.maxParticles) break;

      const angle = Math.random() * Math.PI * 2;
      const speed = 3.5 + Math.random() * 5.5;
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed + 1.2;
      const vz = (Math.random() - 0.5) * 2.0;

      this.particles.push({
        position: new THREE.Vector3(x, y, z),
        velocity: new THREE.Vector3(vx, vy, vz),
        color: baseColor.clone().offsetHSL((Math.random() - 0.5) * 0.1, 0, (Math.random() - 0.5) * 0.2),
        life: 0,
        maxLife: 0.22 + Math.random() * 0.25,
        size: 0.14 + Math.random() * 0.10,
      });
    }
  }

  public emitBlockSparks(x: number, y: number, z: number): void {
    const shieldColor = new THREE.Color(0x00f0ff);

    // Deflection flash ring
    const ringMat = new THREE.MeshBasicMaterial({
      color: shieldColor,
      transparent: true,
      opacity: 0.9,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const ringMesh = new THREE.Mesh(this.ringGeometry, ringMat);
    ringMesh.position.set(x, y, z + 0.05);
    this.group.add(ringMesh);

    this.shockwaves.push({
      mesh: ringMesh,
      life: 0,
      maxLife: 0.18,
      startScale: 0.4,
      endScale: 2.4,
    });

    for (let i = 0; i < 26; i++) {
      if (this.particles.length >= this.maxParticles) break;

      const angle = (Math.random() - 0.5) * Math.PI;
      const speed = 4.0 + Math.random() * 3.5;

      this.particles.push({
        position: new THREE.Vector3(x, y, z),
        velocity: new THREE.Vector3(Math.cos(angle) * speed, Math.sin(angle) * speed, (Math.random() - 0.5) * 1.5),
        color: Math.random() > 0.4 ? shieldColor : new THREE.Color(0xffffff),
        life: 0,
        maxLife: 0.2 + Math.random() * 0.16,
        size: 0.12,
      });
    }
  }

  public update(deltaTime: number): void {
    // 1. Update Shockwave Rings
    for (let i = this.shockwaves.length - 1; i >= 0; i--) {
      const sw = this.shockwaves[i];
      sw.life += deltaTime;
      const progress = sw.life / sw.maxLife;

      if (progress >= 1.0) {
        this.group.remove(sw.mesh);
        (sw.mesh.material as THREE.Material).dispose();
        this.shockwaves.splice(i, 1);
        continue;
      }

      const currentScale = THREE.MathUtils.lerp(sw.startScale, sw.endScale, progress);
      sw.mesh.scale.set(currentScale, currentScale, currentScale);
      (sw.mesh.material as THREE.MeshBasicMaterial).opacity = Math.max(0, 1.0 - progress);
    }

    // 2. Update Spark Particles
    let activeCount = 0;

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life += deltaTime;

      if (p.life >= p.maxLife) {
        this.particles.splice(i, 1);
        continue;
      }

      // Physics update: gravity & drag
      p.velocity.y -= 14.0 * deltaTime;
      p.position.addScaledVector(p.velocity, deltaTime);

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
    this.ringGeometry.dispose();
    this.shockwaves.forEach((sw) => {
      this.group.remove(sw.mesh);
      (sw.mesh.material as THREE.Material).dispose();
    });
    this.shockwaves = [];
    this.particles = [];
  }
}
