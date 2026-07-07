<script setup lang="ts">
import { ref } from "vue";
import ImageCropper from "./ImageCropper.vue";

const props = defineProps<{
  initialUrl?: string | null;
}>();

const emit = defineEmits<{
  (e: "crop", blob: Blob): void;
}>();

const previewUrl = ref<string | null>(props.initialUrl || null);
const rawImageUrl = ref<string | null>(null);
const fileInput = ref<HTMLInputElement | null>(null);

const onFileSelected = (event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (file) {
    rawImageUrl.value = URL.createObjectURL(file);
    if (fileInput.value) fileInput.value.value = "";
  }
};

const onCrop = (blob: Blob) => {
  emit("crop", blob);
  previewUrl.value = URL.createObjectURL(blob);
  rawImageUrl.value = null;
};

const cancelCrop = () => {
  rawImageUrl.value = null;
};
</script>

<template>
  <div class="flex flex-col gap-3">
    <ImageCropper
      v-if="rawImageUrl"
      :image-url="rawImageUrl"
      @crop="onCrop"
      @cancel="cancelCrop"
    />

    <label class="text-sm font-bold tracking-wider text-neutral-700 uppercase">
      Foto del pacchetto *
    </label>

    <input
      ref="fileInput"
      type="file"
      accept="image/*"
      capture="environment"
      class="hidden"
      @change="onFileSelected"
    />

    <div
      class="group relative flex min-h-75 w-full cursor-pointer flex-col items-center justify-center overflow-hidden rounded-3xl border-2 border-dashed transition-all"
      :class="
        previewUrl
          ? 'border-transparent bg-neutral-100'
          : 'border-neutral-300 bg-neutral-50 hover:bg-neutral-100'
      "
      @click="fileInput?.click()"
    >
      <img
        v-if="previewUrl"
        :src="previewUrl"
        class="h-full w-full object-contain p-4 drop-shadow-xl transition-transform group-hover:scale-105"
      />
      <div v-else class="flex flex-col items-center gap-2 text-neutral-400">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-10 w-10"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          stroke-width="2"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
          />
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
        <span class="text-sm font-semibold">Scatta o carica</span>
      </div>

      <div
        v-if="previewUrl"
        class="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100"
      >
        <span
          class="rounded-full bg-white/90 px-4 py-2 text-sm font-bold text-black shadow-sm"
        >
          Cambia Foto
        </span>
      </div>
    </div>
  </div>
</template>
