// src/App.tsx
import React, { useState, useEffect } from 'react';
import { MainMenu } from './pages/MainMenu';
import { GameArenaPage } from './pages/GameArenaPage';
import { OnlineMultiplayerMenu } from './components/OnlineMultiplayerMenu';
import { TournamentLobby } from './components/TournamentLobby';
import { OrientationWarning } from './components/OrientationWarning';
import { GameMode, GameSettings } from './types';
import { StageId, STAGES } from './game/stages/StageConfig';
import { StageSelectModal } from './components/StageSelectModal';
import { FighterId, ROSTER_FIGHTERS } from './game/characters/RosterConfig';
import { CharacterSelectModal } from './components/CharacterSelectModal';
import { GAME_CONFIG } from './config/gameConfig';
import './styles/online.css';
import './styles/stages.css';
import './styles/characters.css';
import './styles/tournament.css';

export const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<'MENU' | 'ONLINE' | 'TOURNAMENT' | 'ARENA'>('MENU');
  const [gameMode, setGameMode] = useState<GameMode>('VERSUS');
  const [selectedStage, setSelectedStage] = useState<StageId>('ANCIENT_TEMPLE');
  const [selectedP1, setSelectedP1] = useState<FighterId>('KAI');
  const [selectedP2, setSelectedP2] = useState<FighterId>('SHADOW');
  const [showStageSelect, setShowStageSelect] = useState<boolean>(false);
  const [showCharSelect, setShowCharSelect] = useState<boolean>(false);
  const [pendingMode, setPendingMode] = useState<GameMode>('VERSUS');
  const [settings, setSettings] = useState<GameSettings>(GAME_CONFIG.DEFAULT_SETTINGS);
  const [initialRoomCode, setInitialRoomCode] = useState<string | null>(null);
  const [initialTournamentCode, setInitialTournamentCode] = useState<string | null>(null);

  // Check URL query param ?room=AX-XXXX on mount
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const roomParam = params.get('room');
      const tournamentParam = params.get('tournament');
      if (roomParam) {
        setInitialRoomCode(roomParam.toUpperCase());
        setCurrentPage('ONLINE');
      }
      if (tournamentParam) {
        setInitialTournamentCode(tournamentParam.toUpperCase());
        setCurrentPage('TOURNAMENT');
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

  const handleOpenTournament = () => setCurrentPage('TOURNAMENT');

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
          onOpenCharacterSelect={() => setShowCharSelect(true)}
          currentStageName={STAGES[selectedStage]?.name}
          currentP1Name={ROSTER_FIGHTERS[selectedP1]?.name}
          currentP2Name={ROSTER_FIGHTERS[selectedP2]?.name}
          onOpenTournament={handleOpenTournament}
        />
      )}

      {currentPage === 'ONLINE' && (
        <OnlineMultiplayerMenu
          onBackToMainMenu={handleReturnToMenu}
          onLaunchOnlineFight={handleLaunchOnlineFight}
          initialRoomCode={initialRoomCode}
        />
      )}

      {currentPage === 'TOURNAMENT' && (
        <TournamentLobby onBack={handleReturnToMenu} initialCode={initialTournamentCode} />
      )}

      {currentPage === 'ARENA' && (
        <GameArenaPage
          gameMode={gameMode}
          settings={settings}
          stageId={selectedStage}
          fighterP1={selectedP1}
          fighterP2={selectedP2}
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

      {/* 16-Fighter Character Selection Modal */}
      <CharacterSelectModal
        isOpen={showCharSelect}
        selectedP1={selectedP1}
        selectedP2={selectedP2}
        onSelectP1={(id) => setSelectedP1(id)}
        onSelectP2={(id) => setSelectedP2(id)}
        onConfirm={() => setShowCharSelect(false)}
        onClose={() => setShowCharSelect(false)}
      />
    </div>
  );
};

export default App;
