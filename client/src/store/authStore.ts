import { create } from 'zustand';
import { User, login, register, getMe } from '../services/api';

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, username?: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: localStorage.getItem('token'),
  isLoading: false,
  error: null,

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const res = await login(email, password);
      if (res.success && res.data) {
        localStorage.setItem('token', res.data.token);
        set({ user: res.data.user, token: res.data.token, isLoading: false });
      } else {
        set({ error: res.error || 'Login failed', isLoading: false });
      }
    } catch {
      set({ error: 'Network error', isLoading: false });
    }
  },

  register: async (email, password, username) => {
    set({ isLoading: true, error: null });
    try {
      const res = await register(email, password, username);
      if (res.success && res.data) {
        localStorage.setItem('token', res.data.token);
        set({ user: res.data.user, token: res.data.token, isLoading: false });
      } else {
        set({ error: res.error || 'Registration failed', isLoading: false });
      }
    } catch {
      set({ error: 'Network error', isLoading: false });
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    set({ user: null, token: null });
  },

  checkAuth: async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    set({ isLoading: true });
    try {
      const res = await getMe(token);
      if (res.success && res.data) { // Note: api/me returns just user in data, not {user, token}
         // Wait, let me check my backend implementation of /me
         // It returns data: result.rows[0] which is the user object.
         // So res.data is the user.
        set({ user: res.data as unknown as User, isLoading: false });
      } else {
        localStorage.removeItem('token');
        set({ token: null, user: null, isLoading: false });
      }
    } catch {
      localStorage.removeItem('token');
      set({ token: null, user: null, isLoading: false });
    }
  }
}));
