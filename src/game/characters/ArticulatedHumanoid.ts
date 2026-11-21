// src/game/characters/ArticulatedHumanoid.ts
import * as THREE from 'three';
import { FighterState } from '../../types';

export interface HumanoidConfig {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  emissiveColor: string;
  isPlayer1: boolean;
}

export class ArticulatedHumanoid {
  public root: THREE.Group;
  
  // Body parts for articulation
  private pelvisGroup: THREE.Group;
  private spineGroup: THREE.Group;
  private chestMesh: THREE.Mesh;
  private headGroup: THREE.Group;
  private visorMesh: THREE.Mesh;

  // Left Arm
  private leftShoulder: THREE.Group;
  private leftUpperArm: THREE.Group;
  private leftElbow: THREE.Group;
  private leftForearm: THREE.Group;
  private leftFist: THREE.Mesh;

  // Right Arm
  private rightShoulder: THREE.Group;
  private rightUpperArm: THREE.Group;
  private rightElbow: THREE.Group;
  private rightForearm: THREE.Group;
  private rightFist: THREE.Mesh;

  // Left Leg
  private leftHip: THREE.Group;
  private leftThigh: THREE.Group;
  private leftKnee: THREE.Group;
  private leftShin: THREE.Group;
  private leftFoot: THREE.Mesh;

  // Right Leg
  private rightHip: THREE.Group;
  private rightThigh: THREE.Group;
  private rightKnee: THREE.Group;
  private rightShin: THREE.Group;
  private rightFoot: THREE.Mesh;

  // Block energy shield
  private shieldMesh: THREE.Mesh;

  // Materials for reuse & clean disposal
  private materials: THREE.Material[] = [];
  private geometries: THREE.BufferGeometry[] = [];

  private animTimer = 0;
  private currentFacing = 1;
  private targetFacing = 1;
  private flashTimer = 0;

  constructor(config: HumanoidConfig) {
    this.root = new THREE.Group();
    this.root.name = config.isPlayer1 ? 'Fighter_P1' : 'Fighter_P2';

    // Shared Palette Materials
    const darkArmorMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(config.secondaryColor),
      metalness: 0.85,
      roughness: 0.25,
    });
    this.materials.push(darkArmorMat);

    const teamArmorMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(config.primaryColor),
      metalness: 0.7,
      roughness: 0.3,
    });
    this.materials.push(teamArmorMat);

    const accentMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(config.accentColor),
      metalness: 0.6,
      roughness: 0.4,
    });
    this.materials.push(accentMat);

    const emissiveMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(config.emissiveColor),
      emissive: new THREE.Color(config.emissiveColor),
      emissiveIntensity: 2.5,
      roughness: 0.1,
    });
    this.materials.push(emissiveMat);

    const jointMat = new THREE.MeshStandardMaterial({
      color: 0x222630,
      metalness: 0.9,
      roughness: 0.2,
    });
    this.materials.push(jointMat);

    // Helper for tracked geometry
    const box = (w: number, h: number, d: number) => {
      const g = new THREE.BoxGeometry(w, h, d);
      this.geometries.push(g);
      return g;
    };
    const cyl = (rt: number, rb: number, h: number, s = 12) => {
      const g = new THREE.CylinderGeometry(rt, rb, h, s);
      this.geometries.push(g);
      return g;
    };
    const sphere = (r: number, s = 12) => {
      const g = new THREE.SphereGeometry(r, s, s);
      this.geometries.push(g);
      return g;
    };

    // --- 1. PELVIS / HIPS ---
    this.pelvisGroup = new THREE.Group();
    this.pelvisGroup.position.y = 0.98; // Hip height
    this.root.add(this.pelvisGroup);

    const pelvisMesh = new THREE.Mesh(box(0.38, 0.22, 0.26), darkArmorMat);
    pelvisMesh.castShadow = true;
    this.pelvisGroup.add(pelvisMesh);

    // Front belt buckle / power node
    const beltCore = new THREE.Mesh(box(0.12, 0.08, 0.28), emissiveMat);
    this.pelvisGroup.add(beltCore);

    // --- 2. SPINE & CHEST ---
    this.spineGroup = new THREE.Group();
    this.spineGroup.position.y = 0.14;
    this.pelvisGroup.add(this.spineGroup);

    const spineJoint = new THREE.Mesh(cyl(0.1, 0.12, 0.18), jointMat);
    this.spineGroup.add(spineJoint);

    // Chest & Armor Plate
    this.chestMesh = new THREE.Mesh(box(0.48, 0.38, 0.32), teamArmorMat);
    this.chestMesh.position.y = 0.24;
    this.chestMesh.castShadow = true;
    this.spineGroup.add(this.chestMesh);

    // Chest Core Reactor
    const chestCore = new THREE.Mesh(box(0.16, 0.16, 0.34), emissiveMat);
    chestCore.position.y = 0.24;
    this.spineGroup.add(chestCore);

    // Back power vent
    const backVent = new THREE.Mesh(box(0.24, 0.2, 0.08), darkArmorMat);
    backVent.position.set(0, 0.24, -0.18);
    this.spineGroup.add(backVent);

    // --- 3. NECK & HEAD ---
    this.headGroup = new THREE.Group();
    this.headGroup.position.y = 0.48;
    this.spineGroup.add(this.headGroup);

    const neck = new THREE.Mesh(cyl(0.08, 0.09, 0.1), jointMat);
    neck.position.y = 0.04;
    this.headGroup.add(neck);

    // Angular Cyber Helmet
    const helmet = new THREE.Mesh(box(0.24, 0.26, 0.26), darkArmorMat);
    helmet.position.y = 0.2;
    helmet.castShadow = true;
    this.headGroup.add(helmet);

    // Glowing Visor
    this.visorMesh = new THREE.Mesh(box(0.22, 0.06, 0.28), emissiveMat);
    this.visorMesh.position.set(0, 0.22, 0.02);
    this.headGroup.add(this.visorMesh);

    // Helmet Crest
    const crest = new THREE.Mesh(box(0.06, 0.1, 0.24), accentMat);
    crest.position.set(0, 0.34, -0.02);
    this.headGroup.add(crest);

    // --- 4. LEFT ARM (Lead or Back depending on facing) ---
    this.leftShoulder = new THREE.Group();
    this.leftShoulder.position.set(0.3, 0.34, 0);
    this.spineGroup.add(this.leftShoulder);

    const lShoulderArmor = new THREE.Mesh(sphere(0.12), teamArmorMat);
    lShoulderArmor.castShadow = true;
    this.leftShoulder.add(lShoulderArmor);

    this.leftUpperArm = new THREE.Group();
    this.leftUpperArm.position.y = -0.05;
    this.leftShoulder.add(this.leftUpperArm);

    const lUpperArmMesh = new THREE.Mesh(cyl(0.07, 0.06, 0.28), darkArmorMat);
    lUpperArmMesh.position.y = -0.14;
    lUpperArmMesh.castShadow = true;
    this.leftUpperArm.add(lUpperArmMesh);

    this.leftElbow = new THREE.Group();
    this.leftElbow.position.y = -0.28;
    this.leftUpperArm.add(this.leftElbow);

    this.leftForearm = new THREE.Group();
    this.leftElbow.add(this.leftForearm);

    const lForearmMesh = new THREE.Mesh(box(0.12, 0.26, 0.12), accentMat);
    lForearmMesh.position.y = -0.13;
    lForearmMesh.castShadow = true;
    this.leftForearm.add(lForearmMesh);

    this.leftFist = new THREE.Mesh(box(0.11, 0.12, 0.12), darkArmorMat);
    this.leftFist.position.y = -0.3;
    this.leftFist.castShadow = true;
    this.leftForearm.add(this.leftFist);

    // --- 5. RIGHT ARM ---
    this.rightShoulder = new THREE.Group();
    this.rightShoulder.position.set(-0.3, 0.34, 0);
    this.spineGroup.add(this.rightShoulder);

    const rShoulderArmor = new THREE.Mesh(sphere(0.12), teamArmorMat);
    rShoulderArmor.castShadow = true;
    this.rightShoulder.add(rShoulderArmor);

    this.rightUpperArm = new THREE.Group();
    this.rightUpperArm.position.y = -0.05;
    this.rightShoulder.add(this.rightUpperArm);

    const rUpperArmMesh = new THREE.Mesh(cyl(0.07, 0.06, 0.28), darkArmorMat);
    rUpperArmMesh.position.y = -0.14;
    rUpperArmMesh.castShadow = true;
    this.rightUpperArm.add(rUpperArmMesh);

    this.rightElbow = new THREE.Group();
    this.rightElbow.position.y = -0.28;
    this.rightUpperArm.add(this.rightElbow);

    this.rightForearm = new THREE.Group();
    this.rightElbow.add(this.rightForearm);

    const rForearmMesh = new THREE.Mesh(box(0.12, 0.26, 0.12), accentMat);
    rForearmMesh.position.y = -0.13;
    rForearmMesh.castShadow = true;
    this.rightForearm.add(rForearmMesh);

    this.rightFist = new THREE.Mesh(box(0.11, 0.12, 0.12), darkArmorMat);
    this.rightFist.position.y = -0.3;
    this.rightFist.castShadow = true;
    this.rightForearm.add(this.rightFist);

    // --- 6. LEFT LEG ---
    this.leftHip = new THREE.Group();
    this.leftHip.position.set(0.15, -0.1, 0);
    this.pelvisGroup.add(this.leftHip);

    this.leftThigh = new THREE.Group();
    this.leftHip.add(this.leftThigh);

    const lThighMesh = new THREE.Mesh(cyl(0.09, 0.08, 0.38), darkArmorMat);
    lThighMesh.position.y = -0.19;
    lThighMesh.castShadow = true;
    this.leftThigh.add(lThighMesh);

    this.leftKnee = new THREE.Group();
    this.leftKnee.position.y = -0.38;
    this.leftThigh.add(this.leftKnee);

    const lKneePad = new THREE.Mesh(box(0.12, 0.1, 0.12), accentMat);
    this.leftKnee.add(lKneePad);

    this.leftShin = new THREE.Group();
    this.leftKnee.add(this.leftShin);

    const lShinMesh = new THREE.Mesh(cyl(0.08, 0.07, 0.38), teamArmorMat);
    lShinMesh.position.y = -0.2;
    lShinMesh.castShadow = true;
    this.leftShin.add(lShinMesh);

    this.leftFoot = new THREE.Mesh(box(0.12, 0.1, 0.24), darkArmorMat);
    this.leftFoot.position.set(0, -0.42, 0.06);
    this.leftFoot.castShadow = true;
    this.leftShin.add(this.leftFoot);

    // --- 7. RIGHT LEG ---
    this.rightHip = new THREE.Group();
    this.rightHip.position.set(-0.15, -0.1, 0);
    this.pelvisGroup.add(this.rightHip);

    this.rightThigh = new THREE.Group();
    this.rightHip.add(this.rightThigh);

    const rThighMesh = new THREE.Mesh(cyl(0.09, 0.08, 0.38), darkArmorMat);
    rThighMesh.position.y = -0.19;
    rThighMesh.castShadow = true;
    this.rightThigh.add(rThighMesh);

    this.rightKnee = new THREE.Group();
    this.rightKnee.position.y = -0.38;
    this.rightThigh.add(this.rightKnee);

    const rKneePad = new THREE.Mesh(box(0.12, 0.1, 0.12), accentMat);
    this.rightKnee.add(rKneePad);

    this.rightShin = new THREE.Group();
    this.rightKnee.add(this.rightShin);

    const rShinMesh = new THREE.Mesh(cyl(0.08, 0.07, 0.38), teamArmorMat);
    rShinMesh.position.y = -0.2;
    rShinMesh.castShadow = true;
    this.rightShin.add(rShinMesh);

    this.rightFoot = new THREE.Mesh(box(0.12, 0.1, 0.24), darkArmorMat);
    this.rightFoot.position.set(0, -0.42, 0.06);
    this.rightFoot.castShadow = true;
    this.rightShin.add(this.rightFoot);

    // --- 8. DEFENSIVE ENERGY SHIELD (Active during BLOCK) ---
    const shieldGeo = new THREE.CylinderGeometry(0.55, 0.55, 0.9, 16, 1, true, -Math.PI / 2.5, Math.PI / 1.25);
    this.geometries.push(shieldGeo);
    const shieldMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(config.emissiveColor),
      transparent: true,
      opacity: 0.0,
      side: THREE.DoubleSide,
      wireframe: true,
    });
    this.materials.push(shieldMat);
    this.shieldMesh = new THREE.Mesh(shieldGeo, shieldMat);
    this.shieldMesh.position.set(0, 0.2, 0.45);
    this.spineGroup.add(this.shieldMesh);
  }

  public setFacing(direction: 1 | -1): void {
    this.targetFacing = direction;
  }

  public flashHit(): void {
    this.flashTimer = 0.18;
  }

  public update(deltaTime: number, state: FighterState, actionProgress = 0): void {
    this.animTimer += deltaTime;

    // Smooth turn towards opponent
    const targetYRot = this.targetFacing === 1 ? Math.PI / 2 : -Math.PI / 2;
    this.root.rotation.y = THREE.MathUtils.lerp(this.root.rotation.y, targetYRot, 0.25);

    // Hit flash handling
    if (this.flashTimer > 0) {
      this.flashTimer -= deltaTime;
      (this.chestMesh.material as THREE.MeshStandardMaterial).emissive.set(0xffffff);
      (this.chestMesh.material as THREE.MeshStandardMaterial).emissiveIntensity = 2.0;
    } else {
      (this.chestMesh.material as THREE.MeshStandardMaterial).emissive.set(0x000000);
      (this.chestMesh.material as THREE.MeshStandardMaterial).emissiveIntensity = 0;
    }

    // Default base resets
    this.pelvisGroup.position.y = 0.98;
    this.pelvisGroup.position.x = 0;
    this.spineGroup.rotation.set(0, 0, 0);
    this.headGroup.rotation.set(0, 0, 0);
    (this.shieldMesh.material as THREE.MeshBasicMaterial).opacity = 0;

    // --- PROCEDURAL ANIMATION POSE CONTROLLER ---
    switch (state) {
      case 'IDLE': {
        const breathe = Math.sin(this.animTimer * 3.5) * 0.025;
        this.pelvisGroup.position.y = 0.98 + breathe;

        // Fighter combat guard pose
        this.spineGroup.rotation.x = 0.06;
        this.headGroup.rotation.x = -0.06;

        // Arms raised in boxing stance
        this.leftShoulder.rotation.x = -0.7 + Math.sin(this.animTimer * 2) * 0.04;
        this.leftShoulder.rotation.z = -0.25;
        this.leftElbow.rotation.x = 1.35;
        this.leftElbow.rotation.z = 0.2;

        this.rightShoulder.rotation.x = -0.6 + Math.cos(this.animTimer * 2) * 0.04;
        this.rightShoulder.rotation.z = 0.25;
        this.rightElbow.rotation.x = 1.4;
        this.rightElbow.rotation.z = -0.2;

        // Legs staggered ready stance
        this.leftThigh.rotation.x = -0.15;
        this.leftKnee.rotation.x = 0.28;
        this.rightThigh.rotation.x = 0.18;
        this.rightKnee.rotation.x = 0.25;
        break;
      }

      case 'WALK_FWD': {
        const walkCycle = this.animTimer * 9.0;
        const bob = Math.abs(Math.sin(walkCycle)) * 0.05;
        this.pelvisGroup.position.y = 0.96 + bob;

        // Forward aggressive lean
        this.spineGroup.rotation.x = 0.15;
        this.headGroup.rotation.x = -0.12;

        // Alternating leg swing
        const legSwing = Math.sin(walkCycle) * 0.65;
        this.leftThigh.rotation.x = legSwing;
        this.leftKnee.rotation.x = Math.max(0, -legSwing * 0.8) + 0.15;

        this.rightThigh.rotation.x = -legSwing;
        this.rightKnee.rotation.x = Math.max(0, legSwing * 0.8) + 0.15;

        // Counter arm swing
        this.leftShoulder.rotation.x = -0.5 - legSwing * 0.45;
        this.leftElbow.rotation.x = 1.2;

        this.rightShoulder.rotation.x = -0.5 + legSwing * 0.45;
        this.rightElbow.rotation.x = 1.2;
        break;
      }

      case 'WALK_BWD': {
        const walkCycle = this.animTimer * 7.5;
        this.pelvisGroup.position.y = 0.97 + Math.abs(Math.sin(walkCycle)) * 0.03;

        // Defensive back lean
        this.spineGroup.rotation.x = -0.08;
        this.headGroup.rotation.x = 0.05;

        const legSwing = Math.sin(walkCycle) * 0.45;
        this.leftThigh.rotation.x = -legSwing;
        this.leftKnee.rotation.x = Math.max(0, legSwing * 0.6) + 0.1;

        this.rightThigh.rotation.x = legSwing;
        this.rightKnee.rotation.x = Math.max(0, -legSwing * 0.6) + 0.1;

        // Guard kept high and defensive
        this.leftShoulder.rotation.x = -0.8;
        this.leftElbow.rotation.x = 1.6;
        this.rightShoulder.rotation.x = -0.7;
        this.rightElbow.rotation.x = 1.5;
        break;
      }

      case 'CROUCH': {
        // Deep crouched fighting guard
        this.pelvisGroup.position.y = 0.62;
        this.spineGroup.rotation.x = 0.35;
        this.headGroup.rotation.x = -0.28;

        this.leftThigh.rotation.x = -0.9;
        this.leftKnee.rotation.x = 1.45;
        this.rightThigh.rotation.x = -0.85;
        this.rightKnee.rotation.x = 1.4;

        this.leftShoulder.rotation.x = -0.8;
        this.leftElbow.rotation.x = 1.6;
        this.rightShoulder.rotation.x = -0.75;
        this.rightElbow.rotation.x = 1.55;
        break;
      }

      case 'JUMP': {
        // Dynamic tuck in the air
        this.pelvisGroup.position.y = 1.0;
        this.spineGroup.rotation.x = 0.1;

        this.leftThigh.rotation.x = -0.6;
        this.leftKnee.rotation.x = 1.1;
        this.rightThigh.rotation.x = -0.4;
        this.rightKnee.rotation.x = 0.9;

        // Arms flared slightly for balance
        this.leftShoulder.rotation.set(-0.9, 0, -0.4);
        this.leftElbow.rotation.set(0.8, 0, 0);
        this.rightShoulder.rotation.set(-0.8, 0, 0.4);
        this.rightElbow.rotation.set(0.9, 0, 0);
        break;
      }

      case 'PUNCH': {
        // Quick explosive jab / cross
        // actionProgress runs from 0 to 1
        const strikePhase = Math.sin(actionProgress * Math.PI); // 0 -> 1 -> 0

        this.spineGroup.rotation.y = strikePhase * 0.45;
        this.spineGroup.rotation.x = strikePhase * 0.12;

        // Lead arm snaps straight out horizontally
        this.leftShoulder.rotation.set(-1.5 * strikePhase - 0.2, 0, 0);
        this.leftElbow.rotation.set(0.1 + (1 - strikePhase) * 1.2, 0, 0);

        // Rear arm guards face
        this.rightShoulder.rotation.set(-0.8, 0, 0.3);
        this.rightElbow.rotation.set(1.6, 0, -0.3);

        // Stance plants firmly
        this.leftThigh.rotation.x = -0.25 * strikePhase;
        this.rightThigh.rotation.x = 0.3 * strikePhase;
        break;
      }

      case 'KICK': {
        // Dynamic martial arts high kick
        const kickPhase = Math.sin(actionProgress * Math.PI); // 0 -> 1 -> 0

        this.pelvisGroup.position.y = 0.96;
        this.spineGroup.rotation.z = -kickPhase * 0.4; // Torso counter-balance
        this.spineGroup.rotation.x = -kickPhase * 0.2;

        // Kicking leg (Right) snaps upward high
        this.rightThigh.rotation.x = -1.65 * kickPhase;
        this.rightKnee.rotation.x = (1 - kickPhase) * 1.2 + 0.1;

        // Plant leg (Left) stabilizes
        this.leftThigh.rotation.x = 0.1;
        this.leftKnee.rotation.x = 0.35;

        // Arms dynamic counterbalance
        this.leftShoulder.rotation.set(-0.5, 0, -0.6 * kickPhase);
        this.rightShoulder.rotation.set(0.2 * kickPhase, 0, 0.5 * kickPhase);
        break;
      }

      case 'BLOCK': {
        // Solid defense block with arms crossed and energy shield
        this.spineGroup.rotation.x = 0.15;
        this.pelvisGroup.position.y = 0.88;

        // Crossed forearms guarding face and core
        this.leftShoulder.rotation.set(-1.1, 0.3, -0.4);
        this.leftElbow.rotation.set(1.9, 0, 0.4);

        this.rightShoulder.rotation.set(-1.1, -0.3, 0.4);
        this.rightElbow.rotation.set(1.9, 0, -0.4);

        // Legs braced deep
        this.leftThigh.rotation.x = -0.35;
        this.leftKnee.rotation.x = 0.55;
        this.rightThigh.rotation.x = 0.35;
        this.rightKnee.rotation.x = 0.55;

        // Pulse energy shield
        const shieldPulse = 0.55 + Math.sin(this.animTimer * 14) * 0.15;
        (this.shieldMesh.material as THREE.MeshBasicMaterial).opacity = shieldPulse;
        break;
      }

      case 'HIT_STAGGER': {
        // Reeling backwards from impact
        this.pelvisGroup.position.y = 0.94;
        this.spineGroup.rotation.x = -0.45;
        this.headGroup.rotation.x = 0.4;

        this.leftShoulder.rotation.set(0.3, 0, -0.6);
        this.rightShoulder.rotation.set(0.3, 0, 0.6);
        this.leftElbow.rotation.set(0.4, 0, 0);
        this.rightElbow.rotation.set(0.4, 0, 0);

        this.leftThigh.rotation.x = 0.3;
        this.rightThigh.rotation.x = -0.25;
        break;
      }

      case 'KNOCKDOWN': {
        // Down on the canvas
        this.pelvisGroup.position.y = 0.18;
        this.spineGroup.rotation.x = -1.45;
        this.headGroup.rotation.x = 0.3;
        this.leftThigh.rotation.x = 0.2;
        this.rightThigh.rotation.x = 0.4;
        break;
      }
    }
  }

  public dispose(): void {
    this.geometries.forEach((g) => g.dispose());
    this.materials.forEach((m) => m.dispose());
    this.geometries = [];
    this.materials = [];
  }
}
