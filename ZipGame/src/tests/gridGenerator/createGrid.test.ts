import { describe, it, expect } from 'vitest';
import { createEmptyGrid } from '../../utils/gridGenerator';

describe('Création de la grille de base', () => {
  it('devrait créer une grille vide avec les dimensions spécifiées', () => {
    const rows = 5;
    const cols = 5;
    const grid = createEmptyGrid(rows, cols);
    
    expect(grid.length).toBe(rows);
    expect(grid[0].length).toBe(cols);
    
    // Vérification que toutes les cellules sont initialisées correctement
    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
        expect(grid[i][j]).toEqual({
          row: i,
          col: j,
          value: null,
          isPartOfPath: false,
          isSelected: false
        });
      }
    }
  });

  it('devrait créer des grilles de différentes tailles', () => {
    const testCases = [
      { rows: 3, cols: 3 },
      { rows: 4, cols: 4 },
      { rows: 5, cols: 6 },
      { rows: 7, cols: 7 }
    ];
    
    testCases.forEach(({ rows, cols }) => {
      const grid = createEmptyGrid(rows, cols);
      expect(grid.length).toBe(rows);
      expect(grid[0].length).toBe(cols);
    });
  });
  
  it('devrait gérer les cas limites pour les dimensions de la grille', () => {
    // Dimension minimale
    const minGrid = createEmptyGrid(2, 2);
    expect(minGrid.length).toBe(2);
    expect(minGrid[0].length).toBe(2);
    
    // Grande grille
    const largeGrid = createEmptyGrid(10, 10);
    expect(largeGrid.length).toBe(10);
    expect(largeGrid[0].length).toBe(10);
    
    // Grille non carrée
    const nonSquareGrid = createEmptyGrid(3, 7);
    expect(nonSquareGrid.length).toBe(3);
    expect(nonSquareGrid[0].length).toBe(7);
  });
}); 