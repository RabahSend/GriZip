import { Path, Coordinate } from '../../../types/gameTypes';

/**
 * Génère un tracé en serpentin (alternant gauche-droite puis droite-gauche)
 * Cette fonction est maintenant utilisée comme solution de repli
 */
export function generateSerpentineTrace(rows: number, cols: number): Path {
  // Pré-allocation du tableau pour éviter les redimensionnements
  const trace: Path = new Array(rows * cols);
  let index = 0;
  
  for (let r = 0; r < rows; r++) {
    const goingRight = (r % 2 === 0);
    
    for (let c = 0; c < cols; c++) {
      const actualCol = goingRight ? c : cols - 1 - c;
      trace[index++] = { row: r, col: actualCol };
    }
  }
  
  return trace;
} 