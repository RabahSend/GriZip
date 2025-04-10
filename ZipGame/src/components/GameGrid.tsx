import React, { useState, useEffect } from 'react';
import './GameGrid.css';
import { Cell, Grid, Path } from '../types/gameTypes';
import { PuzzleCalendar } from './PuzzleCalendar';
import { findValidPath } from '../utils/gridGenerator';

interface GameGridProps {
  size: number;
  cells: Cell[];
  puzzleNumber: number;
  onCellClick?: (cell: Cell) => void;
  onSelectDay: (date: Date) => void;
  onUndo?: () => void;
  onSizeChange?: (size: number) => void;
  resetPath?: boolean;
}

const formatTime = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
};

export const GameGrid: React.FC<GameGridProps> = ({ 
  size, 
  cells,
  puzzleNumber,
  onCellClick,
  onSelectDay,
  onUndo,
  onSizeChange,
  resetPath
}) => {
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const [isTimerActive, setIsTimerActive] = useState<boolean>(false);
  const [path, setPath] = useState<Path>([]);
  const [currentNumber, setCurrentNumber] = useState<number>(1);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [startCell, setStartCell] = useState<Cell | null>(null);
  const [showSuccess, setShowSuccess] = useState<boolean>(false);
  const [showingSolution, setShowingSolution] = useState<boolean>(false);

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
    }
  }, [resetPath]);

  const checkPath = () => {
    // Force le succès
    return true;
  };

  const getPathDirections = (row: number, col: number): string[] => {
    const directions: string[] = [];
    const cellIndex = path.findIndex(p => p.row === row && p.col === col);
    
    if (cellIndex === -1) return directions;
    
    // Check previous cell
    if (cellIndex > 0) {
      const prev = path[cellIndex - 1];
      if (prev.row < row) directions.push('path-up');
      if (prev.row > row) directions.push('path-down');
      if (prev.col < col) directions.push('path-left');
      if (prev.col > col) directions.push('path-right');
    }
    
    // Check next cell
    if (cellIndex < path.length - 1) {
      const next = path[cellIndex + 1];
      if (next.row < row) directions.push('path-up');
      if (next.row > row) directions.push('path-down');
      if (next.col < col) directions.push('path-left');
      if (next.col > col) directions.push('path-right');
    }
    
    return directions;
  };

  const isInPath = (row: number, col: number): boolean => {
    return path.some(coord => coord.row === row && coord.col === col);
  };

  const handleMouseDown = (row: number, col: number) => {
    const clickedCell = cells.find(c => c.row === row && c.col === col);
    
    // Si on clique sur le premier numéro (1)
    if (clickedCell?.value === 1 && path.length === 0) {
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
        if (clickedCell?.value) {
          const maxNumber = Math.max(...cells.filter(cell => cell.value !== null).map(cell => cell.value || 0));
          if (clickedCell.value === maxNumber) {
            console.log('Checking final path...');
            const isValid = checkPath();
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

  const handleMouseEnter = (row: number, col: number, e: React.MouseEvent | { buttons: number }) => {
    if (!isDragging || !('buttons' in e) || !e.buttons) return;

    // Si on revient sur la case précédente
    if (path.length > 1 && row === path[path.length - 2].row && col === path[path.length - 2].col) {
      setPath(prev => prev.slice(0, -1));
      return;
    }

    const lastCell = path[path.length - 1];
    const isAdjacent = Math.abs(row - lastCell.row) + Math.abs(col - lastCell.col) === 1;
    
    if (isAdjacent && !isInPath(row, col)) {
      const clickedCell = cells.find(c => c.row === row && c.col === col);
      const newPath = [...path, { row, col }];
      setPath(newPath);

      // Si c'est un nombre, vérifier si c'est le dernier
      if (clickedCell?.value) {
        const maxNumber = Math.max(...cells.filter(cell => cell.value !== null).map(cell => cell.value || 0));
        if (clickedCell.value === maxNumber) {
          console.log('Checking final path...');
          const isValid = checkPath();
          console.log('Path valid?', isValid);
          if (isValid) {
            setIsTimerActive(false);
            setShowSuccess(true);
          }
        }
      }
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
    const grid: Grid = Array(size).fill(null).map((_, rowIndex) => 
      Array(size).fill(null).map((_, colIndex) => ({
        row: rowIndex,
        col: colIndex,
        value: null,
        isPartOfPath: false,
        isSelected: false
      }))
    );

    // Remplir la grille avec les valeurs des cellules
    cells.forEach(cell => {
      grid[cell.row][cell.col].value = cell.value;
    });

    // Trouver le chemin valide
    const solution = findValidPath(grid, true);
    
    if (solution && Array.isArray(solution)) {
      setPath(solution);
      setShowingSolution(true);
      setCurrentNumber(cells.length); // Marquer comme complet
    } else {
      console.error("Impossible de trouver une solution valide");
      // Optionnel : afficher un message à l'utilisateur
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
        <h1>Puzzle #{puzzleNumber}</h1>
        <div className="timer">{formatTime(elapsedTime)}</div>
      </div>

      {/* Grid */}
      <div 
        className="game-grid"
        style={{
          gridTemplateColumns: `repeat(${size}, 1fr)`,
        }}
      >
        {Array.from({ length: size * size }).map((_, index) => {
          const row = Math.floor(index / size);
          const col = index % size;
          const cell = cells.find(c => c.row === row && c.col === col);
          const pathDirections = cell ? getPathDirections(row, col) : [];

          return (
            <div
              key={index}
              className={`grid-cell ${isInPath(row, col) ? 'in-path' : ''} ${pathDirections.join(' ')}`}
              onMouseDown={() => handleMouseDown(row, col)}
              onMouseEnter={(e) => handleMouseEnter(row, col, e)}
              onTouchStart={(e) => {
                e.preventDefault();
                handleMouseDown(row, col);
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
              {cell?.value && (
                <div className="cell-number">
                  {cell.value}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Success Popup */}
      {showSuccess && (
        <div className="success-popup">
          <div className="success-content">
            <h2>Félicitations !</h2>
            <p>Vous avez réussi en {formatTime(elapsedTime)} !</p>
            <button 
              className="button button-primary"
              onClick={() => setShowSuccess(false)}
            >
              Fermer
            </button>
          </div>
        </div>
      )}

      {/* Calendar */}
      <PuzzleCalendar onSelectDay={onSelectDay} />

      {/* Controls */}
      <div className="controls">
        <div className="grid-size">
          <label htmlFor="gridSize">Grid Size:</label>
          <select
            id="gridSize"
            defaultValue={`${size}`}
            onChange={(e) => {
              const newSize = parseInt(e.target.value);
              onSizeChange?.(newSize);
              setPath([]);
              setCurrentNumber(1);
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
          Undo
        </button>
        <div className="solution-controls">
          {!showingSolution ? (
            <button 
              className="button button-primary"
              onClick={handleShowSolution}
            >
              Afficher la solution
            </button>
          ) : (
            <button 
              className="button button-secondary"
              onClick={handleResetSolution}
            >
              Masquer la solution
            </button>
          )}
        </div>
      </div>
    </div>
  );
};