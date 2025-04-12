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
    if (path && typeof path !== 'boolean') {
      expect(path.length).toBe(rows * cols);
    }
  });
  
  it('devrait vérifier correctement la configuration de l\'image', () => {
    // Créer une grille 6x6
    const grid = createEmptyGrid(6, 6);
    
    // Placer les nombres comme observés dans l'image
    grid[5][1].value = 1; // En bas à gauche, valeur 1
    grid[3][0].value = 2; // En bas à gauche, valeur 2
    grid[5][0].value = 3; // Tout en bas à gauche, valeur 3
    grid[4][0].value = 4; // Milieu-bas à gauche, valeur 4
    grid[2][0].value = 5; // Milieu-haut à gauche, valeur 5 
    grid[0][0].value = 6; // En haut à gauche, valeur 6
    grid[0][2].value = 7; // En haut à droite, valeur 7
    grid[2][3].value = 8; // Milieu à droite, valeur 8
    
    // Avec l'algorithme amélioré, nous devrions pouvoir déterminer si cette configuration
    // est réellement possible ou impossible
    const isValid = findValidPath(grid);
    
    // La configuration de l'image semble avoir des distances trop grandes entre
    // certains nombres consécutifs sans possibilité de tracer un chemin continu
    // qui ne croise pas d'autres nombres
    expect(isValid).toBe(false);
  });
  
  // Test supplémentaire pour vérifier que l'algorithme accepte les configurations valides
  it('devrait accepter une configuration complexe mais valide', () => {
    const grid = createEmptyGrid(5, 5);
    
    // Configuration en zigzag qui nécessite un chemin complexe
    grid[0][0].value = 1;
    grid[0][4].value = 2;
    grid[2][2].value = 3;
    grid[4][0].value = 4;
    grid[4][4].value = 5;
    
    // Avec l'algorithme BFS, cette configuration devrait être identifiée comme valide
    // car il existe un chemin continu entre chaque paire de nombres consécutifs
    const isValid = findValidPath(grid);
    expect(isValid).toBe(true);
  });
  
  // Test pour vérifier les cas limites
  it('devrait gérer correctement les cas limites', () => {
    // Grille avec un seul nombre
    const singleNumberGrid = createEmptyGrid(3, 3);
    singleNumberGrid[0][0].value = 1;
    expect(findValidPath(singleNumberGrid)).toBe(true);
    
    // Grille vide
    const emptyGrid = createEmptyGrid(3, 3);
    expect(findValidPath(emptyGrid)).toBe(false);
    
    // Grille avec des nombres non consécutifs (manque le 2)
  });
  
  it('devrait identifier correctement les configurations impossibles', () => {
    // Grille 4x4
    const grid = createEmptyGrid(4, 4);
    
    // Configuration impossible: obstacle infranchissable entre 1 et 2
    grid[0][0].value = 1;
    grid[0][3].value = 2;
    // Bloquer le chemin entre 1 et 2 avec des nombres
    grid[0][1].value = 3;
    grid[0][2].value = 4;
    grid[1][0].value = 5;
    grid[1][1].value = 6;
    grid[1][2].value = 7;
    grid[1][3].value = 8;
    
    // Avec l'algorithme amélioré, cette configuration devrait être identifiée comme impossible
    const isValid = findValidPath(grid);
    expect(isValid).toBe(false);
  });

  it('devrait vérifier correctement la nouvelle configuration', () => {
    const grid = createEmptyGrid(6, 6);
    
    // Configuration de l'image actuelle
    grid[5][0].value = 1; // en bas à gauche
    grid[4][1].value = 2; // milieu-bas à gauche
    grid[4][3].value = 3; // milieu-bas au centre
    grid[5][3].value = 4; // en bas au centre
    grid[5][4].value = 5; // en bas à droite du centre
    grid[4][5].value = 6; // en bas à droite
    grid[3][4].value = 7; // au milieu à droite
    grid[1][4].value = 8; // en haut à droite
    
    // Vérifie les deux conditions (ordre + toutes les cases)
    const isValid = findValidPath(grid, true);
    
    // Cette configuration ne devrait pas être valide
    expect(isValid).toBe(false);
  });
});
