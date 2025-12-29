export type LetterStatus = "absent" | "present" | "correct" | "tbd";

export interface Tile {
  letter: string;
  status: LetterStatus;
}

export interface GameState {
  guesses: Tile[][];
  currentGuess: string;
  solution: string;
  status: "playing" | "won" | "lost";
  rowIndex: number;
}

export interface Statistics {
  gamesPlayed: number;
  gamesWon: number;
  currentStreak: number;
  maxStreak: number;
  winDistribution: Record<number, number>;
  lastPlayed: string; // ISO date string
  successRate: number;
}
