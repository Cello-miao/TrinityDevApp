import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { orderAPI, userAPI, productAPI } from '../lib/api';
import { useTheme } from '../lib/theme';
import { useFocusEffect } from '@react-navigation/native';
import { Order } from '../types';

const { width: SCREEN_W } = Dimensions.get('window');
const BAR_H = 150;
const LABEL_H = 36;
const CHART_TOTAL_H = BAR_H + LABEL_H;
const Y_AXIS_W = 36;
const CARD_GAP = 10;
const KPIW = (SCREEN_W - 32 - CARD_GAP) / 2;

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

type Period = 'Monthly' | 'Weekly' | 'Daily';
interface Bar { label: string; value: number; }

function getBars(orders: Order[], period: Period): Bar[] {
  const now = new Date();
  if (period === 'Monthly') {
    return Array.from({ length: 9 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (8 - i), 1);
      return {
        label: MONTHS[d.getMonth()],
        value: orders
          .filter(o => {
            const od = new Date(o.createdAt);
            return od.getFullYear() === d.getFullYear() && od.getMonth() === d.getMonth();
          })
          .reduce((s, o) => s + o.total, 0),
      };
    });
  }
  if (period === 'Weekly') {
    return Array.from({ length: 8 }, (_, i) => {
      const wEnd = new Date(now);
      wEnd.setDate(now.getDate() - (7 - i) * 7);
      wEnd.setHours(23, 59, 59, 999);
      const wStart = new Date(wEnd);
      wStart.setDate(wEnd.getDate() - 6);
      wStart.setHours(0, 0, 0, 0);
      return {
        label: `${wStart.getDate()}/${MONTHS[wStart.getMonth()]}`,
        value: orders
          .filter(o => { const od = new Date(o.createdAt); return od >= wStart && od <= wEnd; })
          .reduce((s, o) => s + o.total, 0),
      };
    });
  }
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now);
    d.setDate(now.getDate() - (6 - i));
    d.setHours(0, 0, 0, 0);
    const dEnd = new Date(d);
    dEnd.setHours(23, 59, 59, 999);
    return {
      label: DAYS[d.getDay()],
      value: orders
        .filter(o => { const od = new Date(o.createdAt); return od >= d && od <= dEnd; })
        .reduce((s, o) => s + o.total, 0),
    };
  });
}

function getPeriodRevenue(orders: Order[], period: Period): number {
  const now = new Date();
  return orders
    .filter(o => {
      const od = new Date(o.createdAt);
      if (period === 'Monthly')
        return od.getMonth() === now.getMonth() && od.getFullYear() === now.getFullYear();
      if (period === 'Weekly') {
        const ws = new Date(now);
        ws.setDate(now.getDate() - now.getDay());
        ws.setHours(0, 0, 0, 0);
        return od >= ws;
      }
      const today = new Date(now);
      today.setHours(0, 0, 0, 0);
      return od >= today;
    })
    .reduce((s, o) => s + o.total, 0);
}

function fmtY(v: number): string {
  if (v === 0) return '0';
  if (v >= 1000) return `${(v / 1000).toFixed(0)}k`;
  return `${Math.round(v)}`;
}

const createStyles = (theme: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 16, paddingVertical: 16,
    backgroundColor: theme.card, borderBottomWidth: 1, borderBottomColor: theme.border,
  },
  headerTitle: { fontSize: 20, fontWeight: '700', color: theme.text },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scroll: { flex: 1 },
  heroCard: {
    backgroundColor: theme.card, marginHorizontal: 16, marginTop: 16,
    borderRadius: 16, padding: 16, borderWidth: 1, borderColor: theme.border,
  },
  heroAmount: { fontSize: 38, fontWeight: '400', color: theme.text, marginBottom: 14 },
  tabs: { flexDirection: 'row', marginBottom: 20 },
  tabWrap: { marginRight: 24 },
  tab: { fontSize: 15, fontWeight: '500', color: theme.textSecondary, paddingBottom: 6 },
  tabActive: { color: theme.text, fontWeight: '700' },
  tabLine: { height: 2, backgroundColor: theme.text, borderRadius: 1 },
  yLabel: { fontSize: 9, color: theme.textSecondary },
  barLabel: {
    fontSize: 10, fontWeight: '700', color: theme.text,
    textAlign: 'center', position: 'absolute',
  },
  chartBar: { borderRadius: 4, backgroundColor: '#c7e4eb' },
  xLabel: { fontSize: 9, color: theme.textSecondary, textAlign: 'center' },
  sectionTitle: {
    fontSize: 18, fontWeight: '700', color: theme.text,
    marginHorizontal: 16, marginTop: 20, marginBottom: 10,
  },
  kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, gap: CARD_GAP },
  kpiCard: {
    width: KPIW, backgroundColor: theme.card, borderRadius: 12, padding: 12,
    borderWidth: 1, borderColor: theme.border,
    flexDirection: 'row',
    alignItems: 'center',
  },
  kpiIcon: {
    width: 36, height: 36, borderRadius: 10,
    justifyContent: 'center', alignItems: 'center',
    backgroundColor: '#eef2f6',
    marginRight: 10,
  },
  kpiTextWrap: { flex: 1 },
  kpiValue: { fontSize: 15, fontWeight: '700', color: theme.text, marginBottom: 2 },
  kpiLabel: { fontSize: 10, color: theme.textSecondary },
  topList: {
    marginHorizontal: 16,
    backgroundColor: theme.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.border,
    overflow: 'hidden',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.border,
  },
  topLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  rankBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#eef2f6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  rankText: { fontSize: 12, fontWeight: '700', color: theme.textSecondary },
  topName: { fontSize: 14, fontWeight: '600', color: theme.text, flexShrink: 1 },
  topQty: { fontSize: 13, fontWeight: '700', color: theme.primary },
  topEmpty: {
    marginHorizontal: 16,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.border,
    backgroundColor: theme.card,
  },
  topEmptyText: { fontSize: 13, color: theme.textSecondary, textAlign: 'center' },
});

export default function AdminStatsScreen({ navigation }: any) {
  const theme = useTheme();
  const styles = createStyles(theme);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [period, setPeriod] = useState<Period>('Monthly');
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [userCount, setUserCount] = useState(0);
  const [productCount, setProductCount] = useState(0);

  const totalRevenue = useMemo(() => allOrders.reduce((s, o) => s + o.total, 0), [allOrders]);
  const completedOrders = useMemo(() => allOrders.filter(o => o.status === 'completed').length, [allOrders]);
  const avgOrderValue = allOrders.length > 0 ? totalRevenue / allOrders.length : 0;
  const periodRevenue = useMemo(() => getPeriodRevenue(allOrders, period), [allOrders, period]);
  const bars = useMemo(() => getBars(allOrders, period), [allOrders, period]);
  const topProducts = useMemo(() => {
    const map: Record<string, { name: string; qty: number }> = {};
    allOrders.forEach(order => {
      order.items.forEach(item => {
        const pid = item.product?.id || item.product?.name || 'unknown';
        const pname = item.product?.name || 'Unknown Product';
        const qty = Number(item.quantity) || 0;
        if (!map[pid]) {
          map[pid] = { name: pname, qty: 0 };
        }
        map[pid].qty += qty;
      });
    });
    return Object.values(map)
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 3);
  }, [allOrders]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [orders, users, products] = await Promise.all([
        orderAPI.getAllOrders(),
        userAPI.getAllUsers(),
        productAPI.getAllProducts(true),
      ]);
      setAllOrders(orders);
      setUserCount(users.filter((u: any) => u.role !== 'admin').length);
      setProductCount(products.length);
    } catch (err) {
      console.error('Failed to load stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(React.useCallback(() => { loadData(); }, []));

  const onRefresh = async () => { setRefreshing(true); await loadData(); setRefreshing(false); };

  const renderChart = () => {
    const maxVal = Math.max(...bars.map(b => b.value), 1);
    const maxIdx = bars.reduce((bi, b, i) => b.value > bars[bi].value ? i : bi, 0);
    const yVals = [maxVal, (maxVal * 2) / 3, maxVal / 3, 0];
    const chartW = SCREEN_W - 32 - Y_AXIS_W;
    const slotW = chartW / bars.length;
    const barW = Math.max(slotW * 0.52, 8);

    return (
      <View>
        <View style={{ flexDirection: 'row', height: CHART_TOTAL_H }}>
          {/* Y axis */}
          <View style={{ width: Y_AXIS_W, height: CHART_TOTAL_H, justifyContent: 'flex-end' }}>
            <View style={{ height: BAR_H, justifyContent: 'space-between', alignItems: 'flex-end', paddingRight: 6 }}>
              {yVals.map((v, i) => (
                <Text key={i} style={styles.yLabel}>{fmtY(v)}</Text>
              ))}
            </View>
          </View>
          {/* Drawing area */}
          <View style={{ flex: 1, height: CHART_TOTAL_H }}>
            {/* Grid lines inside BAR_H zone */}
            {[0, 1 / 3, 2 / 3, 1].map((pct, i) => (
              <View
                key={i}
                style={{
                  position: 'absolute',
                  top: LABEL_H + pct * BAR_H,
                  left: 0, right: 0,
                  height: StyleSheet.hairlineWidth,
                  backgroundColor: theme.border,
                  opacity: 0.7,
                }}
              />
            ))}
            {/* Bar columns */}
            <View style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, flexDirection: 'row', alignItems: 'flex-end' }}>
              {bars.map((bar, i) => {
                const bh = bar.value > 0 ? Math.max((bar.value / maxVal) * BAR_H, 4) : 0;
                const isMax = i === maxIdx && bar.value > 0;
                return (
                  <View key={i} style={{ flex: 1, alignItems: 'center', justifyContent: 'flex-end', height: CHART_TOTAL_H }}>
                    {isMax && (
                      <Text
                        style={[styles.barLabel, { bottom: bh + 6, left: 0, right: 0 }]}
                        numberOfLines={1}
                      >
                        {bar.value >= 1000 ? `€${(bar.value / 1000).toFixed(1)}k` : `€${bar.value.toFixed(0)}`}
                      </Text>
                    )}
                    <View style={[styles.chartBar, { height: bh, width: barW }]} />
                  </View>
                );
              })}
            </View>
          </View>
        </View>
        {/* X labels */}
        <View style={{ flexDirection: 'row', paddingLeft: Y_AXIS_W, marginTop: 4 }}>
          {bars.map((bar, i) => (
            <Text key={i} style={[styles.xLabel, { flex: 1 }]}>{bar.label}</Text>
          ))}
        </View>
      </View>
    );
  };

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Dashboard</Text>
        </View>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      </SafeAreaView>
    );
  }

  const kpiItems = [
    { label: 'Total Revenue', value: `€${totalRevenue.toFixed(2)}`, icon: 'trending-up' as const, color: '#2563eb' },
    { label: 'Total Orders', value: `${allOrders.length}`, icon: 'receipt' as const, color: '#4f46e5' },
    { label: 'Completed', value: `${completedOrders}`, icon: 'checkmark-circle' as const, color: '#059669' },
    { label: 'Avg Order', value: `€${avgOrderValue.toFixed(2)}`, icon: 'analytics' as const, color: '#d97706' },
    { label: 'Customers', value: `${userCount}`, icon: 'people' as const, color: '#7c3aed' },
    { label: 'Products', value: `${productCount}`, icon: 'cube' as const, color: '#0891b2' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Dashboard</Text>
      </View>
      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Revenue + Chart */}
        <View style={styles.heroCard}>
          <Text style={styles.heroAmount}>
            €{periodRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </Text>
          <View style={styles.tabs}>
            {(['Monthly', 'Weekly', 'Daily'] as Period[]).map(p => (
              <TouchableOpacity key={p} onPress={() => setPeriod(p)} style={styles.tabWrap}>
                <Text style={[styles.tab, period === p && styles.tabActive]}>{p}</Text>
                {period === p && <View style={styles.tabLine} />}
              </TouchableOpacity>
            ))}
          </View>
          {renderChart()}
        </View>

        {/* KPI grid */}
        <Text style={styles.sectionTitle}>Statistics</Text>
        <View style={styles.kpiGrid}>
          {kpiItems.map((item, i) => (
            <View key={i} style={styles.kpiCard}>
              <View style={styles.kpiIcon}>
                <Ionicons name={item.icon} size={18} color={item.color} />
              </View>
              <View style={styles.kpiTextWrap}>
                <Text style={styles.kpiValue}>{item.value}</Text>
                <Text style={styles.kpiLabel}>{item.label}</Text>
              </View>
            </View>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Top 3 Best Sellers</Text>
        {topProducts.length > 0 ? (
          <View style={styles.topList}>
            {topProducts.map((product, index) => (
              <View
                key={`${product.name}-${index}`}
                style={[
                  styles.topRow,
                  index === topProducts.length - 1 ? { borderBottomWidth: 0 } : null,
                ]}
              >
                <View style={styles.topLeft}>
                  <View style={styles.rankBadge}>
                    <Text style={styles.rankText}>{index + 1}</Text>
                  </View>
                  <Text style={styles.topName} numberOfLines={1}>{product.name}</Text>
                </View>
                <Text style={styles.topQty}>{product.qty} sold</Text>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.topEmpty}>
            <Text style={styles.topEmptyText}>No sales data yet.</Text>
          </View>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
