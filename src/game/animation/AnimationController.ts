// src/game/animation/AnimationController.ts
// CENTRALIZED 2D FIGHTING ANIMATION CONTROLLER

import { AnimationDefinition, CharacterAnimationSet, HitboxTimingData } from './AnimationConfig';

export interface ActiveHitboxInfo {
  isActive: boolean;
  frameIndex: number;
  data: HitboxTimingData | null;
}

export class AnimationController {
  private animationSet: CharacterAnimationSet;
  public currentAnim: AnimationDefinition;
  public frameIndex = 0;
  public animTime = 0;
  public isCompleted = false;
  public speedMultiplier = 1.0;

  // Hitbox activation tracking
  private hasDealtHitInCurrentCycle = false;

  constructor(animationSet: CharacterAnimationSet) {
    this.animationSet = animationSet;
    this.currentAnim = animationSet.idle;
  }

  /**
   * Switches to a new animation if priority allows or if forced (e.g. on hit or KO).
   */
  public play(
    animKey: keyof CharacterAnimationSet,
    force = false,
    speedMultiplier = 1.0
  ): boolean {
    const target = this.animationSet[animKey];
    if (!target) return false;

    // Check if the current animation is an active non-looping animation of higher priority
    if (!force && !this.isCompleted && !this.currentAnim.loop) {
      if (this.currentAnim.priority > target.priority) {
        return false; // Lower priority cannot interrupt
      }
    }

    // Do not restart if already playing this looping animation
    if (this.currentAnim.name === target.name && target.loop && !this.isCompleted) {
      return true;
    }

    this.currentAnim = target;
    this.frameIndex = 0;
    this.animTime = 0;
    this.isCompleted = false;
    this.speedMultiplier = speedMultiplier;
    this.hasDealtHitInCurrentCycle = false;
    return true;
  }

  /**
   * Advances the animation timer and computes current frame.
   */
  public update(dt: number): void {
    if (this.isCompleted && !this.currentAnim.loop && this.currentAnim.holdLastFrame) {
      this.frameIndex = this.currentAnim.framesMax - 1;
      return;
    }

    this.animTime += dt * this.speedMultiplier;
    const effectiveFps = this.currentAnim.frameRate;
    const rawFrame = Math.floor(this.animTime * effectiveFps);

    if (this.currentAnim.loop) {
      this.frameIndex = rawFrame % this.currentAnim.framesMax;
    } else {
      if (rawFrame >= this.currentAnim.framesMax) {
        this.isCompleted = true;
        this.frameIndex = this.currentAnim.holdLastFrame
          ? this.currentAnim.framesMax - 1
          : 0;
      } else {
        this.frameIndex = rawFrame;
      }
    }
  }

  /**
   * Returns whether the attack hitbox is active on the current frame.
   */
  public getHitboxInfo(): ActiveHitboxInfo {
    const timing = this.currentAnim.hitboxTiming;
    if (!timing) {
      return { isActive: false, frameIndex: this.frameIndex, data: null };
    }

    const startActive = timing.startupFrames;
    const endActive = timing.startupFrames + timing.activeFrames;
    const isActive = this.frameIndex >= startActive && this.frameIndex < endActive;

    return {
      isActive,
      frameIndex: this.frameIndex,
      data: timing,
    };
  }

  public markHitDealt(): void {
    this.hasDealtHitInCurrentCycle = true;
  }

  public canDealHit(): boolean {
    const info = this.getHitboxInfo();
    return info.isActive && !this.hasDealtHitInCurrentCycle;
  }

  public getCurrentFrame(): number {
    return this.frameIndex;
  }

  public isFinished(): boolean {
    return this.isCompleted;
  }
}
