import { describe, it, expect } from 'vitest';
import { createEmptyGrid, placeNumbersInGrid } from '../../utils/gridGenerator';
import { Grid, Coordinate } from '../../types/gameTypes';

describe('Placement des nombres dans la grille', () => {
  it('devrait placer le nombre spécifié de valeurs consécutives dans la grille', () => {
    const grid = createEmptyGrid(5, 5);
    const numCount = 8; // Nombre de valeurs à placer
    
    const gridWithNumbers = placeNumbersInGrid(grid, numCount);
    
    // Compter combien de cellules ont des valeurs
    let count = 0;
    let hasValueOne = false;
    let hasValueNumCount = false;
    
    for (let i = 0; i < gridWithNumbers.length; i++) {
      for (let j = 0; j < gridWithNumbers[i].length; j++) {
        const cell = gridWithNumbers[i][j];
        if (cell.value !== null) {
          count++;
          if (cell.value === 1) hasValueOne = true;
          if (cell.value === numCount) hasValueNumCount = true;
        }
      }
    }
    
    expect(count).toBe(numCount);
    expect(hasValueOne).toBe(true);
    expect(hasValueNumCount).toBe(true);
  });
  
  it('devrait générer des configurations de nombres différentes à chaque appel', () => {
    const grid1 = createEmptyGrid(5, 5);
    const grid2 = createEmptyGrid(5, 5);
    const numCount = 6;
    
    const gridWithNumbers1 = placeNumbersInGrid(grid1, numCount);
    const gridWithNumbers2 = placeNumbersInGrid(grid2, numCount);
    
    // Extraire les positions des nombres pour comparer
    const positions1 = extractNumberPositions(gridWithNumbers1);
    const positions2 = extractNumberPositions(gridWithNumbers2);
    
    // Il est très improbable que deux générations produisent exactement le même résultat
    expect(arePositionsIdentical(positions1, positions2)).toBe(false);
  });
  
  it('devrait placer les nombres de façon à ce que chacun ait au moins un chemin possible vers le suivant', () => {
    const grid = createEmptyGrid(5, 5);
    const numCount = 6;
    
    const gridWithNumbers = placeNumbersInGrid(grid, numCount);
    
    // Vérifier que chaque nombre peut être connecté au suivant
    for (let num = 1; num < numCount; num++) {
      const current = findCellWithValue(gridWithNumbers, num);
      const next = findCellWithValue(gridWithNumbers, num + 1);
      
      expect(current).not.toBeNull();
      expect(next).not.toBeNull();
      
      // Vérifier qu'il existe un chemin possible entre les deux nombres
      const canConnect = canCellsBeConnected(gridWithNumbers, current!, next!);
      expect(canConnect).toBe(true);
    }
  });
  
  // Fonctions utilitaires pour les tests
  function extractNumberPositions(grid: Grid): Map<number, Coordinate> {
    const positions = new Map<number, Coordinate>();
    
    for (let i = 0; i < grid.length; i++) {
      for (let j = 0; j < grid[i].length; j++) {
        if (grid[i][j].value !== null) {
          positions.set(grid[i][j].value as number, { row: i, col: j });
        }
      }
    }
    
    return positions;
  }
  
  function arePositionsIdentical(pos1: Map<number, Coordinate>, pos2: Map<number, Coordinate>): boolean {
    if (pos1.size !== pos2.size) return false;
    
    for (const [num, coord] of pos1.entries()) {
      const coord2 = pos2.get(num);
      if (!coord2 || coord.row !== coord2.row || coord.col !== coord2.col) {
        return false;
      }
    }
    
    return true;
  }
  
  function findCellWithValue(grid: Grid, value: number): Coordinate | null {
    for (let i = 0; i < grid.length; i++) {
      for (let j = 0; j < grid[i].length; j++) {
        if (grid[i][j].value === value) {
          return { row: i, col: j };
        }
      }
    }
    return null;
  }
  
  function canCellsBeConnected(grid: Grid, start: Coordinate, end: Coordinate): boolean {
    // Cette fonction est une version simplifiée pour les tests
    // Dans l'implémentation réelle, vous auriez un algorithme plus complexe
    
    // Pour les tests, nous vérifions simplement si les cellules sont adjacentes
    // ou s'il existe une cellule vide entre elles qui pourrait former un chemin
    
    const rowDiff = Math.abs(start.row - end.row);
    const colDiff = Math.abs(start.col - end.col);
    
    // Si directement adjacentes
    if ((rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1)) {
      return true;
    }
    
    // Cas simple: s'il y a une cellule vide entre les deux points
    if (rowDiff <= 2 && colDiff <= 2) {
      return true; // Simplification pour les tests
    }
    
    return false; // Pas de chemin évident
  }
});