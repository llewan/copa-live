import { create } from 'zustand';

export interface UserPreferences {
  followedTeams: string[];
  notifications: boolean;
  language: string;
}

interface PreferenceState {
  preferences: UserPreferences;
  isLoading: boolean;
  
  // Actions
  setPreferences: (prefs: Partial<UserPreferences>) => void;
  loadPreferences: (userId: string) => void;
  savePreferences: (userId: string) => Promise<void>;
  reset: () => void;
}

const DEFAULT_PREFERENCES: UserPreferences = {
  followedTeams: [],
  notifications: true,
  language: 'en',
};

export const usePreferenceStore = create<PreferenceState>((set, get) => ({
  preferences: DEFAULT_PREFERENCES,
  isLoading: false,

  setPreferences: (prefs) => {
    set((state) => ({
      preferences: { ...state.preferences, ...prefs },
    }));
  },

  loadPreferences: (userId) => {
    try {
      const stored = localStorage.getItem(`user_preferences_${userId}`);
      if (stored) {
        set({ preferences: JSON.parse(stored) });
      } else {
        set({ preferences: DEFAULT_PREFERENCES });
      }
    } catch (e) {
      console.error("Failed to load preferences", e);
      set({ preferences: DEFAULT_PREFERENCES });
    }
  },

  savePreferences: async (userId) => {
    set({ isLoading: true });
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 800));
    
    try {
      const { preferences } = get();
      localStorage.setItem(`user_preferences_${userId}`, JSON.stringify(preferences));
      set({ isLoading: false });
    } catch (e) {
      console.error("Failed to save preferences", e);
      set({ isLoading: false });
    }
  },

  reset: () => {
    set({ preferences: DEFAULT_PREFERENCES });
  }
}));
