import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { orderAPI, userAPI, productAPI } from '../lib/api';
import { useTheme } from '../lib/theme';
import { useFocusEffect } from '@react-navigation/native';

export default function AdminStatsScreen({ navigation }: any) {
  const theme = useTheme();
  const styles = createStyles(theme);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [kpiStats, setKpiStats] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    totalUsers: 0,
    totalProducts: 0,
    averageOrderValue: 0,
    completedOrders: 0,
  });

  const loadKPIStats = async () => {
    try {
      setLoading(true);
      // Load all data in parallel
      const [orders, users, products] = await Promise.all([
        orderAPI.getAllOrders(),
        userAPI.getAllUsers(),
        productAPI.getAllProducts(),
      ]);

      // Calculate statistics
      const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
      const completedOrders = orders.filter(o => o.status === 'completed').length;
      const averageOrderValue = orders.length > 0 ? totalRevenue / orders.length : 0;

      setKpiStats({
        totalRevenue,
        totalOrders: orders.length,
        totalUsers: users.length,
        totalProducts: products.length,
        averageOrderValue,
        completedOrders,
      });
    } catch (error) {
      console.error('Failed to load KPI stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      loadKPIStats();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadKPIStats();
    setRefreshing(false);
  };

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Dashboard</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Dashboard</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Hero Revenue Card */}
        <View style={styles.heroCard}>
          <View style={styles.heroGradient}>
            <View style={styles.heroContent}>
              <View style={styles.heroIcon}>
                <Ionicons name="trending-up" size={24} color="#fff" />
              </View>
              <Text style={styles.heroLabel}>Total Revenue</Text>
              <Text style={styles.heroValue}>€{kpiStats.totalRevenue.toFixed(2)}</Text>
              <View style={styles.heroSubStats}>
                <View style={styles.heroSubItem}>
                  <Text style={styles.heroSubValue}>{kpiStats.totalOrders}</Text>
                  <Text style={styles.heroSubLabel}>Orders</Text>
                </View>
                <View style={styles.heroDivider} />
                <View style={styles.heroSubItem}>
                  <Text style={styles.heroSubValue}>€{kpiStats.averageOrderValue.toFixed(2)}</Text>
                  <Text style={styles.heroSubLabel}>Avg Order</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <View style={[styles.statIconWrapper, { backgroundColor: '#dbeafe' }]}>
              <Ionicons name="receipt" size={20} color="#2563eb" />
            </View>
            <View style={styles.statContent}>
              <Text style={styles.statValue}>{kpiStats.completedOrders}</Text>
              <Text style={styles.statLabel}>Completed Orders</Text>
              <View style={styles.statBadge}>
                <Text style={styles.statBadgeText}>
                  {kpiStats.totalOrders > 0 ? ((kpiStats.completedOrders / kpiStats.totalOrders) * 100).toFixed(0) : 0}% Rate
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIconWrapper, { backgroundColor: '#e0e7ff' }]}>
              <Ionicons name="people" size={20} color="#4f46e5" />
            </View>
            <View style={styles.statContent}>
              <Text style={styles.statValue}>{kpiStats.totalUsers}</Text>
              <Text style={styles.statLabel}>Total Users</Text>
              <View style={styles.statBadge}>
                <Text style={styles.statBadgeText}>
                  €{kpiStats.totalUsers > 0 ? (kpiStats.totalRevenue / kpiStats.totalUsers).toFixed(0) : '0'} Avg
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIconWrapper, { backgroundColor: '#fef3c7' }]}>
              <Ionicons name="cube" size={20} color="#d97706" />
            </View>
            <View style={styles.statContent}>
              <Text style={styles.statValue}>{kpiStats.totalProducts}</Text>
              <Text style={styles.statLabel}>Total Products</Text>
              <View style={styles.statBadge}>
                <Text style={styles.statBadgeText}>In Stock</Text>
              </View>
            </View>
          </View>

          {/* <View style={styles.statCard}>
            <View style={[styles.statIconWrapper, { backgroundColor: '#dcfce7' }]}>
              <Ionicons name="pulse" size={20} color="#059669" />
            </View>
            <View style={styles.statContent}>
              <Text style={styles.statValue}>
                {kpiStats.totalProducts > 0 ? (kpiStats.totalOrders / kpiStats.totalProducts).toFixed(1) : '0'}
              </Text>
              <Text style={styles.statLabel}>Orders/Product</Text>
              <View style={styles.statBadge}>
                <Text style={styles.statBadgeText}>Ratio</Text>
              </View>
            </View>
          </View> */}
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
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: theme.card,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.text,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  heroCard: {
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  heroGradient: {
    backgroundColor: theme.primary,
  },
  heroContent: {
    padding: 20,
    alignItems: 'center',
  },
  heroIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  heroLabel: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 6,
    fontWeight: '500',
  },
  heroValue: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
  },
  heroSubStats: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    justifyContent: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
  },
  heroSubItem: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  heroDivider: {
    width: 1,
    height: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  heroSubValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  heroSubLabel: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '47%',
    backgroundColor: theme.card,
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    gap: 12,
  },
  statIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statContent: {
    flex: 1,
  },
  statValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: theme.text,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    color: theme.textSecondary,
    marginBottom: 4,
  },
  statBadge: {
    alignSelf: 'flex-start',
    backgroundColor: theme.background,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  statBadgeText: {
    fontSize: 9,
    fontWeight: '600',
    color: theme.textSecondary,
  },
});
