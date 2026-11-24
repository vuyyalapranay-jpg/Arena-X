// server/cloudflare/MatchRoomDO.ts
// Cloudflare Durable Object for Stateful 1v1 Real-Time Multiplayer
// Implements WebSocket Hibernation API for 0 idle CPU duration (100% Free Tier Compliant)

import {
  FullRoomSnapshot,
  NetworkPlayerInput,
  PlayerSlot,
  RoomStatus,
  SynchronizedMatchState,
  SynchronizedPlayerState,
} from '../types';

export class MatchRoomDO {
  private state: any;
  private env: any;
  private p1Ws: WebSocket | null = null;
  private p2Ws: WebSocket | null = null;

  private matchState: SynchronizedMatchState = {
    roomId: '',
    roomCode: '',
    stage: 'ANCIENT_TEMPLE',
    status: 'WAITING',
    round: 1,
    timeRemaining: 99,
    announcement: 'WAITING FOR OPPONENT',
    winner: null,
  };

  private p1State: SynchronizedPlayerState = {
    sessionId: '',
    slot: 'P1',
    name: 'Player 1',
    character: 'KAI',
    isHost: true,
    isReady: false,
    isConnected: false,
    reconnectToken: '',
    disconnectTimer: 0,
    ping: 15,
    x: 950,
    y: 560,
    vx: 0,
    vy: 0,
    facing: 1,
    state: 'IDLE',
    animKey: 'idle',
    health: 1000,
    maxHealth: 1000,
    guardMeter: 100,
    superMeter: 0,
    isCharging: false,
    isSurging: false,
    isCinematic: false,
    currentAttackType: null,
    comboCount: 0,
    roundsWon: 0,
  };

  private p2State: SynchronizedPlayerState = {
    sessionId: '',
    slot: 'P2',
    name: 'Player 2',
    character: 'SHADOW',
    isHost: false,
    isReady: false,
    isConnected: false,
    reconnectToken: '',
    disconnectTimer: 0,
    ping: 15,
    x: 1450,
    y: 560,
    vx: 0,
    vy: 0,
    facing: -1,
    state: 'IDLE',
    animKey: 'idle',
    health: 1000,
    maxHealth: 1000,
    guardMeter: 100,
    superMeter: 0,
    isCharging: false,
    isSurging: false,
    isCinematic: false,
    currentAttackType: null,
    comboCount: 0,
    roundsWon: 0,
  };

  constructor(state: any, env: any) {
    this.state = state;
    this.env = env;
  }

  // Handle incoming HTTP request to upgrade to WebSocket
  async fetch(request: Request): Promise<Response> {
    const upgradeHeader = request.headers.get('Upgrade');
    if (!upgradeHeader || upgradeHeader.toLowerCase() !== 'websocket') {
      return new Response('Expected WebSocket upgrade', { status: 426 });
    }

    const url = new URL(request.url);
    const role = url.searchParams.get('slot') || (this.p1Ws ? 'P2' : 'P1');
    const playerName = url.searchParams.get('name') || (role === 'P1' ? 'Player 1' : 'Player 2');

    // Create WebSocket pair
    const webSocketPair = new (globalThis as any).WebSocketPair();
    const [client, server] = [webSocketPair[0], webSocketPair[1]];

    // Cloudflare WebSocket Hibernation API: accepts socket into DO runtime
    if (this.state.acceptWebSocket) {
      this.state.acceptWebSocket(server, [role]);
    } else {
      server.accept();
    }

    if (role === 'P1') {
      this.p1Ws = server;
      this.p1State.isConnected = true;
      this.p1State.name = playerName;
    } else {
      this.p2Ws = server;
      this.p2State.isConnected = true;
      this.p2State.name = playerName;
      if (this.p1Ws) {
        this.matchState.status = 'FIGHTING';
        this.matchState.announcement = 'ROUND 1 - FIGHT!';
      }
    }

    // Send initial join confirmation
    server.send(
      JSON.stringify({
        type: 'ROOM_JOINED',
        roomId: this.matchState.roomId || 'room_cf_do',
        roomCode: this.matchState.roomCode || 'AX2026',
        slot: role,
        isHost: role === 'P1',
      })
    );

    this.broadcastSnapshot();

    return new Response(null, {
      status: 101,
      webSocket: client,
    });
  }

  // WebSocket message handler triggered by Cloudflare runtime
  async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer): Promise<void> {
    try {
      const data = typeof message === 'string' ? JSON.parse(message) : null;
      if (!data) return;

      const isP1 = ws === this.p1Ws;
      const player = isP1 ? this.p1State : this.p2State;
      const opponentWs = isP1 ? this.p2Ws : this.p1Ws;

      if (data.type === 'INPUT') {
        const input: NetworkPlayerInput = data.input;
        // Forward input to opponent with minimal latency
        if (opponentWs && opponentWs.readyState === (WebSocket as any).OPEN) {
          opponentWs.send(
            JSON.stringify({
              type: 'OPPONENT_INPUT',
              slot: player.slot,
              input,
              timestamp: Date.now(),
            })
          );
        }
      } else if (data.type === 'STATE_SYNC') {
        // Authoritative reconciliation packet
        Object.assign(player, data.state);
        this.broadcastSnapshot();
      } else if (data.type === 'PING') {
        ws.send(JSON.stringify({ type: 'PONG', clientTime: data.clientTime, serverTime: Date.now() }));
      }
    } catch (e) {
      console.error('Error handling WS message:', e);
    }
  }

  // WebSocket close handler
  async webSocketClose(ws: WebSocket, code: number, reason: string): Promise<void> {
    if (ws === this.p1Ws) {
      this.p1Ws = null;
      this.p1State.isConnected = false;
      if (this.p2Ws) {
        this.p2Ws.send(JSON.stringify({ type: 'OPPONENT_DISCONNECTED', slot: 'P1', timeoutSeconds: 30 }));
      }
    } else if (ws === this.p2Ws) {
      this.p2Ws = null;
      this.p2State.isConnected = false;
      if (this.p1Ws) {
        this.p1Ws.send(JSON.stringify({ type: 'OPPONENT_DISCONNECTED', slot: 'P2', timeoutSeconds: 30 }));
      }
    }
  }

  private broadcastSnapshot(): void {
    const snapshot: FullRoomSnapshot = {
      timestamp: Date.now(),
      matchState: this.matchState,
      p1: this.p1State,
      p2: this.p2State,
      projectiles: [],
    };

    const payload = JSON.stringify({ type: 'SNAPSHOT', snapshot });

    if (this.p1Ws && this.p1Ws.readyState === (WebSocket as any).OPEN) {
      this.p1Ws.send(payload);
    }
    if (this.p2Ws && this.p2Ws.readyState === (WebSocket as any).OPEN) {
      this.p2Ws.send(payload);
    }
  }
}
