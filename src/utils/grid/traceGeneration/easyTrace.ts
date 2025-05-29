import { Path, Coordinate } from '../../../types/gameTypes';
import { generateSerpentineTrace } from './serpentine';
import { generateSimpleSpiralTrace } from './spiral';
import { shuffleArray } from '../../commonUtils';

/**
 * Génère un tracé en zigzag
 */
export function generateEasyTrace(rows: number, cols: number, random: () => number): Path {
  // Choisir aléatoirement entre les deux types de tracés
  let originalTrace: Path;
  
  if (random() < 0.5) {
    // 50% de chance de générer un tracé serpentin
    originalTrace = generateSerpentineTrace(rows, cols);
  } else {
    // 50% de chance de générer un tracé en spirale
    originalTrace = generateSimpleSpiralTrace(rows, cols);
  }
  
  // Sélectionner aléatoirement un angle de rotation (90°, 180° ou 270°)
  const rotationAngles = [90, 180, 270];
  const selectedAngle = rotationAngles[Math.floor(random() * rotationAngles.length)];
  
  // Appliquer la rotation au tracé
  const rotatedTrace: Path = [];
  
  for (const point of originalTrace) {
    let newPoint: Coordinate;
    
    switch (selectedAngle) {
      case 90:
        // (row, col) → (col, rows-1-row)
        newPoint = { row: point.col, col: rows - 1 - point.row };
        break;
      case 180:
        // (row, col) → (rows-1-row, cols-1-col)
        newPoint = { row: rows - 1 - point.row, col: cols - 1 - point.col };
        break;
      case 270:
        // (row, col) → (cols-1-col, row)
        newPoint = { row: cols - 1 - point.col, col: point.row };
        break;
      default:
        newPoint = { ...point }; // Pas de rotation (ne devrait pas arriver)
    }
    
    rotatedTrace.push(newPoint);
  }
  
  // Optionnel: Mélanger légèrement le tracé final pour ajouter une petite variation
  // shuffleArray(rotatedTrace, random); // Décommenter si vous voulez un peu plus d'aléatoire
  
  return rotatedTrace;
} 