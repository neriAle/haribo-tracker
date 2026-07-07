<script setup lang="ts">
import { ref, computed } from "vue";
import PacketCard from "./PacketCard.vue";
import { getCategoryStyle } from "../utils/categoryStyles";

type FormattedPacket = {
  id: string;
  name: string;
  language: string;
  locationAcquired?: string;
  imageUrl: string;
  rating: number;
  categories: string[];
};

type Category = {
  id: number;
  name: string;
};

const props = defineProps<{
  initialPackets: FormattedPacket[];
  categories: Category[];
}>();

// Track which categories the user has clicked
const selectedCategories = ref<string[]>([]);

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

  // Apply Category AND filtering
  if (selectedCategories.value.length > 0) {
    result = result.filter((packet) =>
      // The packet must include EVERY category that is currently selected
      selectedCategories.value.every((selectedCat) =>
        packet.categories.includes(selectedCat),
      ),
    );
  }

  return result;
});
</script>

<template>
  <div class="flex flex-col gap-6 pb-24">
    <div
      class="flex h-14 w-full items-center justify-center rounded-2xl border-2 border-dashed border-neutral-200 bg-neutral-50 text-sm font-medium text-neutral-400"
    >
      [ Barra di Ricerca in arrivo ]
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
      <p class="text-sm text-neutral-500">Prova a rimuovere qualche filtro!</p>
    </div>

    <div v-else class="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
      <PacketCard
        v-for="(packet, index) in displayedPackets"
        :key="packet.id"
        v-bind="packet"
        :eager-load="index < 4"
      />
    </div>
  </div>
</template>
