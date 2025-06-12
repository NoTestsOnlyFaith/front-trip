<template>
  <div class="place-grid-container">
    <h2 class="grid-title">Discover Amazing Places</h2>
    <div class="place-grid">
      <div
        v-for="place in displayPlaces"
        :key="place.id"
        class="place-grid-card"      >
        <div class="card-illustration">
          <div class="illustration-background" :style="{ backgroundColor: getRandomColor() }">
            <Icon :name="getCategoryIcon(place.category)" class="category-icon" />
          </div>
        </div>
        <div class="card-content">
          <h3 class="place-name">{{ place.name }}</h3>
          <div class="place-meta">
            <span class="category-badge">{{ place.category }}</span>
            <span class="location-info">{{ place.address?.city }}</span>
          </div>
        </div>
        <div class="card-overlay">
          <NuxtLink :to="`/places/${place.id}`" class="view-details-btn">
            <Icon name="lucide:eye" class="btn-icon" />
            View Details
          </NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { usePlacesService } from '../services/placesService';


// Pobieranie danych z API
const { getPlaces } = usePlacesService();
const { data: places } = await getPlaces();

// Wyświetlaj maksymalnie 9 miejsc
const displayPlaces = computed(() => {
  if (!places.value) return [];
  return places.value.slice(0, 12);
});

const categoryIcons = {
  restaurant: 'lucide:utensils',
  zoo: 'lucide:paw-print',
  them_park: 'lucide:roller-coaster',
  tourist_attraction: 'lucide:star',
  national_park: 'lucide:trees',
  aquarium: 'lucide:fish',
  hotel: 'lucide:bed',
  museum: 'lucide:landmark',
  park: 'lucide:trees',
  beach: 'lucide:waves',
  city: 'lucide:building-2',
  historical: 'lucide:castle',
  cafe: 'lucide:coffee',
  landmark: 'lucide:map-pin',
  default: 'lucide:map-pin'

};

const colors = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57',
  '#FF9FF3', '#54A0FF', '#5F27CD', '#00D2D3', '#FF9F43'
];

const getCategoryIcon = (category: string) => {
  const normalizedCategory = category.toLowerCase();
  return categoryIcons[normalizedCategory as keyof typeof categoryIcons] || categoryIcons.default;
};

let colorIndex = 0;
const getRandomColor = () => {
  const color = colors[colorIndex % colors.length];
  colorIndex++;
  return color;
};
</script>

<style scoped>
:root {
  --bg-color: rgb(0, 100, 60);
  --primary-color: rgb(0, 220, 130);

}

.place-grid-container {
  width: 100%;
  padding: 2rem;
}

.grid-title {
  text-align: center;
  font-size: 2.5rem;
  font-weight: bold;
  color: var(--primary-color);
  margin-bottom: 3rem;
  background: linear-gradient(135deg, rgb(0, 220, 130), rgb(0, 180, 100));
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.place-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
  max-width: 1200px;
  margin: 0 auto;
}

.place-grid-card {
  position: relative;
  background: #11242a;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
  border: 1px solid rgba(0, 220, 130, 0.1);
  cursor: pointer;
}

.place-grid-card:hover {
  transform: translateY(-8px) scale(1.02);
  box-shadow: 0 12px 40px rgba(0, 220, 130, 0.15);
  border-color: rgba(0, 220, 130, 0.3);
}

.card-illustration {
  height: 120px;
  position: relative;
  overflow: hidden;
}

.illustration-background {
  width: 100%;
  height: 100%;

  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--bg-color), rgba(255, 255, 255, 0.2));
  position: relative;
}

.illustration-background::before {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: repeating-linear-gradient(
    45deg,
    transparent,
    transparent 10px,
    rgba(255, 255, 255, 0.1) 10px,
    rgba(255, 255, 255, 0.1) 20px
  );
  animation: float 20s infinite linear;
}

.category-icon {
  font-size: 2.5rem;
  color: white;
  z-index: 2;
  position: relative;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
}

.card-content {
  padding: 1.25rem;
}

.place-name {
  font-size: 1.25rem;
  font-weight: 600;
  color: rgb(0, 220, 130);
  margin-bottom: 0.75rem;
  line-height: 1.3;
}

.place-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
  gap: 0.5rem;
}

.category-badge {
  background: rgba(0, 220, 130, 0.1);
  color: rgba(0, 220, 130, 0.8);
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.85rem;
  font-weight: 500;
  text-transform: capitalize;
  border: 1px solid rgba(0, 220, 130, 0.3);
}

.location-info {
  color: #6b7280;
  font-size: 0.9rem;
  font-weight: 500;
}



.card-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 220, 130, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.place-grid-card:hover .card-overlay {
  opacity: 1;
}

.view-details-btn {
  background: white;
  color: rgb(0, 100, 60);
  padding: 0.75rem 1.5rem;
  border-radius: 25px;
  font-weight: 600;
  text-decoration: none;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s ease;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.view-details-btn:hover {
  transform: scale(1.05);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
}

.btn-icon {
  font-size: 1.1rem;
}

@keyframes float {
  0% {
    transform: translateX(-50px);
  }
  100% {
    transform: translateX(50px);
  }
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .place-grid {
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 1rem;
  }

  .grid-title {
    font-size: 2rem;
    margin-bottom: 2rem;
  }

  .place-grid-container {
    padding: 1rem;
  }
}

@media (max-width: 480px) {
  .place-grid {
    grid-template-columns: 1fr;
  }
}
</style>