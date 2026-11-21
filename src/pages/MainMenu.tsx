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
  Monitor, 
  CheckCircle2, 
  X,
  Smartphone,
  Sparkles
} from 'lucide-react';
import { GameMode, GameSettings, GraphicsQuality } from '../types';
import { soundManager } from '../game/core/SoundManager';

interface MainMenuProps {
  onStartGame: (mode: GameMode) => void;
  settings: GameSettings;
  onUpdateSettings: (settings: GameSettings) => void;
}

export const MainMenu: React.FC<MainMenuProps> = ({
  onStartGame,
  settings,
  onUpdateSettings,
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

    return () => {
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
            <span>2.5D FIGHTING ENGINE • PHASE 1</span>
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
            NEXT-GEN WEB 3D FIGHTING PROTOTYPE • ARTICULATED HUMANOIDS • RAPIER PHYSICS
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
                <span className="sub">Local 2-Player 3D Combat (Keyboard / Touch)</span>
              </div>
            </div>
            <div className="btn-corner-cut" />
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

          {/* 3. CHARACTER STUDIO (Coming Phase 2) */}
          <button
            className="menu-btn standard-btn feature-badge-btn"
            onMouseEnter={() => soundManager.playMenuHover()}
            onClick={() => 
              openComingSoon(
                'CHARACTER STUDIO',
                'Phase 2 replaces articulated placeholder geometry with fully rigged 3D GLTF models, skeletal skinning, custom shaders, armor attachments, and color customizations.',
                'PHASE 2: RIGGED FIGHTERS & CUSTOMIZATION'
              )
            }
          >
            <div className="btn-content">
              <Wrench className="btn-icon" size={22} />
              <div className="btn-text">
                <span className="title">CHARACTER STUDIO</span>
                <span className="sub">Fighter loadouts, armor customization & palettes</span>
              </div>
            </div>
            <span className="status-tag phase2">COMING PHASE 2</span>
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
            <span>VERSION:</span> <strong className="highlight">0.1.0-ALPHA</strong>
          </div>
          <div className="footer-dot">•</div>
          <div className="footer-item">
            <span>ENGINE:</span> <strong>THREE.JS & RAPIER 3D</strong>
          </div>
          <div className="footer-dot">•</div>
          <div className="footer-item">
            <span>BUILD:</span> <strong>PHASE 1 VERIFIED</strong>
          </div>
        </footer>
      </div>

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
