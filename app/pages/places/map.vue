<template>
  <div class="map-container">
    <h1 class="text-3xl font-bold text-primary mb-8 text-center">Places Map</h1>
    <div id="mapId" style="height: 70vh; width: 100%;"></div>
    <div class="text-center mt-4">
      <NuxtLink to="/places" class="text-primary hover:underline">View List</NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { usePlacesService } from '~/services/placesService';
import type { Place } from '~/services/placesService';

let L: any = null;
let MarkerClusterGroup: any = null;

const places = ref<Place[]>([]);
const { getPlaces } = usePlacesService();
const pending = ref(true);
const error = ref<any>(null);

onMounted(async () => {
  if (import.meta.client) {
    try {
      L = await import('leaflet');
      const { MarkerClusterGroup: mcg } = await import('leaflet.markercluster');
      MarkerClusterGroup = mcg;

      await import('leaflet/dist/leaflet.css');
      await import('leaflet.markercluster/dist/MarkerCluster.css');
      await import('leaflet.markercluster/dist/MarkerCluster.Default.css');

      const { data, pending: p, error: e } = await getPlaces();
      if (data.value) {
        places.value = data.value;
      }
      pending.value = p.value;
      error.value = e.value;

      if (!error.value && L && MarkerClusterGroup) {
        const map = L.map('mapId').setView([52.237049, 19.017532], 6);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);

        const markers = new MarkerClusterGroup();

        places.value.forEach(place => {
          if (place.latitude && place.longitude) {
            const marker = L.marker([place.latitude, place.longitude]);
            marker.bindPopup(`<b>${place.name}</b><br>${place.category}`);
            markers.addLayer(marker);
          }
        });
        map.addLayer(markers);
      }
    } catch (importError) {
      console.error('Error loading Leaflet or MarkerCluster:', importError);
      error.value = 'Could not load map components.';
    }
  }
});
</script>

<style scoped>
.map-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 32px 16px;
  color: #f3f4f6;
  border-radius: 0.5rem;
}

:deep(.leaflet-control-zoom a),
:deep(.leaflet-control-attribution a) {
  color: #00dc82 !important;
}

:deep(.leaflet-control-zoom-in),
:deep(.leaflet-control-zoom-out) {
  background-color: #374151 !important;
  color: #f3f4f6 !important;
  border-color: #4b5563 !important;
}
:deep(.leaflet-control-zoom-in:hover),
:deep(.leaflet-control-zoom-out:hover) {
  background-color: #4b5563 !important;
}

:deep(.leaflet-popup-content-wrapper) {
  background-color: #374151 !important;
  color: #f3f4f6 !important;
  border-radius: 4px;
}
:deep(.leaflet-popup-tip) {
   background-color: #374151 !important;
}
:deep(.leaflet-popup-close-button) {
  color: #f3f4f6 !important;
}
:deep(.leaflet-popup-close-button:hover) {
  color: #cbd5e1 !important;
}
</style>
