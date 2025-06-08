<template>
  <div class="max-w-md mx-auto my-8 p-6 border border-gray-200 rounded-lg shadow-sm dark:border-gray-800">
    <h1 class="text-2xl font-bold mb-6">Register</h1>
    
    <UForm :state="formState" class="space-y-4 flex flex-col" @submit="handleRegister">
      <UFormGroup label="Email" name="email">
        <UInput class="w-100" v-model="formState.email" type="email" placeholder="your@email.com" />
      </UFormGroup>
      
      <UFormGroup label="Password" name="password">
        <UInput class="w-100" v-model="formState.password" type="password" placeholder="Create a password" />
        <p class="text-xs text-gray-500 mt-2">Password must be at least 8 characters with numbers and letters</p>
      </UFormGroup>
      
      <UFormGroup label="Confirm Password" name="confirmPassword">
        <UInput class="w-100" v-model="formState.confirmPassword" type="password" placeholder="Confirm your password" />
      </UFormGroup>

      <div v-if="errorMessage" class="text-red-500 text-sm mt-2">
        {{ errorMessage }}
      </div>
      
      <div class="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mt-6">
        <UButton type="submit" color="primary" :loading="isLoading" class="w-full sm:w-auto">
          Register
        </UButton>
        <NuxtLink to="/login" class="text-sm text-gray-600 hover:underline text-center sm:text-right">
          Already have an account? Login
        </NuxtLink>
      </div>
    </UForm>
  </div>
</template>

<script setup>
const formState = ref({
  email: '',
  password: '',
  confirmPassword: ''
});

const isLoading = ref(false);
const errorMessage = ref('');
const router = useRouter();

const handleRegister = () => {
  isLoading.value = true;
  errorMessage.value = '';

  if (!formState.value.email || !formState.value.password) {
    errorMessage.value = 'All fields are required';
    isLoading.value = false;
    return;
  }
  
  if (formState.value.password.length < 8) {
    errorMessage.value = 'Password must be at least 8 characters';
    isLoading.value = false;
    return;
  }
  
  if (formState.value.password !== formState.value.confirmPassword) {
    errorMessage.value = 'Passwords do not match';
    isLoading.value = false;
    return;
  }
  
  setTimeout(() => {
    localStorage.setItem('registeredEmail', formState.value.email);
    router.push('/login');
    isLoading.value = false;
  }, 1000);
}
</script>
