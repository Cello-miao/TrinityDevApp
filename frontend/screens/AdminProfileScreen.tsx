import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { logout } from '../lib/auth';
import { userAPI } from '../lib/api';
import { User } from '../types';
import { useTheme, useThemeMode } from '../lib/theme';

export default function AdminProfileScreen({ navigation }: any) {
  const theme = useTheme();
  const { themeMode, setThemeMode, isDark } = useThemeMode();
  const styles = createStyles(theme);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const profileData = await userAPI.getProfile();
      setUser(profileData);
    } catch (error) {
      console.error('Failed to load profile:', error);
      Alert.alert('Error', 'Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await logout();
          navigation.replace('Login');
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <Ionicons name="person" size={40} color="#475569" />
          </View>
          {loading ? (
            <ActivityIndicator size="small" color="#475569" />
          ) : (
            <>
              <Text style={styles.name}>{user?.name || 'Admin User'}</Text>
              <Text style={styles.email}>{user?.email || 'admin@example.com'}</Text>
              <View style={styles.roleBadge}>
                <Text style={styles.roleText}>Administrator</Text>
              </View>
            </>
          )}
        </View>

        {/* Appearance Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Appearance</Text>
          <View style={styles.themeContainer}>
            <View style={styles.themeLeft}>
              <View style={[styles.themeIcon, { backgroundColor: isDark ? '#334155' : '#f3f4f6' }]}>
                <Ionicons name={isDark ? "moon" : "sunny"} size={20} color={isDark ? "#fbbf24" : "#f59e0b"} />
              </View>
              <Text style={styles.themeLabel}>Theme</Text>
            </View>
            <View style={styles.themeOptions}>
              <TouchableOpacity 
                style={[styles.themeOption, themeMode === 'light' && styles.themeOptionActive]}
                onPress={() => setThemeMode('light')}
              >
                <Ionicons name="sunny" size={16} color={themeMode === 'light' ? '#fff' : theme.textSecondary} />
                <Text style={[styles.themeOptionText, themeMode === 'light' && styles.themeOptionTextActive]}>Light</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.themeOption, themeMode === 'dark' && styles.themeOptionActive]}
                onPress={() => setThemeMode('dark')}
              >
                <Ionicons name="moon" size={16} color={themeMode === 'dark' ? '#fff' : theme.textSecondary} />
                <Text style={[styles.themeOptionText, themeMode === 'dark' && styles.themeOptionTextActive]}>Dark</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={24} color="#ef4444" />
            <Text style={styles.logoutButtonText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  profileHeader: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 40,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: theme.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.text,
    marginBottom: 4,
  },
  email: {
    fontSize: 16,
    color: theme.textSecondary,
    marginBottom: 12,
  },
  roleBadge: {
    backgroundColor: theme.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  roleText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  section: {
    backgroundColor: theme.card,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: theme.border,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.textSecondary,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  themeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  themeLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  themeIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  themeLabel: {
    fontSize: 15,
    color: theme.text,
    fontWeight: '500',
  },
  themeOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  themeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: theme.background,
    gap: 6,
  },
  themeOptionActive: {
    backgroundColor: theme.primary,
  },
  themeOptionText: {
    fontSize: 12,
    color: theme.textSecondary,
    fontWeight: '500',
  },
  themeOptionTextActive: {
    color: '#fff',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    justifyContent: 'center',
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ef4444',
    marginLeft: 12,
  },
});
