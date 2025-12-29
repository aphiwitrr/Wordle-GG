import words from "an-array-of-english-words";

// Filter only 5-letter words and convert to uppercase
// This is done outside component functions to prevent re-filtering on re-render
const ALL_WORDS = words.filter(
  (word: string) => word.length === 5 && /^[a-zA-Z]+$/.test(word)
);

// Convert to uppercase for consistency
export const WORDS: string[] = ALL_WORDS.map((word: string) =>
  word.toUpperCase()
);

// For valid guesses, we use the same list (all 5-letter words are valid guesses)
export const VALID_GUESSES: string[] = WORDS;

// Create a Set for O(1) lookup performance
const WORDS_SET = new Set(WORDS);
const VALID_GUESSES_SET = new Set(VALID_GUESSES);

/**
 * Synchronous function to check if a word is valid
 * @param word - The word to validate (should be uppercase)
 * @returns boolean - True if the word is valid
 */
export function isWordValid(word: string): boolean {
  const upperWord = word.toUpperCase();
  return WORDS_SET.has(upperWord) || VALID_GUESSES_SET.has(upperWord);
}
