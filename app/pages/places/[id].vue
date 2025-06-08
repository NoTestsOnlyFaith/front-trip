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
            {{ place.latitude.toFixed(6) }}, {{ place.longitude.toFixed(6) }}
          </span>
        </div>

        <div v-if="isAuthenticated" class="add-to-trip-section">
          <h3 class="text-lg font-semibold mb-3">Add to Trip</h3>

          <div v-if="tripsLoading" class="text-sm text-gray-500">Loading your trips...</div>
          <div v-else-if="tripsError" class="text-sm text-red-500">Error loading trips: {{ tripsError.message }}</div>
          <div v-else-if="!userTrips || userTrips.length === 0" class="text-sm text-gray-500">
            You don't have any trips yet. 
            <NuxtLink to="/trips/create" class="text-primary hover:underline">Create your first trip</NuxtLink>
          </div>
          <div v-else class="flex flex-col sm:flex-row gap-3">
            <div class="flex-grow">
              <select 
                v-model="selectedTripId" 
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="" disabled>Select a trip</option>
                <option 
                  v-for="trip in userTrips" 
                  :key="trip.id" 
                  :value="trip.id"
                  :disabled="tripContainsPlace(trip, place)"
                >
                  {{ trip.name }} {{ tripContainsPlace(trip, place) ? '(already added)' : '' }}
                </option>
              </select>
            </div>
            <UButton 
              @click="addPlaceToTrip" 
              color="primary" 
              :disabled="!selectedTripId || isAddingToTrip"
              :loading="isAddingToTrip"
            >
              Add to Trip
            </UButton>
          </div>
          <div v-if="addToTripMessage" class="mt-2 text-sm" :class="addToTripSuccess ? 'text-green-600' : 'text-red-500'">
            {{ addToTripMessage }}
          </div>
        </div>

        <div ref="mapContainer" class="map-placeholder"></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { usePlacesService } from '../../services/placesService'
import { useTripsService } from '../../services/tripsService'
import { useAuthService } from '../../services/authService'
import { onMounted, onUnmounted, ref, computed } from 'vue'
import type { Place } from '../../services/placesService'
import type { Trip } from '../../services/tripsService'

const route = useRoute()
const id = route.params.id as string
const mapContainer = ref<HTMLElement | null>(null)
let map = null

const { isAuthenticated } = useAuthService()

const { getPlaceById } = usePlacesService()
const { data: place, pending, error } = await getPlaceById(id)

const { getTrips, updateTrip } = useTripsService()
const { data: userTrips, pending: tripsLoading, error: tripsError } = await getTrips()

const selectedTripId = ref('')
const isAddingToTrip = ref(false)
const addToTripMessage = ref('')
const addToTripSuccess = ref(false)

const tripContainsPlace = (trip: Trip, place: Place) => {
  return trip.places.some(p => p.id === place.id)
}

const addPlaceToTrip = async () => {
  if (!selectedTripId.value || !place.value) return

  isAddingToTrip.value = true
  addToTripMessage.value = ''

  try {
    const selectedTrip = userTrips.value?.find(trip => trip.id === parseInt(selectedTripId.value))

    if (!selectedTrip) {
      throw new Error('Selected trip not found')
    }

    if (tripContainsPlace(selectedTrip, place.value)) {
      addToTripMessage.value = 'This place is already in the selected trip'
      addToTripSuccess.value = false
      return
    }

    const updatedPlaces = [...selectedTrip.places, place.value]

    await updateTrip(selectedTrip.id, { places: updatedPlaces })

    addToTripMessage.value = `Added to "${selectedTrip.name}" successfully!`
    addToTripSuccess.value = true

    selectedTripId.value = ''

    await getTrips()
  } catch (error) {
    addToTripMessage.value = 'Failed to add place to trip. Please try again.'
    addToTripSuccess.value = false
  } finally {
    isAddingToTrip.value = false
  }
}

onMounted(async () => {
  if (process.client && place.value && mapContainer.value) {
    const L = await import('leaflet')

    delete L.default.Icon.Default.prototype._getIconUrl
    L.default.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png'
    })

    map = L.default.map(mapContainer.value).setView(
      [place.value.latitude, place.value.longitude],
      13
    )

    L.default.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map)

    L.default.marker([place.value.latitude, place.value.longitude])
      .addTo(map)
      .bindPopup(place.value.name)
      .openPopup()
  }
})

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
  color: #f3f4f6;
}

.place-detail {
  border-radius: 0.5rem;
  border: 1px solid rgba(0, 220, 130, 0.15);
  padding: 1.5rem;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(0, 220, 130, 0.1);
}

.detail-card {
  border-radius: 0.5rem;
  border: 1px solid rgba(0, 220, 130, 0.15);
  padding: 1.5rem;
  margin-top: 1.5rem;
}

.info-row {
  display: flex;
  margin-bottom: 1.25rem;
  align-items: baseline;
}

.label {
  font-weight: 600;
  width: 120px;
  flex-shrink: 0;
  color: #a3a3a3;
}

.value {
  flex-grow: 1;
}

.category {
  display: inline-block;
  text-transform: capitalize;
  padding: 3px 12px;
  border-radius: 12px;
  font-weight: 500;
  border: 1px solid rgba(0, 220, 130, 0.3);
  color: rgba(0, 220, 130, 0.8);
}

.coordinates {
  font-family: 'Fira Mono', 'Menlo', 'Monaco', monospace;
  padding: 2px 8px;
  border-radius: 8px;
  color: #a3a3a3;
  border: 1px solid #333333;
}

.description {
  line-height: 1.6;
}

.add-to-trip-section {
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 1px solid rgba(0, 220, 130, 0.2);
}

.add-to-trip-section select {
  color: #f3f4f6;
  border-color: rgba(0, 220, 130, 0.2);
}

.add-to-trip-section select:focus {
  border-color: rgba(0, 220, 130, 0.5);
  box-shadow: 0 0 0 2px rgba(0, 220, 130, 0.2);
}

.map-placeholder {
  height: 300px;
  margin-top: 2rem;
  border-radius: 0.5rem;
  border: 1px solid rgba(0, 220, 130, 0.2);
}
</style>
