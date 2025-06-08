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
      setTimeout(() => {
        if (email === 'test@test.pl' && password === 'Test1234') {
          localStorage.setItem('isAuthenticated', 'true');
          localStorage.setItem('user', JSON.stringify({ email }));

          window.dispatchEvent(new CustomEvent(authStateChangeEvent));

          resolve(true);
        } else {
          resolve(false);
        }
      }, 1000);
    });
  };

  const logout = () => {
    if (process.server) return;
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('user');

    window.dispatchEvent(new CustomEvent(authStateChangeEvent));

    navigateTo('/');
  };

  return {
    isAuthenticated,
    getUser,
    login,
    logout
  };
};
