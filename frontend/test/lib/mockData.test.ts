import { mockProducts, mockOrders, mockCustomers } from '../../lib/mockData';

describe('mockData integrity', () => {
  test('mock products have required fields', () => {
    expect(mockProducts.length).toBeGreaterThan(0);
    for (const product of mockProducts) {
      expect(product.id).toBeTruthy();
      expect(product.name).toBeTruthy();
      expect(product.price).toBeGreaterThan(0);
      expect(product.stock).toBeGreaterThanOrEqual(0);
      expect(product.barcode).toBeTruthy();
    }
  });

  test('mock orders reference existing products', () => {
    const productIds = new Set(mockProducts.map((p) => p.id));
    for (const order of mockOrders) {
      expect(order.items.length).toBeGreaterThan(0);
      for (const item of order.items) {
        expect(productIds.has(item.product.id)).toBe(true);
        expect(item.quantity).toBeGreaterThan(0);
      }
    }
  });

  test('mock customers have core metrics', () => {
    expect(mockCustomers.length).toBeGreaterThan(0);
    for (const customer of mockCustomers) {
      expect(customer.email).toContain('@');
      expect(customer.totalOrders).toBeGreaterThanOrEqual(0);
      expect(customer.totalSpent).toBeGreaterThanOrEqual(0);
    }
  });
});
