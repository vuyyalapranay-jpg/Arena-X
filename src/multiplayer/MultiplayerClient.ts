// src/multiplayer/MultiplayerClient.ts
// ROBUST CLIENT-SIDE WEBSOCKET & MULTIPLAYER MANAGER FOR ARENA X

import {
  FullRoomSnapshot,
  NetworkPlayerInput,
  OnlineCharacter,
  PlayerSlot,
  RoomMetadata,
  RoomVisibility,
  ServerMessage,
} from '../../server/types';

export interface JoinRoomOptions {
  mode: 'CREATE' | 'BY_ID' | 'BY_CODE' | 'QUICK_MATCH';
  roomId?: string;
  code?: string;
  roomName?: string;
  visibility?: RoomVisibility;
  password?: string;
  playerName?: string;
}

export type ConnectionStatus = 'DISCONNECTED' | 'CONNECTING' | 'CONNECTED' | 'RECONNECTING';

export class MultiplayerClient {
  private ws: WebSocket | null = null;
  private serverUrl: string;
  private status: ConnectionStatus = 'DISCONNECTED';
  private pingInterval: any = null;
  private lastPingTime = 0;

  // Session info
  public roomId: string | null = null;
  public roomCode: string | null = null;
  public roomName: string | null = null;
  public mySlot: PlayerSlot | null = null;
  public mySessionId: string | null = null;
  public reconnectToken: string | null = null;
  public isHost = false;
  public currentPing = 20;

  // Cached state
  public latestSnapshot: FullRoomSnapshot | null = null;

  // Event Callbacks
  private listeners = {
    onStatusChange: new Set<(status: ConnectionStatus) => void>(),
    onRoomJoined: new Set<(info: { roomId: string; roomCode: string; slot: PlayerSlot; isHost: boolean }) => void>(),
    onSnapshot: new Set<(snapshot: FullRoomSnapshot) => void>(),
    onMatchStart: new Set<(stage: string) => void>(),
    onHitEvent: new Set<(hit: any) => void>(),
    onOpponentReconnecting: new Set<(info: { slot: PlayerSlot; timeoutSeconds: number }) => void>(),
    onOpponentReconnected: new Set<(info: { slot: PlayerSlot; name: string }) => void>(),
    onError: new Set<(error: string) => void>(),
  };

  constructor() {
    // Resolve URL from Vite env or fallback
    const envUrl = (import.meta as any).env?.VITE_MULTIPLAYER_SERVER_URL;
    if (envUrl) {
      this.serverUrl = envUrl;
    } else if (typeof window !== 'undefined') {
      const isHttps = window.location.protocol === 'https:';
      const wsProto = isHttps ? 'wss:' : 'ws:';
      this.serverUrl = `${wsProto}//${window.location.hostname}:2567`;
    } else {
      this.serverUrl = 'ws://localhost:2567';
    }
  }

  public getStatus(): ConnectionStatus {
    return this.status;
  }

  public async fetchPublicRooms(): Promise<RoomMetadata[]> {
    try {
      const httpUrl = this.serverUrl.replace(/^ws/, 'http');
      const res = await fetch(`${httpUrl}/api/rooms`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      return data.rooms || [];
    } catch (err) {
      console.warn('Failed to fetch public rooms:', err);
      return [];
    }
  }

  public connectAndJoin(options: JoinRoomOptions): Promise<void> {
    return new Promise((resolve, reject) => {
      this.disconnect();
      this.setStatus('CONNECTING');

      try {
        this.ws = new WebSocket(this.serverUrl);
      } catch (err: any) {
        this.setStatus('DISCONNECTED');
        reject(err);
        return;
      }

      this.ws.onopen = () => {
        this.setStatus('CONNECTED');
        this.startPingLoop();

        // Send join request immediately
        this.send('join_room', options);
        resolve();
      };

      this.ws.onmessage = (event: MessageEvent) => {
        try {
          const msg: ServerMessage = JSON.parse(event.data);
          this.handleServerMessage(msg);
        } catch (err) {
          console.error('Failed to parse server message:', err);
        }
      };

      this.ws.onclose = () => {
        this.stopPingLoop();
        this.setStatus('DISCONNECTED');
      };

      this.ws.onerror = (err) => {
        console.error('Multiplayer WebSocket error:', err);
        this.emitError('Network connection error');
      };
    });
  }

  public attemptReconnect(): void {
    if (!this.roomId || !this.reconnectToken) return;

    this.disconnect();
    this.setStatus('RECONNECTING');

    this.ws = new WebSocket(this.serverUrl);
    this.ws.onopen = () => {
      this.setStatus('CONNECTED');
      this.startPingLoop();
      this.send('reconnect', {
        roomId: this.roomId,
        reconnectToken: this.reconnectToken,
      });
    };
    this.ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        this.handleServerMessage(msg);
      } catch (err) {}
    };
    this.ws.onclose = () => {
      this.stopPingLoop();
      this.setStatus('DISCONNECTED');
    };
  }

  public disconnect(): void {
    this.stopPingLoop();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.roomId = null;
    this.roomCode = null;
    this.mySlot = null;
    this.isHost = false;
    this.latestSnapshot = null;
    this.setStatus('DISCONNECTED');
  }

  // Action methods
  public setName(name: string): void {
    this.send('set_name', { name });
  }

  public selectCharacter(character: OnlineCharacter): void {
    this.send('select_character', { character });
  }

  public selectStage(stage: string): void {
    this.send('select_stage', { stage });
  }

  public toggleReady(): void {
    this.send('toggle_ready', {});
  }

  public startMatch(): void {
    this.send('start_match', {});
  }

  public sendInput(input: NetworkPlayerInput): void {
    this.send('player_input', input);
  }

  public leaveRoom(): void {
    this.send('leave_room', {});
    this.disconnect();
  }

  // Listener registrations
  public onSnapshot(fn: (s: FullRoomSnapshot) => void): () => void {
    this.listeners.onSnapshot.add(fn);
    return () => this.listeners.onSnapshot.delete(fn);
  }

  public onRoomJoined(fn: (info: any) => void): () => void {
    this.listeners.onRoomJoined.add(fn);
    return () => this.listeners.onRoomJoined.delete(fn);
  }

  public onMatchStart(fn: (stage: string) => void): () => void {
    this.listeners.onMatchStart.add(fn);
    return () => this.listeners.onMatchStart.delete(fn);
  }

  public onHitEvent(fn: (hit: any) => void): () => void {
    this.listeners.onHitEvent.add(fn);
    return () => this.listeners.onHitEvent.delete(fn);
  }

  public onOpponentReconnecting(fn: (info: any) => void): () => void {
    this.listeners.onOpponentReconnecting.add(fn);
    return () => this.listeners.onOpponentReconnecting.delete(fn);
  }

  public onOpponentReconnected(fn: (info: any) => void): () => void {
    this.listeners.onOpponentReconnected.add(fn);
    return () => this.listeners.onOpponentReconnected.delete(fn);
  }

  public onError(fn: (err: string) => void): () => void {
    this.listeners.onError.add(fn);
    return () => this.listeners.onError.delete(fn);
  }

  public onStatusChange(fn: (status: ConnectionStatus) => void): () => void {
    this.listeners.onStatusChange.add(fn);
    return () => this.listeners.onStatusChange.delete(fn);
  }

  private send(type: string, payload: any): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type, payload }));
    }
  }

  private handleServerMessage(msg: ServerMessage): void {
    switch (msg.type) {
      case 'room_joined':
        this.roomId = msg.payload.roomId;
        this.roomCode = msg.payload.roomCode;
        this.roomName = msg.payload.roomName;
        this.mySlot = msg.payload.slot;
        this.mySessionId = msg.payload.sessionId;
        this.reconnectToken = msg.payload.reconnectToken;
        this.isHost = msg.payload.isHost;
        this.listeners.onRoomJoined.forEach((fn) => fn(msg.payload));
        break;

      case 'state_snapshot':
        this.latestSnapshot = msg.payload;
        this.listeners.onSnapshot.forEach((fn) => fn(msg.payload));
        break;

      case 'match_started':
        this.listeners.onMatchStart.forEach((fn) => fn(msg.payload?.stage || 'CYBER_PAGODA'));
        break;

      case 'hit_event':
        this.listeners.onHitEvent.forEach((fn) => fn(msg.payload));
        break;

      case 'opponent_reconnecting':
        this.listeners.onOpponentReconnecting.forEach((fn) => fn(msg.payload));
        break;

      case 'opponent_reconnected':
        this.listeners.onOpponentReconnected.forEach((fn) => fn(msg.payload));
        break;

      case 'ping':
        if (this.lastPingTime > 0) {
          this.currentPing = Date.now() - this.lastPingTime;
        }
        break;

      case 'error':
        this.emitError(msg.payload?.message || 'Server error occurred');
        break;
    }
  }

  private emitError(msg: string): void {
    this.listeners.onError.forEach((fn) => fn(msg));
  }

  private setStatus(s: ConnectionStatus): void {
    this.status = s;
    this.listeners.onStatusChange.forEach((fn) => fn(s));
  }

  private startPingLoop(): void {
    this.stopPingLoop();
    this.pingInterval = setInterval(() => {
      this.lastPingTime = Date.now();
      this.send('ping', { time: this.lastPingTime });
    }, 2000);
  }

  private stopPingLoop(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }
}

// Singleton client instance
export const multiplayerClient = new MultiplayerClient();
