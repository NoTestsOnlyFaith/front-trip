<template>
  <div class="places-container">
    <h1 class="text-3xl font-bold text-primary mb-8 text-center">Places</h1>
    <div class="text-center mb-4">
      <NuxtLink to="/places/map" class="text-primary hover:underline">View on Map</NuxtLink>
    </div>

    <div v-if="pending" class="text-center text-gray-500">Loading places...</div>
    <div v-else-if="error" class="text-center text-red-500">Error: {{ error.message }}</div>
    <div v-else>
      <!-- Filters -->
      <div class="filters mb-6">
        <div class="flex flex-col md:flex-row gap-4">
          <div class="search-container flex-grow">
            <input 
              v-model="searchTerm" 
              type="text" 
              placeholder="Search by name..." 
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div class="category-filter">
            <select 
              v-model="selectedCategory" 
              class="w-full px-2 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">All Categories</option>
              <option v-for="category in uniqueCategories" :key="category" :value="category">
                {{ category }}
              </option>
            </select>
          </div>
        </div>
      </div>

      <div v-if="filteredPlaces.length === 0" class="text-center text-gray-500 my-8">
        No places found matching your filters. TEST
      </div>

      <ul v-else class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-6 p-4">
        <li v-for="place in filteredPlaces" :key="place.id" class="border border-gray-700 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 ease-in-out bg-gray-800 text-gray-100 hover:bg-gray-700 cursor-pointer flex flex-col h-40">
          <NuxtLink :to="`/places/${place.id}`" class="block hover:no-underline p-4 flex-grow flex flex-col">
            <div class="flex flex-col gap-2 flex-grow">
              <h2 class="text-xl font-semibold text-primary mb-1">{{ place.name }}</h2>
              <div class="place-details text-sm text-gray-300 mt-auto">
                <span class="category">{{ place.category }}</span>
              </div>
            </div>
          </NuxtLink>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { usePlacesService } from '../..//services/placesService'
import { ref, computed } from 'vue'

const { getPlaces } = usePlacesService()
const { data: places, pending, error } = await getPlaces()

// Filter state
const searchTerm = ref('')
const selectedCategory = ref('')

// Get unique categories for the dropdown
const uniqueCategories = computed(() => {
  if (!places.value) return []
  const categories = places.value.map(place => place.category)
  return [...new Set(categories)].sort()
})

// Filter places based on search term and selected category
const filteredPlaces = computed(() => {
  if (!places.value) return []

  return places.value.filter(place => {
    // Filter by name (case insensitive)
    const nameMatch = searchTerm.value === '' || 
      place.name.toLowerCase().includes(searchTerm.value.toLowerCase())

    // Filter by category
    const categoryMatch = selectedCategory.value === '' || 
      place.category === selectedCategory.value

    // Return places that match both filters
    return nameMatch && categoryMatch
  })
})
</script>

<style scoped>
.places-container {
  max-width: 900px;
  margin: 0 auto;
  padding: 32px 16px;
  color: #f3f4f6;
  border-radius: 0.5rem;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(0, 220, 130, 0.1);
  border: 1px solid rgba(0, 220, 130, 0.15);
}

.places-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.place-item {
  border: 1px solid rgba(0, 220, 130, 0.15);
  border-radius: 10px;
  margin-bottom: 20px;
  transition: box-shadow 0.2s, transform 0.2s;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
}

.place-item:hover {
  transform: translateY(-2px) scale(1.01);
  box-shadow: 0 6px 18px rgba(0, 220, 130, 0.1);
  border-color: rgba(0, 220, 130, 0.4);
}

.place-item a {
  display: block;
  padding: 24px;
  color: inherit;
  text-decoration: none;
}

.place-details {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 6px;
  font-size: 0.97rem;
  color: #a3a3a3;
}

.category {
  text-transform: capitalize;
  padding: 3px 12px;
  border-radius: 12px;
  font-weight: 500;
  font-size: 0.95em;
  border: 1px solid rgba(0, 220, 130, 0.3);
  color: rgba(0, 220, 130, 0.8);
}

.coordinates {
  font-family: 'Fira Mono', 'Menlo', 'Monaco', monospace;
  padding: 2px 8px;
  border-radius: 8px;
  color: #a3a3a3;
  border: 1px solid #333333;
}

.filters .search-container input,
.filters .category-filter select {
  color: #f3f4f6;
  border-color: rgba(0, 220, 130, 0.2);
}

.filters .search-container input:focus,
.filters .category-filter select:focus {
  border-color: rgba(0, 220, 130, 0.5);
  box-shadow: 0 0 0 2px rgba(0, 220, 130, 0.2);
}
</style>
