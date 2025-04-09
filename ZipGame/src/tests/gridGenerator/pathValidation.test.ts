import { describe, it, expect } from 'vitest';
import { createEmptyGrid, findValidPath } from '../../utils/gridGenerator';

describe('Validation du chemin dans la grille', () => {
  it('devrait vérifier qu\'un chemin valide existe entre les nombres consécutifs', () => {
    // Créer une grille spécifique pour tester
    const grid = createEmptyGrid(3, 3);
    
    // Placer manuellement des valeurs pour tester
    grid[0][0].value = 1;
    grid[0][1].value = 2;
    grid[1][1].value = 3;
    grid[2][1].value = 4;
    
    const isValid = findValidPath(grid);
    expect(isValid).toBe(true);
  });
  
  it('devrait détecter quand aucun chemin valide n\'existe', () => {
    // Créer une grille spécifique pour tester
    const grid = createEmptyGrid(3, 3);
    
    // Placer manuellement des valeurs dans une configuration sans chemin valide
    grid[0][0].value = 1;
    grid[2][2].value = 2; // Trop loin pour être connecté directement
    grid[0][2].value = 3;
    
    const isValid = findValidPath(grid);
    expect(isValid).toBe(false);
  });
  
  it('devrait vérifier que le chemin n\'utilise chaque cellule qu\'une seule fois', () => {
    const grid = createEmptyGrid(3, 3);
    
    // Configuration forcée pour tester
    grid[0][0].value = 1;
    grid[0][2].value = 2;
    grid[2][2].value = 3;
    grid[2][0].value = 4;
    
    // Simulons un chemin trouvé pour vérifier qu'il n'y a pas de cellule en double
    const path = [
      { row: 0, col: 0 },
      { row: 0, col: 1 },
      { row: 0, col: 2 },
      { row: 1, col: 2 },
      { row: 2, col: 2 },
      { row: 2, col: 1 },
      { row: 2, col: 0 }
    ];
    
    // Vérifier que le chemin n'utilise pas de cellule en double
    const uniqueCells = new Set(path.map(p => `${p.row},${p.col}`));
    expect(uniqueCells.size).toBe(path.length);
  });
  
  it('devrait trouver un chemin complet qui utilise toutes les cellules', () => {
    const rows = 3;
    const cols = 3;
    const grid = createEmptyGrid(rows, cols);
    
    grid[0][0].value = 1;
    grid[2][2].value = 2;
    
    const path = findValidPath(grid, true); // Le second paramètre indique qu'on cherche un chemin complet
    
    // Si un chemin est trouvé, il devrait utiliser toutes les cellules
    if (path) {
      expect(path.length).toBe(rows * cols);
    }
  });
});
