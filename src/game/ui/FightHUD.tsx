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
    <div className="fight-hud-root brutalist-tactical-hud">
      {/* Subtle CRT scanline overlay */}
      <div className="hud-scanlines-layer" aria-hidden="true" />

      {/* ============================================================== */}
      {/* 1. TOP FIGHTING STATUS BAR (CONSOLE 2D ARCADE HUD)             */}
      {/* ============================================================== */}
      <header className="target-hud-top-bar console-hud-top">
        {/* PLAYER 1 COMBAT CARD */}
        <div className="p1-fighter-card console-fighter-card">
          <div className="avatar-wrapper p1-avatar-frame">
            <img 
              src={`/assets/sprites/portraits/portrait_${p1Id.toLowerCase()}.png`} 
              alt={p1Profile.name} 
              className="avatar-img"
              onError={(e) => {
                (e.target as HTMLImageElement).src = `/assets/characters_full/${p1Id.toLowerCase()}.png`;
              }}
            />
            <div className="player-badge p1-badge">P1</div>
          </div>

          <div className="fighter-status-block">
            {/* Top Name & Health Digits Row */}
            <div className="fighter-meta-line">
              <span className="fighter-title-name">{p1Profile.name}</span>
              <span className="fighter-subtitle-tag">{p1Profile.title}</span>
              <span className="fighter-hp-readout font-mono">
                {Math.max(0, Math.round(p1Stats.currentHealth))} <span className="hp-max-divider">/</span> {p1Stats.maxHealth}
              </span>
              
              {/* Sleek Golden Round Gems */}
              <div 
                className="round-gems-group" 
                role="img" 
                aria-label={`${p1Profile.name} rounds won: ${matchState.p1RoundsWon} of 3`}
              >
                <span className={`round-gem ${matchState.p1RoundsWon >= 1 ? 'gem-active' : ''}`} aria-hidden="true" />
                <span className={`round-gem ${matchState.p1RoundsWon >= 2 ? 'gem-active' : ''}`} aria-hidden="true" />
                <span className={`round-gem ${matchState.p1RoundsWon >= 3 ? 'gem-active' : ''}`} aria-hidden="true" />
              </div>
            </div>

            {/* Slanted Angular Life Bar */}
            <div className={`target-health-bar p1-health-bar ${p1HealthPercent < 25 ? 'health-critical-pulse' : ''}`}>
              <div className="target-health-ghost" style={{ width: `${p1GhostPercent}%` }} />
              <div 
                className="target-health-fill p1-fill" 
                style={{ width: `${p1HealthPercent}%` }} 
              />
            </div>

            {/* Sub-Meters: Guard & 3-Phase Burst Overdrive */}
            <div className="sub-meters-row">
              <div className="meter-unit guard-unit">
                <div className="meter-meta font-mono">
                  <Shield size={10} />
                  <span>GUARD</span>
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

            {/* Radiant Overdrive Banner */}
            {p1Super >= 100 && (
              <div className="overdrive-telemetry-banner p1-overdrive font-mono">
                <span className="overdrive-glitch" aria-hidden="true">★</span>
                <span>OVERDRIVE ACTIVE // [V] {p1Profile.specials.ultimate.name.toUpperCase()}</span>
                <span className="overdrive-glitch" aria-hidden="true">★</span>
              </div>
            )}
          </div>
        </div>

        {/* FLOATING CENTER CHRONO NODE */}
        <div className="floating-center-chrono">
          <div className="round-badge-pill">
            ROUND {matchState.round}
          </div>
          <div className={`chrono-timer-num font-mono ${matchState.timeRemaining <= 10 ? 'timer-danger' : ''}`}>
            {Math.ceil(matchState.timeRemaining).toString().padStart(2, '0')}
          </div>
        </div>

        {/* PLAYER 2 COMBAT CARD */}
        <div className="p2-fighter-card console-fighter-card">
          <div className="avatar-wrapper p2-avatar-frame">
            <img 
              src={`/assets/sprites/portraits/portrait_${p2Id.toLowerCase()}.png`} 
              alt={p2Profile.name} 
              className="avatar-img"
              onError={(e) => {
                (e.target as HTMLImageElement).src = `/assets/characters_full/${p2Id.toLowerCase()}.png`;
              }}
            />
            <div className="player-badge p2-badge">P2</div>
          </div>

          <div className="fighter-status-block reversed">
            {/* Top Name & Health Digits Row */}
            <div className="fighter-meta-line reversed">
              <span className="fighter-title-name">{p2Profile.name}</span>
              <span className="fighter-subtitle-tag">{p2Profile.title}</span>
              <span className="fighter-hp-readout font-mono">
                {Math.max(0, Math.round(p2Stats.currentHealth))} <span className="hp-max-divider">/</span> {p2Stats.maxHealth}
              </span>
              
              {/* Sleek Golden Round Gems */}
              <div 
                className="round-gems-group reversed" 
                role="img" 
                aria-label={`${p2Profile.name} rounds won: ${matchState.p2RoundsWon} of 3`}
              >
                <span className={`round-gem ${matchState.p2RoundsWon >= 1 ? 'gem-active' : ''}`} aria-hidden="true" />
                <span className={`round-gem ${matchState.p2RoundsWon >= 2 ? 'gem-active' : ''}`} aria-hidden="true" />
                <span className={`round-gem ${matchState.p2RoundsWon >= 3 ? 'gem-active' : ''}`} aria-hidden="true" />
              </div>
            </div>

            {/* Slanted Angular Life Bar */}
            <div className={`target-health-bar p2-health-bar ${p2HealthPercent < 25 ? 'health-critical-pulse' : ''}`}>
              <div className="target-health-ghost" style={{ width: `${p2GhostPercent}%` }} />
              <div 
                className="target-health-fill p2-fill" 
                style={{ width: `${p2HealthPercent}%` }} 
              />
            </div>

            {/* Sub-Meters: Guard & 3-Phase Burst Overdrive */}
            <div className="sub-meters-row reversed">
              <div className="meter-unit guard-unit">
                <div className="meter-meta font-mono">
                  <Shield size={10} />
                  <span>GUARD</span>
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

            {/* Radiant Overdrive Banner */}
            {p2Super >= 100 && (
              <div className="overdrive-telemetry-banner p2-overdrive font-mono">
                <span className="overdrive-glitch" aria-hidden="true">★</span>
                <span>OVERDRIVE ACTIVE // [P2] {p2Profile.specials.ultimate.name.toUpperCase()}</span>
                <span className="overdrive-glitch" aria-hidden="true">★</span>
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
