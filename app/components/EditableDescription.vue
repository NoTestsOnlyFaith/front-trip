<template>
  <div class="flex items-start gap-3">
    <div v-if="isEditing" class="w-full">
      <div class="flex items-center gap-2">
        <UTextarea v-model="editValue" class="w-full text-base" :rows="3" />
        <UButton color="primary" size="sm" :loading="isSaving" @click="save">
          Zapisz
        </UButton>
        <UButton variant="ghost" size="sm" @click="cancel">
          Anuluj
        </UButton>
      </div>
    </div>
    <p v-else class="text-gray-600 w-full whitespace-pre-line">{{ description }}</p>
    <UButton v-if="!isEditing && editable" variant="ghost" size="xs" icon="i-heroicons-pencil" class="text-gray-500" @click="startEdit" />
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';

const props = defineProps<{
  description: string;
  isSaving?: boolean;
  editable?: boolean;
}>();

const emit = defineEmits<{
  (e: 'save', value: string): void;
}>();

const isEditing = ref(false);
const editValue = ref(props.description);

watch(() => props.description, (newVal) => {
  editValue.value = newVal;
});

const startEdit = () => {
  if (props.editable) {
    isEditing.value = true;
    editValue.value = props.description;
  }
};

const save = () => {
  emit('save', editValue.value);
  isEditing.value = false;
};

const cancel = () => {
  isEditing.value = false;
  editValue.value = props.description;
};
</script>

