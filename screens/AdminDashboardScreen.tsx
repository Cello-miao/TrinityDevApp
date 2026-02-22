import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  SafeAreaView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { mockProducts } from '../lib/mockData';
import { Product } from '../types';
import { logout } from '../lib/auth';

export default function AdminDashboardScreen({ navigation }: any) {
  const [searchQuery, setSearchQuery] = useState('');
  const [products] = useState<Product[]>(mockProducts);

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.category.toLowerCase().includes(searchQuery.toLowerCase())
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

  const handleEdit = (product: Product) => {
    Alert.alert('Edit Product', `Edit ${product.name}`);
  };

  const handleDelete = (product: Product) => {
    Alert.alert(
      'Delete Product',
      `Are you sure you want to delete ${product.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            // Delete logic here
          },
        },
      ]
    );
  };

  const getCategoryName = (category: string) => {
    const categories: { [key: string]: string } = {
      'produce': 'Fresh Produce',
      'bakery': 'Bakery',
      'dairy': 'Dairy & Eggs',
      'meat': 'Meat & Seafood',
    };
    return categories[category] || category;
  };

  const getVendorName = (index: number) => {
    const vendors = ['Farm Direct', 'Tropical Farms', 'Garden Fresh', 'Natural Bakery'];
    return vendors[index % vendors.length];
  };

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

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.importButton}>
            <Ionicons name="cloud-upload-outline" size={20} color="#fff" />
            <Text style={styles.importButtonText}>Import</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.addButton}>
            <Ionicons name="add" size={20} color="#fff" />
            <Text style={styles.addButtonText}>Add Product</Text>
          </TouchableOpacity>
        </View>

        {/* Products List */}
        {filteredProducts.map((product, index) => (
          <View key={product.id} style={styles.productCard}>
            <Image
              source={{ uri: product.image }}
              style={styles.productImage}
            />
            <View style={styles.productContent}>
              <View style={styles.productHeader}>
                <View style={styles.productLeft}>
                  <Text style={styles.productName}>{product.name}</Text>
                  <Text style={styles.productVendor}>{getVendorName(index)}</Text>
                  <View style={styles.categoryBadge}>
                    <Text style={styles.categoryText}>{getCategoryName(product.category)}</Text>
                  </View>
                  <Text style={styles.productPrice}>€{product.price.toFixed(2)}</Text>
                  <Text style={styles.productBarcode}>
                    {Math.floor(Math.random() * 1000000000000000).toString().padStart(13, '3')}
                  </Text>
                </View>
                <View style={styles.productRight}>
                  <Text style={styles.stockText}>Stock: {product.stock}</Text>
                </View>
              </View>
              
              <View style={styles.productActions}>
                <TouchableOpacity
                  style={styles.editButton}
                  onPress={() => handleEdit(product)}
                >
                  <Ionicons name="pencil-outline" size={16} color="#475569" />
                  <Text style={styles.editButtonText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => handleDelete(product)}
                >
                  <Ionicons name="trash-outline" size={16} color="#ef4444" />
                  <Text style={styles.deleteButtonText}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ))}

        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem}>
          <View style={styles.navIconContainer}>
            <Ionicons name="cube" size={24} color="#475569" />
            <View style={styles.navBadge}>
              <Text style={styles.navBadgeText}>{products.length}</Text>
            </View>
          </View>
          <Text style={styles.navText}>Products</Text>
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
        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => navigation.navigate('AdminCustomers')}
        >
          <View style={styles.navIconContainer}>
            <Ionicons name="people-outline" size={24} color="#94a3b8" />
            <View style={styles.navBadge}>
              <Text style={styles.navBadgeText}>5</Text>
            </View>
          </View>
          <Text style={[styles.navText, styles.navTextInactive]}>Customers</Text>
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
  actionButtons: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 16,
    gap: 12,
  },
  importButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#5a6c7d',
    paddingVertical: 14,
    borderRadius: 8,
    gap: 8,
  },
  importButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  addButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#5a6c7d',
    paddingVertical: 14,
    borderRadius: 8,
    gap: 8,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  productCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    gap: 16,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  productImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
    backgroundColor: '#f8fafc',
  },
  productContent: {
    flex: 1,
  },
  productHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  productLeft: {
    flex: 1,
  },
  productRight: {
    alignItems: 'flex-end',
  },
  productName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 4,
  },
  productVendor: {
    fontSize: 13,
    color: '#64748b',
    marginBottom: 8,
  },
  categoryBadge: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  categoryText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '500',
  },
  productPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  productBarcode: {
    fontSize: 13,
    color: '#94a3b8',
  },
  stockText: {
    fontSize: 14,
    color: '#1e293b',
    fontWeight: '500',
  },
  productActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingVertical: 10,
    borderRadius: 6,
  },
  editButtonText: {
    fontSize: 14,
    color: '#475569',
    fontWeight: '500',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#fee2e2',
    paddingVertical: 10,
    borderRadius: 6,
  },
  deleteButtonText: {
    fontSize: 14,
    color: '#ef4444',
    fontWeight: '500',
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
