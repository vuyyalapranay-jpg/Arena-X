// src/pages/GameArenaPage.tsx
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GameEngine } from '../game/core/GameEngine';
import { FightHUD } from '../game/ui/FightHUD';
import { multiplayerClient } from '../multiplayer/MultiplayerClient';
import { Wifi, AlertTriangle } from 'lucide-react';
import { 
  FighterStats, 
  GameMode, 
  GameSettings, 
  GameState, 
  MatchState, 
  PlayerId, 
  FighterInputs 
} from '../types';
import { StageId } from '../game/stages/StageConfig';
import { FighterId } from '../game/characters/RosterConfig';
import { GAME_CONFIG } from '../config/gameConfig';

interface GameArenaPageProps {
  gameMode: GameMode;
  settings: GameSettings;
  stageId?: StageId;
  fighterP1?: FighterId;
  fighterP2?: FighterId;
  onReturnToMenu: () => void;
}

export const GameArenaPage: React.FC<GameArenaPageProps> = ({
  gameMode,
  settings,
  stageId = 'ANCIENT_TEMPLE',
  fighterP1 = 'KAI',
  fighterP2 = 'SHADOW',
  onReturnToMenu,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const engineRef = useRef<GameEngine | null>(null);

  // React state for HUD mirroring
  const [gameState, setGameState] = useState<GameState>('INTRO');
  const [fps, setFps] = useState<number>(60);

  const [p1Stats, setP1Stats] = useState<FighterStats>({
    id: 'P1',
    name: GAME_CONFIG.FIGHTERS.P1.name,
    maxHealth: GAME_CONFIG.MATCH.DEFAULT_MAX_HEALTH,
    currentHealth: GAME_CONFIG.MATCH.DEFAULT_MAX_HEALTH,
    guardMeter: 100,
    maxGuardMeter: 100,
    superMeter: 0,
    isInvulnerable: false,
    roundsWon: 0,
    isGrounded: true,
    facing: 1,
    state: 'IDLE',
    colorScheme: GAME_CONFIG.FIGHTERS.P1.colors,
  });

  const [p2Stats, setP2Stats] = useState<FighterStats>({
    id: 'P2',
    name: GAME_CONFIG.FIGHTERS.P2.name,
    maxHealth: GAME_CONFIG.MATCH.DEFAULT_MAX_HEALTH,
    currentHealth: GAME_CONFIG.MATCH.DEFAULT_MAX_HEALTH,
    guardMeter: 100,
    maxGuardMeter: 100,
    superMeter: 0,
    isInvulnerable: false,
    roundsWon: 0,
    isGrounded: true,
    facing: -1,
    state: 'IDLE',
    colorScheme: GAME_CONFIG.FIGHTERS.P2.colors,
  });

  const [matchState, setMatchState] = useState<MatchState>({
    round: 1,
    timeRemaining: GAME_CONFIG.MATCH.ROUND_DURATION,
    p1RoundsWon: 0,
    p2RoundsWon: 0,
    winner: null,
    announcement: 'ROUND 1',
  });

  const [reconnectNotice, setReconnectNotice] = useState<string | null>(null);

  useEffect(() => {
    if (gameMode !== 'ONLINE') return;

    const unsubReconnecting = multiplayerClient.onOpponentReconnecting((info) => {
      setReconnectNotice(`Opponent disconnected! Waiting for reconnection (${info.timeoutSeconds}s)...`);
    });

    const unsubReconnected = multiplayerClient.onOpponentReconnected((info) => {
      setReconnectNotice(null);
    });

    return () => {
      unsubReconnecting();
      unsubReconnected();
    };
  }, [gameMode]);

  useEffect(() => {
    if (!containerRef.current) return;

    // Instantiate Arena X 2D Game Engine
    const engine = new GameEngine(
      containerRef.current,
      settings,
      gameMode,
      {
        onGameStateChange: (newState) => {
          setGameState(newState);
        },
        onMatchStateUpdate: (newMatchState) => {
          setMatchState({ ...newMatchState });
        },
        onFightersUpdate: (p1, p2) => {
          setP1Stats(p1.getStats());
          setP2Stats(p2.getStats());
        },
        onFpsUpdate: (currentFps) => {
          setFps(currentFps);
        },
      },
      fighterP1,
      fighterP2
    );

    engineRef.current = engine;
    (window as any).__ARENA_X_ENGINE__ = engine;
    if (stageId) {
      engine.setStage(stageId);
    }

    return () => {
      engine.dispose();
      engineRef.current = null;
      delete (window as any).__ARENA_X_ENGINE__;
    };
  }, [gameMode, settings, stageId]);

  const handlePause = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.pauseGame();
    }
  }, []);

  const handleResume = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.resumeGame();
    }
  }, []);

  const handleRestart = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.restartMatch();
    }
  }, []);

  const handleTouchInput = useCallback((player: PlayerId, action: keyof FighterInputs, active: boolean) => {
    if (engineRef.current) {
      engineRef.current.inputManager.setTouchInput(player, action, active);
    }
  }, []);

  return (
    <div className="arena-page-root">
      {/* 3D Canvas Mounting Container */}
      <div ref={containerRef} className="three-canvas-container" />

      {/* Online Netplay Status Banner */}
      {gameMode === 'ONLINE' && (
        <div
          style={{
            position: 'absolute',
            top: '8px',
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '4px 14px',
            background: 'rgba(6, 10, 18, 0.85)',
            border: '1px solid rgba(0, 229, 255, 0.3)',
            borderRadius: '4px',
            fontSize: '11px',
            fontWeight: 800,
            letterSpacing: '1px',
            color: '#00e5ff',
            zIndex: 100,
            pointerEvents: 'none',
          }}
        >
          <span>NETPLAY: <strong>{multiplayerClient.roomCode || 'LIVE'}</strong></span>
          <span style={{ color: '#8fa0b5' }}>•</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#00e676' }}>
            <Wifi size={12} />
            {multiplayerClient.currentPing} ms
          </span>
          <span style={{ color: '#8fa0b5' }}>•</span>
          <span>YOU: {multiplayerClient.mySlot || 'P1'}</span>
        </div>
      )}

      {/* Reconnection Overlay */}
      {reconnectNotice && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '16px',
            zIndex: 200,
            color: '#ffffff',
          }}
        >
          <AlertTriangle size={48} color="#ffb300" />
          <h2 style={{ fontSize: '24px', fontWeight: 900, letterSpacing: '2px', margin: 0 }}>
            CONNECTION INTERRUPTION
          </h2>
          <p style={{ color: '#ffb300', fontSize: '15px', fontWeight: 700, margin: 0 }}>
            {reconnectNotice}
          </p>
          <span style={{ fontSize: '12px', color: '#8fa0b5' }}>
            Match will be awarded by forfeit if player does not return.
          </span>
        </div>
      )}

      {/* Interactive Fighting Game HUD */}
      <FightHUD
        p1Stats={p1Stats}
        p2Stats={p2Stats}
        matchState={matchState}
        gameState={gameState}
        fps={fps}
        onPause={handlePause}
        onResume={handleResume}
        onRestart={handleRestart}
        onMainMenu={onReturnToMenu}
        onTouchInput={handleTouchInput}
      />
    </div>
  );
};
