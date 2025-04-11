import { describe, it, expect } from 'vitest';
import { generateGrid, validateGrid } from '../../utils/gridGenerator';

describe('Génération et validation complète de la grille', () => {
  it('devrait générer la même grille pour une date donnée', () => {
    const date1 = new Date('2024-03-15');
    const date2 = new Date('2024-03-15');
    const differentDate = new Date('2024-03-16');
    
    const rows = 5;
    const cols = 5;
    const numberCount = 8;
    const difficulty = 'MEDIUM';
    
    // Générer deux grilles avec la même date
    const grid1 = generateGrid(rows, cols, numberCount, difficulty, date1);
    const grid2 = generateGrid(rows, cols, numberCount, difficulty, date2);
    
    // Générer une grille avec une date différente
    const grid3 = generateGrid(rows, cols, numberCount, difficulty, differentDate);
    
    // Les grilles avec la même date devraient être identiques
    expect(JSON.stringify(grid1)).toBe(JSON.stringify(grid2));
    
    // La grille avec une date différente devrait être différente
    expect(JSON.stringify(grid1)).not.toBe(JSON.stringify(grid3));
    
    // Vérifier que toutes les grilles sont valides
    expect(validateGrid(grid1.grid, numberCount).isValid).toBe(true);
    expect(validateGrid(grid2.grid, numberCount).isValid).toBe(true);
    expect(validateGrid(grid3.grid, numberCount).isValid).toBe(true);
  });
  
  it('devrait générer des grilles valides pour différentes dates', () => {
    const testDates = [
      new Date('2024-01-01'),
      new Date('2024-06-15'),
      new Date('2024-12-31'),
    ];
    
    const rows = 5;
    const cols = 5;
    const numberCount = 8;
    const difficulty = 'MEDIUM';
    
    testDates.forEach(date => {
      const grid = generateGrid(rows, cols, numberCount, difficulty, date);
      
      // Vérifier les dimensions
      expect(grid.grid.length).toBe(rows);
      expect(grid.grid[0].length).toBe(cols);
      
      // Vérifier que les nombres sont présents
      const numbers = new Set<number>();
      for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
          if (grid.grid[i][j].value !== null) {
            numbers.add(grid.grid[i][j].value as number);
          }
        }
      }
      
      expect(numbers.size).toBe(numberCount);
      for (let i = 1; i <= numberCount; i++) {
        expect(numbers.has(i)).toBe(true);
      }
      
      // Vérifier que la grille est valide
      const validationResult = validateGrid(grid.grid, numberCount);
      expect(validationResult.isValid).toBe(true);
    });
  });
  
  it('devrait générer des grilles de tailles différentes avec seed de date', () => {
    const testCases = [
      { rows: 3, cols: 3, numberCount: 4 },
      { rows: 4, cols: 4, numberCount: 6 },
      { rows: 5, cols: 5, numberCount: 8 },
      { rows: 6, cols: 6, numberCount: 10 }
    ];
    
    const testDate = new Date('2024-03-15');
    
    testCases.forEach(({ rows, cols, numberCount }) => {
      const grid = generateGrid(rows, cols, numberCount, 'MEDIUM', testDate);
      
      expect(grid.grid.length).toBe(rows);
      expect(grid.grid[0].length).toBe(cols);
      
      const validationResult = validateGrid(grid.grid, numberCount);
      expect(validationResult.isValid).toBe(true);
    });
  });
  
  it('devrait détecter une grille non valide', () => {
    const testDate = new Date('2024-03-15');
    
    // Créer manuellement une grille non valide
    const grid = (() => {
      const g = generateGrid(5, 5, 8, 'MEDIUM', testDate);
      // Supprimer intentionnellement un nombre
      for (let i = 0; i < g.grid.length; i++) {
        for (let j = 0; j < g.grid[i].length; j++) {
          if (g.grid[i][j].value === 4) {
            g.grid[i][j].value = null;
            return g;
          }
        }
      }
      return g;
    })();
    
    const validationResult = validateGrid(grid.grid, 8);
    expect(validationResult.isValid).toBe(false);
    expect(validationResult.hasAllNumbers).toBe(false);
  });
});
