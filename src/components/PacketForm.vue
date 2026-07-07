<script setup lang="ts">
import { ref } from "vue";
import ImageUploader from "./ImageUploader.vue";
import GummyRater from "./GummyRater.vue";
import { getCategoryStyle } from "../utils/categoryStyles";
import { uploadImageToR2, savePacket, deletePacket } from "../utils/api";

type Category = { id: number; name: string };
type PacketPayload = {
  id?: string;
  name: string;
  language: string;
  imageUrl: string;
  categoryIds: number[];
  rating: number | null;
  dateAcquired: string;
  locationAcquired: string;
  comment: string;
};

const props = defineProps<{
  initialData?: Partial<PacketPayload>;
  categories: Category[];
  isEdit?: boolean;
}>();

const formData = ref<PacketPayload>({
  name: props.initialData?.name || "",
  language: props.initialData?.language || "",
  imageUrl: props.initialData?.imageUrl || "",
  categoryIds: props.initialData?.categoryIds || [],
  rating: props.initialData?.rating || null,
  dateAcquired: props.initialData?.dateAcquired || "",
  locationAcquired: props.initialData?.locationAcquired || "",
  comment: props.initialData?.comment || "",
});

const croppedBlob = ref<Blob | null>(null);
const isSubmitting = ref(false);
const isDeleting = ref(false);
const errorMessage = ref("");

const toggleCategory = (id: number) => {
  const index = formData.value.categoryIds.indexOf(id);
  if (index === -1) {
    formData.value.categoryIds.push(id);
  } else {
    formData.value.categoryIds.splice(index, 1);
  }
};

const submitForm = async () => {
  try {
    errorMessage.value = "";
    isSubmitting.value = true;

    if (!formData.value.name || formData.value.categoryIds.length === 0) {
      throw new Error("Compila tutti i campi obbligatori (Nome, Categoria).");
    }

    if (!formData.value.imageUrl && !croppedBlob.value) {
      throw new Error("Devi caricare una foto del pacchetto.");
    }

    let finalImageUrl = formData.value.imageUrl;
    if (croppedBlob.value) {
      finalImageUrl = await uploadImageToR2(croppedBlob.value);
    }

    const payload = {
      ...formData.value,
      imageUrl: finalImageUrl,
      rating: formData.value.rating || 0,
    };

    await savePacket(payload, !!props.isEdit, props.initialData?.id);
    window.location.href = "/";
  } catch (error) {
    errorMessage.value = error.message;
  } finally {
    isSubmitting.value = false;
  }
};

const handleDelete = async () => {
  if (!props.initialData?.id) return;

  const confirmed = window.confirm(
    `Sei sicuro di voler eliminare "${formData.value.name}"? Questa azione non può essere annullata.`,
  );

  if (!confirmed) return;

  try {
    errorMessage.value = "";
    isDeleting.value = true;

    await deletePacket(props.initialData.id);
    window.location.href = "/";
  } catch (error) {
    errorMessage.value = error.message;
    isDeleting.value = false;
  }
};
</script>

<template>
  <form
    class="mx-auto flex max-w-lg flex-col gap-8 pb-24"
    @submit.prevent="submitForm"
  >
    <div class="flex flex-col gap-1">
      <h1 class="text-3xl font-extrabold tracking-tight text-neutral-900">
        {{ isEdit ? "Modifica Pacchetto" : "Nuovo Pacchetto" }}
      </h1>
      <p class="text-sm text-neutral-500">
        I campi contrassegnati con l'asterisco (*) sono obbligatori.
      </p>
    </div>

    <div
      v-if="errorMessage"
      class="rounded-xl border border-red-100 bg-red-50 p-4 text-sm font-medium text-red-800"
    >
      {{ errorMessage }}
    </div>

    <ImageUploader
      :initial-url="formData.imageUrl"
      @crop="(blob) => (croppedBlob = blob)"
    />

    <!-- Mandatory Section -->
    <div
      class="flex flex-col gap-6 rounded-3xl border border-neutral-100 bg-neutral-50 p-6"
    >
      <div class="flex flex-col gap-2">
        <label
          for="name"
          class="text-xs font-bold tracking-wider text-neutral-500 uppercase"
          >Nome *</label
        >
        <input
          id="name"
          v-model="formData.name"
          type="text"
          placeholder="es. Tropifrutti"
          class="rounded-xl border border-neutral-200 bg-white px-4 py-3 font-medium transition-colors outline-none focus:border-(--brand-yellow) focus:ring-2 focus:ring-(--brand-yellow)/20"
        />
      </div>

      <div class="flex flex-col gap-3">
        <label
          class="text-xs font-bold tracking-wider text-neutral-500 uppercase"
          >Categorie *</label
        >
        <div class="flex flex-wrap gap-2">
          <button
            v-for="cat in categories"
            :key="cat.id"
            type="button"
            class="rounded-full px-4 py-2 text-sm font-bold tracking-wider uppercase transition-all"
            :class="[
              formData.categoryIds.includes(cat.id)
                ? 'scale-105 shadow-md ring-2 ring-neutral-300 ring-offset-1'
                : 'opacity-50 grayscale hover:opacity-100 hover:grayscale-0',
              getCategoryStyle(cat.name).class,
            ]"
            :style="getCategoryStyle(cat.name).style"
            @click="toggleCategory(cat.id)"
          >
            {{ cat.name }}
          </button>
        </div>
      </div>
    </div>

    <!-- Optional Section -->
    <div
      class="flex flex-col gap-6 rounded-3xl border border-neutral-100 bg-white p-6 shadow-sm"
    >
      <h3 class="font-bold text-neutral-800">Dettagli Opzionali</h3>

      <div class="flex flex-col gap-2">
        <label
          for="language"
          class="text-xs font-bold tracking-wider text-neutral-500 uppercase"
          >Lingua</label
        >
        <input
          id="language"
          v-model="formData.language"
          type="text"
          placeholder="es. IT, EN, NL"
          class="rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 font-medium uppercase transition-colors outline-none focus:border-(--brand-yellow) focus:bg-white"
        />
      </div>

      <div class="flex flex-col gap-3">
        <label
          class="text-xs font-bold tracking-wider text-neutral-500 uppercase"
          >Valutazione</label
        >
        <div class="flex items-center gap-4">
          <input
            v-model.number="formData.rating"
            type="range"
            min="0"
            max="5"
            step="0.5"
            class="w-full accent-(--brand-yellow)"
          />
          <div class="shrink-0">
            <GummyRater :rating="formData.rating || 0" />
          </div>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div class="flex flex-col gap-2">
          <label
            for="date"
            class="text-xs font-bold tracking-wider text-neutral-500 uppercase"
            >Data</label
          >
          <input
            id="date"
            v-model="formData.dateAcquired"
            type="text"
            placeholder="es. 2024"
            class="rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm font-medium transition-colors outline-none focus:border-(--brand-yellow) focus:bg-white"
          />
        </div>
        <div class="flex flex-col gap-2">
          <label
            for="location"
            class="text-xs font-bold tracking-wider text-neutral-500 uppercase"
            >Luogo</label
          >
          <input
            id="location"
            v-model="formData.locationAcquired"
            type="text"
            placeholder="es. Amsterdam, The Netherlands"
            class="rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm font-medium transition-colors outline-none focus:border-(--brand-yellow) focus:bg-white"
          />
        </div>
      </div>

      <div class="flex flex-col gap-2">
        <label
          for="comment"
          class="text-xs font-bold tracking-wider text-neutral-500 uppercase"
          >Note</label
        >
        <textarea
          id="comment"
          v-model="formData.comment"
          rows="3"
          class="rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm font-medium transition-colors outline-none focus:border-(--brand-yellow) focus:bg-white"
        ></textarea>
      </div>
    </div>

    <div
      class="fixed right-0 bottom-0 left-0 z-10 border-t border-neutral-200 bg-white/80 p-4 backdrop-blur-md sm:static sm:border-none sm:bg-transparent sm:p-0"
    >
      <button
        type="submit"
        :disabled="isSubmitting"
        class="w-full rounded-2xl bg-(--brand-yellow) py-4 text-center font-extrabold tracking-wide text-neutral-900 shadow-lg transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100"
      >
        <span v-if="isSubmitting">Salvataggio in corso...</span>
        <span v-else>{{
          isEdit ? "Salva Modifiche" : "Aggiungi Pacchetto"
        }}</span>
      </button>
    </div>

    <div v-if="isEdit" class="mt-4 flex w-full justify-center pb-6">
      <button
        type="button"
        :disabled="isDeleting || isSubmitting"
        class="w-full rounded-2xl bg-(--brand-red) py-4 text-center font-extrabold tracking-wide text-neutral-900 shadow-lg transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100"
        @click="handleDelete"
      >
        <span v-if="isDeleting">Eliminazione in corso...</span>
        <span v-else>Elimina Pacchetto</span>
      </button>
    </div>
  </form>
</template>
