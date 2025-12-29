<script setup lang="ts">
import type { Tile } from "../types/wordle";

defineProps<{
  guesses: Tile[][];
  currentGuess: string;
  rowIndex: number;
  shakeRowIndex: number;
}>();

const getTileColor = (status: string) => {
  switch (status) {
    case "correct":
      return "bg-green-500 border-green-500 text-white";
    case "present":
      return "bg-yellow-500 border-yellow-500 text-white";
    case "absent":
      return "bg-gray-500 border-gray-500 text-white";
    default:
      return "border-gray-300 dark:border-gray-600";
  }
};
</script>

<template>
  <div class="grid grid-rows-6 gap-1.5 mb-2">
    <!-- Completed or Empty Rows -->
    <div
      v-for="(row, i) in guesses"
      :key="i"
      class="grid grid-cols-5 gap-1.5"
      :class="{ 'animate-shake': shakeRowIndex === i }"
    >
      <!-- If it's the current row, show input -->
      <template v-if="i === rowIndex">
        <div
          v-for="j in 5"
          :key="j"
          class="w-14 h-14 border-2 flex items-center justify-center text-3xl font-bold uppercase select-none transition-all duration-100"
          :class="[
            currentGuess[j - 1]
              ? 'border-gray-400 dark:border-gray-400 scale-105'
              : 'border-gray-200 dark:border-gray-700',
          ]"
        >
          {{ currentGuess[j - 1] || "" }}
        </div>
      </template>

      <!-- If it's a past row (revealed) -->
      <template v-else-if="row.length > 0">
        <div
          v-for="(tile, j) in row"
          :key="j"
          class="w-14 h-14 border-2 flex items-center justify-center text-3xl font-bold uppercase select-none tile-flip"
          :class="getTileColor(tile.status)"
          :style="{ animationDelay: `${j * 150}ms` }"
        >
          {{ tile.letter }}
        </div>
      </template>

      <!-- If it's a future row (empty) -->
      <template v-else>
        <div
          v-for="j in 5"
          :key="j"
          class="w-14 h-14 border-2 border-gray-200 dark:border-gray-700 flex items-center justify-center text-3xl font-bold uppercase select-none"
        ></div>
      </template>
    </div>
  </div>
</template>

<style scoped>
@keyframes flip {
  0% {
    transform: rotateX(0);
  }
  50% {
    transform: rotateX(90deg);
  }
  100% {
    transform: rotateX(0);
  }
}

.tile-flip {
  animation: flip 0.5s ease-in-out backwards;
}

@keyframes shake {
  10%,
  90% {
    transform: translate3d(-1px, 0, 0);
  }
  20%,
  80% {
    transform: translate3d(2px, 0, 0);
  }
  30%,
  50%,
  70% {
    transform: translate3d(-4px, 0, 0);
  }
  40%,
  60% {
    transform: translate3d(4px, 0, 0);
  }
}

.animate-shake {
  animation: shake 0.5s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
}
</style>
