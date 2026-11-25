// src/game/ui/ShadowFightTouchControls.tsx
// Ergonomic Circular Action Cluster Inspired by Shadow Fight 2 / 3 / 4 Arena

import React from 'react';
import { Swords, Shield, Zap, Flame, Sparkles } from 'lucide-react';
import { FighterInputs, PlayerId } from '../../types';

interface ShadowFightTouchControlsProps {
  player: PlayerId;
  superMeter: number;
  onTouchInput: (player: PlayerId, action: keyof FighterInputs, active: boolean) => void;
}

export const ShadowFightTouchControls: React.FC<ShadowFightTouchControlsProps> = ({
  player,
  superMeter,
  onTouchInput,
}) => {
  const isSuperReady = superMeter >= 100;

  return (
    <div className="shadow-fight-cluster" aria-label="Combat Actions">
      {/* 1. PRIMARY STRIKE / WEAPON BUTTON (Center-Right, Largest) */}
      <button
        className="sf-btn sf-btn-strike"
        onTouchStart={() => onTouchInput(player, 'punch', true)}
        onTouchEnd={() => onTouchInput(player, 'punch', false)}
        onMouseDown={() => onTouchInput(player, 'punch', true)}
        onMouseUp={() => onTouchInput(player, 'punch', false)}
        aria-label="Strike [F]"
      >
        <Swords size={28} className="sf-icon" />
        <span className="sf-btn-label">STRIKE</span>
      </button>

      {/* 2. KICK BUTTON (Lower-Left Arc, Large) */}
      <button
        className="sf-btn sf-btn-kick"
        onTouchStart={() => onTouchInput(player, 'kick', true)}
        onTouchEnd={() => onTouchInput(player, 'kick', false)}
        onMouseDown={() => onTouchInput(player, 'kick', true)}
        onMouseUp={() => onTouchInput(player, 'kick', false)}
        aria-label="Kick [G]"
      >
        <span className="sf-kick-glyph">🥋</span>
        <span className="sf-btn-label">KICK</span>
      </button>

      {/* 3. SHADOW / BURST ULTIMATE (Top-Center, Glowing Orb when 100%) */}
      <button
        className={`sf-btn sf-btn-burst ${isSuperReady ? 'sf-burst-ready' : ''}`}
        onTouchStart={() => onTouchInput(player, 'ultimate', true)}
        onTouchEnd={() => onTouchInput(player, 'ultimate', false)}
        onMouseDown={() => onTouchInput(player, 'ultimate', true)}
        onMouseUp={() => onTouchInput(player, 'ultimate', false)}
        aria-label="Burst Overdrive [V]"
      >
        <Flame size={22} className="sf-icon" />
        <span className="sf-btn-label">BURST</span>
        {isSuperReady && <span className="sf-burst-ring" />}
      </button>

      {/* 4. SPECIAL / RANGED TECHNIQUE (Top-Left Arc) */}
      <button
        className="sf-btn sf-btn-special"
        onTouchStart={() => onTouchInput(player, 'special', true)}
        onTouchEnd={() => onTouchInput(player, 'special', false)}
        onMouseDown={() => onTouchInput(player, 'special', true)}
        onMouseUp={() => onTouchInput(player, 'special', false)}
        aria-label="Special Attack [SPACE]"
      >
        <Sparkles size={20} className="sf-icon" />
        <span className="sf-btn-label">SPECIAL</span>
      </button>

      {/* 5. GUARD / BLOCK (Lower-Center, Easy Thumb Rest) */}
      <button
        className="sf-btn sf-btn-guard"
        onTouchStart={() => onTouchInput(player, 'block', true)}
        onTouchEnd={() => onTouchInput(player, 'block', false)}
        onMouseDown={() => onTouchInput(player, 'block', true)}
        onMouseUp={() => onTouchInput(player, 'block', false)}
        aria-label="Guard [H]"
      >
        <Shield size={20} className="sf-icon" />
        <span className="sf-btn-label">GUARD</span>
      </button>

      {/* 6. CHARGE METER (Inner Flank, Utility) */}
      <button
        className="sf-btn sf-btn-charge"
        onTouchStart={() => onTouchInput(player, 'charge', true)}
        onTouchEnd={() => onTouchInput(player, 'charge', false)}
        onMouseDown={() => onTouchInput(player, 'charge', true)}
        onMouseUp={() => onTouchInput(player, 'charge', false)}
        aria-label="Charge Meter [C]"
      >
        <Zap size={18} className="sf-icon" />
        <span className="sf-btn-label">CHARGE</span>
      </button>
    </div>
  );
};
