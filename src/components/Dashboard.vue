<script setup lang="ts">
import { ref, computed } from "vue";
import Fuse from "fuse.js";
import PacketCard from "./PacketCard.vue";
import FilterModal from "./FilterModal.vue";
import { getCategoryStyle } from "../utils/categoryStyles";

type FormattedPacket = {
  id: string;
  name: string;
  language: string;
  locationAcquired?: string;
  dateAcquired?: string;
  imageUrl: string;
  rating: number;
  categories: string[];
  createdAt: number;
};

type Category = { id: number; name: string };

const props = defineProps<{
  initialPackets: FormattedPacket[];
  categories: Category[];
}>();

// State
const searchText = ref("");
const selectedCategories = ref<string[]>([]);
const sortOption = ref("name-asc");
const isFilterModalOpen = ref(false);

const advancedFilters = ref({
  ratingOp: ">=",
  ratingVal: 0,
  location: "",
  date: "",
  language: "",
});

// Dynamically compute available languages for the dropdown
const availableLanguages = computed(() => {
  const langs = props.initialPackets.map((p) => p.language).filter(Boolean);
  return [...new Set(langs)].sort();
});

const toggleCategory = (categoryName: string) => {
  const index = selectedCategories.value.indexOf(categoryName);
  if (index === -1) {
    selectedCategories.value.push(categoryName);
  } else {
    selectedCategories.value.splice(index, 1);
  }
};

// This will automatically re-run whenever selectedCategories changes!
const displayedPackets = computed(() => {
  let result = props.initialPackets;

  // 1. Fuse.js Fuzzy Search
  if (searchText.value.trim() !== "") {
    const fuse = new Fuse(result, {
      keys: ["name"],
      threshold: 0.3, // 0.0 is exact match, 1.0 matches anything
    });
    result = fuse.search(searchText.value).map((res) => res.item);
  }

  // 2. Category AND filtering
  if (selectedCategories.value.length > 0) {
    result = result.filter((packet) =>
      selectedCategories.value.every((selectedCat) =>
        packet.categories.includes(selectedCat),
      ),
    );
  }

  // 3. Advanced Filters
  const f = advancedFilters.value;
  result = result.filter((p) => {
    // Rating
    let ratingMatch = true;
    if (f.ratingOp === ">=") ratingMatch = p.rating >= f.ratingVal;
    if (f.ratingOp === "<=") ratingMatch = p.rating <= f.ratingVal;
    if (f.ratingOp === "==") ratingMatch = p.rating === f.ratingVal;

    // Text partial matches (case insensitive)
    const locMatch =
      !f.location ||
      (p.locationAcquired || "")
        .toLowerCase()
        .includes(f.location.toLowerCase());
    // Since date could be handled as a string in this specific app
    const dateStr = p.dateAcquired || "";
    const dateMatch =
      !f.date || dateStr.toLowerCase().includes(f.date.toLowerCase());

    // Exact language match
    const langMatch = !f.language || p.language === f.language;

    return ratingMatch && locMatch && dateMatch && langMatch;
  });

  // 4. Sorting
  return result.sort((a, b) => {
    switch (sortOption.value) {
      case "name-asc":
        return a.name.localeCompare(b.name);
      case "name-desc":
        return b.name.localeCompare(a.name);
      case "rating-desc":
        return b.rating - a.rating;
      case "rating-asc":
        return a.rating - b.rating;
      case "date-desc":
        return b.createdAt - a.createdAt;
      case "date-asc":
        return a.createdAt - b.createdAt;
      default:
        return 0;
    }
  });
});
</script>

<template>
  <div class="flex flex-col gap-5 pb-24">
    <div class="flex gap-2">
      <div class="relative flex-1">
        <div
          class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3"
        >
          <svg
            class="h-5 w-5 text-neutral-400"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
        <input
          v-model="searchText"
          type="text"
          placeholder="Cerca per nome..."
          class="block w-full rounded-2xl border border-neutral-200 bg-white py-3 pr-4 pl-10 text-sm font-medium shadow-sm transition-shadow outline-none focus:border-(--brand-yellow) focus:ring-2 focus:ring-(--brand-yellow)/20"
        />
        <button
          v-if="searchText"
          class="absolute inset-y-0 right-0 flex items-center pr-3 text-neutral-400 hover:text-neutral-600"
          aria-label="Cerca testo"
          @click="searchText = ''"
        >
          <svg
            class="h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fill-rule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clip-rule="evenodd"
            />
          </svg>
        </button>
      </div>

      <div class="relative shrink-0">
        <select
          v-model="sortOption"
          class="h-full w-12 appearance-none rounded-2xl border border-neutral-200 bg-white px-3 text-transparent shadow-sm transition-shadow outline-none focus:border-(--brand-yellow) focus:ring-2 focus:ring-(--brand-yellow)/20 sm:w-auto sm:pr-8 sm:text-neutral-700"
        >
          <option value="name-asc">A-Z (Nome)</option>
          <option value="name-desc">Z-A (Nome)</option>
          <option value="date-desc">Più Recenti</option>
          <option value="date-asc">Meno Recenti</option>
          <option value="rating-desc">Voto Migliore</option>
          <option value="rating-asc">Voto Peggiore</option>
        </select>
        <div
          class="pointer-events-none absolute inset-0 flex items-center justify-center sm:justify-end sm:pr-2"
        >
          <svg
            class="h-5 w-5 text-neutral-600"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12"
            />
          </svg>
        </div>
      </div>

      <button
        class="flex h-12.5 w-12.5 shrink-0 items-center justify-center rounded-2xl border border-neutral-200 bg-white text-neutral-600 shadow-sm transition-colors hover:bg-(--brand-green) active:scale-95"
        :class="{
          'ring-2 ring-(--brand-yellow) ring-offset-1':
            advancedFilters.location ||
            advancedFilters.date ||
            advancedFilters.language ||
            advancedFilters.ratingVal > 0,
        }"
        aria-label="Apri filtri avanzati"
        @click="isFilterModalOpen = true"
      >
        <svg
          class="h-5 w-5"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
          />
        </svg>
      </button>
    </div>

    <div
      class="flex w-full gap-2 overflow-x-auto pt-1 pb-2 [&::-webkit-scrollbar]:hidden"
    >
      <button
        v-for="cat in categories"
        :key="cat.id"
        type="button"
        class="shrink-0 rounded-full px-4 py-2 text-sm font-bold tracking-wider uppercase transition-all"
        :class="[
          selectedCategories.includes(cat.name)
            ? 'scale-105 shadow-md ring-2 ring-neutral-300 ring-offset-1'
            : 'opacity-50 grayscale hover:opacity-100 hover:grayscale-0',
          getCategoryStyle(cat.name).class,
        ]"
        :style="getCategoryStyle(cat.name).style"
        @click="toggleCategory(cat.name)"
      >
        {{ cat.name }}
      </button>
    </div>

    <div
      v-if="displayedPackets.length === 0"
      class="flex flex-col items-center justify-center py-20 text-center"
    >
      <div class="mb-4 text-6xl opacity-20">🍬</div>
      <h3 class="text-lg font-bold text-neutral-900">
        Nessun pacchetto trovato
      </h3>
      <p class="text-sm text-neutral-500">
        Prova a modificare i filtri o la ricerca!
      </p>
      <button
        class="mt-4 rounded-full bg-neutral-100 px-4 py-2 text-sm font-bold text-neutral-600"
        aria-label="Cancella ricerca"
        @click="
          searchText = '';
          selectedCategories = [];
        "
      >
        Rimuovi Filtri Rapidi
      </button>
    </div>

    <div v-else class="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
      <PacketCard
        v-for="(packet, index) in displayedPackets"
        :key="packet.id"
        v-bind="packet"
        :eager-load="index < 4"
      />
    </div>

    <FilterModal
      :is-open="isFilterModalOpen"
      :initial-filters="advancedFilters"
      :available-languages="availableLanguages"
      @close="isFilterModalOpen = false"
      @apply="
        (f) => {
          advancedFilters = f;
          isFilterModalOpen = false;
        }
      "
    />
  </div>
</template>
