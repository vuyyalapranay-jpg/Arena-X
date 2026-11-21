// src/game/characters/RiggedHumanoidBuilder.ts
import * as THREE from 'three';
import { FighterVisualProfile } from './CharacterConfig';

export interface RiggedCharacterResult {
  root: THREE.Group;
  skeleton: THREE.Skeleton;
  bones: Record<string, THREE.Bone>;
  materials: THREE.Material[];
  geometries: THREE.BufferGeometry[];
  shieldMesh: THREE.Mesh;
}

export class RiggedHumanoidBuilder {
  /**
   * Builds a complete, production-grade 3D humanoid character with a 21-bone skeletal rig
   * and distinct athletic fighting-game aesthetics for Player 1 (Vortex) and Player 2 (Ion).
   */
  public static build(profile: FighterVisualProfile, isPlayer1: boolean): RiggedCharacterResult {
    const root = new THREE.Group();
    root.name = isPlayer1 ? 'Fighter_P1_Rig' : 'Fighter_P2_Rig';

    const materials: THREE.Material[] = [];
    const geometries: THREE.BufferGeometry[] = [];

    // Helper for tracked geometry
    const box = (w: number, h: number, d: number) => {
      const g = new THREE.BoxGeometry(w, h, d);
      geometries.push(g);
      return g;
    };
    const cyl = (rt: number, rb: number, h: number, s = 14) => {
      const g = new THREE.CylinderGeometry(rt, rb, h, s);
      geometries.push(g);
      return g;
    };
    const sphere = (r: number, s = 14) => {
      const g = new THREE.SphereGeometry(r, s, s);
      geometries.push(g);
      return g;
    };

    // --- 1. MATERIAL PALETTE ---
    const skinMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(profile.colors.skin),
      roughness: 0.65,
      metalness: 0.05,
    });
    materials.push(skinMat);

    const hairMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(profile.colors.hair),
      roughness: 0.8,
      metalness: 0.1,
    });
    materials.push(hairMat);

    const clothingMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(profile.colors.clothing),
      roughness: 0.55,
      metalness: 0.2,
    });
    materials.push(clothingMat);

    const teamMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(profile.colors.primary),
      roughness: 0.4,
      metalness: 0.6,
    });
    materials.push(teamMat);

    const accentMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(profile.colors.accent),
      roughness: 0.35,
      metalness: 0.7,
    });
    materials.push(accentMat);

    const darkTrimMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(profile.colors.secondary),
      roughness: 0.5,
      metalness: 0.8,
    });
    materials.push(darkTrimMat);

    const emissiveMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(profile.colors.emissive),
      emissive: new THREE.Color(profile.colors.emissive),
      emissiveIntensity: 2.8,
      roughness: 0.1,
    });
    materials.push(emissiveMat);

    const bootsMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(profile.colors.boots),
      roughness: 0.45,
      metalness: 0.5,
    });
    materials.push(bootsMat);

    // --- 2. SKELETAL BONE HIERARCHY ---
    const boneMap: Record<string, THREE.Bone> = {};
    const createBone = (name: string): THREE.Bone => {
      const b = new THREE.Bone();
      b.name = name;
      boneMap[name] = b;
      return b;
    };

    // Standard Humanoid Rig matching AnimationClip tracks
    const rootBone = createBone('Root');
    root.add(rootBone);

    const hips = createBone('Hips');
    hips.position.set(0, 0.98, 0); // 0.98m hip height
    rootBone.add(hips);

    const spine = createBone('Spine');
    spine.position.set(0, 0.14, 0);
    hips.add(spine);

    const spine1 = createBone('Spine1');
    spine1.position.set(0, 0.14, 0);
    spine.add(spine1);

    const spine2 = createBone('Spine2'); // Chest
    spine2.position.set(0, 0.16, 0);
    spine1.add(spine2);

    const neck = createBone('Neck');
    neck.position.set(0, 0.16, 0);
    spine2.add(neck);

    const head = createBone('Head');
    head.position.set(0, 0.12, 0);
    neck.add(head);

    // Left Arm Hierarchy
    const leftShoulder = createBone('LeftShoulder');
    leftShoulder.position.set(0.22, 0.12, 0);
    spine2.add(leftShoulder);

    const leftArm = createBone('LeftArm');
    leftArm.position.set(0.14, 0, 0);
    leftShoulder.add(leftArm);

    const leftForeArm = createBone('LeftForeArm');
    leftForeArm.position.set(0.28, 0, 0);
    leftArm.add(leftForeArm);

    const leftHand = createBone('LeftHand');
    leftHand.position.set(0.26, 0, 0);
    leftForeArm.add(leftHand);

    // Right Arm Hierarchy
    const rightShoulder = createBone('RightShoulder');
    rightShoulder.position.set(-0.22, 0.12, 0);
    spine2.add(rightShoulder);

    const rightArm = createBone('RightArm');
    rightArm.position.set(-0.14, 0, 0);
    rightShoulder.add(rightArm);

    const rightForeArm = createBone('RightForeArm');
    rightForeArm.position.set(-0.28, 0, 0);
    rightArm.add(rightForeArm);

    const rightHand = createBone('RightHand');
    rightHand.position.set(-0.26, 0, 0);
    rightForeArm.add(rightHand);

    // Left Leg Hierarchy
    const leftUpLeg = createBone('LeftUpLeg');
    leftUpLeg.position.set(0.14, -0.05, 0);
    hips.add(leftUpLeg);

    const leftLeg = createBone('LeftLeg');
    leftLeg.position.set(0, -0.42, 0);
    leftUpLeg.add(leftLeg);

    const leftFoot = createBone('LeftFoot');
    leftFoot.position.set(0, -0.42, 0.08);
    leftLeg.add(leftFoot);

    // Right Leg Hierarchy
    const rightUpLeg = createBone('RightUpLeg');
    rightUpLeg.position.set(-0.14, -0.05, 0);
    hips.add(rightUpLeg);

    const rightLeg = createBone('RightLeg');
    rightLeg.position.set(0, -0.42, 0);
    rightUpLeg.add(rightLeg);

    const rightFoot = createBone('RightFoot');
    rightFoot.position.set(0, -0.42, 0.08);
    rightLeg.add(rightFoot);

    const boneList = Object.values(boneMap);
    const skeleton = new THREE.Skeleton(boneList);

    // --- 3. DETAILED 3D CHARACTER MESH GEOMETRY ---

    // A. PELVIS & WAIST (Hips)
    const pelvisMesh = new THREE.Mesh(box(0.36, 0.18, 0.24), clothingMat);
    pelvisMesh.castShadow = true;
    pelvisMesh.receiveShadow = true;
    hips.add(pelvisMesh);

    // Belt / Sash
    const beltMesh = new THREE.Mesh(box(0.38, 0.08, 0.26), teamMat);
    beltMesh.castShadow = true;
    hips.add(beltMesh);

    // Center Buckle / Power Node
    const buckleMesh = new THREE.Mesh(box(0.10, 0.07, 0.28), emissiveMat);
    hips.add(buckleMesh);

    // B. SPINE & ABDOMEN
    const absMesh = new THREE.Mesh(cyl(0.14, 0.15, 0.20), skinMat);
    absMesh.position.y = 0.06;
    absMesh.castShadow = true;
    spine.add(absMesh);

    // C. CHEST & OUTFIT (Spine2)
    if (isPlayer1) {
      // VORTEX: Open Martial Arts Gi / Vest with athletic pectoral structure
      const chestBase = new THREE.Mesh(box(0.44, 0.30, 0.28), clothingMat);
      chestBase.position.y = 0.08;
      chestBase.castShadow = true;
      spine2.add(chestBase);

      // Open Gi Lapels (Crimson Red Trim)
      const leftLapel = new THREE.Mesh(box(0.10, 0.32, 0.30), teamMat);
      leftLapel.position.set(0.14, 0.08, 0.01);
      leftLapel.castShadow = true;
      spine2.add(leftLapel);

      const rightLapel = new THREE.Mesh(box(0.10, 0.32, 0.30), teamMat);
      rightLapel.position.set(-0.14, 0.08, 0.01);
      rightLapel.castShadow = true;
      spine2.add(rightLapel);

      // Back dragon / fighter emblem
      const emblem = new THREE.Mesh(box(0.24, 0.24, 0.04), teamMat);
      emblem.position.set(0, 0.08, -0.15);
      spine2.add(emblem);
    } else {
      // ION: Tactical High-Collar Cyber Combat Jacket
      const jacketChest = new THREE.Mesh(box(0.46, 0.32, 0.30), clothingMat);
      jacketChest.position.y = 0.08;
      jacketChest.castShadow = true;
      spine2.add(jacketChest);

      // Glowing Cyan Seam Piping
      const cyanPipingLeft = new THREE.Mesh(box(0.04, 0.32, 0.32), emissiveMat);
      cyanPipingLeft.position.set(0.12, 0.08, 0);
      spine2.add(cyanPipingLeft);

      const cyanPipingRight = new THREE.Mesh(box(0.04, 0.32, 0.32), emissiveMat);
      cyanPipingRight.position.set(-0.12, 0.08, 0);
      spine2.add(cyanPipingRight);

      // Tactical High Collar
      const collar = new THREE.Mesh(cyl(0.13, 0.15, 0.12, 10), teamMat);
      collar.position.set(0, 0.24, 0);
      collar.castShadow = true;
      spine2.add(collar);
    }

    // D. NECK & HEAD (Head Bone)
    const neckMesh = new THREE.Mesh(cyl(0.08, 0.09, 0.12), skinMat);
    neckMesh.position.y = 0.05;
    neck.add(neckMesh);

    // Anatomical Head
    const headMesh = new THREE.Mesh(box(0.22, 0.25, 0.24), skinMat);
    headMesh.position.y = 0.12;
    headMesh.castShadow = true;
    head.add(headMesh);

    // Jawline & Chin Structure
    const jawMesh = new THREE.Mesh(box(0.16, 0.10, 0.18), skinMat);
    jawMesh.position.set(0, 0.02, 0.06);
    head.add(jawMesh);

    // Nose Bridge
    const nose = new THREE.Mesh(box(0.04, 0.08, 0.06), skinMat);
    nose.position.set(0, 0.12, 0.14);
    head.add(nose);

    if (isPlayer1) {
      // VORTEX: Spiked martial artist hair + red combat headband
      const headband = new THREE.Mesh(box(0.24, 0.05, 0.26), teamMat);
      headband.position.set(0, 0.17, 0.01);
      head.add(headband);

      // Flowing Headband Tails behind head
      const tail1 = new THREE.Mesh(box(0.05, 0.25, 0.02), teamMat);
      tail1.position.set(0.04, 0.06, -0.15);
      tail1.rotation.x = -0.3;
      head.add(tail1);

      const tail2 = new THREE.Mesh(box(0.05, 0.22, 0.02), teamMat);
      tail2.position.set(-0.04, 0.08, -0.15);
      tail2.rotation.x = -0.4;
      head.add(tail2);

      // Spiked Black Hair with crimson edge
      const hairCrown = new THREE.Mesh(box(0.24, 0.12, 0.26), hairMat);
      hairCrown.position.set(0, 0.26, -0.02);
      hairCrown.castShadow = true;
      head.add(hairCrown);

      const frontSpike1 = new THREE.Mesh(box(0.06, 0.14, 0.08), hairMat);
      frontSpike1.position.set(0.06, 0.28, 0.12);
      frontSpike1.rotation.x = 0.3;
      head.add(frontSpike1);

      const frontSpike2 = new THREE.Mesh(box(0.06, 0.12, 0.08), hairMat);
      frontSpike2.position.set(-0.06, 0.27, 0.12);
      frontSpike2.rotation.x = 0.25;
      head.add(frontSpike2);

      // Glowing Fighter Eyes / Visor
      const eyeL = new THREE.Mesh(box(0.05, 0.02, 0.02), emissiveMat);
      eyeL.position.set(0.05, 0.13, 0.13);
      head.add(eyeL);

      const eyeR = new THREE.Mesh(box(0.05, 0.02, 0.02), emissiveMat);
      eyeR.position.set(-0.05, 0.13, 0.13);
      head.add(eyeR);
    } else {
      // ION: Cyberpunk Undercut with Cyan Highlighting & Cybernetic Eye
      const undercutSides = new THREE.Mesh(box(0.24, 0.14, 0.26), darkTrimMat);
      undercutSides.position.set(0, 0.20, 0);
      head.add(undercutSides);

      const topFade = new THREE.Mesh(box(0.20, 0.10, 0.26), hairMat);
      topFade.position.set(0, 0.28, 0);
      topFade.castShadow = true;
      head.add(topFade);

      // Cyan tipped crest
      const hairTip = new THREE.Mesh(box(0.08, 0.04, 0.24), emissiveMat);
      hairTip.position.set(0, 0.33, 0);
      head.add(hairTip);

      // Cybernetic Eye / Visor (Left)
      const cyberEye = new THREE.Mesh(box(0.06, 0.03, 0.04), emissiveMat);
      cyberEye.position.set(0.06, 0.13, 0.13);
      head.add(cyberEye);

      // Normal Eye (Right)
      const normalEye = new THREE.Mesh(box(0.05, 0.02, 0.02), accentMat);
      normalEye.position.set(-0.05, 0.13, 0.13);
      head.add(normalEye);
    }

    // E. ARMS & HANDS (Left & Right)
    // Left Shoulder Pad
    const lShoulderMesh = new THREE.Mesh(sphere(0.09), isPlayer1 ? clothingMat : teamMat);
    lShoulderMesh.castShadow = true;
    leftShoulder.add(lShoulderMesh);

    // Left Upper Arm (Bicep/Tricep)
    const lBicep = new THREE.Mesh(cyl(0.07, 0.065, 0.24), isPlayer1 ? skinMat : clothingMat);
    lBicep.position.x = 0.14;
    lBicep.rotation.z = -Math.PI / 2;
    lBicep.castShadow = true;
    leftArm.add(lBicep);

    // Left Forearm
    const lForearm = new THREE.Mesh(cyl(0.065, 0.06, 0.22), skinMat);
    lForearm.position.x = 0.12;
    lForearm.rotation.z = -Math.PI / 2;
    lForearm.castShadow = true;
    leftForeArm.add(lForearm);

    // Left Hand Wraps / Tactical Combat Glove
    const lHandGlove = new THREE.Mesh(box(0.12, 0.10, 0.12), isPlayer1 ? teamMat : darkTrimMat);
    lHandGlove.position.x = 0.04;
    lHandGlove.castShadow = true;
    leftHand.add(lHandGlove);

    if (!isPlayer1) {
      // Cyan knuckle power node
      const lKnuckles = new THREE.Mesh(box(0.03, 0.08, 0.10), emissiveMat);
      lKnuckles.position.x = 0.10;
      leftHand.add(lKnuckles);
    }

    // Right Shoulder Pad
    const rShoulderMesh = new THREE.Mesh(sphere(0.09), isPlayer1 ? clothingMat : teamMat);
    rShoulderMesh.castShadow = true;
    rightShoulder.add(rShoulderMesh);

    // Right Upper Arm
    const rBicep = new THREE.Mesh(cyl(0.07, 0.065, 0.24), isPlayer1 ? skinMat : clothingMat);
    rBicep.position.x = -0.14;
    rBicep.rotation.z = Math.PI / 2;
    rBicep.castShadow = true;
    rightArm.add(rBicep);

    // Right Forearm
    const rForearm = new THREE.Mesh(cyl(0.065, 0.06, 0.22), skinMat);
    rForearm.position.x = -0.12;
    rForearm.rotation.z = Math.PI / 2;
    rForearm.castShadow = true;
    rightForeArm.add(rForearm);

    // Right Hand Wraps / Glove
    const rHandGlove = new THREE.Mesh(box(0.12, 0.10, 0.12), isPlayer1 ? teamMat : darkTrimMat);
    rHandGlove.position.x = -0.04;
    rHandGlove.castShadow = true;
    rightHand.add(rHandGlove);

    if (!isPlayer1) {
      const rKnuckles = new THREE.Mesh(box(0.03, 0.08, 0.10), emissiveMat);
      rKnuckles.position.x = -0.10;
      rightHand.add(rKnuckles);
    }

    // F. LEGS & FOOTWEAR (Left & Right)
    // Left Thigh
    const lThigh = new THREE.Mesh(cyl(0.09, 0.075, 0.38), darkTrimMat);
    lThigh.position.y = -0.19;
    lThigh.castShadow = true;
    leftUpLeg.add(lThigh);

    // Left Knee Pad
    const lKneePad = new THREE.Mesh(box(0.12, 0.10, 0.10), teamMat);
    lKneePad.position.set(0, 0, 0.05);
    lKneePad.castShadow = true;
    leftLeg.add(lKneePad);

    // Left Shin
    const lShin = new THREE.Mesh(cyl(0.075, 0.065, 0.38), darkTrimMat);
    lShin.position.y = -0.20;
    lShin.castShadow = true;
    leftLeg.add(lShin);

    // Left Boot / Sneaker
    const lBoot = new THREE.Mesh(box(0.13, 0.12, 0.26), bootsMat);
    lBoot.position.set(0, -0.06, 0.06);
    lBoot.castShadow = true;
    leftFoot.add(lBoot);

    // Left Boot Trim / Sole
    const lSole = new THREE.Mesh(box(0.14, 0.04, 0.28), isPlayer1 ? teamMat : emissiveMat);
    lSole.position.set(0, -0.12, 0.06);
    leftFoot.add(lSole);

    // Right Thigh
    const rThigh = new THREE.Mesh(cyl(0.09, 0.075, 0.38), darkTrimMat);
    rThigh.position.y = -0.19;
    rThigh.castShadow = true;
    rightUpLeg.add(rThigh);

    // Right Knee Pad
    const rKneePad = new THREE.Mesh(box(0.12, 0.10, 0.10), teamMat);
    rKneePad.position.set(0, 0, 0.05);
    rKneePad.castShadow = true;
    rightLeg.add(rKneePad);

    // Right Shin
    const rShin = new THREE.Mesh(cyl(0.075, 0.065, 0.38), darkTrimMat);
    rShin.position.y = -0.20;
    rShin.castShadow = true;
    rightLeg.add(rShin);

    // Right Boot / Sneaker
    const rBoot = new THREE.Mesh(box(0.13, 0.12, 0.26), bootsMat);
    rBoot.position.set(0, -0.06, 0.06);
    rBoot.castShadow = true;
    rightFoot.add(rBoot);

    // Right Boot Trim / Sole
    const rSole = new THREE.Mesh(box(0.14, 0.04, 0.28), isPlayer1 ? teamMat : emissiveMat);
    rSole.position.set(0, -0.12, 0.06);
    rightFoot.add(rSole);

    // G. FOREARM ENERGY SHIELD (Active during BLOCK)
    const shieldGeo = new THREE.CylinderGeometry(0.55, 0.55, 0.9, 16, 1, true, -Math.PI / 2.5, Math.PI / 1.25);
    geometries.push(shieldGeo);
    const shieldMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(profile.colors.emissive),
      transparent: true,
      opacity: 0.0,
      side: THREE.DoubleSide,
      wireframe: true,
    });
    materials.push(shieldMat);
    const shieldMesh = new THREE.Mesh(shieldGeo, shieldMat);
    shieldMesh.position.set(0, 0.15, 0.45);
    spine2.add(shieldMesh);

    return {
      root,
      skeleton,
      bones: boneMap,
      materials,
      geometries,
      shieldMesh,
    };
  }
}
