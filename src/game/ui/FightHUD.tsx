// src/game/ui/FightHUD.tsx
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
  Smartphone
} from 'lucide-react';
import { FighterStats, GameState, MatchState, PlayerId } from '../../types';
import { soundManager } from '../core/SoundManager';

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

  // Ghost health bars for smooth fighting game hit feel
  const [p1GhostHealth, setP1GhostHealth] = useState(100);
  const [p2GhostHealth, setP2GhostHealth] = useState(100);

  // Detect mobile touch
  useEffect(() => {
    const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    if (isTouch) {
      setShowTouchControls(true);
    }
  }, []);

  // Update delayed ghost health
  useEffect(() => {
    const timer = setTimeout(() => {
      setP1GhostHealth(p1Stats.currentHealth);
    }, 400);
    return () => clearTimeout(timer);
  }, [p1Stats.currentHealth]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setP2GhostHealth(p2Stats.currentHealth);
    }, 400);
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

  const p1HealthPercent = (p1Stats.currentHealth / p1Stats.maxHealth) * 100;
  const p1GhostPercent = (p1GhostHealth / p1Stats.maxHealth) * 100;

  const p2HealthPercent = (p2Stats.currentHealth / p2Stats.maxHealth) * 100;
  const p2GhostPercent = (p2GhostHealth / p2Stats.maxHealth) * 100;

  return (
    <div className="fight-hud-root">
      {/* 1. TOP FIGHTING STATUS BAR */}
      <header className="hud-top-bar">
        {/* PLAYER 1 HEALTH & INFO */}
        <div className="fighter-card p1-card">
          <div className="fighter-header">
            <span className="player-tag p1-tag">P1</span>
            <div className="fighter-meta">
              <span className="fighter-name p1-name">{p1Stats.name}</span>
              <span className="fighter-sub">CRIMSON STRIKER</span>
            </div>
            <div className="round-dots">
              <span className={`dot ${matchState.p1RoundsWon >= 1 ? 'won' : ''}`} />
              <span className={`dot ${matchState.p1RoundsWon >= 2 ? 'won' : ''}`} />
            </div>
          </div>
          {/* Health Bar Track */}
          <div className="health-bar-container p1-bar">
            <div className="health-bar-ghost" style={{ width: `${p1GhostPercent}%` }} />
            <div className="health-bar-fill p1-fill" style={{ width: `${p1HealthPercent}%` }} />
            <div className="health-bar-glare" />
          </div>
        </div>

        {/* CENTER MATCH TIMER & ROUND */}
        <div className="hud-center-node">
          <div className="round-badge">
            ROUND {matchState.round}
          </div>
          <div className={`match-timer ${matchState.timeRemaining <= 10 ? 'timer-danger' : ''}`}>
            {Math.ceil(matchState.timeRemaining).toString().padStart(2, '0')}
          </div>
        </div>

        {/* PLAYER 2 HEALTH & INFO */}
        <div className="fighter-card p2-card">
          <div className="fighter-header reversed">
            <span className="player-tag p2-tag">P2</span>
            <div className="fighter-meta">
              <span className="fighter-name p2-name">{p2Stats.name}</span>
              <span className="fighter-sub">COBALT VANGUARD</span>
            </div>
            <div className="round-dots">
              <span className={`dot ${matchState.p2RoundsWon >= 1 ? 'won' : ''}`} />
              <span className={`dot ${matchState.p2RoundsWon >= 2 ? 'won' : ''}`} />
            </div>
          </div>
          {/* Health Bar Track */}
          <div className="health-bar-container p2-bar">
            <div className="health-bar-ghost" style={{ width: `${p2GhostPercent}%` }} />
            <div className="health-bar-fill p2-fill" style={{ width: `${p2HealthPercent}%` }} />
            <div className="health-bar-glare" />
          </div>
        </div>
      </header>

      {/* 2. TOP RIGHT QUICK UTILITY BUTTONS */}
      <div className="hud-utility-bar">
        {fps !== undefined && (
          <span className="fps-indicator">{fps} FPS</span>
        )}
        <button 
          className="hud-icon-btn" 
          onClick={toggleMute} 
          title={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
        </button>
        <button 
          className="hud-icon-btn" 
          onClick={() => setShowControls(!showControls)} 
          title="Toggle Controls Guide"
        >
          <HelpCircle size={18} />
        </button>
        <button 
          className="hud-icon-btn" 
          onClick={() => setShowTouchControls(!showTouchControls)} 
          title="Toggle Touch Controls"
        >
          <Smartphone size={18} />
        </button>
        <button 
          className="hud-icon-btn" 
          onClick={toggleFullscreen} 
          title="Toggle Fullscreen"
        >
          <Maximize2 size={18} />
        </button>
        <button 
          className="hud-icon-btn pause-btn" 
          onClick={onPause} 
          title="Pause Match"
        >
          <Pause size={18} />
        </button>
      </div>

      {/* 3. CENTER BANNER ANNOUNCEMENT */}
      {matchState.announcement && (
        <div className="hud-announcement-overlay">
          <div className="announcement-banner">
            <h1 className="announcement-text">{matchState.announcement}</h1>
            <div className="announcement-flare" />
          </div>
        </div>
      )}

      {/* 4. CONTROLS GUIDE OVERLAY (DESKTOP) */}
      {showControls && (
        <div className="controls-guide-bar">
          <div className="control-column p1-controls">
            <span className="col-title p1-accent">P1 CONTROLS:</span>
            <span className="key-pill">A/D</span> Move
            <span className="key-pill">W</span> Jump
            <span className="key-pill">S</span> Crouch
            <span className="key-pill">F</span> Punch
            <span className="key-pill">G</span> Kick
            <span className="key-pill">H</span> Block
          </div>
          <div className="control-divider" />
          <div className="control-column p2-controls">
            <span className="col-title p2-accent">P2 CONTROLS:</span>
            <span className="key-pill">← / →</span> Move
            <span className="key-pill">↑</span> Jump
            <span className="key-pill">↓</span> Crouch
            <span className="key-pill">J</span> Punch
            <span className="key-pill">K</span> Kick
            <span className="key-pill">L</span> Block
          </div>
        </div>
      )}

      {/* 5. VIRTUAL TOUCH CONTROLS FOR MOBILE / TABLET */}
      {showTouchControls && (
        <div className="touch-controls-layer">
          {/* Left Virtual D-Pad (Player 1 Movement) */}
          <div className="touch-dpad">
            <button
              className="dpad-btn up"
              onTouchStart={() => onTouchInput('P1', 'jump', true)}
              onTouchEnd={() => onTouchInput('P1', 'jump', false)}
              onMouseDown={() => onTouchInput('P1', 'jump', true)}
              onMouseUp={() => onTouchInput('P1', 'jump', false)}
            >
              ▲
            </button>
            <div className="dpad-middle">
              <button
                className="dpad-btn left"
                onTouchStart={() => onTouchInput('P1', 'moveLeft', true)}
                onTouchEnd={() => onTouchInput('P1', 'moveLeft', false)}
                onMouseDown={() => onTouchInput('P1', 'moveLeft', true)}
                onMouseUp={() => onTouchInput('P1', 'moveLeft', false)}
              >
                ◀
              </button>
              <div className="dpad-center">●</div>
              <button
                className="dpad-btn right"
                onTouchStart={() => onTouchInput('P1', 'moveRight', true)}
                onTouchEnd={() => onTouchInput('P1', 'moveRight', false)}
                onMouseDown={() => onTouchInput('P1', 'moveRight', true)}
                onMouseUp={() => onTouchInput('P1', 'moveRight', false)}
              >
                ▶
              </button>
            </div>
            <button
              className="dpad-btn down"
              onTouchStart={() => onTouchInput('P1', 'crouch', true)}
              onTouchEnd={() => onTouchInput('P1', 'crouch', false)}
              onMouseDown={() => onTouchInput('P1', 'crouch', true)}
              onMouseUp={() => onTouchInput('P1', 'crouch', false)}
            >
              ▼
            </button>
          </div>

          {/* Right Action Buttons (Combat Actions) */}
          <div className="touch-action-buttons">
            <button
              className="action-btn punch-btn"
              onTouchStart={() => onTouchInput('P1', 'punch', true)}
              onTouchEnd={() => onTouchInput('P1', 'punch', false)}
              onMouseDown={() => onTouchInput('P1', 'punch', true)}
              onMouseUp={() => onTouchInput('P1', 'punch', false)}
            >
              <span>PUNCH</span>
              <small>[F]</small>
            </button>
            <button
              className="action-btn kick-btn"
              onTouchStart={() => onTouchInput('P1', 'kick', true)}
              onTouchEnd={() => onTouchInput('P1', 'kick', false)}
              onMouseDown={() => onTouchInput('P1', 'kick', true)}
              onMouseUp={() => onTouchInput('P1', 'kick', false)}
            >
              <span>KICK</span>
              <small>[G]</small>
            </button>
            <button
              className="action-btn block-btn"
              onTouchStart={() => onTouchInput('P1', 'block', true)}
              onTouchEnd={() => onTouchInput('P1', 'block', false)}
              onMouseDown={() => onTouchInput('P1', 'block', true)}
              onMouseUp={() => onTouchInput('P1', 'block', false)}
            >
              <span>BLOCK</span>
              <small>[H]</small>
            </button>
          </div>
        </div>
      )}

      {/* 6. PAUSE MODAL */}
      {gameState === 'PAUSED' && (
        <div className="modal-backdrop">
          <div className="pause-modal-card">
            <h2 className="modal-title">MATCH PAUSED</h2>
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

      {/* 7. MATCH OVER MODAL */}
      {gameState === 'MATCH_OVER' && (
        <div className="modal-backdrop">
          <div className="match-over-card">
            <div className="winner-crown">VICTORY</div>
            <h2 className={`winner-title ${matchState.winner === 'P1' ? 'p1-winner' : 'p2-winner'}`}>
              {matchState.winner === 'P1' ? 'PLAYER 1 WINS' : 'PLAYER 2 WINS'}
            </h2>
            <p className="match-score-summary">
              {p1Stats.name} [{matchState.p1RoundsWon}] — [{matchState.p2RoundsWon}] {p2Stats.name}
            </p>
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
    </div>
  );
};
