<template>
  <div class="create-trip-container">
    <h1 class="text-3xl font-bold text-primary mb-8 text-center">Create New Trip</h1>

    <UForm :state="formState" class="space-y-6" @submit="handleSubmit">
      <UFormGroup label="Trip Name" name="name">
        <UInput
          v-model="formState.name"
          placeholder="Enter trip name"
          class="w-full"
        />
      </UFormGroup>

      <UFormGroup label="Description" name="description">
        <UTextarea
          v-model="formState.description"
          placeholder="Describe your trip"
          class="w-full"
          rows="4"
        />
      </UFormGroup>

      <div class="places-section">
        <h2 class="text-xl font-semibold mb-4">Add Places to Your Trip</h2>
        
        <div v-if="placesLoading" class="text-center text-gray-500">Loading places...</div>
        <div v-else-if="placesError" class="text-center text-red-500">Error loading places: {{ placesError.message }}</div>
        <div v-else>
          <div class="mb-4">
            <UInput
              v-model="searchTerm"
              placeholder="Search places..."
              class="w-full"
            />
          </div>

          <div class="places-grid">
            <div
              v-for="place in filteredPlaces"
              :key="place.id"
              class="place-card"
              :class="{ 'selected': selectedPlaces.some(p => p.id === place.id) }"
              @click="togglePlace(place)"
            >
              <div class="place-card-content">
                <h3 class="place-name">{{ place.name }}</h3>
                <span class="place-category">{{ place.category }}</span>
              </div>
              <UIcon
                v-if="selectedPlaces.some(p => p.id === place.id)"
                name="i-heroicons-check-circle"
                class="text-primary text-xl"
              />
            </div>
          </div>

          <div v-if="filteredPlaces.length === 0" class="text-center text-gray-500 my-4">
            No places found matching your search.
          </div>
        </div>
      </div>

      <div class="selected-places-summary" v-if="selectedPlaces.length > 0">
        <h3 class="text-lg font-medium mb-2">Selected Places ({{ selectedPlaces.length }})</h3>
        <ul class="selected-places-list">
          <li v-for="place in selectedPlaces" :key="place.id" class="selected-place-item">
            <span>{{ place.name }}</span>
            <UButton
              color="red"
              variant="ghost"
              size="xs"
              icon="i-heroicons-x-mark"
              @click.stop="removePlace(place)"
            />
          </li>
        </ul>
      </div>

      <div class="flex justify-between mt-8">
        <UButton to="/trips" variant="ghost">
          Cancel
        </UButton>
        <UButton type="submit" color="primary" :loading="isSubmitting">
          Create Trip
        </UButton>
      </div>
    </UForm>
  </div>
</template>

<script setup lang="ts">
import { useTripsService } from '../../services/tripsService';
import { usePlacesService } from '../../services/placesService';
import { useAuthService } from '../../services/authService';
import { ref, computed, onMounted } from 'vue';
import type { Place } from '../../services/placesService';

const router = useRouter();
const { isAuthenticated, getUser } = useAuthService();
const { createTrip } = useTripsService();
const { getPlaces } = usePlacesService();

// Redirect if not authenticated
onMounted(() => {
  if (!isAuthenticated()) {
    return navigateTo('/login');
  }
});

// Form state
const formState = ref({
  name: '',
  description: ''
});

// Places
const { data: places, pending: placesLoading, error: placesError } = await getPlaces();
const selectedPlaces = ref<Place[]>([]);
const searchTerm = ref('');
const isSubmitting = ref(false);

// Filter places based on search term
const filteredPlaces = computed(() => {
  if (!places.value) return [];
  if (!searchTerm.value) return places.value;
  
  const term = searchTerm.value.toLowerCase();
  return places.value.filter(place => 
    place.name.toLowerCase().includes(term) || 
    place.category.toLowerCase().includes(term)
  );
});

// Toggle place selection
const togglePlace = (place: Place) => {
  const index = selectedPlaces.value.findIndex(p => p.id === place.id);
  if (index === -1) {
    selectedPlaces.value.push(place);
  } else {
    selectedPlaces.value.splice(index, 1);
  }
};

// Remove place from selection
const removePlace = (place: Place) => {
  const index = selectedPlaces.value.findIndex(p => p.id === place.id);
  if (index !== -1) {
    selectedPlaces.value.splice(index, 1);
  }
};

// Handle form submission
const handleSubmit = async () => {
  if (selectedPlaces.value.length === 0) {
    alert('Please select at least one place for your trip.');
    return;
  }

  isSubmitting.value = true;
  const user = getUser();
  
  if (!user) {
    alert('You must be logged in to create a trip.');
    isSubmitting.value = false;
    return navigateTo('/login');
  }

  try {
    await createTrip({
      name: formState.value.name,
      description: formState.value.description,
      places: selectedPlaces.value,
      userId: user.email
    });
    
    router.push('/trips');
  } catch (error) {
    console.error('Error creating trip:', error);
    alert('Failed to create trip. Please try again.');
  } finally {
    isSubmitting.value = false;
  }
};
</script>

<style scoped>
.create-trip-container {
  max-width: 900px;
  margin: 0 auto;
  padding: 32px 16px;
}

.places-section {
  margin-top: 24px;
  padding: 16px;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  background-color: #f9fafb;
}

.places-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
  margin-top: 16px;
}

.place-card {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 12px;
  background-color: white;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.place-card:hover {
  border-color: #3b82f6;
  transform: translateY(-2px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.place-card.selected {
  border-color: #3b82f6;
  background-color: #eff6ff;
}

.place-card-content {
  flex: 1;
}

.place-name {
  font-weight: 600;
  margin-bottom: 4px;
}

.place-category {
  font-size: 0.85rem;
  color: #6b7280;
  background-color: #f3f4f6;
  padding: 2px 8px;
  border-radius: 12px;
}

.selected-places-summary {
  margin-top: 24px;
  padding: 16px;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  background-color: #f9fafb;
}

.selected-places-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.selected-place-item {
  display: flex;
  align-items: center;
  gap: 8px;
  background-color: white;
  padding: 4px 12px;
  border-radius: 16px;
  border: 1px solid #e5e7eb;
  font-size: 0.9rem;
}
</style>