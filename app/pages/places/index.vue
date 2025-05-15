<template>
  <div class="places-container">
    <h1 class="text-3xl font-bold text-primary mb-8 text-center">Places</h1>

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
        No places found matching your filters.
      </div>

      <ul v-else class="places-list">
        <li v-for="place in filteredPlaces" :key="place.id" class="place-item">
          <NuxtLink :to="`/places/${place.id}`" class="block hover:no-underline">
            <div class="flex flex-col gap-2">
              <h2 class="text-xl font-semibold text-primary mb-1">{{ place.name }}</h2>
              <div class="place-details">
                <span class="category">{{ place.category }}</span>
                <span class="coordinates">{{ place.lat.toFixed(4) }}, {{ place.lng.toFixed(4) }}</span>
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
}


.places-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.place-item {
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  margin-bottom: 20px;
  transition: box-shadow 0.2s, transform 0.2s;
  box-shadow: 0 1px 3px 0 rgba(0,0,0,0.03);
}

.place-item:hover {
  transform: translateY(-2px) scale(1.01);
  box-shadow: 0 6px 18px rgba(0, 80, 180, 0.08);
  border-color: #3b82f6;
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
  color: #555;
}

.category {
  text-transform: capitalize;
  background-color: #f1f5f9;
  color: #2563eb;
  padding: 3px 12px;
  border-radius: 12px;
  font-weight: 500;
  font-size: 0.95em;
}

.coordinates {
  font-family: 'Fira Mono', 'Menlo', 'Monaco', monospace;
  background: #f3f4f6;
  padding: 2px 8px;
  border-radius: 8px;
  color: #64748b;
}
</style>
