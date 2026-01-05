import { ref, onMounted, onUnmounted } from "vue";
import type {
  GameState,
  Statistics,
  Tile,
  LetterStatus,
} from "../types/wordle";
import { WORDS, isWordValid } from "../constants/words";

const MAX_GUESSES = 6;
const WORD_LENGTH = 5;

// Pseudo-random number generator for consistent words across devices
const seededRandom = (seed: number) => {
  const x = Math.sin(seed++) * 10000;
  return x - Math.floor(x);
};

export function useWordle() {
  const answer = ref("");
  const gameState = ref<GameState>({
    guesses: Array.from({ length: MAX_GUESSES }, () => []),
    currentGuess: "",
    solution: "",
    status: "playing",
    rowIndex: 0,
    score: 0,
    timeTaken: 0,
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
  const timerInterval = ref<NodeJS.Timeout | null>(null);
  const startTime = ref<number>(0);

  // Get word from seed or random
  const getWordFromSeed = (seed: number): string => {
    const randomIndex = Math.floor(seededRandom(seed) * WORDS.length);
    return WORDS[randomIndex];
  };

  const getRandomWord = (): string => {
    const randomIndex = Math.floor(Math.random() * WORDS.length);
    return WORDS[randomIndex];
  };

  // Synchronous word validation using the word list
  const validateWord = (word: string): boolean => {
    return isWordValid(word);
  };

  const startTimer = () => {
    if (timerInterval.value) clearInterval(timerInterval.value);
    startTime.value = Date.now();
    gameState.value.timeTaken = 0;

    timerInterval.value = setInterval(() => {
      if (gameState.value.status === "playing") {
        gameState.value.timeTaken = Math.floor(
          (Date.now() - startTime.value) / 1000
        );
      }
    }, 1000);
  };

  const stopTimer = () => {
    if (timerInterval.value) {
      clearInterval(timerInterval.value);
      timerInterval.value = null;
    }
  };

  const calculateScore = () => {
    if (gameState.value.status !== "won") {
      gameState.value.score = 0;
      return;
    }

    // Base score for winning
    let score = 1000;

    // Time penalty: -1 point per second
    score -= gameState.value.timeTaken || 0;

    // Guess efficiency bonus
    // Fewer guesses = Higher Score
    // e.g. 1 guess: +500, 6 guesses: +0
    score += (MAX_GUESSES - gameState.value.rowIndex) * 100;

    // Letter accuracy calculation
    // We sum up the value of letters in ALL guesses up to the winning one
    gameState.value.guesses.forEach((row, rowIndex) => {
      if (rowIndex > gameState.value.rowIndex) return; // Ignore future rows

      row.forEach((tile) => {
        if (tile.status === "correct") {
          score += 10; // +10 for Green position
        } else if (tile.status === "present") {
          score += 5; // +5 for Yellow letter
        }
      });
    });

    gameState.value.score = Math.max(0, score);
  };

  // Initialize Game
  const initGame = (forcedSolution?: string) => {
    // Check for URL param "seed" or "word"
    const params = new URLSearchParams(window.location.search);
    const seedParam = params.get("seed");

    if (seedParam) {
      // If seed is present, use it to start/reset the game immediately
      const seed = parseInt(seedParam, 10);
      if (!isNaN(seed)) {
        const seededWord = getWordFromSeed(seed);
        startNewGame(seededWord);
        return; // Skip loading stats/local storage state to force fresh competitive game
      }
    }

    // Load from localStorage if exists (normal mode)
    const savedState = localStorage.getItem("wordle_state");
    const savedStats = localStorage.getItem("wordle_stats");

    if (savedStats) {
      statistics.value = JSON.parse(savedStats);
    }

    if (savedState) {
      const parsed = JSON.parse(savedState);
      gameState.value = parsed;
      answer.value = parsed.solution;

      if (parsed.status === "playing") {
        // If resuming, we can't easily resume accurate timer unless we stored start time.
        // For simplicity in this challenge mode request, we might reset timer or just accept 0.
        // Let's just restart timer from 0 or last saved time.
        startTimer();
        // Adjust start time to account for already elapsed time
        startTime.value = Date.now() - (parsed.timeTaken || 0) * 1000;
      }

      recalculateLetterStatuses();
    } else {
      startNewGame(forcedSolution);
    }
  };

  const startNewGame = (forcedSolution?: string) => {
    stopTimer();

    let randomWord = forcedSolution;
    if (!randomWord) {
      // If no forced solution, check URL again just in case (e.g. play again clicked)
      const params = new URLSearchParams(window.location.search);
      const seedParam = params.get("seed");
      if (seedParam) {
        const seed = parseInt(seedParam, 10);
        // If we are playing "Again" with the same seed, it's boring (same word).
        // Usually competition is one-off or next seed.
        // BUT user said "Calculate score each time, reset old values on new game".
        // If they are competing, they might want to retry the SAME word to get better score, OR play new word.
        // Let's assume Play Again with Seed = Retry Same Seed (Practice) or if they want new challenge they change URL.
        // ACTUALLY, usually 'Play Again' in Wordle implies new random word.
        // Let's keep specific seed logic strict: if seed is in URL, ALWAYS use that seed.
        randomWord = getWordFromSeed(seed);
      } else {
        randomWord = getRandomWord();
      }
    }

    answer.value = randomWord!.toUpperCase();

    gameState.value = {
      guesses: Array.from({ length: MAX_GUESSES }, () => []),
      currentGuess: "",
      solution: answer.value,
      status: "playing",
      rowIndex: 0,
      score: 0,
      timeTaken: 0,
    };

    letterStatuses.value = {};
    startTimer();
    saveState();
  };

  const saveState = () => {
    localStorage.setItem("wordle_state", JSON.stringify(gameState.value));
    // Don't save stats for seeded games? Actually user wants to calculate score.
    // We can save stats generally.
    localStorage.setItem("wordle_stats", JSON.stringify(statistics.value));
  };

  const updateStatistics = (won: boolean) => {
    statistics.value.gamesPlayed++;
    statistics.value.lastPlayed = new Date().toISOString();

    if (won) {
      calculateScore(); // Calculate final score
      statistics.value.gamesWon++;
      statistics.value.currentStreak++;
      statistics.value.maxStreak = Math.max(
        statistics.value.currentStreak,
        statistics.value.maxStreak
      );
      statistics.value.winDistribution[gameState.value.rowIndex + 1]++;
    } else {
      statistics.value.currentStreak = 0;
      gameState.value.score = 0;
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
    gameState.value.rowIndex++; // prepare for next row (will be N after Nth guess)

    // Check Win/Loss BEFORE incrementing if we want rowIndex to represent number of guesses used?
    // No, rowIndex 0 is first guess. If I guess correctly at rowIndex 0, I used 1 guess.
    // Current logic: guesses stored at index, then index++.

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
      stopTimer();
      updateStatistics(true);
    } else if (gameState.value.rowIndex >= MAX_GUESSES) {
      gameState.value.status = "lost";
      stopTimer();
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
    // Don't call initGame here automatically if we want more control, but it's safe.
    initGame();
  });

  onUnmounted(() => {
    window.removeEventListener("keyup", handleKeyup);
    stopTimer();
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
