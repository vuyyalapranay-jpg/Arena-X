// src/pages/MainMenu.tsx
// ARENA X — CONSOLE-GRADE 2D FIGHTING GAME LOBBY & MAIN MENU (PHASE 2)

import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Swords, 
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
  Radio,
  Flame,
  ChevronLeft,
  ChevronRight,
  Shield,
  Coins,
  Crown
} from 'lucide-react';
import { GameMode, GameSettings, GraphicsQuality } from '../types';
import { soundManager } from '../game/core/SoundManager';
import { PlayerProfileModal } from '../components/PlayerProfileModal';
import { ROSTER_FIGHTERS, FighterId } from '../game/characters/RosterConfig';
import { progressionManager } from '../game/progression/ProgressionManager';

interface MainMenuProps {
  onStartGame: (mode: GameMode) => void;
  settings: GameSettings;
  onUpdateSettings: (settings: GameSettings) => void;
  onOpenStageSelect?: () => void;
  onOpenCharacterSelect?: () => void;
  currentStageName?: string;
  currentP1Name?: string;
  currentP2Name?: string;
  onOpenTournament?: () => void;
}

const ROSTER_ARRAY = Object.values(ROSTER_FIGHTERS);

export const MainMenu: React.FC<MainMenuProps> = ({
  onStartGame,
  settings,
  onUpdateSettings,
  onOpenStageSelect,
  onOpenCharacterSelect,
  currentStageName = 'ANCIENT TEMPLE',
  currentP1Name = 'KAI',
  currentP2Name = 'SHADOW',
  onOpenTournament,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [modalTitle, setModalTitle] = useState('');
  const [modalDescription, setModalDescription] = useState('');
  const [modalPhase, setModalPhase] = useState('');
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [featuredIndex, setFeaturedIndex] = useState(0);

  // Get current profile
  const [profile, setProfile] = useState(() => progressionManager.getProfile());

  useEffect(() => {
    const unsub = progressionManager.subscribe((updated) => setProfile({ ...updated }));
    return () => unsub();
  }, []);

  const currentHero = ROSTER_ARRAY[featuredIndex] || ROSTER_ARRAY[0];

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
      ctx.fillStyle = '#04060a';
      ctx.fillRect(0, 0, width, height);

      // Atmospheric radial gradient
      const grad = ctx.createRadialGradient(
        width / 2, height / 2, 80,
        width / 2, height / 2, Math.max(width, height) * 0.75
      );
      grad.addColorStop(0, 'rgba(14, 20, 34, 0.65)');
      grad.addColorStop(1, 'rgba(4, 6, 10, 0.98)');
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

  const handleNextHero = () => {
    soundManager.playMenuSelect();
    setFeaturedIndex((prev) => (prev + 1) % ROSTER_ARRAY.length);
  };

  const handlePrevHero = () => {
    soundManager.playMenuSelect();
    setFeaturedIndex((prev) => (prev - 1 + ROSTER_ARRAY.length) % ROSTER_ARRAY.length);
  };

  return (
    <div className="main-menu-root menu-console-root">
      {/* Background Animated Canvas */}
      <canvas ref={canvasRef} className="menu-bg-canvas" />

      {/* 1. TOP STATUS STRIP (FULL WIDTH) */}
      <header className="menu-top-bar">
        <div className="top-bar-brand">
          <div className="brand-icon-emblem">
            <span className="x-slash red-slash" />
            <span className="x-slash blue-slash" />
            <span className="emblem-core" />
          </div>
          <div className="brand-titles">
            <span className="brand-main-title">ARENA X</span>
            <span className="brand-sub-title">2D MARTIAL ARTS • 16 FIGHTERS</span>
          </div>
        </div>

        {/* Live Netplay Server Status */}
        <div className="top-bar-server">
          <span className="server-dot-live" />
          <span className="server-text-live">60Hz NETPLAY READY</span>
        </div>

        {/* Player Profile & Currency */}
        <div className="top-bar-profile">
          <div 
            className="profile-pill-card"
            onClick={() => {
              soundManager.playMenuSelect();
              setIsProfileOpen(true);
            }}
          >
            <span className="profile-rank-badge">{profile.rankTier}</span>
            <div className="profile-info-compact">
              <span className="profile-name-text">{profile.username}</span>
              <span className="profile-level-text">LEVEL {profile.level} • {profile.currentXp}/{profile.nextLevelXp} XP</span>
            </div>
          </div>

          <div className="profile-coins-display">
            <Coins size={14} />
            <span>{profile.coins} AX</span>
          </div>

          <div className="top-bar-actions">
            <button 
              className="icon-action-btn"
              title="Toggle Audio"
              onClick={() => {
                const muted = soundManager.toggleMute();
                onUpdateSettings({ ...settings, isMuted: muted });
              }}
            >
              {settings.isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
            </button>

            <button 
              className="icon-action-btn"
              title="Settings"
              onClick={() => {
                soundManager.playMenuSelect();
                setActiveModal('SETTINGS');
              }}
            >
              <SettingsIcon size={16} />
            </button>
          </div>
        </div>
      </header>

      {/* 2. MAIN CONSOLE STAGE (TWO COLUMNS) */}
      <div className="menu-arena-stage-container">
        {/* LEFT COLUMN: NAVIGATION DECK */}
        <nav className="menu-nav-deck">
          {/* PLAY BUTTON (Primary) */}
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
                <span className="title">PLAY VERSUS BATTLE</span>
                <span className="sub">Local 2-Player 2D Combat • Responsive Martial Arts</span>
              </div>
            </div>
            <div className="btn-corner-cut" />
          </button>

          {/* ONLINE PLAY */}
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
                <span className="title" style={{ color: '#00e5ff', fontWeight: 900 }}>ONLINE 1v1 NETPLAY</span>
                <span className="sub">Ranked & Casual Matchmaking • Private Rooms</span>
              </div>
            </div>
            <span className="status-tag phase2 active-tag" style={{ background: '#00e5ff', color: '#000000', fontWeight: 900 }}>
              LIVE NETPLAY
            </span>
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

          {/* SELECT ARENA */}
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
                <span className="sub">Six Original 2D Arenas • Parallax & Weather FX</span>
              </div>
            </div>
            <span className="status-tag phase2 active-tag" style={{ background: '#ff00aa', color: '#ffffff', fontWeight: 900 }}>
              6 ARENAS
            </span>
          </button>

          {/* TRAINING DOJO */}
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
                <span className="sub">Practice combos & specials against training dummy</span>
              </div>
            </div>
          </button>

          {/* ARCADE MODE */}
          <button
            className="menu-btn standard-btn feature-badge-btn"
            onMouseEnter={() => soundManager.playMenuHover()}
            onClick={() => setActiveModal('ARCADE')}
          >
            <div className="btn-content">
              <Flame className="btn-icon" size={22} style={{ color: '#f59e0b' }} />
              <div className="btn-text">
                <span className="title">ARCADE MODE</span>
                <span className="sub">Classic 8-fighter ladder run & final boss showdown</span>
              </div>
            </div>
            <span className="status-tag phase2 active-tag" style={{ background: '#f59e0b', color: '#040714', fontWeight: 900 }}>
              SOLO RUN
            </span>
          </button>

          {/* TOURNAMENT (16-Player Bracket) */}
          <button
            className="menu-btn standard-btn feature-badge-btn"
            onMouseEnter={() => soundManager.playMenuHover()}
            onClick={() => { soundManager.playMenuSelect(); onOpenTournament?.(); }}
          >
            <div className="btn-content">
              <Trophy className="btn-icon" size={22} style={{ color: '#eab308' }} />
              <div className="btn-text">
                <span className="title">TOURNAMENT</span>
                <span className="sub">16-Player Championship single-elimination bracket</span>
              </div>
            </div>
            <span className="status-tag phase4" style={{ borderColor: '#eab308', color: '#eab308' }}>
              16 BRACKET
            </span>
          </button>

          {/* PROFILE */}
          <button
            className="menu-btn standard-btn feature-badge-btn"
            onMouseEnter={() => soundManager.playMenuHover()}
            onClick={() => {
              soundManager.playMenuSelect();
              setIsProfileOpen(true);
            }}
          >
            <div className="btn-content">
              <User className="btn-icon" size={22} />
              <div className="btn-text">
                <span className="title">PROFILE</span>
                <span className="sub">Player overview, XP rank, fighter unlocks & match history</span>
              </div>
            </div>
            <span className="status-tag active" style={{ color: '#00e5ff', borderColor: '#00e5ff' }}>
              ACTIVE
            </span>
          </button>

          {/* SETTINGS */}
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

        {/* RIGHT COLUMN: FEATURED FIGHTER STAGE */}
        <div className="menu-fighter-stage">
          {/* Elemental Aura */}
          <div 
            className="fighter-stage-aura" 
            style={{ 
              background: `radial-gradient(circle, ${currentHero.colors.aura}44 0%, ${currentHero.colors.projectile}22 45%, transparent 70%)` 
            }} 
          />

          {/* Pedestal Light Shadow */}
          <div 
            className="fighter-stage-pedestal" 
            style={{
              background: `radial-gradient(ellipse at center, ${currentHero.colors.aura}66 0%, ${currentHero.colors.projectile}33 50%, transparent 80%)`
            }}
          />

          {/* Character Cycle Controls */}
          <div className="stage-hero-cycle-controls">
            <button className="hero-cycle-btn" onClick={handlePrevHero} title="Previous Fighter">
              <ChevronLeft size={16} />
            </button>
            <button className="hero-cycle-btn" onClick={handleNextHero} title="Next Fighter">
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Full-Height Standee Character Artwork */}
          <img 
            src={`/assets/characters_full/${currentHero.id.toLowerCase()}.png`}
            alt={currentHero.name}
            className="fighter-stage-standee"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/assets/characters_full/01_kai.png';
            }}
          />

          {/* Fighter Info Card */}
          <div className="fighter-stage-info-card">
            <div className="stage-fighter-name-row">
              <span className="stage-fighter-name">{currentHero.name}</span>
              <span 
                className="status-tag"
                style={{ 
                  background: `${currentHero.colors.aura}33`,
                  borderColor: currentHero.colors.aura,
                  color: '#ffffff'
                }}
              >
                {currentHero.element}
              </span>
            </div>
            <div className="stage-fighter-title">{currentHero.title}</div>

            <div className="stage-fighter-specs">
              <div className="stage-fighter-spec-item">
                <span>Martial Art:</span>
                <strong>{currentHero.martialArt.split('&')[0]}</strong>
              </div>
              <div className="stage-fighter-spec-item">
                <span>Archetype:</span>
                <strong>{currentHero.archetype}</strong>
              </div>
              <div className="stage-fighter-spec-item">
                <span>Ultimate:</span>
                <strong style={{ color: '#00e5ff' }}>{currentHero.specials.ultimate.name}</strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. BOTTOM TICKER BAR (FULL WIDTH) */}
      <footer className="menu-ticker-bar">
        <div className="ticker-item-urgent">
          <Flame size={14} color="#f59e0b" />
          <span>TOURNAMENT SEASON 1 PRE-QUALIFIERS ACTIVE • COMPLETE MATCHES TO EARN +250 AX COINS</span>
        </div>

        <div className="ticker-controls-guide">
          <span>CONTROLS:</span>
          <span><strong className="ticker-key-badge">[A / D]</strong> MOVE</span>
          <span><strong className="ticker-key-badge">[W]</strong> JUMP</span>
          <span><strong className="ticker-key-badge">[F]</strong> PUNCH</span>
          <span><strong className="ticker-key-badge">[G]</strong> KICK</span>
          <span><strong className="ticker-key-badge">[H]</strong> BLOCK</span>
          <span><strong className="ticker-key-badge">[SPACE]</strong> SPECIAL</span>
        </div>
      </footer>

      {/* --- MODAL: 16-PLAYER TOURNAMENT BRACKET --- */}
      {activeModal === 'TOURNAMENT' && (
        <div className="modal-backdrop">
          <div className="tournament-modal-card">
            <button className="modal-close-btn" onClick={() => setActiveModal(null)}>
              <X size={20} />
            </button>
            <div className="preview-phase-pill" style={{ background: '#f59e0b', color: '#000000' }}>
              PHASE 10: 16-PLAYER SINGLE ELIMINATION
            </div>
            <h2 className="preview-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Trophy size={24} color="#f59e0b" />
              ARENA X CHAMPIONSHIP BRACKET
            </h2>
            <div className="preview-divider" />
            <p className="preview-description">
              Single-elimination championship featuring all 16 ARENA X warriors. Win 4 consecutive 1v1 matches to claim the Grand Champion title and 5,000 AX Coins!
            </p>

            <div className="tournament-bracket-tree">
              {/* ROUND 1 (8 MATCHES) */}
              <div className="bracket-round-col">
                <div className="bracket-round-header">ROUND OF 16</div>
                {[
                  ['KAI', 'SHADOW', '2 - 1', true],
                  ['BLAZE', 'FROST', '2 - 0', true],
                  ['VOLT', 'TERRA', '1 - 2', false],
                  ['PHANTOM', 'RONIN', '2 - 1', true],
                  ['VIPER', 'TITAN', '2 - 0', true],
                  ['NOVA', 'REAPER', '1 - 2', false],
                  ['AETHER', 'RYUZEN', '2 - 1', true],
                  ['ECLIPSE', 'ZENITH', '0 - 2', false],
                ].map(([f1, f2, score, f1Wins], idx) => (
                  <div key={idx} className="bracket-match-node">
                    <div className={`bracket-fighter-slot ${f1Wins ? 'winner' : ''}`}>
                      <span>{f1}</span>
                      <span className="bracket-score">{f1Wins ? '2' : '0/1'}</span>
                    </div>
                    <div className={`bracket-fighter-slot ${!f1Wins ? 'winner' : ''}`}>
                      <span>{f2}</span>
                      <span className="bracket-score">{!f1Wins ? '2' : '0/1'}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* QUARTERFINALS (4 MATCHES) */}
              <div className="bracket-round-col">
                <div className="bracket-round-header">QUARTERFINALS</div>
                {[
                  ['KAI', 'BLAZE', '2 - 1', true],
                  ['TERRA', 'PHANTOM', '1 - 2', false],
                  ['VIPER', 'REAPER', '2 - 1', true],
                  ['AETHER', 'ZENITH', '1 - 2', false],
                ].map(([f1, f2, score, f1Wins], idx) => (
                  <div key={idx} className="bracket-match-node">
                    <div className={`bracket-fighter-slot ${f1Wins ? 'winner' : ''}`}>
                      <span>{f1}</span>
                      <span className="bracket-score">{f1Wins ? '2' : '1'}</span>
                    </div>
                    <div className={`bracket-fighter-slot ${!f1Wins ? 'winner' : ''}`}>
                      <span>{f2}</span>
                      <span className="bracket-score">{!f1Wins ? '2' : '1'}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* SEMIFINALS (2 MATCHES) */}
              <div className="bracket-round-col">
                <div className="bracket-round-header">SEMIFINALS</div>
                {[
                  ['KAI', 'PHANTOM', '2 - 0', true],
                  ['VIPER', 'ZENITH', '1 - 2', false],
                ].map(([f1, f2, score, f1Wins], idx) => (
                  <div key={idx} className="bracket-match-node">
                    <div className={`bracket-fighter-slot ${f1Wins ? 'winner' : ''}`}>
                      <span>{f1}</span>
                      <span className="bracket-score">{f1Wins ? '2' : '0/1'}</span>
                    </div>
                    <div className={`bracket-fighter-slot ${!f1Wins ? 'winner' : ''}`}>
                      <span>{f2}</span>
                      <span className="bracket-score">{!f1Wins ? '2' : '0/1'}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* GRAND FINAL (1 MATCH) */}
              <div className="bracket-round-col">
                <div className="bracket-round-header" style={{ color: '#f59e0b' }}>
                  GRAND FINALS
                </div>
                <div className="bracket-match-node" style={{ borderColor: '#f59e0b', background: 'rgba(245, 158, 11, 0.08)' }}>
                  <div className="bracket-fighter-slot winner" style={{ fontSize: '13px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Crown size={14} color="#f59e0b" />
                      <span>KAI</span>
                    </div>
                    <span className="bracket-score">3</span>
                  </div>
                  <div className="bracket-fighter-slot" style={{ fontSize: '13px' }}>
                    <span>ZENITH</span>
                    <span className="bracket-score">1</span>
                  </div>
                </div>

                <div style={{ textAlign: 'center', marginTop: '16px' }}>
                  <button 
                    className="arena-btn primary-btn"
                    onClick={() => {
                      soundManager.playMenuSelect();
                      setActiveModal(null);
                      onStartGame('VERSUS');
                    }}
                  >
                    ENTER TOURNAMENT QUEUE
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL: ARCADE LADDER --- */}
      {activeModal === 'ARCADE' && (
        <div className="modal-backdrop">
          <div className="feature-preview-card" style={{ maxWidth: '640px' }}>
            <button className="modal-close-btn" onClick={() => setActiveModal(null)}>
              <X size={20} />
            </button>
            <div className="preview-phase-pill" style={{ background: '#f59e0b', color: '#000000' }}>
              SOLO RUN
            </div>
            <h2 className="preview-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Flame size={24} color="#f59e0b" />
              ARCADE LADDER CHALLENGE
            </h2>
            <div className="preview-divider" />
            <p className="preview-description">
              Battle through an 8-fighter gauntlet against increasing AI difficulties. Defeat the final master boss without continuing to earn the legendary Master Belt.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', margin: '20px 0' }}>
              {['STAGE 1: KAI vs SHADOW (Novice)', 'STAGE 2: BLAZE (Striker)', 'STAGE 3: FROST (Zoner)', 'STAGE 4: VOLT (Speedster)', 'STAGE 5: TERRA (Titan Armor)', 'STAGE 6: RONIN (Blade Master)', 'STAGE 7: REAPER (Shadow Phantom)', 'STAGE 8 (FINAL BOSS): ZENITH (Solar Emperor)'].map((stg, i) => (
                <div key={i} style={{ padding: '8px 14px', background: i === 7 ? 'rgba(245, 158, 11, 0.15)' : 'rgba(14, 20, 32, 0.75)', border: i === 7 ? '1px solid #f59e0b' : '1px solid rgba(255,255,255,0.08)', borderRadius: '4px', fontSize: '12px', fontWeight: i === 7 ? 900 : 600, color: i === 7 ? '#f59e0b' : '#e2e8f0', display: 'flex', justifyContent: 'space-between' }}>
                  <span>{stg}</span>
                  <span>{i === 7 ? '⭐ BOSS' : `+${(i+1)*50} XP`}</span>
                </div>
              ))}
            </div>

            <button 
              className="arena-btn primary-btn full-width"
              onClick={() => {
                soundManager.playMenuSelect();
                setActiveModal(null);
                onStartGame('VERSUS');
              }}
            >
              START ARCADE RUN
            </button>
          </div>
        </div>
      )}

      {/* --- MODAL: COMING SOON --- */}
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
            <button 
              className="arena-btn primary-btn full-width"
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

      {/* --- MODAL: SETTINGS --- */}
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

      {/* --- MODAL: PLAYER PROFILE --- */}
      <PlayerProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
      />
    </div>
  );
};
