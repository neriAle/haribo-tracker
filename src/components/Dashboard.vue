<script setup lang="ts">
import { ref } from "vue";
import PacketCard from "./PacketCard.vue";

type FormattedPacket = {
  id: string;
  name: string;
  language: string;
  imageUrl: string;
  rating: number;
  categories: string[];
};

const props = defineProps<{
  initialPackets: FormattedPacket[];
}>();

// Stored in a ref so it can mutate with Fuse.js filtering
const displayedPackets = ref(props.initialPackets);
</script>

<template>
  <div class="flex flex-col gap-6 pb-24">
    <div
      class="flex h-14 w-full items-center justify-center rounded-2xl border-2 border-dashed border-neutral-200 bg-neutral-50 text-sm font-medium text-neutral-400"
    >
      [ Barra di Ricerca in arrivo ]
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
        Inizia ad aggiungere la tua collezione!
      </p>
    </div>

    <div v-else class="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
      <PacketCard
        v-for="packet in displayedPackets"
        :key="packet.id"
        v-bind="packet"
      />
    </div>
  </div>
</template>
