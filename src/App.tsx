// src/App.tsx
import React, { useState, useEffect } from 'react';
import { MainMenu } from './pages/MainMenu';
import { GameArenaPage } from './pages/GameArenaPage';
import { OnlineMultiplayerMenu } from './components/OnlineMultiplayerMenu';
import { OrientationWarning } from './components/OrientationWarning';
import { GameMode, GameSettings } from './types';
import { GAME_CONFIG } from './config/gameConfig';
import './styles/online.css';

export const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<'MENU' | 'ONLINE' | 'ARENA'>('MENU');
  const [gameMode, setGameMode] = useState<GameMode>('VERSUS');
  const [settings, setSettings] = useState<GameSettings>(GAME_CONFIG.DEFAULT_SETTINGS);
  const [initialRoomCode, setInitialRoomCode] = useState<string | null>(null);

  // Check URL query param ?room=AX-XXXX on mount
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const roomParam = params.get('room');
      if (roomParam) {
        setInitialRoomCode(roomParam.toUpperCase());
        setCurrentPage('ONLINE');
      }
    } catch (e) {}
  }, []);

  const handleStartGame = (mode: GameMode) => {
    if (mode === 'ONLINE') {
      setCurrentPage('ONLINE');
    } else {
      setGameMode(mode);
      setCurrentPage('ARENA');
    }
  };

  const handleReturnToMenu = () => {
    setCurrentPage('MENU');
  };

  const handleLaunchOnlineFight = () => {
    setGameMode('ONLINE');
    setCurrentPage('ARENA');
  };

  return (
    <div className="arena-x-app">
      {/* Mobile Landscape orientation detection & alert */}
      <OrientationWarning />

      {/* Main Pages */}
      {currentPage === 'MENU' && (
        <MainMenu
          onStartGame={handleStartGame}
          settings={settings}
          onUpdateSettings={setSettings}
        />
      )}

      {currentPage === 'ONLINE' && (
        <OnlineMultiplayerMenu
          onBackToMainMenu={handleReturnToMenu}
          onLaunchOnlineFight={handleLaunchOnlineFight}
          initialRoomCode={initialRoomCode}
        />
      )}

      {currentPage === 'ARENA' && (
        <GameArenaPage
          gameMode={gameMode}
          settings={settings}
          onReturnToMenu={handleReturnToMenu}
        />
      )}
    </div>
  );
};

export default App;
