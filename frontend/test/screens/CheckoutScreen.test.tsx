import React from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';

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
    StyleSheet: {
      create: (styles: any) => styles,
      flatten: (style: any) => {
        if (Array.isArray(style)) {
          return style.filter(Boolean).reduce((acc, item) => ({ ...acc, ...item }), {});
        }
        return style || {};
      },
    },
    TextInput: createComponent('TextInput'),
    TouchableOpacity: createComponent('TouchableOpacity'),
    SafeAreaView: createComponent('SafeAreaView'),
    ActivityIndicator: createComponent('ActivityIndicator'),
    Platform: { OS: 'ios' },
    Alert: { alert: jest.fn() },
    Linking: {
      canOpenURL: jest.fn(),
      openURL: jest.fn(),
    },
  };
});

const { Alert, Linking } = require('react-native');

jest.mock('../../lib/api', () => ({
  API_BASE_URL: 'http://localhost:3000/api',
  orderAPI: {
    createOrder: jest.fn(),
  },
  userAPI: {
    getProfile: jest.fn(),
    updateProfile: jest.fn(),
  },
}));

jest.mock(
  'expo-web-browser',
  () => ({
    openAuthSessionAsync: jest.fn(),
  }),
  { virtual: true },
);

const { openAuthSessionAsync } = jest.requireMock('expo-web-browser');
const { orderAPI } = require('../../lib/api');
const CheckoutScreen = require('../../screens/CheckoutScreen').default;

jest.mock('@expo/vector-icons', () => ({
  Ionicons: () => null,
}));

describe('CheckoutScreen', () => {
  const navigation = {
    navigate: jest.fn(),
    goBack: jest.fn(),
  };

  const route = {
    params: {
      cartItems: [
        {
          quantity: 2,
          product: {
            id: '1',
            name: 'Milk',
            price: 4.5,
            image: 'milk.png',
            category: 'Dairy',
            description: 'Fresh milk',
            stock: 9,
          },
        },
      ],
      total: 9,
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    (global as any).fetch = jest.fn();
    (orderAPI.createOrder as jest.Mock).mockResolvedValue({
      order: { id: 22, order_number: 'ORD-22' },
    });
    (openAuthSessionAsync as jest.Mock).mockResolvedValue({ type: 'success' });
    jest.spyOn(AsyncStorage, 'setItem').mockResolvedValue(undefined);
    jest.spyOn(AsyncStorage, 'getItem').mockResolvedValue('token-123');
    jest.spyOn(Linking, 'canOpenURL').mockResolvedValue(true);
    jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined as any);
    jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('shows validation alert when required fields are missing', async () => {
    const alertSpy = jest.spyOn(Alert, 'alert');
    const { getByText } = render(React.createElement(CheckoutScreen, { route, navigation }));

    fireEvent.press(getByText('Place Order'));

    expect(alertSpy).toHaveBeenCalledWith('Validation Error', 'Please enter your first name');
    expect(orderAPI.createOrder).not.toHaveBeenCalled();
  });

  test('creates order successfully through PayPal flow', async () => {
    const alertSpy = jest.spyOn(Alert, 'alert');

    (global as any).fetch
      .mockResolvedValueOnce({
        json: async () => ({ orderId: 'paypal-order-1', approvalUrl: 'https://paypal.test/approve' }),
      })
      .mockResolvedValueOnce({
        json: async () => ({ status: 'COMPLETED' }),
      });

    const { getByText, getByPlaceholderText } = render(
      React.createElement(CheckoutScreen, { route, navigation }),
    );

    fireEvent.changeText(getByPlaceholderText('John'), 'John');
    fireEvent.changeText(getByPlaceholderText('Doe'), 'Doe');
    fireEvent.changeText(getByPlaceholderText('john.doe@example.com'), 'john@doe.com');
    fireEvent.changeText(getByPlaceholderText('+33 1 23 45 67 89'), '123456');
    fireEvent.changeText(getByPlaceholderText('123 Main Street, Apt 4B'), 'Street 1');
    fireEvent.changeText(getByPlaceholderText('75001'), '75001');
    fireEvent.changeText(getByPlaceholderText('Paris'), 'Paris');

    fireEvent.press(getByText('PayPal'));
    fireEvent.press(getByText('Pay with PayPal'));

    await waitFor(() => {
      expect(orderAPI.createOrder).toHaveBeenCalledWith(
        expect.objectContaining({
          payment_method: 'paypal',
          items: [{ product_id: 1, quantity: 2 }],
        }),
      );
    });

    expect(AsyncStorage.setItem).toHaveBeenCalledWith('cart', '[]');

    const successAlertCall = (Alert.alert as jest.Mock).mock.calls.find(
      (call: any[]) => call[0] === 'Order Successful!',
    );
    successAlertCall?.[2]?.[0]?.onPress?.();

    expect(navigation.navigate).toHaveBeenCalledWith('Main', { screen: 'Orders' });
    expect(alertSpy).toHaveBeenCalled();
  });

  test('shows error alert when backend order creation fails', async () => {
    (orderAPI.createOrder as jest.Mock).mockRejectedValueOnce(new Error('create failed'));

    (global as any).fetch
      .mockResolvedValueOnce({
        json: async () => ({ orderId: 'paypal-order-2', approvalUrl: 'https://paypal.test/approve' }),
      })
      .mockResolvedValueOnce({
        json: async () => ({ status: 'COMPLETED' }),
      });

    jest.spyOn(Alert, 'alert');

    const { getByText, getByPlaceholderText } = render(
      React.createElement(CheckoutScreen, { route, navigation }),
    );

    fireEvent.changeText(getByPlaceholderText('John'), 'John');
    fireEvent.changeText(getByPlaceholderText('Doe'), 'Doe');
    fireEvent.changeText(getByPlaceholderText('john.doe@example.com'), 'john@doe.com');
    fireEvent.changeText(getByPlaceholderText('+33 1 23 45 67 89'), '123456');
    fireEvent.changeText(getByPlaceholderText('123 Main Street, Apt 4B'), 'Street 1');
    fireEvent.changeText(getByPlaceholderText('75001'), '75001');
    fireEvent.changeText(getByPlaceholderText('Paris'), 'Paris');

    fireEvent.press(getByText('PayPal'));
    fireEvent.press(getByText('Pay with PayPal'));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Error', 'Failed to place order, please try again');
    });
  });
});
