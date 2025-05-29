import { Grid, Path, Coordinate, Difficulty } from '../../types/gameTypes';

/**
 * Place des nombres sur le tracé de manière à garantir un chemin valide
 * Avec un espacement variable utilisant une variance aléatoire
 */
export function placeNumbersOnTraceGuaranteedValid(grid: Grid, trace: Path, numberCount: number, difficulty: Difficulty, random: () => number): void {
  // Vérifications de base
  if (!trace || trace.length === 0) {
    throw new Error("Le tracé est vide ou invalide");
  }
  
  if (numberCount > trace.length) {
    throw new Error(`Le nombre de valeurs (${numberCount}) est supérieur à la longueur du tracé (${trace.length})`);
  }
  
  // Réinitialiser la grille (important si la grille fournie n'est pas vide)
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
  
  // Calculer l'espacement théorique régulier entre les nombres sur le tracé
  const totalTraceSegments = trace.length - 1;
  const numberIntervals = numberCount - 1;
  const averageSpacing = totalTraceSegments / numberIntervals;
  
  // Tableau pour stocker les indices choisis dans le tracé afin de garantir l'ordre
  // Convertir en Set pour vérifier rapidement si un indice est déjà pris par 1 ou N
  const occupiedIndices = new Set<number>([0, trace.length - 1]);
  const chosenIndicesSorted: number[] = [0]; // Garde les indices choisis en ordre
  
  // Placer les nombres intermédiaires (de 2 à numberCount - 1)
  for (let num = 2; num < numberCount; num++) {
    // Position idéale basée sur l'espacement moyen
    const idealIndexFloat = (num - 1) * averageSpacing;
    
    // Calculer la borne minimale (indice après le nombre précédent)
    const lowerBoundIndex = chosenIndicesSorted[chosenIndicesSorted.length - 1] + 1;
    
    // Calculer la borne maximale théorique avant le prochain nombre
    // Pour le dernier nombre intermédiaire (num = numberCount - 1), sa position max est trace.length - 2
    const upperBoundIndex = (num === numberCount - 1) 
      ? trace.length - 2 
      : Math.min(trace.length - 2, Math.floor(idealIndexFloat + averageSpacing / 2));

    // Déterminer la plage d'indices possibles pour ce nombre
    const minPossibleIndex = lowerBoundIndex;
    const maxPossibleIndex = upperBoundIndex;
    
    // S'assurer que l'intervalle est valide
    if (minPossibleIndex > maxPossibleIndex) {
      // Situation anormale (ex: tracé trop court pour le nombre de points?)
      // Placer à l'indice idéal arrondi s'il est disponible et dans les bornes
      let fallbackIndex = Math.round(idealIndexFloat);
      fallbackIndex = Math.max(lowerBoundIndex, Math.min(upperBoundIndex, fallbackIndex)); 
      
      // Vérifier si l'indice fallback est déjà pris
      if(occupiedIndices.has(fallbackIndex)){
         // Essayer de trouver le premier indice libre après le précédent
         fallbackIndex = lowerBoundIndex;
         while(occupiedIndices.has(fallbackIndex) && fallbackIndex < trace.length - 1){
           fallbackIndex++;
         }
         // Si tout est occupé jusqu'à la fin, il y a un problème
         if(fallbackIndex >= trace.length - 1) {
            throw new Error(`Impossible de placer le nombre ${num} dans un intervalle valide.`);
         }
      }
      
      // Placer au fallback et continuer
      chosenIndicesSorted.push(fallbackIndex);
      occupiedIndices.add(fallbackIndex);
      const pos = trace[fallbackIndex];
      grid[pos.row][pos.col].value = num;
      continue;
    }
    
    // Générer une variance aléatoire dans les limites de l'amplitude
    const variance = (random() * 2 - 1) * varianceAmplitude * averageSpacing;
    let targetIndex = Math.round(idealIndexFloat + variance);
    
    // Contraindre l'indice cible dans les bornes possibles [minPossibleIndex, maxPossibleIndex]
    targetIndex = Math.max(minPossibleIndex, Math.min(maxPossibleIndex, targetIndex));

    // S'assurer que l'indice choisi n'est pas déjà occupé (par 1 ou N ou un précédent)
    // Si occupé, chercher le prochain indice libre après targetIndex dans les bornes
    while (occupiedIndices.has(targetIndex) && targetIndex < maxPossibleIndex) {
        targetIndex++;
    }
    // Si on a atteint la borne max et qu'elle est occupée, chercher en arrière
    if (occupiedIndices.has(targetIndex)) {
        targetIndex = Math.round(idealIndexFloat + variance);
        targetIndex = Math.max(minPossibleIndex, Math.min(maxPossibleIndex, targetIndex));
        while (occupiedIndices.has(targetIndex) && targetIndex > minPossibleIndex) {
            targetIndex--;
        }
    }
    
    // Si on ne trouve toujours pas d'indice libre (cas très improbable)
    if (occupiedIndices.has(targetIndex)) {
        // Chercher le premier indice libre après le précédent nombre placé
        targetIndex = lowerBoundIndex;
         while(occupiedIndices.has(targetIndex) && targetIndex < trace.length - 1){
           targetIndex++;
         }
         if(targetIndex >= trace.length - 1) {
             throw new Error(`Impossible de trouver un emplacement libre pour le nombre ${num}.`);
         }
    }

    // Stocker l'indice choisi et le marquer comme occupé
    chosenIndicesSorted.push(targetIndex);
    occupiedIndices.add(targetIndex);
    
    // Placer le nombre à la position correspondante sur le tracé
    const pos = trace[targetIndex];
    grid[pos.row][pos.col].value = num;
  }
} 