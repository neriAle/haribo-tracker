<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from "vue";
import Cropper from "cropperjs";

const props = defineProps<{
  imageUrl: string;
}>();

const emit = defineEmits<{
  (e: "crop", blob: Blob): void;
  (e: "cancel"): void;
}>();

const imageRef = ref<HTMLImageElement | null>(null);
let cropper: Cropper | null = null;

const initCropper = () => {
  if (cropper) {
    cropper.destroy();
  }
  if (imageRef.value) {
    cropper = new Cropper(imageRef.value, {
      aspectRatio: NaN,
      viewMode: 1,
      autoCropArea: 0.95,
      background: false,
      guides: true,
      center: true,
      highlight: false,
      responsive: true,
      checkOrientation: false,
    });
  }
};

onMounted(() => {
  initCropper();
});

onUnmounted(() => {
  if (cropper) {
    cropper.destroy();
  }
});

// React if the user swaps the image while the cropper is already open
watch(
  () => props.imageUrl,
  (newUrl) => {
    if (cropper && newUrl) cropper.replace(newUrl);
  },
);

const handleCrop = () => {
  if (!cropper) return;

  cropper
    .getCroppedCanvas({
      maxHeight: 800,
      maxWidth: 1200,
    })
    .toBlob(
      (blob) => {
        if (blob) emit("crop", blob);
      },
      "image/webp",
      0.8,
    );
};
</script>

<template>
  <div
    class="fixed inset-0 z-50 flex touch-none flex-col bg-black/95 backdrop-blur-md"
  >
    <div
      class="flex items-center justify-between px-4 pt-[calc(env(safe-area-inset-top)+1rem)] pb-4 text-white"
    >
      <button
        type="button"
        class="shrink-0 text-sm font-medium transition-opacity hover:opacity-70"
        @click="emit('cancel')"
      >
        Annulla
      </button>
      <span
        class="truncate px-2 text-center text-sm font-bold tracking-wider uppercase"
      >
        Inquadra
      </span>
      <button
        type="button"
        class="shrink-0 rounded-full bg-(--brand-yellow) px-4 py-1.5 text-sm font-bold text-black transition-transform active:scale-95"
        @click="handleCrop"
      >
        Fatto
      </button>
    </div>

    <!-- Cropper Container -->
    <div class="flex-1 overflow-hidden p-4">
      <div class="h-full w-full">
        <img
          ref="imageRef"
          :src="imageUrl"
          alt="Da ritagliare"
          class="block max-w-full"
        />
      </div>
    </div>

    <div class="h-12 w-full pb-[env(safe-area-inset-bottom)]"></div>
  </div>
</template>

<style>
.cropper-view-box {
  border-radius: 12px;
  outline: 2px solid var(--brand-yellow);
  outline-color: var(--brand-yellow);
}
.cropper-line {
  background-color: transparent;
}
.cropper-point {
  background-color: var(--brand-yellow);
  border-radius: 50%;
  width: 12px;
  height: 12px;
  opacity: 0.9;
}
</style>
