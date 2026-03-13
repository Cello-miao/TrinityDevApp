import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  SafeAreaView
} from "react-native";
import { Ionicons } from '@expo/vector-icons';
import { Product } from '../types';
import { productAPI, cartAPI } from '../lib/api';
import { useTheme } from '../lib/theme';
import { showAppAlert } from '../lib/styledAlert';

const { width } = Dimensions.get('window');

export default function CategoryProductsScreen({ route, navigation }: any) {
  const theme = useTheme();
  const styles = createStyles(theme);
  const { category } = route.params;
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [cartItems, setCartItems] = useState<Record<string, number>>({});
  const [cartItemIds, setCartItemIds] = useState<Record<string, string>>({});

  useEffect(() => {
    loadProducts();
    loadCart();
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
      showAppAlert('Error', 'Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const loadCart = async () => {
    try {
      const cartData = await cartAPI.getCart();
      const cartMap: Record<string, number> = {};
      const cartIds: Record<string, string> = {};

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

      setCartItems(cartMap);
      setCartItemIds(cartIds);
    } catch (error) {
      console.error('Failed to load cart:', error);
      setCartItems({});
      setCartItemIds({});
    }
  };

  const handleAddToCart = async (product: Product) => {
    try {
      await cartAPI.addToCart(product.id, 1);
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
        if (cartItemId) {
          await cartAPI.removeFromCart(cartItemId);
        }
      } else if (cartItemId) {
        await cartAPI.updateCartItem(cartItemId, currentQuantity - 1);
      }

      await loadCart();
    } catch (error) {
      console.error('Failed to decrease quantity:', error);
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
              {Number(product.discount) > 0 && (
                <View style={styles.discountBadge}>
                  <Ionicons name="flash" size={10} color="#fff" />
                  <Text style={styles.discountBadgeText}>{`${Math.round(product.discount || 0)}%`}</Text>
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
                  <View style={styles.priceBlock}>
                    {Number(product.discount) > 0 ? (
                      <>
                        <Text style={styles.originalPrice}>€{product.price.toFixed(2)}</Text>
                        <Text style={styles.productPrice}>
                          €{(product.price * (1 - (product.discount || 0) / 100)).toFixed(2)}
                        </Text>
                      </>
                    ) : (
                      <>
                        <Text style={[styles.originalPrice, styles.originalPricePlaceholder]}>€0.00</Text>
                        <Text style={styles.productPrice}>€{product.price.toFixed(2)}</Text>
                      </>
                    )}
                    <Text style={styles.stockText}>Stock {product.stock}</Text>
                  </View>
                  {cartItems[product.id] ? (
                    <View style={styles.quantityControl}>
                      <TouchableOpacity
                        style={styles.quantityButton}
                        onPress={(e) => {
                          e.stopPropagation();
                          handleDecreaseQuantity(product);
                        }}
                      >
                        <Ionicons name="remove" size={16} color={theme.text} />
                      </TouchableOpacity>
                      <View style={styles.quantityDisplay}>
                        <Text style={styles.quantityText}>{cartItems[product.id]}</Text>
                      </View>
                      <TouchableOpacity
                        style={styles.quantityButton}
                        onPress={(e) => {
                          e.stopPropagation();
                          handleAddToCart(product);
                        }}
                      >
                        <Ionicons name="add" size={16} color={theme.text} />
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <TouchableOpacity 
                      style={styles.addToCartButton}
                      onPress={(e) => {
                        e.stopPropagation();
                        handleAddToCart(product);
                      }}
                    >
                      <Ionicons name="add" size={20} color={theme.text} />
                    </TouchableOpacity>
                  )}
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

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: theme.card,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
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
    color: theme.text,
  },
  countContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  countText: {
    fontSize: 14,
    color: theme.textSecondary,
  },
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 8,
    gap: 12,
  },
  productCard: {
    width: (width - 44) / 2,
    backgroundColor: theme.card,
    borderRadius: 12,
    overflow: 'hidden',
    marginHorizontal: 4,
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
  discountBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#f59e0b',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  discountBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  productImage: {
    width: '100%',
    height: 160,
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
    minHeight: 36,
  },
  productFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    gap: 8,
  },
  priceBlock: {
    minHeight: 48,
    justifyContent: 'flex-end',
  },
  productPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.priceText,
  },
  originalPrice: {
    fontSize: 12,
    color: theme.textTertiary,
    textDecorationLine: 'line-through',
    marginBottom: 2,
  },
  originalPricePlaceholder: {
    opacity: 0,
  },
  stockText: {
    fontSize: 10,
    color: theme.textTertiary,
    marginTop: 2,
  },
  addToCartButton: {
    backgroundColor: theme.searchBackground,
    borderWidth: 1,
    borderColor: theme.border,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityControl: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.searchBackground,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 18,
    paddingHorizontal: 4,
    gap: 4,
  },
  quantityButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'transparent',
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
    color: theme.text,
    fontSize: 14,
    fontWeight: 'bold',
  },
});
