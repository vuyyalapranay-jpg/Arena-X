import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Check, Copy, Crown, Link as LinkIcon, Radio, Swords, Trophy, Users } from 'lucide-react';
import { TournamentClient, TournamentState } from '../multiplayer/TournamentClient';

interface TournamentLobbyProps { onBack: () => void; initialCode?: string | null; }
const newCode = () => `AXT-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
const roundName = (round: number) => ['Round of 16', 'Quarterfinals', 'Semifinals', 'Final'][round - 1] || 'Match';

export const TournamentLobby: React.FC<TournamentLobbyProps> = ({ onBack, initialCode }) => {
  const [code, setCode] = useState(() => initialCode || newCode());
  const [name, setName] = useState(() => localStorage.getItem('arena_x_player_name') || `Fighter ${Math.floor(100 + Math.random() * 900)}`);
  const [client] = useState(() => new TournamentClient());
  const [state, setState] = useState<TournamentState | null>(null);
  const [error, setError] = useState('');
  const [joined, setJoined] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const offState = client.onState(setState);
    const offError = client.onError(setError);
    return () => { offState(); offError(); client.disconnect(); };
  }, [client]);
  const connect = () => { setError(''); localStorage.setItem('arena_x_player_name', name); client.connect(code.toUpperCase(), name); setJoined(true); };
  const me = state?.entrants.find((entrant) => entrant.id === client.sessionId);
  const invite = `${window.location.origin}${window.location.pathname}?tournament=${code}`;
  const copyInvite = async () => { await navigator.clipboard.writeText(invite); setCopied(true); window.setTimeout(() => setCopied(false), 1600); };
  const entrantsById = useMemo(() => new Map(state?.entrants.map((entrant) => [entrant.id, entrant.name]) || []), [state]);
  const matchesByRound = [1, 2, 3, 4].map((round) => state?.matches.filter((match) => match.round === round) || []);
  const isHost = state?.hostId === client.sessionId;

  return <main className="tournament-shell">
    <header className="tournament-nav">
      <button className="t-nav-back" onClick={onBack}><ArrowLeft size={18} /> Back to play</button>
      <div className="t-brand"><span className="t-brand-mark">AX</span><span>Arena X</span></div>
      <div className="t-live"><Radio size={15} /> Invite-only bracket</div>
    </header>
    <section className="tournament-hero" aria-labelledby="tournament-title">
      <div className="tournament-hero-copy">
        <p className="t-kicker">Private room tournament</p>
        <h1 id="tournament-title">16-player fighting bracket</h1>
        <p>Share one invite link, fill the room, then run eight 1v1 opening matches in parallel. The final and a third-place match decide the top four.</p>
      </div>
      <div className="tournament-visual" aria-hidden="true"><Trophy /><span>16</span><small>fighters</small></div>
    </section>
    {!joined ? <section className="t-entry" aria-labelledby="entry-title">
      <div><p className="t-kicker">Join a room</p><h2 id="entry-title">Set your fighter tag</h2><p>Hosting creates a private code. Joining accepts a code from a friend.</p></div>
      <div className="t-entry-fields">
        <label>Fighter tag<input value={name} onChange={(event) => setName(event.target.value.slice(0, 14))} maxLength={14} /></label>
        <label>Room code<input value={code} onChange={(event) => setCode(event.target.value.toUpperCase())} maxLength={8} /></label>
        <button className="t-primary" onClick={connect}><Swords size={18} /> Join tournament</button>
      </div>
    </section> : <>
      <section className="t-command" aria-label="Tournament lobby controls">
        <div className="t-room-code"><span>Room code</span><strong>{code}</strong><button onClick={copyInvite} aria-label="Copy invite link">{copied ? <Check size={17} /> : <Copy size={17} />}</button></div>
        <button className="t-secondary" onClick={copyInvite}><LinkIcon size={17} /> {copied ? 'Invite copied' : 'Copy invite link'}</button>
        <div className="t-command-actions">
          <button className={`t-ready ${me?.ready ? 'is-ready' : ''}`} onClick={() => client.setReady(!me?.ready)}>{me?.ready ? <Check size={17} /> : <Users size={17} />}{me?.ready ? 'Ready' : 'Mark ready'}</button>
          {isHost && <button className="t-primary" disabled={state?.entrants.length !== 16 || !state.entrants.every((entrant) => entrant.ready)} onClick={() => client.start()}><Swords size={17} /> Start bracket</button>}
        </div>
      </section>
      <section className="t-roster" aria-labelledby="roster-title"><div><p className="t-kicker">Lobby roster</p><h2 id="roster-title">{state?.entrants.length || 0} of 16 fighters</h2></div><div className="t-slots">{Array.from({ length: 16 }, (_, index) => { const entrant = state?.entrants[index]; return <div className={`t-slot ${entrant ? 'filled' : ''}`} key={index}><span>{String(index + 1).padStart(2, '0')}</span><strong>{entrant?.name || 'Open slot'}</strong>{entrant?.ready && <Check size={15} />}</div>; })}</div></section>
      {state?.phase !== 'LOBBY' && <section className="t-bracket" aria-labelledby="bracket-title"><div className="t-bracket-heading"><div><p className="t-kicker">Live bracket</p><h2 id="bracket-title">Tournament matches</h2></div><span>{state?.phase === 'COMPLETE' ? 'Champion decided' : 'Matches advance on verified results'}</span></div><div className="t-bracket-scroll">{matchesByRound.map((matches, index) => <div className="t-round" key={index}><h3>{roundName(index + 1)}</h3>{matches.map((match) => <div className={`t-match t-${match.status.toLowerCase()}`} key={match.id}><div className={match.winner === match.a ? 'winner' : ''}>{entrantsById.get(match.a || '') || 'Awaiting fighter'}</div><div className={match.winner === match.b ? 'winner' : ''}>{entrantsById.get(match.b || '') || 'Awaiting fighter'}</div></div>)}</div>)}</div><div className="t-placement"><Crown size={18} /><span>1st: final winner · 2nd: final opponent · 3rd/4th: semifinal playoff</span></div></section>}
    </>}
    {error && <p className="t-error" role="alert">{error}</p>}
  </main>;
};
