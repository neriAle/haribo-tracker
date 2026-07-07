<script setup lang="ts">
import { ref, watch } from "vue";

const props = defineProps<{
  isOpen: boolean;
  availableLanguages: string[];
  initialFilters;
}>();

const emit = defineEmits<{
  (e: "close"): void;
  (e: "apply", filters): void;
}>();

// Local state for the form so the filters don't apply until "Apply" is clicked
const filters = ref({ ...props.initialFilters });

// Reset local filters when modal opens to match current applied filters
watch(
  () => props.isOpen,
  (newVal) => {
    if (newVal) filters.value = { ...props.initialFilters };
  },
);

const apply = () => emit("apply", { ...filters.value });

const reset = () => {
  filters.value = {
    ratingOp: ">=",
    ratingVal: 0,
    location: "",
    date: "",
    language: "",
  };
  emit("apply", { ...filters.value });
};
</script>

<template>
  <div
    v-if="isOpen"
    class="pb-safe fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 backdrop-blur-sm sm:items-center"
  >
    <div
      class="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl transition-all"
    >
      <div
        class="flex items-center justify-between border-b border-neutral-100 p-4"
      >
        <h2 class="text-lg font-extrabold text-neutral-900">Filtri Avanzati</h2>
        <button
          class="rounded-full bg-neutral-100 p-2 text-neutral-500 hover:bg-neutral-200"
          @click="emit('close')"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fill-rule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clip-rule="evenodd"
            />
          </svg>
        </button>
      </div>

      <div class="flex flex-col gap-5 p-6">
        <div class="flex flex-col gap-2">
          <label
            class="text-xs font-bold tracking-wider text-neutral-500 uppercase"
            >Valutazione</label
          >
          <div class="flex gap-2">
            <select
              v-model="filters.ratingOp"
              class="rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 font-medium outline-none focus:border-(--brand-yellow)"
            >
              <option value=">=">&ge;</option>
              <option value="<=">&le;</option>
              <option value="==">Uguale a</option>
            </select>
            <input
              v-model.number="filters.ratingVal"
              type="number"
              step="0.5"
              min="0"
              max="5"
              class="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-2 font-medium outline-none focus:border-(--brand-yellow)"
            />
          </div>
        </div>

        <div class="flex flex-col gap-2">
          <label
            class="text-xs font-bold tracking-wider text-neutral-500 uppercase"
            >Lingua</label
          >
          <select
            v-model="filters.language"
            class="rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 font-medium outline-none focus:border-(--brand-yellow)"
          >
            <option value="">Tutte le lingue</option>
            <option
              v-for="lang in availableLanguages"
              :key="lang"
              :value="lang"
            >
              {{ lang }}
            </option>
          </select>
        </div>

        <div class="flex flex-col gap-2">
          <label
            class="text-xs font-bold tracking-wider text-neutral-500 uppercase"
            >Luogo</label
          >
          <input
            v-model="filters.location"
            type="text"
            placeholder="es. Germany"
            class="rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 font-medium outline-none focus:border-(--brand-yellow)"
          />
        </div>

        <div class="flex flex-col gap-2">
          <label
            class="text-xs font-bold tracking-wider text-neutral-500 uppercase"
            >Data Acquisizione</label
          >
          <input
            v-model="filters.date"
            type="text"
            placeholder="es. 2024"
            class="rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 font-medium outline-none focus:border-(--brand-yellow)"
          />
        </div>
      </div>

      <div class="flex gap-3 bg-neutral-50 p-4">
        <button
          class="transition-active w-1/3 rounded-xl bg-neutral-200 py-3 text-sm font-bold text-neutral-700 active:scale-95"
          @click="reset"
        >
          Reset
        </button>
        <button
          class="transition-active w-2/3 rounded-xl bg-(--brand-yellow) py-3 text-sm font-extrabold text-black shadow-md active:scale-95"
          @click="apply"
        >
          Applica Filtri
        </button>
      </div>
    </div>
  </div>
</template>
