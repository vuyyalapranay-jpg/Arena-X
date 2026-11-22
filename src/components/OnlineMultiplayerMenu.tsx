// src/components/OnlineMultiplayerMenu.tsx
// PREMIUM ANIME-INSPIRED MULTIPLAYER SUITE FOR ARENA X (2XKO & UNDER NIGHT AESTHETICS)

import React, { useState, useEffect } from 'react';
import {
  Zap,
  Globe,
  PlusCircle,
  KeyRound,
  Lock,
  Users,
  Share2,
  Copy,
  Check,
  ArrowLeft,
  RefreshCw,
  Swords,
  ShieldCheck,
  AlertCircle,
  Clock,
  Wifi,
  Radio,
} from 'lucide-react';
import { multiplayerClient, ConnectionStatus } from '../multiplayer/MultiplayerClient';
import { RoomMetadata, OnlineCharacter, FullRoomSnapshot } from '../../server/types';
import { soundManager } from '../game/core/SoundManager';
import { StageSelectModal } from './StageSelectModal';
import { StageId } from '../game/stages/StageConfig';

interface OnlineMultiplayerMenuProps {
  onBackToMainMenu: () => void;
  onLaunchOnlineFight: (stage?: string) => void;
  initialRoomCode?: string | null;
}

type OnlineView =
  | 'ONLINE_MENU'
  | 'PUBLIC_ROOMS'
  | 'CREATE_ROOM'
  | 'JOIN_CODE'
  | 'MATCHMAKING'
  | 'LOBBY';

export const OnlineMultiplayerMenu: React.FC<OnlineMultiplayerMenuProps> = ({
  onBackToMainMenu,
  onLaunchOnlineFight,
  initialRoomCode,
}) => {
  const [view, setView] = useState<OnlineView>('ONLINE_MENU');
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('DISCONNECTED');
  const [publicRooms, setPublicRooms] = useState<RoomMetadata[]>([]);
  const [isLoadingRooms, setIsLoadingRooms] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form states
  const [roomNameInput, setRoomNameInput] = useState('CYBER ARENA');
  const [isPrivateInput, setIsPrivateInput] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [codeInputValue, setCodeInputValue] = useState('');
  const [playerNameInput, setPlayerNameInput] = useState(
    () => localStorage.getItem('arena_x_player_name') || `Fighter_${Math.floor(100 + Math.random() * 900)}`
  );

  // Matchmaking timer
  const [searchTimer, setSearchTimer] = useState(0);

  // Room & Lobby states
  const [copiedCode, setCopiedCode] = useState(false);
  const [snapshot, setSnapshot] = useState<FullRoomSnapshot | null>(null);
  const [showStageModal, setShowStageModal] = useState(false);

  // Save player name
  const handleNameChange = (newName: string) => {
    setPlayerNameInput(newName);
    localStorage.setItem('arena_x_player_name', newName);
    if (multiplayerClient.getStatus() === 'CONNECTED') {
      multiplayerClient.setName(newName);
    }
  };

  // Subscriptions to MultiplayerClient
  useEffect(() => {
    const unsubStatus = multiplayerClient.onStatusChange((status) => {
      setConnectionStatus(status);
    });

    const unsubJoined = multiplayerClient.onRoomJoined(() => {
      setView((currView) => (currView === 'MATCHMAKING' ? 'MATCHMAKING' : 'LOBBY'));
      soundManager.playMenuSelect();
    });

    const unsubSnapshot = multiplayerClient.onSnapshot((snap) => {
      setSnapshot(snap);
      // If in matchmaking and opponent has joined, enter lobby!
      setView((currView) => {
        if (currView === 'MATCHMAKING' && snap.p1?.isConnected && snap.p2?.isConnected) {
          return 'LOBBY';
        }
        return currView;
      });

      if (snap.match.status === 'FIGHTING') {
        onLaunchOnlineFight(snap.match.stage);
      }
    });

    const unsubMatchStart = (stage?: string) => {
      onLaunchOnlineFight(stage);
    };
    const unsubMatch = multiplayerClient.onMatchStart(unsubMatchStart);

    const unsubError = multiplayerClient.onError((err) => {
      setErrorMessage(err);
      soundManager.playBlockClank();
    });

    return () => {
      unsubStatus();
      unsubJoined();
      unsubSnapshot();
      unsubMatch();
      unsubError();
    };
  }, [onLaunchOnlineFight]);

  // Handle invitation URL deep link if provided
  useEffect(() => {
    if (initialRoomCode) {
      setCodeInputValue(initialRoomCode);
      handleJoinByCode(initialRoomCode);
    }
  }, [initialRoomCode]);

  // Refresh public rooms list
  const refreshPublicRooms = async () => {
    setIsLoadingRooms(true);
    setErrorMessage(null);
    try {
      const rooms = await multiplayerClient.fetchPublicRooms();
      setPublicRooms(rooms);
    } catch (err: any) {
      setErrorMessage('Could not connect to multiplayer server');
    } finally {
      setIsLoadingRooms(false);
    }
  };

  useEffect(() => {
    if (view === 'PUBLIC_ROOMS') {
      refreshPublicRooms();
      const interval = setInterval(refreshPublicRooms, 5000);
      return () => clearInterval(interval);
    }
  }, [view]);

  // Matchmaking timer effect
  useEffect(() => {
    let interval: any = null;
    if (view === 'MATCHMAKING') {
      setSearchTimer(0);
      interval = setInterval(() => {
        setSearchTimer((t) => t + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [view]);

  // Actions
  const handleCreateRoom = async () => {
    setErrorMessage(null);
    try {
      await multiplayerClient.connectAndJoin({
        mode: 'CREATE',
        roomName: roomNameInput,
        visibility: isPrivateInput ? 'PRIVATE' : 'PUBLIC',
        password: passwordInput || undefined,
        playerName: playerNameInput,
      });
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to create room');
    }
  };

  const handleJoinById = async (roomId: string, hasPassword = false) => {
    let pwd = undefined;
    if (hasPassword) {
      const promptPwd = prompt('Enter Room Password:');
      if (!promptPwd) return;
      pwd = promptPwd;
    }
    setErrorMessage(null);
    try {
      await multiplayerClient.connectAndJoin({
        mode: 'BY_ID',
        roomId,
        password: pwd,
        playerName: playerNameInput,
      });
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to join room');
    }
  };

  const handleJoinByCode = async (codeToJoin = codeInputValue) => {
    if (!codeToJoin.trim()) {
      setErrorMessage('Please enter a valid room code (e.g. AX-7824)');
      return;
    }
    setErrorMessage(null);
    try {
      await multiplayerClient.connectAndJoin({
        mode: 'BY_CODE',
        code: codeToJoin.trim().toUpperCase(),
        password: passwordInput || undefined,
        playerName: playerNameInput,
      });
    } catch (err: any) {
      setErrorMessage(err.message || 'Room code not found or expired');
    }
  };

  const handleStartQuickMatch = async () => {
    setView('MATCHMAKING');
    setErrorMessage(null);
    try {
      await multiplayerClient.connectAndJoin({
        mode: 'QUICK_MATCH',
        playerName: playerNameInput,
      });
    } catch (err: any) {
      setErrorMessage(err.message || 'Quick Match search failed');
      setView('ONLINE_MENU');
    }
  };

  const handleCopyInviteCode = () => {
    if (multiplayerClient.roomCode) {
      navigator.clipboard.writeText(multiplayerClient.roomCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const handleShareInviteLink = () => {
    if (multiplayerClient.roomCode) {
      const shareUrl = `${window.location.origin}${window.location.pathname}?room=${multiplayerClient.roomCode}`;
      if (navigator.share) {
        navigator.share({
          title: 'Join me in ARENA X!',
          text: `Fight me in ARENA X! Room Code: ${multiplayerClient.roomCode}`,
          url: shareUrl,
        }).catch(() => {});
      } else {
        navigator.clipboard.writeText(shareUrl);
        setCopiedCode(true);
        setTimeout(() => setCopiedCode(false), 2000);
      }
    }
  };

  const handleLeaveLobby = () => {
    multiplayerClient.leaveRoom();
    setView('ONLINE_MENU');
  };

  // Lobby Data helpers
  const mySlot = multiplayerClient.mySlot || 'P1';
  const isHost = multiplayerClient.isHost;
  const p1 = snapshot?.p1;
  const p2 = snapshot?.p2;
  const isBothReady = !!(p1?.isReady && p2?.isReady && p1?.isConnected && p2?.isConnected);

  return (
    <div className="online-multiplayer-container">
      {/* Background Cyber Mesh */}
      <div className="online-bg-mesh" />

      {/* Top Header Navigation */}
      <header className="online-header">
        <div className="header-left">
          <button
            className="online-back-btn"
            onClick={() => {
              soundManager.playMenuSelect();
              if (view === 'LOBBY') {
                handleLeaveLobby();
              } else if (view !== 'ONLINE_MENU') {
                setView('ONLINE_MENU');
              } else {
                onBackToMainMenu();
              }
            }}
          >
            <ArrowLeft size={18} />
            <span>{view === 'ONLINE_MENU' ? 'MAIN MENU' : 'BACK'}</span>
          </button>
          <div className="online-title-badge">
            <Radio className="pulse-icon" size={16} />
            <span>NETPLAY 2.5D</span>
          </div>
        </div>

        {/* Global Player Name Tag */}
        <div className="header-right">
          <div className="player-tag-pill">
            <span className="label">FIGHTER TAG:</span>
            <input
              type="text"
              className="player-name-input"
              value={playerNameInput}
              maxLength={14}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="Your Tag"
            />
          </div>
          <div className={`connection-indicator ${connectionStatus.toLowerCase()}`}>
            <Wifi size={14} />
            <span>{connectionStatus}</span>
          </div>
        </div>
      </header>

      {/* Global Error Banner */}
      {errorMessage && (
        <div className="online-error-banner">
          <AlertCircle size={18} />
          <span>{errorMessage}</span>
          <button className="error-dismiss-btn" onClick={() => setErrorMessage(null)}>
            ×
          </button>
        </div>
      )}

      {/* VIEW 1: ONLINE PLAY MAIN MENU (2XKO Aesthetic) */}
      {view === 'ONLINE_MENU' && (
        <div className="online-menu-view">
          <div className="online-hero-text">
            <h1 className="hero-title">
              ONLINE <span className="highlight-magenta">COMBAT</span>
            </h1>
            <p className="hero-sub">
              Zero-latency real-time 2.5D anime fighting over authoritative WebSockets
            </p>
          </div>

          <div className="online-buttons-stack">
            {/* 1. Quick Match */}
            <button
              className="online-action-btn quick-match-btn"
              onMouseEnter={() => soundManager.playMenuHover()}
              onClick={() => {
                soundManager.playMenuSelect();
                handleStartQuickMatch();
              }}
            >
              <div className="btn-angled-cut" />
              <Zap className="btn-icon" size={26} />
              <div className="btn-content">
                <span className="btn-primary-text">QUICK MATCH</span>
                <span className="btn-sub-text">Jump instantly into combat against open challenger</span>
              </div>
              <div className="neon-edge-glow" />
            </button>

            {/* 2. Public Rooms */}
            <button
              className="online-action-btn standard-online-btn"
              onMouseEnter={() => soundManager.playMenuHover()}
              onClick={() => {
                soundManager.playMenuSelect();
                setView('PUBLIC_ROOMS');
              }}
            >
              <div className="btn-angled-cut" />
              <Globe className="btn-icon" size={24} />
              <div className="btn-content">
                <span className="btn-primary-text">PUBLIC ROOMS</span>
                <span className="btn-sub-text">Browse and join active lobbies hosted by other players</span>
              </div>
            </button>

            {/* 3. Create Room */}
            <button
              className="online-action-btn standard-online-btn"
              onMouseEnter={() => soundManager.playMenuHover()}
              onClick={() => {
                soundManager.playMenuSelect();
                setIsPrivateInput(false);
                setView('CREATE_ROOM');
              }}
            >
              <div className="btn-angled-cut" />
              <PlusCircle className="btn-icon" size={24} />
              <div className="btn-content">
                <span className="btn-primary-text">CREATE ROOM</span>
                <span className="btn-sub-text">Host a custom public or private combat lobby</span>
              </div>
            </button>

            {/* 4. Join By Code */}
            <button
              className="online-action-btn standard-online-btn"
              onMouseEnter={() => soundManager.playMenuHover()}
              onClick={() => {
                soundManager.playMenuSelect();
                setView('JOIN_CODE');
              }}
            >
              <div className="btn-angled-cut" />
              <KeyRound className="btn-icon" size={24} />
              <div className="btn-content">
                <span className="btn-primary-text">JOIN BY CODE</span>
                <span className="btn-sub-text">Directly connect to a private room via 6-digit invitation code</span>
              </div>
            </button>

            {/* 5. Private Rooms / Friend Invite */}
            <button
              className="online-action-btn standard-online-btn"
              onMouseEnter={() => soundManager.playMenuHover()}
              onClick={() => {
                soundManager.playMenuSelect();
                setIsPrivateInput(true);
                setView('CREATE_ROOM');
              }}
            >
              <div className="btn-angled-cut" />
              <Lock className="btn-icon" size={24} />
              <div className="btn-content">
                <span className="btn-primary-text">PRIVATE DUEL</span>
                <span className="btn-sub-text">Create unlisted lobby with invite link & password for friends</span>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* VIEW 2: PUBLIC ROOMS BROWSER */}
      {view === 'PUBLIC_ROOMS' && (
        <div className="public-rooms-view">
          <div className="view-title-bar">
            <div>
              <h2 className="section-title">PUBLIC COMBAT ROOMS</h2>
              <p className="section-sub">Join an open lobby or host your own challenger arena</p>
            </div>
            <div className="view-actions">
              <button
                className="refresh-btn"
                onClick={refreshPublicRooms}
                disabled={isLoadingRooms}
              >
                <RefreshCw className={isLoadingRooms ? 'spin-icon' : ''} size={16} />
                <span>REFRESH</span>
              </button>
              <button
                className="create-quick-btn"
                onClick={() => {
                  soundManager.playMenuSelect();
                  setIsPrivateInput(false);
                  setView('CREATE_ROOM');
                }}
              >
                <PlusCircle size={16} />
                <span>HOST ROOM</span>
              </button>
            </div>
          </div>

          <div className="room-list-container">
            {isLoadingRooms && publicRooms.length === 0 ? (
              <div className="room-empty-state">
                <RefreshCw className="spin-icon" size={32} />
                <p>Querying active matchmaking servers...</p>
              </div>
            ) : publicRooms.length === 0 ? (
              <div className="room-empty-state">
                <Users size={40} />
                <p>No public rooms currently active.</p>
                <span className="hint">Be the first to host an arena for challengers!</span>
                <button
                  className="host-first-btn"
                  onClick={() => {
                    soundManager.playMenuSelect();
                    setView('CREATE_ROOM');
                  }}
                >
                  CREATE PUBLIC ROOM
                </button>
              </div>
            ) : (
              <div className="room-grid">
                {publicRooms.map((room) => {
                  const isFull = room.playerCount >= room.maxPlayers;
                  const isFighting = room.status === 'FIGHTING';
                  return (
                    <div
                      key={room.id}
                      className={`room-card ${isFull || isFighting ? 'room-busy' : ''}`}
                    >
                      <div className="card-top">
                        <div className="room-meta">
                          <span className="room-code-tag">{room.code}</span>
                          {room.hasPassword && <Lock className="lock-tag" size={14} />}
                        </div>
                        <span className={`status-badge status-${room.status.toLowerCase()}`}>
                          {room.status}
                        </span>
                      </div>

                      <h3 className="room-name">{room.name}</h3>
                      <div className="room-details">
                        <span className="host-name">HOST: {room.hostName}</span>
                        <span className="player-count">
                          <Users size={14} />
                          {room.playerCount} / {room.maxPlayers}
                        </span>
                      </div>

                      <button
                        className="join-room-btn"
                        disabled={isFull || isFighting}
                        onClick={() => {
                          soundManager.playMenuSelect();
                          handleJoinById(room.id, room.hasPassword);
                        }}
                      >
                        {isFighting ? 'MATCH RUNNING' : isFull ? 'LOBBY FULL' : 'FIGHT NOW'}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW 3: CREATE ROOM FORM */}
      {view === 'CREATE_ROOM' && (
        <div className="form-card-view">
          <div className="form-card">
            <h2 className="form-title">
              {isPrivateInput ? 'HOST PRIVATE DUEL' : 'HOST PUBLIC ARENA'}
            </h2>
            <div className="form-divider" />

            <div className="form-group">
              <label>ROOM NAME</label>
              <input
                type="text"
                className="text-input"
                value={roomNameInput}
                maxLength={24}
                onChange={(e) => setRoomNameInput(e.target.value)}
                placeholder="e.g. Neo-Tokyo Dojo"
              />
            </div>

            <div className="form-group">
              <label>LOBBY VISIBILITY</label>
              <div className="toggle-group">
                <button
                  type="button"
                  className={`toggle-btn ${!isPrivateInput ? 'active' : ''}`}
                  onClick={() => setIsPrivateInput(false)}
                >
                  <Globe size={16} />
                  <span>PUBLIC</span>
                </button>
                <button
                  type="button"
                  className={`toggle-btn ${isPrivateInput ? 'active' : ''}`}
                  onClick={() => setIsPrivateInput(true)}
                >
                  <Lock size={16} />
                  <span>PRIVATE</span>
                </button>
              </div>
              <span className="field-hint">
                {isPrivateInput
                  ? 'Private rooms are hidden from the browser and require an invitation code or link.'
                  : 'Public rooms appear in the lobby browser for any challenger to join.'}
              </span>
            </div>

            <div className="form-group">
              <label>OPTIONAL PASSWORD</label>
              <input
                type="password"
                className="text-input"
                value={passwordInput}
                maxLength={16}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="Leave blank for open access"
              />
            </div>

            <div className="form-actions">
              <button
                className="cancel-form-btn"
                onClick={() => {
                  soundManager.playMenuSelect();
                  setView('ONLINE_MENU');
                }}
              >
                CANCEL
              </button>
              <button
                className="submit-form-btn"
                onClick={() => {
                  soundManager.playMenuSelect();
                  handleCreateRoom();
                }}
              >
                CREATE & ENTER LOBBY
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 4: JOIN BY CODE FORM */}
      {view === 'JOIN_CODE' && (
        <div className="form-card-view">
          <div className="form-card">
            <h2 className="form-title">JOIN VIA INVITATION CODE</h2>
            <div className="form-divider" />
            <p className="form-desc">
              Enter the 6-character room code shared by your opponent to connect directly.
            </p>

            <div className="form-group">
              <label>ROOM CODE</label>
              <input
                type="text"
                className="code-input text-input"
                value={codeInputValue}
                maxLength={8}
                onChange={(e) => setCodeInputValue(e.target.value.toUpperCase())}
                placeholder="AX-XXXX"
              />
            </div>

            <div className="form-group">
              <label>PASSWORD (IF REQUIRED)</label>
              <input
                type="password"
                className="text-input"
                value={passwordInput}
                maxLength={16}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="Enter password if room is locked"
              />
            </div>

            <div className="form-actions">
              <button
                className="cancel-form-btn"
                onClick={() => {
                  soundManager.playMenuSelect();
                  setView('ONLINE_MENU');
                }}
              >
                CANCEL
              </button>
              <button
                className="submit-form-btn"
                onClick={() => {
                  soundManager.playMenuSelect();
                  handleJoinByCode();
                }}
              >
                CONNECT TO LOBBY
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 5: QUICK MATCH SEARCHING */}
      {view === 'MATCHMAKING' && (
        <div className="matchmaking-view">
          <div className="radar-circle">
            <div className="radar-sweep" />
            <div className="radar-core">
              <Swords size={36} />
            </div>
          </div>

          <h2 className="matchmaking-title">SEARCHING FOR OPPONENT</h2>
          <div className="search-timer-pill">
            <Clock size={16} />
            <span>ELAPSED: 0:{searchTimer < 10 ? `0${searchTimer}` : searchTimer}</span>
          </div>
          <p className="matchmaking-sub">Scanning active matchmaking queue for compatible challenger...</p>

          <button
            className="cancel-matchmaking-btn"
            onClick={() => {
              soundManager.playMenuSelect();
              multiplayerClient.leaveRoom();
              setView('ONLINE_MENU');
            }}
          >
            CANCEL MATCHMAKING
          </button>
        </div>
      )}

      {/* VIEW 6: MULTIPLAYER LOBBY (Under Night In-Birth Split-Screen Aesthetic) */}
      {view === 'LOBBY' && (
        <div className="multiplayer-lobby-view">
          {/* Top Lobby Bar */}
          <div className="lobby-top-bar">
            <div className="lobby-room-info">
              <span className="room-label">ROOM:</span>
              <strong className="room-name-display">{multiplayerClient.roomName || 'ARENA'}</strong>
              <div className="room-code-badge">
                <span>CODE: <strong>{multiplayerClient.roomCode}</strong></span>
                <button
                  className="icon-copy-btn"
                  title="Copy Code"
                  onClick={handleCopyInviteCode}
                >
                  {copiedCode ? <Check size={14} className="copied-icon" /> : <Copy size={14} />}
                </button>
                <button
                  className="icon-share-btn"
                  title="Share Invite Link"
                  onClick={handleShareInviteLink}
                >
                  <Share2 size={14} />
                </button>
              </div>
            </div>

            <div className="lobby-ping-pill">
              <Wifi size={14} />
              <span>PING: {multiplayerClient.currentPing} ms</span>
            </div>
          </div>

          {/* Dual Split-Screen Fighter Selection Panels */}
          <div className="lobby-fighters-arena">
            {/* --- PLAYER 1 (Left / Cyan Accent) --- */}
            <div className={`fighter-slot-panel p1-panel ${mySlot === 'P1' ? 'my-slot' : ''}`}>
              <div className="panel-badge cyan-badge">
                <span>PLAYER 1</span>
                {p1?.isHost && <span className="host-badge">HOST</span>}
              </div>

              <div className="fighter-portrait-wrapper">
                <div className={`portrait-silhouette ${p1?.character === 'KAI' ? 'kai-bg' : 'shadow-bg'}`}>
                  <div className="character-avatar-large">
                    {p1?.character === 'KAI' ? '⚡ KAI' : '🌑 SHADOW'}
                  </div>
                </div>
              </div>

              <div className="fighter-info-block">
                <h3 className="fighter-slot-name">{p1?.name || 'WAITING FOR PLAYER...'}</h3>
                <span className="fighter-style-tag">
                  {p1?.character === 'KAI' ? 'CELESTIAL BLUE ENERGY' : 'DARK VOID STRIKER'}
                </span>

                <div className="slot-ready-status">
                  {p1?.isReady ? (
                    <div className="ready-badge ready">
                      <ShieldCheck size={16} />
                      <span>READY FOR COMBAT</span>
                    </div>
                  ) : (
                    <div className="ready-badge not-ready">
                      <Clock size={16} />
                      <span>PREPARING...</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Character selection buttons if local player */}
              {mySlot === 'P1' && (
                <div className="character-select-selector">
                  <button
                    className={`char-choice-btn ${p1?.character === 'KAI' ? 'active-choice' : ''}`}
                    onClick={() => {
                      soundManager.playMenuSelect();
                      multiplayerClient.selectCharacter('KAI');
                    }}
                  >
                    KAI
                  </button>
                  <button
                    className={`char-choice-btn ${p1?.character === 'SHADOW' ? 'active-choice' : ''}`}
                    onClick={() => {
                      soundManager.playMenuSelect();
                      multiplayerClient.selectCharacter('SHADOW');
                    }}
                  >
                    SHADOW
                  </button>
                </div>
              )}
            </div>

            {/* --- VS EMBLEM IN CENTER --- */}
            <div className="lobby-vs-divider">
              <div className="vs-circle">VS</div>
              <button
                className="vs-stage-btn"
                onClick={() => isHost && setShowStageModal(true)}
                title={isHost ? "Click to change battle arena" : "Stage selected by Host"}
                style={{
                  background: 'rgba(10, 16, 28, 0.75)',
                  border: isHost ? '1px solid #00e5ff' : '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '4px',
                  padding: '0.35rem 0.75rem',
                  cursor: isHost ? 'pointer' : 'default',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  marginTop: '0.5rem',
                }}
              >
                <span className="vs-stage-text" style={{ color: isHost ? '#00e5ff' : '#ffffff', fontWeight: 800 }}>
                  STAGE: {snapshot?.match.stage ? snapshot.match.stage.replace(/_/g, ' ') : 'ANCIENT TEMPLE'}
                </span>
                {isHost && (
                  <span style={{ fontSize: '0.7rem', background: '#00e5ff', color: '#000', padding: '1px 5px', borderRadius: '3px', fontWeight: 900 }}>
                    CHANGE
                  </span>
                )}
              </button>
            </div>

            {/* --- PLAYER 2 (Right / Purple Accent) --- */}
            <div className={`fighter-slot-panel p2-panel ${mySlot === 'P2' ? 'my-slot' : ''}`}>
              <div className="panel-badge purple-badge">
                <span>PLAYER 2</span>
                {p2?.isHost && <span className="host-badge">HOST</span>}
              </div>

              <div className="fighter-portrait-wrapper">
                <div className={`portrait-silhouette ${p2?.character === 'KAI' ? 'kai-bg' : 'shadow-bg'}`}>
                  <div className="character-avatar-large">
                    {p2 ? (p2.character === 'KAI' ? '⚡ KAI' : '🌑 SHADOW') : 'WAITING...'}
                  </div>
                </div>
              </div>

              <div className="fighter-info-block">
                <h3 className="fighter-slot-name">{p2?.name || 'WAITING FOR CHALLENGER...'}</h3>
                <span className="fighter-style-tag">
                  {p2 ? (p2.character === 'KAI' ? 'CELESTIAL BLUE ENERGY' : 'DARK VOID STRIKER') : 'SLOT OPEN'}
                </span>

                <div className="slot-ready-status">
                  {!p2 ? (
                    <div className="ready-badge waiting-player">
                      <Users size={16} />
                      <span>INVITE A FRIEND TO JOIN</span>
                    </div>
                  ) : p2.isReady ? (
                    <div className="ready-badge ready">
                      <ShieldCheck size={16} />
                      <span>READY FOR COMBAT</span>
                    </div>
                  ) : (
                    <div className="ready-badge not-ready">
                      <Clock size={16} />
                      <span>PREPARING...</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Character selection buttons if local player */}
              {mySlot === 'P2' && (
                <div className="character-select-selector">
                  <button
                    className={`char-choice-btn ${p2?.character === 'KAI' ? 'active-choice' : ''}`}
                    onClick={() => {
                      soundManager.playMenuSelect();
                      multiplayerClient.selectCharacter('KAI');
                    }}
                  >
                    KAI
                  </button>
                  <button
                    className={`char-choice-btn ${p2?.character === 'SHADOW' ? 'active-choice' : ''}`}
                    onClick={() => {
                      soundManager.playMenuSelect();
                      multiplayerClient.selectCharacter('SHADOW');
                    }}
                  >
                    SHADOW
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Bottom Action Footer */}
          <footer className="lobby-footer">
            <button
              className="lobby-leave-btn"
              onClick={() => {
                soundManager.playMenuSelect();
                handleLeaveLobby();
              }}
            >
              LEAVE ROOM
            </button>

            {/* Ready / Unready Toggle */}
            <button
              className={`lobby-ready-toggle-btn ${(mySlot === 'P1' ? p1?.isReady : p2?.isReady) ? 'btn-is-ready' : ''}`}
              onClick={() => {
                soundManager.playMenuSelect();
                multiplayerClient.toggleReady();
              }}
            >
              <ShieldCheck size={18} />
              <span>{(mySlot === 'P1' ? p1?.isReady : p2?.isReady) ? 'CANCEL READY' : 'READY UP'}</span>
            </button>

            {/* Host Start Match Button */}
            {isHost && (
              <button
                className="lobby-start-match-btn"
                disabled={!isBothReady}
                onClick={() => {
                  soundManager.playMenuSelect();
                  multiplayerClient.startMatch();
                }}
              >
                <Swords size={20} />
                <span>START MATCH</span>
              </button>
            )}
          </footer>
        </div>
      )}

      {/* Online Stage Selection Modal (Synchronized via Host) */}
      <StageSelectModal
        isOpen={showStageModal}
        currentStageId={(snapshot?.match.stage as StageId) || 'ANCIENT_TEMPLE'}
        onSelectStage={(newStageId) => {
          multiplayerClient.selectStage(newStageId);
          setShowStageModal(false);
        }}
        onClose={() => setShowStageModal(false)}
        isHost={isHost}
      />
    </div>
  );
};
