import axios from 'axios';

export interface User {
  email: string;
}

// Create a custom event for auth state changes
export const authStateChangeEvent = 'auth-state-changed';

export const useAuthService = () => {
  const isAuthenticated = () => {
    if (process.server) return false;
    return !!getToken();
  };

  const getUser = (): User | null => {
    if (process.server) return null;
    const userJson = localStorage.getItem('user');
    return userJson ? JSON.parse(userJson) : null;
  };

  const getToken = (): string | null => {
    if (process.server) return null;
    return localStorage.getItem('token');
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    if (process.server) return false;
    try {
      const res = await axios.post('/api/Auth/login', { email, password });
      if (res.data && res.data.token) {
        localStorage.setItem('isAuthenticated', 'true');
        localStorage.setItem('user', JSON.stringify({ email }));
        localStorage.setItem('token', res.data.token);
        window.dispatchEvent(new CustomEvent(authStateChangeEvent));
        return true;
      }
      return false;
    } catch (e) {
      return false;
    }
  };

  const logout = () => {
    if (process.server) return;
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    window.dispatchEvent(new CustomEvent(authStateChangeEvent));
    navigateTo('/');
  };

  return {
    isAuthenticated,
    getUser,
    getToken,
    login,
    logout
  };
};
