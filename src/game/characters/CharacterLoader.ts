// src/game/characters/CharacterLoader.ts
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js';
import { FighterVisualProfile } from './CharacterConfig';
import { FighterAnimationClips } from './FighterAnimationClips';
import { CharacterAnimator } from './CharacterAnimator';
import { AnimationName } from '../../types';

export interface LoadedFighterModel {
  root: THREE.Group;
  animator: CharacterAnimator;
  shieldMesh: THREE.Mesh;
  materials: THREE.Material[];
  geometries: THREE.BufferGeometry[];
  clips: Record<AnimationName, THREE.AnimationClip>;
  dispose: () => void;
}

export class CharacterLoader {
  private static gltfLoader = new GLTFLoader();
  private static cachedXbotGLTF: any = null;
  private static cachedSoldierGLTF: any = null;

  /**
   * Loads the Xbot model (Player 1 base) — a sleek humanoid robot
   */
  private static async getXbotGLTF(): Promise<any> {
    if (this.cachedXbotGLTF) return this.cachedXbotGLTF;
    const gltf = await this.gltfLoader.loadAsync('/assets/models/Xbot.glb');
    this.cachedXbotGLTF = gltf;
    return gltf;
  }

  /**
   * Loads the Soldier model (Player 2 base) — a realistic military humanoid
   */
  private static async getSoldierGLTF(): Promise<any> {
    if (this.cachedSoldierGLTF) return this.cachedSoldierGLTF;
    const gltf = await this.gltfLoader.loadAsync('/assets/models/Soldier.glb');
    this.cachedSoldierGLTF = gltf;
    return gltf;
  }

  /**
   * Loads and colorizes a fighter model.
   * - Player 1 (KAI): Uses Xbot.glb — recolored to red/black crimson fighter
   * - Player 2 (ZEN): Uses Soldier.glb — recolored to blue/black shadow fighter
   *
   * Both models use the Mixamo bone naming convention, so the same animation
   * clips work for both.
   */
  public static async loadFighter(
    profile: FighterVisualProfile,
    isPlayer1: boolean
  ): Promise<LoadedFighterModel> {
    const gltf = isPlayer1
      ? await this.getXbotGLTF()
      : await this.getSoldierGLTF();

    // Clone the entire scene tree so each fighter gets its own skeleton & materials
    const clonedScene = SkeletonUtils.clone(gltf.scene) as THREE.Group;
    clonedScene.name = isPlayer1 ? 'Fighter_Kai_Model' : 'Fighter_Zen_Model';

    const materials: THREE.Material[] = [];
    const geometries: THREE.BufferGeometry[] = [];

    // Define fighter color palette
    const primaryColor = new THREE.Color(profile.colors.primary);
    const secondaryColor = new THREE.Color(profile.colors.secondary);
    const accentColor = new THREE.Color(profile.colors.accent);
    const emissiveColor = new THREE.Color(profile.colors.emissive);

    // ---- Recolor all meshes to match the fighter identity ----
    clonedScene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh || (child as THREE.SkinnedMesh).isSkinnedMesh) {
        const mesh = child as THREE.Mesh;

        // Make sure the model is visible
        mesh.visible = true;
        mesh.castShadow = true;
        mesh.receiveShadow = true;

        // Clone the material so each fighter has independent colors
        if (Array.isArray(mesh.material)) {
          mesh.material = mesh.material.map((mat, idx) => {
            const clonedMat = this.recolorMaterial(
              mat.clone() as THREE.MeshStandardMaterial,
              isPlayer1,
              idx,
              primaryColor,
              secondaryColor,
              accentColor,
              emissiveColor
            );
            materials.push(clonedMat);
            return clonedMat;
          });
        } else {
          const clonedMat = this.recolorMaterial(
            (mesh.material as THREE.Material).clone() as THREE.MeshStandardMaterial,
            isPlayer1,
            0,
            primaryColor,
            secondaryColor,
            accentColor,
            emissiveColor
          );
          materials.push(clonedMat);
          mesh.material = clonedMat;
        }
      }
    });

    // Scale the model to the correct fighting game height (~1.85m)
    // Xbot Armature root has 0.01 scale (centimeter mode), Soldier may differ
    const bbox = new THREE.Box3().setFromObject(clonedScene);
    const modelHeight = bbox.max.y - bbox.min.y;
    const targetHeight = 1.85; // meters
    if (modelHeight > 0.01) {
      const scaleFactor = targetHeight / modelHeight;
      clonedScene.scale.multiplyScalar(scaleFactor);
    }

    // Re-center the model so feet are at y=0
    const scaledBbox = new THREE.Box3().setFromObject(clonedScene);
    const yOffset = -scaledBbox.min.y;
    clonedScene.position.y += yOffset;

    // ---- Defensive Energy Shield for BLOCK state ----
    const shieldGeo = new THREE.CylinderGeometry(0.55, 0.55, 1.6, 16, 1, true, -Math.PI / 2.5, Math.PI / 1.25);
    geometries.push(shieldGeo);
    const shieldMat = new THREE.MeshBasicMaterial({
      color: emissiveColor,
      transparent: true,
      opacity: 0.0,
      side: THREE.DoubleSide,
      wireframe: true,
    });
    materials.push(shieldMat);
    const shieldMesh = new THREE.Mesh(shieldGeo, shieldMat);
    shieldMesh.position.set(0, 0.9, 0.35);
    clonedScene.add(shieldMesh);

    // ---- Add emissive glow eyes / accent ----
    this.addFighterAccents(clonedScene, isPlayer1, emissiveColor, accentColor, materials, geometries);

    // ---- Bind the 21-state Skeletal Animation System ----
    const clips = FighterAnimationClips.createMixamoClips(gltf.animations);
    const animator = new CharacterAnimator(clonedScene, clips);

    return {
      root: clonedScene,
      animator,
      shieldMesh,
      materials,
      geometries,
      clips,
      dispose: () => {
        animator.dispose();
        geometries.forEach((g) => g.dispose());
        materials.forEach((m) => m.dispose());
      },
    };
  }

  /**
   * Recolors a material to match the fighter's team identity.
   * Xbot has dark grey/black body parts — we tint them red or blue.
   * Soldier has military camo/fabric — we tint them accordingly.
   */
  private static recolorMaterial(
    mat: THREE.MeshStandardMaterial,
    isPlayer1: boolean,
    materialIndex: number,
    primaryColor: THREE.Color,
    secondaryColor: THREE.Color,
    accentColor: THREE.Color,
    emissiveColor: THREE.Color
  ): THREE.MeshStandardMaterial {
    // Ensure the material uses standard PBR properties
    if (!mat.isMeshStandardMaterial) {
      // Convert basic/phong material to standard
      const stdMat = new THREE.MeshStandardMaterial();
      if ('color' in mat) stdMat.color.copy((mat as any).color);
      if ('map' in mat) stdMat.map = (mat as any).map;
      return this.recolorMaterial(stdMat, isPlayer1, materialIndex, primaryColor, secondaryColor, accentColor, emissiveColor);
    }

    // Get the original color luminance to decide what role this material plays
    const originalLum = mat.color.getHSL({ h: 0, s: 0, l: 0 }).l;

    if (isPlayer1) {
      // KAI — Crimson Red/Black theme
      if (materialIndex === 0 || originalLum < 0.15) {
        // Dark body parts → Deep crimson-black
        mat.color.set('#1a0810');
        mat.emissive.set('#ff0033');
        mat.emissiveIntensity = 0.15;
        mat.metalness = 0.6;
        mat.roughness = 0.3;
      } else if (originalLum < 0.4) {
        // Medium parts → Rich crimson red
        mat.color.copy(primaryColor);
        mat.emissive.set('#660015');
        mat.emissiveIntensity = 0.25;
        mat.metalness = 0.5;
        mat.roughness = 0.35;
      } else {
        // Lighter accents → Bright red with glow
        mat.color.copy(accentColor);
        mat.emissive.copy(emissiveColor);
        mat.emissiveIntensity = 0.5;
        mat.metalness = 0.7;
        mat.roughness = 0.2;
      }
    } else {
      // ZEN — Cobalt Blue/Black theme
      if (materialIndex === 0 || originalLum < 0.15) {
        // Dark body → Deep navy-black
        mat.color.set('#060d1f');
        mat.emissive.set('#0044aa');
        mat.emissiveIntensity = 0.15;
        mat.metalness = 0.6;
        mat.roughness = 0.3;
      } else if (originalLum < 0.4) {
        // Medium parts → Royal cobalt blue
        mat.color.copy(primaryColor);
        mat.emissive.set('#002266');
        mat.emissiveIntensity = 0.25;
        mat.metalness = 0.5;
        mat.roughness = 0.35;
      } else {
        // Lighter accents → Electric cyan with glow
        mat.color.copy(accentColor);
        mat.emissive.copy(emissiveColor);
        mat.emissiveIntensity = 0.5;
        mat.metalness = 0.7;
        mat.roughness = 0.2;
      }
    }

    // If there is a texture map, tint it rather than replace it
    if (mat.map) {
      // Keep the texture but add a slight team-color tint via emissive
      mat.color.set('#ffffff');
      mat.emissive.copy(isPlayer1 ? primaryColor : primaryColor);
      mat.emissiveIntensity = 0.12;
    }

    return mat;
  }

  /**
   * Adds small accent meshes (glowing eye strips, shoulder pads, etc.)
   * to visually enhance the fighter identity.
   */
  private static addFighterAccents(
    model: THREE.Group,
    _isPlayer1: boolean,
    emissiveColor: THREE.Color,
    _accentColor: THREE.Color,
    materials: THREE.Material[],
    geometries: THREE.BufferGeometry[]
  ): void {
    // Find the head and hips bones for accent placement
    const bones: { head: THREE.Bone | null; hips: THREE.Bone | null } = { head: null, hips: null };
    model.traverse((child) => {
      if ((child as THREE.Bone).isBone) {
        if (child.name === 'mixamorig:Head') bones.head = child as THREE.Bone;
        if (child.name === 'mixamorig:Hips') bones.hips = child as THREE.Bone;
      }
    });

    // Glowing eye visor / accent strip on the head
    if (bones.head) {
      const eyeGeo = new THREE.BoxGeometry(12, 1.8, 2.5);
      geometries.push(eyeGeo);
      const eyeMat = new THREE.MeshStandardMaterial({
        color: emissiveColor,
        emissive: emissiveColor,
        emissiveIntensity: 3.0,
        roughness: 0.1,
        metalness: 0.9,
      });
      materials.push(eyeMat);
      const eyeStrip = new THREE.Mesh(eyeGeo, eyeMat);
      eyeStrip.position.set(0, 10, 10); // Centimeter bone space
      bones.head.add(eyeStrip);

      // Add a small accent point light for atmosphere
      const accentLight = new THREE.PointLight(emissiveColor.getHex(), 0.5, 1.5);
      accentLight.position.set(0, 10, 12);
      bones.head.add(accentLight);
    }

    // Aura / power glow at hips/core
    if (bones.hips) {
      const auraGeo = new THREE.SphereGeometry(12, 8, 8);
      geometries.push(auraGeo);
      const auraMat = new THREE.MeshBasicMaterial({
        color: emissiveColor,
        transparent: true,
        opacity: 0.06,
        side: THREE.DoubleSide,
      });
      materials.push(auraMat);
      const auraMesh = new THREE.Mesh(auraGeo, auraMat);
      auraMesh.position.set(0, 10, 0);
      bones.hips.add(auraMesh);
    }
  }
}
