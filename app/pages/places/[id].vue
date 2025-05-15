<template>
  <div class="place-detail-container">
    <div v-if="pending" class="text-center text-gray-500">Loading place details...</div>
    <div v-else-if="error" class="text-center text-red-500">Error: {{ error.message }}</div>
    <div v-else-if="place" class="place-detail">
      <div class="actions mb-6">
        <NuxtLink to="/places" class="text-primary hover:underline flex items-center gap-1">
          <span class="text-lg">&larr;</span> Back to Places
        </NuxtLink>
      </div>

      <h1 class="text-3xl font-bold text-primary mb-6">{{ place.name }}</h1>

      <div class="detail-card">
        <div class="info-row">
          <span class="label">Category:</span>
          <span class="value category">{{ place.category }}</span>
        </div>

        <div class="info-row">
          <span class="label">Description:</span>
          <span class="value description">{{ place.description }}</span>
        </div>

        <div class="info-row">
          <span class="label">Coordinates:</span>
          <span class="value coordinates">
            {{ place.lat.toFixed(6) }}, {{ place.lng.toFixed(6) }}
          </span>
        </div>

        <div ref="mapContainer" class="map-placeholder"></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { usePlacesService } from '../../services/placesService'
import { onMounted, onUnmounted, ref } from 'vue'

const route = useRoute()
const id = route.params.id as string
const mapContainer = ref<HTMLElement | null>(null)
let map = null

const { getPlaceById } = usePlacesService()
const { data: place, pending, error } = await getPlaceById(id)

onMounted(async () => {
  if (process.client && place.value && mapContainer.value) {
    // Dynamically import Leaflet on client-side only
    const L = await import('leaflet')

    // Fix Leaflet's default icon path issues with bundlers
    delete L.default.Icon.Default.prototype._getIconUrl
    L.default.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png'
    })

    // Initialize the map
    map = L.default.map(mapContainer.value).setView(
      [place.value.lat, place.value.lng], 
      13
    )

    // Add the OpenStreetMap tile layer
    L.default.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map)

    // Add a marker at the place's location
    L.default.marker([place.value.lat, place.value.lng])
      .addTo(map)
      .bindPopup(place.value.name)
      .openPopup()
  }
})

// Clean up the map when the component is unmounted
onUnmounted(() => {
  if (map) {
    map.remove()
    map = null
  }
})
</script>

<style scoped>
.place-detail-container {
  max-width: 900px;
  margin: 0 auto;
  padding: 32px 16px;
}

.actions {
  margin-bottom: 20px;
}

.detail-card {
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 32px 24px;
  box-shadow: 0 1px 6px 0 rgba(0,0,0,0.04);
}

.info-row {
  display: flex;
  margin-bottom: 18px;
  align-items: flex-start;
}

.label {
  font-weight: 600;
  width: 130px;
  flex-shrink: 0;
}

.value {
  flex: 1;
}

.category {
  text-transform: capitalize;
  padding: 3px 12px;
  border-radius: 12px;
  font-weight: 500;
  font-size: 1em;
  display: inline-block;
}

.description {
  border-radius: 8px;
  padding: 6px 12px;
  font-size: 1em;
}

.coordinates {
  font-family: 'Fira Mono', 'Menlo', 'Monaco', monospace;
  padding: 2px 8px;
  border-radius: 8px;
}

.map-placeholder {
  height: 280px;
  background-color: #f5f7fa;
  border-radius: 10px;
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 28px;
  border: 1.5px dashed #cbd5e1;
  color: #64748b;
  font-size: 1.1em;
  letter-spacing: 0.01em;
}
</style>
