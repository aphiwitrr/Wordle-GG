<script setup lang="ts">
import { ref, watch } from "vue";
import { useWordle } from "./composables/useWordle";
import WordleGrid from "./components/WordleGrid.vue";
import VirtualKeyboard from "./components/VirtualKeyboard.vue";
import ResultModal from "./components/ResultModal.vue";

const {
  gameState,
  statistics,
  letterStatuses,
  shakeRowIndex,
  handleVirtualKey,
  startNewGame,
} = useWordle();

const showModal = ref(false);

const handleKey = (key: string) => {
  handleVirtualKey(key);
  if (gameState.value.status !== "playing" && !showModal.value) {
    // Small delay to let animation finish before showing modal
    setTimeout(() => {
      showModal.value = true;
    }, 1500);
  }
};

// Also show modal if game status changes (e.g. via keyboard)
watch(
  () => gameState.value.status,
  (newStatus) => {
    if (newStatus !== "playing") {
      setTimeout(() => {
        showModal.value = true;
      }, 1500);
    }
  }
);

const handlePlayAgain = () => {
  showModal.value = false;
  startNewGame();
};
</script>

<template>
  <div
    class="flex flex-col h-screen max-w-lg mx-auto bg-white dark:bg-gray-900 text-black dark:text-white"
  >
    <header
      class="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-800"
    >
      <div class="w-8">
        <!-- Placeholder for left icon -->
      </div>
      <h1 class="text-3xl font-bold font-serif tracking-wider">WORDLE</h1>
      <div class="w-8 flex justify-end">
        <button
          @click="showModal = true"
          class="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
        </button>
      </div>
    </header>

    <main
      class="flex-1 flex flex-col items-center justify-center p-2 overflow-hidden"
    >
      <!-- Grid -->
      <WordleGrid
        :guesses="gameState.guesses"
        :current-guess="gameState.currentGuess"
        :row-index="gameState.rowIndex"
        :shake-row-index="shakeRowIndex"
      />
    </main>

    <!-- Keyboard -->
    <VirtualKeyboard :letter-statuses="letterStatuses" @key="handleKey" />

    <!-- Modal -->
    <ResultModal
      :is-open="showModal"
      :game-status="gameState.status"
      :solution="gameState.solution"
      :statistics="statistics"
      :guess-count="gameState.rowIndex + 1"
      :score="gameState.score"
      :time-taken="gameState.timeTaken"
      @close="showModal = false"
      @play-again="handlePlayAgain"
    />
  </div>
</template>
