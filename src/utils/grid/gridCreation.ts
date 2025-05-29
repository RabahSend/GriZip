import { Grid, Cell } from '../../types/gameTypes';

/**
 * Crée une grille vide avec les dimensions spécifiées
 */
export function createEmptyGrid(rows: number, cols: number): Grid {
  const grid: Grid = [];
  
  for (let i = 0; i < rows; i++) {
    const row: Cell[] = [];
    for (let j = 0; j < cols; j++) {
      row.push({
        row: i,
        col: j,
        value: null,
        isPartOfPath: false,
        isSelected: false
      });
    }
    grid.push(row);
  }
  
  return grid;
} 