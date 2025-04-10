import React, { useState, useEffect } from 'react';
import './GameGrid.css';
import { Cell, Grid, Path, PuzzleStatus } from '../types/gameTypes';
import { PuzzleCalendar } from './PuzzleCalendar';
import { findValidPath, generateGrid } from '../utils/gridGenerator';

interface GameGridProps {
  size: number;
  numberCount: number;
  selectedDate: Date;
  onCellClick?: (cell: Cell) => void;
  onSelectDay: (date: Date) => void;
  onUndo?: () => void;
  onSizeChange?: (size: number) => void;
  resetPath?: boolean;
  onPuzzleComplete: (date: Date, usedHelp: boolean) => void;
  puzzleStatuses: Record<string, PuzzleStatus>;
}

const formatTime = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
};

export const GameGrid: React.FC<GameGridProps> = ({ 
  size, 
  numberCount,
  selectedDate,
  onCellClick,
  onSelectDay,
  onUndo,
  onSizeChange,
  resetPath,
  onPuzzleComplete,
  puzzleStatuses
}) => {
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const [isTimerActive, setIsTimerActive] = useState<boolean>(false);
  const [path, setPath] = useState<Path>([]);
  const [currentNumber, setCurrentNumber] = useState<number>(1);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [startCell, setStartCell] = useState<Cell | null>(null);
  const [showSuccess, setShowSuccess] = useState<boolean>(false);
  const [showingSolution, setShowingSolution] = useState<boolean>(false);
  const [grid, setGrid] = useState<Grid>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    let intervalId: number;

    if (isTimerActive) {
      intervalId = setInterval(() => {
        setElapsedTime(time => time + 1);
      }, 1000);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [isTimerActive]);

  useEffect(() => {
    if (resetPath) {
      setPath([]);
      setCurrentNumber(1);
      setIsTimerActive(false);
      setElapsedTime(0);
      setShowSuccess(false);
      setShowingSolution(false);
    }
  }, [resetPath]);

  useEffect(() => {
    setIsLoading(true);
    setShowingSolution(false);
    
    // Créer une nouvelle instance du Worker
    const worker = new Worker(new URL('../workers/gridWorker.ts', import.meta.url), { type: 'module' });
    
    // Gérer les messages du Worker
    worker.onmessage = (e) => {
      const { type, grid, error } = e.data;
      
      if (type === 'success') {
        setGrid(grid);
        setPath([]);
        setCurrentNumber(1);
        setIsTimerActive(false);
        setElapsedTime(0);
        setShowSuccess(false);
        setShowingSolution(false);
        setIsLoading(false);
      } else {
        console.error('Error generating grid:', error);
        setIsLoading(false);
      }
    };
    
    // Envoyer les paramètres au Worker
    worker.postMessage({
      size,
      numberCount,
      difficulty: 'MEDIUM',
      seed: selectedDate.getTime()
    });
    
    // Nettoyer le Worker quand le composant est démonté
    return () => {
      worker.terminate();
    };
  }, [size, numberCount, selectedDate]);

  const checkPath = (pathToCheck: Path) => {
    // Récupérer tous les nombres dans l'ordre
    const numbers = grid
      .flatMap(row => row.filter(cell => cell.value !== null))
      .sort((a, b) => (a.value || 0) - (b.value || 0));

    console.log('Numbers to check:', numbers);
    console.log('Current path:', pathToCheck);

    // Vérifier que le chemin passe par tous les nombres dans l'ordre
    let lastIndex = -1;
    for (const number of numbers) {
      // Trouver l'index de ce nombre dans le chemin
      const pathIndex = pathToCheck.findIndex(p => p.row === number.row && p.col === number.col);
      console.log(`Checking number ${number.value} at (${number.row},${number.col}), found at path index: ${pathIndex}`);
      
      // Si le nombre n'est pas dans le chemin ou n'est pas dans le bon ordre
      if (pathIndex === -1 || pathIndex < lastIndex) {
        console.log(`Invalid path: number ${number.value} is not in correct order`);
        return false;
      }
      
      lastIndex = pathIndex;
    }

    // Vérifier que le chemin passe par toutes les cases de la grille
    const totalCells = grid.length * grid[0].length;
    if (pathToCheck.length < totalCells) {
      console.log(`Invalid path: does not cover all cells (${pathToCheck.length} vs ${totalCells} required)`);
      return false;
    }

    console.log('Path is valid!');
    onPuzzleComplete(selectedDate, false);
    return true;
  };

  const getPathDirections = (row: number, col: number): string[] => {
    const directions: string[] = [];
    const cellIndex = path.findIndex(p => p.row === row && p.col === col);
    
    if (cellIndex === -1) return directions;
    
    // Pour la cellule précédente
    if (cellIndex > 0) {
      const prev = path[cellIndex - 1];
      if (prev.row < row) directions.push('from-top');
      if (prev.row > row) directions.push('from-bottom');
      if (prev.col < col) directions.push('from-left');
      if (prev.col > col) directions.push('from-right');
    }
    
    // Pour la cellule suivante
    if (cellIndex < path.length - 1) {
      const next = path[cellIndex + 1];
      if (next.row < row) directions.push('to-top');
      if (next.row > row) directions.push('to-bottom');
      if (next.col < col) directions.push('to-left');
      if (next.col > col) directions.push('to-right');
    }
    
    return directions;
  };

  const isInPath = (row: number, col: number): boolean => {
    return path.some(coord => coord.row === row && coord.col === col);
  };

  const handleMouseDown = (row: number, col: number) => {
    const clickedCell = grid[row][col];
    
    // Si on clique sur le premier numéro (1)
    if (clickedCell.value === 1 && path.length === 0) {
      setPath([{ row, col }]);
      setIsDragging(true);
      if (!isTimerActive) {
        setIsTimerActive(true);
      }
      return;
    }

    // Si on clique sur la case précédente du chemin
    if (path.length > 1 && row === path[path.length - 2].row && col === path[path.length - 2].col) {
      setPath(prev => prev.slice(0, -1));
      return;
    }

    // Si on clique sur une case adjacente au dernier point du chemin
    if (path.length > 0) {
      const lastCell = path[path.length - 1];
      const isAdjacent = Math.abs(row - lastCell.row) + Math.abs(col - lastCell.col) === 1;
      
      if (isAdjacent && !isInPath(row, col)) {
        const newPath = [...path, { row, col }];
        setPath(newPath);
        setIsDragging(true);

        // Si c'est un nombre, vérifier si c'est le dernier
        if (clickedCell.value) {
          const maxNumber = Math.max(...grid.flatMap(row => row.filter(cell => cell.value !== null).map(cell => cell.value || 0)));
          if (clickedCell.value === maxNumber) {
            console.log('Checking final path...');
            const isValid = checkPath(newPath);
            console.log('Path valid?', isValid);
            if (isValid) {
              setIsTimerActive(false);
              setShowSuccess(true);
            }
          }
        }
      }
    }
  };

  // Nouvelle fonction pour trouver les cases intermédiaires
  const getIntermediateCells = (start: { row: number; col: number }, end: { row: number; col: number }): { row: number; col: number }[] => {
    const cells: { row: number; col: number }[] = [];
    const rowDiff = end.row - start.row;
    const colDiff = end.col - start.col;

    // Si on est sur la même ligne
    if (rowDiff === 0) {
      const step = colDiff > 0 ? 1 : -1;
      for (let col = start.col + step; col !== end.col + step; col += step) {
        cells.push({ row: start.row, col });
      }
    }
    // Si on est sur la même colonne
    else if (colDiff === 0) {
      const step = rowDiff > 0 ? 1 : -1;
      for (let row = start.row + step; row !== end.row + step; row += step) {
        cells.push({ row, col: start.col });
      }
    }
    return cells;
  };

  const handleMouseEnter = (row: number, col: number, e: React.MouseEvent | { buttons: number }) => {
    if (!isDragging || !('buttons' in e) || !e.buttons) return;

    // Si on revient sur la case précédente
    if (path.length > 1 && row === path[path.length - 2].row && col === path[path.length - 2].col) {
      setPath(prev => prev.slice(0, -1));
      return;
    }

    const lastCell = path[path.length - 1];
    
    // Si on est déjà sur cette case, ne rien faire
    if (lastCell.row === row && lastCell.col === col) return;

    // Si la case est déjà dans le chemin, ne rien faire
    if (isInPath(row, col)) return;
    
    // Vérifier si le mouvement est adjacent
    const isAdjacent = Math.abs(row - lastCell.row) + Math.abs(col - lastCell.col) === 1;
    
    // Si c'est un mouvement adjacent, l'ajouter directement
    if (isAdjacent) {
      const newPath = [...path, { row, col }];
      
      // Si c'est un nombre, vérifier si c'est le dernier
      if (grid[row][col].value) {
        const maxNumber = Math.max(...grid.flatMap(row => row.filter(cell => cell.value !== null).map(cell => cell.value || 0)));
        if (grid[row][col].value === maxNumber) {
          console.log('Checking final path...');
          const isValid = checkPath(newPath);
          console.log('Path valid?', isValid);
          if (isValid) {
            setPath(newPath);
            setIsTimerActive(false);
            setShowSuccess(true);
            return;
          }
        }
      }
      
      setPath(newPath);
      return;
    }
    
    // Si ce n'est pas adjacent, vérifier le mouvement en ligne droite
    const intermediateCells = getIntermediateCells(lastCell, { row, col });
    const isValidPath = intermediateCells.every(cell => !isInPath(cell.row, cell.col));
    const isSameRow = row === lastCell.row;
    const isSameCol = col === lastCell.col;
    
    if ((isSameRow || isSameCol) && isValidPath && intermediateCells.length > 0) {
      const newPath = [...path, ...intermediateCells, { row, col }];

      // Si c'est un nombre, vérifier si c'est le dernier
      if (grid[row][col].value) {
        const maxNumber = Math.max(...grid.flatMap(row => row.filter(cell => cell.value !== null).map(cell => cell.value || 0)));
        if (grid[row][col].value === maxNumber) {
          console.log('Checking final path...');
          const isValid = checkPath(newPath);
          console.log('Path valid?', isValid);
          if (isValid) {
            setPath(newPath);
            setIsTimerActive(false);
            setShowSuccess(true);
            return;
          }
        }
      }
      
      setPath(newPath);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('touchend', handleMouseUp);

    return () => {
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, [isDragging]);

  const handleShowSolution = () => {
    // Créer une grille correctement initialisée
    const newGrid: Grid = Array(size).fill(null).map((_, rowIndex) => 
      Array(size).fill(null).map((_, colIndex) => ({
        row: rowIndex,
        col: colIndex,
        value: null,
        isPartOfPath: false,
        isSelected: false
      }))
    );

    // Remplir la grille avec les valeurs des cellules
    grid.forEach((row, rowIndex) => 
      row.forEach((cell, colIndex) => {
        newGrid[rowIndex][colIndex].value = cell.value;
      })
    );

    // Trouver le chemin valide
    const solution = findValidPath(newGrid, true);
    
    if (solution && Array.isArray(solution)) {
      setPath(solution);
      setShowingSolution(true);
      setCurrentNumber(grid.length); // Marquer comme complet
      
      // Vérifier si le puzzle a déjà été complété sans aide
      const dateString = selectedDate.toISOString().split('T')[0];
      const currentStatus = puzzleStatuses[dateString];
      if (currentStatus !== 'COMPLETED') {
        onPuzzleComplete(selectedDate, true); // Marquer comme résolu avec aide seulement si pas déjà complété
      }
      
      setIsTimerActive(false); // Arrêter le timer
    } else {
      console.error("Impossible de trouver une solution valide");
    }
  };

  const handleResetSolution = () => {
    setPath([]);
    setShowingSolution(false);
    setCurrentNumber(1);
  };

  return (
    <div className="game-container">
      {/* Header */}
      <div className="game-header">
        <h1>Puzzle du {selectedDate.toLocaleDateString()}</h1>
        <div className="timer">{formatTime(elapsedTime)}</div>
      </div>

      {/* Grid */}
      <div 
        className="game-grid"
        style={{
          gridTemplateColumns: `repeat(${size}, 1fr)`,
        }}
      >
        {isLoading ? (
          <div className="loading-container">
            <div className="spinner" />
          </div>
        ) : (
          grid.flatMap((row, rowIndex) => 
            row.map((cell, colIndex) => {
              const pathDirections = getPathDirections(rowIndex, colIndex);

              return (
                <div
                  key={`${rowIndex}-${colIndex}`}
                  className={`grid-cell ${isInPath(rowIndex, colIndex) ? 'in-path' : ''} ${cell.value ? `number-${cell.value}` : ''} ${pathDirections.join(' ')}`}
                  onMouseDown={() => handleMouseDown(rowIndex, colIndex)}
                  onMouseEnter={(e) => handleMouseEnter(rowIndex, colIndex, e)}
                  onTouchStart={(e) => {
                    e.preventDefault();
                    handleMouseDown(rowIndex, colIndex);
                  }}
                  onTouchMove={(e) => {
                    e.preventDefault();
                    const touch = e.touches[0];
                    const element = document.elementFromPoint(touch.clientX, touch.clientY);
                    if (element?.classList.contains('grid-cell')) {
                      const cellElement = element;
                      const index = Array.from(cellElement.parentElement?.children || []).indexOf(cellElement);
                      const row = Math.floor(index / size);
                      const col = index % size;
                      handleMouseEnter(row, col, new MouseEvent('mouseenter', { buttons: 1 }));
                    }
                  }}
                >
                  {cell.value && (
                    <div className={`cell-number ${isInPath(rowIndex, colIndex) ? 'visited' : ''}`}>
                      {cell.value}
                    </div>
                  )}
                </div>
              );
            })
          )
        )}
      </div>

      {/* Controls */}
      <div className="controls">
        <div className="controls-row">
          <div className="grid-size">
            <label htmlFor="gridSize">Size:</label>
            <select
              id="gridSize"
              defaultValue={`${size}`}
              onChange={(e) => {
                const newSize = parseInt(e.target.value);
                onSizeChange?.(newSize);
              }}
            >
              <option value="6">6x6</option>
            </select>
          </div>
          <button 
            className="button button-secondary"
            onClick={() => {
              setPath([]);
              setCurrentNumber(1);
              onUndo?.();
            }}
          >
            Reset
          </button>
          {!showingSolution ? (
            <button 
              className="button button-primary"
              onClick={handleShowSolution}
            >
              Show Solution
            </button>
          ) : (
            <button 
              className="button button-secondary"
              onClick={handleResetSolution}
            >
              Hide Solution
            </button>
          )}
        </div>
      </div>

      {/* Calendar */}
      <PuzzleCalendar 
        onSelectDay={onSelectDay} 
        selectedDate={selectedDate}
        puzzleStatuses={puzzleStatuses}
      />

      {/* Success Popup */}
      {showSuccess && (
        <div className="success-popup">
          <div className="success-content">
            <h2>Congratulations!</h2>
            <p>You completed the puzzle of {selectedDate.toLocaleDateString()} in {formatTime(elapsedTime)}!</p>
            <button 
              className="button button-primary"
              onClick={() => setShowSuccess(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};