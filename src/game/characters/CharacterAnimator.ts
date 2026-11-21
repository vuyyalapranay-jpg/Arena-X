// src/game/characters/CharacterAnimator.ts
import * as THREE from 'three';
import { AnimationName, FighterState } from '../../types';
import { AnimationStateMachine } from './AnimationStateMachine';

export type AnimationFinishedCallback = (finishedState: FighterState) => void;

export class CharacterAnimator {
  public mixer: THREE.AnimationMixer;
  private actions: Map<AnimationName, THREE.AnimationAction> = new Map();
  private currentState: FighterState = 'IDLE';
  private currentAction: THREE.AnimationAction | null = null;
  private onFinishedCallback: AnimationFinishedCallback | null = null;
  private boundOnFinished: (e: any) => void;

  constructor(rootObject: THREE.Object3D, clips: Record<AnimationName, THREE.AnimationClip>) {
    this.mixer = new THREE.AnimationMixer(rootObject);

    // Instantiate actions for every clip
    for (const [name, clip] of Object.entries(clips) as [AnimationName, THREE.AnimationClip][]) {
      const action = this.mixer.clipAction(clip);
      this.actions.set(name, action);
    }

    this.boundOnFinished = this.handleAnimationFinished.bind(this);
    this.mixer.addEventListener('finished', this.boundOnFinished);

    // Start in IDLE
    this.playState('IDLE', true);
  }

  public setOnFinishedCallback(callback: AnimationFinishedCallback | null): void {
    this.onFinishedCallback = callback;
  }

  private handleAnimationFinished(e: any): void {
    const finishedClipName = e.action.getClip().name as AnimationName;
    const cfg = AnimationStateMachine.getConfig(this.currentState);

    if (cfg.clipName === finishedClipName) {
      if (this.onFinishedCallback) {
        this.onFinishedCallback(this.currentState);
      }
    }
  }

  public playState(newState: FighterState, force = false): boolean {
    if (!force && this.currentState === newState) {
      return false;
    }

    if (!force && !AnimationStateMachine.canTransition(this.currentState, newState)) {
      return false;
    }

    const nextConfig = AnimationStateMachine.getConfig(newState);
    const nextAction = this.actions.get(nextConfig.clipName);

    if (!nextAction) {
      console.warn(`Animation action not found for clip: ${nextConfig.clipName}`);
      return false;
    }

    const prevAction = this.currentAction;
    const fadeDuration = nextConfig.fadeDuration;

    nextAction.reset();
    nextAction.setEffectiveTimeScale(1);
    nextAction.setEffectiveWeight(1);
    nextAction.setLoop(nextConfig.loop, nextConfig.repetitions);
    nextAction.clampWhenFinished = nextConfig.loop === THREE.LoopOnce;

    if (prevAction && prevAction !== nextAction) {
      nextAction.crossFadeFrom(prevAction, fadeDuration, true);
    }

    nextAction.play();

    this.currentState = newState;
    this.currentAction = nextAction;
    return true;
  }

  public getCurrentState(): FighterState {
    return this.currentState;
  }

  public setPlaybackSpeed(speed: number): void {
    if (this.currentAction) {
      this.currentAction.setEffectiveTimeScale(speed);
    }
  }

  public update(deltaTime: number): void {
    this.mixer.update(deltaTime);
  }

  public dispose(): void {
    this.mixer.removeEventListener('finished', this.boundOnFinished);
    this.mixer.stopAllAction();
    this.actions.clear();
    this.currentAction = null;
  }
}
