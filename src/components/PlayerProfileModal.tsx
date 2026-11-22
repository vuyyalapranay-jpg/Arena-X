// src/components/PlayerProfileModal.tsx
// ARENA X — PHASE 9: Full Player Profile & Progression Interface
// Inspired by Street Fighter 6 Buckler's Boot Camp / Tekken 8 Profile architecture

import React, { useState, useEffect } from 'react';
import {
  X,
  User,
  Trophy,
  Swords,
  Shield,
  Zap,
  Coins,
  Lock,
  Unlock,
  Check,
  Edit2,
  Flame,
  Award,
  History,
  Sparkles,
  Calendar,
  Clock,
  Palette,
} from 'lucide-react';
import { FighterId, ROSTER_FIGHTERS } from '../game/characters/RosterConfig';
import {
  calculateNextLevelXp,
  FIGHTER_UNLOCK_CONFIG,
  getRankInfo,
} from '../game/progression/ProgressionConfig';
import {
  progressionManager,
} from '../game/progression/ProgressionManager';
import {
  Achievement,
  MatchRecord,
  PlayerProfile,
} from '../game/progression/ProgressionTypes';
import { soundManager } from '../game/core/SoundManager';
import { FighterUnlockModal } from './FighterUnlockModal';

interface PlayerProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type TabType = 'OVERVIEW' | 'FIGHTERS' | 'ACHIEVEMENTS' | 'HISTORY' | 'COSMETICS';

export const PlayerProfileModal: React.FC<PlayerProfileModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [profile, setProfile] = useState<PlayerProfile>(progressionManager.getProfile());
  const [activeTab, setActiveTab] = useState<TabType>('OVERVIEW');
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(profile.username);
  const [selectedFighterDetail, setSelectedFighterDetail] = useState<FighterId>('KAI');
  const [historyFilter, setHistoryFilter] = useState<'ALL' | 'VERSUS' | 'ONLINE'>('ALL');
  const [unlockedModalFighter, setUnlockedModalFighter] = useState<FighterId | null>(null);

  useEffect(() => {
    const unsub = progressionManager.subscribe((newProfile) => {
      setProfile(newProfile);
      setTempName(newProfile.username);
    });
    return unsub;
  }, []);

  if (!isOpen) return null;

  const rankInfo = getRankInfo(profile.rankPoints);
  const favoriteFighter = ROSTER_FIGHTERS[profile.favoriteFighter] || ROSTER_FIGHTERS.KAI;
  const xpPercent = Math.min(
    100,
    Math.round((profile.currentXp / Math.max(1, profile.nextLevelXp)) * 100)
  );

  const handleSaveUsername = () => {
    soundManager.playMenuSelect();
    progressionManager.setUsername(tempName);
    setIsEditingName(false);
  };

  const handleUnlockFighter = (fId: FighterId) => {
    soundManager.playMenuSelect();
    const res = progressionManager.unlockFighterWithCoins(fId);
    if (res.success) {
      setUnlockedModalFighter(fId);
    } else {
      alert(res.message);
    }
  };

  const handleClaimAchievement = (achId: string) => {
    soundManager.playMenuSelect();
    const res = progressionManager.claimAchievement(achId);
    if (res.success) {
      soundManager.playSpecialAttack();
    } else {
      alert(res.message);
    }
  };

  const filteredHistory = profile.matchHistory.filter((m) => {
    if (historyFilter === 'ALL') return true;
    return m.gameMode === historyFilter;
  });

  return (
    <>
      <div className="profile-overlay" onClick={onClose}>
        <div className="profile-container" onClick={(e) => e.stopPropagation()}>
          {/* Top Header Card */}
          <div className="profile-header-card">
            <div className="profile-user-left">
              <div className="profile-avatar-frame">
                <img
                  src={`/assets/sprites/portraits/portrait_${profile.favoriteFighter.toLowerCase()}.png`}
                  alt="Avatar"
                  className="profile-avatar-img"
                />
              </div>

              <div className="profile-user-meta">
                <div className="profile-title-tag">
                  {profile.cosmetics.selectedTitle.toUpperCase()}
                </div>

                <div className="profile-name-row">
                  {isEditingName ? (
                    <div className="edit-name-group">
                      <input
                        type="text"
                        value={tempName}
                        onChange={(e) => setTempName(e.target.value)}
                        className="profile-name-input"
                        maxLength={16}
                        autoFocus
                      />
                      <button className="icon-save-btn" onClick={handleSaveUsername}>
                        <Check size={16} />
                      </button>
                    </div>
                  ) : (
                    <>
                      <h1 className="profile-username">{profile.username}</h1>
                      <button
                        className="icon-edit-btn"
                        onClick={() => {
                          soundManager.playMenuSelect();
                          setIsEditingName(true);
                        }}
                      >
                        <Edit2 size={14} />
                      </button>
                    </>
                  )}
                  <span className="profile-id-code">{profile.playerId}</span>
                </div>
              </div>
            </div>

            {/* Rank Badge & Coins Summary */}
            <div className="profile-header-right">
              <div
                className="rank-badge-box"
                style={{
                  borderColor: rankInfo.badgeColor,
                  boxShadow: `0 0 16px ${rankInfo.badgeGlow}`,
                }}
              >
                <div className="rank-tier-label" style={{ color: rankInfo.badgeColor }}>
                  {rankInfo.tier}
                </div>
                <div className="rank-rp-counter">
                  {rankInfo.currentRp.toLocaleString()} <span className="rp-sub">RP</span>
                </div>
              </div>

              <div className="profile-coins-box">
                <Coins size={18} color="#ffd700" />
                <span className="coins-value">{profile.coins.toLocaleString()}</span>
                <span className="coins-label">AX COINS</span>
              </div>

              <button className="profile-close-btn" onClick={onClose}>
                <X size={22} />
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="profile-tabs-nav">
            {(['OVERVIEW', 'FIGHTERS', 'ACHIEVEMENTS', 'HISTORY', 'COSMETICS'] as TabType[]).map(
              (tab) => (
                <button
                  key={tab}
                  className={`profile-tab-btn ${activeTab === tab ? 'active' : ''}`}
                  onClick={() => {
                    soundManager.playMenuSelect();
                    setActiveTab(tab);
                  }}
                >
                  {tab === 'OVERVIEW' && <User size={16} />}
                  {tab === 'FIGHTERS' && <Swords size={16} />}
                  {tab === 'ACHIEVEMENTS' && <Trophy size={16} />}
                  {tab === 'HISTORY' && <History size={16} />}
                  {tab === 'COSMETICS' && <Palette size={16} />}
                  <span>{tab}</span>
                </button>
              )
            )}
          </div>

          {/* TAB 1: OVERVIEW (SF6 Buckler's Boot Camp Style) */}
          {activeTab === 'OVERVIEW' && (
            <div className="profile-overview-layout">
              {/* Left Column: Favorite Fighter Art Showcase */}
              <div className="profile-fighter-showcase">
                <div className="showcase-glow-back" style={{ background: favoriteFighter.colors.aura }} />
                <img
                  src={`/assets/sprites/portraits/portrait_${profile.favoriteFighter.toLowerCase()}.png`}
                  alt={favoriteFighter.name}
                  className="showcase-fighter-img"
                />
                <div className="showcase-banner">
                  <div className="showcase-sub">FAVORITE COMBATANT</div>
                  <h2 className="showcase-name" style={{ color: favoriteFighter.colors.accent }}>
                    {favoriteFighter.name}
                  </h2>
                  <div className="showcase-archetype">{favoriteFighter.title} • {favoriteFighter.martialArt}</div>
                </div>
              </div>

              {/* Right Column: Level & XP Bar + Stats Matrix */}
              <div className="profile-stats-panel">
                {/* Level & XP Progression */}
                <div className="level-progression-card">
                  <div className="level-badge-row">
                    <div className="level-number-badge">
                      <span className="lvl-prefix">LVL</span>
                      <span className="lvl-val">{profile.level}</span>
                    </div>
                    <div className="xp-text-stats">
                      <span className="xp-label">EXPERIENCE POINTS</span>
                      <span className="xp-ratio">
                        {profile.currentXp.toLocaleString()} / {profile.nextLevelXp.toLocaleString()} XP
                      </span>
                    </div>
                  </div>
                  <div className="xp-bar-track">
                    <div className="xp-bar-fill" style={{ width: `${xpPercent}%` }} />
                  </div>
                  <div className="xp-footnote">
                    +{Math.max(0, profile.nextLevelXp - profile.currentXp)} XP until Level {profile.level + 1} reward (+250 Coins)
                  </div>
                </div>

                {/* Combat Stats Grid */}
                <div className="stats-metric-grid">
                  <div className="stat-card">
                    <div className="stat-label">TOTAL BATTLES</div>
                    <div className="stat-value">{profile.totalMatches}</div>
                    <div className="stat-sub">Completed Matches</div>
                  </div>

                  <div className="stat-card">
                    <div className="stat-label">VICTORIES</div>
                    <div className="stat-value text-win">{profile.wins}</div>
                    <div className="stat-sub">Defeats: {profile.losses}</div>
                  </div>

                  <div className="stat-card">
                    <div className="stat-label">WIN RATE</div>
                    <div className="stat-value text-accent">{profile.winRate}%</div>
                    <div className="stat-sub">Overall Competitive</div>
                  </div>

                  <div className="stat-card">
                    <div className="stat-label">WIN STREAK</div>
                    <div className="stat-value">{profile.currentWinStreak}</div>
                    <div className="stat-sub">Best: {profile.highestWinStreak} Streak</div>
                  </div>

                  <div className="stat-card">
                    <div className="stat-label">UNLOCKED ROSTER</div>
                    <div className="stat-value text-cyan">
                      {profile.unlockedFighters.length} / 16
                    </div>
                    <div className="stat-sub">Playable Fighters</div>
                  </div>

                  <div className="stat-card">
                    <div className="stat-label">ACHIEVEMENTS</div>
                    <div className="stat-value text-gold">
                      {Object.values(profile.achievements).filter((a) => a.isUnlocked).length} /{' '}
                      {Object.keys(profile.achievements).length}
                    </div>
                    <div className="stat-sub">Trophies Earned</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: FIGHTERS UNLOCK GALLERY */}
          {activeTab === 'FIGHTERS' && (
            <div className="profile-fighters-layout">
              {/* Left Roster 4x4 Grid */}
              <div className="profile-roster-grid">
                {Object.values(ROSTER_FIGHTERS).map((f) => {
                  const isUnlocked = profile.unlockedFighters.includes(f.id);
                  const isSelected = selectedFighterDetail === f.id;
                  const cfg = FIGHTER_UNLOCK_CONFIG[f.id];

                  return (
                    <div
                      key={f.id}
                      className={`profile-fighter-card ${isUnlocked ? 'unlocked' : 'locked'} ${
                        isSelected ? 'selected' : ''
                      }`}
                      onClick={() => {
                        soundManager.playMenuSelect();
                        setSelectedFighterDetail(f.id);
                      }}
                    >
                      <img
                        src={`/assets/sprites/portraits/portrait_${f.id.toLowerCase()}.png`}
                        alt={f.name}
                        className="card-portrait-img"
                      />
                      {!isUnlocked && (
                        <div className="card-lock-overlay">
                          <Lock size={18} color="#ffd700" />
                        </div>
                      )}
                      <div className="card-footer-info">
                        <span className="card-f-name">{f.name}</span>
                        {isUnlocked ? (
                          <span className="card-status-badge unlocked">UNLOCKED</span>
                        ) : (
                          <span className="card-status-badge locked">
                            {cfg?.coinCost ? `${cfg.coinCost} C` : 'LOCKED'}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Right Detail Pane */}
              <div className="profile-fighter-detail-pane">
                {(() => {
                  const detailFighter = ROSTER_FIGHTERS[selectedFighterDetail];
                  const cfg = FIGHTER_UNLOCK_CONFIG[selectedFighterDetail];
                  const isUnlocked = profile.unlockedFighters.includes(selectedFighterDetail);

                  return (
                    <div className="detail-card-inner">
                      <div className="detail-header">
                        <img
                          src={`/assets/sprites/portraits/portrait_${selectedFighterDetail.toLowerCase()}.png`}
                          alt={detailFighter.name}
                          className="detail-avatar"
                        />
                        <div>
                          <h2 className="detail-name" style={{ color: detailFighter.colors.accent }}>
                            {detailFighter.name}
                          </h2>
                          <div className="detail-title">{detailFighter.title}</div>
                        </div>
                      </div>

                      <div className="detail-meta-row">
                        <span className="badge-tag">{detailFighter.archetype}</span>
                        <span className="badge-tag">{detailFighter.martialArt}</span>
                        <span className="badge-tag" style={{ color: detailFighter.colors.emissive }}>
                          {detailFighter.element}
                        </span>
                      </div>

                      <p className="detail-lore">{detailFighter.lore}</p>

                      <div className="detail-unlock-status-box">
                        <div className="unlock-status-heading">
                          {isUnlocked ? (
                            <span className="status-unlocked-title">
                              <Unlock size={18} /> UNLOCKED & READY FOR BATTLE
                            </span>
                          ) : (
                            <span className="status-locked-title">
                              <Lock size={18} /> LOCKED FIGHTER
                            </span>
                          )}
                        </div>

                        <p className="unlock-req-desc">
                          {isUnlocked ? 'This combatant is fully unlocked in your roster.' : cfg.description}
                        </p>

                        {!isUnlocked && (
                          <button
                            className="arena-btn primary-btn unlock-btn"
                            onClick={() => handleUnlockFighter(selectedFighterDetail)}
                          >
                            <Coins size={18} /> UNLOCK NOW ({cfg.coinCost.toLocaleString()} COINS)
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          )}

          {/* TAB 3: ACHIEVEMENTS COLLECTION */}
          {activeTab === 'ACHIEVEMENTS' && (
            <div className="profile-achievements-list">
              {Object.values(profile.achievements).map((ach) => {
                const percent = Math.min(
                  100,
                  Math.round((ach.currentValue / Math.max(1, ach.targetValue)) * 100)
                );

                return (
                  <div
                    key={ach.id}
                    className={`achievement-row-card ${ach.isUnlocked ? 'unlocked' : 'locked'}`}
                  >
                    <div className="ach-icon-box">
                      {ach.category === 'COMBAT' && <Swords size={22} />}
                      {ach.category === 'ONLINE' && <Zap size={22} />}
                      {ach.category === 'MASTERY' && <Trophy size={22} />}
                      {ach.category === 'PROGRESSION' && <Sparkles size={22} />}
                    </div>

                    <div className="ach-content-box">
                      <div className="ach-title-row">
                        <h3 className="ach-title">{ach.title}</h3>
                        <span className="ach-category-tag">{ach.category}</span>
                      </div>
                      <p className="ach-desc">{ach.description}</p>
                      <div className="ach-progress-bar-track">
                        <div className="ach-progress-bar-fill" style={{ width: `${percent}%` }} />
                      </div>
                      <div className="ach-progress-text">
                        {ach.currentValue} / {ach.targetValue} ({percent}%)
                      </div>
                    </div>

                    <div className="ach-rewards-col">
                      <div className="reward-pill xp">+{ach.rewardXp} XP</div>
                      <div className="reward-pill coins">+{ach.rewardCoins} COINS</div>

                      {ach.isUnlocked ? (
                        ach.isClaimed ? (
                          <div className="claimed-badge">CLAIMED</div>
                        ) : (
                          <button
                            className="arena-btn primary-btn claim-btn"
                            onClick={() => handleClaimAchievement(ach.id)}
                          >
                            CLAIM
                          </button>
                        )
                      ) : (
                        <div className="locked-pill">IN PROGRESS</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* TAB 4: MATCH HISTORY (Battle Log) */}
          {activeTab === 'HISTORY' && (
            <div className="profile-history-layout">
              <div className="history-filter-bar">
                {(['ALL', 'VERSUS', 'ONLINE'] as const).map((mode) => (
                  <button
                    key={mode}
                    className={`filter-btn ${historyFilter === mode ? 'active' : ''}`}
                    onClick={() => {
                      soundManager.playMenuSelect();
                      setHistoryFilter(mode);
                    }}
                  >
                    {mode}
                  </button>
                ))}
              </div>

              {filteredHistory.length === 0 ? (
                <div className="empty-history-notice">
                  <History size={36} color="#607d8b" />
                  <p>No matches recorded yet. Jump into Versus or Online play to build your history!</p>
                </div>
              ) : (
                <div className="history-cards-scroll">
                  {filteredHistory.map((m) => {
                    const isWin = m.result === 'WIN';
                    const isDraw = m.result === 'DRAW';

                    return (
                      <div
                        key={m.id}
                        className={`match-log-card ${
                          isWin ? 'win-card' : isDraw ? 'draw-card' : 'loss-card'
                        }`}
                      >
                        <div className="match-result-indicator">
                          <span className={`result-label ${isWin ? 'win' : isDraw ? 'draw' : 'loss'}`}>
                            {m.result}
                          </span>
                          <span className="mode-badge">{m.gameMode}</span>
                        </div>

                        <div className="match-vs-box">
                          <div className="fighter-col player">
                            <img
                              src={`/assets/sprites/portraits/portrait_${m.playerFighter.toLowerCase()}.png`}
                              alt={m.playerFighter}
                              className="log-fighter-img"
                            />
                            <span className="log-f-name">{m.playerFighter}</span>
                          </div>

                          <div className="score-col">
                            <span className="score-text">
                              {m.playerScore} — {m.opponentScore}
                            </span>
                            <span className="stage-name-sub">{m.stageId.replace('_', ' ')}</span>
                          </div>

                          <div className="fighter-col opponent">
                            <img
                              src={`/assets/sprites/portraits/portrait_${m.opponentFighter.toLowerCase()}.png`}
                              alt={m.opponentFighter}
                              className="log-fighter-img"
                            />
                            <span className="log-f-name">{m.opponentFighter}</span>
                          </div>
                        </div>

                        <div className="match-rewards-summary">
                          <span className="log-xp">+{m.xpEarned} XP</span>
                          <span className="log-coins">+{m.coinsEarned} Coins</span>
                          <span className={`log-rp ${m.rpChange >= 0 ? 'rp-up' : 'rp-down'}`}>
                            {m.rpChange >= 0 ? `+${m.rpChange}` : m.rpChange} RP
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 5: COSMETICS (Titles, Palettes, Banners) */}
          {activeTab === 'COSMETICS' && (
            <div className="profile-cosmetics-layout">
              <div className="cosmetics-section">
                <h3 className="section-title">PLAYER TITLE</h3>
                <div className="titles-collection-grid">
                  {[
                    'Crimson Striker',
                    'Shadow Assassin',
                    'Novice Challenger',
                    'Dojo Trainee',
                    'Apex Champion',
                    'Celestial Sovereign',
                    'Untouchable Legend',
                  ].map((title) => {
                    const isEquipped = profile.cosmetics.selectedTitle === title;
                    return (
                      <button
                        key={title}
                        className={`title-choice-btn ${isEquipped ? 'equipped' : ''}`}
                        onClick={() => {
                          soundManager.playMenuSelect();
                          progressionManager.equipCosmetic('TITLE', title);
                        }}
                      >
                        <span>{title}</span>
                        {isEquipped && <Check size={16} />}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="cosmetics-section">
                <h3 className="section-title">PROFILE BANNER</h3>
                <div className="banner-collection-grid">
                  {['NEON_CITY_NIGHT', 'TEMPLE_DAWN', 'VOLCANIC_HEAT', 'FROZEN_SUMMIT'].map(
                    (banner) => {
                      const isEquipped = profile.cosmetics.selectedBanner === banner;
                      return (
                        <div
                          key={banner}
                          className={`banner-choice-card ${isEquipped ? 'equipped' : ''}`}
                          onClick={() => {
                            soundManager.playMenuSelect();
                            progressionManager.equipCosmetic('BANNER', banner);
                          }}
                        >
                          <div className="banner-name">{banner.replace('_', ' ')}</div>
                          {isEquipped && <span className="equipped-tag">ACTIVE</span>}
                        </div>
                      );
                    }
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Unlock Celebration Modal popup if unlocked */}
      <FighterUnlockModal
        isOpen={unlockedModalFighter !== null}
        fighterId={unlockedModalFighter}
        onClose={() => setUnlockedModalFighter(null)}
      />
    </>
  );
};
