import { Path, Coordinate } from '../../../types/gameTypes';

/**
 * Méthode alternative qui génère un tracé en spirale plus simple
 * Cette fonction est utilisée comme fallback si l'autre méthode échoue
 */
export function generateSimpleSpiralTrace(rows: number, cols: number): Path {
  const trace: Path = [];
  
  // Commencer par le coin supérieur gauche
  let top = 0, bottom = rows - 1;
  let left = 0, right = cols - 1;
  
  while (top <= bottom && left <= right) {
    // Parcourir de gauche à droite sur la rangée supérieure
    for (let col = left; col <= right; col++) {
      trace.push({ row: top, col });
    }
    top++;
    
    // Parcourir de haut en bas sur la colonne droite
    for (let row = top; row <= bottom; row++) {
      trace.push({ row, col: right });
    }
    right--;
    
    // Parcourir de droite à gauche sur la rangée inférieure (si nécessaire)
    if (top <= bottom) {
      for (let col = right; col >= left; col--) {
        trace.push({ row: bottom, col });
      }
      bottom--;
    }
    
    // Parcourir de bas en haut sur la colonne gauche (si nécessaire)
    if (left <= right) {
      for (let row = bottom; row >= top; row--) {
        trace.push({ row, col: left });
      }
      left++;
    }
  }
  
  return trace;
} 