import { Path } from '../../../types/gameTypes';
import { generateTraceWithBacktracking } from './backtracking';

/**
 * Génère un tracé vraiment aléatoire qui couvre toute la grille
 */
export function generateRandomTrace(rows: number, cols: number, random: () => number): Path {
  // Utilise le backtracking sans points de départ/fin fixes pour un maximum d'aléatoire
  return generateTraceWithBacktracking(rows, cols, random);
} 