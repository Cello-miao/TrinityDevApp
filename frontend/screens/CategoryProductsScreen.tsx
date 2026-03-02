import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  SafeAreaView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Product } from '../types';
import { productAPI, cartAPI } from '../lib/api';

const { width } = Dimensions.get('window');

export default function CategoryProductsScreen({ route, navigation }: any) {
  const { category } = route.params;
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProducts();
  }, [category]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const data = await productAPI.getAllProducts();
      // Filter by category if needed
      const filtered = data.filter(p => p.category === category.name);
      setProducts(filtered.length > 0 ? filtered : data);
    } catch (error) {
      console.error('Failed to load products:', error);
      Alert.alert('Error', 'Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async (product: Product) => {
    try {
      await cartAPI.addToCart(product.id, 1);
      Alert.alert('Success', `${product.name} added to cart!`);
    } catch (error) {
      Alert.alert('Error', 'Failed to add item to cart');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1e293b" />
        </TouchableOpacity>
        <View style={styles.headerTitle}>
          <Text style={styles.categoryName}>{category.name}</Text>
        </View>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Products Count */}
        <View style={styles.countContainer}>
          <Text style={styles.countText}>{products.length} products found</Text>
        </View>

        {/* Products Grid */}
        <View style={styles.productsGrid}>
          {products.map((product) => (
            <TouchableOpacity
              key={product.id}
              style={styles.productCard}
              onPress={() => navigation.navigate('ProductDetail', { product })}
            >
              {product.stock < 30 && (
                <View style={styles.hotBadge}>
                  <Text style={styles.hotBadgeText}>Hot</Text>
                </View>
              )}
              <Image
                source={{ uri: product.image }}
                style={styles.productImage}
                resizeMode="cover"
              />
              <View style={styles.productInfo}>
                <Text style={styles.productVendor}>
                  {product.stock > 50 ? 'Natural Bakery' : 'Artisan Bakery'}
                </Text>
                <Text style={styles.productName} numberOfLines={2}>
                  {product.name}
                </Text>
                <View style={styles.productFooter}>
                  <View>
                    <Text style={styles.productPrice}>€{product.price.toFixed(2)}</Text>
                    <Text style={styles.stockText}>Stock {product.stock}</Text>
                  </View>
                  <TouchableOpacity 
                    style={styles.addToCartButton}
                    onPress={(e) => {
                      e.stopPropagation();
                      handleAddToCart(product);
                    }}
                  >
                    <Ionicons name="add" size={18} color="#fff" />
                    <Text style={styles.addToCartText}>Add to Cart</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  categoryName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
  },
  countContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  countText: {
    fontSize: 14,
    color: '#64748b',
  },
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 8,
    gap: 12,
  },
  productCard: {
    width: (width - 44) / 2,
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    marginHorizontal: 4,
    position: 'relative',
  },
  hotBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#ef4444',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
    zIndex: 10,
  },
  hotBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  productImage: {
    width: '100%',
    height: 160,
    backgroundColor: '#f8fafc',
  },
  productInfo: {
    padding: 12,
  },
  productVendor: {
    fontSize: 11,
    color: '#64748b',
    marginBottom: 4,
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 8,
    minHeight: 36,
  },
  productFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    gap: 8,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  stockText: {
    fontSize: 10,
    color: '#94a3b8',
    marginTop: 2,
  },
  addToCartButton: {
    flexDirection: 'row',
    backgroundColor: '#2c3e50',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
    gap: 4,
  },
  addToCartText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
});
