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

interface Customer {
  id: string;
  name: string;
  email: string;
  registeredDate: string;
  totalSpent: number;
  orderCount: number;
}

export default function AdminCustomersScreen({ navigation }: any) {
  const [searchQuery, setSearchQuery] = useState('');
  const [customers, setCustomers] = useState<Customer[]>([]);

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      const ordersStr = await AsyncStorage.getItem('orders');
      
      // Mock customer data based on orders
      const mockCustomers: Customer[] = [
        {
          id: '1',
          name: 'John Doe',
          email: 'john.doe@email.com',
          registeredDate: '2025-11-15',
          totalSpent: 524.50,
          orderCount: 5,
        },
        {
          id: '2',
          name: 'Jane Smith',
          email: 'jane.smith@email.com',
          registeredDate: '2025-12-03',
          totalSpent: 892.30,
          orderCount: 8,
        },
        {
          id: '3',
          name: 'Mike Wilson',
          email: 'mike.wilson@email.com',
          registeredDate: '2026-01-10',
          totalSpent: 267.80,
          orderCount: 3,
        },
        {
          id: '4',
          name: 'Sarah Jones',
          email: 'sarah.jones@email.com',
          registeredDate: '2026-02-01',
          totalSpent: 145.90,
          orderCount: 2,
        },
        {
          id: '5',
          name: 'David Brown',
          email: 'david.brown@email.com',
          registeredDate: '2025-10-22',
          totalSpent: 1456.70,
          orderCount: 12,
        },
      ];
      
      setCustomers(mockCustomers);
    } catch (error) {
      console.error('Failed to load customers:', error);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigation.replace('Login');
  };

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

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

        {/* Customers List */}
        {filteredCustomers.map((customer) => (
          <View key={customer.id} style={styles.customerCard}>
            <View style={styles.customerHeader}>
              <Text style={styles.customerName}>{customer.name}</Text>
              <View style={styles.customerHeaderRight}>
                <Text style={styles.totalSpent}>€{customer.totalSpent.toFixed(2)}</Text>
                <Text style={styles.orderCount}>{customer.orderCount} orders</Text>
              </View>
            </View>
            <Text style={styles.customerEmail}>{customer.email}</Text>
            <Text style={styles.registeredDate}>
              Registered: {customer.registeredDate}
            </Text>
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
            <View style={styles.navBadge}>
              <Text style={styles.navBadgeText}>30</Text>
            </View>
          </View>
          <Text style={[styles.navText, styles.navTextInactive]}>Products</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => navigation.navigate('AdminOrders')}
        >
          <View style={styles.navIconContainer}>
            <Ionicons name="receipt-outline" size={24} color="#94a3b8" />
            <View style={styles.navBadge}>
              <Text style={styles.navBadgeText}>4</Text>
            </View>
          </View>
          <Text style={[styles.navText, styles.navTextInactive]}>Orders</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <View style={styles.navIconContainer}>
            <Ionicons name="people" size={24} color="#475569" />
            <View style={styles.navBadge}>
              <Text style={styles.navBadgeText}>{customers.length}</Text>
            </View>
          </View>
          <Text style={styles.navText}>Customers</Text>
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
  orderCount: {
    fontSize: 13,
    color: '#64748b',
  },
  customerEmail: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 6,
  },
  registeredDate: {
    fontSize: 13,
    color: '#94a3b8',
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
