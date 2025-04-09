import React, { useState, useEffect } from 'react';
import './GameGrid.css';
import { Cell } from '../types/gameTypes';
import { PuzzleCalendar } from './PuzzleCalendar';

interface GameGridProps {
  size: number;
  cells: Cell[];
  puzzleNumber: number;
  onCellClick?: (cell: Cell) => void;
  onSelectDay: (date: Date) => void;
  onUndo?: () => void;
  onSizeChange?: (size: number) => void;
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
  onSizeChange
}) => {
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const [isTimerActive, setIsTimerActive] = useState<boolean>(false);

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

  // Démarrer le timer au premier clic
  const handleCellClick = (cell: Cell) => {
    if (!isTimerActive) {
      setIsTimerActive(true);
    }
    onCellClick?.(cell);
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

          return (
            <div
              key={index}
              className="grid-cell"
              onClick={() => cell && handleCellClick(cell)}
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
            }}
          >
            <option value="6">6x6</option>
          </select>
        </div>
        <button 
          className="button button-secondary"
          onClick={() => {
            onUndo?.();
          }}
        >
          Undo
        </button>
      </div>
    </div>
  );
};