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

        <!-- Add to Trip section (only for authenticated users) -->
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

// Auth service
const { isAuthenticated } = useAuthService()

// Places service
const { getPlaceById } = usePlacesService()
const { data: place, pending, error } = await getPlaceById(id)

// Trips service
const { getTrips, updateTrip } = useTripsService()
const { data: userTrips, pending: tripsLoading, error: tripsError } = await getTrips()

// Add to trip state
const selectedTripId = ref('')
const isAddingToTrip = ref(false)
const addToTripMessage = ref('')
const addToTripSuccess = ref(false)

// Check if a trip already contains the current place
const tripContainsPlace = (trip: Trip, place: Place) => {
  return trip.places.some(p => p.id === place.id)
}

// Add the current place to the selected trip
const addPlaceToTrip = async () => {
  if (!selectedTripId.value || !place.value) return

  isAddingToTrip.value = true
  addToTripMessage.value = ''

  try {
    // Find the selected trip
    const selectedTrip = userTrips.value?.find(trip => trip.id === parseInt(selectedTripId.value))

    if (!selectedTrip) {
      throw new Error('Selected trip not found')
    }

    // Check if place is already in the trip
    if (tripContainsPlace(selectedTrip, place.value)) {
      addToTripMessage.value = 'This place is already in the selected trip'
      addToTripSuccess.value = false
      return
    }

    // Create a new array with the current places plus the new place
    const updatedPlaces = [...selectedTrip.places, place.value]

    // Update the trip with the new places array
    await updateTrip(selectedTrip.id, { places: updatedPlaces })

    // Update success message
    addToTripMessage.value = `Added to "${selectedTrip.name}" successfully!`
    addToTripSuccess.value = true

    // Reset the selected trip
    selectedTripId.value = ''

    // Refresh the trips list
    await getTrips()
  } catch (error) {
    console.error('Error adding place to trip:', error)
    addToTripMessage.value = 'Failed to add place to trip. Please try again.'
    addToTripSuccess.value = false
  } finally {
    isAddingToTrip.value = false
  }
}

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

.add-to-trip-section {
  margin-top: 24px;
  padding: 16px;
  border-radius: 10px;
  position: relative;
}

.add-to-trip-section::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 4px;
  height: 100%;
  background-color: #0ea5e9;
  border-top-left-radius: 10px;
  border-bottom-left-radius: 10px;
}
</style>
