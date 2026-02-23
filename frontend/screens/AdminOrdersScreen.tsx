import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Order } from '../types';
import { logout } from '../lib/auth';

interface OrderWithCustomer extends Order {
  customerName: string;
  customerEmail: string;
}

export default function AdminOrdersScreen({ navigation }: any) {
  const [searchQuery, setSearchQuery] = useState('');
  const [orders, setOrders] = useState<OrderWithCustomer[]>([]);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      const ordersStr = await AsyncStorage.getItem('orders');
      if (ordersStr) {
        const allOrders: Order[] = JSON.parse(ordersStr);
        
        // Add mock customer data
        const ordersWithCustomers: OrderWithCustomer[] = allOrders.map((order, index) => {
          const customers = [
            { name: 'John Doe', email: 'john.doe@email.com' },
            { name: 'Jane Smith', email: 'jane.smith@email.com' },
            { name: 'Mike Wilson', email: 'mike.wilson@email.com' },
            { name: 'Sarah Jones', email: 'sarah.jones@email.com' },
          ];
          const customer = customers[index % customers.length];
          
          return {
            ...order,
            customerName: customer.name,
            customerEmail: customer.email,
          };
        });
        
        setOrders(ordersWithCustomers);
      }
    } catch (error) {
      console.error('Failed to load orders:', error);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigation.replace('Login');
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
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>Admin Dashboard</Text>
          <Text style={styles.headerSubtitle}>Manage your store</Text>
        </View>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color="#fff" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#94a3b8" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#94a3b8"
          />
        </View>

        {/* Orders List */}
        {filteredOrders.map((order) => {
          const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0);
          
          return (
            <View key={order.id} style={styles.orderCard}>
              <View style={styles.orderHeader}>
                <View style={styles.orderHeaderLeft}>
                  <Text style={styles.orderId}>#ORD-{order.id.slice(0, 3)}</Text>
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
            </View>
          );
        })}

        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => navigation.navigate('AdminDashboard')}
        >
          <View style={styles.navIconContainer}>
            <Ionicons name="cube-outline" size={24} color="#94a3b8" />
            <View style={styles.navBadge}>
              <Text style={styles.navBadgeText}>30</Text>
            </View>
          </View>
          <Text style={[styles.navText, styles.navTextInactive]}>Products</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <View style={styles.navIconContainer}>
            <Ionicons name="receipt" size={24} color="#475569" />
            <View style={styles.navBadge}>
              <Text style={styles.navBadgeText}>{orders.length}</Text>
            </View>
          </View>
          <Text style={styles.navText}>Orders</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => navigation.navigate('AdminCustomers')}
        >
          <View style={styles.navIconContainer}>
            <Ionicons name="people-outline" size={24} color="#94a3b8" />
            <View style={styles.navBadge}>
              <Text style={styles.navBadgeText}>5</Text>
            </View>
          </View>
          <Text style={[styles.navText, styles.navTextInactive]}>Customers</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#475569',
    paddingHorizontal: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#cbd5e1',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#5a6c7d',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  logoutText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3e4f5e',
    marginHorizontal: 16,
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#fff',
  },
  orderCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#f1f5f9',
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
    color: '#1e293b',
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
    color: '#1e293b',
    marginBottom: 4,
  },
  itemCount: {
    fontSize: 13,
    color: '#64748b',
  },
  orderDate: {
    fontSize: 13,
    color: '#64748b',
    marginBottom: 12,
  },
  customerInfo: {
    marginTop: 4,
  },
  customerName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  customerEmail: {
    fontSize: 13,
    color: '#64748b',
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
  },
  navIconContainer: {
    position: 'relative',
    marginBottom: 4,
  },
  navBadge: {
    position: 'absolute',
    top: -6,
    right: -10,
    backgroundColor: '#475569',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: 'center',
  },
  navBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  navText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '500',
  },
  navTextInactive: {
    color: '#94a3b8',
  },
});
