export type Cell = {
    row: number;
    col: number;
    value: number | null;
    isPartOfPath: boolean;
    isSelected: boolean;
  };
  
  export type Grid = Cell[][];
  
  export type Coordinate = {
    row: number;
    col: number;
  };
  
  export type Difficulty = 'EASY' | 'MEDIUM' | 'HARD';
  
  export type ValidationResult = {
    isValid: boolean;
    hasAllNumbers: boolean;
    hasValidPath: boolean;
    errors?: string[];
  };

  export type Path = Coordinate[];