import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  Switch
} from "react-native";
import { showAppAlert } from '../lib/styledAlert';

import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { logout } from '../lib/auth';
import { userAPI } from '../lib/api';
import { User } from '../types';
import { useTheme, useThemeMode, useAccessibility } from '../lib/theme';

const AUTO_FETCH_AFTER_SCAN_KEY = 'admin_auto_fetch_after_scan';
const ADMIN_SCAN_AUTO_FILL_AND_EXIT_KEY = 'admin_scan_auto_fill_and_exit';

export default function AdminProfileScreen({ navigation }: any) {
  const theme = useTheme();
  const { themeMode, setThemeMode, isDark } = useThemeMode();
  const { fontScale, setFontScale, highContrast, setHighContrast, reduceMotion, setReduceMotion, getFontSize } = useAccessibility();
  const styles = createStyles(theme, getFontSize);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [autoFetchAfterScan, setAutoFetchAfterScan] = useState(true);
  const [adminScanAutoFillAndExit, setAdminScanAutoFillAndExit] = useState(true);

  useEffect(() => {
    loadProfile();
    loadAutoFetchSetting();
    loadAdminScanAutoFillSetting();
  }, []);

  const loadAutoFetchSetting = async () => {
    try {
      const storedValue = await AsyncStorage.getItem(AUTO_FETCH_AFTER_SCAN_KEY);
      // Default is enabled when not configured yet.
      setAutoFetchAfterScan(storedValue === null ? true : storedValue === 'true');
    } catch (error) {
      console.error('Failed to load auto-fetch setting:', error);
      setAutoFetchAfterScan(true);
    }
  };

  const handleToggleAutoFetch = async (value: boolean) => {
    setAutoFetchAfterScan(value);
    try {
      await AsyncStorage.setItem(AUTO_FETCH_AFTER_SCAN_KEY, String(value));
    } catch (error) {
      console.error('Failed to save auto-fetch setting:', error);
      showAppAlert('Error', 'Failed to save setting');
    }
  };

  const loadAdminScanAutoFillSetting = async () => {
    try {
      const storedValue = await AsyncStorage.getItem(ADMIN_SCAN_AUTO_FILL_AND_EXIT_KEY);
      setAdminScanAutoFillAndExit(storedValue === null ? true : storedValue === 'true');
    } catch (error) {
      console.error('Failed to load admin scan setting:', error);
      setAdminScanAutoFillAndExit(true);
    }
  };

  const handleToggleAdminScanAutoFill = async (value: boolean) => {
    setAdminScanAutoFillAndExit(value);
    try {
      await AsyncStorage.setItem(ADMIN_SCAN_AUTO_FILL_AND_EXIT_KEY, String(value));
    } catch (error) {
      console.error('Failed to save admin scan setting:', error);
      showAppAlert('Error', 'Failed to save setting');
    }
  };

  const loadProfile = async () => {
    try {
      setLoading(true);
      const profileData = await userAPI.getProfile();
      setUser(profileData);
    } catch (error) {
      console.error('Failed to load profile:', error);
      showAppAlert('Error', 'Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    showAppAlert('Logout', 'Are you sure you want to logout?', [
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

  const handleFontScaleStep = (delta: number) => {
    const nextScale = Math.min(1.4, Math.max(0.8, Number((fontScale + delta).toFixed(2))));
    setFontScale(nextScale);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
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

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Accessibility</Text>
          <View style={styles.themeContainer}>
            <View style={styles.themeLeft}>
              <View style={[styles.themeIcon, { backgroundColor: theme.background }]}>
                <Ionicons name="text" size={20} color={theme.primary} />
              </View>
              <Text style={styles.themeLabel}>Font Size</Text>
            </View>
            <View style={styles.themeOptions}>
              <TouchableOpacity
                style={styles.themeOption}
                onPress={() => handleFontScaleStep(-0.05)}
              >
                <Text style={styles.themeOptionText}>-</Text>
              </TouchableOpacity>
              <View style={[styles.themeOption, styles.fontScaleValue]}>
                <Text style={styles.themeOptionText}>{Math.round(fontScale * 100)}%</Text>
              </View>
              <TouchableOpacity style={styles.themeOption} onPress={() => handleFontScaleStep(0.05)}>
                <Text style={styles.themeOptionText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <View style={styles.settingIcon}>
                <Ionicons name="contrast-outline" size={20} color={theme.primary} />
              </View>
              <View>
                <Text style={styles.settingLabel}>High Contrast</Text>
                <Text style={styles.settingHint}>Improve readability with stronger colors</Text>
              </View>
            </View>
            <Switch
              value={highContrast}
              onValueChange={setHighContrast}
              trackColor={{ false: '#cbd5e1', true: theme.primary }}
              thumbColor="#ffffff"
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <View style={styles.settingIcon}>
                <Ionicons name="speedometer-outline" size={20} color={theme.primary} />
              </View>
              <View>
                <Text style={styles.settingLabel}>Reduce Motion</Text>
                <Text style={styles.settingHint}>Reduce animated effects for visual comfort</Text>
              </View>
            </View>
            <Switch
              value={reduceMotion}
              onValueChange={setReduceMotion}
              trackColor={{ false: '#cbd5e1', true: theme.primary }}
              thumbColor="#ffffff"
            />
          </View>
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
          <Text style={styles.sectionTitle}>Product Entry</Text>
          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <View style={styles.settingIcon}>
                <Ionicons name="scan-outline" size={20} color={theme.primary} />
              </View>
              <View>
                <Text style={styles.settingLabel}>Scan Auto Fill And Exit</Text>
                <Text style={styles.settingHint}>Fill barcode and close scanner after admin scan</Text>
              </View>
            </View>
            <Switch
              value={adminScanAutoFillAndExit}
              onValueChange={handleToggleAdminScanAutoFill}
              trackColor={{ false: '#cbd5e1', true: theme.primary }}
              thumbColor="#ffffff"
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <View style={styles.settingIcon}>
                <Ionicons name="flash-outline" size={20} color={theme.primary} />
              </View>
              <View>
                <Text style={styles.settingLabel}>Auto Fetch After Scan</Text>
                <Text style={styles.settingHint}>Automatically fetch product data after barcode scan</Text>
              </View>
            </View>
            <Switch
              value={autoFetchAfterScan}
              onValueChange={handleToggleAutoFetch}
              trackColor={{ false: '#cbd5e1', true: theme.primary }}
              thumbColor="#ffffff"
            />
          </View>
        </View>

        <View style={styles.section}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={24} color="#ef4444" />
            <Text style={styles.logoutButtonText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (theme: any, getFontSize: (baseSize: number) => number) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
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
    fontSize: getFontSize(24),
    fontWeight: 'bold',
    color: theme.text,
    marginBottom: 4,
  },
  email: {
    fontSize: getFontSize(16),
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
    fontSize: getFontSize(12),
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
    fontSize: getFontSize(14),
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
    fontSize: getFontSize(15),
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
  fontScaleValue: {
    minWidth: 72,
    justifyContent: 'center',
  },
  themeOptionText: {
    fontSize: getFontSize(12),
    color: theme.textSecondary,
    fontWeight: '500',
  },
  themeOptionTextActive: {
    color: '#fff',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  settingIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.background,
  },
  settingLabel: {
    fontSize: getFontSize(15),
    color: theme.text,
    fontWeight: '500',
  },
  settingHint: {
    fontSize: getFontSize(12),
    color: theme.textSecondary,
    marginTop: 2,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    justifyContent: 'center',
  },
  logoutButtonText: {
    fontSize: getFontSize(16),
    fontWeight: '600',
    color: '#ef4444',
    marginLeft: 12,
  },
});
