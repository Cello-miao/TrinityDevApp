import React from 'react';
import { render, waitFor, fireEvent } from '@testing-library/react-native';
import OrderHistoryScreen from '../../screens/OrderHistoryScreen';
import { orderAPI } from '../../lib/api';

jest.mock('../../lib/api', () => ({
  orderAPI: {
    getMyOrders: jest.fn(),
  },
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
    TouchableOpacity: createComponent('TouchableOpacity'),
    Image: createComponent('Image'),
    SafeAreaView: createComponent('SafeAreaView'),
  };
});

jest.mock('@expo/vector-icons', () => ({
  Ionicons: () => null,
}));

jest.mock('@react-navigation/native', () => ({
  useFocusEffect: (callback: any) => callback(),
}));

describe('OrderHistoryScreen', () => {
  const navigation = {
    goBack: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (orderAPI.getMyOrders as jest.Mock).mockResolvedValue([]);
  });

  test('renders empty state when there are no orders', async () => {
    const { getByText } = render(React.createElement(OrderHistoryScreen, { navigation }));

    await waitFor(() => {
      expect(getByText('No orders yet')).toBeTruthy();
    });
  });

  test('renders sorted orders and expands details', async () => {
    const orders = [
      {
        id: 'abc111',
        userId: 'u1',
        items: [
          {
            quantity: 1,
            product: {
              id: '1',
              name: 'Apple',
              price: 10,
              image: 'a.png',
              category: 'Fruit',
              description: 'Fresh',
              stock: 2,
            },
          },
        ],
        total: 10,
        status: 'completed',
        createdAt: '2026-01-01T10:00:00.000Z',
        deliveryAddress: 'X',
        paymentMethod: 'paypal',
      },
      {
        id: 'zzz999',
        userId: 'u1',
        items: [
          {
            quantity: 2,
            product: {
              id: '2',
              name: 'Milk',
              price: 5,
              image: 'm.png',
              category: 'Dairy',
              description: 'Fresh',
              stock: 2,
            },
          },
        ],
        total: 20,
        status: 'delivered',
        createdAt: '2026-02-01T10:00:00.000Z',
        deliveryAddress: 'Y',
        paymentMethod: 'paypal',
      },
    ];

    (orderAPI.getMyOrders as jest.Mock).mockResolvedValue(orders);

    const { getByText, queryByText } = render(
      React.createElement(OrderHistoryScreen, { navigation }),
    );

    await waitFor(() => {
      expect(getByText('Order Statistics')).toBeTruthy();
      expect(getByText('2')).toBeTruthy();
      expect(getByText('€30')).toBeTruthy();
    });

    expect(queryByText('Order Items')).toBeNull();

    fireEvent.press(getByText('ORD-zzz'));

    await waitFor(() => {
      expect(getByText('Order Items')).toBeTruthy();
      expect(getByText('Milk')).toBeTruthy();
      expect(getByText('× 2')).toBeTruthy();
    });
  });
});
