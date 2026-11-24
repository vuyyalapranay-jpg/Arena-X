import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  Check,
  Copy,
  Crown,
  LogOut,
  RefreshCw,
  Shield,
  Swords,
  Trophy,
  Users,
  Zap,
} from 'lucide-react';
import { TournamentClient, TournamentState } from '../multiplayer/TournamentClient';

interface TournamentLobbyProps {
  onBack: () => void;
  initialCode?: string | null;
}

const ROOM_CODE_PATTERN = /^AXT-[A-Z0-9]{4}$/;
const newCode = () => `AXT-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
const roundName = (round: number) => ['Round of 16', 'Quarterfinals', 'Semifinals', 'Final'][round - 1] || 'Match';

export const TournamentLobby: React.FC<TournamentLobbyProps> = ({ onBack, initialCode }) => {
  const [code, setCode] = useState(() => (initialCode ? initialCode.toUpperCase().trim() : newCode()));
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

    if (!trimmedName) {
      setError('Please enter a valid fighter tag.');
      return;
    }
    if (!ROOM_CODE_PATTERN.test(normalizedCode)) {
      setError('Room code must be in the format AXT-XXXX (4 letters or digits).');
      return;
    }

    setError('');
    setCode(normalizedCode);
    localStorage.setItem('arena_x_player_name', trimmedName);
    client.connect(normalizedCode, trimmedName);
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
  const invite = `${window.location.origin}${window.location.pathname}?tournament=${encodeURIComponent(code)}`;

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
      setError('Could not auto-copy link. You can share room code: ' + code);
    }
  };

  const entrantsById = useMemo(
    () => new Map(state?.entrants.map((entrant) => [entrant.id, entrant.name]) || []),
    [state]
  );
  const matchesByRound = [1, 2, 3, 4].map(
    (round) => state?.matches.filter((match) => match.round === round) || []
  );
  const isHost = state?.hostId === client.sessionId;

  return (
    <main className="tournament-shell" ref={shellRef}>
      {/* Sleek Top Navigation Bar */}
      <header className="tournament-nav">
        <button className="t-nav-back" onClick={onBack}>
          <ArrowLeft size={16} aria-hidden="true" /> Back to play
        </button>
        <div className="t-brand">
          <span className="t-brand-mark">AX</span>
          <span>Arena X</span>
        </div>
        <div className="t-live">
          <div className="t-live-dot" aria-hidden="true" />
          <span>Invite-only bracket</span>
        </div>
      </header>

      {/* Main Viewport Container */}
      <div className="tournament-main">
        {!joined ? (
          <div className="t-entry-container">
            {/* Overview Card */}
            <section className="t-overview-card" aria-labelledby="tournament-title">
              <div className="t-badge-row">
                <span className="t-kicker">Championship Series</span>
                <span className="t-badge">Dynamic Bracket</span>
              </div>
              <h1 id="tournament-title">4 to 16 Player Fighting Bracket</h1>
              <p className="t-overview-desc">
                Assemble fighters with one invite link. Supports 4 to 16 contenders in an automated championship
                bracket with automated seeding, round byes, and live bracket progression.
              </p>

              <div className="t-feature-list">
                <div className="t-feature-item">
                  <Users size={16} aria-hidden="true" />
                  <span>Flexible Contenders: 4 to 16 fighters with automated byes</span>
                </div>
                <div className="t-feature-item">
                  <Swords size={16} aria-hidden="true" />
                  <span>Direct 1v1 match progression on verified combat outcomes</span>
                </div>
                <div className="t-feature-item">
                  <Shield size={16} aria-hidden="true" />
                  <span>Host privileges, spectator tracking & real-time synchronization</span>
                </div>
              </div>

              <div className="t-trophy-banner">
                <div className="t-trophy-icon">
                  <Trophy size={22} aria-hidden="true" />
                </div>
                <div className="t-trophy-meta">
                  <strong>CHAMPIONSHIP TROPHY</strong>
                  <span>Top 4 placement & podium honors</span>
                </div>
              </div>
            </section>

            {/* Interactive Entry Card */}
            <section className="t-form-card" aria-labelledby="entry-title">
              <span className="t-kicker">Lobby Entrance</span>
              <h2 id="entry-title">Enter Tournament</h2>
              <p className="t-form-subtitle">Create a new private tournament room or join a friend's room.</p>

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
                      placeholder="e.g. Kai, Kenji, Shadow"
                    />
                  </div>
                </div>

                <div className="t-field">
                  <label htmlFor="room-code-input">Room Code</label>
                  <div className="t-input-wrap">
                    <input
                      id="room-code-input"
                      className="t-input-code"
                      value={code}
                      onChange={(e) => setCode(e.target.value.toUpperCase().trim())}
                      onKeyDown={handleKeyDown}
                      maxLength={8}
                      placeholder="AXT-XXXX"
                    />
                    <button
                      type="button"
                      className="t-input-action"
                      onClick={() => setCode(newCode())}
                      title="Generate new code"
                    >
                      <RefreshCw size={13} aria-hidden="true" /> New Code
                    </button>
                  </div>
                </div>

                <button type="button" className="t-btn-join" onClick={handleConnect}>
                  <Swords size={18} aria-hidden="true" /> Join & Enter Lobby
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
                <span>Room Code:</span>
                <strong>{code}</strong>
                <button className="t-copy-btn" onClick={copyInvite} title="Copy invite link">
                  {copied ? <Check size={14} aria-hidden="true" /> : <Copy size={14} aria-hidden="true" />}
                  <span>{copied ? 'Copied!' : 'Copy Link'}</span>
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
                  <span>Leave Lobby</span>
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
                      (state?.entrants.length || 0) < 4 ||
                      (state?.entrants.length || 0) > 16 ||
                      !state?.entrants.every((entrant) => entrant.ready)
                    }
                    onClick={() => client.start()}
                  >
                    <Swords size={16} aria-hidden="true" />
                    <span>
                      Start Bracket ({state?.entrants.length || 0}/16
                      {(state?.entrants.length || 0) < 4 ? ' — Min 4' : ''})
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
                  {state?.entrants.length || 0} / 16 Contenders (Min 4 to start)
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
                      <h3>{roundName(index + 1)}</h3>
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
