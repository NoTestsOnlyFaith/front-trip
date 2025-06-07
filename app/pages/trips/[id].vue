<template>
  <div class="trip-detail-container">
    <PageLoading v-if="pending">Loading trip details...</PageLoading>
    <div v-else-if="error" class="text-center text-red-500">Error: {{ error && (error as any).message }}</div>
    <div v-else-if="trip">
      <div class="flex justify-between items-center mb-6">
        <EditableTitle
          :title="trip.name"
          :is-saving="isSaving"
          :editable="true"
          @save="saveTripName"
        />
        <div class="flex gap-2">
          <UButton color="error" variant="soft" size="sm" icon="i-heroicons-trash" @click="isDeleteModalOpen = true">
            Delete Trip
          </UButton>
          <UButton to="/trips" variant="ghost" size="sm">
            Back to Trips
          </UButton>
        </div>
      </div>

      <div class="trip-meta mb-8">
        <EditableDescription
          :description="trip.description"
          :is-saving="isSaving"
          :editable="true"
          @save="saveTripDescription"
        />
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
          <template v-for="(place, index) in trip.places" :key="place.id">
            <DraggablePlaceItem
              :place="place"
              :index="index"
              :is-dragging="draggedIndex === index"
              :is-drop-target="draggedIndex !== -1 && draggedIndex !== index && dropTargetIndex === index"
              @dragstart="dragStart($event, index)"
              @dragend="draggedIndex = -1"
              @dragenter="dragEnter($event, index)"
              @dragleave="dragLeave($event, index)"
              @drop="drop($event, index)"
            >
              <template #actions>
                <UButton color="error" variant="soft" size="xs" icon="i-heroicons-trash" @click="openRemovePlaceModal(place)">
                  Remove
                </UButton>
              </template>
            </DraggablePlaceItem>

            <DistanceIndicator
              v-if="index < trip.places.length - 1"
              :distance="getDistanceBetweenPlaces(place, trip.places[index + 1]!)"
            />
          </template>
        </div>
      </div>
    </div>
    <div v-else class="text-center text-gray-500">
      Trip not found or you don't have access to view it.
    </div>

    <!-- Delete Trip Modal -->
    <ConfirmationModal
      :is-open="isDeleteModalOpen"
      title="Delete Trip"
      :message="trip ? `Are you sure you want to delete ${trip.name}? This action cannot be undone.` : ''"
      confirm-button-text="Delete"
      confirm-button-color="red"
      :is-loading="isDeleting"
      @close="isDeleteModalOpen = false"
      @confirm="deleteTripHandler"
    />

    <!-- Remove Place Modal -->
    <ConfirmationModal
      :is-open="isRemovePlaceModalOpen"
      title="Remove Place"
      :message="placeToRemove ? `Are you sure you want to remove ${placeToRemove.name} from this trip?` : ''"
      confirm-button-text="Remove"
      confirm-button-color="red"
      :is-loading="isRemovingPlace"
      @close="isRemovePlaceModalOpen = false"
      @confirm="confirmRemovePlace"
    />
  </div>
</template>

<script setup lang="ts">
import { useTripsService, getDistanceBetweenPlaces, calculateTripLength } from '../../services/tripsService';
import { useAuthService } from '../../services/authService';
import { onMounted, ref, computed } from 'vue';
import type { Place } from '../../services/placesService';
import EditableDescription from '../../components/EditableDescription.vue';

const route = useRoute();
const { isAuthenticated } = useAuthService();
const { getTripById, updateTrip, deleteTrip } = useTripsService();

// Redirect if not authenticated
onMounted(() => {
  if (!isAuthenticated()) {
    return navigateTo('/login');
  }
});

const tripId = Array.isArray(route.params.id) ? route.params.id[0] : route.params.id;
const { data: trip, pending, error } = await getTripById(tripId);

// Trip name editing
const isSaving = ref(false);

const saveTripName = async (newName: string) => {
  if (!trip.value) return;

  isSaving.value = true;
  try {
    await updateTrip(trip.value.id, { name: newName });
    // Update the local trip object
    trip.value.name = newName;
  } catch (err) {
    console.error('Error updating trip name:', err);
    // Show error message if needed
  } finally {
    isSaving.value = false;
  }
};

// Trip description editing
const saveTripDescription = async (newDescription: string) => {
  if (!trip.value) return;
  isSaving.value = true;
  try {
    const { data: updated } = updateTrip(trip.value.id, { description: newDescription });
    if (updated.value) {
      trip.value.description = updated.value.description;
    }
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
const draggedIndex = ref(-1);
const dropTargetIndex = ref(-1);

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

const deleteTripHandler = async () => {
  if (trip.value) {
    isDeleting.value = true;
    try {
      await deleteTrip(trip.value.id);
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
  color: #f3f4f6;
}

.trip-detail-container > div:not(.modal-overlay) {
  border-radius: 0.5rem;
  border: 1px solid rgba(0, 220, 130, 0.15);
  padding: 1.5rem;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(0, 220, 130, 0.1);
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
  transition: transform 0.2s, box-shadow 0.2s;
  margin-bottom: 16px;
  border-radius: 8px;
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

.place-card {
  border: 1px solid rgba(0, 220, 130, 0.15);
  border-radius: 10px;
  padding: 16px;
  transition: box-shadow 0.2s, transform 0.2s;
  box-shadow: 0 1px 3px 0 rgba(0,0,0,0.1);
  width: 100%;
  display: block;
}

.place-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 18px rgba(0, 220, 130, 0.1);
  border-color: rgba(0, 220, 130, 0.4);
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

/* Modal styles */
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

.trip-meta {
  border-bottom: 1px solid rgba(0, 220, 130, 0.15);
  padding-bottom: 1rem;
  margin-bottom: 1.5rem;
}
</style>
