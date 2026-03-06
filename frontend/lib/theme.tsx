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
  background: '#f5f5f5',
  surface: '#ffffff',
  card: '#ffffff',
  text: '#1e293b',
  textSecondary: '#64748b',
  textTertiary: '#94a3b8',
  primary: '#475569',
  primaryDark: '#334155',
  accent: '#10b981',
  border: '#e2e8f0',
  error: '#ef4444',
  success: '#10b981',
  warning: '#f59e0b',
  info: '#3b82f6',
  overlay: 'rgba(0, 0, 0, 0.5)',
  searchBackground: '#f1f5f9',
  inputBackground: '#f8fafc',
  headerBackground: '#ffffff',
  badgeBackground: '#ef4444',
  priceText: '#1e293b',
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
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [themeMode, setThemeModeState] = useState<ThemeMode>('light');
  const [isLoaded, setIsLoaded] = useState(false);

  // Load saved theme preference
  useEffect(() => {
    loadThemePreference();
  }, []);

  const loadThemePreference = async () => {
    try {
      const saved = await AsyncStorage.getItem('themeMode');
      if (saved && (saved === 'light' || saved === 'dark')) {
        setThemeModeState(saved as ThemeMode);
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

  // Determine active theme
  const isDark = themeMode === 'dark';
  const theme = isDark ? darkTheme : lightTheme;

  // Don't render until theme is loaded
  if (!isLoaded) {
    return null;
  }

  return (
    <ThemeContext.Provider value={{ theme, themeMode, setThemeMode, isDark }}>
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
