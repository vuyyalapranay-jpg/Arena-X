// Invite-only tournament coordinator.  One Durable Object owns one 16-player bracket.

type Entrant = { id: string; name: string; ready: boolean; joinedAt: number };
type BracketMatch = {
  id: string; round: number; index: number; a: string | null; b: string | null;
  winner: string | null; loser: string | null; status: 'WAITING' | 'READY' | 'COMPLETE';
};
type TournamentState = {
  code: string; hostId: string | null; phase: 'LOBBY' | 'IN_PROGRESS' | 'COMPLETE';
  entrants: Entrant[]; matches: BracketMatch[]; createdAt: number;
};

const emptyState = (code: string): TournamentState => ({
  code, hostId: null, phase: 'LOBBY', entrants: [], matches: [], createdAt: Date.now(),
});

export class TournamentRoomDO {
  private state: any;
  private sockets = new Map<string, WebSocket>();

  constructor(state: any) { this.state = state; }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    if (request.method === 'POST' && url.pathname.endsWith('/match-result')) {
      const result = await request.json() as { matchId: string; winnerId: string };
      const tournament = await this.load(url.searchParams.get('code') || '');
      this.recordResult(tournament, result.matchId, result.winnerId);
      await this.save(tournament);
      this.broadcast({ type: 'tournament_state', payload: this.publicState(tournament) });
      return Response.json({ ok: true, tournament: this.publicState(tournament) });
    }

    if (request.headers.get('Upgrade')?.toLowerCase() !== 'websocket') {
      return Response.json({ error: 'WebSocket upgrade required' }, { status: 426 });
    }
    const code = (url.pathname.split('/').pop() || '').toUpperCase();
    if (!/^AXT-[A-Z0-9]{4}$/.test(code)) return Response.json({ error: 'Invalid tournament code' }, { status: 400 });
    const pair = new (globalThis as any).WebSocketPair();
    const client: WebSocket = pair[0];
    const server: WebSocket = pair[1];
    server.accept();
    const sessionId = crypto.randomUUID();
    this.sockets.set(sessionId, server);
    server.addEventListener('message', (event: MessageEvent) => this.onMessage(sessionId, code, server, String(event.data)));
    server.addEventListener('close', () => this.sockets.delete(sessionId));
    server.send(JSON.stringify({ type: 'connected', payload: { sessionId, code } }));
    const tournament = await this.load(code);
    server.send(JSON.stringify({ type: 'tournament_state', payload: this.publicState(tournament) }));
    return new Response(null, { status: 101, webSocket: client } as any);
  }

  private async onMessage(sessionId: string, code: string, socket: WebSocket, raw: string) {
    let message: any;
    try { message = JSON.parse(raw); } catch { return; }
    const tournament = await this.load(code);
    if (message.type === 'join') {
      const name = String(message.payload?.name || 'Fighter').replace(/[^a-zA-Z0-9 _-]/g, '').slice(0, 14) || 'Fighter';
      const existing = tournament.entrants.find((entrant) => entrant.id === sessionId);
      if (!existing && tournament.phase !== 'LOBBY') return this.error(socket, 'The bracket has already started.');
      if (!existing && tournament.entrants.length >= 16) return this.error(socket, 'This tournament is full.');
      if (!existing) tournament.entrants.push({ id: sessionId, name, ready: false, joinedAt: Date.now() });
      if (!tournament.hostId) tournament.hostId = sessionId;
      await this.save(tournament);
      this.broadcast({ type: 'tournament_state', payload: this.publicState(tournament) });
      return;
    }
    if (message.type === 'ready') {
      const entrant = tournament.entrants.find((item) => item.id === sessionId);
      if (entrant && tournament.phase === 'LOBBY') entrant.ready = Boolean(message.payload?.ready);
      await this.save(tournament);
      this.broadcast({ type: 'tournament_state', payload: this.publicState(tournament) });
      return;
    }
    if (message.type === 'start') {
      if (tournament.hostId !== sessionId) return this.error(socket, 'Only the host can start this bracket.');
      if (tournament.entrants.length !== 16) return this.error(socket, 'A 16-player bracket needs all 16 fighters.');
      if (!tournament.entrants.every((entrant) => entrant.ready)) return this.error(socket, 'Every fighter must be ready.');
      tournament.phase = 'IN_PROGRESS';
      tournament.matches = this.makeBracket(tournament.entrants.map((entrant) => entrant.id));
      await this.save(tournament);
      this.broadcast({ type: 'tournament_state', payload: this.publicState(tournament) });
    }
  }

  private makeBracket(ids: string[]): BracketMatch[] {
    const matches: BracketMatch[] = [];
    for (let round = 1, count = 8; round <= 4; round += 1, count /= 2) {
      for (let index = 0; index < count; index += 1) {
        const a = round === 1 ? ids[index * 2] : null;
        const b = round === 1 ? ids[index * 2 + 1] : null;
        matches.push({ id: `r${round}m${index + 1}`, round, index, a, b, winner: null, loser: null, status: a && b ? 'READY' : 'WAITING' });
      }
    }
    return matches;
  }

  private recordResult(tournament: TournamentState, matchId: string, winnerId: string) {
    const match = tournament.matches.find((item) => item.id === matchId);
    if (!match || match.status !== 'READY' || (match.a !== winnerId && match.b !== winnerId)) return;
    match.winner = winnerId; match.loser = match.a === winnerId ? match.b : match.a; match.status = 'COMPLETE';
    const next = tournament.matches.find((item) => item.round === match.round + 1 && item.index === Math.floor(match.index / 2));
    if (next) {
      if (match.index % 2 === 0) next.a = winnerId; else next.b = winnerId;
      if (next.a && next.b) next.status = 'READY';
    } else {
      tournament.phase = 'COMPLETE';
    }
  }

  private async load(code: string): Promise<TournamentState> { return (await this.state.storage.get<TournamentState>('tournament')) || emptyState(code); }
  private save(tournament: TournamentState) { return this.state.storage.put('tournament', tournament); }
  private publicState(tournament: TournamentState) { return { ...tournament, entrants: tournament.entrants.map(({ id, ...entrant }) => ({ ...entrant, id })) }; }
  private broadcast(message: unknown) { const text = JSON.stringify(message); this.sockets.forEach((socket) => { if (socket.readyState === 1) socket.send(text); }); }
  private error(socket: WebSocket, message: string) { socket.send(JSON.stringify({ type: 'error', payload: { message } })); }
}
