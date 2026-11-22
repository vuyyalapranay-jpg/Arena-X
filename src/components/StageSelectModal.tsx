// src/components/StageSelectModal.tsx
// PREMIUM 2.5D FIGHTING GAME STAGE SELECTION MODAL (2XKO & UNDER NIGHT AESTHETICS)

import React, { useState, useEffect, useCallback } from 'react';
import { STAGE_LIST, StageDefinition, StageId } from '../game/stages/StageConfig';
import { soundManager } from '../game/core/SoundManager';
import { 
  Check, 
  ChevronLeft, 
  ChevronRight, 
  Sparkles, 
  ShieldAlert, 
  Flame, 
  Snowflake, 
  Building2, 
  TreePine, 
  X,
  Play
} from 'lucide-react';

interface StageSelectModalProps {
  currentStageId?: StageId;
  isOpen: boolean;
  onSelectStage: (stageId: StageId) => void;
  onClose?: () => void;
  isHost?: boolean;
}

export const StageSelectModal: React.FC<StageSelectModalProps> = ({
  currentStageId = 'ANCIENT_TEMPLE',
  isOpen,
  onSelectStage,
  onClose,
  isHost = true,
}) => {
  const [selectedId, setSelectedId] = useState<StageId>(currentStageId);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);

  useEffect(() => {
    const idx = STAGE_LIST.findIndex((s) => s.id === currentStageId);
    if (idx !== -1) {
      setSelectedIndex(idx);
      setSelectedId(currentStageId);
    }
  }, [currentStageId]);

  const activeStage = STAGE_LIST[selectedIndex] || STAGE_LIST[0];

  const handleSelectIndex = useCallback((idx: number) => {
    soundManager.playMenuSelect();
    setSelectedIndex(idx);
    setSelectedId(STAGE_LIST[idx].id);
  }, []);

  const handleNext = useCallback(() => {
    const nextIdx = (selectedIndex + 1) % STAGE_LIST.length;
    handleSelectIndex(nextIdx);
  }, [selectedIndex, handleSelectIndex]);

  const handlePrev = useCallback(() => {
    const prevIdx = (selectedIndex - 1 + STAGE_LIST.length) % STAGE_LIST.length;
    handleSelectIndex(prevIdx);
  }, [selectedIndex, handleSelectIndex]);

  const handleConfirm = useCallback(() => {
    soundManager.playMenuSelect();
    onSelectStage(selectedId);
  }, [selectedId, onSelectStage]);

  // Keyboard navigation: Left/Right arrows, A/D, Enter to confirm, Esc to close
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'KeyD') {
        handleNext();
      } else if (e.key === 'ArrowLeft' || e.key === 'KeyA') {
        handlePrev();
      } else if (e.key === 'Enter') {
        handleConfirm();
      } else if (e.key === 'Escape' && onClose) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleNext, handlePrev, handleConfirm, onClose]);

  if (!isOpen) return null;

  const getStageIcon = (id: StageId) => {
    switch (id) {
      case 'NEON_CITY': return <Building2 size={18} className="stage-icon-neon" />;
      case 'ANCIENT_TEMPLE': return <Sparkles size={18} className="stage-icon-temple" />;
      case 'VOLCANIC_BATTLEFIELD': return <Flame size={18} className="stage-icon-lava" />;
      case 'FROZEN_WASTELAND': return <Snowflake size={18} className="stage-icon-ice" />;
      case 'CYBERPUNK_ROOFTOP': return <Building2 size={18} className="stage-icon-rooftop" />;
      case 'MYSTIC_FOREST': return <TreePine size={18} className="stage-icon-forest" />;
    }
  };

  return (
    <div className="stage-select-overlay" onClick={onClose}>
      <div 
        className="stage-select-modal"
        onClick={(e) => e.stopPropagation()}
        style={{
          boxShadow: `0 0 50px ${activeStage.ambientOverlay}`,
        }}
      >
        {/* Top Header */}
        <header className="stage-select-header">
          <div className="header-titles">
            <span className="stage-select-badge">PHASE 7 • 2.5D ENVIRONMENT SUITE</span>
            <h2 className="stage-select-title">SELECT BATTLE ARENA</h2>
          </div>
          {onClose && (
            <button className="stage-select-close-btn" onClick={onClose}>
              <X size={20} />
            </button>
          )}
        </header>

        {/* Hero Stage Showcase Preview */}
        <div className="stage-hero-showcase">
          <div className="stage-hero-img-wrap">
            <img 
              src={activeStage.bgImage} 
              alt={activeStage.name} 
              className="stage-hero-img"
            />
            <div className="stage-hero-vignette" />
            <div className="stage-hero-scanlines" />

            {/* Stage Kanji Watermark */}
            <div className="stage-hero-kanji">{activeStage.kanji}</div>

            {/* Arrow Nav Buttons (Desktop & Touch) */}
            <button 
              className="stage-nav-arrow arrow-left" 
              onClick={(e) => { e.stopPropagation(); handlePrev(); }}
              aria-label="Previous Stage"
            >
              <ChevronLeft size={36} />
            </button>
            <button 
              className="stage-nav-arrow arrow-right" 
              onClick={(e) => { e.stopPropagation(); handleNext(); }}
              aria-label="Next Stage"
            >
              <ChevronRight size={36} />
            </button>
          </div>

          {/* Stage Info Meta Overlay */}
          <div className="stage-hero-info">
            <div className="stage-hero-header-row">
              <div>
                <span className="stage-hero-subtitle">{activeStage.subtitle}</span>
                <h3 className="stage-hero-name">{activeStage.name}</h3>
              </div>
              <div className="stage-hero-index-pill">
                {selectedIndex + 1} / {STAGE_LIST.length}
              </div>
            </div>

            <p className="stage-hero-desc">{activeStage.description}</p>

            <div className="stage-hero-tags">
              <span className="hero-tag">
                {getStageIcon(activeStage.id)}
                <span>GROUND: {activeStage.groundType.replace(/_/g, ' ')}</span>
              </span>
              <span className="hero-tag">
                <span>ATMOSPHERE: {activeStage.particleRules.map((p) => p.type).join(' + ')}</span>
              </span>
              {activeStage.groundReflection && (
                <span className="hero-tag reflection-tag">
                  <span>2D WET REFLECTIONS ACTIVE</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Horizontal Thumbnails Strip (All 6 Arenas) */}
        <div className="stage-cards-carousel">
          {STAGE_LIST.map((stage, idx) => {
            const isSelected = stage.id === selectedId;
            return (
              <button
                key={stage.id}
                className={`stage-thumb-card ${isSelected ? 'active-thumb' : ''}`}
                onClick={() => handleSelectIndex(idx)}
                onMouseEnter={() => soundManager.playMenuHover()}
              >
                <div className="thumb-img-wrapper">
                  <img src={stage.thumbnail} alt={stage.name} className="thumb-img" />
                  <div className="thumb-overlay" />
                  {isSelected && (
                    <div className="thumb-check-badge">
                      <Check size={14} />
                    </div>
                  )}
                </div>
                <div className="thumb-meta">
                  <span className="thumb-kanji">{stage.kanji}</span>
                  <span className="thumb-name">{stage.name}</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Action Confirmation Footer */}
        <footer className="stage-select-footer">
          <div className="footer-keys-tip">
            <span className="key-badge">A</span>
            <span className="key-badge">D</span>
            <span>NAVIGATE</span>
            <span className="key-badge">ENTER</span>
            <span>CONFIRM STAGE</span>
          </div>

          <div className="footer-actions">
            {onClose && (
              <button className="stage-cancel-btn" onClick={onClose}>
                CANCEL
              </button>
            )}
            <button 
              className="stage-confirm-btn"
              onClick={handleConfirm}
              disabled={!isHost}
            >
              <Play size={18} />
              <span>{isHost ? 'ENGAGE ARENA' : 'WAITING FOR HOST'}</span>
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
};
