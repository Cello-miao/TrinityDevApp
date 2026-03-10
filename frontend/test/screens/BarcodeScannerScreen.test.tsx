import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';

const mockUseAccessibility = jest.fn(() => ({ reduceMotion: false }));
const requestCameraPermissionsAsync = jest.fn();
const lookupByBarcode = jest.fn();
const getProductById = jest.fn();
const alertMock = jest.fn();
const getItem = jest.fn();

const loopStart = jest.fn();
const loopStop = jest.fn();
const animatedLoop = jest.fn(() => ({
  start: loopStart,
  stop: loopStop,
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
    Alert: {
      alert: (...args: any[]) => alertMock(...args),
    },
    Animated: {
      Value: function Value(this: any, value: number) {
        this.value = value;
        this.interpolate = jest.fn(() => 0);
      },
      View: createComponent('AnimatedView'),
      loop: () => animatedLoop(),
      sequence: jest.fn((arr: any[]) => arr),
      timing: jest.fn(() => ({})),
    },
  };
});

jest.mock('expo-camera', () => {
  const React = require('react');
  const CameraView = ({ onBarcodeScanned, children }: any) =>
    React.createElement(
      'TouchableOpacity',
      {
        testID: 'camera-view',
        onPress: () => onBarcodeScanned && onBarcodeScanned({ data: '12345678' }),
      },
      children,
    );

  return {
    CameraView,
    Camera: {
      requestCameraPermissionsAsync: (...args: any[]) => requestCameraPermissionsAsync(...args),
    },
  };
});

jest.mock('../../lib/theme', () => ({
  useTheme: () => ({ textSecondary: '#aaa', textTertiary: '#bbb' }),
  useAccessibility: () => mockUseAccessibility(),
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: (...args: any[]) => getItem(...args),
}));

jest.mock('../../lib/api', () => ({
  scannerAPI: {
    lookupByBarcode: (...args: any[]) => lookupByBarcode(...args),
  },
  productAPI: {
    getProductById: (...args: any[]) => getProductById(...args),
  },
}));

jest.mock('@expo/vector-icons', () => ({
  Ionicons: () => null,
}));

const BarcodeScannerScreen = require('../../screens/BarcodeScannerScreen').default;

describe('BarcodeScannerScreen accessibility behaviors', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    requestCameraPermissionsAsync.mockResolvedValue({ status: 'granted' });
    lookupByBarcode.mockResolvedValue({ id: '1', name: 'Milk' });
    getProductById.mockResolvedValue({ id: '1', name: 'Milk', description: 'Fresh milk' });
    mockUseAccessibility.mockReturnValue({ reduceMotion: false });
    getItem.mockResolvedValue(null);
  });

  test('stops animated scan line loop when reduce motion is enabled', async () => {
    mockUseAccessibility.mockReturnValue({ reduceMotion: true });

    render(<BarcodeScannerScreen navigation={{ goBack: jest.fn(), replace: jest.fn() }} route={{ params: {} }} />);

    await waitFor(() => {
      expect(requestCameraPermissionsAsync).toHaveBeenCalled();
    });

    expect(animatedLoop).not.toHaveBeenCalled();
    expect(loopStart).not.toHaveBeenCalled();
  });

  test('returns scanned barcode to admin callback and skips lookup API', async () => {
    const onBarcodeScanned = jest.fn();
    const navigation = { goBack: jest.fn(), replace: jest.fn() };

    const { getByTestId } = render(
      <BarcodeScannerScreen
        navigation={navigation}
        route={{ params: { mode: 'adminProduct', onBarcodeScanned } }}
      />,
    );

    await waitFor(() => {
      expect(requestCameraPermissionsAsync).toHaveBeenCalled();
    });

    fireEvent.press(getByTestId('camera-view'));

    await waitFor(() => {
      expect(onBarcodeScanned).toHaveBeenCalledWith('12345678');
      expect(navigation.goBack).toHaveBeenCalled();
    });

    expect(lookupByBarcode).not.toHaveBeenCalled();
  });

  test('user scan calls lookup API and directly navigates to product detail by default', async () => {
    const navigation = { goBack: jest.fn(), replace: jest.fn() };
    const product = { id: '1', name: 'Milk', barcode: '12345678' };
    const fullProduct = { id: '1', name: 'Milk', barcode: '12345678', description: 'Fresh milk' };
    lookupByBarcode.mockResolvedValue(product);
    getProductById.mockResolvedValue(fullProduct);

    const { getByTestId } = render(
      <BarcodeScannerScreen navigation={navigation} route={{ params: {} }} />,
    );

    await waitFor(() => {
      expect(requestCameraPermissionsAsync).toHaveBeenCalled();
    });

    fireEvent.press(getByTestId('camera-view'));

    await waitFor(() => {
      expect(lookupByBarcode).toHaveBeenCalledWith('12345678');
      expect(getProductById).toHaveBeenCalledWith('1');
      expect(navigation.replace).toHaveBeenCalledWith('ProductDetail', { product: fullProduct });
    });
    expect(alertMock).not.toHaveBeenCalledWith('Product Found', expect.anything(), expect.anything());
  });
});
