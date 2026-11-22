// src/components/FighterUnlockModal.tsx
// ARENA X — PHASE 9: Fighter Unlock Celebration Modal
// Inspired by fighting game unlock splashes (My Hero One's Justice / Guilty Gear style)

import React, { useEffect } from 'react';
import { Sparkles, Swords, Check } from 'lucide-react';
import { FighterId, ROSTER_FIGHTERS } from '../game/characters/RosterConfig';
import { soundManager } from '../game/core/SoundManager';

interface FighterUnlockModalProps {
  isOpen: boolean;
  fighterId: FighterId | null;
  onClose: () => void;
}

export const FighterUnlockModal: React.FC<FighterUnlockModalProps> = ({
  isOpen,
  fighterId,
  onClose,
}) => {
  useEffect(() => {
    if (isOpen && fighterId) {
      soundManager.playSurgeActivate();
      soundManager.playVoiceLine(fighterId, 'VICTORY');
    }
  }, [isOpen, fighterId]);

  if (!isOpen || !fighterId) return null;

  const profile = ROSTER_FIGHTERS[fighterId];
  if (!profile) return null;

  return (
    <div className="unlock-splash-overlay" onClick={onClose}>
      <div className="unlock-splash-container" onClick={(e) => e.stopPropagation()}>
        {/* Slanted Anime Backdrop Banner */}
        <div className="unlock-diagonal-stripes" />

        <div className="unlock-badge">
          <Sparkles size={16} /> NEW FIGHTER UNLOCKED
        </div>

        {/* Character Illustration / Portrait */}
        <div className="unlock-character-showcase">
          <img
            src={`/assets/sprites/portraits/portrait_${fighterId.toLowerCase()}.png`}
            alt={profile.name}
            className="unlock-portrait-img"
          />
          <div
            className="unlock-glow-ring"
            style={{
              borderColor: profile.colors.accent,
              boxShadow: `0 0 60px ${profile.colors.aura}`,
            }}
          />
        </div>

        {/* Big stylized Banner */}
        <div className="unlock-banner-ribbon">
          <span className="unlocked-label">UNLOCKED</span>
          <span className="unlocked-sub">AVAILABLE FOR BATTLE</span>
        </div>

        {/* Character Identity */}
        <div className="unlock-info-block">
          <h1 className="unlock-fighter-name" style={{ color: profile.colors.accent }}>
            {profile.name}
          </h1>
          <div className="unlock-fighter-meta">
            <span className="meta-badge" style={{ borderColor: profile.colors.primary }}>
              {profile.title}
            </span>
            <span className="meta-badge">{profile.martialArt}</span>
            <span className="meta-badge" style={{ color: profile.colors.emissive }}>
              {profile.element}
            </span>
          </div>
          <p className="unlock-lore">{profile.lore}</p>
        </div>

        {/* Action Button */}
        <button
          className="arena-btn primary-btn unlock-confirm-btn"
          onClick={() => {
            soundManager.playMenuSelect();
            onClose();
          }}
        >
          <Check size={18} /> READY FOR COMBAT
        </button>
      </div>
    </div>
  );
};
