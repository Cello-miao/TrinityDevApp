import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemeMode = 'light' | 'dark';

export interface Theme {
  background: string;
  surface: string;
  card: string;
  text: string;
  textSecondary: string;
  textTertiary: string;
  primary: string;
  primaryDark: string;
  accent: string;
  border: string;
  error: string;
  success: string;
  warning: string;
  info: string;
  overlay: string;
  searchBackground: string;
  inputBackground: string;
  headerBackground: string;
  badgeBackground: string;
  priceText: string;
  buttonText: string;
  shadow: string;
}

export const lightTheme: Theme = {
  background: '#f3f8fb',
  surface: '#fbfdff',
  card: '#fbfdff',
  text: '#24314a',
  textSecondary: '#6f8098',
  textTertiary: '#a1afc1',
  primary: '#8199b2',
  primaryDark: '#6f86a1',
  accent: '#88b8c9',
  border: '#e0e9f0',
  error: '#df7f7f',
  success: '#6fa691',
  warning: '#d4a963',
  info: '#81a3d4',
  overlay: 'rgba(0, 0, 0, 0.5)',
  searchBackground: '#f2f7fb',
  inputBackground: '#f8fbfd',
  headerBackground: '#fbfdff',
  badgeBackground: '#df7f7f',
  priceText: '#24314a',
  buttonText: '#ffffff',
  shadow: '#000000',
};

export const darkTheme: Theme = {
  background: '#0f172a',
  surface: '#1e293b',
  card: '#1e293b',
  text: '#f1f5f9',
  textSecondary: '#cbd5e1',
  textTertiary: '#94a3b8',
  primary: '#64748b',
  primaryDark: '#475569',
  accent: '#10b981',
  border: '#334155',
  error: '#ef4444',
  success: '#10b981',
  warning: '#f59e0b',
  info: '#3b82f6',
  overlay: 'rgba(0, 0, 0, 0.7)',
  searchBackground: '#334155',
  inputBackground: '#334155',
  headerBackground: '#1e293b',
  badgeBackground: '#ef4444',
  priceText: '#f1f5f9',
  buttonText: '#ffffff',
  shadow: '#000000',
};

interface ThemeContextType {
  theme: Theme;
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  isDark: boolean;
  fontScale: number;
  setFontScale: (scale: number) => void;
  highContrast: boolean;
  setHighContrast: (enabled: boolean) => void;
  reduceMotion: boolean;
  setReduceMotion: (enabled: boolean) => void;
  getFontSize: (baseSize: number) => number;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const FONT_SCALE_KEY = 'fontScale';
const LEGACY_FONT_MODE_KEY = 'fontSizeMode';
const FONT_SCALE_MIN = 0.8;
const FONT_SCALE_MAX = 1.4;

const clampFontScale = (scale: number): number => {
  return Math.min(FONT_SCALE_MAX, Math.max(FONT_SCALE_MIN, scale));
};

const parseFontScale = (value: string | null): number | null => {
  if (!value) {
    return null;
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return null;
  }

  return clampFontScale(parsed);
};

const mapLegacyFontModeToScale = (mode: string | null): number | null => {
  if (mode === 'normal') {
    return 1;
  }
  if (mode === 'large') {
    return 1.15;
  }
  if (mode === 'extraLarge') {
    return 1.3;
  }
  return null;
};

const applyHighContrastTheme = (baseTheme: Theme, isDark: boolean): Theme => {
  if (!isDark) {
    return {
      ...baseTheme,
      background: '#ffffff',
      surface: '#ffffff',
      card: '#ffffff',
      text: '#000000',
      textSecondary: '#1f2937',
      textTertiary: '#374151',
      border: '#111827',
      primary: '#111827',
      primaryDark: '#000000',
      inputBackground: '#ffffff',
      searchBackground: '#ffffff',
    };
  }

  return {
    ...baseTheme,
    background: '#000000',
    surface: '#000000',
    card: '#000000',
    text: '#ffffff',
    textSecondary: '#f3f4f6',
    textTertiary: '#d1d5db',
    border: '#ffffff',
    primary: '#ffffff',
    primaryDark: '#e5e7eb',
    buttonText: '#000000',
    inputBackground: '#111827',
    searchBackground: '#111827',
  };
};

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [themeMode, setThemeModeState] = useState<ThemeMode>('light');
  const [fontScale, setFontScaleState] = useState(1);
  const [highContrast, setHighContrastState] = useState(false);
  const [reduceMotion, setReduceMotionState] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load saved theme preference
  useEffect(() => {
    loadThemePreference();
  }, []);

  const loadThemePreference = async () => {
    try {
      const [savedThemeMode, savedFontScale, savedLegacyFontMode, savedHighContrast, savedReduceMotion] = await Promise.all([
        AsyncStorage.getItem('themeMode'),
        AsyncStorage.getItem(FONT_SCALE_KEY),
        AsyncStorage.getItem(LEGACY_FONT_MODE_KEY),
        AsyncStorage.getItem('highContrast'),
        AsyncStorage.getItem('reduceMotion'),
      ]);

      if (savedThemeMode && (savedThemeMode === 'light' || savedThemeMode === 'dark')) {
        setThemeModeState(savedThemeMode as ThemeMode);
      }

      const parsedScale = parseFontScale(savedFontScale);
      if (parsedScale !== null) {
        setFontScaleState(parsedScale);
      } else {
        const legacyScale = mapLegacyFontModeToScale(savedLegacyFontMode);
        if (legacyScale !== null) {
          setFontScaleState(legacyScale);
        }
      }

      if (savedHighContrast !== null) {
        setHighContrastState(savedHighContrast === 'true');
      }

      if (savedReduceMotion !== null) {
        setReduceMotionState(savedReduceMotion === 'true');
      }
    } catch (error) {
      console.error('Failed to load theme preference:', error);
    } finally {
      setIsLoaded(true);
    }
  };

  const setThemeMode = async (mode: ThemeMode) => {
    try {
      await AsyncStorage.setItem('themeMode', mode);
      setThemeModeState(mode);
    } catch (error) {
      console.error('Failed to save theme preference:', error);
    }
  };

  const setFontScale = async (scale: number) => {
    const nextScale = clampFontScale(Number(scale.toFixed(2)));

    try {
      await AsyncStorage.setItem(FONT_SCALE_KEY, String(nextScale));
      setFontScaleState(nextScale);
    } catch (error) {
      console.error('Failed to save font scale:', error);
    }
  };

  const setHighContrast = async (enabled: boolean) => {
    try {
      await AsyncStorage.setItem('highContrast', String(enabled));
      setHighContrastState(enabled);
    } catch (error) {
      console.error('Failed to save high contrast setting:', error);
    }
  };

  const setReduceMotion = async (enabled: boolean) => {
    try {
      await AsyncStorage.setItem('reduceMotion', String(enabled));
      setReduceMotionState(enabled);
    } catch (error) {
      console.error('Failed to save reduce motion setting:', error);
    }
  };

  const getFontSize = (baseSize: number): number => {
    return Math.round(baseSize * fontScale);
  };

  // Determine active theme
  const isDark = themeMode === 'dark';
  const baseTheme = isDark ? darkTheme : lightTheme;
  const theme = highContrast ? applyHighContrastTheme(baseTheme, isDark) : baseTheme;

  // Don't render until theme is loaded
  if (!isLoaded) {
    return null;
  }

  return (
    <ThemeContext.Provider
      value={{
        theme,
        themeMode,
        setThemeMode,
        isDark,
        fontScale,
        setFontScale,
        highContrast,
        setHighContrast,
        reduceMotion,
        setReduceMotion,
        getFontSize,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): Theme => {
  const context = useContext(ThemeContext);
  if (!context) {
    // Fallback for components not wrapped in ThemeProvider
    return lightTheme;
  }
  return context.theme;
};

export const useThemeMode = (): { themeMode: ThemeMode; setThemeMode: (mode: ThemeMode) => void; isDark: boolean } => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useThemeMode must be used within ThemeProvider');
  }
  return {
    themeMode: context.themeMode,
    setThemeMode: context.setThemeMode,
    isDark: context.isDark,
  };
};

export const useAccessibility = (): {
  fontScale: number;
  setFontScale: (scale: number) => void;
  highContrast: boolean;
  setHighContrast: (enabled: boolean) => void;
  reduceMotion: boolean;
  setReduceMotion: (enabled: boolean) => void;
  getFontSize: (baseSize: number) => number;
} => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useAccessibility must be used within ThemeProvider');
  }

  return {
    fontScale: context.fontScale,
    setFontScale: context.setFontScale,
    highContrast: context.highContrast,
    setHighContrast: context.setHighContrast,
    reduceMotion: context.reduceMotion,
    setReduceMotion: context.setReduceMotion,
    getFontSize: context.getFontSize,
  };
};
