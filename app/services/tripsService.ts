import axios from 'axios';
import type { Place } from './placesService';
import { useAuthService } from './authService';
import { ref } from 'vue';
import { usePlacesService } from './placesService';

// Zmienne i interfejsy do obsługi Route (Trip)
export interface RoutePointDto {
  placeId: number;
  order: number;
}

export interface RouteCreateDto {
  name: string;
  notes?: string;
  routePoints: RoutePointDto[];
}

export interface RouteResponseDto {
  id: number;
  name: string;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
  routePoints: { placeId: number; order: number; placeName?: string }[];
}

// Typ dla aktualizacji trasy zgodny z backendem
export interface RouteUpdateDto {
  name?: string;
  notes?: string;
  routePoints?: { placeId: number; order: number }[];
}

// Interfejs dla danych trasy z frontendu
export interface RouteCreateFromFrontendDto {
  name: string;
  description?: string;
  places: { id: number }[];
  userId?: string;
}

// Calculate distance between two points using Haversine formula (in kilometers)
const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
  const R = 6371; // Radius of the Earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

// Calculate distance between two places
export const getDistanceBetweenPlaces = (place1: Place, place2: Place): number => {
  // Obsługa zarówno lat/lng jak i latitude/longitude
  const lat1 = typeof place1.lat === 'number' ? place1.lat : place1.latitude;
  const lng1 = typeof place1.lng === 'number' ? place1.lng : place1.longitude;
  const lat2 = typeof place2.lat === 'number' ? place2.lat : place2.latitude;
  const lng2 = typeof place2.lng === 'number' ? place2.lng : place2.longitude;
  if (
    typeof lat1 !== 'number' || typeof lng1 !== 'number' ||
    typeof lat2 !== 'number' || typeof lng2 !== 'number'
  ) {
    return 0;
  }
  return calculateDistance(lat1, lng1, lat2, lng2);
};

// Calculate total trip length in kilometers
export const calculateTripLength = (places: Place[]): number => {
  if (places.length <= 1) return 0;

  let totalDistance = 0;
  for (let i = 0; i < places.length - 1; i++) {
    totalDistance += getDistanceBetweenPlaces(places[i], places[i + 1]);
  }

  return totalDistance;
};

export const useTripsService = () => {
  const config = {
    baseURL: '/api',
  };

  const { getToken } = useAuthService();

  // Funkcja pomocnicza do pobierania szczegółów miejsc po id
  async function fetchPlacesDetails(placeIds: number[]): Promise<Place[]> {
    const { getPlaceById } = usePlacesService();
    const uniqueIds = Array.from(new Set(placeIds));
    const places: Place[] = [];
    for (const id of uniqueIds) {
      try {
        const { data } = await getPlaceById(id);
        if (data.value) places.push(data.value);
      } catch (e) {
        // Możesz logować błąd, ale nie przerywaj całej operacji
      }
    }
    // Zachowaj kolejność jak w placeIds
    return placeIds.map(id => places.find(p => p.id === id)).filter(Boolean) as Place[];
  }

  // Funkcja pomocnicza do mapowania odpowiedzi backendu na strukturę z places (z pobieraniem szczegółów)
  async function mapRouteResponseToTripWithPlaces(route: RouteResponseDto) {
    const placeIds = Array.isArray(route.routePoints)
      ? route.routePoints.map(rp => rp.placeId)
      : [];
    const places = await fetchPlacesDetails(placeIds);
    return {
      ...route,
      description: route.notes || '',
      places,
    };
  }

  // --- API BACKEND ---
  // Get all trips (routes) for current user
  const getTrips = async () => {
    const data = ref<any[]>([]);
    const error = ref(null);
    const pending = ref(true);
    try {
      const token = getToken();
      console.log('Pobieranie tras z tokenem:', token ? 'Token istnieje' : 'Brak tokena');

      const res = await axios.get('/api/Routes', {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log('Odpowiedź z /api/Routes:', res.data);

      // Mapuj odpowiedź na strukturę z places (szczegóły z API)
      if (Array.isArray(res.data)) {
        console.log(`Znaleziono ${res.data.length} tras do przetworzenia`);
        data.value = await Promise.all(res.data.map(mapRouteResponseToTripWithPlaces));
        console.log('Trasy po mapowaniu:', data.value);
      } else {
        console.warn('Odpowiedź z API nie jest tablicą:', res.data);
        data.value = [];
      }
    } catch (err) {
      console.error('Błąd podczas pobierania tras:', err);
      error.value = err;
    } finally {
      pending.value = false;
    }
    return { data, error, pending };
  };

  // Get trip (route) by id
  const getTripById = async (id: number) => {
    const data = ref<any | null>(null);
    const error = ref(null);
    const pending = ref(true);
    try {
      const token = getToken();
      const res = await axios.get(`/api/Routes/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      // Mapuj odpowiedź na strukturę z places (szczegóły z API)
      data.value = res.data ? await mapRouteResponseToTripWithPlaces(res.data) : null;
    } catch (err) {
      error.value = err;
    } finally {
      pending.value = false;
    }
    return { data, error, pending };
  };

  // Create new trip (route)
  const createTrip = async (trip: RouteCreateFromFrontendDto) => {
    const data = ref<RouteResponseDto | null>(null);
    const error = ref(null);
    const pending = ref(true);
    try {
      const token = getToken();

      // Możemy wysłać dane w formacie frontendu - backend obsłuży oba formaty
      const res = await axios.post('/api/Routes', trip, {
        headers: { Authorization: `Bearer ${token}` },
      });
      data.value = res.data;
    } catch (err) {
      error.value = err;
    } finally {
      pending.value = false;
    }
    return { data, error, pending };
  };

  // Alternatywna funkcja createTrip używająca RouteCreateDto (standardowy format backendu)
  const createTripWithRoutePoints = async (tripData: {
    name: string;
    notes?: string;
    places: Place[]
  }) => {
    const data = ref<RouteResponseDto | null>(null);
    const error = ref(null);
    const pending = ref(true);
    try {
      const token = getToken();

      // Przekształć places na routePoints
      const routePoints = tripData.places.map((place, index) => ({
        placeId: place.id,
        order: index + 1
      }));

      // Utwórz RouteCreateDto
      const routeCreateDto: RouteCreateDto = {
        name: tripData.name,
        notes: tripData.notes,
        routePoints
      };

      const res = await axios.post('/api/Routes', routeCreateDto, {
        headers: { Authorization: `Bearer ${token}` },
      });
      data.value = res.data;
    } catch (err) {
      error.value = err;
    } finally {
      pending.value = false;
    }
    return { data, error, pending };
  };

  // Update trip (route)
  const updateTrip = async (id: number, update: Partial<{ name: string; description: string; places: Place[] }>) => {
    const data = ref(null);
    const error = ref(null);
    const pending = ref(true);
    try {
      const token = getToken();
      // Mapuj dane do RouteUpdateDto
      const routeUpdate: RouteUpdateDto = {};
      // Zawsze wysyłaj wszystkie dane
      routeUpdate.name = update.name !== undefined ? update.name : (update as any).currentName;
      routeUpdate.notes = update.description !== undefined ? update.description : (update as any).currentDescription;
      // Jeśli nie podano places, pobierz aktualne miejsca z tripa (wymagane do pełnej aktualizacji)
      let places: Place[] | undefined = update.places;
      if (!places && typeof id === 'number') {
        // Pobierz aktualny trip z API, aby mieć pełną listę miejsc
        const tripRes = await getTripById(id);
        if (tripRes.data.value && Array.isArray(tripRes.data.value.places)) {
          places = tripRes.data.value.places;
        }
      }
      if (places) {
        routeUpdate.routePoints = places.map((p, idx) => ({ placeId: p.id, order: idx + 1 }));
      }
      await axios.put(`/api/Routes/${id}`, routeUpdate, {
        headers: { Authorization: `Bearer ${token}` },
      });
      data.value = true;
    } catch (err) {
      error.value = err;
    } finally {
      pending.value = false;
    }
    return { data, error, pending };
  };

  // Delete trip (route)
  const deleteTrip = async (id: number) => {
    const data = ref(false);
    const error = ref(null);
    const pending = ref(true);
    try {
      const token = getToken();
      await axios.delete(`/api/Routes/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      data.value = true;
    } catch (err) {
      error.value = err;
    } finally {
      pending.value = false;
    }
    return { data, error, pending };
  };

  return {
    getTrips,
    getTripById,
    createTrip,
    createTripWithRoutePoints,
    updateTrip,
    deleteTrip
  };
};
