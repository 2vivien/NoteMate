import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { THEME_LIGHT, THEME_DARK } from '@/lib/constants';

type Theme = typeof THEME_LIGHT | typeof THEME_DARK;

interface ThemeStoreState {
  theme: Theme;
  systemPreference: Theme;
}

interface ThemeStoreActions {
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  setSystemPreference: (preference: Theme) => void;
  initTheme: () => void;
}

export const useThemeStore = create<ThemeStoreState & ThemeStoreActions>()(
  devtools(
    immer((set, get) => ({
      theme: THEME_DARK,
      systemPreference: THEME_DARK,

      setTheme: (theme) => {
        set((state) => {
          state.theme = theme;
        });
        // Apply to document
        document.documentElement.classList.remove(THEME_LIGHT, THEME_DARK);
        document.documentElement.classList.add(theme);
        localStorage.setItem('theme', theme);
      },

      toggleTheme: () => {
        const newTheme = get().theme === THEME_LIGHT ? THEME_DARK : THEME_LIGHT;
        get().setTheme(newTheme);
      },

      setSystemPreference: (preference) => {
        set((state) => {
          state.systemPreference = preference;
        });
      },

      initTheme: () => {
        // Check localStorage first
        const savedTheme = localStorage.getItem('theme') as Theme | null;
        
        // Check system preference
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const systemTheme = prefersDark ? THEME_DARK : THEME_LIGHT;
        
        set((state) => {
          state.systemPreference = systemTheme;
        });

        // Use saved theme or default to dark
        const themeToUse = savedTheme || THEME_DARK;
        get().setTheme(themeToUse);

        // Listen for system theme changes
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
          const newSystemTheme = e.matches ? THEME_DARK : THEME_LIGHT;
          set((state) => {
            state.systemPreference = newSystemTheme;
          });
        });
      },
    })),
    { name: 'ThemeStore' }
  )
);
