// src/game/ui/FightHUD.tsx
// INDUSTRIAL BRUTALIST & TACTICAL TELEMETRY COMBAT HUD
// Synthesizing: act-combat-design, industrial-brutalist-ui, oil-ui, team-ui

import React, { useState, useEffect } from 'react';
import { 
  Pause, 
  Play, 
  RotateCcw, 
  Home, 
  Volume2, 
  VolumeX, 
  Maximize2, 
  HelpCircle,
  Smartphone,
  Trophy,
  Coins,
  Sparkles,
  Award,
  User,
  Shield,
  Zap,
  Crosshair
} from 'lucide-react';
import { FighterStats, GameState, MatchState, PlayerId } from '../../types';
import { FighterId, ROSTER_FIGHTERS } from '../characters/RosterConfig';
import { soundManager } from '../core/SoundManager';
import { progressionManager } from '../progression/ProgressionManager';
import { MatchRewards } from '../progression/ProgressionTypes';
import { PlayerProfileModal } from '../../components/PlayerProfileModal';
import { VirtualJoystick } from './VirtualJoystick';
import { ShadowFightTouchControls } from './ShadowFightTouchControls';
import '../../styles/brutalist-tactical-hud.css';

interface FightHUDProps {
  p1Stats: FighterStats;
  p2Stats: FighterStats;
  matchState: MatchState;
  gameState: GameState;
  fps?: number;
  onPause: () => void;
  onResume: () => void;
  onRestart: () => void;
  onMainMenu: () => void;
  onTouchInput: (player: PlayerId, action: any, active: boolean) => void;
}

export const FightHUD: React.FC<FightHUDProps> = ({
  p1Stats,
  p2Stats,
  matchState,
  gameState,
  fps,
  onPause,
  onResume,
  onRestart,
  onMainMenu,
  onTouchInput,
}) => {
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [showTouchControls, setShowTouchControls] = useState(false);

  // Delayed ghost health bar for impactful fighting-game hit feedback (oil-ui & act-combat-design)
  const [p1GhostHealth, setP1GhostHealth] = useState(100);
  const [p2GhostHealth, setP2GhostHealth] = useState(100);
  const [matchRewards, setMatchRewards] = useState<MatchRewards | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [hasRecordedMatch, setHasRecordedMatch] = useState(false);

  // Auto-record progression on match over
  useEffect(() => {
    if (gameState === 'MATCH_OVER' && !hasRecordedMatch) {
      setHasRecordedMatch(true);
      const isP1Win = matchState.winner === 'P1';
      const rewards = progressionManager.recordMatchResult({
        gameMode: 'VERSUS',
        playerFighter: (p1Stats.name || 'KAI') as any,
        opponentFighter: (p2Stats.name || 'SHADOW') as any,
        opponentName: p2Stats.name || 'SHADOW',
        stageId: 'ANCIENT_TEMPLE',
        playerScore: matchState.p1RoundsWon,
        opponentScore: matchState.p2RoundsWon,
        durationSeconds: 45,
        isPerfectRound: p1Stats.currentHealth === p1Stats.maxHealth,
        isUltimateFinisher: isP1Win && matchState.announcement?.includes('ULTIMATE'),
      });
      setMatchRewards(rewards);
    } else if (gameState !== 'MATCH_OVER' && hasRecordedMatch) {
      setHasRecordedMatch(false);
      setMatchRewards(null);
    }
  }, [gameState, hasRecordedMatch, matchState, p1Stats, p2Stats]);

  // Auto-detect touch device
  useEffect(() => {
    const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    if (isTouch) {
      setShowTouchControls(true);
    }
  }, []);

  // Update delayed ghost health with smooth cubic easing
  useEffect(() => {
    const timer = setTimeout(() => {
      setP1GhostHealth(p1Stats.currentHealth);
    }, 350);
    return () => clearTimeout(timer);
  }, [p1Stats.currentHealth]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setP2GhostHealth(p2Stats.currentHealth);
    }, 350);
    return () => clearTimeout(timer);
  }, [p2Stats.currentHealth]);

  const toggleMute = () => {
    const muted = soundManager.toggleMute();
    setIsMuted(muted);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  const p1HealthPercent = Math.max(0, (p1Stats.currentHealth / p1Stats.maxHealth) * 100);
  const p1GhostPercent = Math.max(0, (p1GhostHealth / p1Stats.maxHealth) * 100);

  const p2HealthPercent = Math.max(0, (p2Stats.currentHealth / p2Stats.maxHealth) * 100);
  const p2GhostPercent = Math.max(0, (p2GhostHealth / p2Stats.maxHealth) * 100);

  const p1Id = ((p1Stats.name || 'KAI').toUpperCase()) as FighterId;
  const p2Id = ((p2Stats.name || 'SHADOW').toUpperCase()) as FighterId;
  const p1Profile = ROSTER_FIGHTERS[p1Id] || ROSTER_FIGHTERS.KAI;
  const p2Profile = ROSTER_FIGHTERS[p2Id] || ROSTER_FIGHTERS.SHADOW;

  const p1Super = Math.min(100, Math.max(0, p1Stats.superMeter || 0));
  const p2Super = Math.min(100, Math.max(0, p2Stats.superMeter || 0));
  const p1Guard = Math.min(100, Math.max(0, p1Stats.guardMeter ?? 100));
  const p2Guard = Math.min(100, Math.max(0, p2Stats.guardMeter ?? 100));

  return (
    <div className="fight-hud-root brutalist-tactical-hud">
      {/* Subtle CRT scanline overlay */}
      <div className="hud-scanlines-layer" aria-hidden="true" />

      {/* ============================================================== */}
      {/* 1. TOP TACTICAL TELEMETRY STATUS BAR (INDUSTRIAL BRUTALISM)    */}
      {/* ============================================================== */}
      <header className="target-hud-top-bar">
        {/* PLAYER 1 TACTICAL FIGHTER CARD */}
        <div className="p1-fighter-card brutalist-card">
          <div className="brutalist-corner-mark top-left" aria-hidden="true">+</div>
          <div className="avatar-wrapper p1-avatar-frame">
            <img 
              src={`/assets/sprites/portraits/portrait_${p1Id.toLowerCase()}.png`} 
              alt={p1Profile.name} 
              className="avatar-img"
              onError={(e) => {
                (e.target as HTMLImageElement).src = `/assets/characters_full/${p1Id.toLowerCase()}.png`;
              }}
            />
            <div className="player-badge p1-badge">P1 // 01</div>
          </div>

          <div className="fighter-status-block">
            {/* Top Telemetry Line */}
            <div className="fighter-meta-line">
              <span className="fighter-tag-callsign">[{p1Profile.name}]</span>
              <span className="fighter-subtitle-tag">// {p1Profile.title}</span>
              <span className="fighter-hp-readout font-mono">
                HP // {Math.max(0, Math.round(p1Stats.currentHealth))}:{p1Stats.maxHealth}
              </span>
              
              {/* Tactical Round Win Indicators */}
              <div className="round-dots-group">
                <span className="round-dots-label font-mono">ROUNDS:</span>
                <span className={`target-dot ${matchState.p1RoundsWon >= 1 ? 'dot-won-p1' : ''}`} />
                <span className={`target-dot ${matchState.p1RoundsWon >= 2 ? 'dot-won-p1' : ''}`} />
                <span className={`target-dot ${matchState.p1RoundsWon >= 3 ? 'dot-won-p1' : ''}`} />
              </div>
            </div>

            {/* Segmented Industrial Life Bar with Micro-Notches (25%, 50%, 75%) */}
            <div className={`target-health-bar p1-health-bar ${p1HealthPercent < 25 ? 'health-critical-pulse' : ''}`}>
              <div className="target-health-ghost" style={{ width: `${p1GhostPercent}%` }} />
              <div 
                className="target-health-fill p1-fill" 
                style={{ width: `${p1HealthPercent}%` }} 
              />
              <div className="health-notch notch-25" />
              <div className="health-notch notch-50" />
              <div className="health-notch notch-75" />
            </div>

            {/* Dual Meter Telemetry Grid: Guard & 3-Phase Tactical Super */}
            <div className="sub-meters-row">
              <div className="meter-unit guard-unit">
                <div className="meter-meta font-mono">
                  <Shield size={10} />
                  <span>GUARD</span>
                  <span className="meter-val">{Math.round(p1Guard)}%</span>
                </div>
                <div className="mini-meter-track">
                  <div 
                    className="mini-meter-fill guard-fill" 
                    style={{ 
                      width: `${p1Guard}%`,
                      background: p1Guard < 30 ? '#ff2a2a' : '#00f0ff' 
                    }} 
                  />
                </div>
              </div>

              <div className="meter-unit super-unit">
                <div className="meter-meta font-mono">
                  <Zap size={10} />
                  <span>BURST</span>
                  <span className="meter-val">{p1Super >= 100 ? 'OVERDRIVE' : `${Math.round(p1Super)}%`}</span>
                </div>
                <div className="super-segments-track">
                  <div className={`super-segment ${p1Super >= 33 ? 'segment-active' : ''}`}>
                    <div className="segment-fill" style={{ width: `${Math.min(100, (p1Super / 33.33) * 100)}%` }} />
                  </div>
                  <div className={`super-segment ${p1Super >= 66 ? 'segment-active' : ''}`}>
                    <div className="segment-fill" style={{ width: `${Math.min(100, Math.max(0, ((p1Super - 33.33) / 33.33) * 100))}%` }} />
                  </div>
                  <div className={`super-segment ${p1Super >= 100 ? 'segment-active max-phase' : ''}`}>
                    <div className="segment-fill" style={{ width: `${Math.min(100, Math.max(0, ((p1Super - 66.66) / 33.34) * 100))}%` }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Tactical Overdrive Banner */}
            {p1Super >= 100 && (
              <div className="overdrive-telemetry-banner p1-overdrive font-mono">
                <span className="overdrive-glitch" aria-hidden="true">▶</span>
                <span>OVERDRIVE ACTIVE // [V] {p1Profile.specials.ultimate.name.toUpperCase()}</span>
                <span className="overdrive-glitch" aria-hidden="true">◀</span>
              </div>
            )}
          </div>
        </div>

        {/* CENTER MATCH TELEMETRY NODE (INDUSTRIAL CHRONO) */}
        <div className="target-center-node brutalist-center-node">
          <div className="target-logo-row font-mono">
            <span className="logo-arena-text">ARENA_X</span>
            <span className="telemetry-coord">// T-01</span>
          </div>
          <div className="target-round-pill font-mono">
            [ ROUND {String(matchState.round).padStart(2, '0')} ]
          </div>
          <div className={`target-match-timer font-mono ${matchState.timeRemaining <= 10 ? 'timer-danger' : ''}`}>
            {Math.ceil(matchState.timeRemaining).toString().padStart(2, '0')}
          </div>
          <div className="telemetry-sub-status font-mono">
            {matchState.timeRemaining <= 10 ? '! CRITICAL !' : 'LIVE MATCH'}
          </div>
        </div>

        {/* PLAYER 2 TACTICAL FIGHTER CARD */}
        <div className="p2-fighter-card brutalist-card">
          <div className="brutalist-corner-mark top-right" aria-hidden="true">+</div>
          <div className="avatar-wrapper p2-avatar-frame">
            <img 
              src={`/assets/sprites/portraits/portrait_${p2Id.toLowerCase()}.png`} 
              alt={p2Profile.name} 
              className="avatar-img"
              onError={(e) => {
                (e.target as HTMLImageElement).src = `/assets/characters_full/${p2Id.toLowerCase()}.png`;
              }}
            />
            <div className="player-badge p2-badge">P2 // 02</div>
          </div>

          <div className="fighter-status-block reversed">
            {/* Top Telemetry Line */}
            <div className="fighter-meta-line reversed">
              <span className="fighter-tag-callsign">[{p2Profile.name}]</span>
              <span className="fighter-subtitle-tag">// {p2Profile.title}</span>
              <span className="fighter-hp-readout font-mono">
                HP // {Math.max(0, Math.round(p2Stats.currentHealth))}:{p2Stats.maxHealth}
              </span>
              
              {/* Tactical Round Win Indicators */}
              <div className="round-dots-group">
                <span className="round-dots-label font-mono">ROUNDS:</span>
                <span className={`target-dot ${matchState.p2RoundsWon >= 1 ? 'dot-won-p2' : ''}`} />
                <span className={`target-dot ${matchState.p2RoundsWon >= 2 ? 'dot-won-p2' : ''}`} />
                <span className={`target-dot ${matchState.p2RoundsWon >= 3 ? 'dot-won-p2' : ''}`} />
              </div>
            </div>

            {/* Segmented Industrial Life Bar */}
            <div className={`target-health-bar p2-health-bar ${p2HealthPercent < 25 ? 'health-critical-pulse' : ''}`}>
              <div className="target-health-ghost" style={{ width: `${p2GhostPercent}%` }} />
              <div 
                className="target-health-fill p2-fill" 
                style={{ width: `${p2HealthPercent}%` }} 
              />
              <div className="health-notch notch-25" />
              <div className="health-notch notch-50" />
              <div className="health-notch notch-75" />
            </div>

            {/* Dual Meter Telemetry Grid */}
            <div className="sub-meters-row reversed">
              <div className="meter-unit guard-unit">
                <div className="meter-meta font-mono">
                  <Shield size={10} />
                  <span>GUARD</span>
                  <span className="meter-val">{Math.round(p2Guard)}%</span>
                </div>
                <div className="mini-meter-track">
                  <div 
                    className="mini-meter-fill guard-fill-p2" 
                    style={{ 
                      width: `${p2Guard}%`,
                      background: p2Guard < 30 ? '#ff2a2a' : '#ff0055' 
                    }} 
                  />
                </div>
              </div>

              <div className="meter-unit super-unit">
                <div className="meter-meta font-mono">
                  <Zap size={10} />
                  <span>BURST</span>
                  <span className="meter-val">{p2Super >= 100 ? 'OVERDRIVE' : `${Math.round(p2Super)}%`}</span>
                </div>
                <div className="super-segments-track">
                  <div className={`super-segment ${p2Super >= 33 ? 'segment-active p2' : ''}`}>
                    <div className="segment-fill" style={{ width: `${Math.min(100, (p2Super / 33.33) * 100)}%` }} />
                  </div>
                  <div className={`super-segment ${p2Super >= 66 ? 'segment-active p2' : ''}`}>
                    <div className="segment-fill" style={{ width: `${Math.min(100, Math.max(0, ((p2Super - 33.33) / 33.33) * 100))}%` }} />
                  </div>
                  <div className={`super-segment ${p2Super >= 100 ? 'segment-active p2 max-phase' : ''}`}>
                    <div className="segment-fill" style={{ width: `${Math.min(100, Math.max(0, ((p2Super - 66.66) / 33.34) * 100))}%` }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Tactical Overdrive Banner */}
            {p2Super >= 100 && (
              <div className="overdrive-telemetry-banner p2-overdrive font-mono">
                <span className="overdrive-glitch" aria-hidden="true">▶</span>
                <span>OVERDRIVE ACTIVE // [P2] {p2Profile.specials.ultimate.name.toUpperCase()}</span>
                <span className="overdrive-glitch" aria-hidden="true">◀</span>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ============================================================== */}
      {/* 2. DYNAMIC KINETIC COMBO TELEMETRY (TEAM-UI & INDUSTRIAL)      */}
      {/* ============================================================== */}
      <div className="hud-combos-layer">
        {p1Stats.comboCount && p1Stats.comboCount >= 2 ? (
          <div className="brutalist-combo-card p1-combo font-mono">
            <div className="combo-telemetry-header">
              <Crosshair size={12} />
              <span>COMBO TELEMETRY // P1</span>
            </div>
            <div className="combo-display-row">
              <span className="combo-num-massive">{String(p1Stats.comboCount).padStart(2, '0')}</span>
              <div className="combo-detail-col">
                <span className="combo-hits-unit">STRIKES</span>
                <span className="combo-tier-badge">
                  {p1Stats.comboCount >= 10 ? '★ LETHAL OVERKILL' :
                   p1Stats.comboCount >= 7 ? '★ HYPER ASSAULT' :
                   p1Stats.comboCount >= 4 ? '★ CRITICAL CHAIN' : '★ TACTICAL HIT'}
                </span>
              </div>
            </div>
          </div>
        ) : null}

        {p2Stats.comboCount && p2Stats.comboCount >= 2 ? (
          <div className="brutalist-combo-card p2-combo font-mono">
            <div className="combo-telemetry-header">
              <Crosshair size={12} />
              <span>COMBO TELEMETRY // P2</span>
            </div>
            <div className="combo-display-row">
              <span className="combo-num-massive">{String(p2Stats.comboCount).padStart(2, '0')}</span>
              <div className="combo-detail-col">
                <span className="combo-hits-unit">STRIKES</span>
                <span className="combo-tier-badge">
                  {p2Stats.comboCount >= 10 ? '★ LETHAL OVERKILL' :
                   p2Stats.comboCount >= 7 ? '★ HYPER ASSAULT' :
                   p2Stats.comboCount >= 4 ? '★ CRITICAL CHAIN' : '★ TACTICAL HIT'}
                </span>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {/* ============================================================== */}
      {/* 3. TOP TACTICAL UTILITY TOOLBAR (ACCESSIBLE TARGET SIZE >=28px) */}
      {/* ============================================================== */}
      <div className="hud-utility-bar brutalist-util-bar font-mono" role="toolbar" aria-label="Game controls">
        {fps !== undefined && (
          <span className="fps-indicator" aria-label={`Current framerate: ${fps} frames per second`}>
            <span className="fps-dot" aria-hidden="true" /> {fps} FPS
          </span>
        )}
        <button 
          className="hud-icon-btn" 
          onClick={toggleMute} 
          aria-label={isMuted ? 'Unmute audio' : 'Mute audio'}
          aria-pressed={isMuted}
          title={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
        </button>
        <button 
          className="hud-icon-btn" 
          onClick={() => setShowControls(!showControls)} 
          aria-label="Toggle Controls Guide"
          aria-pressed={showControls}
          title="Toggle Controls Guide"
        >
          <HelpCircle size={15} />
        </button>
        <button 
          className="hud-icon-btn" 
          onClick={() => setShowTouchControls(!showTouchControls)} 
          aria-label="Toggle Touch Controls"
          aria-pressed={showTouchControls}
          title="Toggle Touch Controls"
        >
          <Smartphone size={15} />
        </button>
        <button 
          className="hud-icon-btn" 
          onClick={toggleFullscreen} 
          aria-label="Toggle Fullscreen"
          title="Toggle Fullscreen"
        >
          <Maximize2 size={15} />
        </button>
        <button 
          className="hud-icon-btn pause-btn" 
          onClick={onPause} 
          aria-label="Pause Match"
          title="Pause Match"
        >
          <Pause size={15} />
        </button>
      </div>

      {/* ============================================================== */}
      {/* 4. CENTER BANNER ANNOUNCEMENT (ROUND 1, FIGHT!, K.O.)          */}
      {/* ============================================================== */}
      {matchState.announcement && (
        <div className="hud-announcement-overlay">
          <div className="announcement-banner brutalist-banner font-mono">
            <h1 className="announcement-text">{matchState.announcement}</h1>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 5. TACTICAL COMBAT OPERATION STRIP (TEAM-UI & INDUSTRIAL)      */}
      {/* ============================================================== */}
      {showControls && !showTouchControls && (
        <footer className="target-bottom-controls-bar brutalist-controls-strip font-mono">
          <div className="controls-telemetry-tag">[ TACTICAL INPUTS ]</div>
          <div className="p1-controls-section">
            <span className="p1-label">P1:</span>
            <div className="key-item"><span className="key-cap">A/D</span> MOVE</div>
            <div className="key-item"><span className="key-cap">W</span> JUMP</div>
            <div className="key-item"><span className="key-cap">S</span> CROUCH</div>
            <div className="key-item"><span className="key-cap">H</span> GUARD</div>
            <div className="key-item"><span className="key-cap">C</span> CHARGE</div>
            <div className="key-item"><span className="key-cap">F</span> STRIKE</div>
            <div className="key-item"><span className="key-cap">R</span> HEAVY</div>
            <div className="key-item"><span className="key-cap">G</span> KICK</div>
            <div className="key-item"><span className="key-cap">SPACE</span> SPECIAL</div>
            <div className={`key-item ${p1Super >= 100 ? 'key-overdrive' : ''}`}>
              <span className="key-cap">V</span> BURST
            </div>
          </div>

          <div className="controls-glow-divider" />

          <div className="p2-controls-section">
            <span className="p2-label">P2:</span>
            <div className="key-item"><span className="key-cap">← / →</span> MOVE</div>
            <div className="key-item"><span className="key-cap">↑</span> JUMP</div>
            <div className="key-item"><span className="key-cap">↓</span> CROUCH</div>
            <div className="key-item"><span className="key-cap">L</span> GUARD</div>
            <div className="key-item"><span className="key-cap">P</span> CHARGE</div>
            <div className="key-item"><span className="key-cap">J</span> STRIKE</div>
            <div className="key-item"><span className="key-cap">U</span> HEAVY</div>
            <div className="key-item"><span className="key-cap">K</span> KICK</div>
            <div className="key-item"><span className="key-cap">O</span> SPECIAL</div>
            <div className={`key-item ${p2Super >= 100 ? 'key-overdrive' : ''}`}>
              <span className="key-cap">]</span> BURST
            </div>
          </div>
        </footer>
      )}

      {/* ============================================================== */}
      {/* 6. VIRTUAL TOUCH CONTROLS FOR MOBILE / TABLET                  */}
      {/* ============================================================== */}
      {showTouchControls && (
        <div className="touch-controls-layer sf-touch-controls-layer font-mono">
          {/* Left: Modern Floating / Invisible Dynamic Joystick */}
          <VirtualJoystick player="P1" onTouchInput={onTouchInput} />

          {/* Right: Ergonomic Shadow Fight Action Cluster */}
          <ShadowFightTouchControls
            player="P1"
            superMeter={p1Super}
            onTouchInput={onTouchInput}
          />
        </div>
      )}

      {/* ============================================================== */}
      {/* 7. PAUSE MODAL                                                 */}
      {/* ============================================================== */}
      {gameState === 'PAUSED' && (
        <div className="modal-backdrop">
          <div className="pause-modal-card brutalist-card font-mono" role="dialog" aria-modal="true" aria-labelledby="pause-modal-heading">
            <h2 id="pause-modal-heading" className="modal-title">[ MATCH PAUSED ]</h2>
            <div className="modal-divider" />
            <div className="modal-button-stack">
              <button 
                className="arena-btn primary-btn"
                onClick={() => {
                  soundManager.playMenuSelect();
                  onResume();
                }}
              >
                <Play size={18} /> RESUME FIGHT
              </button>
              <button 
                className="arena-btn secondary-btn"
                onClick={() => {
                  soundManager.playMenuSelect();
                  onRestart();
                }}
              >
                <RotateCcw size={18} /> RESTART MATCH
              </button>
              <button 
                className="arena-btn danger-btn"
                onClick={() => {
                  soundManager.playMenuSelect();
                  onMainMenu();
                }}
              >
                <Home size={18} /> RETURN TO MAIN MENU
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 8. MATCH OVER MODAL WITH PROGRESSION REWARDS                   */}
      {/* ============================================================== */}
      {gameState === 'MATCH_OVER' && (
        <div className="modal-backdrop">
          <div className="match-over-card progression-match-card brutalist-card font-mono" role="dialog" aria-modal="true" aria-labelledby="match-over-heading">
            <div className="winner-crown">
              <Trophy size={16} /> [ ARENA X CHAMPION ]
            </div>
            <h2 id="match-over-heading" className={`winner-title ${matchState.winner === 'P1' ? 'p1-winner' : 'p2-winner'}`}>
              {matchState.winner === 'P1' ? `${p1Stats.name} VICTORIOUS!` : `${p2Stats.name} VICTORIOUS!`}
            </h2>
            <p className="match-score-summary">
              {p1Stats.name} [{matchState.p1RoundsWon}] — [{matchState.p2RoundsWon}] {p2Stats.name}
            </p>

            {/* Progression & Rewards Box */}
            {matchRewards && (
              <div className="post-match-rewards-grid">
                <div className="reward-item-badge xp-badge">
                  <span className="reward-label">XP EARNED</span>
                  <span className="reward-value">+{matchRewards.xpEarned} XP</span>
                  {matchRewards.didLevelUp && (
                    <span className="level-up-tag">
                      <Sparkles size={12} /> LEVEL {matchRewards.newLevel}!
                    </span>
                  )}
                </div>

                <div className="reward-item-badge coins-badge">
                  <span className="reward-label">AX COINS</span>
                  <span className="reward-value">
                    <Coins size={14} color="#ffd700" /> +{matchRewards.coinsEarned}
                  </span>
                </div>

                <div className="reward-item-badge rp-badge">
                  <span className="reward-label">RANK RATING</span>
                  <span className="reward-value" style={{ color: matchRewards.rpChange >= 0 ? '#69f0ae' : '#ff5252' }}>
                    {matchRewards.rpChange >= 0 ? `+${matchRewards.rpChange}` : matchRewards.rpChange} RP
                  </span>
                  <span className="tier-tag">{matchRewards.newRank}</span>
                </div>
              </div>
            )}

            {/* Unlocked Achievements Alert */}
            {matchRewards?.unlockedAchievements && matchRewards.unlockedAchievements.length > 0 && (
              <div className="match-achievements-banner">
                <Award size={16} color="#ffd700" />
                <span>ACHIEVEMENT UNLOCKED: {matchRewards.unlockedAchievements[0].title}!</span>
              </div>
            )}

            <div className="modal-divider" />
            <div className="modal-button-stack">
              <button 
                className="arena-btn primary-btn"
                onClick={() => {
                  soundManager.playMenuSelect();
                  onRestart();
                }}
              >
                <RotateCcw size={18} /> REMATCH
              </button>
              <button 
                className="arena-btn profile-btn"
                onClick={() => {
                  soundManager.playMenuSelect();
                  setIsProfileOpen(true);
                }}
              >
                <User size={18} /> VIEW PROFILE
              </button>
              <button 
                className="arena-btn secondary-btn"
                onClick={() => {
                  soundManager.playMenuSelect();
                  onMainMenu();
                }}
              >
                <Home size={18} /> MAIN MENU
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Profile Modal */}
      {isProfileOpen && (
        <PlayerProfileModal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />
      )}
    </div>
  );
};
