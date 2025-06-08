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

      <div class="flex justify-between items-center mb-4">
        <div v-if="trip.places.length > 1" class="flex gap-2">
          <UButton
            color="primary"
            variant="soft"
            size="sm"
            icon="i-heroicons-map"
            @click="isRouteModalOpen = true"
          >
            Plan Route
          </UButton>
          <USelect v-model="selectedTransportMode" :options="transportModes" placeholder="Select transport mode" />
        </div>
        <div v-else class="text-sm text-gray-500">
          Add at least 2 places to plan a route
        </div>
      </div>

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

    <!-- Route Planning Modal -->
    <ConfirmationModal
      :is-open="isRouteModalOpen"
      title="Route Planning"
      :message="`Planning route for ${trip?.name || ''} using ${selectedTransportMode || 'TRANSIT'}`"
      confirm-button-text="Generate Route"
      confirm-button-color="primary"
      :is-loading="isLoadingRoute"
      @close="isRouteModalOpen = false"
      @confirm="generateRoute"
    />

    <!-- Route Results Modal -->
    <div v-if="isRouteResultModalOpen" class="modal-overlay">
      <div class="modal-content max-w-4xl">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-xl font-semibold">Route Results</h3>
          <UButton icon="i-heroicons-x-mark" color="gray" variant="ghost" size="sm" @click="isRouteResultModalOpen = false" />
        </div>

        <div v-if="isLoadingRoute" class="text-center py-8">
          <UIcon name="i-heroicons-arrow-path" class="animate-spin h-8 w-8 mx-auto mb-4" />
          <p>Generating route...</p>
        </div>

        <div v-else-if="routeError" class="text-center text-red-500 py-8">
          <p>{{ routeError }}</p>
        </div>

        <div v-else-if="routeResult" class="route-results">
          <div v-for="(leg, legIndex) in routeResult.legs" :key="legIndex" class="route-leg mb-4 p-4 border border-gray-700 rounded-lg">
            <div class="font-medium mb-2">
              {{ leg.from.name || 'Start' }} → {{ leg.to.name || 'End' }}
            </div>
            <div class="text-sm text-gray-400 mb-2">
              Distance: {{ formatDistance(leg.distance || 0) }} | Duration: {{ formatDuration(leg.duration || 0) }}
            </div>
            <div class="step-list">
              <div v-for="(step, stepIndex) in leg.steps" :key="stepIndex" class="step-item py-2 border-b border-gray-700 last:border-b-0">
                <div class="flex items-center gap-2">
                  <UIcon :name="getTransportIcon(step.mode)" class="w-5 h-5" />
                  <span>{{ step.instruction }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="flex justify-end mt-4">
          <UButton @click="isRouteResultModalOpen = false">Close</UButton>
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
import EditableDescription from '../../components/EditableDescription.vue';

const route = useRoute();
const { isAuthenticated } = useAuthService();
const { getTripById, updateTrip, deleteTrip } = useTripsService();

onMounted(() => {
  if (!isAuthenticated()) {
    return navigateTo('/login');
  }
});

const tripId = Array.isArray(route.params.id) ? route.params.id[0] : route.params.id;
const { data: trip, pending, error } = await getTripById(tripId);

const isSaving = ref(false);

const saveTripName = async (newName: string) => {
  if (!trip.value) return;

  isSaving.value = true;
  try {
    await updateTrip(trip.value.id, { name: newName });
    trip.value.name = newName;
  } catch (err) {
    console.error('Error updating trip name:', err);
  } finally {
    isSaving.value = false;
  }
};

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

const totalTripLength = computed(() => {
  if (!trip.value || trip.value.places.length <= 1) return 0;
  return calculateTripLength(trip.value.places);
});

const formatDistance = (distance: number): string => {
  if (distance < 1) {
    return `${Math.round(distance * 1000)} m`;
  }
  return `${distance.toFixed(1)} km`;
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

const formatDuration = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes} min`;
};

const draggedIndex = ref(-1);
const dropTargetIndex = ref(-1);

const dragStart = (event: DragEvent, index: number) => {
  draggedIndex.value = index;
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move';
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

  dropTargetIndex.value = -1;

  if (draggedIndex.value === -1 || draggedIndex.value === dropIndex) {
    draggedIndex.value = -1;
    return;
  }

  if (trip.value) {
    const updatedPlaces = [...trip.value.places];

    const [draggedItem] = updatedPlaces.splice(draggedIndex.value, 1);

    updatedPlaces.splice(dropIndex, 0, draggedItem);

    try {
      await updateTrip(trip.value.id, { places: updatedPlaces });

      trip.value.places = updatedPlaces;

      draggedIndex.value = -1;
    } catch (err) {
      console.error('Error updating trip places order:', err);
    }
  }
};

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
    } finally {
      isRemovingPlace.value = false;
    }
  }
};

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
    } finally {
      isDeleting.value = false;
    }
  }
};

const isRouteModalOpen = ref(false);
const isLoadingRoute = ref(false);
const isRouteResultModalOpen = ref(false);
const routeResult = ref<any>(null);
const routeError = ref<string | null>(null);
const transportModes = ref([
  { value: 'CAR', label: 'Driving' },
  { value: 'TRANSIT', label: 'Public Transport' },
  { value: 'WALK', label: 'Walking' },
  { value: 'BICYCLE', label: 'Bicycling' }
]);
const selectedTransportMode = ref(transportModes.value[0].value);

interface OtpWaypoint {
  lat: number;
  lon: number;
  name?: string;
}

const generateRoute = async () => {
  if (!trip.value || trip.value.places.length < 2) return;

  isLoadingRoute.value = true;
  routeError.value = null;
  isRouteResultModalOpen.value = true;

  try {
    console.log("Places data:", JSON.stringify(trip.value.places));

    // Głębsze sprawdzenie struktury danych
    const placeStructures = trip.value.places.map(place => ({
      id: place.id,
      name: place.name,
      hasLatitude: place.hasOwnProperty('latitude'),
      hasLongitude: place.hasOwnProperty('longitude'),
      latitudeType: typeof place.latitude,
      longitudeType: typeof place.longitude,
      latitudeValue: place.latitude,
      longitudeValue: place.longitude
    }));

    console.log("Place structures:", placeStructures);

    // UŻYWAMY WSZYSTKICH MIEJSC BEZ SPRAWDZANIA
    const waypoints: OtpWaypoint[] = trip.value.places.map(place => {
      // Zakładamy, że dane są poprawne i konwertujemy wartości na liczby
      const lat = typeof place.latitude === 'number' ? place.latitude : parseFloat(String(place.latitude));
      const lon = typeof place.longitude === 'number' ? place.longitude : parseFloat(String(place.longitude));

      return {
        lat: isNaN(lat) ? 0 : lat,
        lon: isNaN(lon) ? 0 : lon,
        name: place.name
      };
    });

    console.log("Waypoints:", waypoints);

    const origin = waypoints[0];
    const destination = waypoints[waypoints.length - 1];
    const intermediateStops = waypoints.slice(1, -1);

    // Build OTP2 API request
    const otpRequest = {
      fromPlace: `${origin.lat},${origin.lon}`,
      toPlace: `${destination.lat},${destination.lon}`,
      mode: selectedTransportMode.value,
      date: new Date().toISOString().split('T')[0], // Today's date
      time: "12:00:00",
      numItineraries: 1
    };

    // Add intermediate stops if any
    if (intermediateStops.length > 0) {
      otpRequest.intermediatePlaces = intermediateStops.map(stop => `${stop.lat},${stop.lon}`).join('|');
    }

    console.log('Sending OTP request:', otpRequest);

    try {
      // Call OTP API via our proxy endpoint
      const response = await fetch(`/api/otp/plan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(otpRequest)
      });

      if (!response.ok) {
        throw new Error(`OTP API error: ${response.status}`);
      }

      const data = await response.json();
      console.log('OTP API response:', data);

      if (!data.plan || !data.plan.itineraries || data.plan.itineraries.length === 0) {
        throw new Error('No route found for the selected mode of transportation');
      }

      // Transform OTP response to our format
      routeResult.value = transformOtpResponse(data, waypoints);
    } catch (apiError) {
      console.warn('Failed to get route from API, using fallback demo data', apiError);

      // Generowanie danych demo jako fallback
      routeResult.value = generateFallbackRouteData(waypoints, selectedTransportMode.value);
    }

  } catch (err) {
    console.error('Error generating route:', err);
    routeError.value = err instanceof Error ? err.message : 'Failed to generate route. Please try again.';
  } finally {
    isLoadingRoute.value = false;
  }
};

// Funkcja generująca przykładowe dane trasy jako fallback
const generateFallbackRouteData = (waypoints: OtpWaypoint[], mode: string) => {
  const legs = [];

  // Logowanie wszystkich punktów trasy
  console.log("Generating fallback route for waypoints:",
    waypoints.map(wp => `${wp.name} (${wp.lat}, ${wp.lon})`).join(' -> ')
  );

  for (let i = 0; i < waypoints.length - 1; i++) {
    const from = waypoints[i];
    const to = waypoints[i + 1];

    console.log(`Segment ${i+1}: From ${from.name} (${from.lat}, ${from.lon}) to ${to.name} (${to.lat}, ${to.lon})`);

    // Proste obliczenie dystansu (Haversine formula - bardziej dokładna dla współrzędnych geograficznych)
    const R = 6371; // Promień Ziemi w km
    const dLat = (to.lat - from.lat) * Math.PI / 180;
    const dLon = (to.lon - from.lon) * Math.PI / 180;
    const a =
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(from.lat * Math.PI / 180) * Math.cos(to.lat * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c; // Dystans w km

    // Minimum distance to avoid zero times
    const effectiveDistance = Math.max(distance, 0.1);

    // Szacowanie czasu w zależności od środka transportu
    let speed = 50; // km/h
    switch (mode.toUpperCase()) {
      case 'CAR': speed = 50; break;
      case 'TRANSIT': speed = 30; break;
      case 'WALK': speed = 5; break;
      case 'BICYCLE': speed = 15; break;
    }

    const duration = (effectiveDistance / speed) * 3600; // Czas w sekundach

    console.log(`  Distance: ${distance.toFixed(2)} km, Speed: ${speed} km/h, Duration: ${duration.toFixed(0)} sec`);

    legs.push({
      from: {
        name: from.name || `Punkt ${i+1}`,
        lat: from.lat,
        lng: from.lon
      },
      to: {
        name: to.name || `Punkt ${i+2}`,
        lat: to.lat,
        lng: to.lon
      },
      distance: effectiveDistance,
      duration: duration,
      mode: mode,
      steps: [
        {
          distance: effectiveDistance,
          instruction: `Podróż z ${from.name || 'punktu startowego'} do ${to.name || 'punktu końcowego'} używając ${mode}`,
          mode: mode
        }
      ]
    });
  }

  const totalDistance = legs.reduce((total, leg) => total + leg.distance, 0);
  const totalDuration = legs.reduce((total, leg) => total + leg.duration, 0);

  console.log(`Total route: ${totalDistance.toFixed(2)} km, ${(totalDuration/60).toFixed(0)} min`);

  return {
    duration: totalDuration,
    distance: totalDistance,
    startTime: new Date(),
    endTime: new Date(Date.now() + totalDuration * 1000),
    legs
  };
};

const transformOtpResponse = (otpResponse: any, waypoints: OtpWaypoint[]) => {
  const itinerary = otpResponse.plan.itineraries[0];

  return {
    duration: itinerary.duration,
    distance: itinerary.distance / 1000, // Convert to km
    startTime: new Date(itinerary.startTime),
    endTime: new Date(itinerary.endTime),
    legs: itinerary.legs.map((leg: any) => {
      return {
        from: {
          name: leg.from.name,
          lat: leg.from.lat,
          lng: leg.from.lon
        },
        to: {
          name: leg.to.name,
          lat: leg.to.lat,
          lng: leg.to.lon
        },
        distance: leg.distance / 1000, // Convert to km
        duration: leg.duration,
        mode: leg.mode,
        routeId: leg.routeId,
        steps: leg.steps?.map((step: any) => ({
          distance: step.distance,
          relativeDirection: step.relativeDirection,
          streetName: step.streetName,
          absoluteDirection: step.absoluteDirection,
          instruction: step.instruction || getDefaultInstruction(step),
          mode: leg.mode
        })) || []
      };
    })
  };
};

const getDefaultInstruction = (step: any) => {
  if (!step.relativeDirection || !step.streetName) {
    return "Continue on current route";
  }

  return `${step.relativeDirection} onto ${step.streetName}`;
};

const getTransportIcon = (mode: string) => {
  switch (mode?.toUpperCase()) {
    case 'CAR':
      return 'i-heroicons-truck';
    case 'TRANSIT':
    case 'BUS':
      return 'i-heroicons-truck';
    case 'WALK':
      return 'i-heroicons-user';
    case 'BICYCLE':
      return 'i-heroicons-academic-cap';
    case 'RAIL':
    case 'SUBWAY':
    case 'TRAM':
      return 'i-heroicons-truck';
    default:
      return 'i-heroicons-question-mark-circle';
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
  padding-left: 40px;
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
