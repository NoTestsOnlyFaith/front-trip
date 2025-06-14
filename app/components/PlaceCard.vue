<template>
  <div class="place-card-wrapper">
    <NuxtLink :to="`/places/${place.id}`" class="place-card hover:no-underline">
      <div class="place-header">
        <h3 class="text-lg font-semibold text-primary">{{ place.name }}</h3>
        <div class="place-actions">
          <slot name="actions"></slot>
        </div>
      </div>
      <div class="place-details">
        <span class="category">{{ place.category }}</span>
        <span class="coordinates">
          {{ typeof place.lat === 'number' ? place.lat.toFixed(4) : (place.latitude ? Number(place.latitude).toFixed(4) : '—') }},
          {{ typeof place.lng === 'number' ? place.lng.toFixed(4) : (place.longitude ? Number(place.longitude).toFixed(4) : '—') }}
        </span>
      </div>
    </NuxtLink>
  </div>
</template>

<script setup lang="ts">
import type { Place } from '../services/placesService';

defineProps<{
  place: Place;
}>();
</script>

<style scoped>
.place-card {
  border: 1px solid rgba(0, 220, 130, 0.15);
  border-radius: 10px;
  padding: 16px;
  transition: box-shadow 0.2s, transform 0.2s;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
  width: 100%;
  display: block;
}

.place-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 18px rgba(0, 220, 130, 0.1);
  border-color: rgba(0, 220, 130, 0.4);
}

.place-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.place-details {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 8px;
  font-size: 0.9rem;
}

.category {
  text-transform: capitalize;
  padding: 3px 12px;
  border-radius: 12px;
  font-weight: 500;
  font-size: 0.9em;
  border: 1px solid rgba(0, 220, 130, 0.3);
  color: rgba(0, 220, 130, 0.8);
}

.coordinates {
  font-family: 'Fira Mono', 'Menlo', 'Monaco', monospace;
  padding: 2px 8px;
  border-radius: 8px;
  color: #a3a3a3;
  border: 1px solid #333333;
  font-size: 0.85em;
}
</style>
