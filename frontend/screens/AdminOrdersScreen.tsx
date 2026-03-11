import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { Order } from '../types';
import { orderAPI } from '../lib/api';
import { useTheme } from '../lib/theme';

interface OrderWithCustomer extends Order {
  customerName: string;
  customerEmail: string;
}

export default function AdminOrdersScreen({ navigation }: any) {
  const theme = useTheme();
  const styles = createStyles(theme);
  const [searchQuery, setSearchQuery] = useState('');
  const [orders, setOrders] = useState<OrderWithCustomer[]>([]);
  const [loading, setLoading] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadOrders();
    }, [])
  );

  const loadOrders = async () => {
    try {
      setLoading(true);
      const allOrders = await orderAPI.getAllOrders();
      setOrders(allOrders as OrderWithCustomer[]);
    } catch (error) {
      console.error('Failed to load orders:', error);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredOrders = orders.filter(order =>
    order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    order.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    order.customerEmail.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
      case 'delivered':
        return '#d1fae5';
      case 'pending':
        return '#fef3c7';
      case 'processing':
        return '#dbeafe';
      default:
        return '#f1f5f9';
    }
  };

  const getStatusTextColor = (status: string) => {
    switch (status) {
      case 'completed':
      case 'delivered':
        return '#059669';
      case 'pending':
        return '#d97706';
      case 'processing':
        return '#2563eb';
      default:
        return '#64748b';
    }
  };

  const getStatusText = (status: string) => {
    if (status === 'delivered') return 'completed';
    return status;
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#64748b" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#94a3b8"
          />
        </View>

        {/* Orders List */}
        {loading && (
          <View style={styles.centerState}>
            <ActivityIndicator color={theme.primary} />
            <Text style={styles.stateText}>Loading orders...</Text>
          </View>
        )}

        {!loading && filteredOrders.length === 0 && (
          <View style={styles.centerState}>
            <Ionicons name="receipt-outline" size={36} color={theme.textTertiary} />
            <Text style={styles.stateText}>No matching orders</Text>
          </View>
        )}

        {filteredOrders.map((order, index) => {
          const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0);
          
          return (
            <TouchableOpacity
              key={`order-${index}-${order.id}`}
              style={styles.orderCard}
              activeOpacity={0.85}
              onPress={() => navigation.navigate('OrderDetail', { order })}
            >
              <View style={styles.orderHeader}>
                <View style={styles.orderHeaderLeft}>
                  <Text style={styles.orderId}>#{order.id}</Text>
                  <View style={[
                    styles.statusBadge,
                    { backgroundColor: getStatusColor(order.status) }
                  ]}>
                    <Text style={[
                      styles.statusText,
                      { color: getStatusTextColor(order.status) }
                    ]}>
                      {getStatusText(order.status)}
                    </Text>
                  </View>
                </View>
                <View style={styles.orderHeaderRight}>
                  <Text style={styles.orderTotal}>€{order.total.toFixed(2)}</Text>
                  <Text style={styles.itemCount}>{itemCount} items</Text>
                </View>
              </View>

              <Text style={styles.orderDate}>
                {new Date(order.createdAt).toISOString().split('T')[0]}
              </Text>

              <View style={styles.customerInfo}>
                <Text style={styles.customerName}>{order.customerName}</Text>
                <Text style={styles.customerEmail}>{order.customerEmail}</Text>
              </View>

              <View style={styles.viewDetailsRow}>
                <Text style={styles.viewDetailsText}>View details</Text>
                <Ionicons name="chevron-forward" size={16} color={theme.primary} />
              </View>
            </TouchableOpacity>
          );
        })}

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
  scrollView: {
    flex: 1,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.border,
    marginHorizontal: 16,
    marginTop: 24,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: theme.text,
  },
  orderCard: {
    backgroundColor: theme.card,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.border,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  orderHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  orderId: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.text,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  orderHeaderRight: {
    alignItems: 'flex-end',
  },
  orderTotal: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.text,
    marginBottom: 4,
  },
  itemCount: {
    fontSize: 13,
    color: theme.textSecondary,
  },
  orderDate: {
    fontSize: 13,
    color: theme.textSecondary,
    marginBottom: 12,
  },
  customerInfo: {
    marginTop: 4,
  },
  viewDetailsRow: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: theme.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 2,
  },
  viewDetailsText: {
    color: theme.primary,
    fontSize: 13,
    fontWeight: '600',
  },
  customerName: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.text,
    marginBottom: 4,
  },
  customerEmail: {
    fontSize: 13,
    color: theme.textSecondary,
  },
  centerState: {
    marginTop: 24,
    marginHorizontal: 16,
    backgroundColor: theme.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.border,
    paddingVertical: 24,
    alignItems: 'center',
    gap: 8,
  },
  stateText: {
    color: theme.textSecondary,
    fontSize: 14,
  },
});
