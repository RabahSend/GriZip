import { Coordinate, Path } from '../../../types/gameTypes';

// Directions définies une seule fois au niveau du module
export const DIRECTIONS = Object.freeze([
  { row: -1, col: 0 }, // haut
  { row: 0, col: 1 },  // droite
  { row: 1, col: 0 },  // bas
  { row: 0, col: -1 }  // gauche
]);

/**
 * Vérifie si une cellule est dans les limites de la grille
 */
export function isValidCell(row: number, col: number, maxRows: number, maxCols: number): boolean {
  return row >= 0 && row < maxRows && col >= 0 && col < maxCols;
}

/**
 * Compte le nombre de voisins libres d'une cellule
 */
export function countFreeNeighbors(row: number, col: number, visited: boolean[][], maxRows: number, maxCols: number): number {
  let count = 0;
  
  for (const dir of DIRECTIONS) {
    const newRow = row + dir.row;
    const newCol = col + dir.col;
    
    if (isValidCell(newRow, newCol, maxRows, maxCols) && !visited[newRow][newCol]) {
      count++;
    }
  }
  
  return count;
}

// Extraire cette logique commune dans une fonction utilitaire
export function handleSpecialGridCases(rows: number, cols: number): Path | null {
  // Cas spécial: grille 1×1
  if (rows === 1 && cols === 1) {
    return [{ row: 0, col: 0 }];
  }
  
  // Cas spécial: grilles 1×N ou N×1
  if (rows === 1 || cols === 1) {
    const trace: Path = [];
    if (rows === 1) {
      for (let c = 0; c < cols; c++) {
        trace.push({ row: 0, col: c });
      }
    } else {
      for (let r = 0; r < rows; r++) {
        trace.push({ row: r, col: 0 });
      }
    }
    return trace;
  }
  
  return null; // Pas de cas spécial
} 