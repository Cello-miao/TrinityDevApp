import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Switch,
  Modal,
  Pressable,
  Dimensions,
  Platform,
  StatusBar
} from "react-native";
import { showAppAlert } from '../lib/styledAlert';

import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '../types';
import { logout } from '../lib/auth';
import { userAPI } from '../lib/api';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme, useThemeMode, useAccessibility } from '../lib/theme';

const USER_SCAN_AUTO_OPEN_DETAIL_KEY = 'user_scan_auto_open_detail';

export default function ProfileScreen({ navigation }: any) {
  const theme = useTheme();
  const { themeMode, setThemeMode, isDark } = useThemeMode();
  const { fontScale, setFontScale, highContrast, setHighContrast, reduceMotion, setReduceMotion, getFontSize } = useAccessibility();
  const styles = createStyles(theme, getFontSize);
  const [user, setUser] = useState<User | null>(null);
  const [userScanAutoOpenDetail, setUserScanAutoOpenDetail] = useState(true);
  const [showScanInfo, setShowScanInfo] = useState(false);
  const [scanInfoAnchor, setScanInfoAnchor] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const [scanInfoPopoverHeight, setScanInfoPopoverHeight] = useState(0);
  const scanInfoButtonRef = useRef<TouchableOpacity | null>(null);

  const loadUserData = async () => {
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
  };

  useFocusEffect(
    React.useCallback(() => {
      loadUserData();
      loadScannerPreference();
    }, [])
  );

  const loadScannerPreference = async () => {
    try {
      const storedValue = await AsyncStorage.getItem(USER_SCAN_AUTO_OPEN_DETAIL_KEY);
      setUserScanAutoOpenDetail(storedValue === null ? true : storedValue === 'true');
    } catch (error) {
      console.error('Failed to load scanner preference:', error);
      setUserScanAutoOpenDetail(true);
    }
  };

  const handleToggleUserScanAutoOpen = async (value: boolean) => {
    setUserScanAutoOpenDetail(value);
    try {
      await AsyncStorage.setItem(USER_SCAN_AUTO_OPEN_DETAIL_KEY, String(value));
    } catch (error) {
      console.error('Failed to save scanner preference:', error);
      showAppAlert('Error', 'Failed to save setting');
    }
  };

  const handleLogout = async () => {
    showAppAlert('Logout', 'Are you sure you want to logout?', [
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

  const handleFontScaleStep = (delta: number) => {
    const nextScale = Math.min(1.4, Math.max(0.8, Number((fontScale + delta).toFixed(2))));
    setFontScale(nextScale);
  };

  const openScanInfoPopover = () => {
    scanInfoButtonRef.current?.measureInWindow((x, y, width, height) => {
      setScanInfoPopoverHeight(0);
      setScanInfoAnchor({ x, y, width, height });
      setShowScanInfo(true);
    });
  };

  const windowWidth = Dimensions.get('window').width;
  const windowHeight = Dimensions.get('window').height;
  const topSafeInset = (Platform.OS === 'android' ? (StatusBar.currentHeight || 0) : 0) + 10;
  const bottomSafeInset = 12;
  const anchorGap = 10;
  const estimatedPopoverHeight = scanInfoPopoverHeight || Math.round(128 * fontScale);
  const desiredWidth = Math.round(240 * fontScale);
  const popoverWidth = Math.min(Math.max(220, desiredWidth), windowWidth - 24);
  const popoverLeft = Math.min(
    Math.max(12, scanInfoAnchor.x + scanInfoAnchor.width - popoverWidth),
    windowWidth - popoverWidth - 12,
  );
  const popoverTopWhenBelow = scanInfoAnchor.y + scanInfoAnchor.height + anchorGap;
  const popoverTopWhenAbove = scanInfoAnchor.y - estimatedPopoverHeight - anchorGap;
  const canOpenBelow = popoverTopWhenBelow + estimatedPopoverHeight <= windowHeight - bottomSafeInset;
  const canOpenAbove = popoverTopWhenAbove >= topSafeInset;
  const openAboveAnchor = !canOpenBelow && canOpenAbove;
  const popoverTop = openAboveAnchor
    ? popoverTopWhenAbove
    : Math.min(
        Math.max(topSafeInset, popoverTopWhenBelow),
        windowHeight - estimatedPopoverHeight - bottomSafeInset,
      );
  const arrowLeft = Math.min(
    popoverWidth - 26,
    Math.max(16, scanInfoAnchor.x + scanInfoAnchor.width / 2 - popoverLeft - 8),
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profile</Text>
        </View>

        <View style={styles.profileSummaryCard}>
          <View style={styles.profileSummaryAvatar}>
            <Ionicons name="person-outline" size={28} color={theme.primaryDark} />
          </View>
          <View style={styles.profileSummaryContent}>
            <Text style={styles.profileSummaryName}>{user?.first_name || user?.name || 'Guest'}</Text>
            <Text style={styles.profileSummaryEmail}>{user?.email || 'guest@example.com'}</Text>
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

        <View style={styles.menuSection}>
          <Text style={styles.sectionTitle}>Accessibility</Text>

          <View style={styles.menuItem}>
            <View style={styles.menuLeft}>
              <View style={[styles.menuIcon, { backgroundColor: theme.searchBackground }]}>
                <Ionicons name="text" size={24} color={theme.primary} />
              </View>
              <Text style={styles.menuText}>Font Size</Text>
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

          <View style={styles.menuItem}>
            <View style={styles.menuLeft}>
              <View style={[styles.menuIcon, { backgroundColor: theme.searchBackground }]}>
                <Ionicons name="contrast-outline" size={24} color={theme.primary} />
              </View>
              <Text style={styles.menuText}>High Contrast</Text>
            </View>
            <Switch
              value={highContrast}
              onValueChange={setHighContrast}
              trackColor={{ false: '#cbd5e1', true: theme.primary }}
              thumbColor="#ffffff"
            />
          </View>

          <View style={styles.menuItem}>
            <View style={styles.menuLeft}>
              <View style={[styles.menuIcon, { backgroundColor: theme.searchBackground }]}>
                <Ionicons name="speedometer-outline" size={24} color={theme.primary} />
              </View>
              <Text style={styles.menuText}>Reduce Motion</Text>
            </View>
            <Switch
              value={reduceMotion}
              onValueChange={setReduceMotion}
              trackColor={{ false: '#cbd5e1', true: theme.primary }}
              thumbColor="#ffffff"
            />
          </View>

          <View style={styles.menuItem}>
            <View style={styles.menuLeft}>
              <View style={[styles.menuIcon, { backgroundColor: theme.searchBackground }]}>
                <Ionicons name="scan-outline" size={24} color={theme.primary} />
              </View>
              <View style={styles.scanSettingTitleRow}>
                <Text style={styles.menuText}>Scan Product Detail</Text>
                <TouchableOpacity
                  ref={scanInfoButtonRef}
                  style={styles.infoButton}
                  onPress={openScanInfoPopover}
                >
                  <Ionicons name="help-circle-outline" size={18} color={theme.textSecondary} />
                </TouchableOpacity>
              </View>
            </View>
            <Switch
              value={userScanAutoOpenDetail}
              onValueChange={handleToggleUserScanAutoOpen}
              trackColor={{ false: '#cbd5e1', true: theme.primary }}
              thumbColor="#ffffff"
            />
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

      <Modal visible={showScanInfo} transparent animationType="fade" onRequestClose={() => setShowScanInfo(false)}>
        <Pressable style={styles.popoverBackdrop} onPress={() => setShowScanInfo(false)}>
          <Pressable
            style={[
              styles.popoverCard,
              {
                width: popoverWidth,
                left: popoverLeft,
                top: popoverTop,
              },
            ]}
            onLayout={(event) => setScanInfoPopoverHeight(event.nativeEvent.layout.height)}
            onPress={(event) => event.stopPropagation()}
          >
            <View
              style={[
                styles.popoverArrow,
                openAboveAnchor ? styles.popoverArrowUp : styles.popoverArrowDown,
                { left: arrowLeft },
              ]}
            />
            <View style={styles.popoverHeader}>
              <Ionicons name="information-circle-outline" size={getFontSize(16)} color={theme.primary} />
              <Text style={styles.popoverTitle}>Scan Setting Details</Text>
            </View>
            <Text style={styles.popoverText}>
              Enabled: after a successful scan, the app opens product details immediately.
            </Text>
            <Text style={styles.popoverText}>
              Disabled: after scan, you can choose to view details or continue scanning.
            </Text>
            <Text style={styles.popoverHint}>Tap outside to close.</Text>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const createStyles = (theme: any, getFontSize: (baseSize: number) => number) => StyleSheet.create({
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
    fontSize: getFontSize(28),
    fontWeight: 'bold',
    color: theme.text,
  },
  profileSummaryCard: {
    backgroundColor: theme.card,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.border,
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileSummaryAvatar: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: theme.searchBackground,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileSummaryContent: {
    marginLeft: 14,
    flex: 1,
  },
  profileSummaryName: {
    fontSize: getFontSize(20),
    fontWeight: '700',
    color: theme.text,
    marginBottom: 4,
  },
  profileSummaryEmail: {
    fontSize: getFontSize(14),
    color: theme.textSecondary,
    marginBottom: 4,
  },
  profileSummaryMeta: {
    fontSize: getFontSize(13),
    color: theme.textTertiary,
  },
  menuSection: {
    backgroundColor: theme.card,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  sectionTitle: {
    fontSize: getFontSize(14),
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
    fontSize: getFontSize(16),
    color: theme.text,
    fontWeight: '500',
  },
  scanSettingTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  infoButton: {
    padding: 2,
  },
  popoverBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  popoverCard: {
    position: 'absolute',
    borderRadius: 12,
    backgroundColor: theme.card,
    borderWidth: 1,
    borderColor: theme.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  popoverArrow: {
    position: 'absolute',
    width: 14,
    height: 14,
    backgroundColor: theme.card,
    borderColor: theme.border,
    transform: [{ rotate: '45deg' }],
  },
  popoverArrowDown: {
    top: -8,
    borderLeftWidth: 1,
    borderTopWidth: 1,
  },
  popoverArrowUp: {
    bottom: -8,
    borderRightWidth: 1,
    borderBottomWidth: 1,
  },
  popoverHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  popoverTitle: {
    fontSize: getFontSize(13),
    fontWeight: '700',
    color: theme.text,
  },
  popoverText: {
    fontSize: getFontSize(12),
    color: theme.textSecondary,
    lineHeight: getFontSize(16),
    marginBottom: 4,
  },
  popoverHint: {
    marginTop: 4,
    fontSize: getFontSize(11),
    color: theme.textTertiary,
  },
  menuRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
  fontScaleValue: {
    minWidth: 72,
    justifyContent: 'center',
  },
  themeOptionText: {
    fontSize: getFontSize(13),
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
    fontSize: getFontSize(16),
    fontWeight: '600',
    color: theme.textSecondary,
  },
  versionText: {
    textAlign: 'center',
    fontSize: getFontSize(13),
    color: theme.textTertiary,
    marginTop: 24,
  },
});
