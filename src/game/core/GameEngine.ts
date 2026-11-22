// src/game/core/GameEngine.ts
// ARENA X — PURE 2D HTML5 CANVAS 2.5D FIGHTING ENGINE

import { GameMode, GameSettings, GameState, MatchState, PlayerId } from '../../types';
import { GAME_CONFIG } from '../../config/gameConfig';
import { InputManager } from '../controls/InputManager';
import { soundManager } from './SoundManager';
import { ParallaxArena2D } from '../2d/ParallaxArena2D';
import { AnimeFighter2D, Hitbox2D, Hurtbox2D } from '../2d/AnimeFighter2D';
import { VFXManager2D } from '../2d/VFXManager2D';
import { Projectile2D } from '../2d/Projectile2D';
import { FightCamera2D } from '../engine/FightCamera2D';
import { Renderer2D } from '../engine/Renderer2D';
import { WorldCoordinateSystem } from '../engine/WorldCoordinateSystem';
import { CombatEngine } from '../combat/CombatEngine';

export interface GameEngineCallbacks {
  onMatchStateUpdate: (state: MatchState) => void;
  onFightersUpdate: (p1: AnimeFighter2D, p2: AnimeFighter2D) => void;
  onGameStateChange: (state: GameState) => void;
  onFpsUpdate?: (fps: number) => void;
}

export class GameEngine {
  private container: HTMLElement;
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  public inputManager: InputManager;
  public fighterP1: AnimeFighter2D;
  public fighterP2: AnimeFighter2D;
  public arena: ParallaxArena2D;
  public vfx: VFXManager2D;
  public projectiles: Projectile2D[] = [];

  // Centralized 2D Engine Components
  public camera: FightCamera2D;
  public renderer2D: Renderer2D;

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

  // Combo Tracking
  private p1Combo = 0;
  private p2Combo = 0;
  private comboResetTimer = 0;

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

    // 1. Create HTML5 Canvas 2D
    this.canvas = document.createElement('canvas');
    this.canvas.className = 'arena-canvas-2d';
    this.canvas.style.width = '100%';
    this.canvas.style.height = '100%';
    this.canvas.style.display = 'block';

    const ctx = this.canvas.getContext('2d', { alpha: false });
    if (!ctx) {
      throw new Error('Failed to create 2D canvas context');
    }
    this.ctx = ctx;
    container.appendChild(this.canvas);

    // 2. Initialize Subsystems & Centralized 2D Camera/Renderer
    this.inputManager = new InputManager();
    this.arena = new ParallaxArena2D();
    this.vfx = new VFXManager2D();
    this.camera = new FightCamera2D(1200, WorldCoordinateSystem.DEFAULT_CAM_Y);
    this.renderer2D = new Renderer2D(this.canvas, this.ctx, this.camera);

    // 3. Initialize Anime Fighters
    this.fighterP1 = new AnimeFighter2D('P1', 950, 1);
    this.fighterP2 = new AnimeFighter2D('P2', 1450, -1);

    // 4. Handle Window Resize
    this.handleResize();
    window.addEventListener('resize', this.handleResize);

    // 5. Start Round 1
    this.startRoundIntro(1);

    this.lastTime = performance.now();
    this.loop(this.lastTime);
  }

  public setGraphicsQuality(_quality: GameSettings['graphicsQuality']): void {
    // Canvas 2D operates automatically at high DPI
    this.handleResize();
  }

  private handleResize = (): void => {
    if (!this.container || !this.canvas) return;
    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    this.canvas.width = width * dpr;
    this.canvas.height = height * dpr;
    this.ctx.scale(dpr, dpr);
  };

  private startRoundIntro(roundNumber: number): void {
    this.matchState.round = roundNumber;
    this.matchState.timeRemaining = GAME_CONFIG.MATCH.ROUND_DURATION;
    this.matchState.announcement = `ROUND ${roundNumber}`;
    this.gameState = 'INTRO';
    this.callbacks.onGameStateChange(this.gameState);
    this.callbacks.onMatchStateUpdate({ ...this.matchState });

    // Reset Fighters to starting coordinates
    this.fighterP1.reset(950, 1);
    this.fighterP2.reset(1450, -1);
    this.projectiles = [];
    this.p1Combo = 0;
    this.p2Combo = 0;
    this.roundTransitionTimer = 1.6;

    soundManager.playRoundStartGong();
  }

  private loop = (currentTime: number): void => {
    this.animationFrameId = requestAnimationFrame(this.loop);

    const deltaTime = Math.min((currentTime - this.lastTime) / 1000, 0.08);
    this.lastTime = currentTime;

    // FPS Meter
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
      this.render();
      return;
    }

    // Process Hit Freeze (Hitstop for combat impact)
    if (this.hitFreezeTimer > 0) {
      this.hitFreezeTimer -= deltaTime;
      this.render();
      return;
    }

    this.update(deltaTime);
    this.render();
  };

  private update(deltaTime: number): void {
    // 1. Intro sequence transition
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
        // Training Dummy: keeps facing player
        const dir = this.fighterP1.x > this.fighterP2.x ? 1 : -1;
        if (this.fighterP2.facing !== dir) {
          this.fighterP2.facing = dir;
        }
      }
    }

    // 4. Update Fighters
    this.fighterP1.update(deltaTime, this.fighterP2);
    this.fighterP2.update(deltaTime, this.fighterP1);

    // Spawn any pending projectiles from special attacks
    if (this.fighterP1.pendingProjectile) {
      this.projectiles.push(this.fighterP1.pendingProjectile);
      this.fighterP1.pendingProjectile = null;
    }
    if (this.fighterP2.pendingProjectile) {
      this.projectiles.push(this.fighterP2.pendingProjectile);
      this.fighterP2.pendingProjectile = null;
    }

    // 5. Update Projectiles
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.update(deltaTime);
      if (p.isDestroyed) {
        this.projectiles.splice(i, 1);
        continue;
      }

      // Projectile collision with opponent
      const target = p.owner === 'P1' ? this.fighterP2 : this.fighterP1;
      const hurt = target.getHurtbox();
      if (this.checkPointInBox(p.x, p.y, hurt) && !hurt.isInvulnerable) {
        const isBlocked = target.state === 'BLOCK' && target.facing !== (p.vx > 0 ? 1 : -1);
        if (isBlocked) {
          const chip = Math.max(1, Math.round(p.damage * 0.15));
          target.currentHealth = Math.max(0, target.currentHealth - chip);
          target.guardMeter = Math.max(0, target.guardMeter - 30);
          target.guardStunTimer = 0.25;
          this.vfx.spawnBlockSpark(p.x, p.y);
          soundManager.playBlockClank();
          this.hitFreezeTimer = 0.05;
        } else {
          target.takeHit(p.damage, 260, false, p.vx > 0 ? 1 : -1);
          this.vfx.spawnHitSpark(p.x, p.y, p.owner === 'P1' ? '#ff3366' : '#00f0ff', 64);
          soundManager.playPunchHit();
          this.addScreenShake(12, 0.3);
          this.hitFreezeTimer = 0.08;
        }

        p.isDestroyed = true;
        this.projectiles.splice(i, 1);

        if (target.currentHealth <= 0) {
          this.handleKnockout(p.owner);
        }
      }
    }

    // 6. Combat Attack Resolution (Hitbox vs Hurtbox)
    if (this.gameState === 'FIGHTING') {
      this.resolveCombatAttacks();
    }

    // 7. Update Parallax Arena & VFX
    this.arena.update(deltaTime);
    this.vfx.update(deltaTime);

    // 8. Update Camera Tracking & Viewport Boundary Clamping
    this.updateCamera(deltaTime);
    this.enforceViewportAndStageBounds();

    // 9. Combo Decay Timer
    if (this.comboResetTimer > 0) {
      this.comboResetTimer -= deltaTime;
      if (this.comboResetTimer <= 0) {
        this.p1Combo = 0;
        this.p2Combo = 0;
      }
    }

    // 10. Round Over / Transition
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

    // 11. Send State Updates to React HUD
    this.callbacks.onFightersUpdate(this.fighterP1, this.fighterP2);
    this.callbacks.onMatchStateUpdate({ ...this.matchState });
  }

  private resolveCombatAttacks(): void {
    // P1 attacking P2
    const p1Hitbox = this.fighterP1.getActiveHitbox();
    if (p1Hitbox) {
      const p2Hurtbox = this.fighterP2.getHurtbox();
      if (
        CombatEngine.checkCircleVsRect(
          p1Hitbox.x,
          p1Hitbox.y,
          p1Hitbox.radius,
          p2Hurtbox.x,
          p2Hurtbox.y,
          p2Hurtbox.width,
          p2Hurtbox.height
        )
      ) {
        this.fighterP1.hasHitCurrentAttack = true;
        const res = CombatEngine.resolveAttackHit(
          p1Hitbox,
          p2Hurtbox,
          this.fighterP2.state,
          this.fighterP2.state === 'CROUCH' || this.fighterP2.animController.currentAnimKey === 'blockCrouch',
          this.fighterP2.facing,
          this.fighterP2.guardMeter
        );

        if (res.hitConnected) {
          this.fighterP2.applyHitResult(res, this.fighterP1.facing);
          this.hitFreezeTimer = res.hitFreezeTime;
          this.addScreenShake(res.screenShakeIntensity, res.screenShakeDuration);

          if (res.isBlocked) {
            this.vfx.spawnBlockSpark(p1Hitbox.x, p1Hitbox.y);
            soundManager.playBlockClank();
          } else {
            // Clean hit!
            this.fighterP1.canCancelIntoSpecial = true;
            const isPunch = p1Hitbox.type.includes('PUNCH');
            this.vfx.spawnHitSpark(p1Hitbox.x, p1Hitbox.y, '#ff1a4b', isPunch ? 48 : 58);
            if (p1Hitbox.type === 'SPECIAL') soundManager.playSpecialAttack();
            else if (isPunch) soundManager.playPunchHit();
            else soundManager.playKickHit();

            // Combo chaining & tracking
            this.p1Combo++;
            this.comboResetTimer = 1.25;
            if (this.p1Combo >= 2) {
              this.vfx.spawnComboText(this.fighterP2.x, this.fighterP2.y - 120, this.p1Combo, true);
            }
          }

          if (this.fighterP2.currentHealth <= 0) {
            this.handleKnockout('P1');
          }
        }
      }
    }

    // P2 attacking P1
    const p2Hitbox = this.fighterP2.getActiveHitbox();
    if (p2Hitbox) {
      const p1Hurtbox = this.fighterP1.getHurtbox();
      if (
        CombatEngine.checkCircleVsRect(
          p2Hitbox.x,
          p2Hitbox.y,
          p2Hitbox.radius,
          p1Hurtbox.x,
          p1Hurtbox.y,
          p1Hurtbox.width,
          p1Hurtbox.height
        )
      ) {
        this.fighterP2.hasHitCurrentAttack = true;
        const res = CombatEngine.resolveAttackHit(
          p2Hitbox,
          p1Hurtbox,
          this.fighterP1.state,
          this.fighterP1.state === 'CROUCH' || this.fighterP1.animController.currentAnimKey === 'blockCrouch',
          this.fighterP1.facing,
          this.fighterP1.guardMeter
        );

        if (res.hitConnected) {
          this.fighterP1.applyHitResult(res, this.fighterP2.facing);
          this.hitFreezeTimer = res.hitFreezeTime;
          this.addScreenShake(res.screenShakeIntensity, res.screenShakeDuration);

          if (res.isBlocked) {
            this.vfx.spawnBlockSpark(p2Hitbox.x, p2Hitbox.y);
            soundManager.playBlockClank();
          } else {
            this.fighterP2.canCancelIntoSpecial = true;
            const isPunch = p2Hitbox.type.includes('PUNCH');
            this.vfx.spawnHitSpark(p2Hitbox.x, p2Hitbox.y, '#00b4ff', isPunch ? 48 : 58);
            if (p2Hitbox.type === 'SPECIAL') soundManager.playSpecialAttack();
            else if (isPunch) soundManager.playPunchHit();
            else soundManager.playKickHit();

            this.p2Combo++;
            this.comboResetTimer = 1.25;
            if (this.p2Combo >= 2) {
              this.vfx.spawnComboText(this.fighterP1.x, this.fighterP1.y - 120, this.p2Combo, false);
            }
          }

          if (this.fighterP1.currentHealth <= 0) {
            this.handleKnockout('P2');
          }
        }
      }
    }
  }

  private checkHitboxHurtbox(hitbox: Hitbox2D, hurtbox: Hurtbox2D): boolean {
    // Circle vs Rectangle collision
    const closestX = Math.max(hurtbox.x, Math.min(hitbox.x, hurtbox.x + hurtbox.width));
    const closestY = Math.max(hurtbox.y, Math.min(hitbox.y, hurtbox.y + hurtbox.height));
    const dx = hitbox.x - closestX;
    const dy = hitbox.y - closestY;
    return dx * dx + dy * dy < hitbox.radius * hitbox.radius;
  }

  private checkPointInBox(px: number, py: number, box: Hurtbox2D): boolean {
    return px >= box.x && px <= box.x + box.width && py >= box.y && py <= box.y + box.height;
  }

  private addScreenShake(intensity: number, duration: number): void {
    this.camera.addShake(intensity, duration);
  }

  private updateCamera(dt: number): void {
    const width = this.canvas.width / Math.min(window.devicePixelRatio || 1, 2);
    const height = this.canvas.height / Math.min(window.devicePixelRatio || 1, 2);
    this.camera.update(
      dt,
      this.fighterP1.x,
      this.fighterP1.y,
      this.fighterP2.x,
      this.fighterP2.y,
      width,
      height
    );
  }

  /**
   * Enforces fighting-game screen edge boundaries ("corner walls")
   * to guarantee neither fighter is ever pushed or walks off-screen.
   */
  private enforceViewportAndStageBounds(): void {
    const width = this.canvas.width / Math.min(window.devicePixelRatio || 1, 2);
    const height = this.canvas.height / Math.min(window.devicePixelRatio || 1, 2);
    const bounds = this.camera.getVisibleWorldBounds(width, height);

    // Generous side margin (in world space) so full body, limbs, and combat poses
    // never get clipped by the viewport edges
    const margin = 95;

    const minAllowedX = Math.max(WorldCoordinateSystem.STAGE_BOUND_LEFT + margin, bounds.minX + margin);
    const maxAllowedX = Math.min(WorldCoordinateSystem.STAGE_BOUND_RIGHT - margin, bounds.maxX - margin);

    // Screen edge wall clamping
    if (this.fighterP1.x < minAllowedX) this.fighterP1.x = minAllowedX;
    if (this.fighterP1.x > maxAllowedX) this.fighterP1.x = maxAllowedX;

    if (this.fighterP2.x < minAllowedX) this.fighterP2.x = minAllowedX;
    if (this.fighterP2.x > maxAllowedX) this.fighterP2.x = maxAllowedX;

    // Corner wall pushbox collision: prevent fighters from overlapping when pushed into corner
    const dist = this.fighterP2.x - this.fighterP1.x;
    const minSeparation = 72;
    if (Math.abs(dist) < minSeparation) {
      if (this.fighterP1.x <= minAllowedX + 2) {
        this.fighterP2.x = minAllowedX + minSeparation;
      } else if (this.fighterP2.x >= maxAllowedX - 2) {
        this.fighterP1.x = maxAllowedX - minSeparation;
      } else {
        const overlap = minSeparation - Math.abs(dist);
        const sign = dist >= 0 ? 1 : -1;
        this.fighterP1.x -= sign * (overlap * 0.5);
        this.fighterP2.x += sign * (overlap * 0.5);
      }
    }
  }

  private handleKnockout(winner: PlayerId): void {
    this.gameState = 'ROUND_OVER';
    soundManager.playKOGong();
    this.addScreenShake(18, 0.45);
    this.vfx.triggerScreenFlash('#ffffff', 0.65);

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

  private render(): void {
    const width = this.canvas.width / Math.min(window.devicePixelRatio || 1, 2);
    const height = this.canvas.height / Math.min(window.devicePixelRatio || 1, 2);

    this.ctx.clearRect(0, 0, width, height);

    // Centralized 10-layer rendering execution
    this.renderer2D.render(
      width,
      height,
      this.arena,
      this.fighterP1,
      this.fighterP2,
      this.projectiles,
      this.vfx,
      this.settings.showHitboxes
    );
  }

  public toggleHitboxes(): boolean {
    this.settings.showHitboxes = !this.settings.showHitboxes;
    return this.settings.showHitboxes;
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

    if (this.canvas && this.canvas.parentNode) {
      this.canvas.parentNode.removeChild(this.canvas);
    }
  }
}
