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

  // Delayed ghost health bar for impactful fighting-game hit feedback
  const [p1GhostHealth, setP1GhostHealth] = useState(100);
  const [p2GhostHealth, setP2GhostHealth] = useState(100);

  // Auto-detect touch device
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
    }, 380);
    return () => clearTimeout(timer);
  }, [p1Stats.currentHealth]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setP2GhostHealth(p2Stats.currentHealth);
    }, 380);
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

  return (
    <div className="fight-hud-root">
      {/* ============================================================== */}
      {/* 1. TOP FIGHTING STATUS BAR (MATCHING VISUAL TARGET)            */}
      {/* ============================================================== */}
      <header className="target-hud-top-bar">
        {/* PLAYER 1: KAI */}
        <div className="p1-fighter-card">
          <div className="avatar-wrapper p1-avatar-ring">
            <img 
              src="/assets/sprites/portrait_kai.png" 
              alt="Kai" 
              className="avatar-img"
              onError={(e) => {
                // Fallback to stylized SVG if image missing
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
            <div className="player-badge p1-badge">P1</div>
          </div>

          <div className="fighter-status-block">
            <div className="fighter-meta-line">
              <span className="fighter-title-name">KAI</span>
              <span className="fighter-subtitle-tag">CRIMSON STRIKER</span>
              {/* Round Win Dots */}
              <div className="round-dots-group">
                <span className={`target-dot ${matchState.p1RoundsWon >= 1 ? 'dot-won-p1' : ''}`} />
                <span className={`target-dot ${matchState.p1RoundsWon >= 2 ? 'dot-won-p1' : ''}`} />
                <span className={`target-dot ${matchState.p1RoundsWon >= 3 ? 'dot-won-p1' : ''}`} />
              </div>
            </div>

            {/* Angular Neon Green-to-Cyan Health Bar */}
            <div className="target-health-bar p1-health-bar">
              <div className="target-health-ghost" style={{ width: `${p1GhostPercent}%` }} />
              <div className="target-health-fill p1-fill" style={{ width: `${p1HealthPercent}%` }} />
              <div className="target-health-sheen" />
            </div>

            {/* Guard Meter */}
            <div className="target-guard-bar p1-guard-bar" style={{ height: '4px', background: 'rgba(0,0,0,0.6)', marginTop: '3px', borderRadius: '2px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${Math.max(0, p1Stats.guardMeter || 100)}%`, background: (p1Stats.guardMeter || 100) < 30 ? '#ff1e3c' : '#00f0ff', transition: 'width 0.1s linear' }} />
            </div>
          </div>
        </div>

        {/* CENTER TOURNAMENT TIMER & ARENA X CREST */}
        <div className="target-center-node">
          <div className="target-logo-row">
            <span className="logo-arena-text">ARENA</span>
            <span className="logo-x-text">X</span>
          </div>
          <div className="target-round-pill">
            ROUND {matchState.round}
          </div>
          <div className={`target-match-timer ${matchState.timeRemaining <= 10 ? 'timer-danger' : ''}`}>
            {Math.ceil(matchState.timeRemaining).toString().padStart(2, '0')}
          </div>
        </div>

        {/* PLAYER 2: SHADOW */}
        <div className="p2-fighter-card">
          <div className="avatar-wrapper p2-avatar-ring">
            <img 
              src="/assets/sprites/portrait_shadow.png" 
              alt="Shadow" 
              className="avatar-img"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
            <div className="player-badge p2-badge">P2</div>
          </div>

          <div className="fighter-status-block reversed">
            <div className="fighter-meta-line reversed">
              <span className="fighter-title-name">SHADOW</span>
              <span className="fighter-subtitle-tag">SHADOW FIGHTER</span>
              <div className="round-dots-group">
                <span className={`target-dot ${matchState.p2RoundsWon >= 1 ? 'dot-won-p2' : ''}`} />
                <span className={`target-dot ${matchState.p2RoundsWon >= 2 ? 'dot-won-p2' : ''}`} />
                <span className={`target-dot ${matchState.p2RoundsWon >= 3 ? 'dot-won-p2' : ''}`} />
              </div>
            </div>

            {/* Angular Neon Green-to-Cyan Health Bar */}
            <div className="target-health-bar p2-health-bar">
              <div className="target-health-ghost" style={{ width: `${p2GhostPercent}%` }} />
              <div className="target-health-fill p2-fill" style={{ width: `${p2HealthPercent}%` }} />
              <div className="target-health-sheen" />
            </div>

            {/* Guard Meter */}
            <div className="target-guard-bar p2-guard-bar" style={{ height: '4px', background: 'rgba(0,0,0,0.6)', marginTop: '3px', borderRadius: '2px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${Math.max(0, p2Stats.guardMeter || 100)}%`, background: (p2Stats.guardMeter || 100) < 30 ? '#ff1e3c' : '#ff0055', transition: 'width 0.1s linear', marginLeft: 'auto' }} />
            </div>
          </div>
        </div>
      </header>

      {/* ============================================================== */}
      {/* 2. TOP UTILITY TOOLBAR (Mute, Fullscreen, Pause)               */}
      {/* ============================================================== */}
      <div className="hud-utility-bar">
        {fps !== undefined && (
          <span className="fps-indicator">{fps} FPS</span>
        )}
        <button 
          className="hud-icon-btn" 
          onClick={toggleMute} 
          title={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted ? <VolumeX size={17} /> : <Volume2 size={17} />}
        </button>
        <button 
          className="hud-icon-btn" 
          onClick={() => setShowControls(!showControls)} 
          title="Toggle Controls Guide"
        >
          <HelpCircle size={17} />
        </button>
        <button 
          className="hud-icon-btn" 
          onClick={() => setShowTouchControls(!showTouchControls)} 
          title="Toggle Touch Controls"
        >
          <Smartphone size={17} />
        </button>
        <button 
          className="hud-icon-btn" 
          onClick={toggleFullscreen} 
          title="Toggle Fullscreen"
        >
          <Maximize2 size={17} />
        </button>
        <button 
          className="hud-icon-btn pause-btn" 
          onClick={onPause} 
          title="Pause Match"
        >
          <Pause size={17} />
        </button>
      </div>

      {/* ============================================================== */}
      {/* 3. CENTER BANNER ANNOUNCEMENT (ROUND 1, FIGHT!, K.O.)          */}
      {/* ============================================================== */}
      {matchState.announcement && (
        <div className="hud-announcement-overlay">
          <div className="announcement-banner">
            <h1 className="announcement-text">{matchState.announcement}</h1>
            <div className="announcement-flare" />
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 4. BOTTOM CONTROLS GUIDE (EXACTLY MATCHING TARGET IMAGE)       */}
      {/* ============================================================== */}
      {showControls && (
        <footer className="target-bottom-controls-bar">
          {/* P1 CONTROLS */}
          <div className="p1-controls-section">
            <span className="p1-label">P1 (KAI):</span>
            <div className="key-item"><span className="key-cap">A/D</span> Move</div>
            <div className="key-item"><span className="key-cap">W</span> Jump</div>
            <div className="key-item"><span className="key-cap">S</span> Crouch</div>
            <div className="key-item"><span className="key-cap">F</span> Punch</div>
            <div className="key-item"><span className="key-cap">R</span> Heavy</div>
            <div className="key-item"><span className="key-cap">G</span> Kick</div>
            <div className="key-item"><span className="key-cap">T</span> High Kick</div>
            <div className="key-item"><span className="key-cap">H</span> Block</div>
            <div className="key-item"><span className="key-cap">SPACE</span> Special</div>
          </div>

          <div className="controls-glow-divider" />

          {/* P2 CONTROLS */}
          <div className="p2-controls-section">
            <span className="p2-label">P2 (SHADOW):</span>
            <div className="key-item"><span className="key-cap">← / →</span> Move</div>
            <div className="key-item"><span className="key-cap">↑</span> Jump</div>
            <div className="key-item"><span className="key-cap">↓</span> Crouch</div>
            <div className="key-item"><span className="key-cap">J</span> Punch</div>
            <div className="key-item"><span className="key-cap">U</span> Heavy</div>
            <div className="key-item"><span className="key-cap">K</span> Kick</div>
            <div className="key-item"><span className="key-cap">I</span> High Kick</div>
            <div className="key-item"><span className="key-cap">L</span> Block</div>
            <div className="key-item"><span className="key-cap">O</span> Special</div>
          </div>
        </footer>
      )}

      {/* ============================================================== */}
      {/* 5. VIRTUAL TOUCH CONTROLS FOR MOBILE / TABLET                  */}
      {/* ============================================================== */}
      {showTouchControls && (
        <div className="touch-controls-layer">
          {/* Left Virtual D-Pad (Directional Movement, Jump, Crouch) */}
          <div className="touch-dpad">
            <button
              className="dpad-btn up"
              onTouchStart={() => onTouchInput('P1', 'jump', true)}
              onTouchEnd={() => onTouchInput('P1', 'jump', false)}
              onMouseDown={() => onTouchInput('P1', 'jump', true)}
              onMouseUp={() => onTouchInput('P1', 'jump', false)}
              aria-label="Jump [W]"
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
                aria-label="Move Left [A]"
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
                aria-label="Move Right [D]"
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
              aria-label="Crouch [S]"
            >
              ▼
            </button>
          </div>

          {/* Right Combat Action Buttons (Jump, Punch, Kick, Block) */}
          <div className="touch-action-buttons">
            <button
              className="action-btn jump-btn"
              onTouchStart={() => onTouchInput('P1', 'jump', true)}
              onTouchEnd={() => onTouchInput('P1', 'jump', false)}
              onMouseDown={() => onTouchInput('P1', 'jump', true)}
              onMouseUp={() => onTouchInput('P1', 'jump', false)}
            >
              <span>JUMP</span>
              <small>[W]</small>
            </button>
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
            <button
              className="action-btn special-btn"
              onTouchStart={() => onTouchInput('P1', 'special', true)}
              onTouchEnd={() => onTouchInput('P1', 'special', false)}
              onMouseDown={() => onTouchInput('P1', 'special', true)}
              onMouseUp={() => onTouchInput('P1', 'special', false)}
            >
              <span>SPECIAL</span>
              <small>[SPACE]</small>
            </button>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 6. PAUSE MODAL                                                 */}
      {/* ============================================================== */}
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

      {/* ============================================================== */}
      {/* 7. MATCH OVER MODAL                                            */}
      {/* ============================================================== */}
      {gameState === 'MATCH_OVER' && (
        <div className="modal-backdrop">
          <div className="match-over-card">
            <div className="winner-crown">ARENA X CHAMPION</div>
            <h2 className={`winner-title ${matchState.winner === 'P1' ? 'p1-winner' : 'p2-winner'}`}>
              {matchState.winner === 'P1' ? 'KAI WINS' : 'ZEN WINS'}
            </h2>
            <p className="match-score-summary">
              KAI [{matchState.p1RoundsWon}] — [{matchState.p2RoundsWon}] ZEN
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
