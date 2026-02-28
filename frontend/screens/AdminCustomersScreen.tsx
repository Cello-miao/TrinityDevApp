import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { userAPI, orderAPI } from '../lib/api';
import { User, Order } from '../types';

interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
}

interface CustomerWithOrders extends Customer {
  orders: Order[];
  totalOrders: number;
  totalSpent: number;
}

export default function AdminCustomersScreen({ navigation }: any) {
  const [searchQuery, setSearchQuery] = useState('');
  const [customers, setCustomers] = useState<CustomerWithOrders[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedCustomer, setExpandedCustomer] = useState<string | null>(null);

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const users = await userAPI.getAllUsers();
      
      // Load all orders from API
      const allOrders = await orderAPI.getAllOrders();
      
      // Calculate customer stats
      const customersWithOrders: CustomerWithOrders[] = users.map(user => {
        const userOrders = allOrders.filter(order => 
          order.userId === user.id || 
          order.customerEmail === user.email
        );
        
        const totalSpent = userOrders.reduce((sum, order) => sum + order.total, 0);
        
        return {
          ...user,
          orders: userOrders,
          totalOrders: userOrders.length,
          totalSpent
        };
      });
      
      setCustomers(customersWithOrders);
    } catch (error) {
      console.error('Failed to load customers:', error);
      Alert.alert('Error', 'Failed to load customers');
    } finally {
      setLoading(false);
    }
  };

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

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

        {/* Customers List */}
        {filteredCustomers.map((customer) => (
          <View key={customer.id} style={styles.customerCard}>
            <TouchableOpacity 
              onPress={() => setExpandedCustomer(
                expandedCustomer === customer.id ? null : customer.id
              )}
              activeOpacity={0.7}
            >
              <View style={styles.customerHeader}>
                <Text style={styles.customerName}>{customer.name}</Text>
                <View style={styles.customerHeaderRight}>
                  <Text style={styles.customerRole}>{customer.role}</Text>
                </View>
              </View>
              <Text style={styles.customerEmail}>{customer.email}</Text>
              {customer.phone && (
                <Text style={styles.customerPhone}>Phone: {customer.phone}</Text>
              )}
              
              {/* Purchase Stats */}
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{customer.totalOrders}</Text>
                  <Text style={styles.statLabel}>Orders</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>€{customer.totalSpent.toFixed(2)}</Text>
                  <Text style={styles.statLabel}>Total Spent</Text>
                </View>
                <Ionicons 
                  name={expandedCustomer === customer.id ? "chevron-up" : "chevron-down"} 
                  size={20} 
                  color="#64748b" 
                />
              </View>
            </TouchableOpacity>

            {/* Expanded Purchase History */}
            {expandedCustomer === customer.id && customer.orders.length > 0 && (
              <View style={styles.ordersSection}>
                <View style={styles.ordersSectionHeader}>
                  <Ionicons name="receipt" size={16} color="#475569" />
                  <Text style={styles.ordersSectionTitle}>Purchase History</Text>
                </View>
                {customer.orders.map((order, index) => (
                  <TouchableOpacity 
                    key={`${customer.id}-${order.id}-${index}`} 
                    style={styles.orderItem}
                    onPress={() => {
                      Alert.alert(
                        'Order Details',
                        `Order ID: ${order.id}\nDate: ${new Date(order.createdAt).toLocaleDateString()}\nTotal: €${order.total.toFixed(2)}\nStatus: ${order.status}\nItems: ${order.items.length}\nPayment: ${order.paymentMethod}\nAddress: ${order.deliveryAddress}`,
                        [{ text: 'OK' }]
                      );
                    }}
                  >
                    <View style={styles.orderLeft}>
                      <Text style={styles.orderId}>#{order.id}</Text>
                      <Text style={styles.orderDate}>
                        {new Date(order.createdAt).toLocaleDateString()}
                      </Text>
                    </View>
                    <View style={styles.orderRight}>
                      <Text style={styles.orderTotal}>€{order.total.toFixed(2)}</Text>
                      <View style={[
                        styles.orderStatus,
                        { backgroundColor: order.status === 'completed' ? '#d1fae5' : '#fef3c7' }
                      ]}>
                        <Text style={[
                          styles.orderStatusText,
                          { color: order.status === 'completed' ? '#059669' : '#d97706' }
                        ]}>
                          {order.status}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {expandedCustomer === customer.id && customer.orders.length === 0 && (
              <View style={styles.noOrdersContainer}>
                <Text style={styles.noOrdersText}>No purchase history</Text>
              </View>
            )}
          </View>
        ))}

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
          </View>
          <Text style={[styles.navText, styles.navTextInactive]}>Products</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => navigation.navigate('AdminOrders')}
        >
          <View style={styles.navIconContainer}>
            <Ionicons name="receipt-outline" size={24} color="#94a3b8" />
          </View>
          <Text style={[styles.navText, styles.navTextInactive]}>Orders</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <View style={styles.navIconContainer}>
            <Ionicons name="people" size={24} color="#475569" />
          </View>
          <Text style={styles.navText}>Customers</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => navigation.navigate('AdminProfile')}
        >
          <View style={styles.navIconContainer}>
            <Ionicons name="person-outline" size={24} color="#94a3b8" />
          </View>
          <Text style={[styles.navText, styles.navTextInactive]}>Profile</Text>
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
  scrollView: {
    flex: 1,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e2e8f0',
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
    color: '#1e293b',
  },
  customerCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  customerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  customerName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
    flex: 1,
  },
  customerHeaderRight: {
    alignItems: 'flex-end',
  },
  totalSpent: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  customerRole: {
    fontSize: 13,
    color: '#475569',
    backgroundColor: '#e2e8f0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    fontWeight: '600',
  },
  customerEmail: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 6,
  },
  customerPhone: {
    fontSize: 13,
    color: '#94a3b8',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    gap: 16,
  },
  statItem: {
    flex: 1,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  statLabel: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  ordersSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  ordersSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  ordersSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
  },
  orderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    marginBottom: 6,
  },
  orderLeft: {
    flex: 1,
  },
  orderId: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 2,
  },
  orderDate: {
    fontSize: 11,
    color: '#64748b',
  },
  orderRight: {
    alignItems: 'flex-end',
  },
  orderTotal: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  orderStatus: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  orderStatusText: {
    fontSize: 10,
    fontWeight: '600',
  },
  noOrdersContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    alignItems: 'center',
  },
  noOrdersText: {
    fontSize: 13,
    color: '#94a3b8',
    fontStyle: 'italic',
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
  navText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '500',
  },
  navTextInactive: {
    color: '#94a3b8',
  },
});
