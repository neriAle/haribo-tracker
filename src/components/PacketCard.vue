<script setup lang="ts">
import GummyRater from "./GummyRater.vue";
import { getCategoryStyle } from "../utils/categoryStyles";

defineProps<{
  id: string;
  name: string;
  language: string;
  imageUrl: string;
  categories: string[];
  rating?: number | null;
}>();
</script>

<template>
  <div
    class="group relative flex cursor-pointer flex-col overflow-hidden rounded-2xl border border-neutral-100 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md"
  >
    <!-- Image Section -->
    <div
      class="relative flex aspect-square w-full items-center justify-center bg-neutral-50/50 p-4"
    >
      <img
        v-if="imageUrl"
        :src="imageUrl"
        :alt="name"
        class="h-full w-full object-contain drop-shadow-md transition-transform duration-300 group-hover:scale-105"
      />

      <!-- Fallback Emoji -->
      <div
        v-else
        class="text-5xl opacity-20 transition-transform duration-300 group-hover:scale-110"
      >
        🍬
      </div>

      <!-- Language Tag -->
      <div
        class="absolute top-2 left-2 rounded-md bg-white/80 px-2 py-0.5 text-xs font-bold tracking-wider text-neutral-600 uppercase shadow-sm backdrop-blur-sm"
      >
        {{ language }}
      </div>
    </div>

    <!-- Content Section -->
    <div class="flex flex-1 flex-col justify-between gap-2 p-4">
      <div>
        <!-- Multi-Category Pills -->
        <div class="mb-2 flex flex-wrap gap-1.5">
          <span
            v-for="cat in categories"
            :key="cat"
            :class="[
              'rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase shadow-sm transition-colors',
              getCategoryStyle(cat).class,
            ]"
            :style="getCategoryStyle(cat).style"
          >
            {{ cat }}
          </span>
        </div>

        <h3
          class="line-clamp-2 text-lg leading-tight font-bold text-neutral-800"
        >
          {{ name }}
        </h3>
      </div>

      <!-- Rating Section -->
      <div
        class="mt-2 flex items-center justify-between border-t border-neutral-100 pt-3"
      >
        <GummyRater :rating="rating" />
      </div>
    </div>
  </div>
</template>
