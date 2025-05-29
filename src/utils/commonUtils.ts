import { Coordinate } from '../types/gameTypes'; // Ajout potentiel si d'autres utils sont ajoutés

/**
 * Crée un générateur de nombres pseudo-aléatoires déterministe si une graine est fournie
 */
export function createRandomGenerator(seed?: Date | number): () => number {
  // Si aucune graine n'est fournie, utiliser Math.random
  if (seed === undefined) {
    return Math.random;
  }
  
  // Normaliser la graine pour qu'elle soit toujours un nombre
  let seedValue: number;
  
  if (seed instanceof Date) {
    // Pour garantir le déterminisme, normaliser la date en utilisant uniquement jour/mois/année
    const year = seed.getFullYear();
    const month = seed.getMonth();
    const day = seed.getDate();
    
    // Créer un timestamp normalisé (identique pour toutes les dates du même jour)
    seedValue = new Date(year, month, day, 0, 0, 0, 0).getTime();
  } else {
    // Si c'est déjà un nombre, l'utiliser directement
    seedValue = seed;
  }
  
  // Initialiser la graine pour notre PRNG
  let currentSeed = seedValue;
  
  // Retourner une fonction de génération de nombres aléatoires déterministe
  return () => {
    // Algorithme simple de génération de nombres pseudo-aléatoires
    // Utilise un multiplicateur, un incrément et un modulo pour créer une séquence déterministe
    currentSeed = (currentSeed * 9301 + 49297) % 233280;
    return currentSeed / 233280;
  };
}


/**
 * Mélange un tableau en place (algorithme de Fisher-Yates) en utilisant un générateur aléatoire fourni.
 */
export function shuffleArray<T>(array: T[], random: () => number): void {
  for (let i = array.length - 1; i > 0; i--) {
    // Utiliser la fonction random fournie pour le déterminisme
    const j = Math.floor(random() * (i + 1)); 
    [array[i], array[j]] = [array[j], array[i]];
  }
} 