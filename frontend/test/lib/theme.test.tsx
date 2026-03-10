import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

jest.mock('react-native', () => {
  const React = require('react');
  const createComponent = (name: string) => {
    const Component = ({ children, ...props }: any) => React.createElement(name, props, children);
    Component.displayName = name;
    return Component;
  };

  return {
    View: createComponent('View'),
    Text: createComponent('Text'),
    TouchableOpacity: createComponent('TouchableOpacity'),
    StyleSheet: {
      create: (styles: any) => styles,
      flatten: (style: any) => {
        if (Array.isArray(style)) {
          return style.filter(Boolean).reduce((acc, item) => ({ ...acc, ...item }), {});
        }
        return style || {};
      },
    },
  };
});

const {
  ThemeProvider,
  useAccessibility,
  useThemeMode,
} = require('../../lib/theme');

function Probe() {
  const { fontScale, highContrast, reduceMotion, getFontSize, setFontScale, setHighContrast, setReduceMotion } = useAccessibility();
  const { themeMode, setThemeMode } = useThemeMode();

  return (
    <>
      <Text testID="state">{`${themeMode}|${fontScale}|${highContrast}|${reduceMotion}|${getFontSize(10)}`}</Text>
      <TouchableOpacity testID="set-dark" onPress={() => setThemeMode('dark')} />
      <TouchableOpacity testID="set-font" onPress={() => setFontScale(1.25)} />
      <TouchableOpacity testID="set-contrast" onPress={() => setHighContrast(true)} />
      <TouchableOpacity testID="set-reduce" onPress={() => setReduceMotion(true)} />
    </>
  );
}

const { Text, TouchableOpacity } = require('react-native');

describe('theme accessibility settings', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
  });

  test('uses default accessibility values when storage is empty', async () => {
    const { getByTestId } = render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>,
    );

    await waitFor(() => {
      expect(getByTestId('state').props.children).toBe('light|1|false|false|10');
    });
  });

  test('loads persisted settings from storage', async () => {
    (AsyncStorage.getItem as jest.Mock).mockImplementation(async (key: string) => {
      if (key === 'themeMode') return 'dark';
      if (key === 'fontScale') return '1.3';
      if (key === 'highContrast') return 'true';
      if (key === 'reduceMotion') return 'true';
      return null;
    });

    const { getByTestId } = render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>,
    );

    await waitFor(() => {
      expect(getByTestId('state').props.children).toBe('dark|1.3|true|true|13');
    });
  });

  test('persists updates for all new settings', async () => {
    const { getByTestId } = render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>,
    );

    await waitFor(() => {
      expect(getByTestId('state').props.children).toBe('light|1|false|false|10');
    });

    fireEvent.press(getByTestId('set-dark'));
    fireEvent.press(getByTestId('set-font'));
    fireEvent.press(getByTestId('set-contrast'));
    fireEvent.press(getByTestId('set-reduce'));

    await waitFor(() => {
      expect(AsyncStorage.setItem).toHaveBeenCalledWith('themeMode', 'dark');
      expect(AsyncStorage.setItem).toHaveBeenCalledWith('fontScale', '1.25');
      expect(AsyncStorage.setItem).toHaveBeenCalledWith('highContrast', 'true');
      expect(AsyncStorage.setItem).toHaveBeenCalledWith('reduceMotion', 'true');
    });
  });
});
