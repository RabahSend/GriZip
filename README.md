# ZipGame

## Introduction

ZipGame est un jeu de puzzle sur grille où l'objectif est de tracer un chemin reliant des nombres consécutifs. Inspiré des puzzles de type "connect-the-dots", le jeu propose différents niveaux de difficulté et peut être configuré pour varier automatiquement la complexité en fonction du jour de la semaine.

## Concept du jeu

Le joueur se voit présenter une grille contenant des nombres de 1 à N. L'objectif est de tracer un chemin continu qui relie ces nombres dans l'ordre croissant. La difficulté varie selon la disposition des nombres et la taille de la grille.

## Fonctionnalités implémentées

1. **createEmptyGrid**: Crée une grille vide aux dimensions spécifiées.
   - Prend en paramètres le nombre de lignes et de colonnes
   - Initialise chaque cellule avec des valeurs par défaut (value: null, isPartOfPath: false, etc.)
   - Retourne une structure de données Grid prête à être utilisée

2. **placeNumbersInGrid**: Place des nombres consécutifs (1 à N) dans la grille.
   - Assure qu'il existe au moins un chemin valide entre les nombres consécutifs
   - Utilise un algorithme qui tente de placer les nombres à une distance raisonnable
   - Effectue plusieurs tentatives pour trouver une disposition valide
   - Inclut un mécanisme de fallback pour garantir qu'une grille est toujours générée

3. **findValidPath**: Vérifie l'existence d'un chemin valide entre tous les nombres consécutifs.
   - Accepte un paramètre optionnel permettant de générer un chemin complet
   - Vérifie que la distance entre les nombres consécutifs est appropriée
   - Retourne soit un booléen indiquant si un chemin existe, soit le chemin lui-même

4. **generateCompletePath**: Génère un chemin complet qui passe par toutes les cellules de la grille.
   - Utilise un algorithme de parcours en serpentin pour couvrir toute la grille
   - Crée un chemin qui alterne entre gauche-droite et droite-gauche à chaque ligne
   - Utilisé comme solution de secours quand un chemin spécifique ne peut être trouvé

5. **generateGrid**: Génère une grille complète adaptée au niveau de difficulté demandé.
   - Produit plusieurs grilles candidates avec différentes dispositions
   - Calcule la complexité de chaque grille pour sélectionner celle qui correspond à la difficulté
   - Propose des variantes (zigzag, coin, diagonale) pour enrichir l'expérience de jeu
   - Adapte intelligemment la complexité selon le niveau demandé (EASY, MEDIUM, HARD)

6. **validateGrid**: Valide qu'une grille respecte toutes les contraintes du jeu.
   - Vérifie la présence de tous les nombres requis (1 à N)
   - Confirme l'existence d'un chemin valide entre les nombres consécutifs
   - Retourne un objet détaillé avec le statut de validation et les erreurs éventuelles

7. **adjustDifficultyByDay**: Ajuste automatiquement la difficulté en fonction du jour de la semaine.
   - Propose une progression: facile en début de semaine, difficile le week-end
   - Permet une expérience de jeu variée sans intervention manuelle

8. **calculateGridComplexity**: Évalue la complexité d'une grille sur une échelle normalisée (0.1-1).
   - Analyse la distance moyenne entre les nombres consécutifs
   - Prend en compte la taille de la grille pour normaliser le résultat
   - Permet de classer objectivement les grilles par niveau de difficulté

9. **shuffleArray**: Fonction utilitaire qui mélange aléatoirement les éléments d'un tableau.
   - Utilise l'algorithme Fisher-Yates pour un mélange statistiquement équilibré
   - Garantit que les positions des nombres dans la grille sont véritablement aléatoires
