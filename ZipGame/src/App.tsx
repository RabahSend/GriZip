import { useState, useEffect } from 'react'
import { GameGrid } from './components/GameGrid'
import { generateGrid, adjustDifficultyByDay } from './utils/gridGenerator'
import { Cell, Grid } from './types/gameTypes'
import './App.css'

function App() {
  const [gridSize, setGridSize] = useState(6);
  const [cells, setCells] = useState<Cell[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [resetPath, setResetPath] = useState(false);
  
  const startDate = new Date(2024, 2, 2); // 2 mars 2024
  const puzzleNumber = Math.floor((selectedDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

  const generatePuzzle = (date: Date) => {
    const difficulty = adjustDifficultyByDay();
    const grid: Grid = generateGrid(gridSize, gridSize, 8, difficulty);
    
    // Convertir la grille 2D en liste de cellules avec des valeurs
    const flatCells: Cell[] = [];
    grid.forEach((row) => {
      row.forEach((cell) => {
        if (cell.value !== null) {
          flatCells.push(cell);
        }
      });
    });
    
    setCells(flatCells);
  };

  // Générer une nouvelle grille quand la date change
  useEffect(() => {
    generatePuzzle(selectedDate);
  }, [selectedDate, gridSize]);

  const handleCellClick = (cell: Cell) => {
    console.log('Cell clicked:', cell);
  };

  const handleSelectDay = (date: Date) => {
    setSelectedDate(date);
    setResetPath(true);
    // Réinitialiser resetPath après un court délai
    setTimeout(() => setResetPath(false), 100);
  };

  const handleUndo = () => {
    console.log('Undo requested');
  };

  const handleSizeChange = (newSize: number) => {
    setGridSize(newSize);
  };

  return (
    <div className="app">
      <GameGrid
        size={gridSize}
        cells={cells}
        puzzleNumber={puzzleNumber}
        onCellClick={handleCellClick}
        onSelectDay={handleSelectDay}
        onUndo={handleUndo}
        onSizeChange={handleSizeChange}
        resetPath={resetPath}
      />
    </div>
  );
}

export default App
