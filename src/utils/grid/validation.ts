import { Grid, ValidationResult, Path, Coordinate } from '../../types/gameTypes';
// findValidPath sera importé depuis mainGenerator ou une autre source centralisée plus tard
import { findValidPath } from './mainGenerator'; // Placeholder import

/**
 * Valide une grille complète
 */
export function validateGrid(grid: Grid, numberCount: number): ValidationResult {
  const errors: string[] = [];
  
  // Vérifier que tous les nombres de 1 à numberCount sont présents
  const numbers = new Set<number>();
  for (let i = 0; i < grid.length; i++) {
    for (let j = 0; j < grid[i].length; j++) {
      const value = grid[i][j].value;
      if (value !== null && value >= 1 && value <= numberCount) {
        numbers.add(value);
      }
    }
  }
  
  const hasAllNumbers = numbers.size === numberCount;
  if (!hasAllNumbers) {
    console.error(`La grille ne contient pas tous les nombres de 1 à ${numberCount}`);
    errors.push(`La grille ne contient pas tous les nombres de 1 à ${numberCount}`);
  }
  
  // Exiger un chemin complet qui passe par toutes les cases
  const path = findValidPath(grid, true);
  const hasValidPath = path !== false;
  if (!hasValidPath) {
    console.error('Il n\'existe pas de chemin valide passant par toutes les cases');
    errors.push('Il n\'existe pas de chemin valide passant par toutes les cases');
  }
  
  return {
    isValid: hasAllNumbers && hasValidPath,
    hasAllNumbers,
    hasValidPath,
    errors: errors.length > 0 ? errors : undefined
  };
} 