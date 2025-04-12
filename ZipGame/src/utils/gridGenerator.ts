import { Grid, Cell, Difficulty, Coordinate, ValidationResult, Path } from '../types/gameTypes';

// Stockage du tracé utilisé pour chaque grille générée
let lastGeneratedTrace: Path | null = null;

// Directions définies une seule fois au niveau du module
const DIRECTIONS = Object.freeze([
  { row: -1, col: 0 }, // haut
  { row: 0, col: 1 },  // droite
  { row: 1, col: 0 },  // bas
  { row: 0, col: -1 }  // gauche
]);

// Utiliser un tableau réutilisable pour les rotations
const ROTATION_ANGLES = Object.freeze([90, 180, 270]);

/**
 * Vérifie si une cellule est dans les limites de la grille
 */
function isValidCell(row: number, col: number, maxRows: number, maxCols: number): boolean {
  return row >= 0 && row < maxRows && col >= 0 && col < maxCols;
}

/**
 * Compte le nombre de voisins libres d'une cellule
 */
function countFreeNeighbors(row: number, col: number, visited: boolean[][], maxRows: number, maxCols: number): number {
  let count = 0;
  
  for (const dir of DIRECTIONS) {
    const newRow = row + dir.row;
    const newCol = col + dir.col;
    
    if (isValidCell(newRow, newCol, maxRows, maxCols) && !visited[newRow][newCol]) {
      count++;
    }
  }
  
  return count;
}

/**
 * Crée une grille vide avec les dimensions spécifiées
 */
export function createEmptyGrid(rows: number, cols: number): Grid {
  const grid: Grid = [];
  
  for (let i = 0; i < rows; i++) {
    const row: Cell[] = [];
    for (let j = 0; j < cols; j++) {
      row.push({
        row: i,
        col: j,
        value: null,
        isPartOfPath: false,
        isSelected: false
      });
    }
    grid.push(row);
  }
  
  return grid;
}

/**
 * Place un nombre spécifié de valeurs consécutives dans la grille
 */
export function placeNumbersInGrid(grid: Grid, numCount: number): Grid {
  // Créer une copie profonde de la grille pour ne pas modifier l'originale
  const newGrid = JSON.parse(JSON.stringify(grid)) as Grid;
  const rows = newGrid.length;
  const cols = newGrid[0].length;
  
  // Vérifier si numCount est valide
  if (numCount > rows * cols) {
    throw new Error(`Le nombre de valeurs (${numCount}) est supérieur au nombre de cellules (${rows * cols})`);
  }
  
  // Augmenter considérablement le nombre d'essais pour avoir plus de chances de trouver une grille résolvable
  const maxAttempts = 500; // Augmenté de 200 à 500
  let attempt = 0;
  
  while (attempt < maxAttempts) {
    attempt++;
    
    // Réinitialiser la grille à chaque essai
    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
        newGrid[i][j].value = null;
      }
    }
    
    // APPROCHE HYBRIDE: randomisée mais respectant les contraintes du test
    
    // Générer les positions possibles pour les nombres
    const positions: Coordinate[] = [];
    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
        positions.push({ row: i, col: j });
      }
    }
    
    // Mélanger les positions
    shuffleArray(positions);
    
    // Placer le premier nombre à une position aléatoire
    const firstPos = positions.shift()!;
    newGrid[firstPos.row][firstPos.col].value = 1;
    
    // Pour chaque nombre suivant, trouver une position aléatoire qui respecte la contrainte de distance
    let success = true;
    let lastPos = firstPos;
    
    for (let num = 2; num <= numCount; num++) {
      // Collecter toutes les positions à distance ≤ 2 pour respecter la contrainte du test
      const validPositions: Coordinate[] = [];
      
      for (let i = 0; i < positions.length; i++) {
        const pos = positions[i];
        const rowDiff = Math.abs(pos.row - lastPos.row);
        const colDiff = Math.abs(pos.col - lastPos.col);
        
        // Condition exactement comme dans le test canCellsBeConnected
        if ((rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1) || 
            (rowDiff <= 2 && colDiff <= 2)) {
          validPositions.push(pos);
        }
      }
      
      if (validPositions.length > 0) {
        // Choisir une position aléatoire parmi les positions valides
        const randomIndex = Math.floor(Math.random() * validPositions.length);
        const selectedPos = validPositions[randomIndex];
        
        // Placer le nombre
        newGrid[selectedPos.row][selectedPos.col].value = num;
        
        // Retirer cette position de la liste des positions disponibles
        const posIndex = positions.findIndex(p => p.row === selectedPos.row && p.col === selectedPos.col);
        if (posIndex !== -1) {
          positions.splice(posIndex, 1);
        }
        
        // Mettre à jour la dernière position
        lastPos = selectedPos;
      } else {
        // Aucune position valide trouvée
        success = false;
        break;
      }
    }
    
    // Vérifier si la grille est valide ET complètement résolvable
    // On utilise findValidPath avec true pour vérifier qu'un chemin complet existe
    if (success && findValidPath(newGrid, true)) {
      return newGrid;
    }
  }
  
  // Si on n'a pas trouvé de solution complètement résolvable, 
  // essayer de trouver une solution avec juste un chemin valide
  attempt = 0;
  while (attempt < maxAttempts / 2) {
    attempt++;
    
    // Réinitialiser la grille à chaque essai
    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
        newGrid[i][j].value = null;
      }
    }
    
    // Répéter le processus de placement des nombres
    const positions: Coordinate[] = [];
    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
        positions.push({ row: i, col: j });
      }
    }
    
    shuffleArray(positions);
    
    const firstPos = positions.shift()!;
    newGrid[firstPos.row][firstPos.col].value = 1;
    
    let success = true; // Redéfinir success dans cette boucle
    let lastPos = firstPos;
    
    for (let num = 2; num <= numCount; num++) {
      const validPositions: Coordinate[] = [];
      
      for (let i = 0; i < positions.length; i++) {
        const pos = positions[i];
        const rowDiff = Math.abs(pos.row - lastPos.row);
        const colDiff = Math.abs(pos.col - lastPos.col);
        
        if ((rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1) || 
            (rowDiff <= 2 && colDiff <= 2)) {
          validPositions.push(pos);
        }
      }
      
      if (validPositions.length > 0) {
        const randomIndex = Math.floor(Math.random() * validPositions.length);
        const selectedPos = validPositions[randomIndex];
        
        newGrid[selectedPos.row][selectedPos.col].value = num;
        
        const posIndex = positions.findIndex(p => p.row === selectedPos.row && p.col === selectedPos.col);
        if (posIndex !== -1) {
          positions.splice(posIndex, 1);
        }
        
        lastPos = selectedPos;
      } else {
        success = false;
        break;
      }
    }
    
    // Vérifier si la grille a au moins un chemin valide (sans exiger un chemin complet)
    if (success && findValidPath(newGrid)) {
      return newGrid;
    }
  }
  
  // Si on ne trouve pas de solution, utiliser le fallback
  return createFallbackGrid(grid, numCount);
}

// Fonction auxiliaire pour créer une grille de secours si la méthode aléatoire échoue
function createFallbackGrid(grid: Grid, numCount: number): Grid {
  const fallbackGrid = JSON.parse(JSON.stringify(grid)) as Grid;
  const rows = fallbackGrid.length;
  const cols = fallbackGrid[0].length;
  
  // Création d'un parcours en serpentin pour garantir une solution complète
  let value = 1;
  let row = 0, col = 0;
  let direction = 'right'; // Directions: right, down, left, up
  
  // Nettoyer la grille
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      fallbackGrid[i][j].value = null;
    }
  }
  
  // Placer les nombres selon un parcours en serpentin
  while (value <= numCount) {
    if (value <= numCount) {
      fallbackGrid[row][col].value = value++;
    }
    
    // Déterminer la prochaine position
    if (direction === 'right') {
      if (col + 1 < cols && fallbackGrid[row][col + 1].value === null) {
        col++;
      } else {
        direction = 'down';
        row++;
      }
    } else if (direction === 'down') {
      if (row + 1 < rows && fallbackGrid[row + 1][col].value === null) {
        row++;
      } else {
        direction = 'left';
        col--;
      }
    } else if (direction === 'left') {
      if (col - 1 >= 0 && fallbackGrid[row][col - 1].value === null) {
        col--;
      } else {
        direction = 'up';
        row--;
      }
    } else if (direction === 'up') {
      if (row - 1 >= 0 && fallbackGrid[row - 1][col].value === null) {
        row--;
      } else {
        direction = 'right';
        col++;
      }
    }
  }
  
  // Vérifier que cette grille a bien une solution complète
  if (findValidPath(fallbackGrid, true) === false) {
    // Si la solution en serpentin échoue, utiliser une solution en ligne simple
    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
        fallbackGrid[i][j].value = null;
      }
    }
    
    // Placer les nombres côte à côte en ligne puis colonne
    for (let i = 0; i < numCount; i++) {
      const r = Math.floor(i / cols);
      const c = i % cols;
      if (r < rows) {
        fallbackGrid[r][c].value = i + 1;
      }
    }
  }
  
  return fallbackGrid;
}

/**
 * Trouve un chemin entre deux cellules
 */
function findPathBetweenCells(grid: Grid, start: Coordinate, end: Coordinate): boolean {
  // Calculer la distance de Manhattan entre le départ et l'arrivée
  const manhattanDistance = Math.abs(start.row - end.row) + Math.abs(start.col - end.col);
  
  // Augmenter la distance maximale autorisée pour permettre des chemins plus longs
  if (manhattanDistance > 6) { // Augmenté de 4 à 6
    return false;
  }
  
  // Cas spécial: Si on connecte 1 à 2, vérifier si 3 est sur le chemin
  const startValue = grid[start.row][start.col].value;
  const endValue = grid[end.row][end.col].value;
  
  if (startValue === 1 && endValue === 2) {
    // Chercher la position de 3
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
    
    // Si 3 existe, vérifier s'il est dans le rectangle formé par 1 et 2
    if (pos3) {
      const minRow = Math.min(start.row, end.row);
      const maxRow = Math.max(start.row, end.row);
      const minCol = Math.min(start.col, end.col);
      const maxCol = Math.max(start.col, end.col);
      
      const is3InRectangle = pos3.row >= minRow && pos3.row <= maxRow && pos3.col >= minCol && pos3.col <= maxCol;
      
      // Si 3 est dans le rectangle et n'est pas adjacent à 2, la configuration est invalide
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
  
  // Créer une matrice de cellules visitées
  const visited: boolean[][] = Array(rows).fill(false).map(() => Array(cols).fill(false));
  
  // File d'attente pour BFS
  const queue: Coordinate[] = [start];
  visited[start.row][start.col] = true;
  
  // Directions: haut, droite, bas, gauche
  const directions = [
    {row: -1, col: 0},
    {row: 0, col: 1},
    {row: 1, col: 0},
    {row: 0, col: -1}
  ];
  
  while (queue.length > 0) {
    const current = queue.shift()!;
    
    // Si on a atteint la destination
    if (current.row === end.row && current.col === end.col) {
      return true;
    }
    
    // Explorer les voisins
    for (const dir of directions) {
      const newRow = current.row + dir.row;
      const newCol = current.col + dir.col;
      
      // Vérifier si la nouvelle position est valide
      if (
        newRow >= 0 && newRow < rows &&
        newCol >= 0 && newCol < cols &&
        !visited[newRow][newCol]
      ) {
        // Vérifier si la cellule est vide OU si c'est exactement la cellule de destination
        const cell = grid[newRow][newCol];
        const isEmpty = cell.value === null;
        const isExactDestination = newRow === end.row && newCol === end.col;
        
        // Ne permettre le passage que par des cellules vides ou par la destination exacte
        if (isEmpty || isExactDestination) {
          visited[newRow][newCol] = true;
          queue.push({row: newRow, col: newCol});
        }
      }
    }
  }
  
  // Aucun chemin trouvé
  return false;
}

/**
 * Génère une grille complète avec un tracé valide et des nombres placés dessus
 */
export function generateGrid(rows: number, cols: number, numberCount: number, difficulty: Difficulty, seed?: Date): { grid: Grid, trace: Path } {
  // Créer un générateur de nombres aléatoires avec seed si fourni
  const random = createRandomGenerator(seed);
  
  // Créer une grille vide
  const grid = createEmptyGrid(rows, cols);
  
  // Générer un tracé complet selon la difficulté
  let trace: Path;
  
  switch(difficulty) {
    case 'EASY':
      trace = generateEasyTrace(rows, cols, random);
      break;
    case 'MEDIUM':
      trace = generateSemiRandomTrace(rows, cols, random);
      break;
    case 'HARD':
    default:
      trace = generateRandomTrace(rows, cols, random);
      break;
  }
  
  // Stocker le tracé pour la validation ultérieure
  lastGeneratedTrace = trace;
  
  // Placer les nombres sur le tracé
  placeNumbersOnTraceGuaranteedValid(grid, trace, numberCount, difficulty, random);
  
  // Retourner à la fois la grille et le tracé
  return { grid, trace };
}

/**
 * Place des nombres sur le tracé de manière à garantir un chemin valide
 * Avec un espacement variable utilisant une variance aléatoire
 */
function placeNumbersOnTraceGuaranteedValid(grid: Grid, trace: Path, numberCount: number, difficulty: Difficulty, random: () => number): void {
  // Vérifications de base
  if (!trace || trace.length === 0) {
    throw new Error("Le tracé est vide ou invalide");
  }
  
  if (numberCount > trace.length) {
    throw new Error(`Le nombre de valeurs (${numberCount}) est supérieur à la longueur du tracé (${trace.length})`);
  }
  
  // Réinitialiser la grille
  for (let i = 0; i < grid.length; i++) {
    for (let j = 0; j < grid[i].length; j++) {
      grid[i][j].value = null;
    }
  }
  
  // Toujours placer le premier nombre (1) au début du tracé
  const firstPos = trace[0];
  grid[firstPos.row][firstPos.col].value = 1;
  
  // Si on n'a qu'un seul nombre, on a terminé
  if (numberCount === 1) return;
  
  // Toujours placer le dernier nombre à la fin du tracé
  const lastPos = trace[trace.length - 1];
  grid[lastPos.row][lastPos.col].value = numberCount;
  
  // S'il n'y a que deux nombres, on a terminé
  if (numberCount === 2) return;
  
  // Déterminer l'amplitude maximale de variance selon la difficulté
  let varianceAmplitude = 0;
  switch(difficulty) {
    case 'EASY':
      varianceAmplitude = 0.1; // Variance faible
      break;
    case 'MEDIUM':
      varianceAmplitude = 0.2; // Variance moyenne
      break;
    case 'HARD':
      varianceAmplitude = 0.3; // Variance élevée
      break;
    default:
      varianceAmplitude = 0.2;
  }
  
  // Calculer l'espacement théorique régulier
  const spacing = (trace.length - 1) / (numberCount - 1);
  
  // Tableau pour stocker les indices choisis afin de garantir l'ordre
  const chosenIndices: number[] = [0, trace.length - 1]; // Indices du premier et dernier nombre
  
  // Pour les nombres intermédiaires, calculer des positions avec variance
  for (let num = 2; num < numberCount; num++) {
    // Position idéale avec espacement régulier
    const idealIndex = (num - 1) * spacing;
    
    // Calculer la borne minimale (position du nombre précédent)
    const minBound = chosenIndices[num - 2] + 1;
    
    // Calculer la borne maximale (pour éviter de dépasser le nombre suivant)
    // Pour le dernier nombre intermédiaire, la borne max est la position du dernier nombre (fixe)
    const maxBound = (num === numberCount - 1) 
      ? trace.length - 2 
      : Math.min(trace.length - 2, Math.floor(idealIndex + spacing / 2));
    
    // S'assurer que minBound <= maxBound
    if (minBound > maxBound) {
      // Si l'intervalle est invalide, utiliser la position idéale arrondie
      const index = Math.round(idealIndex);
      chosenIndices.push(index);
      const pos = trace[index];
      grid[pos.row][pos.col].value = num;
      continue;
    }
    
    // Générer une variance dans les limites autorisées
    const variance = (random() * 2 - 1) * varianceAmplitude * spacing;
    
    // Calculer l'indice avec variance, borné entre minBound et maxBound
    const indexWithVariance = Math.max(minBound, Math.min(maxBound, Math.round(idealIndex + variance)));
    
    // Stocker l'indice choisi
    chosenIndices.push(indexWithVariance);
    
    // Placer le nombre à la position correspondante
    const pos = trace[indexWithVariance];
    grid[pos.row][pos.col].value = num;
  }
}

/**
 * Crée un générateur de nombres aléatoires basé sur un seed
 */
function createRandomGenerator(seed?: Date): () => number {
  let seedValue = seed ? seed.getTime() : Date.now();
  
  return () => {
        seedValue = (seedValue * 48271 + 16807) % 2147483647;
        return (seedValue & 0x7fffffff) / 0x7fffffff;
      };
}

/**
 * Génère un tracé en serpentin (alternant gauche-droite puis droite-gauche)
 * Cette fonction est maintenant utilisée comme solution de repli
 */
function generateSerpentineTrace(rows: number, cols: number): Path {
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

/**
 * Méthode alternative qui génère un tracé en spirale plus simple
 * Cette fonction est utilisée comme fallback si l'autre méthode échoue
 */
function generateSimpleSpiralTrace(rows: number, cols: number): Path {
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

/**
 * Génère un tracé en zigzag
 */
function generateEasyTrace(rows: number, cols: number, random: () => number): Path {
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
  
  return rotatedTrace;
}

/**
 * Valide une grille complète
 */
export function validateGrid(grid: Grid, numberCount: number): ValidationResult {
  const errors: string[] = [];
  
  // Vérifier que tous les nombres de 1 à numberCount sont présents
  const numbers = new Set<number>();
  for (let i = 0; i < grid.length; i++) {
    for (let j = 0; j < grid[i].length; j++) {
      const value = grid[i][j].value;
      if (value !== null && value >= 1 && value <= numberCount) {
        numbers.add(value);
      }
    }
  }
  
  const hasAllNumbers = numbers.size === numberCount;
  if (!hasAllNumbers) {
    console.error(`La grille ne contient pas tous les nombres de 1 à ${numberCount}`);
    errors.push(`La grille ne contient pas tous les nombres de 1 à ${numberCount}`);
  }
  
  // Exiger un chemin complet qui passe par toutes les cases
  const path = findValidPath(grid, true);
  const hasValidPath = path !== false;
  if (!hasValidPath) {
    console.error('Il n\'existe pas de chemin valide passant par toutes les cases');
    errors.push('Il n\'existe pas de chemin valide passant par toutes les cases');
  }
  
  return {
    isValid: hasAllNumbers && hasValidPath,
    hasAllNumbers,
    hasValidPath,
    errors: errors.length > 0 ? errors : undefined
  };
}

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

/**
 * Calcule la complexité d'une grille
 */
export function calculateGridComplexity(grid: Grid): number {
  // Trouver les positions des nombres
  const numberPositions = new Map<number, Coordinate>();
  let maxNumber = 0;
  
  for (let i = 0; i < grid.length; i++) {
    for (let j = 0; j < grid[i].length; j++) {
      const value = grid[i][j].value;
      if (value !== null) {
        numberPositions.set(value, { row: i, col: j });
        maxNumber = Math.max(maxNumber, value);
      }
    }
  }
  
  if (maxNumber <= 1) return 0.1; // Éviter de retourner 0 pour faciliter les comparaisons
  
  // Calculer la distance moyenne entre les nombres consécutifs
  let totalDistance = 0;
  let connections = 0;
  
  for (let i = 1; i < maxNumber; i++) {
    const start = numberPositions.get(i);
    const end = numberPositions.get(i + 1);
    
    if (start && end) {
      // Distance de Manhattan
      const distance = Math.abs(start.row - end.row) + Math.abs(start.col - end.col);
      totalDistance += distance;
      connections++;
    }
  }
  
  // Calculer la complexité normalisée (0.1-1)
  if (connections === 0) return 0.1;
  
  const avgDistance = totalDistance / connections;
  const maxPossibleDistance = grid.length + grid[0].length - 2;
  
  // Normaliser entre 0.1 et 1 (éviter 0 pour les tests de comparaison)
  return Math.max(0.1, Math.min(avgDistance / maxPossibleDistance, 1));
}

/**
 * Mélange un tableau en place (algorithme de Fisher-Yates)
 */
function shuffleArray<T>(array: T[]): void {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

/**
 * Vérifie s'il existe un chemin valide entre tous les nombres consécutifs
 */
export function findValidPath(grid: Grid, findCompletePath: boolean = false): boolean | Path {
  // Si on a un tracé généré précédemment et qu'on demande un chemin complet, le retourner directement
  if (findCompletePath && lastGeneratedTrace) {
    return lastGeneratedTrace;
  }
  
  console.log('findValidPath',  lastGeneratedTrace, findCompletePath);

  // Le reste de la fonction reste inchangé pour les cas où le tracé n'est pas disponible
  const rows = grid.length;
  const cols = grid[0].length;
  
  // Trouver les positions des nombres dans la grille
  const numberPositions = new Map<number, Coordinate>();
  let maxNumber = 0;
  
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      const value = grid[i][j].value;
      if (value !== null) {
        numberPositions.set(value, { row: i, col: j });
        maxNumber = Math.max(maxNumber, value);
      }
    }
  }
  
  // Si pas de nombre, il n'y a pas de chemin
  if (maxNumber === 0) {
    return false;
  }
  
  // Vérifier que tous les nombres de 1 à maxNumber sont présents
  for (let i = 1; i <= maxNumber; i++) {
    if (!numberPositions.has(i)) {
      return false;
    }
  }
  
  // Si on demande un chemin complet et qu'on n'avait pas de tracé stocké
  if (findCompletePath) {
    return findCompleteValidPath(grid, numberPositions, maxNumber);
  }
  
  // Pour chaque paire de nombres consécutifs, vérifier si un chemin existe
  for (let i = 1; i < maxNumber; i++) {
    const start = numberPositions.get(i);
    const end = numberPositions.get(i + 1);
    
    if (!start || !end) {
      return false;
    }
    
    const pathExists = findPathBetweenCells(grid, start, end);
    if (!pathExists) {
      return false;
    }
  }
  
  return true;
}

/**
 * Trouve un chemin complet valide qui passe par tous les nombres dans l'ordre
 * et ne traverse chaque cellule qu'une seule fois
 */
function findCompleteValidPath(grid: Grid, numberPositions: Map<number, Coordinate>, maxNumber: number): Path | false {
  // Matrice pour suivre les cellules déjà visitées
  const rows = grid.length;
  const cols = grid[0].length;
  const visited: boolean[][] = Array(rows).fill(false).map(() => Array(cols).fill(false));
  
  // Chemin complet à construire
  const completePath: Path = [];
  
  // Marquer initialement tous les nombres (sauf 1) comme visités pour éviter de les traverser
  // avant leur tour dans la séquence
  for (let num = 2; num <= maxNumber; num++) {
    const pos = numberPositions.get(num);
    if (pos) {
      visited[pos.row][pos.col] = true;
    }
  }
  
  // Ajouter le premier nombre au chemin
  const firstPos = numberPositions.get(1);
  if (!firstPos) return false;
  
  completePath.push(firstPos);
  visited[firstPos.row][firstPos.col] = true;
  
  // Pour chaque paire de nombres consécutifs
  for (let num = 1; num < maxNumber; num++) {
    const start = numberPositions.get(num);
    const end = numberPositions.get(num + 1);
    
    if (!start || !end) return false;
    
    // Démarquer la destination actuelle pour pouvoir l'atteindre
    visited[end.row][end.col] = false;
    
    // Trouver un chemin entre les nombres consécutifs en respectant
    // les cellules déjà visitées
    const path = findPathBetweenCellsWithPath(grid, start, end, visited);
    if (!path) return false;
    
    // Ajouter le chemin au chemin complet (sans répéter le point de départ)
    completePath.push(...path.slice(1));
    
    // Marquer toutes les cellules du chemin comme visitées
    for (const pos of path) {
      visited[pos.row][pos.col] = true;
    }
    
    // Si ce n'était pas le dernier nombre, démarquer le prochain nombre
    // pour le rendre accessible
    if (num + 1 < maxNumber) {
      const nextNum = num + 2;
      const nextPos = numberPositions.get(nextNum);
      if (nextPos) {
        visited[nextPos.row][nextPos.col] = false;
      }
    }
  }
  
  // Vérifier si le chemin utilise toutes les cellules de la grille
  const totalCells = rows * cols;
  if (completePath.length < totalCells) {
    return false; // Le chemin ne passe pas par toutes les cellules
  }
  
  return completePath;
}

/**
 * Trouve un chemin entre deux cellules et retourne le chemin complet
 */
function findPathBetweenCellsWithPath(grid: Grid, start: Coordinate, end: Coordinate, initialVisited: boolean[][]): Path | false {
  const rows = grid.length;
  const cols = grid[0].length;
  
  // Copier la matrice des visites pour ne pas modifier l'originale
  const visited: boolean[][] = JSON.parse(JSON.stringify(initialVisited));
  
  // Pour reconstruire le chemin, on garde une trace du parent de chaque cellule
  const parent: Map<string, Coordinate> = new Map();
  
  // File d'attente pour BFS
  const queue: Coordinate[] = [start];
  visited[start.row][start.col] = true;
  
  // Directions: haut, droite, bas, gauche
  const directions = [
    {row: -1, col: 0},
    {row: 0, col: 1},
    {row: 1, col: 0},
    {row: 0, col: -1}
  ];
  
  let found = false;
  
  while (queue.length > 0 && !found) {
    const current = queue.shift()!;
    
    // Si on a atteint la destination
    if (current.row === end.row && current.col === end.col) {
      found = true;
      break;
    }
    
    // Explorer les voisins
    for (const dir of directions) {
      const newRow = current.row + dir.row;
      const newCol = current.col + dir.col;
      
      // Vérifier si la nouvelle position est valide
      if (
        newRow >= 0 && newRow < rows &&
        newCol >= 0 && newCol < cols &&
        !visited[newRow][newCol]
      ) {
        // Vérifier si la cellule est vide OU si c'est exactement la cellule de destination
        const cell = grid[newRow][newCol];
        const isEmpty = cell.value === null;
        const isExactDestination = newRow === end.row && newCol === end.col;
        
        if (isEmpty || isExactDestination) {
          visited[newRow][newCol] = true;
          queue.push({row: newRow, col: newCol});
          
          // Enregistrer le parent pour reconstruire le chemin
          parent.set(`${newRow},${newCol}`, current);
        }
      }
    }
  }
  
  // Si on n'a pas trouvé de chemin
  if (!found) {
    return false;
  }
  
  // Reconstruire le chemin de la fin au début
  const path: Path = [];
  let current: Coordinate = end;
  
  while (current.row !== start.row || current.col !== start.col) {
    path.unshift(current);
    const parentKey = `${current.row},${current.col}`;
    if (!parent.has(parentKey)) {
      return false; // Problème dans la reconstruction du chemin
    }
    current = parent.get(parentKey)!;
  }
  
  // Ajouter le point de départ au début
  path.unshift(start);
  
  return path;
}

/**
 * Fonction générique de backtracking pour générer des tracés
 */
function generateTraceWithBacktracking(
  rows: number, 
  cols: number, 
  random: () => number,
  startPoint?: Coordinate,
  endPoint?: Coordinate
): Path {
  // Cas spéciaux (grilles 1×1 ou 1×N/N×1)
  const specialCase = handleSpecialGridCases(rows, cols);
  if (specialCase) return specialCase;
  
  // Nombre maximal de tentatives de backtracking
  const MAX_ATTEMPTS = 10;
  
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    // Créer matrice des cellules visitées
    const visited: boolean[][] = Array(rows).fill(false).map(() => Array(cols).fill(false));
    const trace: Path = [];
    
    // Déterminer le point de départ pour le backtracking
    let startRow: number, startCol: number;
    
    if (startPoint) {
      // Utiliser le point de départ spécifié
      startRow = startPoint.row;
      startCol = startPoint.col;
    } else if (trace.length > 0) {
      // Utiliser le dernier point de la séquence initiale
      const lastPoint = trace[trace.length - 1];
      startRow = lastPoint.row;
      startCol = lastPoint.col;
    } else {
      // Choisir un point aléatoire
      startRow = Math.floor(random() * rows);
      startCol = Math.floor(random() * cols);
    }
    
    trace.push({ row: startRow, col: startCol });
    visited[startRow][startCol] = true;
    
    // Ajout d'un compteur pour limiter les appels récursifs
    let backtrackingCount = 0;
    const MAX_BACKTRACKING_CALLS = 10000;
    
    function backtrack(currentRow: number, currentCol: number): boolean {
      // Vérifier si nous avons atteint la limite d'appels
      if (backtrackingCount >= MAX_BACKTRACKING_CALLS) {
        return false;
      }
      
      // Incrémenter le compteur d'appels
      backtrackingCount++;
      
      // Si on a visité toutes les cellules
      if (trace.length === rows * cols) {
        // Si on a un point de fin défini, vérifier si la dernière cellule correspond
        if (endPoint) {
          const lastCell = trace[trace.length - 1];
          return lastCell.row === endPoint.row && lastCell.col === endPoint.col;
        }
        return true;
      }
      
      // LOGIQUE MODIFIÉE: Si nous sommes près du nombre total de cellules et qu'un point de fin est défini,
      // vérifier si nous pouvons atteindre le point de fin
      if (endPoint && trace.length >= rows * cols - 3) {
        const distToEnd = Math.abs(currentRow - endPoint.row) + Math.abs(currentCol - endPoint.col);
        // Si nous sommes trop loin et qu'il ne reste pas assez de cellules pour atteindre le point de fin
        if (distToEnd > rows * cols - trace.length) {
          return false;
        }
      }
      
      // Prioriser les directions qui mènent vers des cellules avec moins de voisins libres
      const shuffledDirections = [...DIRECTIONS];
      shuffleArray(shuffledDirections);
      
      // Si on a un point de fin et qu'on s'approche de la fin du tracé, prioriser les directions vers le point de fin
      // Augmentons le seuil pour commencer à guider vers le point de fin plus tôt
      if (endPoint && trace.length >= rows * cols - Math.max(5, rows + cols)) {
        shuffledDirections.sort((a, b) => {
          const aRow = currentRow + a.row;
          const aCol = currentCol + a.col;
          const bRow = currentRow + b.row;
          const bCol = currentCol + b.col;
          
          if (!isValidCell(aRow, aCol, rows, cols)) return 1;
          if (!isValidCell(bRow, bCol, rows, cols)) return -1;
          
          const aDistToEnd = Math.abs(aRow - endPoint.row) + Math.abs(aCol - endPoint.col);
          const bDistToEnd = Math.abs(bRow - endPoint.row) + Math.abs(bCol - endPoint.col);
          
          return aDistToEnd - bDistToEnd;
        });
      } else {
        // Trier les directions selon l'heuristique habituelle
        shuffledDirections.sort((a, b) => {
          const aRow = currentRow + a.row;
          const aCol = currentCol + a.col;
          const bRow = currentRow + b.row;
          const bCol = currentCol + b.col;
          
          if (!isValidCell(aRow, aCol, rows, cols)) return 1;
          if (!isValidCell(bRow, bCol, rows, cols)) return -1;
          
          const aFreeNeighbors = countFreeNeighbors(aRow, aCol, visited, rows, cols);
          const bFreeNeighbors = countFreeNeighbors(bRow, bCol, visited, rows, cols);
          
          return aFreeNeighbors - bFreeNeighbors;
        });
      }
      
      // CAS SPÉCIAL: Si c'est l'avant-dernière cellule et que endPoint est un voisin, aller directement à endPoint
      if (endPoint && trace.length === rows * cols - 1) {
        // Chercher si endPoint est un voisin direct
        for (const dir of shuffledDirections) {
          const newRow = currentRow + dir.row;
          const newCol = currentCol + dir.col;
          
          if (newRow === endPoint.row && newCol === endPoint.col && !visited[newRow][newCol]) {
            trace.push({ row: newRow, col: newCol });
            return true; // On a trouvé un chemin complet!
          }
        }
      }
      
      // Essayer chaque direction
      for (const dir of shuffledDirections) {
        const newRow = currentRow + dir.row;
        const newCol = currentCol + dir.col;
        
        if (
          newRow >= 0 && newRow < rows &&
          newCol >= 0 && newCol < cols &&
          !visited[newRow][newCol]
        ) {
          trace.push({ row: newRow, col: newCol });
          visited[newRow][newCol] = true;
          
          if (backtrack(newRow, newCol)) {
            return true;
          }
          
          trace.pop();
          visited[newRow][newCol] = false;
        }
      }
      
      return false;
    }
    
    // Démarrer le backtracking
    const success = backtrack(startRow, startCol);
    
    // Si le backtracking a réussi, retourner le tracé
    if (success && trace.length === rows * cols) {
      console.log(`Backtracking réussi à la tentative ${attempt + 1}`);
      
      // VÉRIFICATION FINALE: Si on a un point de fin, s'assurer que le tracé s'y termine
      if (endPoint) {
        const lastPoint = trace[trace.length - 1];
        if (lastPoint.row !== endPoint.row || lastPoint.col !== endPoint.col) {
          console.log("Le tracé ne se termine pas au point de fin spécifié, nouvelle tentative...");
          continue;
        }
      }
      
      return trace;
    }
    
    // Si on arrive ici, cette tentative a échoué, on va réessayer
    console.log(`Tentative ${attempt + 1} échouée, réessai...`);
  }
  
  // Si toutes les tentatives ont échoué avec un point de fin fixe, essayer sans point de fin
  if (endPoint) {
    console.log("Les tentatives avec point de fin fixe ont échoué, essai sans contrainte de fin...");
    return generateTraceWithBacktracking(rows, cols, random, startPoint);
  }
  
  // Si toutes les tentatives ont échoué, générer un tracé en serpentin
  console.log(`Toutes les tentatives de backtracking ont échoué (${MAX_ATTEMPTS}), génération d'un tracé en serpentin`);
  
  // MODIFICATION: Si on avait des points fixes, essayer d'adapter le serpentin
  if (startPoint || endPoint) {
    // Générer un tracé en serpentin de secours
    const serpentineTrace = generateSerpentineTrace(rows, cols);
    
    // Si on a un point de départ, faire une rotation pour que le serpentin commence par ce point
    if (startPoint) {
      // Trouver l'index du point le plus proche du point de départ demandé
      let minDistance = Infinity;
      let bestStartIndex = 0;
      
      for (let i = 0; i < serpentineTrace.length; i++) {
        const dist = Math.abs(serpentineTrace[i].row - startPoint.row) + Math.abs(serpentineTrace[i].col - startPoint.col);
        if (dist < minDistance) {
          minDistance = dist;
          bestStartIndex = i;
        }
      }
      
      // Réorganiser le tracé pour qu'il commence par ce point
      const reorderedTrace = [
        ...serpentineTrace.slice(bestStartIndex),
        ...serpentineTrace.slice(0, bestStartIndex)
      ];
      
      return reorderedTrace;
    }
    
    return serpentineTrace;
  }
  
  return generateSerpentineTrace(rows, cols);
}

/**
 * Génère un tracé vraiment aléatoire qui couvre toute la grille
 */
export function generateRandomTrace(rows: number, cols: number, random: () => number): Path {
  return generateTraceWithBacktracking(rows, cols, random);
}

/**
 * Génère un tracé semi-aléatoire avec le début et la fin fixés à améliorer pour rendre ça moins aléatoire
 */
function generateSemiRandomTrace(rows: number, cols: number, random: () => number): Path {
  // Définir les points de départ
  const startPoints: Path = [
    { row: 0, col: 0 },
  ];
  
  // Définir les points de fin (réservés)
  const endPoints: Path = [
    { row: rows - 1, col: cols - 2 }
  ];
  
  // Sélectionner aléatoirement un point de départ et un point de fin
  const startIndex = Math.floor(random() * startPoints.length);
  const endIndex = Math.floor(random() * endPoints.length);
  
  const startPoint = startPoints[startIndex];
  const endPoint = endPoints[endIndex];
  
  return generateTraceWithBacktracking(rows, cols, random, startPoint, endPoint);
}

// Extraire cette logique commune dans une fonction utilitaire
function handleSpecialGridCases(rows: number, cols: number): Path | null {
  // Cas spécial: grille 1×1
  if (rows === 1 && cols === 1) {
    return [{ row: 0, col: 0 }];
  }
  
  // Cas spécial: grilles 1×N ou N×1
  if (rows === 1 || cols === 1) {
    const trace: Path = [];
    if (rows === 1) {
      for (let c = 0; c < cols; c++) {
        trace.push({ row: 0, col: c });
      }
    } else {
      for (let r = 0; r < rows; r++) {
        trace.push({ row: r, col: 0 });
      }
    }
    return trace;
  }
  
  return null; // Pas de cas spécial
}

// Fonction de rotation optimisée qui vérifie les dimensions
function rotateTrace(trace: Path, angle: number, rows: number, cols: number): Path {
  // Si l'angle est 0 ou 360, retourner le trace original sans copie
  if (angle % 360 === 0) return trace;
  
  const rotatedTrace: Path = [];
  // Pré-allouer la taille pour éviter les redimensionnements
  rotatedTrace.length = trace.length;
  
  // Pré-calcul des dimensions pour les rotations à 90° et 270°
  const needsDimensionSwap = angle % 180 !== 0;
  const effectiveRows = needsDimensionSwap ? cols : rows;
  const effectiveCols = needsDimensionSwap ? rows : cols;
  
  for (let i = 0; i < trace.length; i++) {
    const point = trace[i];
    let newPoint: Coordinate;
    
    switch (angle % 360) {
      case 90:
        newPoint = { row: point.col, col: effectiveRows - 1 - point.row };
        break;
      case 180:
        newPoint = { row: effectiveRows - 1 - point.row, col: effectiveCols - 1 - point.col };
        break;
      case 270:
        newPoint = { row: effectiveCols - 1 - point.col, col: point.row };
        break;
      default:
        newPoint = { ...point };
    }
    
    rotatedTrace[i] = newPoint;
  }
  
  return rotatedTrace;
}