<template>
  <div class="trip-detail-container">
    <div v-if="pending" class="text-center text-gray-500">Loading trip details...</div>
    <div v-else-if="error" class="text-center text-red-500">Error: {{ error.message }}</div>
    <div v-else-if="trip">
      <div class="flex justify-between items-center mb-6">
        <!-- Trip name (editable) -->
        <div class="flex items-center gap-3">
          <div v-if="isEditingName">
            <div class="flex items-center gap-2">
              <UInput v-model="editedName" class="text-2xl font-bold" />
              <UButton @click="saveTripName" color="primary" size="sm" :loading="isSaving">
                Save
              </UButton>
              <UButton @click="cancelEditName" variant="ghost" size="sm">
                Cancel
              </UButton>
            </div>
          </div>
          <h1 v-else class="text-3xl font-bold text-primary">{{ trip.name }}</h1>
          <UButton v-if="!isEditingName" @click="startEditName" variant="ghost" size="xs" icon="i-heroicons-pencil" class="text-gray-500" />
        </div>
        <div class="flex gap-2">
          <UButton to="/trips" variant="ghost" size="sm">
            Back to Trips
          </UButton>
        </div>
      </div>

      <div class="trip-meta mb-8">
        <p class="text-gray-600 mb-4">{{ trip.description }}</p>
        <div class="flex flex-wrap items-center text-sm text-gray-500 gap-4">
          <span>Created: {{ formatDate(trip.createdAt) }}</span>
          <span>{{ trip.places.length }} places</span>
          <span v-if="trip.places.length > 1" class="font-medium text-primary">
            Total distance: {{ formatDistance(totalTripLength) }}
          </span>
        </div>
      </div>

      <h2 class="text-2xl font-semibold mb-4">Places in this Trip</h2>

      <div v-if="trip.places.length === 0" class="text-center text-gray-500 my-8">
        No places added to this trip yet.
      </div>

      <div v-else>
        <div class="places-list">
          <div v-for="(place, index) in trip.places" :key="place.id" class="place-item">
            <NuxtLink :to="`/places/${place.id}`" class="place-card hover:no-underline">
              <h3 class="text-lg font-semibold text-primary mb-2">{{ place.name }}</h3>
              <div class="place-details">
                <span class="category">{{ place.category }}</span>
                <span class="coordinates">{{ place.lat.toFixed(4) }}, {{ place.lng.toFixed(4) }}</span>
              </div>
            </NuxtLink>

            <!-- Distance to next place -->
            <div v-if="index < trip.places.length - 1" class="distance-indicator">
              <div class="distance-line"></div>
              <div class="distance-badge">
                {{ formatDistance(getDistanceBetweenPlaces(place, trip.places[index + 1])) }}
              </div>
              <div class="distance-line"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div v-else class="text-center text-gray-500">
      Trip not found or you don't have access to view it.
    </div>
  </div>
</template>

<script setup lang="ts">
import { useTripsService, getDistanceBetweenPlaces, calculateTripLength } from '../../services/tripsService';
import { useAuthService } from '../../services/authService';
import { onMounted, ref, computed } from 'vue';
import type { Place } from '../../services/placesService';

const route = useRoute();
const { isAuthenticated } = useAuthService();
const { getTripById, updateTrip } = useTripsService();

// Redirect if not authenticated
onMounted(() => {
  if (!isAuthenticated()) {
    return navigateTo('/login');
  }
});

const tripId = route.params.id;
const { data: trip, pending, error } = await getTripById(tripId);

// Trip name editing
const isEditingName = ref(false);
const editedName = ref('');
const isSaving = ref(false);

const startEditName = () => {
  if (trip.value) {
    editedName.value = trip.value.name;
    isEditingName.value = true;
  }
};

const cancelEditName = () => {
  isEditingName.value = false;
};

const saveTripName = async () => {
  if (!trip.value || !editedName.value.trim()) return;

  isSaving.value = true;
  try {
    await updateTrip(trip.value.id, { name: editedName.value.trim() });
    // Update the local trip object
    trip.value.name = editedName.value.trim();
    isEditingName.value = false;
  } catch (err) {
    console.error('Error updating trip name:', err);
    // Show error message if needed
  } finally {
    isSaving.value = false;
  }
};

// Calculate total trip length
const totalTripLength = computed(() => {
  if (!trip.value || trip.value.places.length <= 1) return 0;
  return calculateTripLength(trip.value.places);
});

// Format distance to a readable format
const formatDistance = (distance: number): string => {
  if (distance < 1) {
    return `${Math.round(distance * 1000)} m`;
  }
  return `${distance.toFixed(1)} km`;
};

// Format date to a more readable format
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};
</script>

<style scoped>
.trip-detail-container {
  max-width: 900px;
  margin: 0 auto;
  padding: 32px 16px;
}

.places-list {
  display: flex;
  flex-direction: column;
  margin-top: 16px;
}

.place-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.place-card {
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 16px;
  transition: box-shadow 0.2s, transform 0.2s;
  box-shadow: 0 1px 3px 0 rgba(0,0,0,0.03);
  width: 100%;
  display: block;
}

.place-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 18px rgba(0, 80, 180, 0.08);
  border-color: #3b82f6;
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
  background-color: #f1f5f9;
  color: #2563eb;
  padding: 3px 12px;
  border-radius: 12px;
  font-weight: 500;
  font-size: 0.9em;
}

.coordinates {
  font-family: 'Fira Mono', 'Menlo', 'Monaco', monospace;
  background: #f3f4f6;
  padding: 2px 8px;
  border-radius: 8px;
  color: #64748b;
  font-size: 0.85em;
}

/* Distance indicator styles */
.distance-indicator {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px 0;
  width: 100%;
}

.distance-line {
  height: 20px;
  width: 2px;
  background-color: #e5e7eb;
}

.distance-badge {
  background-color: #dbeafe;
  color: #2563eb;
  padding: 4px 12px;
  border-radius: 16px;
  font-size: 0.85rem;
  font-weight: 500;
  margin: 8px 0;
  border: 1px solid #bfdbfe;
}
</style>
