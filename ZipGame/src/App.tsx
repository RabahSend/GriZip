import { useState, useEffect } from 'react'
import { GameGrid } from './components/GameGrid'
import { generateGrid, adjustDifficultyByDay } from './utils/gridGenerator'
import { Cell, Grid } from './types/gameTypes'
import './App.css'

function App() {
  const [gridSize, setGridSize] = useState(6);
  const [cells, setCells] = useState<Cell[]>([]);
  
  const generateNewGame = () => {
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

  // Générer une nouvelle grille au démarrage
  useEffect(() => {
    generateNewGame();
  }, [gridSize]);

  const handleCellClick = (cell: Cell) => {
    console.log('Cell clicked:', cell);
  };

  const handleNewGame = () => {
    generateNewGame();
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
        onCellClick={handleCellClick}
        onNewGame={handleNewGame}
        onUndo={handleUndo}
        onSizeChange={handleSizeChange}
      />
    </div>
  );
}

export default App
