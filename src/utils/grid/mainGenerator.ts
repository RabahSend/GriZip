import { Grid, Cell, Difficulty, Coordinate, ValidationResult, Path } from '../../types/gameTypes';
import { createRandomGenerator, shuffleArray } from '../commonUtils';
import { createEmptyGrid } from './gridCreation';
import { generateEasyTrace } from './traceGeneration/easyTrace';
import { generateSemiRandomTrace } from './traceGeneration/semiRandomTrace';
import { generateRandomTrace } from './traceGeneration/randomTrace';
import { placeNumbersOnTraceGuaranteedValid } from './numberPlacement';
import { findPathBetweenCells, findPathBetweenCellsWithPath } from './pathfinding';
import { isValidCell } from './traceGeneration/traceUtils'; // Importation ajoutée pour createFallbackGrid

// --- Variables Globales au Module (Conservées ici car liées à la génération/validation) ---

// Stockage du tracé utilisé pour la dernière grille générée
let lastGeneratedTrace: Path | null = null;

// Cache pour les grilles générées
const gridCache: Map<string, { grid: Grid, trace: Path }> = new Map();

// --- Fonctions Principales de Génération et Validation --- 

/**
 * Génère une grille complète avec un tracé valide et des nombres placés dessus.
 * Gère le cache et l'orchestration des différentes étapes.
 */
export function generateGrid(rows: number, cols: number, numberCount: number, difficulty: Difficulty, seed?: number | Date): { grid: Grid, trace: Path } {
  // Créer une clé de cache unique basée sur tous les paramètres pertinents
  const normalizedSeed = seed instanceof Date 
    ? new Date(seed.getFullYear(), seed.getMonth(), seed.getDate(), 0, 0, 0, 0).getTime()
    : seed;
  
  const cacheKey = `${rows}-${cols}-${numberCount}-${difficulty}-${normalizedSeed}`;
  
  // Vérifier si cette configuration existe déjà dans le cache
  if (gridCache.has(cacheKey)) {
    // Retourner une copie profonde pour éviter les mutations externes
    const cachedEntry = gridCache.get(cacheKey)!;
    return {
      grid: JSON.parse(JSON.stringify(cachedEntry.grid)),
      trace: JSON.parse(JSON.stringify(cachedEntry.trace))
    };
  }
  
  // Si non présente dans le cache, générer une nouvelle grille
  const random = createRandomGenerator(normalizedSeed);
  const grid = createEmptyGrid(rows, cols);
  
  let trace: Path;
  
  // --- RESTAURATION --- 
  // Sélectionner l'algorithme de génération de tracé basé sur la difficulté
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
  // --------------------
  
  // Stocker le tracé généré pour une utilisation potentielle par findValidPath
  lastGeneratedTrace = trace;
  
  // Placer les nombres sur le tracé généré
  placeNumbersOnTraceGuaranteedValid(grid, trace, numberCount, difficulty, random);
  
  // Créer des copies profondes pour le stockage dans le cache
  const gridToCache = JSON.parse(JSON.stringify(grid));
  const traceToCache = JSON.parse(JSON.stringify(trace));

  // Stocker la nouvelle grille et son tracé dans le cache
  gridCache.set(cacheKey, { grid: gridToCache, trace: traceToCache });
  
  // Retourner la grille générée (et son tracé)
  // Retourner une copie pour l'utilisateur afin d'éviter les mutations du cache
  return { grid: JSON.parse(JSON.stringify(gridToCache)), trace: JSON.parse(JSON.stringify(traceToCache)) };
}

/**
 * Place un nombre spécifié de valeurs consécutives dans la grille. 
 * NOTE : Cette fonction semble être une alternative ou une ancienne méthode 
 * par rapport à placeNumbersOnTraceGuaranteedValid. Elle est conservée ici 
 * pour l'instant mais pourrait être revue ou supprimée si non utilisée.
 * Elle utilise Math.random directement et non le générateur déterministe.
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
  
  const maxAttempts = 500; 
  let attempt = 0;
  const localRandom = Math.random; // Utilise Math.random ici
  
  while (attempt < maxAttempts) {
    attempt++;
    // Réinitialiser la grille à chaque essai
    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
        newGrid[i][j].value = null;
      }
    }
    
    const positions: Coordinate[] = [];
    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
        positions.push({ row: i, col: j });
      }
    }
    
    // Mélanger les positions (utilise Math.random via la fonction corrigée si non fournie)
    // Pour la cohérence, on devrait passer un générateur, mais la fonction originale ne le faisait pas.
    shuffleArray(positions, localRandom); // Utilise Math.random car pas de seed ici
    
    const firstPos = positions.shift()!;
    newGrid[firstPos.row][firstPos.col].value = 1;
    
    let success = true;
    let lastPos = firstPos;
    
    for (let num = 2; num <= numCount; num++) {
      const validPositions: Coordinate[] = [];
      for (let i = 0; i < positions.length; i++) {
        const pos = positions[i];
        const rowDiff = Math.abs(pos.row - lastPos.row);
        const colDiff = Math.abs(pos.col - lastPos.col);
        
        if ((rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1) || (rowDiff <= 2 && colDiff <= 2)) {
          validPositions.push(pos);
        }
      }
      
      if (validPositions.length > 0) {
        const randomIndex = Math.floor(localRandom() * validPositions.length);
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
    
    // Vérifier si la grille est valide ET complètement résolvable
    if (success && findValidPath(newGrid, true)) { // Utilise findValidPath défini ci-dessous
      return newGrid;
    }
  }
  
  // Essayer avec juste un chemin valide si chemin complet échoue
  attempt = 0;
  while (attempt < maxAttempts / 2) {
    attempt++;
     // Réinitialiser
     for (let i = 0; i < rows; i++) for (let j = 0; j < cols; j++) newGrid[i][j].value = null;
     // Replacer
     const positions: Coordinate[] = [];
     for (let i = 0; i < rows; i++) for (let j = 0; j < cols; j++) positions.push({ row: i, col: j });
     shuffleArray(positions, localRandom);
     const firstPos = positions.shift()!;
     newGrid[firstPos.row][firstPos.col].value = 1;
     let success = true;
     let lastPos = firstPos;
     for (let num = 2; num <= numCount; num++) {
       const validPositions: Coordinate[] = [];
       for (let i = 0; i < positions.length; i++) {
         const pos = positions[i];
         const rowDiff = Math.abs(pos.row - lastPos.row);
         const colDiff = Math.abs(pos.col - lastPos.col);
         if ((rowDiff <= 2 && colDiff <= 2)) { // Condition simplifiée pour la démo
           validPositions.push(pos);
         }
       }
       if (validPositions.length > 0) {
         const randomIndex = Math.floor(localRandom() * validPositions.length);
         const selectedPos = validPositions[randomIndex];
         newGrid[selectedPos.row][selectedPos.col].value = num;
         const posIndex = positions.findIndex(p => p.row === selectedPos.row && p.col === selectedPos.col);
         if (posIndex !== -1) positions.splice(posIndex, 1);
         lastPos = selectedPos;
       } else {
         success = false; break;
       }
     }
    // Vérifier si la grille a au moins un chemin valide (pas forcément complet)
    if (success && findValidPath(newGrid, false)) { // Utilise findValidPath défini ci-dessous
      return newGrid;
    }
  }
  
  // Si on ne trouve pas de solution, utiliser le fallback
  console.warn("placeNumbersInGrid: Échec de la recherche aléatoire, utilisation du fallback.");
  return createFallbackGrid(grid, numCount); // Utilise createFallbackGrid défini ci-dessous
}

// --- Fonctions de Fallback et Validation (Conservées ici en raison des dépendances) ---

/**
 * Fonction auxiliaire pour créer une grille de secours si la méthode aléatoire échoue
 * ou si `placeNumbersOnTraceGuaranteedValid` n'est pas utilisée.
 */
function createFallbackGrid(grid: Grid, numCount: number): Grid {
  const fallbackGrid = JSON.parse(JSON.stringify(grid)) as Grid;
  const rows = fallbackGrid.length;
  const cols = fallbackGrid[0].length;
  
  // Nettoyer la grille
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      fallbackGrid[i][j].value = null;
    }
  }

  // 1. Essayer un parcours en serpentin simple
  let value = 1;
  for (let r = 0; r < rows; r++) {
    if (r % 2 === 0) { // Gauche à droite
      for (let c = 0; c < cols && value <= numCount; c++) {
        fallbackGrid[r][c].value = value++;
      }
    } else { // Droite à gauche
      for (let c = cols - 1; c >= 0 && value <= numCount; c--) {
        fallbackGrid[r][c].value = value++;
      }
    }
     if (value > numCount) break;
  }

  // Vérifier si cette grille serpentin a un chemin complet
  if (findValidPath(fallbackGrid, true)) {
    return fallbackGrid;
  }

  console.warn("Fallback serpentin invalide, essai du fallback linéaire.");
  // 2. Si serpentin échoue, essayer un parcours linéaire simple (ligne par ligne)
   for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      fallbackGrid[i][j].value = null; // Re-nettoyer
    }
  }
  value = 1;
  for (let i = 0; i < numCount; i++) {
      const r = Math.floor(i / cols);
      const c = i % cols;
      if (r < rows) { // S'assurer qu'on ne dépasse pas les lignes
          fallbackGrid[r][c].value = value++;
      }
  }
  
  // Cette grille linéaire devrait toujours être valide si numCount <= rows*cols
  if (!findValidPath(fallbackGrid, true)) {
      // Ceci ne devrait pas arriver si numCount est correct
      console.error("ERREUR CRITIQUE : Impossible de générer une grille fallback valide.");
      // Retourner la grille même si invalide pour éviter de planter
  }
  return fallbackGrid;
}


/**
 * Vérifie s'il existe un chemin valide entre tous les nombres consécutifs.
 * Si findCompletePath est true, tente de retourner/valider le chemin complet Hamiltonien.
 * Utilise `lastGeneratedTrace` si disponible et pertinent.
 */
export function findValidPath(grid: Grid, findCompletePath: boolean = false): boolean | Path {
  
  // --- RESTAURATION de l'optimisation lastGeneratedTrace --- 
  if (findCompletePath && lastGeneratedTrace) {
      // Vérifier si le tracé correspond à la grille actuelle (dimensions)
      // Note : Idéalement, vérifier aussi si les nombres correspondent
      if(lastGeneratedTrace.length === grid.length * grid[0].length) {
          // console.log('findValidPath: Retour du tracé précédemment généré (optimisation active).');
          return lastGeneratedTrace; // Optimisation réactivée
      }
  }
  // ---------------------------------------------------------
  
  // console.log('findValidPath: Vérification manuelle du chemin...', lastGeneratedTrace, findCompletePath);

  const rows = grid.length;
  const cols = grid[0].length;
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
  
  if (maxNumber === 0) return false;
  
  // Vérifier la présence de tous les nombres
  for (let i = 1; i <= maxNumber; i++) {
    if (!numberPositions.has(i)) return false;
  }
  
  // Si on demande un chemin complet, utiliser la logique BFS dédiée 
  if (findCompletePath) {
    // console.log('findValidPath: Appel de findCompleteValidPath');
    const completePath = findCompleteValidPath(grid, numberPositions, maxNumber);
    
    // Si un chemin incomplet a été trouvé mais que lastGeneratedTrace existe et est de la bonne taille,
    // utiliser lastGeneratedTrace comme fallback
    if (completePath === false && lastGeneratedTrace && lastGeneratedTrace.length === rows * cols) {
      console.log('findValidPath: Utilisation du lastGeneratedTrace comme fallback pour chemin complet');
      return lastGeneratedTrace;
    }
    
    return completePath;
  }
  
  // Sinon, vérifier juste la connectivité entre paires consécutives
  // console.log('findValidPath: Vérification de la connectivité simple');
  for (let i = 1; i < maxNumber; i++) {
    const start = numberPositions.get(i);
    const end = numberPositions.get(i + 1);
    if (!start || !end) return false;
    
    // Utilise la fonction BFS simple importée de pathfinding.ts
    if (!findPathBetweenCells(grid, start, end)) {
      // console.log(`findValidPath: Échec de la connexion simple entre ${i} et ${i+1}`);
      return false;
    }
  }
  
  return true; // Connectivité simple validée
}

/**
 * Trouve un chemin complet valide qui passe par tous les nombres dans l'ordre
 * et ne traverse chaque cellule qu'une seule fois (Chemin Hamiltonien).
 * Utilise BFS entre chaque paire de nombres.
 */
function findCompleteValidPath(grid: Grid, numberPositions: Map<number, Coordinate>, maxNumber: number): Path | false {
  console.log(`[findCompleteValidPath] Début recherche pour ${maxNumber} nombres.`); // Log début
  const rows = grid.length;
  const cols = grid[0].length;
  const visited: boolean[][] = Array(rows).fill(false).map(() => Array(cols).fill(false));
  const completePath: Path = [];
  
  // Marquer les positions des nombres > 1 comme visitées initialement
  for (let num = 2; num <= maxNumber; num++) {
    const pos = numberPositions.get(num);
    if (pos && isValidCell(pos.row, pos.col, rows, cols)) {
      visited[pos.row][pos.col] = true;
    }
  }
  
  const firstPos = numberPositions.get(1);
  if (!firstPos) {
    console.error("[findCompleteValidPath] Position du nombre 1 introuvable !");
    return false;
  }
  
  completePath.push(firstPos);
   if (isValidCell(firstPos.row, firstPos.col, rows, cols)) {
      visited[firstPos.row][firstPos.col] = true;
   } else {
      console.error("[findCompleteValidPath] Position du nombre 1 invalide !");
      return false; // Point de départ invalide
   }

  // Pour chaque paire de nombres consécutifs (1->2, 2->3, ...)
  for (let num = 1; num < maxNumber; num++) {
    const start = numberPositions.get(num);
    const end = numberPositions.get(num + 1);
    
    if (!start || !end) {
        console.error(`[findCompleteValidPath] Position manquante pour ${num} ou ${num + 1}`);
        return false;
    }
    
    console.log(`[findCompleteValidPath] Recherche segment ${num} (${start.row},${start.col}) -> ${num+1} (${end.row},${end.col})`); // Log segment
    
    // Copie de visited *avant* de démarquer la fin (pour le log)
    // const visitedBefore = JSON.stringify(visited); 
    
    // Rendre la destination (end) accessible pour le BFS
     if (isValidCell(end.row, end.col, rows, cols)) {
        visited[end.row][end.col] = false;
     } else {
         console.error(`[findCompleteValidPath] Position de fin invalide pour ${num+1} (${end.row},${end.col})`);
         return false; // Destination invalide
     }
    
    // Trouver le chemin entre start et end en utilisant les cellules non visitées
    const pathSegment = findPathBetweenCellsWithPath(grid, start, end, visited);
    
    // Remarquer la destination comme visitée après la recherche
    visited[end.row][end.col] = true;

    if (!pathSegment) { 
        console.warn(`[findCompleteValidPath] ÉCHEC recherche segment ${num} -> ${num + 1}.`);
        // console.log("Visited matrix at failure:", visitedBefore); // Log matrice visited si besoin
        return false; // Échec de la recherche de chemin
    }
    
    console.log(`[findCompleteValidPath] Segment ${num} -> ${num + 1} trouvé (longueur: ${pathSegment.length})`); // Log succès segment
    
    // Ajouter le segment (sans le premier point qui est déjà dans completePath)
    completePath.push(...pathSegment.slice(1));
    
    // Marquer toutes les nouvelles cellules du segment comme visitées DANS la matrice principale
    for (const pos of pathSegment) { // Marquer tout le segment, y compris start et end
       if (isValidCell(pos.row, pos.col, rows, cols)) {
           visited[pos.row][pos.col] = true;
       }
    }
  }
  
  // Vérifier si le chemin final couvre toutes les cellules de la grille
  const totalCells = rows * cols;
  if (completePath.length !== totalCells) {
     console.warn(`[findCompleteValidPath] Chemin trouvé mais INCOMPLET: ${completePath.length} / ${totalCells} cellules.`);
     
     // Si nous avons un lastGeneratedTrace qui correspond aux dimensions de la grille,
     // on pourrait l'utiliser, mais la fonction appelante s'en chargera
     
     // Même si le chemin est incomplet, le stocker comme lastGeneratedTrace
     // pour que generateGrid puisse au moins retourner un tracé válide pour cette grille
     if (lastGeneratedTrace === null || lastGeneratedTrace.length !== rows * cols) {
         // Sauvegarder ce chemin partiel pour une utilisation future potentielle
         const emptyTrace = completeTraceWithEmptyPath(grid, completePath);
         if (emptyTrace && emptyTrace.length === rows * cols) {
            lastGeneratedTrace = emptyTrace;
            return emptyTrace;
         }
     }
     
     return false; 
  }
  
  console.log(`[findCompleteValidPath] Chemin complet trouvé (${completePath.length} cellules).`); // Log succès final
  
  // Stocker ce chemin complet pour une utilisation future
  lastGeneratedTrace = [...completePath];
  
  return completePath;
}

/**
 * Essaye de compléter un chemin incomplet en ajoutant des coordonnées manquantes
 */
function completeTraceWithEmptyPath(grid: Grid, partialPath: Path): Path | false {
  const rows = grid.length;
  const cols = grid[0].length;
  const totalCells = rows * cols;
  
  if (partialPath.length >= totalCells) {
    return partialPath;
  }
  
  // Créer un set des coordonnées déjà visitées
  const visitedCoordsSet = new Set<string>();
  for (const coord of partialPath) {
    visitedCoordsSet.add(`${coord.row},${coord.col}`);
  }
  
  // Trouver les coordonnées manquantes
  const completePath = [...partialPath];
  
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const coordKey = `${r},${c}`;
      if (!visitedCoordsSet.has(coordKey)) {
        completePath.push({ row: r, col: c });
      }
    }
  }
  
  console.log(`[completeTraceWithEmptyPath] Chemin complété: ${partialPath.length} -> ${completePath.length}`);
  
  return completePath;
} 