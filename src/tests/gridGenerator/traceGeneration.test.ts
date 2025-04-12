import { generateRandomTrace } from '../../utils/gridGenerator';
import { Path, Coordinate } from '../../types/gameTypes';
import { describe, it, expect } from 'vitest';

describe('Génération du tracé', () => {
  // Fonction utilitaire pour vérifier si deux points sont adjacents
  function areAdjacent(point1: Coordinate, point2: Coordinate): boolean {
    const rowDiff = Math.abs(point1.row - point2.row);
    const colDiff = Math.abs(point1.col - point2.col);
    // Deux points sont adjacents s'ils partagent une arête (pas en diagonale)
    return (rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1);
  }

  // Fonction utilitaire pour vérifier si un point est dans la grille
  function isInGrid(point: Coordinate, rows: number, cols: number): boolean {
    return point.row >= 0 && point.row < rows && point.col >= 0 && point.col < cols;
  }

  it('devrait générer un tracé continu qui couvre toute la grille', () => {
    // Tester différentes tailles de grille
    const testCases = [
      { rows: 3, cols: 3 },
      { rows: 4, cols: 4 },
      { rows: 5, cols: 3 },
      { rows: 3, cols: 5 }
    ];

    for (const { rows, cols } of testCases) {
      // Créer un générateur de nombres aléatoires déterministe pour les tests
      const mockRandom = () => 0.5;
      
      // Générer le tracé
      const trace = generateRandomTrace(rows, cols, mockRandom);

      console.log("Trace générée: " + trace.length);

      // 1. Vérifier que le tracé contient le bon nombre de points
      expect(trace.length).toBe(rows * cols);

      // 2. Vérifier que tous les points sont dans la grille
      expect(trace.every(point => isInGrid(point, rows, cols))).toBe(true);

      // 3. Vérifier que chaque point n'apparaît qu'une seule fois
      const visited = new Set<string>();
      trace.forEach(point => {
        const key = `${point.row},${point.col}`;
        expect(visited.has(key)).toBe(false);
        visited.add(key);
      });

      // 4. Vérifier que tous les points de la grille sont couverts
      expect(visited.size).toBe(rows * cols);

      // 5. Vérifier la continuité du tracé
      for (let i = 0; i < trace.length - 1; i++) {
        const current = trace[i];
        const next = trace[i + 1];
        
        expect(areAdjacent(current, next)).toBe(true);
      }
    }
  });

  it('devrait gérer les cas limites', () => {
    // Tester une grille 1x1
    const trace1x1 = generateRandomTrace(1, 1, () => 0.5);
    expect(trace1x1.length).toBe(1);
    expect(trace1x1[0]).toEqual({ row: 0, col: 0 });

    // Tester une grille 1xN
    const trace1x3 = generateRandomTrace(1, 3, () => 0.5);
    expect(trace1x3.length).toBe(3);
    for (let i = 0; i < trace1x3.length - 1; i++) {
      expect(areAdjacent(trace1x3[i], trace1x3[i + 1])).toBe(true);
    }

    // Tester une grille Nx1
    const trace3x1 = generateRandomTrace(3, 1, () => 0.5);
    expect(trace3x1.length).toBe(3);
    for (let i = 0; i < trace3x1.length - 1; i++) {
      expect(areAdjacent(trace3x1[i], trace3x1[i + 1])).toBe(true);
    }
  });

  it('devrait produire des tracés différents avec des seeds différents', () => {
    const rows = 4;
    const cols = 4;
    const trace1 = generateRandomTrace(rows, cols, () => 0.3);
    const trace2 = generateRandomTrace(rows, cols, () => 0.7);

    // Les tracés devraient être différents
    let isDifferent = false;
    for (let i = 0; i < trace1.length; i++) {
      if (trace1[i].row !== trace2[i].row || trace1[i].col !== trace2[i].col) {
        isDifferent = true;
        break;
      }
    }
    expect(isDifferent).toBe(true);

    // Mais ils devraient tous les deux être valides
    for (const trace of [trace1, trace2]) {
      // Vérifier la continuité
      for (let i = 0; i < trace.length - 1; i++) {
        expect(areAdjacent(trace[i], trace[i + 1])).toBe(true);
      }
      // Vérifier la couverture
      expect(trace.length).toBe(rows * cols);
    }
  });
}); 