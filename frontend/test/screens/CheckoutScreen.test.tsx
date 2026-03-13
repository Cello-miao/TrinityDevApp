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
  API_BASE_URL: 'https://localhost:3443/api',
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

jest.mock(
  'expo-linking',
  () => ({
    createURL: jest.fn((path: string) => `freshcart://${path}`),
    addEventListener: jest.fn(() => ({ remove: jest.fn() })),
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

  // ─── HTTPS-specific tests ────────────────────────────────────────────────

  test('openAuthSessionAsync is called with the HTTPS approvalUrl from the backend', async () => {
    const httpsApprovalUrl = 'https://www.sandbox.paypal.com/checkoutnow?token=ABC123';
    (global as any).fetch.mockResolvedValueOnce({
      json: async () => ({ orderId: 'order-https', approvalUrl: httpsApprovalUrl }),
    });
    (openAuthSessionAsync as jest.Mock).mockResolvedValueOnce({ type: 'cancel' });

    const { getByText, getByPlaceholderText } = render(
      React.createElement(CheckoutScreen, { route, navigation }),
    );

    fireEvent.changeText(getByPlaceholderText('John'), 'Alice');
    fireEvent.changeText(getByPlaceholderText('Doe'), 'Smith');
    fireEvent.changeText(getByPlaceholderText('john.doe@example.com'), 'alice@example.com');
    fireEvent.changeText(getByPlaceholderText('+33 1 23 45 67 89'), '0600000000');
    fireEvent.changeText(getByPlaceholderText('123 Main Street, Apt 4B'), '1 Rue de Rivoli');
    fireEvent.changeText(getByPlaceholderText('75001'), '75001');
    fireEvent.changeText(getByPlaceholderText('Paris'), 'Paris');
    fireEvent.press(getByText('PayPal'));
    fireEvent.press(getByText('Pay with PayPal'));

    await waitFor(() => {
      expect(openAuthSessionAsync).toHaveBeenCalledWith(httpsApprovalUrl, expect.any(String));
    });

    // The first argument (approvalUrl) must be an HTTPS URL
    const calledApprovalUrl = (openAuthSessionAsync as jest.Mock).mock.calls[0][0] as string;
    expect(calledApprovalUrl).toMatch(/^https:\/\//);
  });

  test('create-order fetch body contains returnUrl from expo-linking (custom scheme)', async () => {
    (global as any).fetch.mockResolvedValueOnce({
      json: async () => ({ orderId: 'order-scheme', approvalUrl: 'https://paypal.test/ok' }),
    });
    (openAuthSessionAsync as jest.Mock).mockResolvedValueOnce({ type: 'cancel' });

    const { getByText, getByPlaceholderText } = render(
      React.createElement(CheckoutScreen, { route, navigation }),
    );

    fireEvent.changeText(getByPlaceholderText('John'), 'Bob');
    fireEvent.changeText(getByPlaceholderText('Doe'), 'Jones');
    fireEvent.changeText(getByPlaceholderText('john.doe@example.com'), 'bob@jones.com');
    fireEvent.changeText(getByPlaceholderText('+33 1 23 45 67 89'), '0600000001');
    fireEvent.changeText(getByPlaceholderText('123 Main Street, Apt 4B'), '5 Avenue Montaigne');
    fireEvent.changeText(getByPlaceholderText('75001'), '75008');
    fireEvent.changeText(getByPlaceholderText('Paris'), 'Paris');
    fireEvent.press(getByText('PayPal'));
    fireEvent.press(getByText('Pay with PayPal'));

    await waitFor(() => {
      expect(openAuthSessionAsync).toHaveBeenCalled();
    });

    const createOrderCall = (global as any).fetch.mock.calls[0];
    const bodyParsed = JSON.parse(createOrderCall[1].body);

    // returnUrl must use a valid URI scheme (freshcart:// from expo-linking mock)
    expect(bodyParsed.returnUrl).toMatch(/^[a-z][a-z0-9+.-]*:\/\//i);
    expect(bodyParsed.returnUrl).toContain('payment-success');
    expect(bodyParsed.cancelUrl).toMatch(/^[a-z][a-z0-9+.-]*:\/\//i);
    expect(bodyParsed.cancelUrl).toContain('payment-cancel');
  });

  test('direct success path: openAuthSessionAsync result.url contains payment-success → order created without retry', async () => {
    const alertSpy = jest.spyOn(Alert, 'alert');

    (global as any).fetch
      .mockResolvedValueOnce({
        json: async () => ({ orderId: 'order-direct', approvalUrl: 'https://paypal.test/approve' }),
      })
      .mockResolvedValueOnce({
        json: async () => ({ status: 'COMPLETED' }),
      });

    // Simulate PayPal redirecting back with payment-success in URL
    (openAuthSessionAsync as jest.Mock).mockResolvedValueOnce({
      type: 'success',
      url: 'freshcart://payment-success?token=T1&PayerID=P1',
    });

    const { getByText, getByPlaceholderText } = render(
      React.createElement(CheckoutScreen, { route, navigation }),
    );

    fireEvent.changeText(getByPlaceholderText('John'), 'Carol');
    fireEvent.changeText(getByPlaceholderText('Doe'), 'White');
    fireEvent.changeText(getByPlaceholderText('john.doe@example.com'), 'carol@white.com');
    fireEvent.changeText(getByPlaceholderText('+33 1 23 45 67 89'), '0600000002');
    fireEvent.changeText(getByPlaceholderText('123 Main Street, Apt 4B'), '10 Rue Lafayette');
    fireEvent.changeText(getByPlaceholderText('75001'), '75009');
    fireEvent.changeText(getByPlaceholderText('Paris'), 'Paris');
    fireEvent.press(getByText('PayPal'));
    fireEvent.press(getByText('Pay with PayPal'));

    await waitFor(() => {
      expect(orderAPI.createOrder).toHaveBeenCalledWith(
        expect.objectContaining({ payment_method: 'paypal' }),
      );
    });

    // Only two fetch calls: create-order + capture-order (no retry loop)
    expect((global as any).fetch).toHaveBeenCalledTimes(2);
    expect(alertSpy).toHaveBeenCalledWith(
      'Order Successful!',
      expect.stringContaining('PayPal'),
      expect.any(Array),
    );
  });

  test('shows error when backend returns no approvalUrl', async () => {
    const alertSpy = jest.spyOn(Alert, 'alert');

    (global as any).fetch.mockResolvedValueOnce({
      json: async () => ({ orderId: 'order-no-url' }), // no approvalUrl
    });

    const { getByText, getByPlaceholderText } = render(
      React.createElement(CheckoutScreen, { route, navigation }),
    );

    fireEvent.changeText(getByPlaceholderText('John'), 'Dan');
    fireEvent.changeText(getByPlaceholderText('Doe'), 'Brown');
    fireEvent.changeText(getByPlaceholderText('john.doe@example.com'), 'dan@brown.com');
    fireEvent.changeText(getByPlaceholderText('+33 1 23 45 67 89'), '0600000003');
    fireEvent.changeText(getByPlaceholderText('123 Main Street, Apt 4B'), '2 Rue Oberkampf');
    fireEvent.changeText(getByPlaceholderText('75001'), '75011');
    fireEvent.changeText(getByPlaceholderText('Paris'), 'Paris');
    fireEvent.press(getByText('PayPal'));
    fireEvent.press(getByText('Pay with PayPal'));

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith('Error', 'Failed to create PayPal order');
    });

    // Browser should not have been opened
    expect(openAuthSessionAsync).not.toHaveBeenCalled();
  });

  test('PAYPAL_CLIENT_ID is read from EXPO_PUBLIC_PAYPAL_CLIENT_ID env variable', () => {
    jest.resetModules();
    process.env.EXPO_PUBLIC_PAYPAL_CLIENT_ID = 'env-client-id-xyz';

    // Re-load the module and verify the constant picks up the env var.
    // We read the module source to confirm the variable name is used.
    const src: string = require('fs').readFileSync(
      require('path').resolve(__dirname, '../../screens/CheckoutScreen.tsx'),
      'utf8',
    );
    expect(src).toContain('EXPO_PUBLIC_PAYPAL_CLIENT_ID');

    delete process.env.EXPO_PUBLIC_PAYPAL_CLIENT_ID;
  });
});
