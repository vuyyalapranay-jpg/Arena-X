// src/game/arena/Arena3D.ts
import * as THREE from 'three';
import { GAME_CONFIG } from '../../config/gameConfig';

export class Arena3D {
  public group: THREE.Group;
  private geometries: THREE.BufferGeometry[] = [];
  private materials: THREE.Material[] = [];
  private textures: THREE.Texture[] = [];
  private animTimer = 0;

  // Animated environmental elements
  private fireFlames: THREE.Mesh[] = [];
  private fireLights: THREE.PointLight[] = [];
  private sakuraPetals: THREE.Points | null = null;
  private groundMist: THREE.Points | null = null;
  private p1RimLight: THREE.PointLight | null = null;
  private p2RimLight: THREE.PointLight | null = null;

  constructor() {
    this.group = new THREE.Group();
    this.group.name = 'Arena_3D_Japanese_Temple';

    this.createStoneCourtyardFloor();
    this.createTempleArchitecture();
    this.createGuardianStatues();
    this.createFireBraziers();
    this.createSakuraTrees();
    this.createMoonAndAtmosphere();
    this.createAtmosphericLighting();
  }

  /**
   * 1. STONE COURTYARD FIGHTING FLOOR
   * High-res procedural wet flagstone tiles with engraved "ARENA X" circular crest
   */
  private createStoneCourtyardFloor(): void {
    const canvas = document.createElement('canvas');
    canvas.width = 2048;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d')!;

    // Base dark wet stone flagstone
    ctx.fillStyle = '#0a0d14';
    ctx.fillRect(0, 0, 2048, 1024);

    // Stone tile grid lines
    ctx.strokeStyle = '#151c28';
    ctx.lineWidth = 3;
    for (let x = 0; x <= 2048; x += 48) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 1024);
      ctx.stroke();
    }
    for (let y = 0; y <= 1024; y += 48) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(2048, y);
      ctx.stroke();
    }

    // Outer circular combat ring
    const cx = 1024;
    const cy = 512;

    ctx.strokeStyle = '#2b3952';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.arc(cx, cy, 320, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = '#3d5275';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(cx, cy, 340, 0, Math.PI * 2);
    ctx.stroke();

    // Central Engraved ARENA X Cross & Emblem in Stone
    ctx.strokeStyle = '#ff3355';
    ctx.lineWidth = 14;
    ctx.beginPath();
    // Diagonal slash 1
    ctx.moveTo(cx - 140, cy - 140);
    ctx.lineTo(cx + 140, cy + 140);
    ctx.stroke();

    ctx.strokeStyle = '#00aaff';
    ctx.beginPath();
    // Diagonal slash 2
    ctx.moveTo(cx + 140, cy - 140);
    ctx.lineTo(cx - 140, cy + 140);
    ctx.stroke();

    // Center Core Glow
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(cx, cy, 22, 0, Math.PI * 2);
    ctx.fill();

    // Engraved Arena X Stone Typography
    ctx.font = '900 64px Orbitron, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.22)';
    ctx.fillText('ARENA  X', cx, cy - 200);
    ctx.fillText('ARENA  X', cx, cy + 240);

    const floorTexture = new THREE.CanvasTexture(canvas);
    floorTexture.wrapS = THREE.ClampToEdgeWrapping;
    floorTexture.wrapT = THREE.ClampToEdgeWrapping;
    this.textures.push(floorTexture);

    // Stone Platform Mesh (width 28m, depth 12m)
    const floorGeo = new THREE.BoxGeometry(28, 0.8, 12);
    this.geometries.push(floorGeo);

    const floorMat = new THREE.MeshStandardMaterial({
      map: floorTexture,
      roughness: 0.32, // Wet flagstone sheen
      metalness: 0.45,
    });
    this.materials.push(floorMat);

    const floorMesh = new THREE.Mesh(floorGeo, floorMat);
    floorMesh.position.set(0, -0.4, 0);
    floorMesh.receiveShadow = true;
    this.group.add(floorMesh);

    // Heavy Stone Steps around platform edge
    const stepGeo = new THREE.BoxGeometry(32, 2.5, 16);
    this.geometries.push(stepGeo);
    const stepMat = new THREE.MeshStandardMaterial({
      color: 0x07090f,
      roughness: 0.7,
      metalness: 0.3,
    });
    this.materials.push(stepMat);
    const stepMesh = new THREE.Mesh(stepGeo, stepMat);
    stepMesh.position.set(0, -1.8, 0);
    stepMesh.receiveShadow = true;
    this.group.add(stepMesh);
  }

  /**
   * 2. JAPANESE TEMPLE ARCHITECTURE
   * Multi-tiered Pagoda structures, curved eaves, central shrine gate, and banners
   */
  private createTempleArchitecture(): void {
    const templeGroup = new THREE.Group();
    templeGroup.position.set(0, 0, -6.5); // Placed right behind fighting plane

    const woodDarkMat = new THREE.MeshStandardMaterial({
      color: 0x180f0c, // Dark treated Japanese cedar wood
      roughness: 0.65,
      metalness: 0.15,
    });
    this.materials.push(woodDarkMat);

    const redTrimMat = new THREE.MeshStandardMaterial({
      color: 0x85141c, // Vermilion temple lacquer
      roughness: 0.5,
      metalness: 0.2,
    });
    this.materials.push(redTrimMat);

    const roofTileMat = new THREE.MeshStandardMaterial({
      color: 0x121722, // Dark slate ceramic roof tiles
      roughness: 0.45,
      metalness: 0.5,
    });
    this.materials.push(roofTileMat);

    const shojiGlowMat = new THREE.MeshBasicMaterial({
      color: 0xffaa33, // Warm amber glowing paper windows
    });
    this.materials.push(shojiGlowMat);

    // --- CENTRAL SHRINE GATEWAY & WALL BANNER ---
    // Central Shrine Back Wall
    const wallGeo = new THREE.BoxGeometry(10, 8, 1);
    this.geometries.push(wallGeo);
    const wallMesh = new THREE.Mesh(wallGeo, woodDarkMat);
    wallMesh.position.set(0, 4, -1);
    templeGroup.add(wallMesh);

    // Massive Central ARENA X Wall Banner (Matching reference image!)
    const bannerCanvas = document.createElement('canvas');
    bannerCanvas.width = 1024;
    bannerCanvas.height = 1024;
    const bctx = bannerCanvas.getContext('2d')!;

    // Crimson-purple silk fabric texture
    bctx.fillStyle = '#1e0814';
    bctx.fillRect(0, 0, 1024, 1024);

    bctx.strokeStyle = '#5a1228';
    bctx.lineWidth = 16;
    bctx.strokeRect(20, 20, 984, 984);

    // Brush-stroke "ARENA" in white
    bctx.font = '900 110px Orbitron, sans-serif';
    bctx.textAlign = 'center';
    bctx.fillStyle = '#f0f4fc';
    bctx.shadowColor = '#ff1a4b';
    bctx.shadowBlur = 24;
    bctx.fillText('ARENA', 512, 380);

    // Dynamic Brush-stroke Glowing Red "X"
    bctx.strokeStyle = '#ff1144';
    bctx.lineWidth = 38;
    bctx.lineCap = 'round';
    bctx.beginPath();
    bctx.moveTo(340, 470);
    bctx.lineTo(684, 840);
    bctx.stroke();

    bctx.beginPath();
    bctx.moveTo(684, 470);
    bctx.lineTo(340, 840);
    bctx.stroke();

    // Center fiery core
    bctx.strokeStyle = '#ffffff';
    bctx.lineWidth = 14;
    bctx.beginPath();
    bctx.moveTo(460, 600);
    bctx.lineTo(564, 710);
    bctx.moveTo(564, 600);
    bctx.lineTo(460, 710);
    bctx.stroke();

    const bannerTexture = new THREE.CanvasTexture(bannerCanvas);
    this.textures.push(bannerTexture);

    const bannerGeo = new THREE.PlaneGeometry(5.8, 6.8);
    this.geometries.push(bannerGeo);
    const bannerMat = new THREE.MeshStandardMaterial({
      map: bannerTexture,
      roughness: 0.5,
    });
    this.materials.push(bannerMat);

    const bannerMesh = new THREE.Mesh(bannerGeo, bannerMat);
    bannerMesh.position.set(0, 4.2, -0.45);
    templeGroup.add(bannerMesh);

    // Central Curved Temple Eaves Roof
    const roofCenterGeo = new THREE.BoxGeometry(12, 0.6, 3.5);
    this.geometries.push(roofCenterGeo);
    const roofCenter = new THREE.Mesh(roofCenterGeo, roofTileMat);
    roofCenter.position.set(0, 8.2, 0);
    roofCenter.rotation.x = 0.15;
    templeGroup.add(roofCenter);

    // --- LEFT PAGODA TEMPLE (3 TIERS) ---
    const buildPagoda = (xPos: number, isLeft: boolean) => {
      const pagodaGroup = new THREE.Group();
      pagodaGroup.position.set(xPos, 0, -0.5);

      // Base Structure with glowing Shoji Screens
      const baseGeo = new THREE.BoxGeometry(7, 5, 5);
      this.geometries.push(baseGeo);
      const baseMesh = new THREE.Mesh(baseGeo, woodDarkMat);
      baseMesh.position.set(0, 2.5, 0);
      pagodaGroup.add(baseMesh);

      // Glowing Shoji Windows
      const shojiGeo = new THREE.PlaneGeometry(4, 2.2);
      this.geometries.push(shojiGeo);
      const shojiMesh = new THREE.Mesh(shojiGeo, shojiGlowMat);
      shojiMesh.position.set(0, 2.8, 2.55);
      pagodaGroup.add(shojiMesh);

      // Tier 1 Curved Roof
      const roof1Geo = new THREE.BoxGeometry(9.5, 0.5, 7);
      this.geometries.push(roof1Geo);
      const roof1 = new THREE.Mesh(roof1Geo, roofTileMat);
      roof1.position.set(0, 5.2, 0);
      pagodaGroup.add(roof1);

      // Tier 2 Structure
      const tier2Geo = new THREE.BoxGeometry(5.5, 4, 4);
      this.geometries.push(tier2Geo);
      const tier2 = new THREE.Mesh(tier2Geo, woodDarkMat);
      tier2.position.set(0, 7.2, 0);
      pagodaGroup.add(tier2);

      const shoji2 = new THREE.Mesh(new THREE.PlaneGeometry(3, 1.8), shojiGlowMat);
      shoji2.position.set(0, 7.2, 2.05);
      pagodaGroup.add(shoji2);

      // Tier 2 Roof
      const roof2Geo = new THREE.BoxGeometry(7.5, 0.5, 5.5);
      this.geometries.push(roof2Geo);
      const roof2 = new THREE.Mesh(roof2Geo, roofTileMat);
      roof2.position.set(0, 9.4, 0);
      pagodaGroup.add(roof2);

      // Tier 3 Spire Top
      const spireGeo = new THREE.ConeGeometry(0.35, 3.5, 8);
      this.geometries.push(spireGeo);
      const spire = new THREE.Mesh(spireGeo, redTrimMat);
      spire.position.set(0, 11.2, 0);
      pagodaGroup.add(spire);

      // Vertical Calligraphy War Banner ("戦") Hanging from Eaves
      const warBannerCanvas = document.createElement('canvas');
      warBannerCanvas.width = 256;
      warBannerCanvas.height = 768;
      const wctx = warBannerCanvas.getContext('2d')!;
      wctx.fillStyle = '#8a0f1e';
      wctx.fillRect(0, 0, 256, 768);
      wctx.strokeStyle = '#ffd700';
      wctx.lineWidth = 10;
      wctx.strokeRect(10, 10, 236, 748);
      // Traditional Calligraphy Character "戦" (War / Combat)
      wctx.font = '900 130px sans-serif';
      wctx.textAlign = 'center';
      wctx.fillStyle = '#ffffff';
      wctx.fillText('戦', 128, 220);
      wctx.font = '700 32px Orbitron, sans-serif';
      wctx.fillStyle = '#ffd700';
      wctx.fillText('ARENA', 128, 420);
      wctx.fillText('X', 128, 480);

      const warBannerTex = new THREE.CanvasTexture(warBannerCanvas);
      this.textures.push(warBannerTex);

      const warBannerMesh = new THREE.Mesh(
        new THREE.PlaneGeometry(1.6, 4.8),
        new THREE.MeshStandardMaterial({ map: warBannerTex, side: THREE.DoubleSide })
      );
      warBannerMesh.position.set(isLeft ? 4.2 : -4.2, 4.5, 2.6);
      pagodaGroup.add(warBannerMesh);

      return pagodaGroup;
    };

    templeGroup.add(buildPagoda(-9.5, true));
    templeGroup.add(buildPagoda(9.5, false));

    this.group.add(templeGroup);
  }

  /**
   * 3. GIANT GUARDIAN SAMURAI / NIŌ STATUES
   * Massive stone statues flanking the stage on left and right stone pedestals
   */
  private createGuardianStatues(): void {
    const statueGroup = new THREE.Group();
    statueGroup.position.set(0, 0, -4.5);

    const stoneStatueMat = new THREE.MeshStandardMaterial({
      color: 0x222a38, // Ancient weathered dark stone
      roughness: 0.75,
      metalness: 0.25,
    });
    this.materials.push(stoneStatueMat);

    const buildStatue = (xPos: number, isLeft: boolean) => {
      const g = new THREE.Group();
      g.position.set(xPos, 0, 0);

      // Heavy Pedestal
      const pedGeo = new THREE.BoxGeometry(2.4, 2.2, 2.4);
      this.geometries.push(pedGeo);
      const ped = new THREE.Mesh(pedGeo, stoneStatueMat);
      ped.position.set(0, 1.1, 0);
      ped.receiveShadow = true;
      ped.castShadow = true;
      g.add(ped);

      // Armored Torso / Cuirass
      const torsoGeo = new THREE.BoxGeometry(1.8, 2.4, 1.4);
      this.geometries.push(torsoGeo);
      const torso = new THREE.Mesh(torsoGeo, stoneStatueMat);
      torso.position.set(0, 3.4, 0);
      torso.castShadow = true;
      g.add(torso);

      // Kabuto Helmet / Fierce Guardian Head
      const headGeo = new THREE.BoxGeometry(1.2, 1.4, 1.3);
      this.geometries.push(headGeo);
      const head = new THREE.Mesh(headGeo, stoneStatueMat);
      head.position.set(0, 5.1, 0);
      g.add(head);

      // Crest Horns on Helmet
      const hornGeo = new THREE.ConeGeometry(0.2, 1.2, 4);
      this.geometries.push(hornGeo);
      const hornL = new THREE.Mesh(hornGeo, stoneStatueMat);
      hornL.position.set(0.5, 6.0, 0);
      hornL.rotation.z = -0.4;
      g.add(hornL);

      const hornR = new THREE.Mesh(hornGeo, stoneStatueMat);
      hornR.position.set(-0.5, 6.0, 0);
      hornR.rotation.z = 0.4;
      g.add(hornR);

      // Bulky Samurai Shoulder Pauldrons (Sode)
      const sodeGeo = new THREE.BoxGeometry(0.8, 1.6, 1.2);
      this.geometries.push(sodeGeo);
      const sodeL = new THREE.Mesh(sodeGeo, stoneStatueMat);
      sodeL.position.set(1.4, 3.6, 0);
      sodeL.rotation.z = -0.25;
      g.add(sodeL);

      const sodeR = new THREE.Mesh(sodeGeo, stoneStatueMat);
      sodeR.position.set(-1.4, 3.6, 0);
      sodeR.rotation.z = 0.25;
      g.add(sodeR);

      // Katana / Halberd held upright
      const bladeGeo = new THREE.CylinderGeometry(0.08, 0.08, 5.5, 6);
      this.geometries.push(bladeGeo);
      const blade = new THREE.Mesh(bladeGeo, stoneStatueMat);
      blade.position.set(isLeft ? -1.2 : 1.2, 4.2, 0.4);
      g.add(blade);

      return g;
    };

    statueGroup.add(buildStatue(-8.5, true));
    statueGroup.add(buildStatue(8.5, false));

    this.group.add(statueGroup);
  }

  /**
   * 4. FIRE BRAZIERS & TORO LANTERNS (ACTIVE FLAMES)
   * Cast warm dancing firelight onto fighters and flagstone floor
   */
  private createFireBraziers(): void {
    const fireGroup = new THREE.Group();
    fireGroup.position.set(0, 0, 0);

    const ironMat = new THREE.MeshStandardMaterial({
      color: 0x14161d,
      metalness: 0.9,
      roughness: 0.2,
    });
    this.materials.push(ironMat);

    const flameMat = new THREE.MeshBasicMaterial({
      color: 0xff6600,
      transparent: true,
      opacity: 0.85,
    });
    this.materials.push(flameMat);

    const brazierPositions = [
      { x: -5.8, z: 2.2 },
      { x: 5.8, z: 2.2 },
      { x: -7.5, z: -2.8 },
      { x: 7.5, z: -2.8 },
      { x: -2.8, z: -4.0 },
      { x: 2.8, z: -4.0 },
    ];

    brazierPositions.forEach((pos) => {
      // Stone Pedestal
      const pedGeo = new THREE.CylinderGeometry(0.35, 0.45, 1.2, 8);
      this.geometries.push(pedGeo);
      const ped = new THREE.Mesh(pedGeo, ironMat);
      ped.position.set(pos.x, 0.6, pos.z);
      fireGroup.add(ped);

      // Cast-iron Fire Bowl
      const bowlGeo = new THREE.CylinderGeometry(0.7, 0.35, 0.5, 12);
      this.geometries.push(bowlGeo);
      const bowl = new THREE.Mesh(bowlGeo, ironMat);
      bowl.position.set(pos.x, 1.45, pos.z);
      fireGroup.add(bowl);

      // Animated Flame Cone
      const flameGeo = new THREE.ConeGeometry(0.45, 1.2, 8);
      this.geometries.push(flameGeo);
      const flameMesh = new THREE.Mesh(flameGeo, flameMat);
      flameMesh.position.set(pos.x, 2.05, pos.z);
      fireGroup.add(flameMesh);
      this.fireFlames.push(flameMesh);

      // Warm Point Light
      const fireLight = new THREE.PointLight(0xff7722, 2.8, 9, 1.4);
      fireLight.position.set(pos.x, 2.1, pos.z);
      fireGroup.add(fireLight);
      this.fireLights.push(fireLight);
    });

    this.group.add(fireGroup);
  }

  /**
   * 5. CHERRY BLOSSOM (SAKURA) TREES WITH FALLING PETALS
   */
  private createSakuraTrees(): void {
    const sakuraGroup = new THREE.Group();

    const barkMat = new THREE.MeshStandardMaterial({
      color: 0x22130e,
      roughness: 0.85,
    });
    this.materials.push(barkMat);

    const blossomMat = new THREE.MeshStandardMaterial({
      color: 0xff99bb,
      emissive: 0x661133,
      emissiveIntensity: 0.3,
      roughness: 0.6,
    });
    this.materials.push(blossomMat);

    const buildTree = (xPos: number, zPos: number) => {
      const g = new THREE.Group();
      g.position.set(xPos, 0, zPos);

      // Trunk
      const trunkGeo = new THREE.CylinderGeometry(0.4, 0.7, 7, 8);
      this.geometries.push(trunkGeo);
      const trunk = new THREE.Mesh(trunkGeo, barkMat);
      trunk.position.set(0, 3.5, 0);
      g.add(trunk);

      // Blossom Foliage Clouds
      const cloudGeo1 = new THREE.SphereGeometry(2.4, 8, 8);
      this.geometries.push(cloudGeo1);
      const cloud1 = new THREE.Mesh(cloudGeo1, blossomMat);
      cloud1.position.set(0, 6.8, 0);
      g.add(cloud1);

      const cloudGeo2 = new THREE.SphereGeometry(1.8, 8, 8);
      this.geometries.push(cloudGeo2);
      const cloud2 = new THREE.Mesh(cloudGeo2, blossomMat);
      cloud2.position.set(1.4, 6.0, 0.8);
      g.add(cloud2);

      const cloud3 = new THREE.Mesh(cloudGeo2, blossomMat);
      cloud3.position.set(-1.4, 5.8, -0.6);
      g.add(cloud3);

      return g;
    };

    sakuraGroup.add(buildTree(-12.5, -3));
    sakuraGroup.add(buildTree(12.5, -3));
    this.group.add(sakuraGroup);

    // Falling Sakura Petals Particle Cloud
    const petalCount = 280;
    const positions = new Float32Array(petalCount * 3);
    for (let i = 0; i < petalCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 28;
      positions[i * 3 + 1] = Math.random() * 8 + 0.2;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 10;
    }

    const petalGeo = new THREE.BufferGeometry();
    petalGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.geometries.push(petalGeo);

    const petalMat = new THREE.PointsMaterial({
      color: 0xffaacc,
      size: 0.08,
      transparent: true,
      opacity: 0.65,
    });
    this.materials.push(petalMat);

    this.sakuraPetals = new THREE.Points(petalGeo, petalMat);
    this.group.add(this.sakuraPetals);
  }

  /**
   * 6. LUMINOUS FULL MOON & GROUND MIST
   */
  private createMoonAndAtmosphere(): void {
    const skyGroup = new THREE.Group();
    skyGroup.position.set(0, 0, -18);

    // Glowing Full Moon in Night Sky
    const moonGeo = new THREE.CircleGeometry(3.5, 32);
    this.geometries.push(moonGeo);
    const moonMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
    });
    this.materials.push(moonMat);
    const moonMesh = new THREE.Mesh(moonGeo, moonMat);
    moonMesh.position.set(8.5, 14, 0);
    skyGroup.add(moonMesh);

    // Moon Glow Halo Ring
    const haloGeo = new THREE.RingGeometry(3.5, 7.5, 32);
    this.geometries.push(haloGeo);
    const haloMat = new THREE.MeshBasicMaterial({
      color: 0x7799cc,
      transparent: true,
      opacity: 0.25,
      side: THREE.DoubleSide,
    });
    this.materials.push(haloMat);
    const haloMesh = new THREE.Mesh(haloGeo, haloMat);
    haloMesh.position.set(8.5, 14, -0.1);
    skyGroup.add(haloMesh);

    // Mountain Ridge Silhouettes
    const mtnGeo = new THREE.ConeGeometry(12, 14, 4);
    this.geometries.push(mtnGeo);
    const mtnMat = new THREE.MeshStandardMaterial({
      color: 0x050810,
      roughness: 0.9,
    });
    this.materials.push(mtnMat);

    const mtn1 = new THREE.Mesh(mtnGeo, mtnMat);
    mtn1.position.set(-16, 4, -4);
    skyGroup.add(mtn1);

    const mtn2 = new THREE.Mesh(mtnGeo, mtnMat);
    mtn2.position.set(16, 3, -4);
    skyGroup.add(mtn2);

    this.group.add(skyGroup);
  }

  /**
   * 7. HIGH-CONTRAST ATMOSPHERIC LIGHTING (MATCHING TARGET IMAGE)
   * Cool moonlight + warm flickering firelight + dedicated player rim lights
   */
  private createAtmosphericLighting(): void {
    // 1. Ambient lighting for balanced exposure and character visibility
    const ambientLight = new THREE.AmbientLight(0x101a2e, 1.6);
    this.group.add(ambientLight);

    // 2. Main Key Directional Moonlight with Shadows (3.2 Intensity)
    const moonLight = new THREE.DirectionalLight(0xdde8ff, 3.2);
    moonLight.position.set(5, 14, 8);
    moonLight.castShadow = true;
    moonLight.shadow.mapSize.width = 2048;
    moonLight.shadow.mapSize.height = 2048;
    moonLight.shadow.camera.near = 0.5;
    moonLight.shadow.camera.far = 32;
    moonLight.shadow.camera.left = -15;
    moonLight.shadow.camera.right = 15;
    moonLight.shadow.camera.top = 9;
    moonLight.shadow.camera.bottom = -2;
    moonLight.shadow.bias = -0.0008;
    this.group.add(moonLight);

    // 3. Warm Fill Light from front to balance facial contrast
    const warmFill = new THREE.DirectionalLight(0xff9944, 1.2);
    warmFill.position.set(-4, 4, 8);
    this.group.add(warmFill);

    // 4. Dedicated Player 1 Crimson Rim Light (tracks Kai from behind)
    this.p1RimLight = new THREE.PointLight(0xff1a4b, 4.5, 8.5, 1.2);
    this.p1RimLight.position.set(-3.6, 2.2, -1.2);
    this.group.add(this.p1RimLight);

    // 5. Dedicated Player 2 Cobalt Rim Light (tracks Zen from behind)
    this.p2RimLight = new THREE.PointLight(0x0088ff, 4.5, 8.5, 1.2);
    this.p2RimLight.position.set(3.6, 2.2, -1.2);
    this.group.add(this.p2RimLight);
  }

  public update(deltaTime: number, p1X: number, p2X: number): void {
    this.animTimer += deltaTime;

    // Animate flickering fire flames and pulsating firelight
    this.fireFlames.forEach((flame, idx) => {
      const flicker = 1.0 + Math.sin(this.animTimer * 12 + idx * 1.5) * 0.15;
      flame.scale.set(flicker, flicker, flicker);
    });

    this.fireLights.forEach((light, idx) => {
      light.intensity = 2.8 + Math.sin(this.animTimer * 14 + idx * 2.0) * 0.5;
    });

    // Sync high-intensity rim follower lights with fighters
    if (this.p1RimLight) {
      this.p1RimLight.position.x = p1X;
    }
    if (this.p2RimLight) {
      this.p2RimLight.position.x = p2X;
    }

    // Drift Sakura blossom petals in wind
    if (this.sakuraPetals) {
      const posAttr = this.sakuraPetals.geometry.attributes.position as THREE.BufferAttribute;
      const arr = posAttr.array as Float32Array;
      for (let i = 0; i < arr.length / 3; i++) {
        // Drift downward and laterally
        arr[i * 3] += Math.sin(this.animTimer * 1.5 + i) * 0.008 + 0.004;
        arr[i * 3 + 1] -= 0.012; // Fall
        if (arr[i * 3 + 1] < 0.05) {
          arr[i * 3 + 1] = 8.0; // Reset to top
        }
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
    this.fireFlames = [];
    this.fireLights = [];
  }
}
