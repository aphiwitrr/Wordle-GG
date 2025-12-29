<script setup lang="ts">
import type { LetterStatus } from "../types/wordle";

const props = defineProps<{
  letterStatuses: Record<string, LetterStatus>;
}>();

const emit = defineEmits<{
  (e: "key", key: string): void;
}>();

const keys = [
  ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
  ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
  ["ENTER", "Z", "X", "C", "V", "B", "N", "M", "BACKSPACE"],
];

const getKeyClass = (key: string) => {
  const status = props.letterStatuses[key];
  const base =
    "flex items-center justify-center rounded font-bold uppercase cursor-pointer select-none transition-colors duration-150 h-14 text-sm sm:text-base";

  if (key === "ENTER" || key === "BACKSPACE") {
    return `${base} px-3 sm:px-4 bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 text-black dark:text-white`;
  }

  switch (status) {
    case "correct":
      return `${base} flex-1 bg-green-500 hover:bg-green-600 text-white`;
    case "present":
      return `${base} flex-1 bg-yellow-500 hover:bg-yellow-600 text-white`;
    case "absent":
      return `${base} flex-1 bg-gray-500 hover:bg-gray-600 text-white`;
    default:
      return `${base} flex-1 bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 text-black dark:text-white`;
  }
};
</script>

<template>
  <div class="w-full max-w-lg px-2 pb-4">
    <div
      v-for="(row, i) in keys"
      :key="i"
      class="flex w-full gap-1.5 mb-2 justify-center"
    >
      <div
        v-for="key in row"
        :key="key"
        @click="emit('key', key)"
        :class="getKeyClass(key)"
      >
        <template v-if="key === 'BACKSPACE'">
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
              d="M12 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M3 12l6.414 6.414a2 2 0 001.414.586H19a2 2 0 002-2V7a2 2 0 00-2-2h-9.172a2 2 0 00-1.414.586L3 12z"
            />
          </svg>
        </template>
        <template v-else>
          {{ key }}
        </template>
      </div>
    </div>
  </div>
</template>
