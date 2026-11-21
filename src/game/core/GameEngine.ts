// src/game/core/GameEngine.ts
import * as THREE from 'three';
import { GameMode, GameSettings, GameState, MatchState, PlayerId } from '../../types';
import { GAME_CONFIG } from '../../config/gameConfig';
import { PhysicsWorld } from '../physics/PhysicsWorld';
import { Arena3D } from '../arena/Arena3D';
import { Fighter } from '../characters/Fighter';
import { FightCamera } from '../camera/FightCamera';
import { InputManager } from '../controls/InputManager';
import { ParticleSystem } from '../arena/ParticleSystem';
import { soundManager } from './SoundManager';

export interface GameEngineCallbacks {
  onMatchStateUpdate: (state: MatchState) => void;
  onFightersUpdate: (p1: Fighter, p2: Fighter) => void;
  onGameStateChange: (state: GameState) => void;
  onFpsUpdate?: (fps: number) => void;
}

export class GameEngine {
  private container: HTMLElement;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private cameraManager: FightCamera;
  private physics: PhysicsWorld;
  private arena: Arena3D;
  private particles: ParticleSystem;

  public fighterP1: Fighter;
  public fighterP2: Fighter;
  public inputManager: InputManager;

  private callbacks: GameEngineCallbacks;
  private settings: GameSettings;
  private gameMode: GameMode;
  public gameState: GameState = 'INTRO';

  private matchState: MatchState = {
    round: 1,
    timeRemaining: GAME_CONFIG.MATCH.ROUND_DURATION,
    p1RoundsWon: 0,
    p2RoundsWon: 0,
    winner: null,
    announcement: 'ROUND 1',
  };

  private animationFrameId: number | null = null;
  private lastTime = 0;
  private hitFreezeTimer = 0;
  private roundTransitionTimer = 0;

  // FPS tracking
  private frameCount = 0;
  private fpsTimer = 0;

  constructor(
    container: HTMLElement,
    settings: GameSettings,
    gameMode: GameMode,
    callbacks: GameEngineCallbacks
  ) {
    this.container = container;
    this.settings = settings;
    this.gameMode = gameMode;
    this.callbacks = callbacks;

    // 1. Three.js Scene & Fog
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x06080e, 0.025);

    // 2. WebGL Renderer
    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    this.renderer = new THREE.WebGLRenderer({
      antialias: settings.graphicsQuality !== 'low',
      powerPreference: 'high-performance',
      stencil: false,
    });
    this.renderer.setSize(width, height);
    this.setGraphicsQuality(settings.graphicsQuality);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    container.appendChild(this.renderer.domElement);

    // 3. Camera
    this.cameraManager = new FightCamera(width / height);

    // 4. Input & Sound
    this.inputManager = new InputManager();

    // 5. Physics & Environment
    this.physics = new PhysicsWorld();
    this.arena = new Arena3D();
    this.scene.add(this.arena.group);

    this.particles = new ParticleSystem();
    this.scene.add(this.particles.group);

    // 6. Fighters
    this.fighterP1 = new Fighter('P1');
    this.fighterP2 = new Fighter('P2');
    this.scene.add(this.fighterP1.modelRoot);
    this.scene.add(this.fighterP2.modelRoot);

    // 7. Event listeners
    window.addEventListener('resize', this.handleResize);

    // Start loading physics and then run loop
    this.initAsync();
  }

  private async initAsync(): Promise<void> {
    await this.physics.init();

    // Start intro sequence
    this.startRoundIntro(1);
    this.lastTime = performance.now();
    this.loop(this.lastTime);
  }

  public setGraphicsQuality(quality: GameSettings['graphicsQuality']): void {
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    const maxPr = quality === 'high' ? (isMobile ? 1.5 : 2.0) : quality === 'medium' ? 1.25 : 1.0;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, maxPr));

    if (quality === 'low') {
      this.renderer.shadowMap.enabled = false;
    } else {
      this.renderer.shadowMap.enabled = true;
      this.renderer.shadowMap.type = quality === 'high' ? THREE.PCFSoftShadowMap : THREE.PCFShadowMap;
    }
  }

  private handleResize = (): void => {
    if (!this.container || !this.renderer) return;
    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;
    this.renderer.setSize(width, height);
    this.cameraManager.setAspect(width / height);
  };

  private startRoundIntro(roundNumber: number): void {
    this.matchState.round = roundNumber;
    this.matchState.timeRemaining = GAME_CONFIG.MATCH.ROUND_DURATION;
    this.matchState.announcement = `ROUND ${roundNumber}`;
    this.gameState = 'INTRO';
    this.callbacks.onGameStateChange(this.gameState);
    this.callbacks.onMatchStateUpdate({ ...this.matchState });

    // Reset fighters
    this.fighterP1.reset(GAME_CONFIG.FIGHTERS.P1.spawnX, 1);
    this.fighterP2.reset(GAME_CONFIG.FIGHTERS.P2.spawnX, -1);
    this.roundTransitionTimer = 1.6;

    soundManager.playRoundStartGong();
  }

  private loop = (currentTime: number): void => {
    this.animationFrameId = requestAnimationFrame(this.loop);

    const deltaTime = Math.min((currentTime - this.lastTime) / 1000, 0.1);
    this.lastTime = currentTime;

    // Track FPS
    this.frameCount++;
    this.fpsTimer += deltaTime;
    if (this.fpsTimer >= 1.0) {
      if (this.callbacks.onFpsUpdate) {
        this.callbacks.onFpsUpdate(Math.round(this.frameCount / this.fpsTimer));
      }
      this.frameCount = 0;
      this.fpsTimer = 0;
    }

    if (this.gameState === 'PAUSED') {
      this.renderer.render(this.scene, this.cameraManager.camera);
      return;
    }

    // Process Hit Freeze (Hitstop)
    if (this.hitFreezeTimer > 0) {
      this.hitFreezeTimer -= deltaTime;
      this.renderer.render(this.scene, this.cameraManager.camera);
      return;
    }

    this.update(deltaTime);
    this.renderer.render(this.scene, this.cameraManager.camera);
  };

  private update(deltaTime: number): void {
    // 1. Intro announcement transition
    if (this.gameState === 'INTRO') {
      this.roundTransitionTimer -= deltaTime;
      if (this.roundTransitionTimer <= 0.8 && this.matchState.announcement !== 'FIGHT!') {
        this.matchState.announcement = 'FIGHT!';
        this.callbacks.onMatchStateUpdate({ ...this.matchState });
      }
      if (this.roundTransitionTimer <= 0) {
        this.gameState = 'FIGHTING';
        this.matchState.announcement = null;
        this.callbacks.onGameStateChange(this.gameState);
        this.callbacks.onMatchStateUpdate({ ...this.matchState });
      }
    }

    // 2. Round timer countdown in FIGHTING state
    if (this.gameState === 'FIGHTING') {
      this.matchState.timeRemaining = Math.max(0, this.matchState.timeRemaining - deltaTime);

      if (this.matchState.timeRemaining <= 0) {
        this.handleTimeOut();
      }
    }

    // 3. Process Player Inputs
    if (this.gameState === 'FIGHTING') {
      const p1Inputs = this.inputManager.getInputs('P1');
      this.fighterP1.handleInput(p1Inputs, this.fighterP2);

      if (this.gameMode === 'VERSUS') {
        const p2Inputs = this.inputManager.getInputs('P2');
        this.fighterP2.handleInput(p2Inputs, this.fighterP1);
      } else {
        // Training Dummy Mode: gentle defensive AI / idle
        this.updateTrainingDummy(deltaTime);
      }
    }

    // 4. Physics World Step
    this.physics.step(deltaTime);

    // 5. Update Fighters & Apply Movement
    this.fighterP1.update(deltaTime, this.fighterP2);
    this.fighterP2.update(deltaTime, this.fighterP1);

    // 6. Pushbox Collision (Separation)
    this.resolvePushboxCollision();

    // 7. Combat Attack Resolution (Hitbox vs Hurtbox)
    if (this.gameState === 'FIGHTING') {
      this.resolveCombatAttacks();
    }

    // 8. Round / Match Over Transition
    if (this.gameState === 'ROUND_OVER') {
      this.roundTransitionTimer -= deltaTime;
      if (this.roundTransitionTimer <= 0) {
        if (this.matchState.p1RoundsWon >= GAME_CONFIG.MATCH.ROUNDS_TO_WIN) {
          this.matchState.winner = 'P1';
          this.matchState.announcement = 'PLAYER 1 VICTORIOUS!';
          this.gameState = 'MATCH_OVER';
        } else if (this.matchState.p2RoundsWon >= GAME_CONFIG.MATCH.ROUNDS_TO_WIN) {
          this.matchState.winner = 'P2';
          this.matchState.announcement = 'PLAYER 2 VICTORIOUS!';
          this.gameState = 'MATCH_OVER';
        } else {
          // Next Round
          this.startRoundIntro(this.matchState.round + 1);
          return;
        }
        this.callbacks.onGameStateChange(this.gameState);
        this.callbacks.onMatchStateUpdate({ ...this.matchState });
      }
    }

    // 9. Update Arena, Particles & Camera
    this.arena.update(deltaTime, this.fighterP1.position.x, this.fighterP2.position.x);
    this.particles.update(deltaTime);
    this.cameraManager.update(deltaTime, this.fighterP1.position, this.fighterP2.position);

    // 10. Update HUD Callbacks
    this.callbacks.onFightersUpdate(this.fighterP1, this.fighterP2);
    this.callbacks.onMatchStateUpdate({ ...this.matchState });
  }

  private resolvePushboxCollision(): void {
    const p1Push = this.fighterP1.getPushbox();
    const p2Push = this.fighterP2.getPushbox();
    const dx = p2Push.x - p1Push.x;
    const minDist = p1Push.radius + p2Push.radius;

    if (Math.abs(dx) < minDist) {
      const overlap = minDist - Math.abs(dx);
      const sign = dx >= 0 ? 1 : -1;
      // Push each half of overlap away
      this.fighterP1.position.x -= sign * (overlap * 0.5);
      this.fighterP2.position.x += sign * (overlap * 0.5);
    }
  }

  private resolveCombatAttacks(): void {
    // Check P1 attacking P2
    const p1Hitbox = this.fighterP1.getActiveHitbox();
    if (p1Hitbox) {
      const p2Hurtbox = this.fighterP2.getHurtbox();
      if (this.checkHit(p1Hitbox, p2Hurtbox)) {
        this.fighterP1.hasHitCurrentAttack = true;
        const isBlocked = this.fighterP2.state === 'BLOCK' && this.fighterP2.facing !== this.fighterP1.facing;
        const cleanHit = this.fighterP2.takeHit(
          p1Hitbox.damage,
          p1Hitbox.knockback,
          isBlocked,
          this.fighterP1.facing
        );

        if (isBlocked) {
          this.particles.emitBlockSparks(p1Hitbox.x, p1Hitbox.y, 0);
          soundManager.playBlockClank();
          this.hitFreezeTimer = 0.04;
        } else {
          const isPunch = p1Hitbox.type.startsWith('PUNCH');
          const sparkColor = isPunch ? 0xff3355 : 0xff9900;
          this.particles.emitHitSparks(p1Hitbox.x, p1Hitbox.y, 0, sparkColor);
          if (isPunch) {
            soundManager.playPunchHit();
          } else {
            soundManager.playKickHit();
          }
          this.cameraManager.addScreenShake(isPunch ? 0.22 : 0.35, 0.18);
          this.hitFreezeTimer = GAME_CONFIG.MATCH.HIT_FREEZE_DURATION;
        }

        if (this.fighterP2.currentHealth <= 0) {
          this.handleKnockout('P1');
        }
      }
    }

    // Check P2 attacking P1
    const p2Hitbox = this.fighterP2.getActiveHitbox();
    if (p2Hitbox) {
      const p1Hurtbox = this.fighterP1.getHurtbox();
      if (this.checkHit(p2Hitbox, p1Hurtbox)) {
        this.fighterP2.hasHitCurrentAttack = true;
        const isBlocked = this.fighterP1.state === 'BLOCK' && this.fighterP1.facing !== this.fighterP2.facing;
        const cleanHit = this.fighterP1.takeHit(
          p2Hitbox.damage,
          p2Hitbox.knockback,
          isBlocked,
          this.fighterP2.facing
        );

        if (isBlocked) {
          this.particles.emitBlockSparks(p2Hitbox.x, p2Hitbox.y, 0);
          soundManager.playBlockClank();
          this.hitFreezeTimer = 0.04;
        } else {
          const isPunch = p2Hitbox.type.startsWith('PUNCH');
          const sparkColor = isPunch ? 0x00f0ff : 0x0088ff;
          this.particles.emitHitSparks(p2Hitbox.x, p2Hitbox.y, 0, sparkColor);
          if (isPunch) {
            soundManager.playPunchHit();
          } else {
            soundManager.playKickHit();
          }
          this.cameraManager.addScreenShake(isPunch ? 0.22 : 0.35, 0.18);
          this.hitFreezeTimer = GAME_CONFIG.MATCH.HIT_FREEZE_DURATION;
        }

        if (this.fighterP1.currentHealth <= 0) {
          this.handleKnockout('P2');
        }
      }
    }
  }

  private checkHit(
    hitbox: { x: number; y: number; radius: number },
    hurtbox: { x: number; y: number; width: number; height: number }
  ): boolean {
    // Circle vs AABB collision
    const closestX = Math.max(hurtbox.x, Math.min(hitbox.x, hurtbox.x + hurtbox.width));
    const closestY = Math.max(hurtbox.y, Math.min(hitbox.y, hurtbox.y + hurtbox.height));
    const distanceX = hitbox.x - closestX;
    const distanceY = hitbox.y - closestY;
    const distanceSquared = distanceX * distanceX + distanceY * distanceY;
    return distanceSquared < hitbox.radius * hitbox.radius;
  }

  private handleKnockout(winner: PlayerId): void {
    this.gameState = 'ROUND_OVER';
    soundManager.playKOGong();
    this.cameraManager.addScreenShake(0.45, 0.35);

    if (winner === 'P1') {
      this.matchState.p1RoundsWon++;
      this.matchState.announcement = 'K.O.! PLAYER 1 WINS ROUND';
      this.fighterP1.playVictory();
      this.fighterP2.playDefeat();
    } else {
      this.matchState.p2RoundsWon++;
      this.matchState.announcement = 'K.O.! PLAYER 2 WINS ROUND';
      this.fighterP2.playVictory();
      this.fighterP1.playDefeat();
    }

    this.roundTransitionTimer = 2.4;
    this.callbacks.onGameStateChange(this.gameState);
    this.callbacks.onMatchStateUpdate({ ...this.matchState });
  }

  private handleTimeOut(): void {
    this.gameState = 'ROUND_OVER';
    soundManager.playKOGong();

    if (this.fighterP1.currentHealth > this.fighterP2.currentHealth) {
      this.matchState.p1RoundsWon++;
      this.matchState.announcement = 'TIME UP! PLAYER 1 WINS';
      this.fighterP1.playVictory();
      this.fighterP2.playDefeat();
    } else if (this.fighterP2.currentHealth > this.fighterP1.currentHealth) {
      this.matchState.p2RoundsWon++;
      this.matchState.announcement = 'TIME UP! PLAYER 2 WINS';
      this.fighterP2.playVictory();
      this.fighterP1.playDefeat();
    } else {
      this.matchState.announcement = 'TIME UP! DRAW ROUND';
    }

    this.roundTransitionTimer = 2.4;
    this.callbacks.onGameStateChange(this.gameState);
    this.callbacks.onMatchStateUpdate({ ...this.matchState });
  }

  private updateTrainingDummy(deltaTime: number): void {
    // Face the player
    const dir = this.fighterP1.position.x > this.fighterP2.position.x ? 1 : -1;
    if (this.fighterP2.facing !== dir) {
      this.fighterP2.facing = dir;
    }
  }

  public restartMatch(): void {
    this.matchState = {
      round: 1,
      timeRemaining: GAME_CONFIG.MATCH.ROUND_DURATION,
      p1RoundsWon: 0,
      p2RoundsWon: 0,
      winner: null,
      announcement: 'ROUND 1',
    };
    this.startRoundIntro(1);
  }

  public pauseGame(): void {
    if (this.gameState === 'FIGHTING' || this.gameState === 'INTRO') {
      this.gameState = 'PAUSED';
      this.callbacks.onGameStateChange('PAUSED');
    }
  }

  public resumeGame(): void {
    if (this.gameState === 'PAUSED') {
      this.gameState = 'FIGHTING';
      this.callbacks.onGameStateChange('FIGHTING');
    }
  }

  public dispose(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    window.removeEventListener('resize', this.handleResize);

    this.inputManager.detach();
    this.fighterP1.dispose();
    this.fighterP2.dispose();
    this.arena.dispose();
    this.particles.dispose();
    this.physics.dispose();

    if (this.renderer) {
      this.renderer.dispose();
      if (this.renderer.domElement && this.renderer.domElement.parentNode) {
        this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
      }
    }
  }
}
