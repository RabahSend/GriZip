import { describe, it, expect } from 'vitest';
import { generateGrid, validateGrid } from '../../utils/gridGenerator';

describe('Génération et validation complète de la grille', () => {
  it('devrait générer une grille complète avec un chemin valide', () => {
    const rows = 5;
    const cols = 5;
    const numberCount = 8;
    const difficulty = 'MEDIUM';
    
    const grid = generateGrid(rows, cols, numberCount, difficulty);
    
    // Vérifier les dimensions
    expect(grid.length).toBe(rows);
    expect(grid[0].length).toBe(cols);
    
    // Vérifier que les nombres sont présents
    const numbers = new Set<number>();
    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
        if (grid[i][j].value !== null) {
          numbers.add(grid[i][j].value as number);
        }
      }
    }
    
    expect(numbers.size).toBe(numberCount);
    for (let i = 1; i <= numberCount; i++) {
      expect(numbers.has(i)).toBe(true);
    }
    
    // Vérifier que la grille est valide
    const validationResult = validateGrid(grid, numberCount);
    expect(validationResult.isValid).toBe(true);
  });
  
  it('devrait générer des grilles de tailles différentes', () => {
    const testCases = [
      { rows: 3, cols: 3, numberCount: 4 },
      { rows: 4, cols: 4, numberCount: 6 },
      { rows: 5, cols: 5, numberCount: 8 },
      { rows: 6, cols: 6, numberCount: 10 }
    ];
    
    testCases.forEach(({ rows, cols, numberCount }) => {
      const grid = generateGrid(rows, cols, numberCount, 'MEDIUM');
      
      expect(grid.length).toBe(rows);
      expect(grid[0].length).toBe(cols);
      
      const validationResult = validateGrid(grid, numberCount);
      expect(validationResult.isValid).toBe(true);
    });
  });
  
  it('devrait détecter une grille non valide', () => {
    // Créer manuellement une grille non valide
    const grid = (() => {
      const g = generateGrid(5, 5, 8, 'MEDIUM');
      // Supprimer intentionnellement un nombre
      for (let i = 0; i < g.length; i++) {
        for (let j = 0; j < g[i].length; j++) {
          if (g[i][j].value === 4) {
            g[i][j].value = null;
            return g;
          }
        }
      }
      return g;
    })();
    
    const validationResult = validateGrid(grid, 8);
    expect(validationResult.isValid).toBe(false);
    expect(validationResult.hasAllNumbers).toBe(false);
  });
});
