import type { Place } from './placesService';
import { useAuthService } from './authService';
import { ref } from 'vue';

export interface Trip {
  id: number;
  name: string;
  description: string;
  places: Place[];
  userId: string; // User's email as ID
  createdAt: string;
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
  return calculateDistance(place1.lat, place1.lng, place2.lat, place2.lng);
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
    baseURL: '/api'
  };

  // LocalStorage key for trips
  const TRIPS_STORAGE_KEY = 'user_trips';

  // Helper function to save trips to localStorage
  const saveTripsToStorage = (trips: Trip[]) => {
    if (process.server) return;

    if (!trips || !Array.isArray(trips)) {
      console.error('Invalid trips data provided to saveTripsToStorage:', trips);
      return;
    }

    try {
      const tripsJson = JSON.stringify(trips);
      localStorage.setItem(TRIPS_STORAGE_KEY, tripsJson);
    } catch (error) {
      console.error('Error saving trips to localStorage:', error);
      // Try to clear the storage if we can't save
      try {
        localStorage.removeItem(TRIPS_STORAGE_KEY);
      } catch (clearError) {
        console.error('Error clearing localStorage after save failure:', clearError);
      }
    }
  };

  // Helper function to get trips from localStorage
  const getTripsFromStorage = (): Trip[] => {
    if (process.server) return [];
    try {
      const tripsJson = localStorage.getItem(TRIPS_STORAGE_KEY);
      if (!tripsJson) return [];

      try {
        return JSON.parse(tripsJson);
      } catch (parseError) {
        console.error('Error parsing trips JSON from localStorage:', parseError);
        // If JSON is invalid, reset the storage
        localStorage.removeItem(TRIPS_STORAGE_KEY);
        return [];
      }
    } catch (error) {
      console.error('Error accessing localStorage:', error);
      return [];
    }
  };

  // Get all trips for the current user
  const getTrips = () => {
    const data = ref<Trip[]>([]);
    const error = ref(null);
    const pending = ref(true);

    try {
      // Get trips from localStorage
      const allTrips = getTripsFromStorage();

      // Filter trips by current user
      const { getUser, isAuthenticated } = useAuthService();

      // Check if user is authenticated first
      if (!isAuthenticated()) {
        console.warn('User is not authenticated. No trips will be returned.');
        data.value = [];
        pending.value = false;
        return { data, error, pending };
      }

      const user = getUser();

      if (user) {
        data.value = allTrips.filter(trip => trip.userId === user.email);
      } else {
        console.warn('User information not available despite being authenticated.');
        data.value = [];
      }

      pending.value = false;
    } catch (err) {
      console.error('Error getting trips:', err);
      error.value = err as Error;
      pending.value = false;
    }

    return { data, error, pending };
  };

  // Get a specific trip by ID
  const getTripById = (id: string | number) => {
    const data = ref<Trip | null>(null);
    const error = ref(null);
    const pending = ref(true);

    try {
      // Check authentication first
      const { getUser, isAuthenticated } = useAuthService();

      if (!isAuthenticated()) {
        console.warn('User is not authenticated. Cannot retrieve trip details.');
        pending.value = false;
        return { data, error, pending };
      }

      // Get trips from localStorage
      const allTrips = getTripsFromStorage();

      // Validate ID
      const numericId = Number(id);
      if (isNaN(numericId)) {
        console.error('Invalid trip ID provided:', id);
        error.value = new Error('Invalid trip ID');
        pending.value = false;
        return { data, error, pending };
      }

      // Find the trip with the matching ID
      const trip = allTrips.find(t => t.id === numericId);

      if (!trip) {
        console.warn(`Trip with ID ${numericId} not found`);
        pending.value = false;
        return { data, error, pending };
      }

      // Check if the trip belongs to the current user
      const user = getUser();

      if (user && trip.userId === user.email) {
        data.value = trip;
      } else {
        console.warn('Trip does not belong to the current user or user information is not available');
      }

      pending.value = false;
    } catch (err) {
      console.error('Error getting trip by ID:', err);
      error.value = err as Error;
      pending.value = false;
    }

    return { data, error, pending };
  };

  // Create a new trip
  const createTrip = (trip: Omit<Trip, 'id' | 'createdAt'>) => {
    const data = ref<Trip | null>(null);
    const error = ref(null);
    const pending = ref(true);

    try {
      // Check authentication first
      const { getUser, isAuthenticated } = useAuthService();

      if (!isAuthenticated()) {
        const authError = new Error('User is not authenticated. Cannot create trip.');
        console.warn(authError.message);
        error.value = authError;
        pending.value = false;
        return { data, error, pending };
      }

      // Validate trip data
      if (!trip || typeof trip !== 'object') {
        const dataError = new Error('Invalid trip data provided');
        console.error(dataError.message, trip);
        error.value = dataError;
        pending.value = false;
        return { data, error, pending };
      }

      // Check required fields
      if (!trip.name || !trip.userId || !Array.isArray(trip.places)) {
        const fieldsError = new Error('Missing required trip fields (name, userId, or places)');
        console.error(fieldsError.message, trip);
        error.value = fieldsError;
        pending.value = false;
        return { data, error, pending };
      }

      // Verify user
      const user = getUser();

      if (!user) {
        const userError = new Error('User information not available');
        console.warn(userError.message);
        error.value = userError;
        pending.value = false;
        return { data, error, pending };
      }

      // Verify that the userId matches the current user
      if (trip.userId !== user.email) {
        const userMismatchError = new Error('Trip userId does not match current user');
        console.warn(userMismatchError.message);
        error.value = userMismatchError;
        pending.value = false;
        return { data, error, pending };
      }

      // Create a new trip object
      const newTrip: Trip = {
        ...trip,
        id: Date.now(), // Generate a unique ID
        createdAt: new Date().toISOString()
      };

      // Get existing trips from localStorage
      const allTrips = getTripsFromStorage();

      // Add the new trip
      allTrips.push(newTrip);

      // Save back to localStorage
      saveTripsToStorage(allTrips);

      // Set the response data
      data.value = newTrip;
      pending.value = false;
    } catch (err) {
      console.error('Error creating trip:', err);
      error.value = err as Error;
      pending.value = false;
    }

    return { data, error, pending };
  };

  // Update an existing trip
  const updateTrip = (id: number, tripUpdate: Partial<Trip>) => {
    const data = ref<Trip | null>(null);
    const error = ref(null);
    const pending = ref(true);

    try {
      // Check authentication first
      const { getUser, isAuthenticated } = useAuthService();

      if (!isAuthenticated()) {
        const authError = new Error('User is not authenticated. Cannot update trip.');
        console.warn(authError.message);
        error.value = authError;
        pending.value = false;
        return { data, error, pending };
      }

      // Validate ID
      if (isNaN(id) || id <= 0) {
        const idError = new Error('Invalid trip ID provided');
        console.error(idError.message, id);
        error.value = idError;
        pending.value = false;
        return { data, error, pending };
      }

      // Validate update data
      if (!tripUpdate || typeof tripUpdate !== 'object') {
        const updateError = new Error('Invalid update data provided');
        console.error(updateError.message, tripUpdate);
        error.value = updateError;
        pending.value = false;
        return { data, error, pending };
      }

      // Get trips from localStorage
      const allTrips = getTripsFromStorage();

      // Find the index of the trip to update
      const tripIndex = allTrips.findIndex(t => t.id === id);

      if (tripIndex === -1) {
        const notFoundError = new Error(`Trip with ID ${id} not found`);
        console.warn(notFoundError.message);
        error.value = notFoundError;
        pending.value = false;
        return { data, error, pending };
      }

      // Check if the trip belongs to the current user
      const user = getUser();

      if (!user) {
        const userError = new Error('User information not available');
        console.warn(userError.message);
        error.value = userError;
        pending.value = false;
        return { data, error, pending };
      }

      if (allTrips[tripIndex].userId !== user.email) {
        const permissionError = new Error('You do not have permission to update this trip');
        console.warn(permissionError.message);
        error.value = permissionError;
        pending.value = false;
        return { data, error, pending };
      }

      // Update the trip
      const updatedTrip = { ...allTrips[tripIndex], ...tripUpdate };
      allTrips[tripIndex] = updatedTrip;

      // Save back to localStorage
      saveTripsToStorage(allTrips);

      // Set the response data
      data.value = updatedTrip;
      pending.value = false;
    } catch (err) {
      console.error('Error updating trip:', err);
      error.value = err as Error;
      pending.value = false;
    }

    return { data, error, pending };
  };

  // Delete a trip
  const deleteTrip = (id: number) => {
    const data = ref(null);
    const error = ref(null);
    const pending = ref(true);

    try {
      // Check authentication first
      const { getUser, isAuthenticated } = useAuthService();

      if (!isAuthenticated()) {
        const authError = new Error('User is not authenticated. Cannot delete trip.');
        console.warn(authError.message);
        error.value = authError;
        pending.value = false;
        return { data, error, pending };
      }

      // Validate ID
      if (isNaN(id) || id <= 0) {
        const idError = new Error('Invalid trip ID provided');
        console.error(idError.message, id);
        error.value = idError;
        pending.value = false;
        return { data, error, pending };
      }

      // Get trips from localStorage
      const allTrips = getTripsFromStorage();

      // Find the index of the trip to delete
      const tripIndex = allTrips.findIndex(t => t.id === id);

      if (tripIndex === -1) {
        const notFoundError = new Error(`Trip with ID ${id} not found`);
        console.warn(notFoundError.message);
        error.value = notFoundError;
        pending.value = false;
        return { data, error, pending };
      }

      // Check if the trip belongs to the current user
      const user = getUser();

      if (!user) {
        const userError = new Error('User information not available');
        console.warn(userError.message);
        error.value = userError;
        pending.value = false;
        return { data, error, pending };
      }

      if (allTrips[tripIndex].userId !== user.email) {
        const permissionError = new Error('You do not have permission to delete this trip');
        console.warn(permissionError.message);
        error.value = permissionError;
        pending.value = false;
        return { data, error, pending };
      }

      // Remove the trip
      allTrips.splice(tripIndex, 1);

      // Save back to localStorage
      saveTripsToStorage(allTrips);

      pending.value = false;
    } catch (err) {
      console.error('Error deleting trip:', err);
      error.value = err as Error;
      pending.value = false;
    }

    return { data, error, pending };
  };

  return {
    getTrips,
    getTripById,
    createTrip,
    updateTrip,
    deleteTrip
  };
};
