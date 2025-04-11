import React, { useState, useEffect, useRef } from 'react';
import './GameGrid.css';
import { Cell, Difficulty, Grid, Path, PuzzleStatus } from '../types/gameTypes';
import { PuzzleCalendar } from './PuzzleCalendar';
import { findValidPath } from '../utils/gridGenerator';

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
  const [hoverCell, setHoverCell] = useState<{row: number, col: number} | null>(null);
  const [lastMousePosition, setLastMousePosition] = useState<{x: number, y: number} | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const [gridSolution, setGridSolution] = useState<Path | null>(null);

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
    
    // Déterminer la difficulté en fonction du jour de la semaine sélectionné
    const getDifficultyForDate = (date: Date): Difficulty => {
      const day = date.getDay(); // 0 = dimanche, 1 = lundi, ..., 6 = samedi
      
      if (day === 0) return 'HARD'; // Dimanche
      if (day <= 2) return 'EASY'; // Lundi, Mardi
      if (day <= 5) return 'MEDIUM'; // Mercredi, Jeudi, Vendredi
      return 'HARD'; // Samedi
    };
    
    // Calculer la difficulté basée sur la date sélectionnée
    const difficulty = getDifficultyForDate(selectedDate);
    
    // Gérer les messages du Worker
    worker.onmessage = (e) => {
      const { type, grid, trace, error } = e.data;
      
      if (type === 'success') {
        setGrid(grid);
        setGridSolution(trace);
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
      difficulty, // Utiliser la difficulté calculée selon la date
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

  // Fonction améliorée pour trouver les cases intermédiaires
  const getIntermediateCells = (start: { row: number; col: number }, end: { row: number; col: number }): { row: number; col: number }[] => {
    const cells: { row: number; col: number }[] = [];
    const rowDiff = end.row - start.row;
    const colDiff = end.col - start.col;

    // Si on est sur la même ligne
    if (rowDiff === 0) {
      const step = colDiff > 0 ? 1 : -1;
      for (let col = start.col + step; col !== end.col + step; col += step) {
        // Vérification de sécurité pour éviter les indices hors limites
        if (col >= 0 && col < size) {
          cells.push({ row: start.row, col });
        }
      }
    }
    // Si on est sur la même colonne
    else if (colDiff === 0) {
      const step = rowDiff > 0 ? 1 : -1;
      for (let row = start.row + step; row !== end.row + step; row += step) {
        // Vérification de sécurité pour éviter les indices hors limites
        if (row >= 0 && row < size) {
          cells.push({ row, col: start.col });
        }
      }
    }
    // Si le mouvement est diagonal ou irrégulier, retourner un tableau vide
    // pour éviter les sauts incorrects
    return cells;
  };

  const handleMouseEnter = (row: number, col: number, e: React.MouseEvent | { buttons: number }) => {
    // Vérifier que les coordonnées sont valides
    if (row < 0 || row >= size || col < 0 || col >= size) return;
    
    // Mise à jour de la cellule survolée
    setHoverCell({ row, col });
    
    if (!isDragging || !('buttons' in e) || !e.buttons) return;

    // Si on revient sur la case précédente (pour l'annulation)
    if (path.length > 1 && row === path[path.length - 2].row && col === path[path.length - 2].col) {
      setPath(prev => prev.slice(0, -1));
      return;
    }

    const lastCell = path[path.length - 1];
    
    // Si on est déjà sur cette case, ne rien faire
    if (lastCell.row === row && lastCell.col === col) return;

    // Si la case est déjà dans le chemin, ne rien faire
    if (isInPath(row, col)) return;
    
    // Vérifier si le mouvement est adjacent (horizontal ou vertical uniquement)
    const isHorizontallyAdjacent = lastCell.row === row && Math.abs(lastCell.col - col) === 1;
    const isVerticallyAdjacent = lastCell.col === col && Math.abs(lastCell.row - row) === 1;
    const isAdjacent = isHorizontallyAdjacent || isVerticallyAdjacent;
    
    // Si c'est un mouvement adjacent, l'ajouter directement
    if (isAdjacent) {
      const newCell = { row, col };
      const newPath = [...path, newCell];
      
      // Vérifier si c'est un nombre et si c'est le dernier
      if (grid[row][col].value) {
        const maxNumber = Math.max(...grid.flatMap(row => row.filter(cell => cell.value !== null).map(cell => cell.value || 0)));
        if (grid[row][col].value === maxNumber) {
          const isValid = checkPath(newPath);
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
    
    // Pour les mouvements en ligne droite (non adjacents)
    const isSameRow = row === lastCell.row;
    const isSameCol = col === lastCell.col;
    
    if ((isSameRow || isSameCol)) {
      const intermediateCells = getIntermediateCells(lastCell, { row, col });
      
      // Vérifier si toutes les cellules intermédiaires sont valides
      const isValidPath = intermediateCells.length > 0 && 
                          intermediateCells.every(cell => 
                            cell.row >= 0 && cell.row < size && 
                            cell.col >= 0 && cell.col < size && 
                            !isInPath(cell.row, cell.col));
      
      if (isValidPath) {
        // Créer un nouveau tableau pour le chemin (plutôt que de modifier l'ancien)
        const newPath = [...path];
        
        // Ajouter chaque cellule intermédiaire une par une
        for (const cell of intermediateCells) {
          newPath.push(cell);
        }
        
        // Ajouter la cellule finale
        newPath.push({ row, col });

        // Vérification finale pour le dernier nombre
        if (grid[row][col].value) {
          const maxNumber = Math.max(...grid.flatMap(row => 
            row.filter(cell => cell.value !== null).map(cell => cell.value || 0)
          ));
          if (grid[row][col].value === maxNumber) {
            const isValid = checkPath(newPath);
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
    // Utiliser directement le tracé stocké
    if (gridSolution) {
      setPath(gridSolution);
      setShowingSolution(true);
      setCurrentNumber(numberCount);
      
      const dateString = selectedDate.toISOString().split('T')[0];
      const currentStatus = puzzleStatuses[dateString];
      if (currentStatus !== 'COMPLETED') {
        onPuzzleComplete(selectedDate, true);
      }
      
      setIsTimerActive(false);
    } else {
      // Fallback si le tracé n'est pas disponible (ce qui ne devrait pas arriver)
      console.error("Aucun tracé disponible pour la solution");
      
      // On peut essayer de recalculer un chemin
      const solution = findValidPath(grid, true);
      if (solution && Array.isArray(solution)) {
        setPath(solution);
        setShowingSolution(true);
        setCurrentNumber(numberCount);
        setIsTimerActive(false);
      } else {
        console.error("Impossible de trouver une solution valide");
      }
    }
  };

  const handleResetSolution = () => {
    setPath([]);
    setShowingSolution(false);
    setCurrentNumber(1);
  };

  // Version améliorée pour le tactile
  const handleTouchMove = (e: React.TouchEvent) => {
    e.preventDefault();
    if (!isDragging || !gridRef.current) return;
    
    const touch = e.touches[0];
    const gridRect = gridRef.current.getBoundingClientRect();
    const cellSize = gridRect.width / size;
    
    const xRelative = Math.max(0, Math.min(touch.clientX - gridRect.left, gridRect.width - 1));
    const yRelative = Math.max(0, Math.min(touch.clientY - gridRect.top, gridRect.height - 1));
    
    const col = Math.floor(xRelative / cellSize);
    const row = Math.floor(yRelative / cellSize);
    
    // Vérifier que les coordonnées sont valides
    if (row >= 0 && row < size && col >= 0 && col < size) {
      if (!hoverCell || hoverCell.row !== row || hoverCell.col !== col) {
        setHoverCell({ row, col });
        handleMouseEnter(row, col, { buttons: 1 });
      }
    }
  };

  const handleMouseLeave = () => {
    setHoverCell(null);
  };

  // Amélioration de la gestion du mouvement de la souris
  const handleGridMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !gridRef.current) return;
    
    // Stocker la dernière position connue de la souris pour référence
    setLastMousePosition({ x: e.clientX, y: e.clientY });
    
    // Calculer la position de la cellule actuelle
    const gridRect = gridRef.current.getBoundingClientRect();
    const cellSize = gridRect.width / size;
    
    const xRelative = Math.max(0, Math.min(e.clientX - gridRect.left, gridRect.width - 1));
    const yRelative = Math.max(0, Math.min(e.clientY - gridRect.top, gridRect.height - 1));
    
    const col = Math.floor(xRelative / cellSize);
    const row = Math.floor(yRelative / cellSize);
    
    // Vérifier que les coordonnées sont valides
    if (row >= 0 && row < size && col >= 0 && col < size) {
      // Éviter les mises à jour inutiles qui pourraient causer des problèmes de performance
      if (!hoverCell || hoverCell.row !== row || hoverCell.col !== col) {
        setHoverCell({ row, col });
        
        // Simuler un événement d'entrée de souris pour mettre à jour le chemin
        // uniquement si la cellule est différente de la dernière
        const lastPathCell = path[path.length - 1];
        if (lastPathCell && (lastPathCell.row !== row || lastPathCell.col !== col)) {
          handleMouseEnter(row, col, { buttons: 1 });
        }
      }
    }
  };

  return (
    <div className="game-container">
      {/* Header */}
      <div className="game-header">
        <h1>Puzzle du {selectedDate.toLocaleDateString()}</h1>
        <div className="timer">{formatTime(elapsedTime)}</div>
      </div>

      {/* Grid avec référence et gestionnaires améliorés */}
      <div 
        ref={gridRef}
        className="game-grid"
        style={{
          gridTemplateColumns: `repeat(${size}, 1fr)`,
        }}
        onMouseMove={handleGridMouseMove}
        onMouseLeave={() => setHoverCell(null)}
      >
        {grid.flatMap((row, rowIndex) => 
          row.map((cell, colIndex) => {
            const pathDirections = getPathDirections(rowIndex, colIndex);
            
            // Classes existantes
            const maxNumber = Math.max(...grid.flatMap(row => 
              row.filter(cell => cell.value !== null)
                .map(cell => cell.value || 0)
            ));
            const numberClass = cell?.value ? `number-${cell.value}` : '';
            const isLastNumber = cell.value === maxNumber;
            const lastNumberClass = isLastNumber ? 'last-number' : '';
            
            // Classe pour l'indicateur de survol (simplifiée)
            const isHovered = hoverCell?.row === rowIndex && hoverCell?.col === colIndex;
            const hoverClass = isHovered && isDragging ? 'hover-indicator' : '';

            return (
              <div
                key={`${rowIndex}-${colIndex}`}
                className={`grid-cell ${isInPath(rowIndex, colIndex) ? 'in-path' : ''} ${pathDirections.join(' ')} ${numberClass} ${lastNumberClass} ${hoverClass}`}
                data-position={`${rowIndex}-${colIndex}`}
                onMouseDown={() => handleMouseDown(rowIndex, colIndex)}
                onMouseEnter={(e) => handleMouseEnter(rowIndex, colIndex, e)}
                onTouchStart={(e) => {
                  e.preventDefault();
                  handleMouseDown(rowIndex, colIndex);
                }}
                onTouchMove={handleTouchMove}
              >
                {cell.value && (
                  <div className={`cell-number ${isInPath(rowIndex, colIndex) ? 'visited' : ''}`}>
                    {cell.value}
                  </div>
                )}
              </div>
            );
          })
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
              <option value="10">10x10</option>
              <option value="12">12x12</option>
              <option value="15">15x15</option>
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

