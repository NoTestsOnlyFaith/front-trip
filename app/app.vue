<template>
  <UApp>
    <header class="border-b border-gray-200 dark:border-gray-800">
      <div class="container mx-auto flex items-center justify-between p-4">
        <!-- Left side navigation -->
        <nav class="flex space-x-4">
          <NuxtLink to="/" class="px-3 py-2 hover:text-primary transition-colors">
            Home
          </NuxtLink>
          <NuxtLink to="/places" class="px-3 py-2 hover:text-primary transition-colors">
            Places
          </NuxtLink>
          <NuxtLink v-if="isAuthenticated" to="/trips" class="px-3 py-2 hover:text-primary transition-colors">
            My Trips
          </NuxtLink>
        </nav>

        <!-- Right side auth links -->
        <div class="flex space-x-3 items-center">
          <template v-if="isAuthenticated">
            <span class="text-sm mr-3">{{ user?.email }}</span>
            <UButton @click="logout" variant="ghost" size="sm">
              Logout
            </UButton>
          </template>
          <template v-else>
            <UButton to="/login" variant="ghost" size="sm">
              Login
            </UButton>
            <UButton to="/register" variant="solid" color="primary" size="sm">
              Register
            </UButton>
          </template>
        </div>
      </div>
    </header>

    <main class="container mx-auto p-4">
      <NuxtPage />
    </main>
  </UApp>
</template>

<script setup>
import { useAuthService, authStateChangeEvent } from './services/authService';
import { ref, onMounted, onUnmounted } from 'vue';

const { isAuthenticated: checkAuth, getUser, logout: authLogout } = useAuthService();

const isAuthenticated = ref(false);
const user = ref(null);

// Update auth state
const updateAuthState = () => {
  isAuthenticated.value = checkAuth();
  user.value = getUser();
};

// Wrapper for logout to update local state
const logout = () => {
  authLogout();
  // Note: No need to call updateAuthState() here as we're now listening for the auth state change event
};

// Handler for auth state change events
const handleAuthStateChange = () => {
  updateAuthState();
};

onMounted(() => {
  updateAuthState();

  // Listen for storage events to update auth state when it changes in another tab
  window.addEventListener('storage', updateAuthState);

  // Listen for custom auth state change events
  window.addEventListener(authStateChangeEvent, handleAuthStateChange);
});

onUnmounted(() => {
  // Clean up event listeners
  window.removeEventListener('storage', updateAuthState);
  window.removeEventListener(authStateChangeEvent, handleAuthStateChange);
});
</script>
