export interface User {
  email: string;
}

// Create a custom event for auth state changes
export const authStateChangeEvent = 'auth-state-changed';

export const useAuthService = () => {
  const isAuthenticated = () => {
    if (process.server) return false;
    return localStorage.getItem('isAuthenticated') === 'true';
  };

  const getUser = (): User | null => {
    if (process.server) return null;
    const userJson = localStorage.getItem('user');
    return userJson ? JSON.parse(userJson) : null;
  };

  const login = (email: string, password: string): Promise<boolean> => {
    if (process.server) return Promise.resolve(false);

    return new Promise((resolve) => {
      // Mock authentication process
      setTimeout(() => {
        if (email === 'test@test.pl' && password === 'Test1234') {
          // Mock successful login
          localStorage.setItem('isAuthenticated', 'true');
          localStorage.setItem('user', JSON.stringify({ email }));

          // Dispatch event to notify about auth state change
          window.dispatchEvent(new CustomEvent(authStateChangeEvent));

          resolve(true);
        } else {
          resolve(false);
        }
      }, 1000); // Simulate API delay
    });
  };

  const logout = () => {
    if (process.server) return;
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('user');

    // Dispatch event to notify about auth state change
    window.dispatchEvent(new CustomEvent(authStateChangeEvent));

    // Redirect to home page
    navigateTo('/');
  };

  return {
    isAuthenticated,
    getUser,
    login,
    logout
  };
};
