import React, { useState } from 'react';
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

const categories = [
  { name: 'Fresh Produce', icon: '🥕', emoji: '🥕' },
  { name: 'Bakery', icon: '🥖', emoji: '🥖' },
  { name: 'Dairy & Eggs', icon: '🧀', emoji: '🧀' },
  { name: 'Meat & Seafood', icon: '🥩', emoji: '🥩' },
  { name: 'Frozen', icon: '🧊', emoji: '🧊' },
  { name: 'Pantry', icon: '🥫', emoji: '🥫' },
  { name: 'Beverages', icon: '☕', emoji: '☕' },
  { name: 'Snacks', icon: '🍿', emoji: '🍿' },
  { name: 'Health & Beauty', icon: '💄', emoji: '💄' },
  { name: 'Household', icon: '🧹', emoji: '🧹' },
];

export default function SearchScreen({ navigation }: any) {
  const [searchQuery, setSearchQuery] = useState('');

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
        {categories.map((category, index) => (
          <TouchableOpacity
            key={index}
            style={styles.categoryItem}
            onPress={() => {
              navigation.navigate('CategoryProducts', { category });
            }}
          >
            <View style={styles.categoryLeft}>
              <View style={styles.iconContainer}>
                <Text style={styles.categoryEmoji}>{category.emoji}</Text>
              </View>
              <Text style={styles.categoryName}>{category.name}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#cbd5e1" />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    marginHorizontal: 16,
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#1e293b',
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
    borderBottomColor: '#f1f5f9',
  },
  categoryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryEmoji: {
    fontSize: 24,
  },
  categoryName: {
    fontSize: 16,
    color: '#1e293b',
    fontWeight: '500',
  },
});
