// src/components/CharacterSelectModal.tsx
import React, { useState, useEffect } from 'react';
import { X, Swords, Shield, Zap, Target, Gauge, Lock, Coins } from 'lucide-react';
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
    onConfirm();
  };

  return (
    <>
      <div className="character-select-overlay" onClick={onClose}>
        <div className="character-select-container" onClick={(e) => e.stopPropagation()}>
          {/* Header */}
          <div className="char-select-header">
            <div>
              <div className="char-select-title">CHOOSE YOUR FIGHTER</div>
              <div className="char-select-subtitle">16 UNIQUE COMBATANTS // SELECT 1P & 2P</div>
            </div>
            <button className="stage-modal-close" onClick={onClose}>
              <X size={20} />
            </button>
          </div>

          {/* Content */}
          <div className="char-select-content">
            {/* Left: 4x4 Grid */}
            <div className="char-grid-wrapper">
              <div className="player-selector-tabs">
                <button
                  className={`tab-btn ${activeSlot === 'P1' ? 'active-p1' : ''}`}
                  onClick={() => setActiveSlot('P1')}
                >
                  PLAYER 1: {ROSTER_FIGHTERS[selectedP1]?.name}
                </button>
                <button
                  className={`tab-btn ${activeSlot === 'P2' ? 'active-p2' : ''}`}
                  onClick={() => setActiveSlot('P2')}
                >
                  PLAYER 2: {ROSTER_FIGHTERS[selectedP2]?.name}
                </button>
              </div>

              <div className="roster-grid">
                {fightersList.map((f) => {
                  const isSelectedP1 = selectedP1 === f.id;
                  const isSelectedP2 = selectedP2 === f.id;
                  const isUnlocked = unlockedFighters.includes(f.id);

                  return (
                    <div
                      key={f.id}
                      className={`roster-card ${isSelectedP1 ? 'selected-p1' : ''} ${
                        isSelectedP2 ? 'selected-p2' : ''
                      } ${!isUnlocked ? 'roster-card-locked' : ''}`}
                      onClick={() => handleCardClick(f.id)}
                      onMouseEnter={() => setHoveredFighter(f.id)}
                    >
                      <img
                        src={`/assets/sprites/portraits/portrait_${f.id.toLowerCase()}.png`}
                        alt={f.name}
                        className="roster-card-portrait"
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

            {/* Right: Detailed Inspection Card */}
            <div className="char-detail-card">
              <div className="detail-preview-header">
                <div className="detail-name detail-name-large" style={{ color: currentFighter.colors.accent }}>
                  {currentFighter.name}
                </div>
                <div className="detail-title-large">{currentFighter.title}</div>
              </div>

              <div className="detail-tags-row">
                <span className="detail-tag archetype">{currentFighter.archetype}</span>
                <span className="detail-tag">{currentFighter.martialArt}</span>
                <span className="detail-tag element" style={{ borderColor: currentFighter.colors.emissive }}>
                  {currentFighter.element}
                </span>
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

              {/* Special Moves */}
              <div>
                <div style={{ fontSize: '11px', color: '#00e5ff', marginBottom: '8px', fontWeight: 700 }}>
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
                  <div className="special-item" style={{ borderLeftColor: '#ffd700' }}>
                    <span className="special-name" style={{ color: '#ffd700' }}>
                      {currentFighter.specials.ultimate.name}
                    </span>
                    <span className="special-input">[{currentFighter.specials.ultimate.inputDescription}]</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
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
