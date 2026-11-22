// src/pages/GameArenaPage.tsx
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GameEngine } from '../game/core/GameEngine';
import { FightHUD } from '../game/ui/FightHUD';
import { 
  FighterStats, 
  GameMode, 
  GameSettings, 
  GameState, 
  MatchState, 
  PlayerId, 
  FighterInputs 
} from '../types';
import { GAME_CONFIG } from '../config/gameConfig';

interface GameArenaPageProps {
  gameMode: GameMode;
  settings: GameSettings;
  onReturnToMenu: () => void;
}

export const GameArenaPage: React.FC<GameArenaPageProps> = ({
  gameMode,
  settings,
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

  useEffect(() => {
    if (!containerRef.current) return;

    // Instantiate Arena X 3D Game Engine
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
      }
    );

    engineRef.current = engine;
    (window as any).__ARENA_X_ENGINE__ = engine;

    return () => {
      engine.dispose();
      engineRef.current = null;
      delete (window as any).__ARENA_X_ENGINE__;
    };
  }, [gameMode, settings]);

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
