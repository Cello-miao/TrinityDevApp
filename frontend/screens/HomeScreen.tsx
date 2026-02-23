import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  TextInput,
  Dimensions,
  ImageBackground,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { mockProducts } from '../lib/mockData';
import { Product } from '../types';
import { addToCart } from '../lib/cartUtils';

const { width } = Dimensions.get('window');

export default function HomeScreen({ navigation }: any) {
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState<Product[]>(mockProducts);
  const [userName] = useState('xinxin');

  const handleAddToCart = async (product: Product) => {
    try {
      await addToCart(product, 1);
      Alert.alert('Success', `${product.name} added to cart!`);
    } catch (error) {
      Alert.alert('Error', 'Failed to add item to cart');
    }
  };

  const categories = [
    { name: 'Fresh Produce', image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=300', emoji: '🥕' },
    { name: 'Bakery', image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=300', emoji: '🥖' },
    { name: 'Dairy & Eggs', image: 'https://images.unsplash.com/photo-1628088062854-d1870b4553da?w=300', emoji: '🧀' },
    { name: 'Meat & Seafood', image: 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=300', emoji: '🥩' },
    { name: 'Beverages', image: 'https://images.unsplash.com/photo-1546171753-97d7676e4602?w=300', emoji: '☕' },
    { name: 'Snacks', image: 'https://images.unsplash.com/photo-1621939514649-280e2ee25f60?w=300', emoji: '🍿' },
  ];

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const recommendedProducts = filteredProducts.slice(0, 6);

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header with User Greeting */}
        <View style={styles.header}>
          <View style={styles.greetingContainer}>
            <Ionicons name="person-circle-outline" size={20} color="#64748b" />
            <Text style={styles.greeting}>Hello, {userName}</Text>
          </View>
        </View>

        {/* Special Offers */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="flash" size={18} color="#1e293b" />
            <Text style={styles.sectionTitle}>Special Offers</Text>
          </View>

          {/* Main Promo Banner */}
          <ImageBackground
            source={{ uri: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800' }}
            style={styles.mainPromo}
            imageStyle={{ borderRadius: 12 }}
          >
            <View style={styles.promoOverlay}>
              <Text style={styles.promoTitle}>Weekend Special</Text>
              <Text style={styles.promoSubtitle}>Up to 30% Off</Text>
              <Text style={styles.promoDescription}>Fresh products</Text>
            </View>
          </ImageBackground>

          {/* Small Promo Cards */}
          <View style={styles.smallPromosContainer}>
            <View style={styles.smallPromo}>
              <Text style={styles.smallPromoTitle}>New Members</Text>
              <Text style={styles.smallPromoSubtitle}>€5 off first order</Text>
              <Text style={styles.smallPromoDesc}>Use code: HELLO</Text>
            </View>
            <View style={styles.smallPromo}>
              <Text style={styles.smallPromoTitle}>Free Delivery</Text>
              <Text style={styles.smallPromoSubtitle}>On orders over €30</Text>
              <Text style={styles.smallPromoDesc}>Save on shipping</Text>
            </View>
          </View>
        </View>

        {/* Shop by Category */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderWithAction}>
            <Text style={styles.sectionTitle}>Shop by Category</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Search')}>
              <Text style={styles.viewAllText}>View All →</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.categoriesGrid}>
            {categories.map((category, index) => (
              <TouchableOpacity 
                key={index} 
                style={styles.categoryCard}
                onPress={() => navigation.navigate('CategoryProducts', { category })}
              >
                <ImageBackground
                  source={{ uri: category.image }}
                  style={styles.categoryImage}
                  imageStyle={{ borderRadius: 12 }}
                >
                  <View style={styles.categoryOverlay}>
                    <Text style={styles.categoryName}>{category.name}</Text>
                  </View>
                </ImageBackground>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Recommended for You */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="star" size={18} color="#1e293b" />
            <Text style={styles.sectionTitle}>Recommended for You</Text>
          </View>

          <View style={styles.productsGrid}>
            {recommendedProducts.map((product) => (
              <TouchableOpacity
                key={product.id}
                style={styles.productCard}
                onPress={() => navigation.navigate('ProductDetail', { product })}
              >
                {product.stock < 20 && (
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
                  <Text style={styles.productVendor}>Farm Direct</Text>
                  <Text style={styles.productName} numberOfLines={1}>
                    {product.name}
                  </Text>
                  <View style={styles.productFooter}>
                    <View>
                      <Text style={styles.productPrice}>€{product.price.toFixed(2)}</Text>
                      <Text style={styles.stockText}>Stock {product.stock}</Text>
                    </View>
                    <TouchableOpacity 
                      style={styles.addToCartButton}
                      onPress={() => handleAddToCart(product)}
                    >
                      <Ionicons name="add" size={20} color="#fff" />
                      <Text style={styles.addToCartText}>Add to Cart</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 12,
  },
  greetingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  greeting: {
    fontSize: 16,
    color: '#1e293b',
    fontWeight: '400',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
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
    color: '#1e293b',
  },
  scanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2c3e50',
    marginHorizontal: 16,
    marginTop: 16,
    paddingVertical: 16,
    borderRadius: 8,
    gap: 10,
  },
  scanButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 6,
  },
  sectionHeaderWithAction: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
  },
  viewAllText: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  mainPromo: {
    height: 160,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
  },
  promoOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    padding: 20,
    justifyContent: 'center',
  },
  promoTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  promoSubtitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  promoDescription: {
    color: '#e2e8f0',
    fontSize: 14,
  },
  smallPromosContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  smallPromo: {
    flex: 1,
    backgroundColor: '#34495e',
    padding: 16,
    borderRadius: 8,
  },
  smallPromoTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },
  smallPromoSubtitle: {
    color: '#cbd5e1',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 2,
  },
  smallPromoDesc: {
    color: '#94a3b8',
    fontSize: 11,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  categoryCard: {
    width: (width - 44) / 2,
    aspectRatio: 0.95,
  },
  categoryImage: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  categoryOverlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    padding: 10,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  categoryName: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginHorizontal: -4,
  },
  productCard: {
    width: (width - 44) / 2,
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
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
    height: 140,
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
  },
  productFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
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
    paddingVertical: 6,
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
