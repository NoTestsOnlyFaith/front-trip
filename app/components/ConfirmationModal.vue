<template>
  <div v-if="isOpen" class="modal-overlay" @click="close">
    <div class="modal-content" @click.stop>
      <h3 class="text-xl font-semibold mb-3">{{ title }}</h3>
      <p class="mb-5">{{ message }}</p>
      <div class="flex justify-end gap-3">
        <UButton @click="close" variant="outline">Cancel</UButton>
        <UButton
          :color="confirmButtonColor"
          :loading="isLoading"
          @click="confirm"
        >
          {{ confirmButtonText }}
        </UButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  isOpen: boolean;
  title: string;
  message: string;
  confirmButtonText: string;
  confirmButtonColor?: string;
  isLoading?: boolean;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'confirm'): void;
}>();

const close = () => {
  emit('close');
};

const confirm = () => {
  emit('confirm');
};
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 50;
  padding: 1rem;
  backdrop-filter: blur(3px);
}

.modal-content {
  border-radius: 0.5rem;
  padding: 1.5rem;
  width: 100%;
  max-width: 500px;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(0, 220, 130, 0.1);
  animation: modal-in 0.2s ease-out;
  color: #f3f4f6;
  border: 1px solid rgba(0, 220, 130, 0.15);
}

@keyframes modal-in {
  from {
    opacity: 0;
    transform: translateY(10px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}
</style>
