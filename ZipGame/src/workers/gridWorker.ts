import { Grid, Difficulty } from '../types/gameTypes';
import { generateGrid } from '../utils/gridGenerator';

// Écouter les messages du thread principal
self.onmessage = (e: MessageEvent) => {
  const { size, numberCount, difficulty, seed } = e.data;
  
  try {
    // Générer la grille
    const grid = generateGrid(size, size, numberCount, difficulty as Difficulty, seed ? new Date(seed) : undefined);
    
    // Envoyer la grille générée au thread principal
    self.postMessage({ type: 'success', grid });
  } catch (error: unknown) {
    // En cas d'erreur, envoyer l'erreur au thread principal
    const errorMessage = error instanceof Error ? error.message : 'Une erreur inconnue est survenue';
    self.postMessage({ type: 'error', error: errorMessage });
  }
};

export {}; 