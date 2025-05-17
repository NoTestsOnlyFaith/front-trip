<template>
  <div class="trips-container">
    <h1 class="text-3xl font-bold text-primary mb-8 text-center">My Trips</h1>

    <div v-if="pending" class="text-center text-gray-500">Loading trips...</div>
    <div v-else-if="error" class="text-center text-red-500">Error: {{ error.message }}</div>
    <div v-else>
      <div class="mb-6 flex justify-between items-center">
        <h2 class="text-xl font-semibold">Your Trips</h2>
        <UButton to="/trips/create" color="primary" size="sm">
          Create New Trip
        </UButton>
      </div>

      <div v-if="!trips || trips.length === 0" class="text-center text-gray-500 my-8">
        You don't have any trips yet. Create your first trip!
      </div>

      <ul v-else class="trips-list">
        <li v-for="trip in trips" :key="trip.id" class="trip-item">
          <NuxtLink :to="`/trips/${trip.id}`" class="block hover:no-underline">
            <div class="flex flex-col gap-2">
              <h2 class="text-xl font-semibold text-primary mb-1">{{ trip.name }}</h2>
              <p class="text-gray-600 line-clamp-2">{{ trip.description }}</p>
              <div class="trip-details">
                <span class="places-count">{{ trip.places.length }} places</span>
                <span class="created-at">{{ formatDate(trip.createdAt) }}</span>
              </div>
            </div>
          </NuxtLink>
          <div class="trip-actions">
            <UButton
              color="red"
              variant="soft"
              size="xs"
              icon="i-heroicons-trash"
              @click.stop="confirmDeleteTrip(trip)"
              class="delete-btn"
            >
              Delete
            </UButton>
          </div>
        </li>
      </ul>
    </div>

    <!-- Custom Delete Trip Modal -->
    <div v-if="isDeleteModalOpen" class="modal-overlay" @click="isDeleteModalOpen = false">
      <div class="modal-content" @click.stop>
        <h3 class="text-xl font-semibold mb-3">Delete Trip</h3>
        <p class="mb-5" v-if="tripToDelete">Are you sure you want to delete "{{ tripToDelete.name }}"? This action cannot be undone.</p>
        <div class="flex justify-end gap-3">
          <UButton @click="isDeleteModalOpen = false" variant="outline">Cancel</UButton>
          <UButton
            color="red"
            :loading="isDeleting"
            @click="deleteSelectedTrip"
          >
            Delete
          </UButton>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useTripsService } from '../../services/tripsService';
import { useAuthService } from '../../services/authService';
import { onMounted, ref } from 'vue';

const { isAuthenticated } = useAuthService();
const { getTrips, deleteTrip } = useTripsService();

// Redirect if not authenticated
onMounted(() => {
  if (!isAuthenticated()) {
    return navigateTo('/login');
  }
});

const { data: trips, pending, error } = await getTrips();

// Format date to a more readable format
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

// State for delete confirmation modal
const isDeleteModalOpen = ref(false);
const tripToDelete = ref(null);
const isDeleting = ref(false);

const confirmDeleteTrip = (trip: any) => {
  tripToDelete.value = trip;
  isDeleteModalOpen.value = true;
};

const deleteSelectedTrip = async () => {
  if (!tripToDelete.value) return;

  isDeleting.value = true;
  try {
    await deleteTrip(tripToDelete.value.id);
    trips.value = trips.value.filter(t => t.id !== tripToDelete.value.id);
    isDeleteModalOpen.value = false;
  } catch (err) {
    console.error('Failed to delete trip:', err);
  } finally {
    isDeleting.value = false;
  }
};
</script>

<style scoped>
.trips-container {
  max-width: 900px;
  margin: 0 auto;
  padding: 32px 16px;
}

.trips-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.trip-item {
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  margin-bottom: 20px;
  transition: box-shadow 0.2s, transform 0.2s;
  box-shadow: 0 1px 3px 0 rgba(0,0,0,0.03);
}

.trip-item:hover {
  transform: translateY(-2px) scale(1.01);
  box-shadow: 0 6px 18px rgba(0, 80, 180, 0.08);
  border-color: #3b82f6;
}

.trip-item a {
  display: block;
  padding: 24px;
  color: inherit;
  text-decoration: none;
}

.trip-details {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 6px;
  font-size: 0.97rem;
  color: #555;
}

.places-count {
  text-transform: capitalize;
  background-color: #f1f5f9;
  color: #2563eb;
  padding: 3px 12px;
  border-radius: 12px;
  font-weight: 500;
  font-size: 0.95em;
}

.created-at {
  font-family: 'Fira Mono', 'Menlo', 'Monaco', monospace;
  background: #f3f4f6;
  padding: 2px 8px;
  border-radius: 8px;
  color: #64748b;
}

.trip-actions {
  margin-top: 10px;
  text-align: right;
}

.delete-btn {
  margin-left: auto;
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

