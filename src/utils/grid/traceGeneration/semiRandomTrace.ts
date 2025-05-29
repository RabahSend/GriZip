import { Path, Coordinate } from '../../../types/gameTypes';
import { generateTraceWithBacktracking } from './backtracking';

/**
 * Génère un tracé semi-aléatoire avec le début et la fin fixés à améliorer pour rendre ça moins aléatoire
 */
export function generateSemiRandomTrace(rows: number, cols: number, random: () => number): Path {
  // Définir les points de départ possibles (ex: coins)
  const startPoints: Coordinate[] = [
    { row: 0, col: 0 },
    { row: 0, col: cols - 1 },
    { row: rows - 1, col: 0 },
    { row: rows - 1, col: cols - 1 }
  ];
  
  // Définir les points de fin possibles (ex: opposés ou proches du centre)
  // Assurer qu'ils sont différents du point de départ
  const endPoints: Coordinate[] = [
    { row: rows - 1, col: cols - 1 },
    { row: rows - 1, col: 0 },
    { row: 0, col: cols - 1 },
    { row: 0, col: 0 },
    { row: Math.floor(rows / 2), col: Math.floor(cols / 2) } // Centre approximatif
  ];
  
  // Sélectionner aléatoirement un point de départ
  const startIndex = Math.floor(random() * startPoints.length);
  const startPoint = startPoints[startIndex];
  
  // Filtrer les points de fin pour exclure le point de départ et sélectionner aléatoirement
  const possibleEndPoints = endPoints.filter(p => p.row !== startPoint.row || p.col !== startPoint.col);
  const endIndex = Math.floor(random() * possibleEndPoints.length);
  const endPoint = possibleEndPoints[endIndex];
  
  // Générer le tracé avec les points fixes
  return generateTraceWithBacktracking(rows, cols, random, startPoint, endPoint);
} 