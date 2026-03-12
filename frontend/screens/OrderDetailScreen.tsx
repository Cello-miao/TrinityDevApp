import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Order } from '../types';
import { useTheme } from '../lib/theme';

interface OrderDetailScreenProps {
  navigation: any;
  route: {
    params: {
      order: Order;
    };
  };
}

export default function OrderDetailScreen({ navigation, route }: OrderDetailScreenProps) {
  const theme = useTheme();
  const styles = createStyles(theme);
  const { order } = route.params;
  const SHIPPING_FEE = 5.0;
  
  const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = Math.max(order.total - SHIPPING_FEE, 0);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1e293b" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order Details</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Order Info Card */}
        <View style={styles.orderInfoCard}>
          <View style={styles.orderHeader}>
            <Text style={styles.orderId}>#{order.id.replace(/^ORD-/, '').slice(-8)}</Text>
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>Completed</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Ionicons name="calendar-outline" size={18} color="#64748b" />
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoLabel}>Order Date</Text>
                <Text style={styles.infoValue}>
                  {new Date(order.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </Text>
              </View>
            </View>

            <View style={styles.infoItem}>
              <Ionicons name="card-outline" size={18} color="#64748b" />
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoLabel}>Payment Method</Text>
                <Text style={styles.infoValue}>{order.paymentMethod}</Text>
              </View>
            </View>
          </View>

          {order.deliveryAddress && (
            <View style={styles.addressContainer}>
              <Ionicons name="location-outline" size={18} color="#64748b" />
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoLabel}>Delivery Address</Text>
                <Text style={styles.infoValue}>{order.deliveryAddress}</Text>
              </View>
            </View>
          )}

          {order.customerName && (
            <View style={styles.addressContainer}>
              <Ionicons name="person-outline" size={18} color="#64748b" />
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoLabel}>Customer Name</Text>
                <Text style={styles.infoValue}>{order.customerName}</Text>
              </View>
            </View>
          )}
        </View>

        {/* Order Items */}
        <View style={styles.orderItemsCard}>
          <Text style={styles.sectionTitle}>Order Items ({itemCount})</Text>
          
          {order.items.map((item, index) => (
            <View key={index} style={styles.orderItem}>
              <Image
                source={{ uri: item.product.image }}
                style={styles.itemImage}
              />
              <View style={styles.itemInfo}>
                <Text style={styles.itemName}>{item.product.name}</Text>
                <Text style={styles.itemCategory}>Farm Direct</Text>
                <Text style={styles.itemQuantity}>Qty: {item.quantity}</Text>
              </View>
              <View style={styles.itemPriceContainer}>
                <Text style={styles.itemUnitPrice}>€{item.product.price.toFixed(2)}</Text>
                <Text style={styles.itemTotalPrice}>
                  €{(item.product.price * item.quantity).toFixed(2)}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Order Summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.sectionTitle}>Order Summary</Text>
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal ({itemCount} items)</Text>
            <Text style={styles.summaryValue}>€{subtotal.toFixed(2)}</Text>
          </View>
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Shipping Fee</Text>
            <Text style={styles.summaryValue}>€{SHIPPING_FEE.toFixed(2)}</Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Tax (5.5%)</Text>
            <Text style={styles.summaryIncludedValue}>Included</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.summaryRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>€{order.total.toFixed(2)}</Text>
          </View>
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: theme.card,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.text,
  },
  scrollView: {
    flex: 1,
  },
  orderInfoCard: {
    backgroundColor: theme.card,
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.border,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  orderId: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.text,
  },
  statusBadge: {
    backgroundColor: '#d1fae5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.success,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 16,
  },
  infoItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 12,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: theme.textSecondary,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.text,
  },
  orderItemsCard: {
    backgroundColor: theme.card,
    marginHorizontal: 16,
    marginTop: 12,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.border,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.text,
    marginBottom: 16,
  },
  orderItem: {
    flexDirection: 'row',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  itemImage: {
    width: 70,
    height: 70,
    borderRadius: 8,
    backgroundColor: theme.inputBackground,
  },
  itemInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  itemName: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.text,
    marginBottom: 4,
  },
  itemCategory: {
    fontSize: 12,
    color: theme.textSecondary,
    marginBottom: 4,
  },
  itemQuantity: {
    fontSize: 12,
    color: theme.textSecondary,
  },
  itemPriceContainer: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  itemUnitPrice: {
    fontSize: 12,
    color: theme.textSecondary,
    marginBottom: 4,
  },
  itemTotalPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.text,
  },
  summaryCard: {
    backgroundColor: theme.card,
    marginHorizontal: 16,
    marginTop: 12,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.border,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 14,
    color: theme.textSecondary,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.text,
  },
  summaryIncludedValue: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.success,
  },
  divider: {
    height: 1,
    backgroundColor: theme.border,
    marginVertical: 12,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.text,
  },
  totalValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#4f46e5',
  },
});
