// src/pages/MainMenu.tsx
import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Swords, 
  Wrench, 
  Trophy, 
  User, 
  Settings as SettingsIcon, 
  Volume2, 
  VolumeX,
  Music,
  Mic,
  Wind,
  Monitor, 
  CheckCircle2, 
  X,
  Smartphone,
  Sparkles,
  Globe,
  Radio
} from 'lucide-react';
import { GameMode, GameSettings, GraphicsQuality } from '../types';
import { soundManager } from '../game/core/SoundManager';

interface MainMenuProps {
  onStartGame: (mode: GameMode) => void;
  settings: GameSettings;
  onUpdateSettings: (settings: GameSettings) => void;
  onOpenStageSelect?: () => void;
  onOpenCharacterSelect?: () => void;
  currentStageName?: string;
  currentP1Name?: string;
  currentP2Name?: string;
}

export const MainMenu: React.FC<MainMenuProps> = ({
  onStartGame,
  settings,
  onUpdateSettings,
  onOpenStageSelect,
  onOpenCharacterSelect,
  currentStageName = 'ANCIENT TEMPLE',
  currentP1Name = 'KAI',
  currentP2Name = 'SHADOW',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [modalTitle, setModalTitle] = useState('');
  const [modalDescription, setModalDescription] = useState('');
  const [modalPhase, setModalPhase] = useState('');

  // Animated background cyber canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Particle nodes
    const nodeCount = 55;
    const nodes: { x: number; y: number; vx: number; vy: number; color: string; size: number }[] = [];
    for (let i = 0; i < nodeCount; i++) {
      const isRed = i % 2 === 0;
      nodes.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.7,
        vy: (Math.random() - 0.5) * 0.7,
        color: isRed ? 'rgba(255, 26, 75, ' : 'rgba(0, 240, 255, ',
        size: Math.random() * 2.5 + 1.2,
      });
    }

    let time = 0;
    const render = () => {
      time += 0.015;
      ctx.fillStyle = '#06080e';
      ctx.fillRect(0, 0, width, height);

      // Atmospheric radial gradient
      const grad = ctx.createRadialGradient(
        width / 2, height / 2, 80,
        width / 2, height / 2, Math.max(width, height) * 0.75
      );
      grad.addColorStop(0, 'rgba(16, 23, 38, 0.6)');
      grad.addColorStop(1, 'rgba(4, 6, 10, 0.95)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // Draw subtle connecting lines
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 130) {
            const alpha = (1 - dist / 130) * 0.16;
            ctx.strokeStyle = `rgba(80, 120, 180, ${alpha})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.stroke();
          }
        }
      }

      // Draw floating particles
      nodes.forEach((n) => {
        n.x += n.vx;
        n.y += n.vy;

        if (n.x < 0) n.x = width;
        if (n.x > width) n.x = 0;
        if (n.y < 0) n.y = height;
        if (n.y > height) n.y = 0;

        ctx.fillStyle = `${n.color}0.65)`;
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.size, 0, Math.PI * 2);
        ctx.fill();
      });

      animId = requestAnimationFrame(render);
    };

    render();

    soundManager.playMenuMusic();

    return () => {
      soundManager.stopBGM(0.3);
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const openComingSoon = (title: string, desc: string, phase: string) => {
    soundManager.playMenuSelect();
    setModalTitle(title);
    setModalDescription(desc);
    setModalPhase(phase);
    setActiveModal('COMING_SOON');
  };

  const handleQualityChange = (quality: GraphicsQuality) => {
    soundManager.playMenuSelect();
    onUpdateSettings({ ...settings, graphicsQuality: quality });
  };

  return (
    <div className="main-menu-root">
      {/* Background Animated Canvas */}
      <canvas ref={canvasRef} className="menu-bg-canvas" />

      {/* Main Container */}
      <div className="menu-content-container">
        {/* ORIGINAL ARENA X LOGO */}
        <header className="menu-header">
          <div className="logo-badge">
            <span className="badge-dot" />
            <span>2.5D FIGHTING ENGINE • PHASE 7 ADVANCED ARENAS</span>
          </div>

          <div className="arena-logo-wrapper">
            <div className="logo-text-group">
              <span className="logo-arena">ARENA</span>
              <div className="logo-x-symbol">
                <span className="x-slash red-slash" />
                <span className="x-slash blue-slash" />
                <span className="x-core" />
              </div>
            </div>
            <div className="logo-underline">
              <span className="underline-red" />
              <span className="underline-center" />
              <span className="underline-blue" />
            </div>
          </div>

          <p className="menu-tagline">
            SIX ORIGINAL 2.5D FIGHTING ARENAS • MULTI-LAYER PARALLAX • ATMOSPHERIC 2D EFFECTS
          </p>
        </header>

        {/* INTERACTIVE NAVIGATION BUTTONS */}
        <nav className="menu-button-stack">
          {/* 1. PLAY BUTTON (Primary) */}
          <button
            className="menu-btn play-btn"
            onMouseEnter={() => soundManager.playMenuHover()}
            onClick={() => {
              soundManager.playMenuSelect();
              onStartGame('VERSUS');
            }}
          >
            <div className="btn-glow" />
            <div className="btn-content">
              <Swords className="btn-icon" size={24} />
              <div className="btn-text">
                <span className="title">PLAY VS BATTLE</span>
                <span className="sub">Local 2-Player 2D Anime Combat (Keyboard / Touch)</span>
              </div>
            </div>
            <div className="btn-corner-cut" />
          </button>

          {/* ONLINE PLAY (2XKO Aesthetic) */}
          <button
            className="menu-btn standard-btn online-menu-btn"
            style={{
              borderColor: '#00e5ff',
              background: 'linear-gradient(90deg, rgba(0, 229, 255, 0.15) 0%, rgba(10, 14, 24, 0.85) 100%)',
              boxShadow: '0 0 20px rgba(0, 229, 255, 0.25)',
            }}
            onMouseEnter={() => soundManager.playMenuHover()}
            onClick={() => {
              soundManager.playMenuSelect();
              onStartGame('ONLINE');
            }}
          >
            <div className="btn-content">
              <Radio className="btn-icon" size={22} style={{ color: '#00e5ff' }} />
              <div className="btn-text">
                <span className="title" style={{ color: '#00e5ff', fontWeight: 900 }}>ONLINE PLAY</span>
                <span className="sub">Public Rooms • Private Duels • Quick Matchmaking</span>
              </div>
            </div>
            <span className="status-tag phase2 active-tag" style={{ background: '#00e5ff', color: '#000000', fontWeight: 900 }}>
              LIVE NETPLAY
            </span>
          </button>

          {/* 2. TRAINING MODE */}
          <button
            className="menu-btn standard-btn"
            onMouseEnter={() => soundManager.playMenuHover()}
            onClick={() => {
              soundManager.playMenuSelect();
              onStartGame('TRAINING');
            }}
          >
            <div className="btn-content">
              <Play className="btn-icon" size={22} />
              <div className="btn-text">
                <span className="title">TRAINING DOJO</span>
                <span className="sub">Practice moves & combos against practice dummy</span>
              </div>
            </div>
          </button>

          {/* SELECT FIGHTERS (16-Fighter Roster) */}
          <button
            className="menu-btn standard-btn char-select-btn"
            style={{
              borderColor: '#00e5ff',
              background: 'linear-gradient(90deg, rgba(0, 229, 255, 0.15) 0%, rgba(10, 14, 24, 0.85) 100%)',
            }}
            onMouseEnter={() => soundManager.playMenuHover()}
            onClick={() => {
              soundManager.playMenuSelect();
              if (onOpenCharacterSelect) onOpenCharacterSelect();
            }}
          >
            <div className="btn-content">
              <User className="btn-icon" size={22} style={{ color: '#00e5ff' }} />
              <div className="btn-text">
                <span className="title" style={{ color: '#00e5ff', fontWeight: 900 }}>
                  SELECT FIGHTERS: {currentP1Name} vs {currentP2Name}
                </span>
                <span className="sub">16 Unique Combatants • Custom Martial Arts & Elemental Attacks</span>
              </div>
            </div>
            <span className="status-tag phase2 active-tag" style={{ background: '#00e5ff', color: '#050810', fontWeight: 900 }}>
              16 ROSTER
            </span>
          </button>

          {/* SELECT ARENA (Phase 7 2.5D Environments) */}
          <button
            className="menu-btn standard-btn stage-select-btn"
            style={{
              borderColor: '#ff00aa',
              background: 'linear-gradient(90deg, rgba(255, 0, 170, 0.15) 0%, rgba(10, 14, 24, 0.85) 100%)',
            }}
            onMouseEnter={() => soundManager.playMenuHover()}
            onClick={() => {
              soundManager.playMenuSelect();
              if (onOpenStageSelect) onOpenStageSelect();
            }}
          >
            <div className="btn-content">
              <Sparkles className="btn-icon" size={22} style={{ color: '#ff00aa' }} />
              <div className="btn-text">
                <span className="title" style={{ color: '#ff00aa', fontWeight: 900 }}>
                  STAGE SELECT: {currentStageName}
                </span>
                <span className="sub">Six Original 2.5D Arenas • Parallax & Weather FX</span>
              </div>
            </div>
            <span className="status-tag phase2 active-tag" style={{ background: '#ff00aa', color: '#ffffff', fontWeight: 900 }}>
              6 ARENAS
            </span>
          </button>

          {/* 3. CHARACTER STUDIO (Phase 2 Active Showcase) */}
          <button
            className="menu-btn standard-btn feature-badge-btn"
            onMouseEnter={() => soundManager.playMenuHover()}
            onClick={() => {
              soundManager.playMenuSelect();
              setActiveModal('CHARACTER_STUDIO');
            }}
          >
            <div className="btn-content">
              <Wrench className="btn-icon" size={22} />
              <div className="btn-text">
                <span className="title">CHARACTER STUDIO</span>
                <span className="sub">Inspect 3D Skeletal Rigs & 21-Animation Suite</span>
              </div>
            </div>
            <span className="status-tag phase2 active-tag">PHASE 2 ACTIVE</span>
          </button>

          {/* 4. TOURNAMENT (Coming Phase 4) */}
          <button
            className="menu-btn standard-btn feature-badge-btn"
            onMouseEnter={() => soundManager.playMenuHover()}
            onClick={() => 
              openComingSoon(
                'TOURNAMENT SYSTEM',
                'Phase 4 introduces online bracket matchmaking, ranked divisions, spectator cameras, and global fighting game leaderboards.',
                'PHASE 4: MULTIPLAYER & TOURNAMENTS'
              )
            }
          >
            <div className="btn-content">
              <Trophy className="btn-icon" size={22} />
              <div className="btn-text">
                <span className="title">TOURNAMENT</span>
                <span className="sub">Championship brackets & ranked leagues</span>
              </div>
            </div>
            <span className="status-tag phase4">COMING PHASE 4</span>
          </button>

          {/* 5. PROFILE (Coming Phase 4) */}
          <button
            className="menu-btn standard-btn feature-badge-btn"
            onMouseEnter={() => soundManager.playMenuHover()}
            onClick={() => 
              openComingSoon(
                'FIGHTER PROFILE',
                'Track win rates, damage statistics, match replays, unlocked titles, and competitive player rankings.',
                'PHASE 4: CAREER & STATS'
              )
            }
          >
            <div className="btn-content">
              <User className="btn-icon" size={22} />
              <div className="btn-text">
                <span className="title">PROFILE</span>
                <span className="sub">Fighter career stats, win/loss history & titles</span>
              </div>
            </div>
            <span className="status-tag phase4">COMING PHASE 4</span>
          </button>

          {/* 6. SETTINGS */}
          <button
            className="menu-btn standard-btn"
            onMouseEnter={() => soundManager.playMenuHover()}
            onClick={() => {
              soundManager.playMenuSelect();
              setActiveModal('SETTINGS');
            }}
          >
            <div className="btn-content">
              <SettingsIcon className="btn-icon" size={22} />
              <div className="btn-text">
                <span className="title">SETTINGS</span>
                <span className="sub">Graphics presets, audio levels & control options</span>
              </div>
            </div>
          </button>
        </nav>

        {/* FOOTER INFO BAR */}
        <footer className="menu-footer">
          <div className="footer-item">
            <span>VERSION:</span> <strong className="highlight">0.2.0-ALPHA</strong>
          </div>
          <div className="footer-dot">•</div>
          <div className="footer-item">
            <span>ENGINE:</span> <strong>PHASER 3 & HTML5 CANVAS 2D</strong>
          </div>
          <div className="footer-dot">•</div>
          <div className="footer-item">
            <span>BUILD:</span> <strong>PHASE 2 VERIFIED</strong>
          </div>
        </footer>
      </div>

      {/* --- MODAL 0: CHARACTER STUDIO (PHASE 2 SHOWCASE) --- */}
      {activeModal === 'CHARACTER_STUDIO' && (
        <div className="modal-backdrop">
          <div className="feature-preview-card character-studio-card">
            <button className="modal-close-btn" onClick={() => setActiveModal(null)}>
              <X size={20} />
            </button>
            <div className="preview-phase-pill">PHASE 2: 3D SKELETAL FIGHTERS & RIGS</div>
            <h2 className="preview-title">CHARACTER STUDIO</h2>
            <div className="preview-divider" />
            <p className="preview-description">
              Professional 21-bone humanoid skeletal rigs with 21 distinct fighting-game animations and unique athletic aesthetics.
            </p>

            <div className="studio-fighter-grid">
              {/* Fighter 1 Showcase */}
              <div className="studio-fighter-panel p1-panel">
                <div className="panel-badge p1-badge">PLAYER 1</div>
                <h3 className="fighter-title">KAI</h3>
                <span className="fighter-subtitle">CRIMSON STRIKER</span>
                <ul className="fighter-specs">
                  <li><strong>Aesthetic:</strong> Athletic Martial Artist</li>
                  <li><strong>Hair:</strong> Spiked Black Hair & Red Headband</li>
                  <li><strong>Outfit:</strong> Open Combat Gi Vest with Dragon Crest</li>
                  <li><strong>Hands:</strong> Wrapped Red Martial Arts Tapes</li>
                  <li><strong>Legs:</strong> Black Fighting Pants & Steel-Toe Boots</li>
                </ul>
              </div>

              {/* Fighter 2 Showcase */}
              <div className="studio-fighter-panel p2-panel">
                <div className="panel-badge p2-badge">PLAYER 2</div>
                <h3 className="fighter-title">ION</h3>
                <span className="fighter-subtitle">COBALT VANGUARD</span>
                <ul className="fighter-specs">
                  <li><strong>Aesthetic:</strong> Cyber Kickboxer</li>
                  <li><strong>Hair:</strong> Undercut Fade with Cyan Edge</li>
                  <li><strong>Outfit:</strong> High-Collar Combat Jacket & Blue Piping</li>
                  <li><strong>Hands:</strong> Tactical Fingerless Cyber Gloves</li>
                  <li><strong>Legs:</strong> Armored Cargo Trousers & Neon Sneakers</li>
                </ul>
              </div>
            </div>

            <div className="animation-suite-list">
              <h4>21-ANIMATION SKELETAL SYSTEM:</h4>
              <div className="anim-chips">
                <span>Idle</span>
                <span>Breathing</span>
                <span>Walk Fwd</span>
                <span>Walk Bwd</span>
                <span>Run</span>
                <span>Jump</span>
                <span>Fall</span>
                <span>Land</span>
                <span>Crouch</span>
                <span>Lead Jab</span>
                <span>Cross</span>
                <span>Overhand Smash</span>
                <span>Front Kick</span>
                <span>Roundhouse</span>
                <span>Low Sweep</span>
                <span>Guard Block</span>
                <span>Hit Reaction</span>
                <span>Knockback</span>
                <span>Stagger</span>
                <span>Victory</span>
                <span>Defeat</span>
              </div>
            </div>

            <button 
              className="arena-btn primary-btn full-width"
              onClick={() => {
                soundManager.playMenuSelect();
                setActiveModal(null);
              }}
            >
              CLOSE STUDIO
            </button>
          </div>
        </div>
      )}

      {/* --- MODAL 1: COMING SOON PREVIEW --- */}
      {activeModal === 'COMING_SOON' && (
        <div className="modal-backdrop">
          <div className="feature-preview-card">
            <button className="modal-close-btn" onClick={() => setActiveModal(null)}>
              <X size={20} />
            </button>
            <div className="preview-phase-pill">{modalPhase}</div>
            <h2 className="preview-title">{modalTitle}</h2>
            <div className="preview-divider" />
            <p className="preview-description">{modalDescription}</p>
            <div className="preview-checklist">
              <div className="checklist-item">
                <CheckCircle2 size={16} className="check-icon" />
                <span>Phase 1 Core 3D Prototype Running</span>
              </div>
              <div className="checklist-item">
                <Sparkles size={16} className="sparkle-icon" />
                <span>Awaiting Phase Completion Approval</span>
              </div>
            </div>
            <button 
              className="arena-btn primary-btn"
              onClick={() => {
                soundManager.playMenuSelect();
                setActiveModal(null);
              }}
            >
              UNDERSTOOD
            </button>
          </div>
        </div>
      )}

      {/* --- MODAL 2: SETTINGS MODAL --- */}
      {activeModal === 'SETTINGS' && (
        <div className="modal-backdrop">
          <div className="settings-modal-card">
            <button className="modal-close-btn" onClick={() => setActiveModal(null)}>
              <X size={20} />
            </button>
            <h2 className="modal-title">GAME SETTINGS</h2>
            <div className="modal-divider" />

            {/* Graphics Preset */}
            <div className="setting-row">
              <div className="setting-label">
                <Monitor size={18} />
                <span>Graphics Quality Preset</span>
              </div>
              <div className="quality-button-group">
                {(['low', 'medium', 'high'] as GraphicsQuality[]).map((q) => (
                  <button
                    key={q}
                    className={`quality-btn ${settings.graphicsQuality === q ? 'active' : ''}`}
                    onClick={() => handleQualityChange(q)}
                  >
                    {q.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* Audio Channels & Sliders */}
            <div className="setting-section-header" style={{ marginTop: '14px', marginBottom: '8px', color: '#00e5ff', fontSize: '13px', fontWeight: 'bold', letterSpacing: '1px' }}>
              AUDIO CHANNELS & CINEMATIC SOUND
            </div>

            {/* Mute All Toggle */}
            <div className="setting-row">
              <div className="setting-label">
                {settings.isMuted ? <VolumeX size={18} color="#ff1744" /> : <Volume2 size={18} color="#00e5ff" />}
                <span>Mute All Audio</span>
              </div>
              <button
                className={`toggle-btn ${settings.isMuted ? 'active' : ''}`}
                onClick={() => {
                  const muted = soundManager.toggleMute();
                  onUpdateSettings({ ...settings, isMuted: muted });
                }}
              >
                {settings.isMuted ? 'MUTED' : 'UNMUTED'}
              </button>
            </div>

            {/* Audio Master Volume */}
            <div className="setting-row">
              <div className="setting-label">
                <Volume2 size={18} />
                <span>Master Volume ({Math.round(settings.masterVolume * 100)}%)</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={settings.masterVolume}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  soundManager.setMasterVolume(val);
                  onUpdateSettings({ ...settings, masterVolume: val });
                }}
                className="setting-slider"
              />
            </div>

            {/* Background Music Volume */}
            <div className="setting-row">
              <div className="setting-label">
                <Music size={18} color="#bb86fc" />
                <span>Music / BGM ({Math.round(settings.musicVolume * 100)}%)</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={settings.musicVolume}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  soundManager.setMusicVolume(val);
                  onUpdateSettings({ ...settings, musicVolume: val });
                }}
                className="setting-slider"
              />
            </div>

            {/* SFX Volume */}
            <div className="setting-row">
              <div className="setting-label">
                <Sparkles size={18} color="#ffb74d" />
                <span>Combat SFX ({Math.round(settings.sfxVolume * 100)}%)</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={settings.sfxVolume}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  soundManager.setSfxVolume(val);
                  soundManager.playHeavyHit();
                  onUpdateSettings({ ...settings, sfxVolume: val });
                }}
                className="setting-slider"
              />
            </div>

            {/* Character Voices Volume */}
            <div className="setting-row">
              <div className="setting-label">
                <Mic size={18} color="#4fc3f7" />
                <span>Character Voices ({Math.round(settings.voiceVolume * 100)}%)</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={settings.voiceVolume}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  soundManager.setVoiceVolume(val);
                  soundManager.playVoiceLine('KAI', 'ATTACK_HEAVY');
                  onUpdateSettings({ ...settings, voiceVolume: val });
                }}
                className="setting-slider"
              />
            </div>

            {/* Ambience Volume */}
            <div className="setting-row">
              <div className="setting-label">
                <Wind size={18} color="#81c784" />
                <span>Stage Ambience ({Math.round(settings.ambienceVolume * 100)}%)</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={settings.ambienceVolume}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  soundManager.setAmbienceVolume(val);
                  onUpdateSettings({ ...settings, ambienceVolume: val });
                }}
                className="setting-slider"
              />
            </div>

            {/* Touch Controls Toggle */}
            <div className="setting-row">
              <div className="setting-label">
                <Smartphone size={18} />
                <span>Virtual Touch Controls</span>
              </div>
              <button
                className={`toggle-btn ${settings.enableTouchControls ? 'active' : ''}`}
                onClick={() => {
                  soundManager.playMenuSelect();
                  onUpdateSettings({
                    ...settings,
                    enableTouchControls: !settings.enableTouchControls,
                  });
                }}
              >
                {settings.enableTouchControls ? 'ENABLED' : 'DISABLED'}
              </button>
            </div>

            {/* Close Button */}
            <div className="modal-actions">
              <button
                className="arena-btn primary-btn full-width"
                onClick={() => {
                  soundManager.playMenuSelect();
                  setActiveModal(null);
                }}
              >
                SAVE & CLOSE
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
