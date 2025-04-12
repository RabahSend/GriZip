import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  const gameContainerRef = useRef<HTMLDivElement>(null);
  const [possibleMoves, setPossibleMoves] = useState<{row: number, col: number}[]>([]);
  const [showInfo, setShowInfo] = useState<boolean>(false);
  const [currentLanguage, setCurrentLanguage] = useState<'fr' | 'en'>('fr');

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

  const calculatePossibleMoves = useCallback(() => {
    if (path.length === 0) {
      // Si aucun chemin n'est commencé, indiquer la cellule avec la valeur 1
      const startCells = grid.flatMap((row, rowIndex) => 
        row.map((cell, colIndex) => 
          cell.value === 1 ? {row: rowIndex, col: colIndex} : null
        ).filter(Boolean)
      );
      
      setPossibleMoves(startCells as {row: number, col: number}[]);
      return;
    }
    
    const lastCell = path[path.length - 1];
    const moves: {row: number, col: number}[] = [];
    
    // Vérifier les quatre directions cardinales
    const directions = [
      {row: -1, col: 0}, // haut
      {row: 1, col: 0},  // bas
      {row: 0, col: -1}, // gauche
      {row: 0, col: 1}   // droite
    ];
    
    for (const dir of directions) {
      const newRow = lastCell.row + dir.row;
      const newCol = lastCell.col + dir.col;
      
      // Vérifier que la cellule est dans la grille et n'est pas déjà dans le chemin
      if (
        newRow >= 0 && newRow < size && 
        newCol >= 0 && newCol < size && 
        !isInPath(newRow, newCol)
      ) {
        moves.push({row: newRow, col: newCol});
      }
    }
    
    setPossibleMoves(moves);
  }, [path, grid, size]);

  useEffect(() => {
    calculatePossibleMoves();
  }, [path, calculatePossibleMoves]);

  const handleBacktrack = (index: number) => {
    // Revenir à l'index spécifié dans le chemin
    setPath(path.slice(0, index + 1));
    // Recalculer les mouvements possibles
    calculatePossibleMoves();
  };

  const handleMouseDown = (row: number, col: number) => {
    // Donner le focus au conteneur de jeu lorsqu'on clique sur une cellule
    if (gameContainerRef.current) {
      gameContainerRef.current.focus();
    }
    
    const clickedCell = grid[row][col];
    
    // Si on clique sur le premier numéro (1) et qu'aucun chemin n'est commencé
    if (clickedCell.value === 1 && path.length === 0) {
      setPath([{ row, col }]);
      setIsDragging(true);
      if (!isTimerActive) {
        setIsTimerActive(true);
      }
      return;
    }

    // Vérifier si la cellule est déjà dans le chemin (pour le retour en arrière)
    const existingIndex = path.findIndex(cell => cell.row === row && cell.col === col);
    if (existingIndex !== -1) {
      // Si cette cellule est déjà dans le chemin, revenir en arrière jusqu'à cette position
      handleBacktrack(existingIndex);
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
            const isValid = checkPath(newPath);
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
    
    // Si on n'est pas en train de glisser ou si le bouton de souris n'est pas enfoncé, sortir
    if (!isDragging || !('buttons' in e) || !e.buttons) return;

    // Vérifier si la cellule est déjà dans le chemin (pour le retour en arrière)
    const existingIndex = path.findIndex(cell => cell.row === row && cell.col === col);
    if (existingIndex !== -1) {
      // Si cette cellule est déjà dans le chemin, revenir en arrière jusqu'à cette position
      setPath(path.slice(0, existingIndex + 1));
      return;
    }

    // Si on revient sur la case précédente (cas spécial pour la cellule précédente)
    if (path.length > 1 && row === path[path.length - 2].row && col === path[path.length - 2].col) {
      setPath(prev => prev.slice(0, -1));
      return;
    }

    const lastCell = path[path.length - 1];
    
    // Si on est déjà sur cette case, ne rien faire
    if (lastCell.row === row && lastCell.col === col) return;

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
    // Si on est en mode clavier (isDragging est true mais pas de bouton enfoncé),
    // ne pas réinitialiser le survol, juste mettre à jour la position
    const isKeyboardMode = isDragging && !e.buttons;
    
    if ((!isDragging && !e.buttons) || !gridRef.current) return;
    
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
    
    // Si on est en mode clavier, ne pas désactiver isDragging même si le bouton de souris n'est pas enfoncé
    if (!isKeyboardMode && !e.buttons) {
      setIsDragging(false);
    }
  };

  // Fonction améliorée pour gérer les entrées clavier
  const handleKeyDown = (e: KeyboardEvent) => {
    if (!grid.length || isLoading) return;
    
    // Si le jeu n'a pas le focus, lui donner le focus
    if (gameContainerRef.current && document.activeElement !== gameContainerRef.current) {
      gameContainerRef.current.focus();
    }
    
    // Si aucune cellule n'est actuellement survolée, initialiser à la cellule "1" ou à la dernière cellule du chemin
    if (!hoverCell) {
      if (path.length > 0) {
        // Si un chemin existe déjà, mettre le survol sur la dernière cellule
        const lastCell = path[path.length - 1];
        setHoverCell({ row: lastCell.row, col: lastCell.col });
      } else {
        // Sinon, trouver la cellule avec la valeur 1
        for (let rowIndex = 0; rowIndex < grid.length; rowIndex++) {
          for (let colIndex = 0; colIndex < grid[rowIndex].length; colIndex++) {
            if (grid[rowIndex][colIndex].value === 1) {
              setHoverCell({ row: rowIndex, col: colIndex });
              if (path.length === 0) {
                setPath([{ row: rowIndex, col: colIndex }]);
                setIsTimerActive(true);
                setIsDragging(true);
              }
              break;
            }
          }
        }
      }
      return;
    }
    
    // Calculer les nouvelles coordonnées basées sur la touche pressée
    let newRow = hoverCell.row;
    let newCol = hoverCell.col;
    
    switch (e.key) {
      case 'ArrowUp':
        newRow = Math.max(0, hoverCell.row - 1);
        break;
      case 'ArrowDown':
        newRow = Math.min(size - 1, hoverCell.row + 1);
        break;
      case 'ArrowLeft':
        newCol = Math.max(0, hoverCell.col - 1);
        break;
      case 'ArrowRight':
        newCol = Math.min(size - 1, hoverCell.col + 1);
        break;
      case 'Backspace':
      case 'Delete':
        // Annuler le dernier mouvement de manière plus intuitive
        if (path.length > 1) {
          handleBacktrack(path.length - 2);
          // Mettre à jour la cellule survolée pour qu'elle corresponde à la nouvelle dernière cellule
          if (path.length > 0) {
            const newLastCell = path[path.length - 1];
            setHoverCell({ row: newLastCell.row, col: newLastCell.col });
          }
        }
        return;
      case 'z':
        // Ajouter un raccourci Ctrl+Z pour annuler
        if (e.ctrlKey && path.length > 1) {
          handleBacktrack(path.length - 2);
          if (path.length > 0) {
            const newLastCell = path[path.length - 1];
            setHoverCell({ row: newLastCell.row, col: newLastCell.col });
          }
        }
        return;
      case 'Enter':
      case ' ':
        // Si un chemin est déjà commencé mais l'utilisateur n'est pas en train de glisser
        if (path.length > 0 && !isDragging) {
          setIsDragging(true);
        }
        
        // Vérifier si la cellule actuelle est dans le chemin (pour le retour en arrière)
        const existingIndex = path.findIndex(p => p.row === newRow && p.col === newCol);
        if (existingIndex !== -1) {
          handleBacktrack(existingIndex);
          return;
        }
        
        // Confirmer la cellule actuelle (similaire à un clic)
        if (path.length === 0) {
          handleMouseDown(newRow, newCol);
        } else if (!isInPath(newRow, newCol)) {
          // Vérifier si c'est un mouvement valide
          const lastCell = path[path.length - 1];
          const isAdjacent = Math.abs(newRow - lastCell.row) + Math.abs(newCol - lastCell.col) === 1;
          
          if (isAdjacent) {
            handleMouseEnter(newRow, newCol, { buttons: 1 });
          }
        }
        return;
      default:
        return;
    }
    
    // Si les coordonnées ont changé
    if (newRow !== hoverCell.row || newCol !== hoverCell.col) {
      setHoverCell({ row: newRow, col: newCol });
      
      // Si un chemin est déjà commencé, vérifier si c'est un mouvement valide
      if (path.length > 0) {
        const lastCell = path[path.length - 1];
        const isAdjacent = Math.abs(newRow - lastCell.row) + Math.abs(newCol - lastCell.col) === 1;
        
        // Permet d'étendre le chemin uniquement si c'est un mouvement adjacent valide
        if (isAdjacent && !isInPath(newRow, newCol)) {
          handleMouseEnter(newRow, newCol, { buttons: 1 });
        } else if (isInPath(newRow, newCol)) {
          // Si la cellule est déjà dans le chemin, permettre le retour en arrière
          const existingIndex = path.findIndex(p => p.row === newRow && p.col === newCol);
          if (existingIndex !== -1) {
            handleBacktrack(existingIndex);
          }
        }
      }
    }
  };

  // Ajouter l'écouteur d'événement pour les touches du clavier
  useEffect(() => {
    const handleKeyDownEvent = (e: KeyboardEvent) => {
      // Empêcher le défilement de la page avec les flèches
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
      }
      handleKeyDown(e);
    };
    
    window.addEventListener('keydown', handleKeyDownEvent);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDownEvent);
    };
  }, [grid, hoverCell, path, size, isLoading]);

  // Nouveau useEffect pour garder le focus sur le conteneur de jeu
  useEffect(() => {
    // Mettre le focus sur le conteneur de jeu lors du chargement
    if (gameContainerRef.current && !isLoading) {
      gameContainerRef.current.focus();
    }
  }, [isLoading, grid]);

  // Ajouter un gestionnaire de clic sur le conteneur pour garder le focus
  const handleContainerClick = () => {
    // S'assurer que le clic sur n'importe quelle partie du conteneur donne le focus
    if (gameContainerRef.current) {
      gameContainerRef.current.focus();
    }
  };

  // Fonction pour basculer l'affichage des informations
  const toggleInfoDisplay = () => {
    setShowInfo(!showInfo);
  };

  // Fonction pour basculer entre les langues
  const toggleLanguage = () => {
    setCurrentLanguage(currentLanguage === 'fr' ? 'en' : 'fr');
  };

  return (
    <div 
      className="game-container" 
      ref={gameContainerRef} 
      tabIndex={0}
      onClick={handleContainerClick}
    >
      {/* Header */}
      <div className="game-header">
        <h1>Puzzle du {selectedDate.toLocaleDateString()}</h1>
        <div className="header-right">
          <button 
            className="info-button" 
            onClick={toggleInfoDisplay}
            aria-label="Instructions du jeu"
          >
            <span className="info-icon">i</span>
          </button>
          <div className="timer">{formatTime(elapsedTime)}</div>
        </div>
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
            
            // Classe pour l'indicateur de survol
            const isHovered = hoverCell?.row === rowIndex && hoverCell?.col === colIndex;
            const hoverClass = isHovered ? 'hover-indicator' : '';
            
            // Nouvelle classe pour les mouvements possibles
            const isPossibleMove = possibleMoves.some(move => move.row === rowIndex && move.col === colIndex);
            const possibleMoveClass = isPossibleMove ? 'possible-move' : '';
            
            // Déterminer si cette cellule est sur le chemin et à quel index
            const pathIndex = path.findIndex(p => p.row === rowIndex && p.col === colIndex);
            const isInCurrentPath = pathIndex !== -1;
            const isLastCell = pathIndex === path.length - 1;
            const lastCellClass = isLastCell ? 'last-cell' : '';

            return (
              <div
                key={`${rowIndex}-${colIndex}`}
                className={`grid-cell ${isInCurrentPath ? 'in-path' : ''} ${pathDirections.join(' ')} ${numberClass} ${lastNumberClass} ${hoverClass} ${possibleMoveClass} ${lastCellClass}`}
                data-position={`${rowIndex}-${colIndex}`}
                data-path-index={isInCurrentPath ? pathIndex : undefined}
                onMouseDown={() => handleMouseDown(rowIndex, colIndex)}
                onMouseEnter={(e) => handleMouseEnter(rowIndex, colIndex, e)}
                onTouchStart={(e) => {
                  e.preventDefault();
                  handleMouseDown(rowIndex, colIndex);
                }}
                onTouchMove={handleTouchMove}
              >
                {cell.value && (
                  <div className={`cell-number ${isInCurrentPath ? 'visited' : ''}`}>
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

      {/* Modal d'information */}
      {showInfo && (
        <div className="info-modal">
          <div className="info-content">
            <div className="info-header">
              <h2>{currentLanguage === 'fr' ? 'Comment jouer' : 'How to play'}</h2>
              <button 
                className="language-toggle-button" 
                onClick={toggleLanguage}
                aria-label={currentLanguage === 'fr' ? 'Switch to English' : 'Passer au français'}
                title={currentLanguage === 'fr' ? 'Switch to English' : 'Passer au français'}
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  width: '110px',
                  padding: '6px',
                  margin: '0 auto'
                }}
              >
                <div style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: '8px',
                  width: '100%'
                }}>
                  <span style={{ 
                    borderBottom: currentLanguage === 'fr' ? '3px solid red' : 'none',
                    paddingBottom: '2px',
                    minWidth: '28px',
                    textAlign: 'center'
                  }}>🇫🇷</span>
                  <span style={{ 
                    borderBottom: currentLanguage === 'en' ? '3px solid red' : 'none',
                    paddingBottom: '2px',
                    minWidth: '55px',
                    textAlign: 'center'
                  }}>🇬🇧 🇺🇸</span>
                </div>
              </button>
            </div>
            
            {/* Contenu en français */}
            {currentLanguage === 'fr' && (
              <div className="info-section">
                <div className="info-text">
                  <p><strong>Objectif:</strong> Connecter tous les nombres dans l'ordre croissant en traçant un chemin qui passe par toutes les cases de la grille.</p>
                  
                  <h4>Règles:</h4>
                  <ul>
                    <li>Commencez par le nombre 1 et connectez tous les nombres dans l'ordre.</li>
                    <li>Le chemin doit passer par toutes les cases de la grille exactement une fois.</li>
                    <li>Le chemin ne peut se déplacer qu'horizontalement ou verticalement.</li>
                    <li>Chaque case doit être visitée exactement une fois.</li>
                  </ul>
                  
                  <h4>Contrôles:</h4>
                  <ul>
                    <li><strong>Souris:</strong> Cliquez et glissez pour tracer le chemin.</li>
                    <li><strong>Tactile:</strong> Touchez et faites glisser pour tracer le chemin.</li>
                    <li><strong>Clavier:</strong> Utilisez les flèches pour naviguer, Entrée pour confirmer, Backspace pour effacer.</li>
                  </ul>
                  
                  <p><strong>Astuce:</strong> Les cases possibles sont légèrement surlignées. Vous pouvez revenir en arrière en cliquant sur une case déjà visitée.</p>
                </div>
              </div>
            )}
            
            {/* Contenu en anglais */}
            {currentLanguage === 'en' && (
              <div className="info-section">
                <div className="info-text">
                  <p><strong>Objective:</strong> Connect all numbers in ascending order by tracing a path that covers all grid cells.</p>
                  
                  <h4>Rules:</h4>
                  <ul>
                    <li>Start at number 1 and connect all numbers in order.</li>
                    <li>The path must pass through every cell in the grid exactly once.</li>
                    <li>The path can only move horizontally or vertically.</li>
                    <li>Each cell must be visited exactly once.</li>
                  </ul>
                  
                  <h4>Controls:</h4>
                  <ul>
                    <li><strong>Mouse:</strong> Click and drag to trace the path.</li>
                    <li><strong>Touch:</strong> Tap and drag to trace the path.</li>
                    <li><strong>Keyboard:</strong> Use arrow keys to navigate, Enter to confirm, Backspace to delete.</li>
                  </ul>
                  
                  <p><strong>Tip:</strong> Possible moves are slightly highlighted. You can backtrack by clicking on a cell you've already visited.</p>
                </div>
              </div>
            )}
            
            <button 
              className="button button-primary"
              onClick={toggleInfoDisplay}
            >
              {currentLanguage === 'fr' ? 'Fermer' : 'Close'}
            </button>
          </div>
        </div>
      )}

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

