<template>
  <div class="trips-container">
    <h1 class="text-3xl font-bold text-primary mb-8 text-center">My Trips</h1>

    <PageLoading v-if="pending">Loading trips...</PageLoading>
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
              <p class="text-gray-500 line-clamp-2">{{ trip.description }}</p>
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

    <ConfirmationModal
      :is-open="isDeleteModalOpen"
      title="Delete Trip"
      :message="tripToDelete ? `Are you sure you want to delete ${tripToDelete.name}? This action cannot be undone.` : ''"
      confirm-button-text="Delete"
      confirm-button-color="red"
      :is-loading="isDeleting"
      @close="isDeleteModalOpen = false"
      @confirm="deleteSelectedTrip"
    />
  </div>
</template>

<script setup lang="ts">
import { useTripsService } from '../../services/tripsService';
import { useAuthService } from '../../services/authService';
import { onMounted, ref } from 'vue';
import PageLoading from '../../components/PageLoading.vue';
import ConfirmationModal from '../../components/ConfirmationModal.vue';

const { isAuthenticated } = useAuthService();
const { getTrips, deleteTrip } = useTripsService();

onMounted(() => {
  if (!isAuthenticated()) {
    return navigateTo('/login');
  }

  console.log('Komponent trips/index.vue zamontowany, pobieranie tras...');
});

const { data: trips, pending, error } = await getTrips();

// Debugowanie - sprawdź, czy trasy są poprawnie załadowane
console.log('Odpowiedź z getTrips:', { trips: trips.value, pending: pending.value, error: error.value });

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

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
  color: #f3f4f6;
  border-radius: 0.5rem;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(0, 220, 130, 0.1);
  border: 1px solid rgba(0, 220, 130, 0.15);
}

.trips-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.trip-item {
  border: 1px solid rgba(0, 220, 130, 0.15);
  border-radius: 10px;
  margin-bottom: 20px;
  transition: box-shadow 0.2s, transform 0.2s;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
}

.trip-item:hover {
  transform: translateY(-2px) scale(1.01);
  box-shadow: 0 6px 18px rgba(0, 220, 130, 0.1);
  border-color: rgba(0, 220, 130, 0.4);
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
  color: #a3a3a3;
}

.places-count {
  text-transform: capitalize;
  padding: 3px 12px;
  border-radius: 12px;
  font-weight: 500;
  font-size: 0.95em;
  border: 1px solid rgba(0, 220, 130, 0.3);
  color: rgba(0, 220, 130, 0.8);
}

.created-at {
  font-family: 'Fira Mono', 'Menlo', 'Monaco', monospace;
  padding: 2px 8px;
  border-radius: 8px;
  color: #a3a3a3;
  border: 1px solid #333333;
}

.trip-actions {
  padding: 0 24px 12px;
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
</style>
