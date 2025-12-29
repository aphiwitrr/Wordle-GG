<script setup lang="ts">
import type { Statistics } from "../types/wordle";

defineProps<{
  isOpen: boolean;
  gameStatus: "won" | "lost" | "playing";
  solution: string;
  statistics: Statistics;
  guessCount: number;
}>();

const emit = defineEmits<{
  (e: "close"): void;
  (e: "playAgain"): void;
}>();
</script>

<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 transition-opacity duration-300"
  >
    <div
      class="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 max-w-sm w-full transform transition-all scale-100"
    >
      <h2 class="text-2xl font-bold text-center mb-4 dark:text-white">
        {{ gameStatus === "won" ? "You Won!" : "Game Over" }}
      </h2>

      <div v-if="gameStatus === 'lost'" class="text-center mb-6">
        <p class="text-gray-600 dark:text-gray-300">The word was:</p>
        <p
          class="text-xl font-bold mt-1 tracking-widest text-black dark:text-white"
        >
          {{ solution }}
        </p>
      </div>

      <!-- Statistics -->
      <div class="grid grid-cols-4 gap-2 mb-6 text-center">
        <div>
          <div class="text-2xl font-bold dark:text-white">
            {{ statistics.gamesPlayed }}
          </div>
          <div class="text-xs text-gray-500 dark:text-gray-400">Played</div>
        </div>
        <div>
          <div class="text-2xl font-bold dark:text-white">
            {{ statistics.successRate }}
          </div>
          <div class="text-xs text-gray-500 dark:text-gray-400">Win %</div>
        </div>
        <div>
          <div class="text-2xl font-bold dark:text-white">
            {{ statistics.currentStreak }}
          </div>
          <div class="text-xs text-gray-500 dark:text-gray-400">Streak</div>
        </div>
        <div>
          <div class="text-2xl font-bold dark:text-white">
            {{ statistics.maxStreak }}
          </div>
          <div class="text-xs text-gray-500 dark:text-gray-400">Max</div>
        </div>
      </div>

      <!-- Guess Distribution -->
      <h3 class="font-bold mb-3 dark:text-white">Guess Distribution</h3>
      <div class="space-y-1 mb-6">
        <div
          v-for="(count, guess) in statistics.winDistribution"
          :key="guess"
          class="flex items-center text-sm"
        >
          <div class="w-4 text-gray-500 dark:text-gray-400">{{ guess }}</div>
          <div class="flex-1 ml-2">
            <div
              class="bg-gray-500 text-white text-xs font-bold px-2 py-0.5"
              :class="{ 'bg-green-500': guessCount === parseInt(guess as string) && gameStatus === 'won' }"
              :style="{
                width: `${Math.max(
                  5,
                  (count / Math.max(1, statistics.gamesPlayed)) * 100
                )}%`,
              }"
            >
              {{ count }}
            </div>
          </div>
        </div>
      </div>

      <div class="flex justify-center">
        <button
          @click="emit('playAgain')"
          class="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-full shadow-lg transform transition hover:scale-105"
        >
          Play Again
        </button>
      </div>
    </div>
  </div>
</template>
