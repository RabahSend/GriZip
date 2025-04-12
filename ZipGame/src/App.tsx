import { useState, useEffect } from 'react'
import { GameGrid } from './components/GameGrid'
import { adjustDifficultyByDay } from './utils/gridGenerator'
import type { PuzzleStatus } from './types/gameTypes'
import './App.css'

// Clés pour le stockage local
const LAST_SELECTED_DATE_KEY = 'zipGameLastSelectedDate';
const PUZZLE_STATUSES_KEY = 'zipGamePuzzleStatuses';
const GRID_CACHE_PREFIX = 'zipGame_cachedGrid_';

function App() {
  const [gridSize, setGridSize] = useState(6);
  const [selectedDate, setSelectedDate] = useState(() => {
    // Récupérer la dernière date sélectionnée du localStorage
    const savedDate = localStorage.getItem(LAST_SELECTED_DATE_KEY);
    if (savedDate) {
      const date = new Date(savedDate);
      // Vérifier si la date est valide et pas dans le futur
      if (!isNaN(date.getTime()) && date <= new Date()) {
        return date;
      }
    }
    // Si pas de date sauvegardée ou invalide, utiliser la date du jour
    return new Date();
  });

  const [puzzleStatuses, setPuzzleStatuses] = useState<Record<string, PuzzleStatus>>(() => {
    const savedStatuses = localStorage.getItem(PUZZLE_STATUSES_KEY);
    return savedStatuses ? JSON.parse(savedStatuses) : {};
  });

  const [resetPath, setResetPath] = useState(false);
  
  // Sauvegarder la date sélectionnée dans le localStorage
  useEffect(() => {
    localStorage.setItem(LAST_SELECTED_DATE_KEY, selectedDate.toISOString());
  }, [selectedDate]);

  // Sauvegarder les statuts des puzzles dans le localStorage
  useEffect(() => {
    localStorage.setItem(PUZZLE_STATUSES_KEY, JSON.stringify(puzzleStatuses));
  }, [puzzleStatuses]);
  
  // Nettoyer les anciennes grilles en cache (une fois par session)
  useEffect(() => {
    const cleanupCachedGrids = () => {
      const maxAgeInDays = 30; // Conserver les grilles pour 30 jours maximum
      const currentTime = Date.now();
      const maxAgeInMs = maxAgeInDays * 24 * 60 * 60 * 1000;
      
      // Parcourir tous les éléments du localStorage
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(GRID_CACHE_PREFIX)) {
          try {
            // Extraire la date de la clé
            const dateMatch = key.match(/(\d{4})-(\d{1,2})-(\d{1,2})/);
            if (dateMatch) {
              const [, year, month, day] = dateMatch;
              const gridDate = new Date(parseInt(year), parseInt(month), parseInt(day));
              
              // Supprimer les grilles plus anciennes que maxAgeInDays
              if (currentTime - gridDate.getTime() > maxAgeInMs) {
                localStorage.removeItem(key);
              }
            }
          } catch (e) {
            console.warn("Erreur lors du nettoyage du cache:", e);
          }
        }
      }
    };
    
    cleanupCachedGrids();
  }, []);
  
  const handleSelectDay = (date: Date) => {
    setSelectedDate(date);
    setResetPath(true);
    // Réinitialiser resetPath après un court délai
    setTimeout(() => setResetPath(false), 100);
  };

  const handlePuzzleComplete = (date: Date, usedHelp: boolean) => {
    const dateString = date.toISOString().split('T')[0];
    setPuzzleStatuses(prev => ({
      ...prev,
      [dateString]: usedHelp ? 'SOLVED_WITH_HELP' : 'COMPLETED'
    }));
  };

  const handleUndo = () => {
    console.log('Undo requested');
  };

  const handleSizeChange = (newSize: number) => {
    setGridSize(newSize);
  };

  // Calculer le nombre de valeurs en fonction de la taille de la grille
  const getNumberCount = (size: number) => {
    switch (size) {
      case 3: return 4;
      case 4: return 6;
      case 5: return 8;
      case 6: return 10;
      default: return Math.floor(size * 1.5);
    }
  };

  return (
    <div className="app">
      <GameGrid
        size={gridSize}
        numberCount={getNumberCount(gridSize)}
        selectedDate={selectedDate}
        onSelectDay={handleSelectDay}
        onUndo={handleUndo}
        onSizeChange={handleSizeChange}
        resetPath={resetPath}
        onPuzzleComplete={handlePuzzleComplete}
        puzzleStatuses={puzzleStatuses}
      />
    </div>
  );
}

export default App
