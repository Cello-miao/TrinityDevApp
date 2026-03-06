import React, { useState, useEffect, useCallback } from 'react';
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
import { useFocusEffect } from '@react-navigation/native';
import { productAPI } from '../lib/api';
import { useTheme } from '../lib/theme';

export default function SearchScreen({ navigation }: any) {
  const theme = useTheme();
  const styles = createStyles(theme);
  const [searchQuery, setSearchQuery] = useState('');
  const [dynamicCategories, setDynamicCategories] = useState<any[]>([]);

  useFocusEffect(
    useCallback(() => {
      loadCategories();
    }, [])
  );

  const loadCategories = async () => {
    try {
      const products = await productAPI.getAllProducts();
      
      const CATEGORY_META: Record<string, { emoji: string }> = {
        'Fresh Produce': { emoji: '🥕' },
        'Bakery': { emoji: '🥖' },
        'Dairy & Eggs': { emoji: '🧀' },
        'Meat & Seafood': { emoji: '🥩' },
        'Beverages': { emoji: '☕' },
        'Snacks': { emoji: '🍿' },
        'Health & Beauty': { emoji: '💄' },
        'Household': { emoji: '🧹' },
        'Frozen': { emoji: '🧊' },
        'Pantry': { emoji: '🥫' },
        'Chocolates': { emoji: '🍫' },
        'Spreads': { emoji: '🍯' },
        'Breakfast': { emoji: '🥣' },
        'Groceries': { emoji: '🛒' },
      };

      const categoryMap = new Map();
      products.forEach(p => {
        if (p.category && !categoryMap.has(p.category)) {
          const meta = CATEGORY_META[p.category] || { emoji: '📦' };
          categoryMap.set(p.category, {
            name: p.category,
            ...meta
          });
        }
      });
      
      setDynamicCategories(Array.from(categoryMap.values()));
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Search</Text>
      </View>

      {/* Search Input */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#94a3b8" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Find an article or offer"
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#94a3b8"
        />
        <TouchableOpacity 
          style={styles.scanIconButton}
          onPress={() => navigation.navigate('Scanner')}
        >
          <Ionicons name="scan-outline" size={20} color="#1e293b" />
        </TouchableOpacity>
      </View>

      {/* Categories List */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {dynamicCategories
          .filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()))
          .map((category, index) => (
          <TouchableOpacity
            key={index}
            style={styles.categoryItem}
            onPress={() => {
              navigation.navigate('CategoryProducts', { category });
            }}
          >
            <View style={styles.categoryLeft}>
              <Text style={styles.categoryName}>{category.name}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#cbd5e1" />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.card,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.text,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.inputBackground,
    marginHorizontal: 16,
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.border,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: theme.text,
  },
  scanIconButton: {
    padding: 4,
  },
  content: {
    flex: 1,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  categoryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryName: {
    fontSize: 16,
    color: theme.text,
    fontWeight: '500',
  },
});
