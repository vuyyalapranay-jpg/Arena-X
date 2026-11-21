// src/game/characters/CharacterLoader.ts
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { FighterVisualProfile } from './CharacterConfig';
import { RiggedHumanoidBuilder, RiggedCharacterResult } from './RiggedHumanoidBuilder';
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

  /**
   * Loads a character model either from a local GLB file or via the procedural
   * RiggedHumanoidBuilder, binds all 21 professional animation clips, and returns
   * a fully initialized CharacterAnimator.
   */
  public static async loadFighter(
    profile: FighterVisualProfile,
    isPlayer1: boolean,
    customGlbPath?: string
  ): Promise<LoadedFighterModel> {
    const clips = FighterAnimationClips.createClips();

    if (customGlbPath) {
      try {
        const gltf = await this.gltfLoader.loadAsync(customGlbPath);
        const root = new THREE.Group();
        root.name = isPlayer1 ? 'Fighter_P1_GLB' : 'Fighter_P2_GLB';
        root.add(gltf.scene);

        // Enable shadows on all child meshes
        gltf.scene.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });

        // Add energy shield mesh
        const shieldGeo = new THREE.CylinderGeometry(0.55, 0.55, 0.9, 16, 1, true, -Math.PI / 2.5, Math.PI / 1.25);
        const shieldMat = new THREE.MeshBasicMaterial({
          color: new THREE.Color(profile.colors.emissive),
          transparent: true,
          opacity: 0.0,
          side: THREE.DoubleSide,
          wireframe: true,
        });
        const shieldMesh = new THREE.Mesh(shieldGeo, shieldMat);
        shieldMesh.position.set(0, 1.2, 0.45);
        root.add(shieldMesh);

        // Merge GLTF embedded clips if present
        if (gltf.animations && gltf.animations.length > 0) {
          gltf.animations.forEach((c) => {
            if (c.name in clips) {
              clips[c.name as AnimationName] = c;
            }
          });
        }

        const animator = new CharacterAnimator(root, clips);

        return {
          root,
          animator,
          shieldMesh,
          materials: [shieldMat],
          geometries: [shieldGeo],
          clips,
          dispose: () => {
            animator.dispose();
            shieldGeo.dispose();
            shieldMat.dispose();
          },
        };
      } catch (err) {
        console.warn(`Could not load GLB from ${customGlbPath}, falling back to built-in RiggedHumanoid:`, err);
      }
    }

    // High-Fidelity Built-in Rigged 3D Humanoid
    const rigged: RiggedCharacterResult = RiggedHumanoidBuilder.build(profile, isPlayer1);
    const animator = new CharacterAnimator(rigged.root, clips);

    return {
      root: rigged.root,
      animator,
      shieldMesh: rigged.shieldMesh,
      materials: rigged.materials,
      geometries: rigged.geometries,
      clips,
      dispose: () => {
        animator.dispose();
        rigged.geometries.forEach((g) => g.dispose());
        rigged.materials.forEach((m) => m.dispose());
      },
    };
  }
}
