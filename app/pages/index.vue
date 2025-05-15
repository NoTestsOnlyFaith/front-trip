<template>
  <div>
    <!-- Hero Section -->
    <section class="flex flex-col items-center justify-center h-[70vh] gap-8">
      <h1 class="font-bold text-4xl md:text-6xl text-primary mb-2">
        Tripsemble
      </h1>
      <p class="text-lg md:text-2xl text-gray-600 max-w-xl text-center">
        Discover, plan, and share your travel adventures. Join Tripsemble to explore new places and connect with fellow travelers!
      </p>
      <NuxtLink to="/places">
        <UButton color="primary" size="lg">
          Explore Places
        </UButton>
      </NuxtLink>
    </section>

    <!-- About Section -->
    <section class="max-w-3xl mx-auto my-16 px-4 text-center">
      <h2 class="text-2xl font-semibold text-primary mb-4">About Tripsemble</h2>
      <p class="text-gray-700">
        Tripsemble is your companion for discovering new destinations, planning trips, and sharing your experiences with a vibrant community of travelers. Whether you're a seasoned explorer or planning your first adventure, Tripsemble makes travel easy and fun.
      </p>
    </section>

    <!-- Features Section -->
    <section class="max-w-5xl mx-auto my-16 px-4">
      <h2 class="text-2xl font-semibold text-primary text-center mb-8">Features</h2>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div class="border border-gray-200 rounded-lg shadow p-6 flex flex-col items-center">
          <span class="text-3xl mb-2">🌍</span>
          <h3 class="font-bold text-lg mb-2">Explore Destinations</h3>
          <p class="text-gray-600 text-center">Browse curated places and hidden gems from around the world.</p>
        </div>
        <div class="border border-gray-200 rounded-lg shadow p-6 flex flex-col items-center">
          <span class="text-3xl mb-2">🗺️</span>
          <h3 class="font-bold text-lg mb-2">Plan Your Trip</h3>
          <p class="text-gray-600 text-center">Organize your itinerary and keep all your travel details in one place.</p>
        </div>
        <div class="border border-gray-200 rounded-lg shadow p-6 flex flex-col items-center">
          <span class="text-3xl mb-2">🤝</span>
          <h3 class="font-bold text-lg mb-2">Connect & Share</h3>
          <p class="text-gray-600 text-center">Share your journeys and connect with fellow travelers for inspiration.</p>
        </div>
      </div>
    </section>

    <!-- Call to Action Section -->
    <section class="flex flex-col items-center my-16">
      <h2 class="text-2xl font-semibold text-primary mb-4">Ready to start your adventure?</h2>
      <NuxtLink to="/places">
        <UButton color="primary" size="lg">
          Explore Places
        </UButton>
      </NuxtLink>
    </section>
  </div>
</template>
