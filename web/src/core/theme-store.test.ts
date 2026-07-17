import { describe, it, expect, beforeEach } from 'vitest';
import { useThemeStore } from './theme-store';

const memory = new Map<string, string>();
const localStorageMock = {
  getItem: (key: string) => memory.get(key) ?? null,
  setItem: (key: string, value: string) => {
    memory.set(key, value);
  },
  removeItem: (key: string) => {
    memory.delete(key);
  },
  clear: () => {
    memory.clear();
  },
  key: (index: number) => Array.from(memory.keys())[index] ?? null,
  get length() {
    return memory.size;
  },
};

(globalThis as unknown as { localStorage: typeof localStorageMock }).localStorage = localStorageMock;

describe('useThemeStore', () => {
  beforeEach(() => {
    localStorage.clear();
    useThemeStore.setState({ theme: 'dark' });
  });

  it('começa com tema "dark" por padrão', () => {
    expect(useThemeStore.getState().theme).toBe('dark');
  });

  it('alterna de dark para light quando toggle é chamado', () => {
    useThemeStore.getState().toggle();
    expect(useThemeStore.getState().theme).toBe('light');
  });

  it('alterna de light para dark quando toggle é chamado novamente', () => {
    useThemeStore.setState({ theme: 'light' });
    useThemeStore.getState().toggle();
    expect(useThemeStore.getState().theme).toBe('dark');
  });

  it('persiste a escolha no localStorage', () => {
    useThemeStore.getState().toggle();
    expect(localStorage.getItem('lifeos-theme')).toBe('light');
  });

  it('hidrata o tema inicial a partir do localStorage', () => {
    localStorage.setItem('lifeos-theme', 'light');
    const store = useThemeStore.getState();
    store.hydrate();
    expect(useThemeStore.getState().theme).toBe('light');
  });

  it('ignora valores inválidos do localStorage', () => {
    localStorage.setItem('lifeos-theme', 'banana');
    const store = useThemeStore.getState();
    store.hydrate();
    expect(useThemeStore.getState().theme).toBe('dark');
  });
});
