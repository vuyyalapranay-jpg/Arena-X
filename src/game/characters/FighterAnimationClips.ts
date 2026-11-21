// src/game/characters/FighterAnimationClips.ts
import * as THREE from 'three';
import { AnimationName } from '../../types';

export class FighterAnimationClips {
  private static quatTrack(
    boneName: string,
    times: number[],
    eulerRotations: [number, number, number][]
  ): THREE.QuaternionKeyframeTrack {
    const quatValues: number[] = [];
    const euler = new THREE.Euler();
    const q = new THREE.Quaternion();

    for (const [x, y, z] of eulerRotations) {
      euler.set(x, y, z, 'XYZ');
      q.setFromEuler(euler);
      quatValues.push(q.x, q.y, q.z, q.w);
    }
    return new THREE.QuaternionKeyframeTrack(`${boneName}.quaternion`, times, quatValues);
  }

  private static posTrack(
    boneName: string,
    times: number[],
    positions: [number, number, number][]
  ): THREE.VectorKeyframeTrack {
    const values: number[] = [];
    for (const [x, y, z] of positions) {
      values.push(x, y, z);
    }
    return new THREE.VectorKeyframeTrack(`${boneName}.position`, times, values);
  }

  /**
   * Generates a complete library of 21 professional fighting-game AnimationClips
   * for the 21-bone humanoid skeleton.
   */
  public static createClips(): Record<AnimationName, THREE.AnimationClip> {
    const clips: Partial<Record<AnimationName, THREE.AnimationClip>> = {};

    // ==========================================
    // 1. IDLE (Combat Stance with rhythmic sway)
    // ==========================================
    {
      const d = 1.6;
      const t = [0, 0.4, 0.8, 1.2, 1.6];
      clips['idle'] = new THREE.AnimationClip('idle', d, [
        this.posTrack('Hips', t, [
          [0, 0.98, 0],
          [0, 0.965, 0.01],
          [0, 0.98, 0],
          [0, 0.965, 0.01],
          [0, 0.98, 0],
        ]),
        this.quatTrack('Spine', t, [
          [0.08, 0.12, 0],
          [0.06, 0.10, 0],
          [0.08, 0.12, 0],
          [0.06, 0.10, 0],
          [0.08, 0.12, 0],
        ]),
        this.quatTrack('Spine2', t, [
          [0.06, 0.08, 0],
          [0.04, 0.06, 0],
          [0.06, 0.08, 0],
          [0.04, 0.06, 0],
          [0.06, 0.08, 0],
        ]),
        this.quatTrack('Head', t, [
          [-0.08, -0.15, 0],
          [-0.06, -0.12, 0],
          [-0.08, -0.15, 0],
          [-0.06, -0.12, 0],
          [-0.08, -0.15, 0],
        ]),
        // Guarded boxing arms
        this.quatTrack('LeftArm', t, [
          [0.4, 0.6, -0.8],
          [0.35, 0.55, -0.75],
          [0.4, 0.6, -0.8],
          [0.35, 0.55, -0.75],
          [0.4, 0.6, -0.8],
        ]),
        this.quatTrack('LeftForeArm', t, [
          [0, 0.4, 1.4],
          [0, 0.35, 1.35],
          [0, 0.4, 1.4],
          [0, 0.35, 1.35],
          [0, 0.4, 1.4],
        ]),
        this.quatTrack('RightArm', t, [
          [0.3, -0.5, 0.75],
          [0.25, -0.45, 0.7],
          [0.3, -0.5, 0.75],
          [0.25, -0.45, 0.7],
          [0.3, -0.5, 0.75],
        ]),
        this.quatTrack('RightForeArm', t, [
          [0, -0.3, -1.45],
          [0, -0.25, -1.4],
          [0, -0.3, -1.45],
          [0, -0.25, -1.4],
          [0, -0.3, -1.45],
        ]),
        // Staggered leg combat base
        this.quatTrack('LeftUpLeg', t, [
          [-0.2, 0.1, 0.1],
          [-0.22, 0.1, 0.1],
          [-0.2, 0.1, 0.1],
          [-0.22, 0.1, 0.1],
          [-0.2, 0.1, 0.1],
        ]),
        this.quatTrack('LeftLeg', t, [
          [0.35, 0, 0],
          [0.38, 0, 0],
          [0.35, 0, 0],
          [0.38, 0, 0],
          [0.35, 0, 0],
        ]),
        this.quatTrack('RightUpLeg', t, [
          [0.2, -0.1, -0.1],
          [0.22, -0.1, -0.1],
          [0.2, -0.1, -0.1],
          [0.22, -0.1, -0.1],
          [0.2, -0.1, -0.1],
        ]),
        this.quatTrack('RightLeg', t, [
          [0.3, 0, 0],
          [0.34, 0, 0],
          [0.3, 0, 0],
          [0.34, 0, 0],
          [0.3, 0, 0],
        ]),
      ]);
    }

    // ==========================================
    // 2. BREATHING (Chest and shoulder heave)
    // ==========================================
    {
      const d = 2.0;
      const t = [0, 1.0, 2.0];
      clips['breathing'] = new THREE.AnimationClip('breathing', d, [
        this.quatTrack('Spine2', t, [
          [0, 0, 0],
          [0.08, 0, 0],
          [0, 0, 0],
        ]),
        this.quatTrack('LeftShoulder', t, [
          [0, 0, 0],
          [0.06, 0, -0.05],
          [0, 0, 0],
        ]),
        this.quatTrack('RightShoulder', t, [
          [0, 0, 0],
          [0.06, 0, 0.05],
          [0, 0, 0],
        ]),
      ]);
    }

    // ==========================================
    // 3. WALK FORWARD (Tactical stride)
    // ==========================================
    {
      const d = 0.9;
      const t = [0, 0.225, 0.45, 0.675, 0.9];
      clips['walk_fwd'] = new THREE.AnimationClip('walk_fwd', d, [
        this.posTrack('Hips', t, [
          [0, 0.96, 0],
          [0, 0.99, 0],
          [0, 0.96, 0],
          [0, 0.99, 0],
          [0, 0.96, 0],
        ]),
        this.quatTrack('Spine', t, [
          [0.15, 0.08, 0],
          [0.14, 0, 0],
          [0.15, -0.08, 0],
          [0.14, 0, 0],
          [0.15, 0.08, 0],
        ]),
        // Legs cycling
        this.quatTrack('LeftUpLeg', t, [
          [-0.65, 0, 0],
          [-0.1, 0, 0],
          [0.55, 0, 0],
          [0.1, 0, 0],
          [-0.65, 0, 0],
        ]),
        this.quatTrack('LeftLeg', t, [
          [0.2, 0, 0],
          [0.85, 0, 0],
          [0.15, 0, 0],
          [0.1, 0, 0],
          [0.2, 0, 0],
        ]),
        this.quatTrack('RightUpLeg', t, [
          [0.55, 0, 0],
          [0.1, 0, 0],
          [-0.65, 0, 0],
          [-0.1, 0, 0],
          [0.55, 0, 0],
        ]),
        this.quatTrack('RightLeg', t, [
          [0.15, 0, 0],
          [0.1, 0, 0],
          [0.2, 0, 0],
          [0.85, 0, 0],
          [0.15, 0, 0],
        ]),
        // Arms counter-pumping
        this.quatTrack('LeftArm', t, [
          [0.3, 0.3, -0.6],
          [0.5, 0.4, -0.7],
          [0.7, 0.5, -0.8],
          [0.5, 0.4, -0.7],
          [0.3, 0.3, -0.6],
        ]),
        this.quatTrack('RightArm', t, [
          [0.7, -0.4, 0.8],
          [0.5, -0.3, 0.7],
          [0.3, -0.2, 0.6],
          [0.5, -0.3, 0.7],
          [0.7, -0.4, 0.8],
        ]),
      ]);
    }

    // ==========================================
    // 4. WALK BACKWARD (Defensive backstep)
    // ==========================================
    {
      const d = 0.95;
      const t = [0, 0.237, 0.475, 0.712, 0.95];
      clips['walk_bwd'] = new THREE.AnimationClip('walk_bwd', d, [
        this.posTrack('Hips', t, [
          [0, 0.97, 0],
          [0, 0.99, 0],
          [0, 0.97, 0],
          [0, 0.99, 0],
          [0, 0.97, 0],
        ]),
        this.quatTrack('Spine', t, [
          [-0.06, 0.05, 0],
          [-0.05, 0, 0],
          [-0.06, -0.05, 0],
          [-0.05, 0, 0],
          [-0.06, 0.05, 0],
        ]),
        this.quatTrack('LeftUpLeg', t, [
          [0.45, 0, 0],
          [0.1, 0, 0],
          [-0.45, 0, 0],
          [-0.1, 0, 0],
          [0.45, 0, 0],
        ]),
        this.quatTrack('LeftLeg', t, [
          [0.2, 0, 0],
          [0.65, 0, 0],
          [0.15, 0, 0],
          [0.1, 0, 0],
          [0.2, 0, 0],
        ]),
        this.quatTrack('RightUpLeg', t, [
          [-0.45, 0, 0],
          [-0.1, 0, 0],
          [0.45, 0, 0],
          [0.1, 0, 0],
          [-0.45, 0, 0],
        ]),
        this.quatTrack('RightLeg', t, [
          [0.15, 0, 0],
          [0.1, 0, 0],
          [0.2, 0, 0],
          [0.65, 0, 0],
          [0.15, 0, 0],
        ]),
        // Guard held high and defensive
        this.quatTrack('LeftArm', t, [
          [0.55, 0.6, -0.85],
          [0.50, 0.55, -0.8],
          [0.55, 0.6, -0.85],
          [0.50, 0.55, -0.8],
          [0.55, 0.6, -0.85],
        ]),
        this.quatTrack('RightArm', t, [
          [0.45, -0.5, 0.8],
          [0.40, -0.45, 0.75],
          [0.45, -0.5, 0.8],
          [0.40, -0.45, 0.75],
          [0.45, -0.5, 0.8],
        ]),
      ]);
    }

    // ==========================================
    // 5. RUN (Forward aggressive sprint)
    // ==========================================
    {
      const d = 0.65;
      const t = [0, 0.162, 0.325, 0.487, 0.65];
      clips['run'] = new THREE.AnimationClip('run', d, [
        this.posTrack('Hips', t, [
          [0, 0.93, 0],
          [0, 0.98, 0],
          [0, 0.93, 0],
          [0, 0.98, 0],
          [0, 0.93, 0],
        ]),
        this.quatTrack('Spine', t, [
          [0.28, 0.12, 0],
          [0.25, 0, 0],
          [0.28, -0.12, 0],
          [0.25, 0, 0],
          [0.28, 0.12, 0],
        ]),
        // Deep sprint leg drive
        this.quatTrack('LeftUpLeg', t, [
          [-0.95, 0, 0],
          [-0.1, 0, 0],
          [0.75, 0, 0],
          [0.1, 0, 0],
          [-0.95, 0, 0],
        ]),
        this.quatTrack('LeftLeg', t, [
          [0.3, 0, 0],
          [1.25, 0, 0],
          [0.2, 0, 0],
          [0.1, 0, 0],
          [0.3, 0, 0],
        ]),
        this.quatTrack('RightUpLeg', t, [
          [0.75, 0, 0],
          [0.1, 0, 0],
          [-0.95, 0, 0],
          [-0.1, 0, 0],
          [0.75, 0, 0],
        ]),
        this.quatTrack('RightLeg', t, [
          [0.2, 0, 0],
          [0.1, 0, 0],
          [0.3, 0, 0],
          [1.25, 0, 0],
          [0.2, 0, 0],
        ]),
        // Powerful arm drive
        this.quatTrack('LeftArm', t, [
          [0.1, 0.3, -0.4],
          [0.6, 0.4, -0.7],
          [1.1, 0.5, -0.9],
          [0.6, 0.4, -0.7],
          [0.1, 0.3, -0.4],
        ]),
        this.quatTrack('RightArm', t, [
          [1.1, -0.5, 0.9],
          [0.6, -0.4, 0.7],
          [0.1, -0.3, 0.4],
          [0.6, -0.4, 0.7],
          [1.1, -0.5, 0.9],
        ]),
      ]);
    }

    // ==========================================
    // 6. JUMP (Ascent leaping pose)
    // ==========================================
    {
      const d = 0.5;
      const t = [0, 0.15, 0.5];
      clips['jump'] = new THREE.AnimationClip('jump', d, [
        this.posTrack('Hips', t, [
          [0, 0.94, 0],
          [0, 1.05, 0],
          [0, 1.02, 0],
        ]),
        this.quatTrack('Spine', t, [
          [-0.1, 0, 0],
          [0.15, 0, 0],
          [0.12, 0, 0],
        ]),
        this.quatTrack('LeftUpLeg', t, [
          [0.3, 0, 0],
          [-0.75, 0, 0],
          [-0.65, 0, 0],
        ]),
        this.quatTrack('LeftLeg', t, [
          [0.1, 0, 0],
          [1.15, 0, 0],
          [1.0, 0, 0],
        ]),
        this.quatTrack('RightUpLeg', t, [
          [0.35, 0, 0],
          [-0.55, 0, 0],
          [-0.45, 0, 0],
        ]),
        this.quatTrack('RightLeg', t, [
          [0.15, 0, 0],
          [0.95, 0, 0],
          [0.85, 0, 0],
        ]),
        this.quatTrack('LeftArm', t, [
          [0.2, 0, -0.5],
          [0.9, 0, -0.9],
          [0.7, 0, -0.7],
        ]),
        this.quatTrack('RightArm', t, [
          [0.2, 0, 0.5],
          [0.9, 0, 0.9],
          [0.7, 0, 0.7],
        ]),
      ]);
    }

    // ==========================================
    // 7. FALL (Airborne descent)
    // ==========================================
    {
      const d = 0.4;
      const t = [0, 0.4];
      clips['fall'] = new THREE.AnimationClip('fall', d, [
        this.quatTrack('Spine', t, [
          [0.12, 0, 0],
          [0.10, 0, 0],
        ]),
        this.quatTrack('LeftUpLeg', t, [
          [-0.45, 0, 0],
          [-0.35, 0, 0],
        ]),
        this.quatTrack('LeftLeg', t, [
          [0.75, 0, 0],
          [0.55, 0, 0],
        ]),
        this.quatTrack('RightUpLeg', t, [
          [-0.35, 0, 0],
          [-0.25, 0, 0],
        ]),
        this.quatTrack('RightLeg', t, [
          [0.65, 0, 0],
          [0.45, 0, 0],
        ]),
        this.quatTrack('LeftArm', t, [
          [0.5, 0, -0.6],
          [0.4, 0, -0.5],
        ]),
        this.quatTrack('RightArm', t, [
          [0.5, 0, 0.6],
          [0.4, 0, 0.5],
        ]),
      ]);
    }

    // ==========================================
    // 8. LAND (Landing shock absorption)
    // ==========================================
    {
      const d = 0.25;
      const t = [0, 0.1, 0.25];
      clips['land'] = new THREE.AnimationClip('land', d, [
        this.posTrack('Hips', t, [
          [0, 0.92, 0],
          [0, 0.78, 0],
          [0, 0.98, 0],
        ]),
        this.quatTrack('Spine', t, [
          [0.12, 0, 0],
          [0.35, 0, 0],
          [0.08, 0, 0],
        ]),
        this.quatTrack('LeftUpLeg', t, [
          [-0.2, 0, 0],
          [-0.75, 0, 0],
          [-0.2, 0, 0],
        ]),
        this.quatTrack('LeftLeg', t, [
          [0.35, 0, 0],
          [1.35, 0, 0],
          [0.35, 0, 0],
        ]),
        this.quatTrack('RightUpLeg', t, [
          [0.2, 0, 0],
          [-0.70, 0, 0],
          [0.2, 0, 0],
        ]),
        this.quatTrack('RightLeg', t, [
          [0.3, 0, 0],
          [1.30, 0, 0],
          [0.3, 0, 0],
        ]),
      ]);
    }

    // ==========================================
    // 9. CROUCH (Defensive low guard)
    // ==========================================
    {
      const d = 0.5;
      const t = [0, 0.5];
      clips['crouch'] = new THREE.AnimationClip('crouch', d, [
        this.posTrack('Hips', t, [
          [0, 0.62, 0],
          [0, 0.62, 0],
        ]),
        this.quatTrack('Spine', t, [
          [0.35, 0, 0],
          [0.35, 0, 0],
        ]),
        this.quatTrack('Head', t, [
          [-0.28, 0, 0],
          [-0.28, 0, 0],
        ]),
        this.quatTrack('LeftUpLeg', t, [
          [-0.9, 0, 0],
          [-0.9, 0, 0],
        ]),
        this.quatTrack('LeftLeg', t, [
          [1.45, 0, 0],
          [1.45, 0, 0],
        ]),
        this.quatTrack('RightUpLeg', t, [
          [-0.85, 0, 0],
          [-0.85, 0, 0],
        ]),
        this.quatTrack('RightLeg', t, [
          [1.40, 0, 0],
          [1.40, 0, 0],
        ]),
        this.quatTrack('LeftArm', t, [
          [0.75, 0.5, -0.8],
          [0.75, 0.5, -0.8],
        ]),
        this.quatTrack('RightArm', t, [
          [0.7, -0.4, 0.75],
          [0.7, -0.4, 0.75],
        ]),
      ]);
    }

    // ==========================================
    // 10. PUNCH LEFT (Snappy Lead Jab)
    // ==========================================
    {
      const d = 0.31;
      const t = [0, 0.07, 0.14, 0.31];
      clips['punch_left'] = new THREE.AnimationClip('punch_left', d, [
        this.quatTrack('Spine', t, [
          [0.08, 0.12, 0],
          [0.10, 0.35, 0],
          [0.10, 0.35, 0],
          [0.08, 0.12, 0],
        ]),
        this.quatTrack('Spine2', t, [
          [0.06, 0.08, 0],
          [0.08, 0.40, 0],
          [0.08, 0.40, 0],
          [0.06, 0.08, 0],
        ]),
        // Lead arm snaps straight forward
        this.quatTrack('LeftShoulder', t, [
          [0, 0, 0],
          [0.15, 0.3, 0],
          [0.15, 0.3, 0],
          [0, 0, 0],
        ]),
        this.quatTrack('LeftArm', t, [
          [0.4, 0.6, -0.8],
          [0.95, 0.1, -0.15],
          [0.95, 0.1, -0.15],
          [0.4, 0.6, -0.8],
        ]),
        this.quatTrack('LeftForeArm', t, [
          [0, 0.4, 1.4],
          [0, 0.05, 0.15],
          [0, 0.05, 0.15],
          [0, 0.4, 1.4],
        ]),
        // Rear arm tight guard
        this.quatTrack('RightArm', t, [
          [0.3, -0.5, 0.75],
          [0.4, -0.6, 0.85],
          [0.4, -0.6, 0.85],
          [0.3, -0.5, 0.75],
        ]),
      ]);
    }

    // ==========================================
    // 11. PUNCH RIGHT (Rear Straight Cross)
    // ==========================================
    {
      const d = 0.42;
      const t = [0, 0.11, 0.22, 0.42];
      clips['punch_right'] = new THREE.AnimationClip('punch_right', d, [
        this.posTrack('Hips', t, [
          [0, 0.98, 0],
          [0.05, 0.96, 0],
          [0.05, 0.96, 0],
          [0, 0.98, 0],
        ]),
        this.quatTrack('Spine', t, [
          [0.08, 0.12, 0],
          [0.14, -0.45, 0],
          [0.14, -0.45, 0],
          [0.08, 0.12, 0],
        ]),
        this.quatTrack('Spine2', t, [
          [0.06, 0.08, 0],
          [0.12, -0.55, 0],
          [0.12, -0.55, 0],
          [0.06, 0.08, 0],
        ]),
        // Rear arm drives forward with torque
        this.quatTrack('RightShoulder', t, [
          [0, 0, 0],
          [0.2, -0.35, 0],
          [0.2, -0.35, 0],
          [0, 0, 0],
        ]),
        this.quatTrack('RightArm', t, [
          [0.3, -0.5, 0.75],
          [0.98, -0.1, 0.12],
          [0.98, -0.1, 0.12],
          [0.3, -0.5, 0.75],
        ]),
        this.quatTrack('RightForeArm', t, [
          [0, -0.3, -1.45],
          [0, -0.05, -0.15],
          [0, -0.05, -0.15],
          [0, -0.3, -1.45],
        ]),
        // Pivot back foot
        this.quatTrack('RightUpLeg', t, [
          [0.2, -0.1, -0.1],
          [0.35, -0.3, 0.2],
          [0.35, -0.3, 0.2],
          [0.2, -0.1, -0.1],
        ]),
      ]);
    }

    // ==========================================
    // 12. PUNCH HEAVY (Overhand Power Smash)
    // ==========================================
    {
      const d = 0.55;
      const t = [0, 0.16, 0.28, 0.55];
      clips['punch_heavy'] = new THREE.AnimationClip('punch_heavy', d, [
        this.posTrack('Hips', t, [
          [0, 0.98, 0],
          [0.08, 0.94, 0],
          [0.08, 0.94, 0],
          [0, 0.98, 0],
        ]),
        this.quatTrack('Spine', t, [
          [0.08, 0, 0],
          [0.25, -0.6, 0],
          [0.25, -0.6, 0],
          [0.08, 0, 0],
        ]),
        this.quatTrack('RightArm', t, [
          [0.3, -0.5, 0.75],
          [1.35, -0.2, 0.25],
          [1.35, -0.2, 0.25],
          [0.3, -0.5, 0.75],
        ]),
        this.quatTrack('RightForeArm', t, [
          [0, -0.3, -1.45],
          [0, -0.1, -0.2],
          [0, -0.1, -0.2],
          [0, -0.3, -1.45],
        ]),
      ]);
    }

    // ==========================================
    // 13. KICK FRONT (Front Snap Kick)
    // ==========================================
    {
      const d = 0.44;
      const t = [0, 0.12, 0.22, 0.44];
      clips['kick_front'] = new THREE.AnimationClip('kick_front', d, [
        this.posTrack('Hips', t, [
          [0, 0.98, 0],
          [-0.04, 0.97, 0],
          [-0.04, 0.97, 0],
          [0, 0.98, 0],
        ]),
        this.quatTrack('Spine', t, [
          [0.08, 0, 0],
          [-0.22, 0, 0],
          [-0.22, 0, 0],
          [0.08, 0, 0],
        ]),
        // Right leg snaps forward
        this.quatTrack('RightUpLeg', t, [
          [0.2, -0.1, -0.1],
          [-1.45, 0, 0],
          [-1.45, 0, 0],
          [0.2, -0.1, -0.1],
        ]),
        this.quatTrack('RightLeg', t, [
          [0.3, 0, 0],
          [0.1, 0, 0],
          [0.1, 0, 0],
          [0.3, 0, 0],
        ]),
        this.quatTrack('LeftUpLeg', t, [
          [-0.2, 0.1, 0.1],
          [0.15, 0, 0],
          [0.15, 0, 0],
          [-0.2, 0.1, 0.1],
        ]),
      ]);
    }

    // ==========================================
    // 14. KICK HIGH (Roundhouse Kick)
    // ==========================================
    {
      const d = 0.56;
      const t = [0, 0.16, 0.30, 0.56];
      clips['kick_high'] = new THREE.AnimationClip('kick_high', d, [
        this.posTrack('Hips', t, [
          [0, 0.98, 0],
          [0, 0.96, 0],
          [0, 0.96, 0],
          [0, 0.98, 0],
        ]),
        this.quatTrack('Spine', t, [
          [0.08, 0, 0],
          [-0.35, 0.2, -0.45],
          [-0.35, 0.2, -0.45],
          [0.08, 0, 0],
        ]),
        // Right leg high roundhouse arc
        this.quatTrack('RightUpLeg', t, [
          [0.2, -0.1, -0.1],
          [-1.75, -0.3, 0.45],
          [-1.75, -0.3, 0.45],
          [0.2, -0.1, -0.1],
        ]),
        this.quatTrack('RightLeg', t, [
          [0.3, 0, 0],
          [0.15, 0, 0],
          [0.15, 0, 0],
          [0.3, 0, 0],
        ]),
      ]);
    }

    // ==========================================
    // 15. KICK LOW (Low Shin Sweep)
    // ==========================================
    {
      const d = 0.48;
      const t = [0, 0.14, 0.26, 0.48];
      clips['kick_low'] = new THREE.AnimationClip('kick_low', d, [
        this.posTrack('Hips', t, [
          [0, 0.98, 0],
          [0, 0.72, 0],
          [0, 0.72, 0],
          [0, 0.98, 0],
        ]),
        this.quatTrack('Spine', t, [
          [0.08, 0, 0],
          [0.35, 0, 0],
          [0.35, 0, 0],
          [0.08, 0, 0],
        ]),
        this.quatTrack('RightUpLeg', t, [
          [0.2, 0, 0],
          [-1.1, -0.2, 0],
          [-1.1, -0.2, 0],
          [0.2, 0, 0],
        ]),
        this.quatTrack('RightLeg', t, [
          [0.3, 0, 0],
          [0.15, 0, 0],
          [0.15, 0, 0],
          [0.3, 0, 0],
        ]),
        this.quatTrack('LeftUpLeg', t, [
          [-0.2, 0, 0],
          [-0.85, 0, 0],
          [-0.85, 0, 0],
          [-0.2, 0, 0],
        ]),
        this.quatTrack('LeftLeg', t, [
          [0.35, 0, 0],
          [1.4, 0, 0],
          [1.4, 0, 0],
          [0.35, 0, 0],
        ]),
      ]);
    }

    // ==========================================
    // 16. BLOCK / GUARD
    // ==========================================
    {
      const d = 0.4;
      const t = [0, 0.4];
      clips['block'] = new THREE.AnimationClip('block', d, [
        this.posTrack('Hips', t, [
          [0, 0.92, 0],
          [0, 0.92, 0],
        ]),
        this.quatTrack('Spine', t, [
          [0.18, 0, 0],
          [0.18, 0, 0],
        ]),
        // Crossed forearms high guard
        this.quatTrack('LeftArm', t, [
          [0.85, 0.4, -0.55],
          [0.85, 0.4, -0.55],
        ]),
        this.quatTrack('LeftForeArm', t, [
          [0, 0.25, 1.85],
          [0, 0.25, 1.85],
        ]),
        this.quatTrack('RightArm', t, [
          [0.85, -0.4, 0.55],
          [0.85, -0.4, 0.55],
        ]),
        this.quatTrack('RightForeArm', t, [
          [0, -0.25, -1.85],
          [0, -0.25, -1.85],
        ]),
        this.quatTrack('LeftUpLeg', t, [
          [-0.35, 0, 0],
          [-0.35, 0, 0],
        ]),
        this.quatTrack('LeftLeg', t, [
          [0.55, 0, 0],
          [0.55, 0, 0],
        ]),
        this.quatTrack('RightUpLeg', t, [
          [0.35, 0, 0],
          [0.35, 0, 0],
        ]),
        this.quatTrack('RightLeg', t, [
          [0.55, 0, 0],
          [0.55, 0, 0],
        ]),
      ]);
    }

    // ==========================================
    // 17. HIT REACTION (Snappy Recoil)
    // ==========================================
    {
      const d = 0.32;
      const t = [0, 0.08, 0.18, 0.32];
      clips['hit_reaction'] = new THREE.AnimationClip('hit_reaction', d, [
        this.posTrack('Hips', t, [
          [0, 0.98, 0],
          [-0.06, 0.95, 0],
          [-0.04, 0.96, 0],
          [0, 0.98, 0],
        ]),
        this.quatTrack('Spine', t, [
          [0.08, 0, 0],
          [-0.45, 0, 0],
          [-0.25, 0, 0],
          [0.08, 0, 0],
        ]),
        this.quatTrack('Head', t, [
          [-0.08, 0, 0],
          [0.45, 0.15, 0],
          [0.20, 0.05, 0],
          [-0.08, 0, 0],
        ]),
        this.quatTrack('LeftArm', t, [
          [0.4, 0.6, -0.8],
          [-0.25, 0, -0.6],
          [0.1, 0, -0.7],
          [0.4, 0.6, -0.8],
        ]),
        this.quatTrack('RightArm', t, [
          [0.3, -0.5, 0.75],
          [-0.25, 0, 0.6],
          [0.1, 0, 0.7],
          [0.3, -0.5, 0.75],
        ]),
      ]);
    }

    // ==========================================
    // 18. KNOCKBACK (Heavy impact stumble)
    // ==========================================
    {
      const d = 0.65;
      const t = [0, 0.15, 0.40, 0.65];
      clips['knockback'] = new THREE.AnimationClip('knockback', d, [
        this.posTrack('Hips', t, [
          [0, 0.98, 0],
          [-0.25, 0.90, 0],
          [-0.15, 0.94, 0],
          [0, 0.98, 0],
        ]),
        this.quatTrack('Spine', t, [
          [0.08, 0, 0],
          [-0.65, 0, 0],
          [-0.35, 0, 0],
          [0.08, 0, 0],
        ]),
        this.quatTrack('Head', t, [
          [0, 0, 0],
          [0.6, 0, 0],
          [0.2, 0, 0],
          [0, 0, 0],
        ]),
      ]);
    }

    // ==========================================
    // 19. STAGGER (Dazed unsteady reel)
    // ==========================================
    {
      const d = 0.85;
      const t = [0, 0.25, 0.55, 0.85];
      clips['stagger'] = new THREE.AnimationClip('stagger', d, [
        this.posTrack('Hips', t, [
          [0, 0.98, 0],
          [-0.08, 0.94, 0],
          [0.04, 0.95, 0],
          [0, 0.98, 0],
        ]),
        this.quatTrack('Spine', t, [
          [0, 0, 0],
          [-0.3, 0.15, 0.1],
          [0.1, -0.15, -0.1],
          [0.08, 0, 0],
        ]),
        this.quatTrack('Head', t, [
          [0, 0, 0],
          [0.35, -0.2, 0],
          [-0.2, 0.2, 0],
          [0, 0, 0],
        ]),
      ]);
    }

    // ==========================================
    // 20. VICTORY (Triumphant victory pose)
    // ==========================================
    {
      const d = 1.8;
      const t = [0, 0.6, 1.2, 1.8];
      clips['victory'] = new THREE.AnimationClip('victory', d, [
        this.posTrack('Hips', t, [
          [0, 0.98, 0],
          [0, 1.02, 0],
          [0, 1.00, 0],
          [0, 1.00, 0],
        ]),
        this.quatTrack('Spine', t, [
          [0.08, 0, 0],
          [-0.15, 0, 0],
          [-0.10, 0, 0],
          [-0.10, 0, 0],
        ]),
        // Raised victory fist
        this.quatTrack('LeftArm', t, [
          [0.4, 0.6, -0.8],
          [1.55, 0.1, -0.3],
          [1.55, 0.1, -0.3],
          [1.55, 0.1, -0.3],
        ]),
        this.quatTrack('LeftForeArm', t, [
          [0, 0.4, 1.4],
          [0, 0.1, 0.4],
          [0, 0.1, 0.4],
          [0, 0.1, 0.4],
        ]),
        this.quatTrack('RightArm', t, [
          [0.3, -0.5, 0.75],
          [-0.2, -0.3, 0.5],
          [-0.2, -0.3, 0.5],
          [-0.2, -0.3, 0.5],
        ]),
      ]);
    }

    // ==========================================
    // 21. DEFEAT (Knockdown collapse)
    // ==========================================
    {
      const d = 1.2;
      const t = [0, 0.4, 0.8, 1.2];
      clips['defeat'] = new THREE.AnimationClip('defeat', d, [
        this.posTrack('Hips', t, [
          [0, 0.98, 0],
          [-0.3, 0.55, 0],
          [-0.6, 0.20, 0],
          [-0.6, 0.16, 0],
        ]),
        this.quatTrack('Spine', t, [
          [0.08, 0, 0],
          [-0.8, 0, 0],
          [-1.45, 0, 0],
          [-1.5, 0, 0],
        ]),
        this.quatTrack('LeftUpLeg', t, [
          [-0.2, 0, 0],
          [0.4, 0, 0],
          [0.6, 0, 0],
          [0.6, 0, 0],
        ]),
        this.quatTrack('RightUpLeg', t, [
          [0.2, 0, 0],
          [0.5, 0, 0],
          [0.7, 0, 0],
          [0.7, 0, 0],
        ]),
      ]);
    }

    return clips as Record<AnimationName, THREE.AnimationClip>;
  }
}
