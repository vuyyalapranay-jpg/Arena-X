// src/components/CharacterSelectModal.tsx
import React, { useState } from 'react';
import { X, Swords, Shield, Zap, Target, Gauge } from 'lucide-react';
import { FighterId, ROSTER_FIGHTERS, FighterProfile } from '../game/characters/RosterConfig';
import { soundManager } from '../game/core/SoundManager';

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

  if (!isOpen) return null;

  const currentFighter = ROSTER_FIGHTERS[hoveredFighter] || ROSTER_FIGHTERS[selectedP1];
  const fightersList = Object.values(ROSTER_FIGHTERS);

  const handleCardClick = (id: FighterId) => {
    soundManager.playMenuSelect();
    setHoveredFighter(id);
    if (activeSlot === 'P1') {
      onSelectP1(id);
      setActiveSlot('P2'); // Auto advance to P2
    } else {
      onSelectP2(id);
    }
  };

  const handleConfirm = () => {
    soundManager.playMenuSelect();
    onConfirm();
  };

  return (
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
                return (
                  <div
                    key={f.id}
                    className={`roster-card ${isSelectedP1 ? 'selected-p1' : ''} ${isSelectedP2 ? 'selected-p2' : ''}`}
                    onClick={() => handleCardClick(f.id)}
                    onMouseEnter={() => setHoveredFighter(f.id)}
                  >
                    <img
                      src={`/assets/sprites/portraits/portrait_${f.id.toLowerCase()}.png`}
                      alt={f.name}
                      className="roster-card-portrait"
                    />
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

          {/* Right: Detail Panel */}
          <div className="char-detail-panel">
            <div className="detail-portrait-header">
              <img
                src={`/assets/sprites/portraits/portrait_${currentFighter.id.toLowerCase()}.png`}
                alt={currentFighter.name}
                className="detail-portrait"
              />
              <div>
                <div className="detail-name">{currentFighter.name}</div>
                <div className="detail-title">{currentFighter.title}</div>
                <div className="detail-style">{currentFighter.martialArt}</div>
              </div>
            </div>

            {/* Stats */}
            <div>
              <div style={{ fontSize: '11px', color: '#00e5ff', marginBottom: '8px', fontWeight: 700 }}>
                COMBAT ATTRIBUTES
              </div>
              <div className="stat-row">
                <span style={{ color: '#a0aec0' }}>POWER</span>
                <div className="stat-bar-container">
                  <div
                    className="stat-bar-fill"
                    style={{ width: `${(currentFighter.stats.power / 5) * 100}%`, background: '#ff1a4b' }}
                  />
                </div>
              </div>
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
  );
};
