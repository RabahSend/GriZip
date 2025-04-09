import React from 'react';
import './GameGrid.css';
import { Cell } from '../types/gameTypes';

interface GameGridProps {
  size: number;
  cells: Cell[];
  onCellClick?: (cell: Cell) => void;
  onNewGame?: () => void;
  onUndo?: () => void;
  onSizeChange?: (size: number) => void;
}

export const GameGrid: React.FC<GameGridProps> = ({ 
  size, 
  cells, 
  onCellClick,
  onNewGame,
  onUndo,
  onSizeChange
}) => {
  return (
    <div className="game-container">
      {/* Header */}
      <div className="game-header">
        <h1>Puzzle #20</h1>
        <div>Time: 00:00</div>
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
              onClick={() => cell && onCellClick?.(cell)}
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
          className="button button-primary"
          onClick={onNewGame}
        >
          New Game
        </button>
        <button 
          className="button button-secondary"
          onClick={onUndo}
        >
          Undo
        </button>
      </div>
    </div>
  );
};