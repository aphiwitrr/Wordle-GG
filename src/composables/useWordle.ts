import { ref, onMounted } from "vue";
import type {
  GameState,
  Statistics,
  Tile,
  LetterStatus,
} from "../types/wordle";
import { WORDS, isWordValid } from "../constants/words";

const MAX_GUESSES = 6;
const WORD_LENGTH = 5;

export function useWordle() {
  const answer = ref("");
  const gameState = ref<GameState>({
    guesses: Array.from({ length: MAX_GUESSES }, () => []),
    currentGuess: "",
    solution: "",
    status: "playing",
    rowIndex: 0,
  });

  const statistics = ref<Statistics>({
    gamesPlayed: 0,
    gamesWon: 0,
    currentStreak: 0,
    maxStreak: 0,
    winDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 },
    lastPlayed: "",
    successRate: 0,
  });

  const letterStatuses = ref<Record<string, LetterStatus>>({});
  const shakeRowIndex = ref<number>(-1);

  // Get random word from the word list (synchronous, no API needed)
  const getRandomWord = (): string => {
    const randomIndex = Math.floor(Math.random() * WORDS.length);
    return WORDS[randomIndex];
  };

  // Synchronous word validation using the word list
  const validateWord = (word: string): boolean => {
    return isWordValid(word);
  };

  // Initialize Game
  const initGame = (forcedSolution?: string) => {
    // Load from localStorage if exists
    const savedState = localStorage.getItem("wordle_state");
    const savedStats = localStorage.getItem("wordle_stats");

    if (savedStats) {
      statistics.value = JSON.parse(savedStats);
    }

    if (savedState) {
      const parsed = JSON.parse(savedState);
      // For this demo, simple resume
      gameState.value = parsed;
      answer.value = parsed.solution;

      recalculateLetterStatuses();
    } else {
      startNewGame(forcedSolution);
    }
  };

  const startNewGame = (forcedSolution?: string) => {
    const randomWord = forcedSolution || getRandomWord();
    answer.value = randomWord.toUpperCase();

    gameState.value = {
      guesses: Array.from({ length: MAX_GUESSES }, () => []),
      currentGuess: "",
      solution: answer.value,
      status: "playing",
      rowIndex: 0,
    };

    letterStatuses.value = {};
    saveState();
  };

  const saveState = () => {
    localStorage.setItem("wordle_state", JSON.stringify(gameState.value));
    localStorage.setItem("wordle_stats", JSON.stringify(statistics.value));
  };

  const updateStatistics = (won: boolean) => {
    statistics.value.gamesPlayed++;
    statistics.value.lastPlayed = new Date().toISOString();

    if (won) {
      statistics.value.gamesWon++;
      statistics.value.currentStreak++;
      statistics.value.maxStreak = Math.max(
        statistics.value.currentStreak,
        statistics.value.maxStreak
      );
      statistics.value.winDistribution[gameState.value.rowIndex + 1]++;
    } else {
      statistics.value.currentStreak = 0;
    }

    statistics.value.successRate = Math.round(
      (statistics.value.gamesWon / statistics.value.gamesPlayed) * 100
    );
    saveState();
  };

  // Input Handling
  const handleKeyup = (e: KeyboardEvent) => {
    if (gameState.value.status !== "playing") return;

    const key = e.key.toUpperCase();

    if (key === "ENTER") {
      submitGuess();
    } else if (key === "BACKSPACE") {
      gameState.value.currentGuess = gameState.value.currentGuess.slice(0, -1);
    } else if (/^[A-Z]$/.test(key)) {
      if (gameState.value.currentGuess.length < WORD_LENGTH) {
        gameState.value.currentGuess += key;
      }
    }
  };

  const handleVirtualKey = (key: string) => {
    if (gameState.value.status !== "playing") return;

    if (key === "ENTER") {
      submitGuess();
    } else if (key === "DEL" || key === "BACKSPACE") {
      gameState.value.currentGuess = gameState.value.currentGuess.slice(0, -1);
    } else if (/^[A-Z]$/.test(key)) {
      if (gameState.value.currentGuess.length < WORD_LENGTH) {
        gameState.value.currentGuess += key;
      }
    }
  };

  const submitGuess = () => {
    if (gameState.value.currentGuess.length !== WORD_LENGTH) {
      triggerShake();
      return;
    }

    const isValid = validateWord(gameState.value.currentGuess);
    if (!isValid) {
      triggerShake();
      return;
    }

      // Process Guess
      const guessWord = gameState.value.currentGuess;
      const currentTiles: Tile[] = guessWord.split("").map((char, index) => {
        let status: LetterStatus = "absent";
        // Preliminary status
        if (answer.value[index] === char) {
          status = "correct";
        } else if (answer.value.includes(char)) {
          status = "present";
        }
        return { letter: char, status };
      });

      // Precise coloring logic (handle duplicates)
      const solutionChars = answer.value.split("");
      // First pass: correct
      currentTiles.forEach((tile, i) => {
        if (tile.letter === solutionChars[i]) {
          tile.status = "correct";
          solutionChars[i] = "_"; // mark used
        }
      });
      // Second pass: present
      currentTiles.forEach((tile, i) => {
        if (tile.status === "correct") return;

        const targetIndex = solutionChars.indexOf(tile.letter);
        if (targetIndex > -1) {
          tile.status = "present";
          solutionChars[targetIndex] = "_";
        } else {
          tile.status = "absent";
        }
      });

      // Add to history
      gameState.value.guesses[gameState.value.rowIndex] = currentTiles;
      gameState.value.rowIndex++;
      gameState.value.currentGuess = "";

      // Update letter statuses for keyboard
      const newLetterStatuses = { ...letterStatuses.value };
      currentTiles.forEach((tile) => {
        const currentStatus = newLetterStatuses[tile.letter];
        if (tile.status === "correct") {
          newLetterStatuses[tile.letter] = "correct";
        } else if (tile.status === "present" && currentStatus !== "correct") {
          newLetterStatuses[tile.letter] = "present";
        } else if (
          tile.status === "absent" &&
          currentStatus !== "correct" &&
          currentStatus !== "present"
        ) {
          newLetterStatuses[tile.letter] = "absent";
        }
      });
      letterStatuses.value = newLetterStatuses;

    // Check Win/Loss
    if (guessWord === answer.value) {
      gameState.value.status = "won";
      updateStatistics(true);
    } else if (gameState.value.rowIndex >= MAX_GUESSES) {
      gameState.value.status = "lost";
      updateStatistics(false);
    } else {
      saveState();
    }
  };

  const triggerShake = () => {
    shakeRowIndex.value = gameState.value.rowIndex;
    setTimeout(() => {
      shakeRowIndex.value = -1;
    }, 500);
  };

  const recalculateLetterStatuses = () => {
    // Replay history to build letter statuses
    const newLetterStatuses: Record<string, LetterStatus> = {};
    gameState.value.guesses.forEach((row) => {
      row.forEach((tile) => {
        const currentStatus = newLetterStatuses[tile.letter];
        if (tile.status === "correct") {
          newLetterStatuses[tile.letter] = "correct";
        } else if (tile.status === "present" && currentStatus !== "correct") {
          newLetterStatuses[tile.letter] = "present";
        } else if (
          tile.status === "absent" &&
          currentStatus !== "correct" &&
          currentStatus !== "present"
        ) {
          newLetterStatuses[tile.letter] = "absent";
        }
      });
    });
    letterStatuses.value = newLetterStatuses;
  };

  onMounted(() => {
    window.addEventListener("keyup", handleKeyup);
    initGame();
  });

  return {
    gameState,
    statistics,
    letterStatuses,
    shakeRowIndex,
    handleVirtualKey,
    startNewGame,
  };
}
