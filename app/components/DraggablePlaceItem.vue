<template>
  <div
    class="place-item"
    draggable="true"
    @dragstart="onDragStart"
    @dragend="onDragEnd"
    @dragover.prevent
    @dragenter.prevent="onDragEnter"
    @dragleave="onDragLeave"
    @drop="onDrop"
    :class="{
      'dragging': isDragging,
      'drop-target': isDropTarget
    }"
  >
    <div class="drag-handle">
      <UIcon name="i-heroicons-bars-3" class="text-gray-400" />
    </div>

    <PlaceCard :place="place" />

    <slot name="actions"></slot>

    <slot name="distance-indicator"></slot>
  </div>
</template>

<script setup lang="ts">
import type { Place } from '../services/placesService';

const props = defineProps<{
  place: Place;
  index: number;
  isDragging: boolean;
  isDropTarget: boolean;
}>();

const emit = defineEmits<{
  (e: 'dragstart', event: DragEvent, index: number): void;
  (e: 'dragend'): void;
  (e: 'dragenter', event: DragEvent, index: number): void;
  (e: 'dragleave', event: DragEvent, index: number): void;
  (e: 'drop', event: DragEvent, index: number): void;
}>();

const onDragStart = (event: DragEvent) => {
  emit('dragstart', event, props.index);
};

const onDragEnd = () => {
  emit('dragend');
};

const onDragEnter = (event: DragEvent) => {
  emit('dragenter', event, props.index);
};

const onDragLeave = (event: DragEvent) => {
  emit('dragleave', event, props.index);
};

const onDrop = (event: DragEvent) => {
  emit('drop', event, props.index);
};
</script>

<style scoped>
.place-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  cursor: grab;
  transition: transform 0.2s, box-shadow 0.2s;
  margin-bottom: 16px;
  border-radius: 8px;
  width: 100%;
}

.place-item.dragging {
  opacity: 0.7;
  border-color: rgba(0, 220, 130, 0.5);
  cursor: grabbing;
}

.place-item.drop-target {
  border-top: 2px dashed rgba(0, 220, 130, 0.6);
  border-bottom: 2px dashed rgba(0, 220, 130, 0.6);
  padding-top: 4px;
  padding-bottom: 4px;
  position: relative;
  z-index: 1;
}

.place-item.drop-target::before {
  content: '';
  position: absolute;
  top: -10px;
  left: 50%;
  transform: translateX(-50%);
  width: 0;
  height: 0;
  border-left: 8px solid transparent;
  border-right: 8px solid transparent;
  border-top: 8px solid rgba(0, 220, 130, 0.6);
}

.drag-handle {
  position: absolute;
  left: -30px;
  top: 50%;
  transform: translateY(-50%);
  cursor: grab;
  padding: 8px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(0, 220, 130, 0.6);
}

.place-item:hover .drag-handle {
  color: rgba(0, 220, 130, 0.8);
}

.place-item.dragging .drag-handle {
  cursor: grabbing;
}
</style>
