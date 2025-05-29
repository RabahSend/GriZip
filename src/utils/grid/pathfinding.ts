import { Grid, Coordinate, Path } from '../../types/gameTypes';
import { isValidCell, DIRECTIONS } from './traceGeneration/traceUtils';

/**
 * Trouve un chemin entre deux cellules (BFS simple)
 */
export function findPathBetweenCells(grid: Grid, start: Coordinate, end: Coordinate): boolean {
  // Calculer la distance de Manhattan entre le départ et l'arrivée
  const manhattanDistance = Math.abs(start.row - end.row) + Math.abs(start.col - end.col);
  
  // Augmenter la distance maximale autorisée pour permettre des chemins plus longs
  // Note : Cette heuristique pourrait être affinée ou rendue configurable
  if (manhattanDistance > 8) { // Augmenté de 6 à 8 pour plus de flexibilité
    return false;
  }
  
  // Cas spécial: Si on connecte 1 à 2, vérifier si 3 est sur le chemin (logique conservée)
  const startValue = grid[start.row][start.col].value;
  const endValue = grid[end.row][end.col].value;
  
  if (startValue === 1 && endValue === 2) {
    let pos3: Coordinate | null = null;
    for (let i = 0; i < grid.length; i++) {
      for (let j = 0; j < grid[i].length; j++) {
        if (grid[i][j].value === 3) {
          pos3 = { row: i, col: j };
          break;
        }
      }
      if (pos3) break;
    }
    
    if (pos3) {
      const minRow = Math.min(start.row, end.row);
      const maxRow = Math.max(start.row, end.row);
      const minCol = Math.min(start.col, end.col);
      const maxCol = Math.max(start.col, end.col);
      
      const is3InRectangle = pos3.row >= minRow && pos3.row <= maxRow && pos3.col >= minCol && pos3.col <= maxCol;
      if (is3InRectangle) {
        const dist2To3 = Math.abs(end.row - pos3.row) + Math.abs(end.col - pos3.col);
        if (dist2To3 > 1) {
          return false;
        }
      }
    }
  }
  
  const rows = grid.length;
  const cols = grid[0].length;
  const visited: boolean[][] = Array(rows).fill(false).map(() => Array(cols).fill(false));
  const queue: Coordinate[] = [start];
  visited[start.row][start.col] = true;
  
  while (queue.length > 0) {
    const current = queue.shift()!;
    
    if (current.row === end.row && current.col === end.col) {
      return true;
    }
    
    for (const dir of DIRECTIONS) {
      const newRow = current.row + dir.row;
      const newCol = current.col + dir.col;
      
      if (isValidCell(newRow, newCol, rows, cols) && !visited[newRow][newCol]) {
        const cell = grid[newRow][newCol];
        const isEmpty = cell.value === null;
        const isExactDestination = newRow === end.row && newCol === end.col;
        
        if (isEmpty || isExactDestination) {
          visited[newRow][newCol] = true;
          queue.push({row: newRow, col: newCol});
        }
      }
    }
  }
  
  return false;
}


/**
 * Trouve un chemin entre deux cellules et retourne le chemin complet (BFS avec reconstruction)
 * Respecte une matrice de cellules initialement visitées.
 */
export function findPathBetweenCellsWithPath(grid: Grid, start: Coordinate, end: Coordinate, initialVisited: boolean[][]): Path | false {
  // console.log(`[findPathBFS] Recherche chemin de (${start.row},${start.col}) vers (${end.row},${end.col})`); // Log détaillé facultatif
  const rows = grid.length;
  const cols = grid[0].length;
  
  // Copier la matrice des visites pour ne pas modifier l'originale
  const visited: boolean[][] = JSON.parse(JSON.stringify(initialVisited));
  
  // Pour reconstruire le chemin, on garde une trace du parent de chaque cellule
  const parent: Map<string, Coordinate> = new Map();
  
  // File d'attente pour BFS
  const queue: Coordinate[] = [start];
  // Marquer la cellule de départ comme visitée *dans la copie locale*
  // Note: `initialVisited` peut déjà marquer `start` comme true si elle faisait partie d'un segment précédent.
  // La destination `end` est démarquée comme `false` *avant* l'appel à cette fonction.
  if (isValidCell(start.row, start.col, rows, cols)) {
      // Ne pas écraser si déjà true
      visited[start.row][start.col] = true; 
  } else {
      console.error(`[findPathBFS] Point de départ invalide: (${start.row},${start.col})`);
      return false; // Point de départ invalide
  }
  
  let found = false;
  
  while (queue.length > 0 && !found) {
    const current = queue.shift()!;
    
    if (current.row === end.row && current.col === end.col) {
      found = true;
      // console.log(`[findPathBFS] Destination (${end.row},${end.col}) atteinte.`); // Log détaillé facultatif
      break;
    }
    
    for (const dir of DIRECTIONS) {
      const newRow = current.row + dir.row;
      const newCol = current.col + dir.col;
      
      if (isValidCell(newRow, newCol, rows, cols) && !visited[newRow][newCol]) {
        const cell = grid[newRow][newCol];
        const isEmpty = cell.value === null;
        const isExactDestination = newRow === end.row && newCol === end.col;
        
        // Autoriser le déplacement vers une cellule vide ou la destination exacte
        if (isEmpty || isExactDestination) {
          visited[newRow][newCol] = true;
          const nextCoord = {row: newRow, col: newCol};
          queue.push(nextCoord);
          // Enregistrer le parent pour reconstruire le chemin
          parent.set(`${newRow},${newCol}`, current);
        }
      }
    }
  }
  
  if (!found) {
    console.warn(`[findPathBFS] Chemin non trouvé de (${start.row},${start.col}) vers (${end.row},${end.col})`);
    return false;
  }
  
  // Reconstruire le chemin de la fin au début
  // console.log(`[findPathBFS] Reconstruction du chemin vers (${start.row},${start.col})`); // Log détaillé facultatif
  const path: Path = [];
  let current: Coordinate | null = end;
  let safetyCounter = 0;
  const maxPathLength = rows * cols * 2; // Sécurité contre boucle infinie
  
  while (current && (current.row !== start.row || current.col !== start.col)) {
     if (safetyCounter++ > maxPathLength) { // Sécurité
        console.error(`[findPathBFS] Boucle infinie suspectée lors de la reconstruction du chemin.`);
        return false;
     }
    path.unshift(current);
    const parentKey: string = `${current.row},${current.col}`;
    const foundParent = parent.get(parentKey);
    // console.log(`  Reconstruction: Current=(${current.row},${current.col}), ParentKey=${parentKey}, FoundParent=${JSON.stringify(foundParent)}`); // Log détaillé facultatif
    current = foundParent ?? null; 
  }
  
  // Si current est null ou si on n'a pas rejoint start, il y a un problème
  if (!current || current.row !== start.row || current.col !== start.col) {
       console.error(`[findPathBFS] Erreur lors de la reconstruction du chemin de (${end.row},${end.col}) vers (${start.row},${start.col}). Current: ${JSON.stringify(current)}`);
      return false; 
  }
  
  // Ajouter le point de départ au début
  path.unshift(start);
  // console.log(`[findPathBFS] Chemin reconstruit avec succès (longueur: ${path.length})`); // Log détaillé facultatif
  
  return path;
} 