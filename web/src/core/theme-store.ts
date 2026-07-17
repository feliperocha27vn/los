import { create } from 'zustand';

export type Theme = 'dark' | 'light';

interface ThemeState {
  theme: Theme;
  toggle: () => void;
  setTheme: (theme: Theme) => void;
  hydrate: () => void;
}

const STORAGE_KEY = 'lifeos-theme';

function getStorage(): Storage | null {
  try {
    if (typeof globalThis !== 'undefined' && globalThis.localStorage) {
      return globalThis.localStorage;
    }
  } catch {
    return null;
  }
  return null;
}

function readStoredTheme(): Theme {
  const storage = getStorage();
  if (!storage) return 'dark';
  const saved = storage.getItem(STORAGE_KEY);
  return saved === 'light' || saved === 'dark' ? saved : 'dark';
}

function writeStoredTheme(theme: Theme): void {
  const storage = getStorage();
  if (!storage) return;
  storage.setItem(STORAGE_KEY, theme);
}

export const useThemeStore = create<ThemeState>((set) => ({
  theme: readStoredTheme(),
  toggle: () =>
    set((state) => {
      const next: Theme = state.theme === 'dark' ? 'light' : 'dark';
      writeStoredTheme(next);
      return { theme: next };
    }),
  setTheme: (theme) =>
    set(() => {
      writeStoredTheme(theme);
      return { theme };
    }),
  hydrate: () => set({ theme: readStoredTheme() }),
}));
