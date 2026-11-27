import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  Check,
  Copy,
  Crown,
  Lock,
  LogOut,
  RefreshCw,
  Shield,
  Swords,
  Trophy,
  Unlock,
  Users,
  Zap,
} from 'lucide-react';
import { TournamentClient, TournamentMatch, TournamentState } from '../multiplayer/TournamentClient';

interface TournamentLobbyProps {
  onBack: () => void;
  initialCode?: string | null;
  initialPassword?: string | null;
}

const ROOM_CODE_PATTERN = /^(SF2|AXT)-[A-Z0-9]{4,8}$/i;
const newCode = () => `SF2-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

export const TournamentLobby: React.FC<TournamentLobbyProps> = ({
  onBack,
  initialCode,
  initialPassword,
}) => {
  const [code, setCode] = useState(() => (initialCode ? initialCode.toUpperCase().trim() : newCode()));
  const [password, setPassword] = useState(() => initialPassword || '');
  const [name, setName] = useState(
    () => localStorage.getItem('arena_x_player_name') || `Fighter ${Math.floor(100 + Math.random() * 900)}`
  );
  const [client] = useState(() => new TournamentClient());
  const [state, setState] = useState<TournamentState | null>(null);
  const [error, setError] = useState('');
  const [joined, setJoined] = useState(false);
  const [copied, setCopied] = useState(false);
  const shellRef = useRef<HTMLElement>(null);
  const copyTimeoutRef = useRef<number | null>(null);

  // If initialCode or initialPassword changes via URL, update state
  useEffect(() => {
    if (initialCode) setCode(initialCode.toUpperCase().trim());
    if (initialPassword) setPassword(initialPassword);
  }, [initialCode, initialPassword]);

  useEffect(() => {
    const offState = client.onState((s) => {
      setState(s);
      setJoined(true);
      setError('');
    });
    const offError = client.onError((err) => {
      setError(err);
    });
    return () => {
      offState();
      offError();
      client.disconnect();
      if (copyTimeoutRef.current) {
        window.clearTimeout(copyTimeoutRef.current);
      }
    };
  }, [client]);

  const handleConnect = () => {
    const trimmedName = name.trim();
    const normalizedCode = code.toUpperCase().trim();
    const cleanPassword = password.trim();

    if (!trimmedName) {
      setError('Please enter a valid fighter tag.');
      return;
    }
    if (!ROOM_CODE_PATTERN.test(normalizedCode)) {
      setError('Room code must be in the format SF2-XXXX or AXT-XXXX.');
      return;
    }

    setError('');
    setCode(normalizedCode);
    localStorage.setItem('arena_x_player_name', trimmedName);
    client.connect(normalizedCode, trimmedName, cleanPassword || undefined);
    setJoined(true);

    if (shellRef.current) {
      shellRef.current.scrollTop = 0;
    }
  };

  const handleLeaveLobby = () => {
    client.disconnect();
    setJoined(false);
    setState(null);
    setError('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleConnect();
    }
  };

  const me = state?.entrants.find((entrant) => entrant.id === client.sessionId);
  const invite = `${window.location.origin}${window.location.pathname}?room=${encodeURIComponent(code)}${
    password.trim() ? `&key=${encodeURIComponent(password.trim())}` : ''
  }`;

  const copyInvite = async () => {
    if (copyTimeoutRef.current) {
      window.clearTimeout(copyTimeoutRef.current);
    }
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(invite);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = invite;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopied(true);
      copyTimeoutRef.current = window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setError(`Could not auto-copy link. You can share room code: ${code}`);
    }
  };

  const entrantsById = useMemo(
    () => new Map(state?.entrants.map((entrant) => [entrant.id, entrant.name]) || []),
    [state]
  );

  // Group matches by round dynamically
  const maxRound = useMemo(() => {
    if (!state?.matches || state.matches.length === 0) return 1;
    return Math.max(...state.matches.map((m) => m.round));
  }, [state?.matches]);

  const matchesByRound = useMemo(() => {
    const rounds: TournamentMatch[][] = [];
    for (let r = 1; r <= maxRound; r += 1) {
      rounds.push(state?.matches.filter((m) => m.round === r) || []);
    }
    return rounds;
  }, [state?.matches, maxRound]);

  const getRoundLabel = (round: number, totalRounds: number) => {
    if (totalRounds === 1) return 'Championship Match';
    if (round === totalRounds) return 'Final';
    if (round === totalRounds - 1) return 'Semifinals';
    if (round === totalRounds - 2) return 'Quarterfinals';
    return 'Round of 16';
  };

  const isHost = state?.hostId === client.sessionId;
  const roomHasPassword = Boolean(state?.hasPassword || password.trim());

  return (
    <main className="tournament-shell sf2-theme" ref={shellRef}>
      {/* Shadow Fight Atmospheric Background Kanji Motif */}
      <div className="sf2-kanji-watermark" aria-hidden="true">
        <span>陰</span>
      </div>

      {/* Sleek Top Navigation Bar */}
      <header className="tournament-nav">
        <button className="t-nav-back" onClick={onBack}>
          <ArrowLeft size={16} aria-hidden="true" /> Back to play
        </button>
        <div className="t-brand">
          <span className="t-brand-mark sf2-mark">SF</span>
          <span>Shadow Fight 2 · Custom Room</span>
        </div>
        <div className="t-live">
          <div className="t-live-dot" aria-hidden="true" />
          <span>2–16 Contenders</span>
        </div>
      </header>

      {/* Main Viewport Container */}
      <div className="tournament-main">
        {!joined ? (
          <div className="t-entry-container">
            {/* Overview Card */}
            <section className="t-overview-card" aria-labelledby="tournament-title">
              <div className="t-badge-row">
                <span className="t-kicker">Custom Battles & Bracket</span>
                <span className="t-badge">Min 2 · Max 16</span>
              </div>
              <h1 id="tournament-title">2 to 16 Player Custom Match</h1>
              <p className="t-overview-desc">
                Shadow Fight 2 custom multiplayer room. Host an intense 1v1 duel or a 16-player single-elimination tournament
                with room ID, optional password protection, and 1-click shareable invitation links.
              </p>

              <div className="t-feature-list">
                <div className="t-feature-item">
                  <Users size={16} aria-hidden="true" />
                  <span>Flexible Contenders: 2 to 16 players (1v1 duel or 16-fighter tournament)</span>
                </div>
                <div className="t-feature-item">
                  <Lock size={16} aria-hidden="true" />
                  <span>Private Security: Optional password lock & encrypted invitation links</span>
                </div>
                <div className="t-feature-item">
                  <Swords size={16} aria-hidden="true" />
                  <span>Authentic Combat: Head strikes (+25%), First-Strike bonus & SF2 style ratings</span>
                </div>
              </div>

              <div className="t-trophy-banner">
                <div className="t-trophy-icon">
                  <Trophy size={22} aria-hidden="true" />
                </div>
                <div className="t-trophy-meta">
                  <strong>CHAMPIONSHIP VICTORY</strong>
                  <span>Top placement honors & verified combat telemetry</span>
                </div>
              </div>
            </section>

            {/* Interactive Entry Card */}
            <section className="t-form-card" aria-labelledby="entry-title">
              <span className="t-kicker">Custom Room Gate</span>
              <h2 id="entry-title">Enter Custom Room</h2>
              <p className="t-form-subtitle">Create a new private battle room or join using room ID & password.</p>

              <div className="t-fields-group">
                <div className="t-field">
                  <label htmlFor="fighter-tag-input">Fighter Tag</label>
                  <div className="t-input-wrap">
                    <input
                      id="fighter-tag-input"
                      value={name}
                      onChange={(e) => setName(e.target.value.slice(0, 14))}
                      onKeyDown={handleKeyDown}
                      maxLength={14}
                      placeholder="e.g. Shadow, Kai, Lynx, Titan"
                    />
                  </div>
                </div>

                <div className="t-field">
                  <label htmlFor="room-code-input">Room ID</label>
                  <div className="t-input-wrap">
                    <input
                      id="room-code-input"
                      className="t-input-code"
                      value={code}
                      onChange={(e) => setCode(e.target.value.toUpperCase().trim())}
                      onKeyDown={handleKeyDown}
                      maxLength={12}
                      placeholder="SF2-XXXX or AXT-XXXX"
                    />
                    <button
                      type="button"
                      className="t-input-action"
                      onClick={() => setCode(newCode())}
                      title="Generate new room ID"
                    >
                      <RefreshCw size={13} aria-hidden="true" /> New Room
                    </button>
                  </div>
                </div>

                <div className="t-field">
                  <label htmlFor="room-password-input">Room Password (Optional)</label>
                  <div className="t-input-wrap">
                    <input
                      id="room-password-input"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onKeyDown={handleKeyDown}
                      maxLength={24}
                      placeholder="Leave blank for public room"
                    />
                  </div>
                  <span className="t-field-hint">
                    Host can lock room with a password. Players joining via invite link enter automatically.
                  </span>
                </div>

                <button type="button" className="t-btn-join" onClick={handleConnect}>
                  <Swords size={18} aria-hidden="true" /> Join & Enter Battle Room
                </button>
              </div>

              {error && (
                <div className="t-error-alert" role="alert">
                  <AlertCircle size={16} aria-hidden="true" />
                  <span>{error}</span>
                </div>
              )}
            </section>
          </div>
        ) : (
          <div className="t-lobby-shell">
            {/* Top Command Bar */}
            <section className="t-command-bar" aria-label="Tournament lobby controls">
              <div className="t-room-badge">
                <span>Room:</span>
                <strong>{code}</strong>
                {roomHasPassword ? (
                  <span className="t-lock-badge" title="Password protected room">
                    <Lock size={12} aria-hidden="true" /> Locked
                  </span>
                ) : (
                  <span className="t-lock-badge public" title="Open room">
                    <Unlock size={12} aria-hidden="true" /> Open
                  </span>
                )}
                <button className="t-copy-btn" onClick={copyInvite} title="Copy 1-click invitation link">
                  {copied ? <Check size={14} aria-hidden="true" /> : <Copy size={14} aria-hidden="true" />}
                  <span>{copied ? 'Link Copied!' : 'Copy Invite Link'}</span>
                </button>
              </div>

              <div className="t-command-actions">
                <button
                  type="button"
                  className="t-leave-btn"
                  onClick={handleLeaveLobby}
                  title="Leave this tournament lobby"
                >
                  <LogOut size={15} aria-hidden="true" />
                  <span>Leave Room</span>
                </button>

                <button
                  type="button"
                  className={`t-ready-btn ${me?.ready ? 'is-ready' : ''}`}
                  aria-pressed={Boolean(me?.ready)}
                  disabled={!me || state?.phase !== 'LOBBY'}
                  onClick={() => client.setReady(!me?.ready)}
                >
                  {me?.ready ? <Check size={16} aria-hidden="true" /> : <Zap size={16} aria-hidden="true" />}
                  <span>{me?.ready ? 'Ready to Fight' : 'Mark Ready'}</span>
                </button>

                {isHost && (
                  <button
                    type="button"
                    className="t-start-btn"
                    disabled={
                      (state?.entrants.length || 0) < 2 ||
                      (state?.entrants.length || 0) > 16 ||
                      !state?.entrants.every((entrant) => entrant.ready)
                    }
                    onClick={() => client.start()}
                  >
                    <Swords size={16} aria-hidden="true" />
                    <span>
                      Start Match ({state?.entrants.length || 0}/16
                      {(state?.entrants.length || 0) < 2 ? ' — Min 2' : ''})
                    </span>
                  </button>
                )}
              </div>
            </section>

            {/* Roster Section */}
            <section className="t-roster-section" aria-labelledby="roster-title">
              <div className="t-roster-header">
                <h2 id="roster-title">Contenders Roster</h2>
                <span className="t-roster-badge">
                  {state?.entrants.length || 0} / 16 Contenders (Min 2 to start)
                </span>
              </div>

              <div className="t-slots-grid">
                {Array.from({ length: 16 }, (_, index) => {
                  const entrant = state?.entrants[index];
                  const entrantIsHost = entrant && entrant.id === state?.hostId;
                  return (
                    <div className={`t-slot-card ${entrant ? 'filled' : ''}`} key={index}>
                      <span className="t-slot-num">{String(index + 1).padStart(2, '0')}</span>
                      <strong className="t-slot-name">
                        {entrant?.name || 'Open Slot'}
                      </strong>
                      {entrantIsHost && (
                        <span className="t-host-tag" title="Tournament Host" aria-label="Tournament Host">
                          <Crown size={14} className="t-host-crown" aria-hidden="true" />
                          <span className="sr-only">Host</span>
                        </span>
                      )}
                      {entrant && (
                        <span
                          className={`t-slot-status ${entrant.ready ? 'ready' : 'waiting'}`}
                        >
                          {entrant.ready ? 'READY' : 'WAITING'}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Bracket Section if started */}
            {state?.phase !== 'LOBBY' && (
              <section className="t-bracket-section" aria-labelledby="bracket-title">
                <div className="t-bracket-heading">
                  <h2 id="bracket-title">Tournament Matches</h2>
                  <span className="t-badge">
                    {state?.phase === 'COMPLETE' ? 'Champion Decided' : 'Live Tournament in Progress'}
                  </span>
                </div>

                <div className="t-bracket-scroll">
                  {matchesByRound.map((matches, index) => (
                    <div className="t-round-col" key={index}>
                      <h3>{getRoundLabel(index + 1, maxRound)}</h3>
                      {matches.map((match) => (
                        <div className={`t-match-card t-${match.status.toLowerCase()}`} key={match.id}>
                          <div className={`t-match-row ${match.winner === match.a ? 'winner' : ''}`}>
                            <span>{entrantsById.get(match.a || '') || 'Awaiting Fighter'}</span>
                            {match.winner === match.a && <Crown size={13} color="#f0a83a" aria-hidden="true" />}
                          </div>
                          <div className={`t-match-row ${match.winner === match.b ? 'winner' : ''}`}>
                            <span>{entrantsById.get(match.b || '') || 'Awaiting Fighter'}</span>
                            {match.winner === match.b && <Crown size={13} color="#f0a83a" aria-hidden="true" />}
                          </div>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>

                <div className="t-placement-row">
                  <Crown size={16} aria-hidden="true" />
                  <span>1st: Tournament Champion · 2nd: Finalist · 3rd/4th: Semifinalists</span>
                </div>
              </section>
            )}

            {error && (
              <div className="t-error-alert" role="alert">
                <AlertCircle size={16} aria-hidden="true" />
                <span>{error}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
};
