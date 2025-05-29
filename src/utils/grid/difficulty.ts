import { Difficulty } from '../../types/gameTypes';

/**
 * Ajuste la difficulté en fonction du jour de la semaine
 */
export function adjustDifficultyByDay(): Difficulty {
  const day = new Date().getDay(); // 0 = dimanche, 1 = lundi, ..., 6 = samedi
  
  // Difficulté progressive au fil de la semaine
  if (day === 0) return 'HARD'; // Dimanche
  if (day <= 2) return 'EASY'; // Lundi, Mardi
  if (day <= 5) return 'MEDIUM'; // Mercredi, Jeudi, Vendredi
  return 'HARD'; // Samedi
} 