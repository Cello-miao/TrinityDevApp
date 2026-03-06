import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '../types';
import { logout } from '../lib/auth';
import { userAPI, orderAPI } from '../lib/api';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme, useThemeMode, ThemeMode } from '../lib/theme';

export default function ProfileScreen({ navigation }: any) {
  const theme = useTheme();
  const { themeMode, setThemeMode, isDark } = useThemeMode();
  const styles = createStyles(theme);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [orderCount, setOrderCount] = useState(0);
  const [activeOrderCount, setActiveOrderCount] = useState(0);
  const [favoritesCount, setFavoritesCount] = useState(0);

  const loadUserData = async () => {
    setLoading(true);

    try {
      const userData = await userAPI.getProfile();
      setUser(userData);
      await AsyncStorage.setItem('user', JSON.stringify(userData));
    } catch (error) {
      console.error('Failed to load user data:', error);
      // Fallback to local storage
      const userStr = await AsyncStorage.getItem('user');
      if (userStr) {
        setUser(JSON.parse(userStr));
      }
    }

    // Load order count from API
    try {
      const userOrders = await orderAPI.getMyOrders();
      setOrderCount(userOrders.length);
      const activeOrders = userOrders.filter(
        (order) => order.status === 'pending' || order.status === 'processing'
      );
      setActiveOrderCount(activeOrders.length);
    } catch (err) {
      console.error('Failed to load user orders:', err);
      setOrderCount(0);
      setActiveOrderCount(0);
    }

    // Load favorites count
    try {
      const favoritesStr = await AsyncStorage.getItem('favorites');
      if (favoritesStr) {
        const favorites = JSON.parse(favoritesStr);
        setFavoritesCount(favorites.length);
      }
    } catch (err) {
      console.error('Failed to load favorites:', err);
    }

    setLoading(false);
  };

  useFocusEffect(
    React.useCallback(() => {
      loadUserData();
    }, [])
  );

  const handleLogout = async () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        onPress: async () => {
          await logout();
          navigation.replace('Login');
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profile</Text>
        </View>

        {/* User Info Card */}
        <View style={styles.userCard}>
          <View style={styles.userHeader}>
            <View style={styles.avatar}>
              <Ionicons name="person-outline" size={40} color="#fff" />
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{user?.first_name || user?.name || 'Guest'}</Text>
              <View style={styles.emailContainer}>
                <Ionicons name="mail-outline" size={16} color="#cbd5e1" />
                <Text style={styles.userEmail}>{user?.email || 'guest@example.com'}</Text>
              </View>
            </View>
          </View>

          {/* Stats */}
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{orderCount}</Text>
              <Text style={styles.statLabel}>Orders</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{favoritesCount}</Text>
              <Text style={styles.statLabel}>Favorites</Text>
            </View>
          </View>
        </View>

        {/* Menu Section */}
        <View style={styles.menuSection}>
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => navigation.navigate('Orders')}
          >
            <View style={styles.menuLeft}>
              <View style={[styles.menuIcon, { backgroundColor: '#dbeafe' }]}>
                <Ionicons name="cube-outline" size={24} color="#3b82f6" />
              </View>
              <Text style={styles.menuText}>My Orders</Text>
            </View>
            <View style={styles.menuRight}>
              {activeOrderCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{activeOrderCount}</Text>
                </View>
              )}
              <Ionicons name="chevron-forward" size={20} color="#cbd5e1" />
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => navigation.navigate('Favorites')}
          >
            <View style={styles.menuLeft}>
              <View style={[styles.menuIcon, { backgroundColor: '#fee2e2' }]}>
                <Ionicons name="heart-outline" size={24} color="#ef4444" />
              </View>
              <Text style={styles.menuText}>My Favorites</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#cbd5e1" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => navigation.navigate('EditProfile', { user })}
          >
            <View style={styles.menuLeft}>
              <View style={[styles.menuIcon, { backgroundColor: '#dbeafe' }]}>
                <Ionicons name="create-outline" size={24} color="#3b82f6" />
              </View>
              <Text style={styles.menuText}>Edit Profile</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#cbd5e1" />
          </TouchableOpacity>
        </View>

        {/* Appearance Section */}
        <View style={styles.menuSection}>
          <Text style={styles.sectionTitle}>Appearance</Text>
          
          <View style={styles.menuItem}>
            <View style={styles.menuLeft}>
              <View style={[styles.menuIcon, { backgroundColor: isDark ? '#334155' : '#f3f4f6' }]}>
                <Ionicons name={isDark ? "moon" : "sunny"} size={24} color={isDark ? "#fbbf24" : "#f59e0b"} />
              </View>
              <Text style={styles.menuText}>Theme</Text>
            </View>
            <View style={styles.themeOptions}>
              <TouchableOpacity 
                style={[styles.themeOption, themeMode === 'light' && styles.themeOptionActive]}
                onPress={() => setThemeMode('light')}
              >
                <Ionicons name="sunny" size={18} color={themeMode === 'light' ? '#fff' : theme.textSecondary} />
                <Text style={[styles.themeOptionText, themeMode === 'light' && styles.themeOptionTextActive]}>Light</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.themeOption, themeMode === 'dark' && styles.themeOptionActive]}
                onPress={() => setThemeMode('dark')}
              >
                <Ionicons name="moon" size={18} color={themeMode === 'dark' ? '#fff' : theme.textSecondary} />
                <Text style={[styles.themeOptionText, themeMode === 'dark' && styles.themeOptionTextActive]}>Dark</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color="#64748b" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>

        {/* Version */}
        <Text style={styles.versionText}>Version 1.0.0</Text>

        <View style={{ height: 40 }} />
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
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: theme.card,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.text,
  },
  userCard: {
    backgroundColor: theme.primary,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    padding: 20,
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#64748b',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userInfo: {
    marginLeft: 16,
    flex: 1,
  },
  userName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 6,
  },
  emailContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  userEmail: {
    fontSize: 14,
    color: '#cbd5e1',
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#5a6c7d',
    borderRadius: 12,
    padding: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    color: '#cbd5e1',
  },
  menuSection: {
    backgroundColor: theme.card,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.textSecondary,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuText: {
    fontSize: 16,
    color: theme.text,
    fontWeight: '500',
  },
  menuRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  badge: {
    backgroundColor: theme.badgeBackground,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    minWidth: 24,
    alignItems: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  themeOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  themeOption: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: theme.searchBackground,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    gap: 4,
  },
  themeOptionActive: {
    backgroundColor: theme.primary,
    borderColor: theme.accent,
  },
  themeOptionText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.textSecondary,
  },
  themeOptionTextActive: {
    color: '#fff',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.card,
    marginHorizontal: 16,
    marginTop: 16,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.border,
    gap: 8,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.textSecondary,
  },
  versionText: {
    textAlign: 'center',
    fontSize: 13,
    color: theme.textTertiary,
    marginTop: 24,
  },
});
