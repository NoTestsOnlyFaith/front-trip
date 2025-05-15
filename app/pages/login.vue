<template>
  <div class="max-w-md mx-auto my-8 p-6 border border-gray-200 rounded-lg shadow-sm dark:border-gray-800">
    <h1 class="text-2xl font-bold mb-6">Login</h1>

    <UForm :state="formState" class="space-y-4 flex flex-col" @submit="handleLogin">
      <UFormGroup label="Email" name="email">
        <UInput class="w-100" v-model="formState.email" type="email" placeholder="your@email.com" />
      </UFormGroup>

      <UFormGroup label="Password" name="password">
        <UInput class="w-100" v-model="formState.password" type="password" placeholder="Your password" />
      </UFormGroup>

      <div v-if="errorMessage" class="text-red-500 text-sm mt-2">
        {{ errorMessage }}
      </div>

      <div class="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mt-6">
        <UButton type="submit" color="primary" :loading="isLoading" class="w-full sm:w-auto">
          Login
        </UButton>
        <NuxtLink to="/register" class="text-sm text-gray-600 hover:underline text-center sm:text-right">
          Don't have an account? Register
        </NuxtLink>
      </div>
    </UForm>
  </div>
</template>

<script setup>
import { useAuthService } from '../services/authService';

const formState = ref({
  email: '',
  password: ''
});

const isLoading = ref(false);
const errorMessage = ref('');
const router = useRouter();
const { login } = useAuthService();

const handleLogin = async () => {
  isLoading.value = true;
  errorMessage.value = '';

  try {
    // Use the login function from authService
    const success = await login(formState.value.email, formState.value.password);

    if (success) {
      // Redirect to home page on successful login
      router.push('/');
    } else {
      errorMessage.value = 'Invalid email or password';
    }
  } catch (error) {
    console.error('Login error:', error);
    errorMessage.value = 'An error occurred during login. Please try again.';
  } finally {
    isLoading.value = false;
  }
}
</script>
