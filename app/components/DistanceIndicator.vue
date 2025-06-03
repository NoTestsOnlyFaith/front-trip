<template>
  <div class="distance-indicator">
    <div class="distance-line"></div>
    <div class="distance-badge">
      {{ formattedDistance }}
    </div>
    <div class="distance-line"></div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  distance: number;
}>();

const formattedDistance = computed(() => {
  if (props.distance < 1) {
    return `${Math.round(props.distance * 1000)} m`;
  }
  return `${props.distance.toFixed(1)} km`;
});
</script>

<style scoped>
.distance-indicator {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px 0;
  width: 100%;
  margin: 4px 0;
}

.distance-line {
  height: 20px;
  width: 2px;
  background-color: rgba(0, 220, 130, 0.2);
}

.distance-badge {
  padding: 4px 12px;
  border-radius: 16px;
  font-size: 0.85rem;
  font-weight: 500;
  margin: 8px 0;
  border: 1px solid rgba(0, 220, 130, 0.3);
  color: rgba(0, 220, 130, 0.8);
}
</style>
