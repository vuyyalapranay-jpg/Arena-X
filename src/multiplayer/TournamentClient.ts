export type TournamentEntrant = { id: string; name: string; ready: boolean; joinedAt: number };
export type TournamentMatch = { id: string; round: number; index: number; a: string | null; b: string | null; winner: string | null; loser: string | null; status: 'WAITING' | 'READY' | 'COMPLETE' };
export type TournamentState = {
  code: string;
  hostId: string | null;
  phase: 'LOBBY' | 'IN_PROGRESS' | 'COMPLETE';
  hasPassword?: boolean;
  entrants: TournamentEntrant[];
  matches: TournamentMatch[];
  createdAt: number;
};

export class TournamentClient {
  private socket: WebSocket | null = null;
  private listeners = new Set<(state: TournamentState) => void>();
  private errorListeners = new Set<(message: string) => void>();
  public sessionId: string | null = null;

  connect(code: string, fighterName?: string, password?: string) {
    this.disconnect();
    const scheme = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    this.socket = new WebSocket(`${scheme}//${window.location.host}/api/tournament/${code}`);
    this.socket.onopen = () => { if (fighterName) this.join(fighterName, password); };
    this.socket.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if (message.type === 'connected') this.sessionId = message.payload.sessionId;
      if (message.type === 'tournament_state') this.listeners.forEach((listener) => listener(message.payload));
      if (message.type === 'error') this.errorListeners.forEach((listener) => listener(message.payload?.message || 'Tournament connection failed.'));
    };
    this.socket.onerror = () => this.errorListeners.forEach((listener) => listener('Tournament connection failed. Check your network and try again.'));
  }
  disconnect() { this.socket?.close(); this.socket = null; this.sessionId = null; }
  join(name: string, password?: string) { this.send('join', { name, password }); }
  setReady(ready: boolean) { this.send('ready', { ready }); }
  start() { this.send('start', {}); }
  onState(listener: (state: TournamentState) => void) { this.listeners.add(listener); return () => this.listeners.delete(listener); }
  onError(listener: (message: string) => void) { this.errorListeners.add(listener); return () => this.errorListeners.delete(listener); }
  private send(type: string, payload: unknown) { if (this.socket?.readyState === WebSocket.OPEN) this.socket.send(JSON.stringify({ type, payload })); }
}
