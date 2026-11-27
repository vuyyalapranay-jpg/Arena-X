// src/game/ui/FightHUD.tsx
// INDUSTRIAL BRUTALIST & TACTICAL TELEMETRY COMBAT HUD
// Synthesizing: act-combat-design, industrial-brutalist-ui, oil-ui, team-ui

import React, { useState, useEffect, useRef } from 'react';
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
  const [showTouchControls, setShowTouchControls] = useState(false);

  // Delayed ghost health bar for impactful fighting-game hit feedback (oil-ui & act-combat-design)
  const [p1GhostHealth, setP1GhostHealth] = useState(100);
  const [p2GhostHealth, setP2GhostHealth] = useState(100);
  const [matchRewards, setMatchRewards] = useState<MatchRewards | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [hasRecordedMatch, setHasRecordedMatch] = useState(false);
  const resumeBtnRef = useRef<HTMLButtonElement>(null);

  // Focus management and Escape key handling for Pause Dashboard
  useEffect(() => {
    if (gameState !== 'PAUSED') return;
    
    // Focus the Resume button when pause modal opens
    const focusTimer = setTimeout(() => {
      resumeBtnRef.current?.focus();
    }, 50);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        soundManager.playMenuSelect();
        onResume();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      clearTimeout(focusTimer);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [gameState, onResume]);

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
    <div className="fight-hud-root sf2-hud-root">

      {/* ============================================================== */}
      {/* AUTHENTIC SHADOW FIGHT 2 MINIMALIST COMBAT HUD                 */}
      {/* (Identical layout to user's uploaded reference image)          */}
      {/* ============================================================== */}
      <header className="sf2-minimal-hud-top" aria-label="Combat status">
        {/* P1 HEALTH BAR (YOU) */}
        <div className="sf2-bar-container sf2-p1">
          <div className="sf2-health-track">
            <div className="sf2-health-ghost" style={{ width: `${p1GhostPercent}%` }} />
            <div className="sf2-health-fill sf2-p1-fill" style={{ width: `${p1HealthPercent}%` }} />
          </div>
          <div className="sf2-name-row">
            <span className="sf2-player-label">YOU</span>
            <div className="sf2-win-dots" title={`YOU rounds won: ${matchState.p1RoundsWon}`}>
              <span className={`sf2-dot ${matchState.p1RoundsWon >= 1 ? 'dot-won' : ''}`} />
              <span className={`sf2-dot ${matchState.p1RoundsWon >= 2 ? 'dot-won' : ''}`} />
            </div>
          </div>
        </div>

        {/* CENTER MATCH CHRONO */}
        <div className="sf2-center-timer">
          <span className="sf2-timer-digits">
            {Math.ceil(matchState.timeRemaining).toString().padStart(2, '0')}
          </span>
        </div>

        {/* P2 HEALTH BAR (SHADOW) */}
        <div className="sf2-bar-container sf2-p2">
          <div className="sf2-health-track">
            <div className="sf2-health-ghost" style={{ width: `${p2GhostPercent}%` }} />
            <div className="sf2-health-fill sf2-p2-fill" style={{ width: `${p2HealthPercent}%` }} />
          </div>
          <div className="sf2-name-row sf2-p2-name">
            <div className="sf2-win-dots" title={`SHADOW rounds won: ${matchState.p2RoundsWon}`}>
              <span className={`sf2-dot ${matchState.p2RoundsWon >= 1 ? 'dot-won' : ''}`} />
              <span className={`sf2-dot ${matchState.p2RoundsWon >= 2 ? 'dot-won' : ''}`} />
            </div>
            <span className="sf2-player-label">SHADOW</span>
          </div>
        </div>

        {/* Floating Minimal Controls (Top Right corner) */}
        <div className="sf2-quick-actions">
          <button
            type="button"
            className="sf2-icon-btn"
            onClick={toggleMute}
            title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
          >
            {isMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
          </button>
          <button
            type="button"
            className="sf2-icon-btn"
            onClick={onPause}
            title="Pause Match (ESC)"
          >
            <Pause size={15} />
          </button>
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
                  {p1Stats.comboCount >= 10 ? '★ CRAZY STYLE' :
                   p1Stats.comboCount >= 7 ? '★ FANTASTIC' :
                   p1Stats.comboCount >= 5 ? '★ BRUTAL' :
                   p1Stats.comboCount >= 3 ? '★ HARD' : '★ AGGRESSIVE'}
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
                  {p2Stats.comboCount >= 10 ? '★ CRAZY STYLE' :
                   p2Stats.comboCount >= 7 ? '★ FANTASTIC' :
                   p2Stats.comboCount >= 5 ? '★ BRUTAL' :
                   p2Stats.comboCount >= 3 ? '★ HARD' : '★ AGGRESSIVE'}
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
          onClick={onPause} 
          aria-label="View Combat Commands & Pause"
          title="Command List / Pause"
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
      {/* 5. VIRTUAL TOUCH CONTROLS FOR MOBILE / TABLET                  */}
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
      {/* 7. CONSOLE-GRADE PAUSE DASHBOARD & MOVES REFERENCE             */}
      {/* ============================================================== */}
      {gameState === 'PAUSED' && (
        <div className="modal-backdrop console-pause-backdrop">
          <div className="console-pause-card" role="dialog" aria-modal="true" aria-labelledby="pause-modal-heading">
            {/* Header: Title and Match Telemetry */}
            <div className="pause-card-header">
              <div className="pause-top-badge font-mono">ARENA X // BATTLE SUSPENDED</div>
              <h1 id="pause-modal-heading" className="pause-hero-title">MATCH PAUSED</h1>
              
              {/* Match Versus Banner */}
              <div className="pause-vs-banner">
                <div className="pause-fighter-pill p1">
                  <img 
                    src={`/assets/sprites/portraits/portrait_${p1Id.toLowerCase()}.png`} 
                    alt="" 
                    className="pause-portrait-mini"
                    onError={(e) => { 
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = `/assets/characters_full/${p1Id.toLowerCase()}.png`; 
                    }}
                  />
                  <span className="name">{p1Profile.name}</span>
                  <span className="score font-mono">[{matchState.p1RoundsWon}]</span>
                </div>
                <div className="pause-vs-badge font-mono">VS</div>
                <div className="pause-fighter-pill p2">
                  <span className="score font-mono">[{matchState.p2RoundsWon}]</span>
                  <span className="name">{p2Profile.name}</span>
                  <img 
                    src={`/assets/sprites/portraits/portrait_${p2Id.toLowerCase()}.png`} 
                    alt="" 
                    className="pause-portrait-mini"
                    onError={(e) => { 
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = `/assets/characters_full/${p2Id.toLowerCase()}.png`; 
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="pause-grid-layout">
              {/* Left Column: Actions */}
              <div className="pause-actions-col">
                <button 
                  ref={resumeBtnRef}
                  className="pause-btn resume-btn"
                  onClick={() => {
                    soundManager.playMenuSelect();
                    onResume();
                  }}
                >
                  <Play size={20} className="btn-icon" />
                  <div className="btn-text-block">
                    <span className="primary-text">RESUME BATTLE</span>
                    <span className="sub-text">Return to active fight</span>
                  </div>
                </button>

                <button 
                  className="pause-btn restart-btn"
                  onClick={() => {
                    soundManager.playMenuSelect();
                    onRestart();
                  }}
                >
                  <RotateCcw size={18} className="btn-icon" />
                  <div className="btn-text-block">
                    <span className="primary-text">RESTART MATCH</span>
                    <span className="sub-text">Reset rounds & health</span>
                  </div>
                </button>

                <button 
                  className="pause-btn quit-btn"
                  onClick={() => {
                    soundManager.playMenuSelect();
                    onMainMenu();
                  }}
                >
                  <Home size={18} className="btn-icon" />
                  <div className="btn-text-block">
                    <span className="primary-text">MAIN MENU</span>
                    <span className="sub-text">Exit to lobby deck</span>
                  </div>
                </button>
              </div>

              {/* Right Column: Fighter Command / Moves Reference */}
              <div className="pause-moves-col">
                <div className="moves-header">
                  <span className="title">COMBAT COMMANDS</span>
                  <span className="char-tag">[{p1Profile.name}]</span>
                </div>
                <div className="moves-list-table font-mono">
                  <div className="move-row">
                    <span className="move-name">Light / Heavy Strike</span>
                    <span className="move-keys"><kbd>F</kbd> / <kbd>R</kbd></span>
                  </div>
                  <div className="move-row">
                    <span className="move-name">Kick (Front / Roundhouse)</span>
                    <span className="move-keys"><kbd>G</kbd></span>
                  </div>
                  <div className="move-row">
                    <span className="move-name">Low Shin Sweep</span>
                    <span className="move-keys"><kbd>S</kbd> + <kbd>G</kbd></span>
                  </div>
                  <div className="move-row">
                    <span className="move-name">Anti-Air Uppercut</span>
                    <span className="move-keys"><kbd>S</kbd> + <kbd>F</kbd></span>
                  </div>
                  <div className="move-row">
                    <span className="move-name">Guard / Block Defense</span>
                    <span className="move-keys"><kbd>H</kbd></span>
                  </div>
                  <div className="move-row">
                    <span className="move-name">Special Technique</span>
                    <span className="move-keys"><kbd>SPACE</kbd></span>
                  </div>
                  <div className="move-row highlight-burst">
                    <span className="move-name">Overdrive Burst (100% Super)</span>
                    <span className="move-keys burst-cap"><kbd>V</kbd></span>
                  </div>
                </div>
              </div>
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
