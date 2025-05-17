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
          <UButton @click="isDeleteModalOpen = true" variant="soft" color="red" size="sm" icon="i-heroicons-trash">
            Delete Trip
          </UButton>
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
          <div
              v-for="(place, index) in trip.places"
              :key="place.id"
              class="place-item"
              draggable="true"
              @dragstart="dragStart($event, index)"
              @dragend="draggedIndex = -1"
              @dragover.prevent
              @dragenter.prevent="dragEnter($event, index)"
              @dragleave="dragLeave($event, index)"
              @drop="drop($event, index)"
              :class="{
              'dragging': draggedIndex === index,
              'drop-target': draggedIndex !== -1 && draggedIndex !== index && dropTargetIndex === index
            }"
          >
            <div class="drag-handle">
              <UIcon name="i-heroicons-bars-3" class="text-gray-400" />
            </div>
            <NuxtLink :to="`/places/${place.id}`" class="place-card hover:no-underline">
              <h3 class="text-lg font-semibold text-primary mb-2">{{ place.name }}</h3>
              <div class="place-details">
                <span class="category">{{ place.category }}</span>
                <span class="coordinates">{{ place.lat.toFixed(4) }}, {{ place.lng.toFixed(4) }}</span>
              </div>
            </NuxtLink>

            <UButton @click="openRemovePlaceModal(place)" variant="soft" color="red" size="xs" icon="i-heroicons-trash">
              Remove
            </UButton>

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

    <!-- Delete Trip Modal -->
    <div v-if="isDeleteModalOpen" class="modal-overlay" @click="isDeleteModalOpen = false">
      <div class="modal-content" @click.stop>
        <h3 class="text-xl font-semibold mb-3">Delete Trip</h3>
        <p class="mb-5" v-if="trip">Are you sure you want to delete "{{ trip.name }}"? This action cannot be undone.</p>
        <div class="flex justify-end gap-3">
          <UButton @click="isDeleteModalOpen = false" variant="outline">Cancel</UButton>
          <UButton color="red" :loading="isDeleting" @click="deleteTrip">
            Delete
          </UButton>
        </div>
      </div>
    </div>

    <!-- Remove Place Modal -->
    <div v-if="isRemovePlaceModalOpen" class="modal-overlay" @click="isRemovePlaceModalOpen = false">
      <div class="modal-content" @click.stop>
        <h3 class="text-xl font-semibold mb-3">Remove Place</h3>
        <p class="mb-5" v-if="placeToRemove">Are you sure you want to remove "{{ placeToRemove.name }}" from this trip?</p>
        <div class="flex justify-end gap-3">
          <UButton @click="isRemovePlaceModalOpen = false" variant="outline">Cancel</UButton>
          <UButton color="red" :loading="isRemovingPlace" @click="confirmRemovePlace">
            Remove
          </UButton>
        </div>
      </div>
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
const { getTripById, updateTrip, deleteTripById } = useTripsService();

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
const draggedIndex = ref(-1);
const dropTargetIndex = ref(-1);

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

// Drag and drop functionality
const dragStart = (event: DragEvent, index: number) => {
  draggedIndex.value = index;
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move';
    // Set some data (required for Firefox)
    event.dataTransfer.setData('text/plain', index.toString());
  }
};

const dragEnter = (event: DragEvent, index: number) => {
  if (draggedIndex.value !== -1 && draggedIndex.value !== index) {
    dropTargetIndex.value = index;
  }
};

const dragLeave = (event: DragEvent, index: number) => {
  if (dropTargetIndex.value === index) {
    dropTargetIndex.value = -1;
  }
};

const drop = async (event: DragEvent, dropIndex: number) => {
  event.preventDefault();

  // Reset drop target index
  dropTargetIndex.value = -1;

  // If no item is being dragged or trying to drop at the same position
  if (draggedIndex.value === -1 || draggedIndex.value === dropIndex) {
    draggedIndex.value = -1;
    return;
  }

  if (trip.value) {
    // Create a copy of the places array
    const updatedPlaces = [...trip.value.places];

    // Remove the dragged item
    const [draggedItem] = updatedPlaces.splice(draggedIndex.value, 1);

    // Insert it at the drop position
    updatedPlaces.splice(dropIndex, 0, draggedItem);

    // Update the trip with the new places order
    try {
      await updateTrip(trip.value.id, { places: updatedPlaces });

      // Update the local trip object to reflect the changes
      trip.value.places = updatedPlaces;

      // Reset the dragged index
      draggedIndex.value = -1;
    } catch (err) {
      console.error('Error updating trip places order:', err);
      // Show error message if needed
    }
  }
};

// Remove place functionality
const isRemovePlaceModalOpen = ref(false);
const placeToRemove = ref<Place | null>(null);
const isRemovingPlace = ref(false);

const openRemovePlaceModal = (place: Place) => {
  placeToRemove.value = place;
  isRemovePlaceModalOpen.value = true;
};

const confirmRemovePlace = async () => {
  if (trip.value && placeToRemove.value) {
    const updatedPlaces = trip.value.places.filter(p => p.id !== placeToRemove.value?.id);

    isRemovingPlace.value = true;
    try {
      await updateTrip(trip.value.id, { places: updatedPlaces });
      trip.value.places = updatedPlaces;
      isRemovePlaceModalOpen.value = false;
    } catch (err) {
      console.error('Error removing place:', err);
      // Show error message if needed
    } finally {
      isRemovingPlace.value = false;
    }
  }
};

// Delete trip functionality
const isDeleteModalOpen = ref(false);
const isDeleting = ref(false);

const deleteTrip = async () => {
  if (trip.value) {
    isDeleting.value = true;
    try {
      await deleteTripById(trip.value.id);
      navigateTo('/trips');
    } catch (err) {
      console.error('Error deleting trip:', err);
      // Show error message if needed
    } finally {
      isDeleting.value = false;
    }
  }
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
  padding-left: 40px; /* Add padding to accommodate drag handles */
  position: relative;
}

.place-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  cursor: grab;
  transition: background-color 0.2s, transform 0.2s, box-shadow 0.2s;
  margin-bottom: 8px;
}

.place-item.dragging {
  opacity: 0.6;
  background-color: #f0f9ff;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
  cursor: grabbing;
}

.place-item.drop-target {
  background-color: #f0f9ff;
  border-top: 2px dashed #3b82f6;
  border-bottom: 2px dashed #3b82f6;
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
  border-top: 8px solid #3b82f6;
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
}

.place-item:hover .drag-handle {
  background-color: #f3f4f6;
}

.place-item.dragging .drag-handle {
  cursor: grabbing;
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

/* Modal styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 50;
  padding: 1rem;
}

.modal-content {
  background-color: white;
  border-radius: 0.5rem;
  padding: 1.5rem;
  width: 100%;
  max-width: 500px;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
  animation: modal-in 0.2s ease-out;
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
