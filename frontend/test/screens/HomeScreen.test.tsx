import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

const getAllProducts = jest.fn();
const getRecommendations = jest.fn();
const getCart = jest.fn();
const getItem = jest.fn();

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
    ScrollView: createComponent('ScrollView'),
    TouchableOpacity: createComponent('TouchableOpacity'),
    Image: createComponent('Image'),
    ImageBackground: createComponent('ImageBackground'),
    Modal: createComponent('Modal'),
    StyleSheet: {
      create: (styles: any) => styles,
      flatten: (style: any) => {
        if (Array.isArray(style)) {
          return style.filter(Boolean).reduce((acc, item) => ({ ...acc, ...item }), {});
        }
        return style || {};
      },
    },
    Platform: { OS: 'ios' },
    Dimensions: { get: () => ({ width: 390, height: 844 }) },
  };
});

jest.mock('@expo/vector-icons', () => ({
  Ionicons: () => null,
}));

jest.mock('@react-navigation/native', () => ({
  useFocusEffect: () => undefined,
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: (...args: any[]) => getItem(...args),
}));

jest.mock('../../lib/api', () => ({
  productAPI: {
    getAllProducts: (...args: any[]) => getAllProducts(...args),
    getRecommendations: (...args: any[]) => getRecommendations(...args),
  },
  cartAPI: {
    getCart: (...args: any[]) => getCart(...args),
  },
}));

jest.mock('../../lib/theme', () => ({
  useTheme: () => ({
    text: '#0f172a',
    textSecondary: '#64748b',
    textTertiary: '#94a3b8',
    background: '#f8fafc',
    card: '#ffffff',
    border: '#e2e8f0',
    primary: '#0ea5e9',
    primaryDark: '#0284c7',
  }),
}));

const HomeScreen = require('../../screens/HomeScreen').default;

describe('HomeScreen quick action', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getAllProducts.mockResolvedValue([]);
    getRecommendations.mockResolvedValue([]);
    getCart.mockResolvedValue([]);
    getItem.mockResolvedValue(null);
  });

  test('renders scan quick action and navigates to scanner', async () => {
    const navigation = { navigate: jest.fn() };
    const { getByLabelText, getByText } = render(<HomeScreen navigation={navigation} />);

    const scanButton = getByLabelText('Scan');
    expect(getByText('Scan')).toBeTruthy();

    fireEvent.press(scanButton);

    expect(navigation.navigate).toHaveBeenCalledWith('Scanner');
  });
});
