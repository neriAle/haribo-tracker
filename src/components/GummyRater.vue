<script setup lang="ts">
defineProps<{
  rating?: number | null;
}>();
</script>

<template>
  <div class="flex items-center gap-1" title="Valutazione">
    <!-- We define the bear shape once invisibly to reuse it perfectly -->
    <svg width="0" height="0" class="absolute hidden">
      <defs>
        <g id="bear-shape">
          <!-- Continuous Outer Silhouette -->
          <path
            class="bear-outline"
            d="M 38,17 C 30,10 20,20 25,30 C 21,35 20,40 22,45 C 10,48 10,65 22,68 C 20,78 22,88 30,92 C 35,100 45,95 50,95 C 55,95 65,100 70,92 C 78,88 80,78 78,68 C 90,65 90,48 78,45 C 80,40 79,35 75,30 C 80,20 70,10 62,17 C 55,14 45,14 38,17 Z"
          ></path>
          <!-- Internal Details (Neck, Arms, Legs) -->
          <path
            class="bear-lines"
            fill="none"
            d="M 32,44 C 40,48 60,48 68,44 M 22,45 C 35,50 35,65 24,67 M 78,45 C 65,50 65,65 76,67 M 30,92 C 45,85 40,70 24,67 M 70,92 C 55,85 60,70 76,67"
          ></path>
          <!-- Face -->
          <circle
            cx="38"
            cy="32"
            r="3.5"
            fill="currentColor"
            stroke="none"
          ></circle>
          <circle
            cx="62"
            cy="32"
            r="3.5"
            fill="currentColor"
            stroke="none"
          ></circle>
          <ellipse
            cx="50"
            cy="38"
            rx="4.5"
            ry="3"
            fill="currentColor"
            stroke="none"
          ></ellipse>
        </g>
      </defs>
    </svg>

    <template v-if="rating">
      <div v-for="i in 5" :key="i" class="relative h-6 w-6 drop-shadow-sm">
        <!-- Empty Bear (Translucent Outline) -->
        <svg
          class="absolute inset-0 h-full w-full opacity-40"
          style="color: var(--brand-yellow)"
          viewBox="0 0 100 100"
          stroke="currentColor"
          stroke-width="4"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <use href="#bear-shape" fill="transparent"></use>
        </svg>

        <!-- Full Bear -->
        <svg
          v-if="rating >= i"
          class="absolute inset-0 h-full w-full text-amber-600"
          viewBox="0 0 100 100"
          stroke="currentColor"
          stroke-width="4"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <use href="#bear-shape" fill="var(--brand-yellow)"></use>
        </svg>

        <!-- Half Bear (Clipped exactly at 50%) -->
        <svg
          v-else-if="rating >= i - 0.5"
          class="absolute inset-0 h-full w-full text-amber-600"
          style="clip-path: polygon(0 0, 50% 0, 50% 100%, 0% 100%)"
          viewBox="0 0 100 100"
          stroke="currentColor"
          stroke-width="4"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <use href="#bear-shape" fill="var(--brand-yellow)"></use>
        </svg>
      </div>
    </template>

    <span v-else class="text-xs font-medium text-neutral-400 italic"
      >Da valutare</span
    >
  </div>
</template>
