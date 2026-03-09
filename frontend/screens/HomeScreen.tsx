import React, { useState, useEffect, useCallback } from 'react';
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Product } from '../types';
import { productAPI, cartAPI } from '../lib/api';
import { useTheme } from '../lib/theme';

const { width } = Dimensions.get('window');

export default function HomeScreen({ navigation }: any) {
  const theme = useTheme();
  const styles = createStyles(theme);
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [dynamicCategories, setDynamicCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState('Guest');
  const [recommendedProducts, setRecommendedProducts] = useState<Product[]>([]);
  const [cartItems, setCartItems] = useState<Record<string, number>>({});
  const [cartItemIds, setCartItemIds] = useState<Record<string, string>>({});

  useFocusEffect(
    useCallback(() => {
      const load = async () => {
        await loadProducts();
        await loadUserName();
        await loadCart();
      };
      load();
    }, [])
  );

  useEffect(() => {
    if (products.length > 0) {
      loadRecommendations();
      generateDynamicCategories();
    }
  }, [products]);

  const generateDynamicCategories = () => {
    const CATEGORY_META: Record<string, { emoji: string, image: string }> = {
      'Fresh Produce': { emoji: '🥕', image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=300' },
      'Bakery': { emoji: '🥖', image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=300' },
      'Dairy & Eggs': { emoji: '🧀', image: 'https://images.unsplash.com/photo-1628088062854-d1870b4553da?w=300' },
      'Meat & Seafood': { emoji: '🥩', image: 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=300' },
      'Beverages': { emoji: '☕', image: 'https://images.unsplash.com/photo-1546171753-97d7676e4602?w=300' },
      'Snacks': { emoji: '🍿', image: 'https://images.unsplash.com/photo-1621939514649-280e2ee25f60?w=300' },
      'Health & Beauty': { emoji: '💄', image: 'https://images.unsplash.com/photo-1596462502278-27bf85033e5a?w=300' },
      'Household': { emoji: '🧹', image: 'https://images.unsplash.com/photo-1584820927498-cafe5c152964?w=300' },
      'Frozen': { emoji: '🧊', image: 'https://images.unsplash.com/photo-1588964895597-cfccd6e2a009?w=300' },
      'Pantry': { emoji: '🥫', image: 'https://images.unsplash.com/photo-1606859191214-25806e8e2423?w=300' },
      'Chocolates': { emoji: '🍫', image: 'https://images.unsplash.com/photo-1549007994-cb92caebd54b?w=300' },
      'Spreads': { emoji: '🍯', image: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=300' },
      'Breakfast': { emoji: '🥣', image: 'https://images.unsplash.com/photo-1506084868230-bb9d95c24759?w=300' },
      'Groceries': { emoji: '🛒', image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=300' },
    };

    const categoryMap = new Map();
    products.forEach(p => {
      if (p.category && !categoryMap.has(p.category)) {
        const meta = CATEGORY_META[p.category] || {
          emoji: '📦',
          image: p.image || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=300'
        };
        categoryMap.set(p.category, {
          name: p.category,
          ...meta
        });
      }
    });
    
    setDynamicCategories(Array.from(categoryMap.values()));
  };

  const loadUserName = async () => {
    try {
      const userStr = await AsyncStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        setUserName(user.name || user.email?.split('@')[0] || 'Guest');
      }
    } catch (error) {
      console.error('Failed to load user name:', error);
    }
  };

  const loadCart = async () => {
    try {
      console.log('Loading cart...');
      const cartData = await cartAPI.getCart();
      console.log('Cart data:', cartData);
      const cartMap: Record<string, number> = {};
      const cartIds: Record<string, string> = {};
      
      // Backend returns array directly, not { items: [] }
      if (Array.isArray(cartData)) {
        cartData.forEach((item: any) => {
          const productId = item.product_id?.toString();
          const cartItemId = item.id?.toString();
          if (productId && cartItemId) {
            cartMap[productId] = (cartMap[productId] || 0) + (item.quantity || 0);
            cartIds[productId] = cartItemId;
          }
        });
      }
      
      console.log('Cart map:', cartMap);
      console.log('Cart IDs:', cartIds);
      setCartItems(cartMap);
      setCartItemIds(cartIds);
    } catch (error) {
      console.error('Failed to load cart:', error);
      setCartItems({});
      setCartItemIds({});
    }
  };

  const loadProducts = async () => {
    try {
      setLoading(true);
      const data = await productAPI.getAllProducts();
      setProducts(data);
    } catch (error) {
      console.error('Failed to load products:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadRecommendations = async () => {
    try {
      // Load order history
      const ordersStr = await AsyncStorage.getItem('orders');
      
      if (ordersStr) {
        const orders = JSON.parse(ordersStr);
        
        // Extract purchased product categories and IDs
        const purchasedCategories = new Set<string>();
        const purchasedProductIds = new Set<string>();
        
        orders.forEach((order: any) => {
          order.items?.forEach((item: any) => {
            if (item.product) {
              purchasedCategories.add(item.product.category);
              purchasedProductIds.add(item.product.id);
            }
          });
        });

        // Recommend products from same categories, excluding already purchased
        const recommendations = products.filter(product => 
          purchasedCategories.has(product.category) && 
          !purchasedProductIds.has(product.id)
        );

        // If not enough recommendations, add popular products (low stock = high demand)
        if (recommendations.length < 6) {
          const popularProducts = products
            .filter(p => !purchasedProductIds.has(p.id))
            .sort((a, b) => a.stock - b.stock)
            .slice(0, 6 - recommendations.length);
          
          setRecommendedProducts([...recommendations, ...popularProducts].slice(0, 6));
        } else {
          setRecommendedProducts(recommendations.slice(0, 6));
        }
      } else {
        // No purchase history - show popular products (low stock = popular)
        const popularProducts = products
          .sort((a, b) => a.stock - b.stock)
          .slice(0, 6);
        setRecommendedProducts(popularProducts);
      }
    } catch (error) {
      console.error('Failed to load recommendations:', error);
      // Fallback to first 6 products
      setRecommendedProducts(products.slice(0, 6));
    }
  };

  const handleAddToCart = async (product: Product) => {
    try {
      await cartAPI.addToCart(product.id, 1);
      // Reload cart to get updated quantities
      await loadCart();
    } catch (error) {
      console.error('Failed to add item to cart:', error);
    }
  };

  const handleDecreaseQuantity = async (product: Product) => {
    try {
      const currentQuantity = cartItems[product.id] || 0;
      const cartItemId = cartItemIds[product.id];
      
      if (currentQuantity <= 1) {
        // Remove from cart if quantity is 1
        if (cartItemId) {
          await cartAPI.removeFromCart(cartItemId);
        }
      } else {
        // Decrease quantity
        if (cartItemId) {
          await cartAPI.updateCartItem(cartItemId, currentQuantity - 1);
        }
      }
      
      // Reload cart to get updated quantities
      await loadCart();
    } catch (error) {
      console.error('Failed to decrease quantity:', error);
    }
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

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

        {/* Quick Action Buttons */}
        {/* <View style={styles.quickActionsContainer}>
          <TouchableOpacity 
            style={styles.quickActionButton}
            onPress={() => navigation.navigate('Scanner')}
          >
            <View style={styles.quickActionIcon}>
              <Ionicons name="scan" size={28} color="#fff" />
            </View>
            <Text style={styles.quickActionText}>Scan Product</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.quickActionButton}
            onPress={() => navigation.navigate('Cart')}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: '#10b981' }]}>
              <Ionicons name="cart" size={28} color="#fff" />
            </View>
            <Text style={styles.quickActionText}>My Cart</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.quickActionButton}
            onPress={() => navigation.navigate('Orders')}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: '#f59e0b' }]}>
              <Ionicons name="receipt" size={28} color="#fff" />
            </View>
            <Text style={styles.quickActionText}>Order History</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.quickActionButton}
            onPress={() => navigation.navigate('Profile')}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: '#8b5cf6' }]}>
              <Ionicons name="person" size={28} color="#fff" />
            </View>
            <Text style={styles.quickActionText}>My Account</Text>
          </TouchableOpacity>
        </View> */}

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
            {dynamicCategories.map((category, index) => (
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
                    {cartItems[product.id] ? (
                      <View style={styles.quantityControl}>
                        <TouchableOpacity 
                          style={styles.quantityButton}
                          onPress={() => handleDecreaseQuantity(product)}
                        >
                          <Ionicons name="remove" size={16} color="#fff" />
                        </TouchableOpacity>
                        <View style={styles.quantityDisplay}>
                          <Text style={styles.quantityText}>{cartItems[product.id]}</Text>
                        </View>
                        <TouchableOpacity 
                          style={styles.quantityButton}
                          onPress={() => handleAddToCart(product)}
                        >
                          <Ionicons name="add" size={16} color="#fff" />
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <TouchableOpacity 
                        style={styles.addToCartButton}
                        onPress={() => handleAddToCart(product)}
                      >
                        <Ionicons name="add" size={20} color="#fff" />
                      </TouchableOpacity>
                    )}
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

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  header: {
    backgroundColor: theme.headerBackground,
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
    color: theme.text,
    fontWeight: '400',
  },
  quickActionsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 20,
    gap: 12,
    backgroundColor: theme.surface,
  },
  quickActionButton: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
  },
  quickActionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: theme.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  quickActionText: {
    fontSize: 11,
    color: theme.textSecondary,
    fontWeight: '600',
    textAlign: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.searchBackground,
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
    color: theme.text,
  },
  scanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.primaryDark,
    marginHorizontal: 16,
    marginTop: 16,
    paddingVertical: 16,
    borderRadius: 8,
    gap: 10,
  },
  scanButtonText: {
    color: theme.buttonText,
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
    color: theme.text,
  },
  viewAllText: {
    fontSize: 14,
    color: theme.textSecondary,
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
    backgroundColor: theme.primary,
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
    backgroundColor: theme.card,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  hotBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: theme.badgeBackground,
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
    backgroundColor: theme.inputBackground,
  },
  productInfo: {
    padding: 12,
  },
  productVendor: {
    fontSize: 11,
    color: theme.textSecondary,
    marginBottom: 4,
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.text,
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
    color: theme.priceText,
  },
  stockText: {
    fontSize: 10,
    color: theme.textTertiary,
    marginTop: 2,
  },
  addToCartButton: {
    backgroundColor: theme.primaryDark,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityControl: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.primaryDark,
    borderRadius: 18,
    paddingHorizontal: 4,
    gap: 4,
  },
  quantityButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityDisplay: {
    minWidth: 24,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  quantityText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
