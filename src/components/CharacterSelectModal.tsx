// src/components/CharacterSelectModal.tsx
// ARENA X — CONSOLE-GRADE 16-FIGHTER CHARACTER SELECTION SUITE (PHASE 3)

import React, { useState, useEffect } from 'react';
import { 
  X, 
  Swords, 
  Shield, 
  Zap, 
  Target, 
  Lock, 
  Coins, 
  Flame, 
  Sparkles, 
  Star,
  Crosshair,
  Award
} from 'lucide-react';
import { FighterId, ROSTER_FIGHTERS, FighterProfile } from '../game/characters/RosterConfig';
import { soundManager } from '../game/core/SoundManager';
import { progressionManager } from '../game/progression/ProgressionManager';
import { FIGHTER_UNLOCK_CONFIG } from '../game/progression/ProgressionConfig';
import { FighterUnlockModal } from './FighterUnlockModal';

interface CharacterSelectModalProps {
  isOpen: boolean;
  selectedP1: FighterId;
  selectedP2: FighterId;
  onSelectP1: (id: FighterId) => void;
  onSelectP2: (id: FighterId) => void;
  onConfirm: () => void;
  onClose: () => void;
}

export const FIGHTER_CANONICAL_WEAPONS: Record<FighterId, string> = {
  KAI: 'Dragon Flame Hand-Wraps & Cestus',
  SHADOW: 'Dual Kusarigama & Shadow Kunai',
  BLAZE: 'Twin Crimson Tonfas',
  FROST: 'Glacial Ice Daggers',
  VOLT: 'Plasma Arc Chakrams',
  TERRA: 'Heavy Granite Knuckles',
  PHANTOM: 'Ethereal Spectral Sickle',
  RONIN: 'Nodachi Katana & Wakizashi',
  VIPER: 'Twin Poisoned Stiletto Sai',
  TITAN: 'Meteorite Battle-Hammer',
  NOVA: 'Superheated Radiant Gauntlets',
  REAPER: 'Obsidian Soul War-Scythe',
  AETHER: 'Dragon Pearl Celestial Staff',
  RYUZEN: 'Imperial Dual Katana Blades',
  ECLIPSE: 'Void Umbral Claws',
  ZENITH: 'Solar Corona Ring & Scepter',
};

export const FIGHTER_DIFFICULTY: Record<FighterId, { stars: number; label: string }> = {
  KAI: { stars: 1, label: 'EASY (Beginner Friendly)' },
  SHADOW: { stars: 2, label: 'MODERATE (Agile Evasion)' },
  BLAZE: { stars: 2, label: 'MODERATE (Fast Rushdown)' },
  FROST: { stars: 3, label: 'INTERMEDIATE (Zoning & Freeze)' },
  VOLT: { stars: 3, label: 'INTERMEDIATE (High-Speed Mixups)' },
  TERRA: { stars: 2, label: 'MODERATE (Super Armor Tank)' },
  PHANTOM: { stars: 4, label: 'ADVANCED (Teleport Tricks)' },
  RONIN: { stars: 3, label: 'INTERMEDIATE (Spaced Sword Normals)' },
  VIPER: { stars: 4, label: 'ADVANCED (Poison DOT & Quick Stabs)' },
  TITAN: { stars: 2, label: 'MODERATE (Heavy Grappler)' },
  NOVA: { stars: 3, label: 'INTERMEDIATE (Solar Blast Pressure)' },
  REAPER: { stars: 4, label: 'ADVANCED (Long-Range Scythe Space)' },
  AETHER: { stars: 5, label: 'EXPERT (Complex Air Combos)' },
  RYUZEN: { stars: 3, label: 'INTERMEDIATE (Counter-Strikes)' },
  ECLIPSE: { stars: 5, label: 'EXPERT (Phase Cancels & Tricky Setup)' },
  ZENITH: { stars: 5, label: 'EXPERT (Boss Tier High Execution)' },
};

export const CharacterSelectModal: React.FC<CharacterSelectModalProps> = ({
  isOpen,
  selectedP1,
  selectedP2,
  onSelectP1,
  onSelectP2,
  onConfirm,
  onClose,
}) => {
  const [activeSlot, setActiveSlot] = useState<'P1' | 'P2'>('P1');
  const [hoveredFighter, setHoveredFighter] = useState<FighterId>(selectedP1);
  const [unlockedFighters, setUnlockedFighters] = useState<FighterId[]>(
    progressionManager.getProfile().unlockedFighters
  );
  const [unlockedModalFighter, setUnlockedModalFighter] = useState<FighterId | null>(null);

  useEffect(() => {
    const unsub = progressionManager.subscribe((profile) => {
      setUnlockedFighters(profile.unlockedFighters);
    });
    return unsub;
  }, []);

  if (!isOpen) return null;

  const currentFighter = ROSTER_FIGHTERS[hoveredFighter] || ROSTER_FIGHTERS[selectedP1];
  const fightersList = Object.values(ROSTER_FIGHTERS);
  const isHoveredUnlocked = unlockedFighters.includes(hoveredFighter);
  const unlockCfg = FIGHTER_UNLOCK_CONFIG[hoveredFighter];
  const canonicalWeapon = FIGHTER_CANONICAL_WEAPONS[hoveredFighter] || 'Unarmed Martial Arts';
  const difficultyData = FIGHTER_DIFFICULTY[hoveredFighter] || { stars: 2, label: 'MODERATE' };

  const handleCardClick = (id: FighterId) => {
    soundManager.playMenuSelect();
    setHoveredFighter(id);

    const isUnlocked = unlockedFighters.includes(id);
    if (!isUnlocked) {
      // Preview only, do not select for battle until unlocked
      return;
    }

    soundManager.playVoiceLine(id, 'SELECT');
    if (activeSlot === 'P1') {
      onSelectP1(id);
      setActiveSlot('P2'); // Auto advance to P2
    } else {
      onSelectP2(id);
    }
  };

  const handleCardHover = (id: FighterId) => {
    if (hoveredFighter !== id) {
      soundManager.playMenuHover();
      setHoveredFighter(id);
    }
  };

  const handleUnlockCurrent = () => {
    soundManager.playMenuSelect();
    const res = progressionManager.unlockFighterWithCoins(hoveredFighter);
    if (res.success) {
      setUnlockedModalFighter(hoveredFighter);
      // Auto pick for active slot
      if (activeSlot === 'P1') {
        onSelectP1(hoveredFighter);
      } else {
        onSelectP2(hoveredFighter);
      }
    } else {
      alert(res.message);
    }
  };

  const handleConfirm = () => {
    soundManager.playMenuSelect();
    soundManager.playHeavyHit();
    onConfirm();
  };

  return (
    <>
      <div className="character-select-overlay" onClick={onClose}>
        <div className="character-select-container" onClick={(e) => e.stopPropagation()}>
          {/* Header & Head-to-Head Versus Bar */}
          <div className="char-select-header">
            <div>
              <div className="char-select-title">CHOOSE YOUR FIGHTER</div>
              <div className="char-select-subtitle">16 MARTIAL ARTISTS • SELECT 1P & 2P ROSTER MATCHUP</div>
            </div>

            {/* Live Dual Versus Badge */}
            <div className="char-select-vs-badge">
              <span className="vs-fighter-p1">1P: {ROSTER_FIGHTERS[selectedP1]?.name}</span>
              <span className="vs-divider-icon">VS</span>
              <span className="vs-fighter-p2">2P: {ROSTER_FIGHTERS[selectedP2]?.name}</span>
            </div>

            <button className="stage-modal-close" onClick={onClose} title="Close Selection">
              <X size={20} />
            </button>
          </div>

          {/* Main Select Content */}
          <div className="char-select-content">
            {/* Left: 4x4 Grid of 16 Fighters */}
            <div className="char-grid-wrapper">
              <div className="player-selector-tabs">
                <button
                  className={`tab-btn ${activeSlot === 'P1' ? 'active-p1' : ''}`}
                  onClick={() => setActiveSlot('P1')}
                >
                  PLAYER 1 (WASD): {ROSTER_FIGHTERS[selectedP1]?.name}
                </button>
                <button
                  className={`tab-btn ${activeSlot === 'P2' ? 'active-p2' : ''}`}
                  onClick={() => setActiveSlot('P2')}
                >
                  PLAYER 2 (ARROWS): {ROSTER_FIGHTERS[selectedP2]?.name}
                </button>
              </div>

              <div className="roster-grid">
                {fightersList.map((f) => {
                  const isSelectedP1 = selectedP1 === f.id;
                  const isSelectedP2 = selectedP2 === f.id;
                  const isUnlocked = unlockedFighters.includes(f.id);
                  const isHovered = hoveredFighter === f.id;

                  return (
                    <div
                      key={f.id}
                      className={`roster-card ${isSelectedP1 ? 'selected-p1' : ''} ${
                        isSelectedP2 ? 'selected-p2' : ''
                      } ${!isUnlocked ? 'roster-card-locked' : ''} ${isHovered ? 'hovered-card' : ''}`}
                      onClick={() => handleCardClick(f.id)}
                      onMouseEnter={() => handleCardHover(f.id)}
                    >
                      <img
                        src={`/assets/sprites/portraits/portrait_${f.id.toLowerCase()}.png`}
                        alt={f.name}
                        className="roster-card-portrait"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = `/assets/characters_full/${f.id.toLowerCase()}.png`;
                        }}
                      />
                      {!isUnlocked && (
                        <div className="roster-lock-overlay">
                          <Lock size={16} color="#ffd700" />
                        </div>
                      )}
                      <div className="roster-card-info">
                        <span className="roster-card-name">{f.name}</span>
                        <span className="roster-card-title">{f.title}</span>
                      </div>

                      {isSelectedP1 && <span className="roster-badge badge-p1">1P</span>}
                      {isSelectedP2 && <span className="roster-badge badge-p2">2P</span>}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right: Detailed Inspection Card with Standee Artwork */}
            <div className="char-detail-card char-detail-panel">
              {/* Standee Artwork Showcase Stage */}
              <div className="detail-standee-container">
                <div 
                  className="detail-standee-aura"
                  style={{
                    background: `radial-gradient(circle, ${currentFighter.colors.aura}55 0%, ${currentFighter.colors.projectile}22 55%, transparent 75%)`
                  }}
                />
                <img 
                  src={`/assets/characters_full/${currentFighter.id.toLowerCase()}.png`}
                  alt={currentFighter.name}
                  className="detail-standee-image"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/assets/characters_full/kai.png';
                  }}
                />
              </div>

              {/* Header Titles */}
              <div className="detail-preview-header">
                <div className="detail-name detail-name-large" style={{ color: currentFighter.colors.accent }}>
                  {currentFighter.name}
                </div>
                <div className="detail-title-large">{currentFighter.title}</div>
              </div>

              {/* Tags: Archetype, Martial Art, Element */}
              <div className="detail-tags-row">
                <span className="detail-tag archetype">{currentFighter.archetype}</span>
                <span className="detail-tag element" style={{ borderColor: currentFighter.colors.emissive }}>
                  {currentFighter.element}
                </span>
                <span className="detail-tag">{currentFighter.martialArt.split('&')[0]}</span>
              </div>

              {/* Weapon & Difficulty Readout */}
              <div className="detail-weapon-difficulty-row">
                <div className="spec-meta-item">
                  <span className="meta-label">WEAPON:</span>
                  <span className="meta-value">{canonicalWeapon}</span>
                </div>
                <div className="spec-meta-item">
                  <span className="meta-label">DIFFICULTY:</span>
                  <span className="meta-value difficulty-stars">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star 
                        key={i} 
                        size={12} 
                        color={i < difficultyData.stars ? '#f59e0b' : '#4b5563'} 
                        fill={i < difficultyData.stars ? '#f59e0b' : 'transparent'} 
                      />
                    ))}
                    <span className="difficulty-text">({difficultyData.stars}/5)</span>
                  </span>
                </div>
              </div>

              <p className="detail-bio">{currentFighter.lore}</p>

              {/* Locked / Unlocked Banner */}
              {!isHoveredUnlocked && (
                <div className="char-select-lock-banner">
                  <div className="lock-banner-title">
                    <Lock size={16} /> LOCKED COMBATANT
                  </div>
                  <p className="lock-banner-req">{unlockCfg?.description}</p>
                  <button className="arena-btn primary-btn quick-unlock-btn" onClick={handleUnlockCurrent}>
                    <Coins size={16} /> UNLOCK FOR {unlockCfg?.coinCost.toLocaleString()} COINS
                  </button>
                </div>
              )}

              {/* Stats Visualizer */}
              <div className="stats-breakdown">
                <div className="stat-row">
                  <span style={{ color: '#a0aec0' }}>SPEED</span>
                  <div className="stat-bar-container">
                    <div
                      className="stat-bar-fill"
                      style={{ width: `${(currentFighter.stats.speed / 5) * 100}%`, background: '#00e5ff' }}
                    />
                  </div>
                </div>
                <div className="stat-row">
                  <span style={{ color: '#a0aec0' }}>POWER</span>
                  <div className="stat-bar-container">
                    <div
                      className="stat-bar-fill"
                      style={{ width: `${(currentFighter.stats.power / 5) * 100}%`, background: '#ff1744' }}
                    />
                  </div>
                </div>
                <div className="stat-row">
                  <span style={{ color: '#a0aec0' }}>DEFENSE</span>
                  <div className="stat-bar-container">
                    <div
                      className="stat-bar-fill"
                      style={{ width: `${(currentFighter.stats.defense / 5) * 100}%`, background: '#ffea00' }}
                    />
                  </div>
                </div>
                <div className="stat-row">
                  <span style={{ color: '#a0aec0' }}>REACH</span>
                  <div className="stat-bar-container">
                    <div
                      className="stat-bar-fill"
                      style={{ width: `${(currentFighter.stats.reach / 5) * 100}%`, background: '#69f0ae' }}
                    />
                  </div>
                </div>
              </div>

              {/* Special Moves & Ultimate Attack */}
              <div>
                <div style={{ fontSize: '11px', color: '#00e5ff', marginBottom: '8px', fontWeight: 700, letterSpacing: '1px' }}>
                  SPECIAL ABILITIES & ULTIMATE
                </div>
                <div className="specials-list">
                  <div className="special-item">
                    <span className="special-name">{currentFighter.specials.special1.name}</span>
                    <span className="special-input">[{currentFighter.specials.special1.inputDescription}]</span>
                  </div>
                  <div className="special-item">
                    <span className="special-name">{currentFighter.specials.special2.name}</span>
                    <span className="special-input">[{currentFighter.specials.special2.inputDescription}]</span>
                  </div>
                  <div className="special-item">
                    <span className="special-name">{currentFighter.specials.special3.name}</span>
                    <span className="special-input">[{currentFighter.specials.special3.inputDescription}]</span>
                  </div>
                  <div className="special-item ultimate-item" style={{ borderLeftColor: '#ffd700' }}>
                    <span className="special-name" style={{ color: '#ffd700' }}>
                      ⚡ {currentFighter.specials.ultimate.name}
                    </span>
                    <span className="special-input">[{currentFighter.specials.ultimate.inputDescription}]</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Action Bar */}
          <div className="char-select-footer">
            <button className="stage-modal-btn stage-modal-btn-cancel" onClick={onClose}>
              CANCEL
            </button>
            <button className="btn-confirm-selection" onClick={handleConfirm}>
              LOCK IN FIGHTERS
            </button>
          </div>
        </div>
      </div>

      <FighterUnlockModal
        isOpen={unlockedModalFighter !== null}
        fighterId={unlockedModalFighter}
        onClose={() => setUnlockedModalFighter(null)}
      />
    </>
  );
};
