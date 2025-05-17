<template>
  <div class="flex items-center gap-3">
    <div v-if="isEditing">
      <div class="flex items-center gap-2">
        <UInput v-model="editValue" class="text-2xl font-bold" />
        <UButton @click="save" color="primary" size="sm" :loading="isSaving">
          Save
        </UButton>
        <UButton @click="cancel" variant="ghost" size="sm">
          Cancel
        </UButton>
      </div>
    </div>
    <h1 v-else class="text-3xl font-bold text-primary">{{ title }}</h1>
    <UButton v-if="!isEditing && editable" @click="startEdit" variant="ghost" size="xs" icon="i-heroicons-pencil" class="text-gray-500" />
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';

const props = defineProps<{
  title: string;
  isSaving?: boolean;
  editable?: boolean;
}>();

const emit = defineEmits<{
  (e: 'save', value: string): void;
}>();

const isEditing = ref(false);
const editValue = ref(props.title);

watch(() => props.title, (newVal) => {
  editValue.value = newVal;
});

const startEdit = () => {
  if (props.editable) {
    editValue.value = props.title;
    isEditing.value = true;
  }
};

const cancel = () => {
  isEditing.value = false;
};

const save = () => {
  if (editValue.value.trim()) {
    emit('save', editValue.value.trim());
    isEditing.value = false;
  }
};
</script>
