// src/game/arena/Arena3D.ts
import * as THREE from 'three';
import { GAME_CONFIG } from '../../config/gameConfig';

export class Arena3D {
  public group: THREE.Group;
  private geometries: THREE.BufferGeometry[] = [];
  private materials: THREE.Material[] = [];
  private textures: THREE.Texture[] = [];
  private animTimer = 0;

  // Dynamic elements
  private holoRing: THREE.Mesh | null = null;
  private leftBarrier: THREE.Mesh | null = null;
  private rightBarrier: THREE.Mesh | null = null;
  private dustParticles: THREE.Points | null = null;
  private p1Light: THREE.PointLight | null = null;
  private p2Light: THREE.PointLight | null = null;

  constructor() {
    this.group = new THREE.Group();
    this.group.name = 'Arena_3D_Environment';

    this.createFloor();
    this.createBoundaries();
    this.createBackgroundArchitecture();
    this.createAtmosphericLighting();
    this.createDustParticles();
  }

  private createFloor(): void {
    // Generate Procedural High-Tech Grid & Line Texture
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    // Base carbon floor
    ctx.fillStyle = '#0a0d14';
    ctx.fillRect(0, 0, 1024, 512);

    // Subtle carbon weave grid pattern
    ctx.strokeStyle = '#151b27';
    ctx.lineWidth = 2;
    for (let x = 0; x <= 1024; x += 32) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 512);
      ctx.stroke();
    }
    for (let y = 0; y <= 512; y += 32) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(1024, y);
      ctx.stroke();
    }

    // Outer border markings
    ctx.strokeStyle = '#232d42';
    ctx.lineWidth = 6;
    ctx.strokeRect(16, 16, 992, 480);

    // Center Fighting Circle & Emblem
    ctx.strokeStyle = '#4a5b7d';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(512, 256, 110, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = '#ffaa00';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(512, 256, 40, 0, Math.PI * 2);
    ctx.stroke();

    // Red team floor accents (Left)
    ctx.strokeStyle = '#ff1a4b';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(120, 80);
    ctx.lineTo(420, 80);
    ctx.moveTo(120, 432);
    ctx.lineTo(420, 432);
    ctx.stroke();

    // Cyan team floor accents (Right)
    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(604, 80);
    ctx.lineTo(904, 80);
    ctx.moveTo(604, 432);
    ctx.lineTo(904, 432);
    ctx.stroke();

    const floorTexture = new THREE.CanvasTexture(canvas);
    floorTexture.wrapS = THREE.ClampToEdgeWrapping;
    floorTexture.wrapT = THREE.ClampToEdgeWrapping;
    this.textures.push(floorTexture);

    // Combat Stage Platform
    const floorGeo = new THREE.BoxGeometry(26, 0.8, 10);
    this.geometries.push(floorGeo);

    const floorMat = new THREE.MeshStandardMaterial({
      map: floorTexture,
      roughness: 0.35,
      metalness: 0.8,
    });
    this.materials.push(floorMat);

    const floorMesh = new THREE.Mesh(floorGeo, floorMat);
    floorMesh.position.set(0, -0.4, 0);
    floorMesh.receiveShadow = true;
    this.group.add(floorMesh);

    // Stage Edge Neon Bevel Trim
    const trimGeo = new THREE.BoxGeometry(26.2, 0.08, 10.2);
    this.geometries.push(trimGeo);
    const trimMat = new THREE.MeshBasicMaterial({ color: 0x24324f });
    this.materials.push(trimMat);
    const trimMesh = new THREE.Mesh(trimGeo, trimMat);
    trimMesh.position.set(0, 0.01, 0);
    this.group.add(trimMesh);

    // Lower Sub-Foundation Structure
    const subGeo = new THREE.BoxGeometry(34, 4, 18);
    this.geometries.push(subGeo);
    const subMat = new THREE.MeshStandardMaterial({
      color: 0x05070a,
      metalness: 0.9,
      roughness: 0.6,
    });
    this.materials.push(subMat);
    const subMesh = new THREE.Mesh(subGeo, subMat);
    subMesh.position.set(0, -2.8, 0);
    subMesh.receiveShadow = true;
    this.group.add(subMesh);
  }

  private createBoundaries(): void {
    const pillarGeo = new THREE.CylinderGeometry(0.35, 0.45, 6, 8);
    this.geometries.push(pillarGeo);

    const pillarMat = new THREE.MeshStandardMaterial({
      color: 0x181e2b,
      metalness: 0.85,
      roughness: 0.25,
    });
    this.materials.push(pillarMat);

    // Left Energy Post (P1 Boundary)
    const leftPillar = new THREE.Mesh(pillarGeo, pillarMat);
    leftPillar.position.set(GAME_CONFIG.ARENA.WALL_LIMIT_LEFT - 0.4, 3, 0);
    leftPillar.castShadow = true;
    this.group.add(leftPillar);

    // Left Energy Barrier Field
    const barrierGeo = new THREE.PlaneGeometry(0.2, 5.5);
    this.geometries.push(barrierGeo);

    const leftBarrierMat = new THREE.MeshBasicMaterial({
      color: 0xff1a4b,
      transparent: true,
      opacity: 0.35,
      side: THREE.DoubleSide,
    });
    this.materials.push(leftBarrierMat);

    this.leftBarrier = new THREE.Mesh(barrierGeo, leftBarrierMat);
    this.leftBarrier.position.set(GAME_CONFIG.ARENA.WALL_LIMIT_LEFT, 2.75, 0);
    this.leftBarrier.rotation.y = Math.PI / 2;
    this.group.add(this.leftBarrier);

    // Right Energy Post (P2 Boundary)
    const rightPillar = new THREE.Mesh(pillarGeo, pillarMat);
    rightPillar.position.set(GAME_CONFIG.ARENA.WALL_LIMIT_RIGHT + 0.4, 3, 0);
    rightPillar.castShadow = true;
    this.group.add(rightPillar);

    // Right Energy Barrier Field
    const rightBarrierMat = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      transparent: true,
      opacity: 0.35,
      side: THREE.DoubleSide,
    });
    this.materials.push(rightBarrierMat);

    this.rightBarrier = new THREE.Mesh(barrierGeo, rightBarrierMat);
    this.rightBarrier.position.set(GAME_CONFIG.ARENA.WALL_LIMIT_RIGHT, 2.75, 0);
    this.rightBarrier.rotation.y = Math.PI / 2;
    this.group.add(this.rightBarrier);
  }

  private createBackgroundArchitecture(): void {
    const bgGroup = new THREE.Group();
    bgGroup.position.set(0, 0, -12); // Deep in background

    // Distant Cyber Skyline & Stadium Towers
    const towerMat = new THREE.MeshStandardMaterial({
      color: 0x070a12,
      roughness: 0.7,
      metalness: 0.8,
    });
    this.materials.push(towerMat);

    const windowMat = new THREE.MeshBasicMaterial({
      color: 0x1a2638,
    });
    this.materials.push(windowMat);

    // Generate background monoliths
    const towerConfigs = [
      { x: -18, h: 22, w: 4, d: 4 },
      { x: -12, h: 18, w: 3.5, d: 3.5 },
      { x: -6, h: 26, w: 5, d: 5 },
      { x: 0, h: 16, w: 4.5, d: 4 },
      { x: 6, h: 24, w: 5, d: 5 },
      { x: 12, h: 19, w: 3.8, d: 3.5 },
      { x: 18, h: 23, w: 4, d: 4 },
    ];

    towerConfigs.forEach((cfg) => {
      const geo = new THREE.BoxGeometry(cfg.w, cfg.h, cfg.d);
      this.geometries.push(geo);
      const mesh = new THREE.Mesh(geo, towerMat);
      mesh.position.set(cfg.x, cfg.h / 2 - 2, -6);
      bgGroup.add(mesh);

      // Neon antenna top
      const antGeo = new THREE.CylinderGeometry(0.05, 0.05, 4);
      this.geometries.push(antGeo);
      const antMat = new THREE.MeshBasicMaterial({ color: 0xff3366 });
      this.materials.push(antMat);
      const antMesh = new THREE.Mesh(antGeo, antMat);
      antMesh.position.set(cfg.x, cfg.h - 1, -6);
      bgGroup.add(antMesh);
    });

    // Giant Holographic Arena Ring in the sky
    const ringGeo = new THREE.TorusGeometry(8.5, 0.15, 8, 48);
    this.geometries.push(ringGeo);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x3388ff,
      transparent: true,
      opacity: 0.45,
      wireframe: true,
    });
    this.materials.push(ringMat);
    this.holoRing = new THREE.Mesh(ringGeo, ringMat);
    this.holoRing.position.set(0, 10, -8);
    this.holoRing.rotation.x = Math.PI / 3.5;
    bgGroup.add(this.holoRing);

    // Massive Cyber Arena Truss Arches
    const archMat = new THREE.MeshStandardMaterial({
      color: 0x121722,
      metalness: 0.9,
      roughness: 0.3,
    });
    this.materials.push(archMat);

    const archGeo = new THREE.TorusGeometry(16, 0.4, 8, 32, Math.PI);
    this.geometries.push(archGeo);
    const archMesh = new THREE.Mesh(archGeo, archMat);
    archMesh.position.set(0, 0, -4);
    bgGroup.add(archMesh);

    this.group.add(bgGroup);
  }

  private createAtmosphericLighting(): void {
    // 1. Ambient lighting for base visibility
    const ambientLight = new THREE.AmbientLight(0x0c1322, 1.4);
    this.group.add(ambientLight);

    // 2. Main Key Directional Light with Shadows
    const keyLight = new THREE.DirectionalLight(0xffffff, 2.2);
    keyLight.position.set(3, 12, 8);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    keyLight.shadow.camera.near = 0.5;
    keyLight.shadow.camera.far = 30;
    keyLight.shadow.camera.left = -14;
    keyLight.shadow.camera.right = 14;
    keyLight.shadow.camera.top = 8;
    keyLight.shadow.camera.bottom = -2;
    keyLight.shadow.bias = -0.001;
    this.group.add(keyLight);

    // 3. Red Rim / Fill Light (P1 Side)
    const redLight = new THREE.PointLight(0xff1a4b, 3.5, 18, 1.2);
    redLight.position.set(-8, 3.5, 3);
    this.group.add(redLight);

    // 4. Cyan Rim / Fill Light (P2 Side)
    const cyanLight = new THREE.PointLight(0x00f0ff, 3.5, 18, 1.2);
    cyanLight.position.set(8, 3.5, 3);
    this.group.add(cyanLight);

    // 5. Dynamic Fighter Follower Lights
    this.p1Light = new THREE.PointLight(0xff3355, 1.5, 6);
    this.p1Light.position.set(-3.5, 1.8, 1.2);
    this.group.add(this.p1Light);

    this.p2Light = new THREE.PointLight(0x00d9ff, 1.5, 6);
    this.p2Light.position.set(3.5, 1.8, 1.2);
    this.group.add(this.p2Light);
  }

  private createDustParticles(): void {
    const particleCount = 180;
    const positions = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 26;
      positions[i * 3 + 1] = Math.random() * 7;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 8;
    }

    const partGeo = new THREE.BufferGeometry();
    partGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.geometries.push(partGeo);

    const partMat = new THREE.PointsMaterial({
      color: 0x88bbff,
      size: 0.06,
      transparent: true,
      opacity: 0.45,
    });
    this.materials.push(partMat);

    this.dustParticles = new THREE.Points(partGeo, partMat);
    this.group.add(this.dustParticles);
  }

  public update(deltaTime: number, p1X: number, p2X: number): void {
    this.animTimer += deltaTime;

    // Rotate Holographic Ring
    if (this.holoRing) {
      this.holoRing.rotation.z += deltaTime * 0.15;
    }

    // Pulse Boundary Energy Fields
    if (this.leftBarrier && this.rightBarrier) {
      const pulse = 0.3 + Math.sin(this.animTimer * 4) * 0.15;
      (this.leftBarrier.material as THREE.MeshBasicMaterial).opacity = pulse;
      (this.rightBarrier.material as THREE.MeshBasicMaterial).opacity = pulse;
    }

    // Sync rim follower lights with fighters
    if (this.p1Light) {
      this.p1Light.position.x = p1X;
    }
    if (this.p2Light) {
      this.p2Light.position.x = p2X;
    }

    // Drift dust particles
    if (this.dustParticles) {
      const posAttr = this.dustParticles.geometry.attributes.position as THREE.BufferAttribute;
      const arr = posAttr.array as Float32Array;
      for (let i = 0; i < arr.length / 3; i++) {
        arr[i * 3 + 1] += Math.sin(this.animTimer + i) * 0.003;
      }
      posAttr.needsUpdate = true;
    }
  }

  public dispose(): void {
    this.geometries.forEach((g) => g.dispose());
    this.materials.forEach((m) => m.dispose());
    this.textures.forEach((t) => t.dispose());
    this.geometries = [];
    this.materials = [];
    this.textures = [];
  }
}
