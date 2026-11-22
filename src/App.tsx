// src/App.tsx
import React, { useState, useEffect } from 'react';
import { MainMenu } from './pages/MainMenu';
import { GameArenaPage } from './pages/GameArenaPage';
import { OnlineMultiplayerMenu } from './components/OnlineMultiplayerMenu';
import { OrientationWarning } from './components/OrientationWarning';
import { GameMode, GameSettings } from './types';
import { StageId, STAGES } from './game/stages/StageConfig';
import { StageSelectModal } from './components/StageSelectModal';
import { GAME_CONFIG } from './config/gameConfig';
import './styles/online.css';
import './styles/stages.css';

export const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<'MENU' | 'ONLINE' | 'ARENA'>('MENU');
  const [gameMode, setGameMode] = useState<GameMode>('VERSUS');
  const [selectedStage, setSelectedStage] = useState<StageId>('ANCIENT_TEMPLE');
  const [showStageSelect, setShowStageSelect] = useState<boolean>(false);
  const [pendingMode, setPendingMode] = useState<GameMode>('VERSUS');
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

  const handleOpenStageSelect = () => {
    setShowStageSelect(true);
  };

  const handleStageConfirmed = (stageId: StageId) => {
    setSelectedStage(stageId);
    setShowStageSelect(false);
  };

  const handleReturnToMenu = () => {
    setCurrentPage('MENU');
  };

  const handleLaunchOnlineFight = (stageId?: string) => {
    if (stageId) {
      setSelectedStage(stageId as StageId);
    }
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
          onOpenStageSelect={handleOpenStageSelect}
          currentStageName={STAGES[selectedStage]?.name}
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
          stageId={selectedStage}
          onReturnToMenu={handleReturnToMenu}
        />
      )}

      {/* Stage Selection Modal */}
      <StageSelectModal
        isOpen={showStageSelect}
        currentStageId={selectedStage}
        onSelectStage={handleStageConfirmed}
        onClose={() => setShowStageSelect(false)}
        isHost={true}
      />
    </div>
  );
};

export default App;
