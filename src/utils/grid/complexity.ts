import { Grid, Coordinate } from '../../types/gameTypes';

/**
 * Calcule la complexité d'une grille
 */
export function calculateGridComplexity(grid: Grid): number {
  // Trouver les positions des nombres
  const numberPositions = new Map<number, Coordinate>();
  let maxNumber = 0;
  
  for (let i = 0; i < grid.length; i++) {
    for (let j = 0; j < grid[i].length; j++) {
      const value = grid[i][j].value;
      if (value !== null) {
        numberPositions.set(value, { row: i, col: j });
        maxNumber = Math.max(maxNumber, value);
      }
    }
  }
  
  if (maxNumber <= 1) return 0.1; // Éviter de retourner 0 pour faciliter les comparaisons
  
  // Calculer la distance moyenne entre les nombres consécutifs
  let totalDistance = 0;
  let connections = 0;
  
  for (let i = 1; i < maxNumber; i++) {
    const start = numberPositions.get(i);
    const end = numberPositions.get(i + 1);
    
    if (start && end) {
      // Distance de Manhattan
      const distance = Math.abs(start.row - end.row) + Math.abs(start.col - end.col);
      totalDistance += distance;
      connections++;
    }
  }
  
  // Calculer la complexité normalisée (0.1-1)
  if (connections === 0) return 0.1;
  
  const avgDistance = totalDistance / connections;
  const maxPossibleDistance = grid.length + grid[0].length - 2;
  
  // Normaliser entre 0.1 et 1 (éviter 0 pour les tests de comparaison)
  return Math.max(0.1, Math.min(avgDistance / maxPossibleDistance, 1));
} 