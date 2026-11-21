// src/App.tsx
import React, { useState } from 'react';
import { MainMenu } from './pages/MainMenu';
import { GameArenaPage } from './pages/GameArenaPage';
import { OrientationWarning } from './components/OrientationWarning';
import { GameMode, GameSettings } from './types';
import { GAME_CONFIG } from './config/gameConfig';

export const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<'MENU' | 'ARENA'>('MENU');
  const [gameMode, setGameMode] = useState<GameMode>('VERSUS');
  const [settings, setSettings] = useState<GameSettings>(GAME_CONFIG.DEFAULT_SETTINGS);

  const handleStartGame = (mode: GameMode) => {
    setGameMode(mode);
    setCurrentPage('ARENA');
  };

  const handleReturnToMenu = () => {
    setCurrentPage('MENU');
  };

  return (
    <div className="arena-x-app">
      {/* Mobile Landscape orientation detection & alert */}
      <OrientationWarning />

      {/* Main Pages */}
      {currentPage === 'MENU' ? (
        <MainMenu
          onStartGame={handleStartGame}
          settings={settings}
          onUpdateSettings={setSettings}
        />
      ) : (
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
