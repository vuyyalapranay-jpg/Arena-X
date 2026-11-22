// server/rooms/ArenaFightRoom.ts
// AUTHORITATIVE MULTIPLAYER FIGHTING ROOM ENGINE FOR ARENA X

import { WebSocket } from 'ws';
import {
  OnlineCharacter,
  PlayerSlot,
  RoomMetadata,
  RoomVisibility,
  RoomStatus,
  SynchronizedPlayerState,
  SynchronizedProjectile,
  SynchronizedMatchState,
  FullRoomSnapshot,
  NetworkPlayerInput,
  ServerMessage,
} from '../types.js';

interface ConnectedClient {
  ws: WebSocket;
  sessionId: string;
  slot: PlayerSlot;
  lastPingTime: number;
}

export class ArenaFightRoom {
  public id: string;
  public code: string;
  public name: string;
  public visibility: RoomVisibility;
  public password?: string;
  public stage = 'CYBER_PAGODA';
  public status: RoomStatus = 'WAITING';
  public createdAt = Date.now();

  private clients = new Map<string, ConnectedClient>();
  private p1State: SynchronizedPlayerState | null = null;
  private p2State: SynchronizedPlayerState | null = null;
  private projectiles: SynchronizedProjectile[] = [];
  private p1Inputs: NetworkPlayerInput = this.createEmptyInput();
  private p2Inputs: NetworkPlayerInput = this.createEmptyInput();

  // Combat parameters
  private readonly GROUND_Y = 560;
  private readonly STAGE_LEFT = 320;
  private readonly STAGE_RIGHT = 2080;
  private roundTimeRemaining = 99;
  private currentRound = 1;
  private roundOverTimer = 0;
  private roundIntroTimer = 2.0;
  private announcement: string | null = 'ROUND 1';
  private winner: PlayerSlot | null = null;

  // Authoritative 60Hz loop
  private tickInterval: NodeJS.Timeout | null = null;
  private readonly TICK_RATE = 60;
  private readonly DT = 1 / 60;
  private isDisposed = false;

  constructor(
    id: string,
    code: string,
    name: string,
    visibility: RoomVisibility = 'PUBLIC',
    password?: string
  ) {
    this.id = id;
    this.code = code;
    this.name = name;
    this.visibility = visibility;
    this.password = password;

    this.startSimulation();
  }

  public get clientCount(): number {
    return this.clients.size;
  }

  public getMetadata(): RoomMetadata {
    const hostPlayer = this.p1State?.isHost ? this.p1State : this.p2State?.isHost ? this.p2State : null;
    return {
      id: this.id,
      code: this.code,
      name: this.name,
      hostName: hostPlayer?.name || 'Unknown Host',
      visibility: this.visibility,
      hasPassword: !!this.password,
      status: this.status,
      playerCount: this.clients.size,
      maxPlayers: 2,
      stage: this.stage,
      createdAt: this.createdAt,
    };
  }

  public canJoin(password?: string): { allowed: boolean; reason?: string } {
    if (this.clients.size >= 2) {
      return { allowed: false, reason: 'Room is full (2/2 players)' };
    }
    if (this.status === 'FIGHTING') {
      return { allowed: false, reason: 'Match is already in progress' };
    }
    if (this.password && this.password !== password) {
      return { allowed: false, reason: 'Incorrect room password' };
    }
    return { allowed: true };
  }

  public join(ws: WebSocket, playerName = 'Fighter', requestedSlot?: PlayerSlot): { slot: PlayerSlot; sessionId: string; reconnectToken: string } {
    const sessionId = `sess_${Math.random().toString(36).substring(2, 9)}`;
    const reconnectToken = `tok_${Math.random().toString(36).substring(2, 12)}`;

    let slot: PlayerSlot;
    if (requestedSlot && !this.isSlotTaken(requestedSlot)) {
      slot = requestedSlot;
    } else {
      slot = !this.p1State ? 'P1' : 'P2';
    }

    const isHost = this.clients.size === 0 && slot === 'P1';
    const character: OnlineCharacter = slot === 'P1' ? 'KAI' : 'SHADOW';
    const startX = slot === 'P1' ? 950 : 1450;
    const facing: 1 | -1 = slot === 'P1' ? 1 : -1;

    const playerState: SynchronizedPlayerState = {
      sessionId,
      slot,
      name: playerName,
      character,
      isHost,
      isReady: false,
      isConnected: true,
      reconnectToken,
      disconnectTimer: 0,
      ping: 20,
      x: startX,
      y: this.GROUND_Y,
      vx: 0,
      vy: 0,
      facing,
      state: 'IDLE',
      animKey: 'idle',
      health: 100,
      maxHealth: 100,
      guardMeter: 100,
      superMeter: 0,
      isCharging: false,
      isSurging: false,
      isCinematic: false,
      currentAttackType: null,
      comboCount: 0,
      roundsWon: 0,
    };

    if (slot === 'P1') {
      this.p1State = playerState;
    } else {
      this.p2State = playerState;
    }

    const client: ConnectedClient = { ws, sessionId, slot, lastPingTime: Date.now() };
    this.clients.set(sessionId, client);

    this.status = this.clients.size === 2 ? 'IN_LOBBY' : 'WAITING';

    this.broadcastSnapshot();
    return { slot, sessionId, reconnectToken };
  }

  public reconnect(ws: WebSocket, reconnectToken: string): boolean {
    let targetState: SynchronizedPlayerState | null = null;
    if (this.p1State?.reconnectToken === reconnectToken) {
      targetState = this.p1State;
    } else if (this.p2State?.reconnectToken === reconnectToken) {
      targetState = this.p2State;
    }

    if (!targetState) return false;

    targetState.isConnected = true;
    targetState.disconnectTimer = 0;

    const client: ConnectedClient = {
      ws,
      sessionId: targetState.sessionId,
      slot: targetState.slot,
      lastPingTime: Date.now(),
    };
    this.clients.set(targetState.sessionId, client);

    this.send(ws, { type: 'reconnect_success', payload: { slot: targetState.slot, sessionId: targetState.sessionId } });
    this.broadcast({ type: 'opponent_reconnected', payload: { slot: targetState.slot, name: targetState.name } });
    this.broadcastSnapshot();
    return true;
  }

  public leave(sessionId: string): void {
    const client = this.clients.get(sessionId);
    if (!client) return;

    this.clients.delete(sessionId);

    if (this.clients.size === 0) {
      // Both players left: reset room to clean state
      this.status = 'WAITING';
      this.p1State = null;
      this.p2State = null;
      return;
    }

    if (this.status === 'FIGHTING') {
      // In combat: initiate 15s reconnection grace period
      if (client.slot === 'P1' && this.p1State) {
        this.p1State.isConnected = false;
        this.p1State.disconnectTimer = 15;
      } else if (client.slot === 'P2' && this.p2State) {
        this.p2State.isConnected = false;
        this.p2State.disconnectTimer = 15;
      }
      this.broadcast({
        type: 'opponent_reconnecting',
        payload: { slot: client.slot, timeoutSeconds: 15 },
      });
    } else {
      // In lobby/waiting: clear slot immediately
      if (client.slot === 'P1') {
        this.p1State = null;
        if (this.p2State) {
          this.p2State.isHost = true;
        }
      } else {
        this.p2State = null;
      }
      this.status = 'WAITING';
      this.broadcast({ type: 'player_left', payload: { slot: client.slot } });
      this.broadcastSnapshot();
    }
  }

  public handleMessage(sessionId: string, type: string, payload: any): void {
    const client = this.clients.get(sessionId);
    if (!client) return;

    const player = client.slot === 'P1' ? this.p1State : this.p2State;
    if (!player) return;

    switch (type) {
      case 'set_name':
        if (typeof payload?.name === 'string') {
          player.name = payload.name.trim().substring(0, 16);
          this.broadcastSnapshot();
        }
        break;

      case 'select_character':
        if (payload?.character === 'KAI' || payload?.character === 'SHADOW') {
          player.character = payload.character;
          this.broadcastSnapshot();
        }
        break;

      case 'select_stage':
        if (player.isHost && typeof payload?.stage === 'string') {
          this.stage = payload.stage;
          this.broadcastSnapshot();
        }
        break;

      case 'toggle_ready':
        player.isReady = !player.isReady;
        this.broadcastSnapshot();
        break;

      case 'start_match':
        if (player.isHost && this.p1State?.isReady && this.p2State?.isReady && this.clients.size === 2) {
          this.startMatch();
        }
        break;

      case 'player_input':
        if (this.status === 'FIGHTING' && payload && typeof payload === 'object') {
          if (client.slot === 'P1') {
            this.p1Inputs = { ...this.p1Inputs, ...payload };
          } else {
            this.p2Inputs = { ...this.p2Inputs, ...payload };
          }
        }
        break;

      case 'ping':
        player.ping = Math.min(999, Math.max(10, Date.now() - (payload?.time || Date.now())));
        this.send(client.ws, { type: 'ping', payload: { serverTime: Date.now() } });
        break;
    }
  }

  private startMatch(): void {
    this.status = 'FIGHTING';
    this.currentRound = 1;
    this.roundTimeRemaining = 99;
    this.roundIntroTimer = 2.0;
    this.announcement = 'ROUND 1';
    this.winner = null;

    if (this.p1State) {
      this.p1State.health = 100;
      this.p1State.guardMeter = 100;
      this.p1State.superMeter = 0;
      this.p1State.roundsWon = 0;
      this.p1State.x = 950;
      this.p1State.y = this.GROUND_Y;
      this.p1State.facing = 1;
      this.p1State.state = 'IDLE';
    }
    if (this.p2State) {
      this.p2State.health = 100;
      this.p2State.guardMeter = 100;
      this.p2State.superMeter = 0;
      this.p2State.roundsWon = 0;
      this.p2State.x = 1450;
      this.p2State.y = this.GROUND_Y;
      this.p2State.facing = -1;
      this.p2State.state = 'IDLE';
    }

    this.projectiles = [];
    this.broadcast({ type: 'match_started', payload: { stage: this.stage } });
    this.broadcastSnapshot();
  }

  private startSimulation(): void {
    this.tickInterval = setInterval(() => {
      this.tick();
    }, 1000 / this.TICK_RATE);
  }

  private tick(): void {
    if (this.isDisposed) return;

    // 1. Process disconnect timers
    this.processDisconnectTimers();

    // 2. Authoritative Combat Update if in FIGHTING status
    if (this.status === 'FIGHTING' && this.p1State && this.p2State) {
      this.updateCombatLoop();
    }

    // 3. Broadcast periodic state snapshot at 30Hz
    this.broadcastSnapshot();
  }

  private processDisconnectTimers(): void {
    if (this.p1State && !this.p1State.isConnected && this.p1State.disconnectTimer > 0) {
      this.p1State.disconnectTimer -= this.DT;
      if (this.p1State.disconnectTimer <= 0) {
        this.winner = 'P2';
        this.status = 'FINISHED';
        this.announcement = `${this.p2State?.name || 'PLAYER 2'} WINS BY FORFEIT!`;
      }
    }
    if (this.p2State && !this.p2State.isConnected && this.p2State.disconnectTimer > 0) {
      this.p2State.disconnectTimer -= this.DT;
      if (this.p2State.disconnectTimer <= 0) {
        this.winner = 'P1';
        this.status = 'FINISHED';
        this.announcement = `${this.p1State?.name || 'PLAYER 1'} WINS BY FORFEIT!`;
      }
    }
  }

  private updateCombatLoop(): void {
    if (!this.p1State || !this.p2State) return;

    // A. Round Intro countdown
    if (this.roundIntroTimer > 0) {
      this.roundIntroTimer -= this.DT;
      if (this.roundIntroTimer <= 0.8 && this.roundIntroTimer + this.DT > 0.8) {
        this.announcement = 'FIGHT!';
      }
      if (this.roundIntroTimer <= 0) {
        this.announcement = null;
      }
      return;
    }

    // B. Round countdown timer
    if (this.roundTimeRemaining > 0 && !this.winner && this.roundOverTimer <= 0) {
      this.roundTimeRemaining -= this.DT;
      if (this.roundTimeRemaining <= 0) {
        this.roundTimeRemaining = 0;
        this.handleRoundEnd(this.p1State.health >= this.p2State.health ? 'P1' : 'P2');
        return;
      }
    }

    // C. Round Over delay
    if (this.roundOverTimer > 0) {
      this.roundOverTimer -= this.DT;
      if (this.roundOverTimer <= 0) {
        if (this.p1State.roundsWon >= 2) {
          this.winner = 'P1';
          this.status = 'FINISHED';
          this.announcement = `${this.p1State.name.toUpperCase()} VICTORIOUS!`;
          this.broadcastServerRewards();
        } else if (this.p2State.roundsWon >= 2) {
          this.winner = 'P2';
          this.status = 'FINISHED';
          this.announcement = `${this.p2State.name.toUpperCase()} VICTORIOUS!`;
          this.broadcastServerRewards();
        } else {
          // Next round
          this.currentRound++;
          this.roundTimeRemaining = 99;
          this.roundIntroTimer = 2.0;
          this.announcement = `ROUND ${this.currentRound}`;
          this.p1State.health = 100;
          this.p1State.guardMeter = 100;
          this.p1State.x = 950;
          this.p1State.y = this.GROUND_Y;
          this.p1State.facing = 1;
          this.p1State.state = 'IDLE';

          this.p2State.health = 100;
          this.p2State.guardMeter = 100;
          this.p2State.x = 1450;
          this.p2State.y = this.GROUND_Y;
          this.p2State.facing = -1;
          this.p2State.state = 'IDLE';
        }
      }
      return;
    }

    // D. Simulate Player 1 & Player 2 Authoritatively
    this.simulateFighter(this.p1State, this.p1Inputs, this.p2State);
    this.simulateFighter(this.p2State, this.p2Inputs, this.p1State);

    // E. Auto-facing
    this.p1State.facing = this.p1State.x <= this.p2State.x ? 1 : -1;
    this.p2State.facing = this.p2State.x <= this.p1State.x ? 1 : -1;

    // F. Resolve Melee Attacks
    this.resolveAttacks(this.p1State, this.p2State);
    this.resolveAttacks(this.p2State, this.p1State);

    // G. Update Projectiles
    this.updateProjectiles();

    // H. Pushbox separation
    const dist = Math.abs(this.p1State.x - this.p2State.x);
    if (dist < 60 && Math.abs(this.p1State.y - this.p2State.y) < 50) {
      const push = (60 - dist) * 0.5;
      if (this.p1State.x < this.p2State.x) {
        this.p1State.x = Math.max(this.STAGE_LEFT, this.p1State.x - push);
        this.p2State.x = Math.min(this.STAGE_RIGHT, this.p2State.x + push);
      } else {
        this.p1State.x = Math.min(this.STAGE_RIGHT, this.p1State.x + push);
        this.p2State.x = Math.max(this.STAGE_LEFT, this.p2State.x - push);
      }
    }
  }

  private simulateFighter(f: SynchronizedPlayerState, inpt: NetworkPlayerInput, opp: SynchronizedPlayerState): void {
    // Cannot act during hit stun or knockdown
    if (f.state === 'HIT_STUN' || f.state === 'KNOCKDOWN') {
      f.vx *= 0.88;
      f.x += f.vx * this.DT;
      f.x = Math.max(this.STAGE_LEFT, Math.min(this.STAGE_RIGHT, f.x));
      return;
    }

    const speed = f.isSurging ? 290 : 240;

    // Super Meter Charging (holding charge key)
    if (inpt.charge && f.state !== 'ATTACK' && f.y >= this.GROUND_Y - 2) {
      f.state = 'CHARGING';
      f.animKey = 'crouch';
      f.isCharging = true;
      f.superMeter = Math.min(100, f.superMeter + 28 * this.DT);
      if (f.superMeter >= 100) {
        f.isSurging = true;
      }
      return;
    } else {
      f.isCharging = false;
    }

    // Surge meter drain
    if (f.isSurging) {
      f.superMeter = Math.max(0, f.superMeter - 6 * this.DT);
      if (f.superMeter <= 0) {
        f.isSurging = false;
      }
    }

    // Movement
    if (inpt.left) {
      f.vx = -speed;
      f.x += f.vx * this.DT;
      f.state = 'WALK';
      f.animKey = f.facing === -1 ? 'walkForward' : 'walkBackward';
    } else if (inpt.right) {
      f.vx = speed;
      f.x += f.vx * this.DT;
      f.state = 'WALK';
      f.animKey = f.facing === 1 ? 'walkForward' : 'walkBackward';
    } else {
      f.vx = 0;
      if (f.state === 'WALK') {
        f.state = 'IDLE';
        f.animKey = 'idle';
      }
    }

    // Crouch & Block
    if (inpt.crouch && f.y >= this.GROUND_Y - 2) {
      f.state = 'BLOCK';
      f.animKey = inpt.block ? 'blockCrouch' : 'crouch';
    } else if (inpt.block && f.y >= this.GROUND_Y - 2) {
      f.state = 'BLOCK';
      f.animKey = 'blockStand';
    }

    // Jump
    if (inpt.jump && f.y >= this.GROUND_Y - 2) {
      f.vy = -540;
      f.state = 'JUMP';
      f.animKey = 'jumpAscent';
    }

    // Vertical physics
    if (f.y < this.GROUND_Y) {
      f.vy += 1200 * this.DT;
      f.y += f.vy * this.DT;
      if (f.vy > 0 && f.state === 'JUMP') {
        f.animKey = 'jumpDescent';
      }
      if (f.y >= this.GROUND_Y) {
        f.y = this.GROUND_Y;
        f.vy = 0;
        if (f.state === 'JUMP') {
          f.state = 'IDLE';
          f.animKey = 'idle';
        }
      }
    }

    // Attacks & Specials
    if (f.state !== 'ATTACK') {
      if (inpt.ultimate && f.superMeter >= 100) {
        // Ultimate Attack
        f.state = 'ATTACK';
        f.currentAttackType = f.character === 'KAI' ? 'ULTIMATE_CELESTIAL_BURST' : 'ULTIMATE_ECLIPSE_DOMINION';
        f.animKey = 'heavyPunch';
        f.isCinematic = true;
        f.superMeter = 0;
        f.isSurging = false;
        setTimeout(() => {
          f.isCinematic = false;
          f.state = 'IDLE';
          f.animKey = 'idle';
          f.currentAttackType = null;
        }, 1800);
      } else if (inpt.special && f.superMeter >= 25) {
        // Special Attack
        f.state = 'ATTACK';
        f.currentAttackType = f.character === 'KAI' ? 'BLUE_WAVE' : 'DARK_ORB';
        f.animKey = 'heavyKick';
        f.superMeter = Math.max(0, f.superMeter - 25);
        this.spawnProjectile(f.slot, f.currentAttackType, f.x + f.facing * 70, f.y - 70, f.facing * (f.character === 'KAI' ? 520 : 360));
        setTimeout(() => {
          f.state = 'IDLE';
          f.animKey = 'idle';
          f.currentAttackType = null;
        }, 550);
      } else if (inpt.heavyPunch) {
        f.state = 'ATTACK';
        f.currentAttackType = 'HEAVY_PUNCH';
        f.animKey = 'heavyPunch';
        setTimeout(() => {
          f.state = 'IDLE';
          f.animKey = 'idle';
          f.currentAttackType = null;
        }, 420);
      } else if (inpt.lightPunch) {
        f.state = 'ATTACK';
        f.currentAttackType = 'LIGHT_PUNCH';
        f.animKey = 'lightPunch';
        setTimeout(() => {
          f.state = 'IDLE';
          f.animKey = 'idle';
          f.currentAttackType = null;
        }, 280);
      } else if (inpt.heavyKick) {
        f.state = 'ATTACK';
        f.currentAttackType = 'HEAVY_KICK';
        f.animKey = 'heavyKick';
        setTimeout(() => {
          f.state = 'IDLE';
          f.animKey = 'idle';
          f.currentAttackType = null;
        }, 440);
      } else if (inpt.lightKick) {
        f.state = 'ATTACK';
        f.currentAttackType = 'LIGHT_KICK';
        f.animKey = 'lightKick';
        setTimeout(() => {
          f.state = 'IDLE';
          f.animKey = 'idle';
          f.currentAttackType = null;
        }, 300);
      }
    }

    // Stage clamping
    f.x = Math.max(this.STAGE_LEFT, Math.min(this.STAGE_RIGHT, f.x));
  }

  private resolveAttacks(atk: SynchronizedPlayerState, def: SynchronizedPlayerState): void {
    if (!atk.currentAttackType || atk.state !== 'ATTACK') return;

    const hitRange = atk.currentAttackType.startsWith('ULTIMATE') ? 220 : 120;
    const dist = Math.abs(atk.x - def.x);
    const inFacingDirection = (def.x - atk.x) * atk.facing > 0;

    if (dist <= hitRange && inFacingDirection && Math.abs(atk.y - def.y) < 70) {
      // Determine damage and guard
      const isBlocked = def.state === 'BLOCK';
      let damage = 8;
      if (atk.currentAttackType === 'HEAVY_PUNCH' || atk.currentAttackType === 'HEAVY_KICK') damage = 14;
      if (atk.currentAttackType.startsWith('ULTIMATE')) damage = 35;
      if (atk.isSurging) damage *= 1.15;

      if (isBlocked) {
        def.guardMeter = Math.max(0, def.guardMeter - damage * 1.5);
        def.health = Math.max(1, def.health - damage * 0.15); // Chip damage
      } else {
        def.health = Math.max(0, def.health - damage);
        def.state = atk.currentAttackType.startsWith('ULTIMATE') ? 'KNOCKDOWN' : 'HIT_STUN';
        def.animKey = 'hitHigh';
        def.vx = atk.facing * 180;
        atk.comboCount++;
        atk.superMeter = Math.min(100, atk.superMeter + 10);

        setTimeout(() => {
          if (def.health > 0) {
            def.state = 'IDLE';
            def.animKey = 'idle';
          }
        }, 320);
      }

      // Broadcast hit event for particles and audio
      this.broadcast({
        type: 'hit_event',
        payload: {
          x: (atk.x + def.x) * 0.5,
          y: def.y - 70,
          type: atk.currentAttackType,
          isBlocked,
          timestamp: Date.now(),
        },
      });

      atk.currentAttackType = null; // Single-hit registration

      // KO Detection
      if (def.health <= 0) {
        this.handleRoundEnd(atk.slot);
      }
    }
  }

  private spawnProjectile(owner: PlayerSlot, type: string, x: number, y: number, vx: number): void {
    this.projectiles.push({
      id: `proj_${Date.now()}_${Math.random()}`,
      owner,
      type,
      x,
      y,
      vx,
      radius: type === 'BLUE_WAVE' ? 32 : 28,
    });
  }

  private updateProjectiles(): void {
    if (!this.p1State || !this.p2State) return;

    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.x += p.vx * this.DT;

      // Stage bounds check
      if (p.x < this.STAGE_LEFT - 100 || p.x > this.STAGE_RIGHT + 100) {
        this.projectiles.splice(i, 1);
        continue;
      }

      // Collision with opponent
      const target = p.owner === 'P1' ? this.p2State : this.p1State;
      const dist = Math.abs(p.x - target.x);
      if (dist < p.radius + 30 && Math.abs(p.y - (target.y - 60)) < 60) {
        const isBlocked = target.state === 'BLOCK';
        const damage = isBlocked ? 3 : 18;
        target.health = Math.max(0, target.health - damage);
        target.state = isBlocked ? 'BLOCK' : 'HIT_STUN';
        target.animKey = isBlocked ? 'blockStand' : 'hitHigh';

        this.broadcast({
          type: 'hit_event',
          payload: { x: p.x, y: p.y, type: p.type, isBlocked, timestamp: Date.now() },
        });

        this.projectiles.splice(i, 1);

        if (target.health <= 0) {
          this.handleRoundEnd(p.owner);
        }
      }
    }
  }

  private handleRoundEnd(winnerSlot: PlayerSlot): void {
    const winnerPlayer = winnerSlot === 'P1' ? this.p1State : this.p2State;
    if (winnerPlayer) {
      winnerPlayer.roundsWon++;
    }
    this.announcement = `${winnerPlayer?.name.toUpperCase()} WINS ROUND!`;
    this.roundOverTimer = 2.4;
  }

  private broadcastServerRewards(): void {
    const isP1Win = this.winner === 'P1';
    this.broadcast({
      type: 'match_rewards',
      payload: {
        winner: this.winner,
        p1RpDelta: isP1Win ? 35 : -15,
        p2RpDelta: !isP1Win ? 35 : -15,
        p1Xp: isP1Win ? 300 : 120,
        p2Xp: !isP1Win ? 300 : 120,
        p1Coins: isP1Win ? 150 : 60,
        p2Coins: !isP1Win ? 150 : 60,
        isValidMatch: true,
        timestamp: Date.now(),
      },
    });
  }

  private isSlotTaken(slot: PlayerSlot): boolean {
    return slot === 'P1' ? !!this.p1State?.isConnected : !!this.p2State?.isConnected;
  }

  private createEmptyInput(): NetworkPlayerInput {
    return {
      seq: 0,
      left: false,
      right: false,
      jump: false,
      crouch: false,
      lightPunch: false,
      heavyPunch: false,
      lightKick: false,
      heavyKick: false,
      block: false,
      charge: false,
      special: false,
      ultimate: false,
    };
  }

  private broadcastSnapshot(): void {
    if (this.clients.size === 0) return;

    const match: SynchronizedMatchState = {
      roomId: this.id,
      roomCode: this.code,
      stage: this.stage,
      status: this.status,
      round: this.currentRound,
      timeRemaining: Math.ceil(this.roundTimeRemaining),
      announcement: this.announcement,
      winner: this.winner,
    };

    const snapshot: FullRoomSnapshot = {
      timestamp: Date.now(),
      match,
      p1: this.p1State,
      p2: this.p2State,
      projectiles: this.projectiles,
    };

    const msg = JSON.stringify({ type: 'state_snapshot', payload: snapshot });
    for (const client of this.clients.values()) {
      if (client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(msg);
      }
    }
  }

  private broadcast(msg: ServerMessage): void {
    const raw = JSON.stringify(msg);
    for (const client of this.clients.values()) {
      if (client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(raw);
      }
    }
  }

  private send(ws: WebSocket, msg: ServerMessage): void {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(msg));
    }
  }

  public dispose(): void {
    this.isDisposed = true;
    if (this.tickInterval) {
      clearInterval(this.tickInterval);
      this.tickInterval = null;
    }
    this.clients.clear();
  }
}
