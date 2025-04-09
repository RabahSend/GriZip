import React, { useState, useEffect } from 'react';
import './GameGrid.css';
import { Cell, Path } from '../types/gameTypes';
import { PuzzleCalendar } from './PuzzleCalendar';

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
    }
  }, [resetPath]);

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
    
    // Si on clique sur le premier numéro
    if (clickedCell?.value === currentNumber && path.length === 0) {
      setIsDragging(true);
      setStartCell(clickedCell);
      setPath([{ row, col }]);
      if (!isTimerActive) {
        setIsTimerActive(true);
      }
    }
    // Si on clique sur la case précédente du chemin
    else if (path.length > 1 && row === path[path.length - 2].row && col === path[path.length - 2].col) {
      setPath(prev => prev.slice(0, -1));
    }
    // Si on clique sur une case adjacente au dernier point du chemin
    else if (path.length > 0) {
      const lastCell = path[path.length - 1];
      const isAdjacent = Math.abs(row - lastCell.row) + Math.abs(col - lastCell.col) === 1;
      
      if (isAdjacent && !isInPath(row, col)) {
        setIsDragging(true);
        setPath(prev => [...prev, { row, col }]);
      }
    }
  };

  const handleMouseEnter = (row: number, col: number, e: React.MouseEvent | { buttons: number }) => {
    if (!('buttons' in e) || !e.buttons || !isDragging) return;

    // Si on revient sur la case précédente
    if (path.length > 1 && row === path[path.length - 2].row && col === path[path.length - 2].col) {
      setPath(prev => prev.slice(0, -1));
      return;
    }

    const lastCell = path[path.length - 1];
    const isAdjacent = Math.abs(row - lastCell.row) + Math.abs(col - lastCell.col) === 1;
    
    if (isAdjacent && !isInPath(row, col)) {
      setPath(prev => [...prev, { row, col }]);
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
      </div>
    </div>
  );
};