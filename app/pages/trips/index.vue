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
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useTripsService } from '../../services/tripsService';
import { useAuthService } from '../../services/authService';
import { onMounted, ref } from 'vue';

const { isAuthenticated } = useAuthService();
const { getTrips } = useTripsService();

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
</style>