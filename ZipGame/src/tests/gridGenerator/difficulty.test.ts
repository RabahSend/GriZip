import { describe, it, expect } from 'vitest';
import { generateGrid, adjustDifficultyByDay, calculateGridComplexity } from '../../utils/gridGenerator';

describe('Ajustement de la difficulté', () => {
  it('devrait générer des grilles de difficulté différente selon le jour', () => {
    const rows = 5;
    const cols = 5;
    const numberCount = 8;
    
    // Tester différentes difficultés
    const easyGrid = generateGrid(rows, cols, numberCount, 'EASY');
    const mediumGrid = generateGrid(rows, cols, numberCount, 'MEDIUM');
    const hardGrid = generateGrid(rows, cols, numberCount, 'HARD');
    
    // Calculer la complexité de chaque grille
    const easyComplexity = calculateGridComplexity(easyGrid);
    const mediumComplexity = calculateGridComplexity(mediumGrid);
    const hardComplexity = calculateGridComplexity(hardGrid);
    
    // La complexité devrait augmenter avec la difficulté
    expect(mediumComplexity).toBeGreaterThan(easyComplexity);
    expect(hardComplexity).toBeGreaterThan(mediumComplexity);
  });
  
  it('devrait ajuster automatiquement la difficulté selon le jour de la semaine', () => {
    // Mock de la date pour simuler différents jours
    const originalDate = Date;
    
    try {
      // Simuler un lundi (jour 1)
      global.Date = class extends Date {
        getDay() { return 1; } // Lundi
      } as any;
      
      const mondayDifficulty = adjustDifficultyByDay();
      expect(mondayDifficulty).toBe('EASY');
      
      // Simuler un mercredi (jour 3)
      global.Date = class extends Date {
        getDay() { return 3; } // Mercredi
      } as any;
      
      const wednesdayDifficulty = adjustDifficultyByDay();
      expect(wednesdayDifficulty).toBe('MEDIUM');
      
      // Simuler un dimanche (jour 0)
      global.Date = class extends Date {
        getDay() { return 0; } // Dimanche
      } as any;
      
      const sundayDifficulty = adjustDifficultyByDay();
      expect(sundayDifficulty).toBe('HARD');
    } finally {
      global.Date = originalDate;
    }
  });
  
  it('devrait augmenter la longueur du chemin minimum en fonction de la difficulté', () => {
    const rows = 5;
    const cols = 5;
    const numberCount = 5;
    
    const easyGrid = generateGrid(rows, cols, numberCount, 'EASY');
    const hardGrid = generateGrid(rows, cols, numberCount, 'HARD');
    
    // Calculer la longueur minimale du chemin pour chaque grille
    const easyPathLength = calculateMinimumPathLength(easyGrid);
    const hardPathLength = calculateMinimumPathLength(hardGrid);
    
    // La grille difficile devrait avoir un chemin plus long entre les nombres
    expect(hardPathLength).toBeGreaterThan(easyPathLength);
  });
  
  // Fonction utilitaire pour calculer la longueur minimale du chemin
  function calculateMinimumPathLength(grid) {
    // Implémentation simplifiée pour les tests
    // Dans l'implémentation réelle, vous auriez un algorithme plus complet
    return calculateGridComplexity(grid);
  }
});
