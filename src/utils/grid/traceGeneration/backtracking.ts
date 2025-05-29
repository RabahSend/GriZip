import { Path, Coordinate } from '../../../types/gameTypes';
import { handleSpecialGridCases, isValidCell, countFreeNeighbors, DIRECTIONS } from './traceUtils';
import { generateSerpentineTrace } from './serpentine';
import { shuffleArray } from '../../commonUtils';

/**
 * Fonction générique de backtracking pour générer des tracés
 */
export function generateTraceWithBacktracking(
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
    } else {
      // Choisir un point aléatoire
      startRow = Math.floor(random() * rows);
      startCol = Math.floor(random() * cols);
    }
    
    trace.push({ row: startRow, col: startCol });
    visited[startRow][startCol] = true;
    
    // Ajout d'un compteur pour limiter les appels récursifs
    let backtrackingCount = 0;
    const MAX_BACKTRACKING_CALLS = 10000; // Ajusté
    
    function backtrack(currentRow: number, currentCol: number): boolean {
      // Vérifier si nous avons atteint la limite d'appels
      if (backtrackingCount >= MAX_BACKTRACKING_CALLS) {
        console.warn("Limite d'appels de backtracking atteinte."); // Remis un avertissement
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
      
      // Préparer les directions et les mélanger
      const shuffledDirections = [...DIRECTIONS];
      shuffleArray(shuffledDirections, random); // Correction: Utiliser random
      
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
        // Trier les directions selon l'heuristique habituelle (moins de voisins libres en premier)
        shuffledDirections.sort((a, b) => {
          const aRow = currentRow + a.row;
          const aCol = currentCol + a.col;
          const bRow = currentRow + b.row;
          const bCol = currentCol + b.col;
          
          if (!isValidCell(aRow, aCol, rows, cols)) return 1;
          if (!isValidCell(bRow, bCol, rows, cols)) return -1;
          
          // Note: Il faut s'assurer que le voisin est valide avant de compter ses voisins
          const aFreeNeighbors = countFreeNeighbors(aRow, aCol, visited, rows, cols);
          const bFreeNeighbors = countFreeNeighbors(bRow, bCol, visited, rows, cols);
          
          return aFreeNeighbors - bFreeNeighbors;
        });
      }
      
      // CAS SPÉCIAL: Si c'est l'avant-dernière cellule et que endPoint est un voisin, aller directement à endPoint
      if (endPoint && trace.length === rows * cols - 1) {
        // Chercher si endPoint est un voisin direct non visité
        for (const dir of shuffledDirections) {
          const newRow = currentRow + dir.row;
          const newCol = currentCol + dir.col;
          
          if (newRow === endPoint.row && newCol === endPoint.col && isValidCell(newRow, newCol, rows, cols) && !visited[newRow][newCol]) {
            trace.push({ row: newRow, col: newCol });
            visited[newRow][newCol] = true; // Important de marquer comme visité
            return true; // On a trouvé un chemin complet!
          }
        }
        // Si endPoint est le seul voisin possible mais déjà visité ou invalide, le backtrack échouera naturellement.
      }
      
      // Essayer chaque direction (triée par l'heuristique)
      for (const dir of shuffledDirections) {
        const newRow = currentRow + dir.row;
        const newCol = currentCol + dir.col;
        
        if (isValidCell(newRow, newCol, rows, cols) && !visited[newRow][newCol]) {
          trace.push({ row: newRow, col: newCol });
          visited[newRow][newCol] = true;
          
          if (backtrack(newRow, newCol)) {
            return true;
          }
          
          // Backtrack
          visited[newRow][newCol] = false; // Remettre à false
          trace.pop();
        }
      }
      
      return false;
    }
    
    // Démarrer le backtracking
    const success = backtrack(startRow, startCol);
    
    // Si le backtracking a réussi, retourner le tracé
    if (success && trace.length === rows * cols) {
      // console.log(`Backtracking réussi à la tentative ${attempt + 1}`); // Log moins verbeux
      
      // VÉRIFICATION FINALE: Si on a un point de fin, s'assurer que le tracé s'y termine (déjà fait dans la récursion mais double check)
      if (endPoint) {
        const lastPoint = trace[trace.length - 1];
        if (lastPoint.row !== endPoint.row || lastPoint.col !== endPoint.col) {
          console.warn(`Backtracking: Tracé généré mais ne finit pas au endPoint demandé (Tentative ${attempt + 1})`);
          continue; // Essayer à nouveau
        }
      }
      
      return trace;
    }
    
    // Si on arrive ici, cette tentative a échoué, on va réessayer
    // console.log(`Tentative ${attempt + 1} échouée, réessai...`); // Log moins verbeux
  }
  
  // --- MODIFICATION DU FALLBACK --- 
  // Si toutes les tentatives ont échoué AVEC un point de fin fixe, 
  // essayer UNE FOIS SANS point de fin avant de passer au serpentin.
  if (endPoint) {
    console.warn("Backtracking: Les tentatives avec point de fin fixe ont échoué, essai sans contrainte de fin...");
    // Appel récursif SANS endPoint
    const traceWithoutEndPoint = generateTraceWithBacktracking(rows, cols, random, startPoint);
    // Si cet appel réussit (ne retourne pas un serpentin par défaut), on le prend
    // On vérifie s'il est complet (ce que fait déjà la fonction appelée)
    if (traceWithoutEndPoint.length === rows * cols) {
        console.log("Backtracking: Réussi après tentative sans point de fin.");
        return traceWithoutEndPoint;
    } else {
        console.warn("Backtracking: Tentative sans point de fin a aussi échoué (ou retourné un fallback). Passage au serpentin final.");
    }
  }
  
  // Si toutes les tentatives ont échoué (même sans endPoint fixe, ou si endPoint n'était pas défini), 
  // générer un tracé en serpentin de secours.
  console.warn(`Backtracking: Toutes les tentatives ont échoué (${MAX_ATTEMPTS}), génération d'un tracé en serpentin de secours.`);
  
  // Utiliser le serpentin comme fallback ultime
  const fallbackTrace = generateSerpentineTrace(rows, cols);

  // Essayer d'ajuster le serpentin pour commencer près du startPoint si fourni
  if (startPoint) {
     let minDistance = Infinity;
     let bestStartIndex = 0;
     for (let i = 0; i < fallbackTrace.length; i++) {
       const dist = Math.abs(fallbackTrace[i].row - startPoint.row) + Math.abs(fallbackTrace[i].col - startPoint.col);
       if (dist < minDistance) {
         minDistance = dist;
         bestStartIndex = i;
       }
     }
     // Réorganiser le tracé pour qu'il commence (approximativement) par startPoint
     return [
       ...fallbackTrace.slice(bestStartIndex),
       ...fallbackTrace.slice(0, bestStartIndex)
     ];
  }
  
  return fallbackTrace;
} 