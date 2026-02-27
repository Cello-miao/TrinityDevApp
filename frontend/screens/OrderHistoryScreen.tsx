import React, { useState, useEffect } from 'react';
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
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Order } from '../types';
import { useFocusEffect } from '@react-navigation/native';

export default function OrderHistoryScreen({ navigation }: any) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());

  const loadOrders = async () => {
    try {
      const ordersStr = await AsyncStorage.getItem('orders');
      if (ordersStr) {
        const allOrders: Order[] = JSON.parse(ordersStr);
        // Sort by date in descending order
        const sortedOrders = allOrders.sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        setOrders(sortedOrders);
      }
    } catch (error) {
      console.error('Failed to load orders:', error);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      loadOrders();
    }, [])
  );

  const toggleOrderExpansion = (orderId: string) => {
    setExpandedOrders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(orderId)) {
        newSet.delete(orderId);
      } else {
        newSet.add(orderId);
      }
      return newSet;
    });
  };

  const totalOrders = orders.length;
  const completedOrders = orders.filter(o => o.status === 'delivered').length;
  const totalSpent = orders.reduce((sum, order) => sum + order.total, 0);

  if (orders.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#1e293b" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Order History</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.emptyContainer}>
          <Ionicons name="receipt-outline" size={80} color="#cbd5e1" />
          <Text style={styles.emptyText}>No orders yet</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1e293b" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order History</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Order Statistics */}
        <View style={styles.statsCard}>
          <Text style={styles.statsTitle}>Order Statistics</Text>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Total Orders</Text>
              <Text style={styles.statValue}>{totalOrders}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Completed</Text>
              <Text style={styles.statValue}>{completedOrders}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Total Spent</Text>
              <Text style={styles.statValue}>€{totalSpent.toFixed(0)}</Text>
            </View>
          </View>
        </View>

        {/* Orders List */}
        {orders.map((order) => {
          const isExpanded = expandedOrders.has(order.id);
          const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0);
          
          return (
            <View key={order.id} style={styles.orderCard}>
              <TouchableOpacity 
                style={styles.orderHeader}
                onPress={() => toggleOrderExpansion(order.id)}
              >
                <View style={styles.orderHeaderLeft}>
                  <Text style={styles.orderId}>ORD-{order.id.slice(0, 3)}</Text>
                  <View style={styles.completedBadge}>
                    <Text style={styles.completedText}>Completed</Text>
                  </View>
                </View>
                <Ionicons 
                  name={isExpanded ? "chevron-up" : "chevron-down"} 
                  size={24} 
                  color="#94a3b8" 
                />
              </TouchableOpacity>

              <View style={styles.orderMeta}>
                <View style={styles.metaItem}>
                  <Ionicons name="calendar-outline" size={16} color="#64748b" />
                  <Text style={styles.metaText}>
                    {new Date(order.createdAt).toISOString().split('T')[0]}
                  </Text>
                </View>
                <View style={styles.metaItem}>
                  <Ionicons name="card-outline" size={16} color="#64748b" />
                  <Text style={styles.metaText}>{order.paymentMethod}</Text>
                </View>
              </View>

              <View style={styles.orderSummary}>
                <Text style={styles.itemCount}>{itemCount} items total</Text>
                <Text style={styles.orderTotal}>€{order.total.toFixed(2)}</Text>
              </View>

              {isExpanded && (
                <>
                  <View style={styles.divider} />
                  <Text style={styles.orderItemsTitle}>Order Items</Text>
                  
                  {order.items.map((item, index) => (
                    <View key={index} style={styles.orderItem}>
                      <Image
                        source={{ uri: item.product.image }}
                        style={styles.itemImage}
                      />
                      <View style={styles.itemInfo}>
                        <Text style={styles.itemName}>{item.product.name}</Text>
                        <Text style={styles.itemVendor}>Farm Direct</Text>
                        <Text style={styles.itemQuantity}>× {item.quantity}</Text>
                      </View>
                      <Text style={styles.itemPrice}>
                        €{(item.product.price * item.quantity).toFixed(2)}
                      </Text>
                    </View>
                  ))}

                  <View style={styles.orderActions}>
                    <TouchableOpacity style={styles.viewDetailsButton}>
                      <Text style={styles.viewDetailsText}>View Details</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.buyAgainButton}>
                      <Text style={styles.buyAgainText}>Buy Again</Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </View>
          );
        })}

        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  emptyText: {
    fontSize: 18,
    color: '#64748b',
    marginTop: 16,
  },
  scrollView: {
    flex: 1,
  },
  statsCard: {
    backgroundColor: '#475569',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
    padding: 20,
    borderRadius: 16,
  },
  statsTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 20,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    flex: 1,
  },
  statLabel: {
    fontSize: 13,
    color: '#cbd5e1',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  orderCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 8,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  orderHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  orderId: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
  },
  completedBadge: {
    backgroundColor: '#d1fae5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  completedText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#059669',
  },
  orderMeta: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 13,
    color: '#64748b',
  },
  orderSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemCount: {
    fontSize: 14,
    color: '#64748b',
  },
  orderTotal: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4f46e5',
  },
  divider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginVertical: 16,
  },
  orderItemsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 12,
  },
  orderItem: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'center',
  },
  itemImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#f8fafc',
  },
  itemInfo: {
    flex: 1,
    marginLeft: 12,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 2,
  },
  itemVendor: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 4,
  },
  itemQuantity: {
    fontSize: 12,
    color: '#64748b',
  },
  itemPrice: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1e293b',
  },
  orderActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  viewDetailsButton: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  viewDetailsText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1e293b',
  },
  buyAgainButton: {
    flex: 1,
    backgroundColor: '#2c3e50',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  buyAgainText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
});
