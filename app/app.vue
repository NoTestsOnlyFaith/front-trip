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
        </nav>

        <!-- Right side auth links -->
        <div class="flex space-x-3">
          <UButton to="/login" variant="ghost" size="sm">
            Login
          </UButton>
          <UButton to="/register" variant="solid" color="primary" size="sm">
            Register
          </UButton>
        </div>
      </div>
    </header>
    
    <main class="container mx-auto p-4">
      <NuxtPage />
    </main>
  </UApp>
</template>
