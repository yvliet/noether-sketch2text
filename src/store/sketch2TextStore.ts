/**
 * Reactive Zustand store managing Sketch2Text runtime state.
 * Automatically synchronizes user configuration with local storage.
 */

import { create } from 'zustand';

export interface Sketch2TextSettings {
  debounceMs: number;
  engineMode: 'online' | 'offline';
  language: string;
  casingMode: 'auto' | 'upper' | 'lower';
}

export const DEFAULT_SKETCH2TEXT_SETTINGS: Readonly<Sketch2TextSettings> = Object.freeze({
  debounceMs: 650,
  engineMode: 'online',
  language: 'en',
  casingMode: 'auto',
});

const STORAGE_KEY = 'flint_sketch2text_settings';

function loadPersistedSettings(): Sketch2TextSettings {
  if (typeof window === 'undefined' || !window.localStorage) {
    return { ...DEFAULT_SKETCH2TEXT_SETTINGS };
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_SKETCH2TEXT_SETTINGS };
    const parsed = JSON.parse(raw);
    return {
      debounceMs: typeof parsed.debounceMs === 'number'
        ? Math.max(200, Math.min(1500, parsed.debounceMs))
        : DEFAULT_SKETCH2TEXT_SETTINGS.debounceMs,
      engineMode: parsed.engineMode === 'offline' ? 'offline' : 'online',
      language: typeof parsed.language === 'string' && parsed.language.trim()
        ? parsed.language.trim()
        : DEFAULT_SKETCH2TEXT_SETTINGS.language,
      casingMode: ['auto', 'upper', 'lower'].includes(parsed.casingMode)
        ? parsed.casingMode
        : DEFAULT_SKETCH2TEXT_SETTINGS.casingMode,
    };
  } catch {
    return { ...DEFAULT_SKETCH2TEXT_SETTINGS };
  }
}

function persistSettings(patch: Partial<Sketch2TextSettings>): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    const current = loadPersistedSettings();
    const updated = { ...current, ...patch };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // Gracefully ignore local storage quota or privacy restrictions
  }
}

export interface Sketch2TextState extends Sketch2TextSettings {
  isPenToTextActive: boolean;
  isSketchEnabled: boolean;
  lastRecognized: string | null;

  togglePenToText: () => void;
  setPenToTextActive: (active: boolean) => void;
  setSketchEnabled: (enabled: boolean) => void;
  setDebounceMs: (ms: number) => void;
  setEngineMode: (mode: 'online' | 'offline') => void;
  setLanguage: (lang: string) => void;
  setLastRecognized: (char: string | null) => void;
  setCasingMode: (mode: 'auto' | 'upper' | 'lower') => void;
  restoreDefaults: () => void;
}

const initialSettings = loadPersistedSettings();

export const useSketch2TextStore = create<Sketch2TextState>((set) => ({
  isPenToTextActive: false,
  isSketchEnabled: true,
  debounceMs: initialSettings.debounceMs,
  engineMode: initialSettings.engineMode,
  language: initialSettings.language,
  lastRecognized: null,
  casingMode: initialSettings.casingMode,

  togglePenToText: () => {
    set((s) => ({ isPenToTextActive: !s.isPenToTextActive }));
  },

  setPenToTextActive: (active) => {
    set({ isPenToTextActive: active });
  },

  setSketchEnabled: (enabled) => {
    set((s) => ({
      isSketchEnabled: enabled,
      // Only force-disable pen-to-text when sketch goes offline; preserve user's active state otherwise
      isPenToTextActive: enabled ? s.isPenToTextActive : false,
    }));
  },

  setDebounceMs: (ms) => {
    const clamped = Math.max(200, Math.min(1500, ms));
    persistSettings({ debounceMs: clamped });
    set({ debounceMs: clamped });
  },

  setEngineMode: (mode) => {
    persistSettings({ engineMode: mode });
    set({ engineMode: mode });
  },

  setLanguage: (lang) => {
    persistSettings({ language: lang });
    set({ language: lang });
  },

  setLastRecognized: (char) => {
    set({ lastRecognized: char });
  },

  setCasingMode: (mode) => {
    persistSettings({ casingMode: mode });
    set({ casingMode: mode });
  },

  restoreDefaults: () => {
    persistSettings(DEFAULT_SKETCH2TEXT_SETTINGS);
    set({
      debounceMs: DEFAULT_SKETCH2TEXT_SETTINGS.debounceMs,
      engineMode: DEFAULT_SKETCH2TEXT_SETTINGS.engineMode,
      language: DEFAULT_SKETCH2TEXT_SETTINGS.language,
      casingMode: DEFAULT_SKETCH2TEXT_SETTINGS.casingMode,
    });
  },
}));

