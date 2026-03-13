import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { Product } from '../types';
import { useTheme } from '../lib/theme';
import { productAPI, cartAPI } from '../lib/api';

export default function PromoProductsScreen({ navigation }: any) {
  const theme = useTheme();
  const styles = createStyles(theme);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [cartItems, setCartItems] = useState<Record<string, number>>({});
  const [cartItemIds, setCartItemIds] = useState<Record<string, string>>({});

  useEffect(() => {
    loadDiscountedProducts();
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadCart();
    }, [])
  );

  const loadCart = async () => {
    try {
      const cartData = await cartAPI.getCart();
      const cartMap: Record<string, number> = {};
      const cartIds: Record<string, string> = {};

      if (Array.isArray(cartData)) {
        cartData.forEach((cartItem: any) => {
          const productId = cartItem.product_id?.toString();
          const cartItemId = cartItem.id?.toString();
          if (productId && cartItemId) {
            cartMap[productId] = (cartMap[productId] || 0) + (cartItem.quantity || 0);
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

  const loadDiscountedProducts = async () => {
    try {
      setLoading(true);
      const discountedProducts = await productAPI.getDiscountedProducts();
      setProducts(discountedProducts);
    } catch (error) {
      console.error('Failed to load discounted products:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateDiscountedPrice = (price: number, discount?: number) => {
    if (!discount || discount === 0) return price;
    return price * (1 - discount / 100);
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

  const renderProduct = ({ item }: { item: Product }) => {
    const discountedPrice = calculateDiscountedPrice(item.price, item.discount);
    const hasDiscount = Number(item.discount) > 0;

    return (
      <TouchableOpacity
        style={styles.productCard}
        onPress={() => navigation.navigate('ProductDetail', { product: item })}
      >
        <Image source={{ uri: item.image }} style={styles.productImage} />
        
        {hasDiscount && (
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>{`${Math.round(item.discount || 0)}% OFF`}</Text>
          </View>
        )}

        <View style={styles.productInfo}>
          <Text style={styles.productName} numberOfLines={2}>
            {item.name}
          </Text>
          
          <View style={styles.priceContainer}>
            {hasDiscount && (
              <Text style={styles.originalPrice}>€{item.price.toFixed(2)}</Text>
            )}
            <Text style={styles.discountedPrice}>
              €{discountedPrice.toFixed(2)}
            </Text>
          </View>

          {item.brand && (
            <Text style={styles.brandText} numberOfLines={1}>
              {item.brand}
            </Text>
          )}

          <View style={styles.savingsContainer}>
            <Ionicons name="pricetag" size={14} color={theme.success} />
            <Text style={styles.savingsText}>
              Save €{(item.price - discountedPrice).toFixed(2)}
            </Text>
          </View>

          <View style={styles.cartActionRow}>
            {cartItems[item.id] ? (
              <View style={styles.quantityControl}>
                <TouchableOpacity
                  style={styles.quantityButton}
                  onPress={() => handleDecreaseQuantity(item)}
                >
                  <Ionicons name="remove" size={16} color="#fff" />
                </TouchableOpacity>
                <View style={styles.quantityDisplay}>
                  <Text style={styles.quantityText}>{cartItems[item.id]}</Text>
                </View>
                <TouchableOpacity
                  style={styles.quantityButton}
                  onPress={() => handleAddToCart(item)}
                >
                  <Ionicons name="add" size={16} color="#fff" />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.addToCartButton}
                onPress={() => handleAddToCart(item)}
              >
                <Ionicons name="add" size={20} color="#fff" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color={theme.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Promotional Products</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.success} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Promotional Products</Text>
        <View style={{ width: 24 }} />
      </View>

      {products.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="pricetags-outline" size={64} color={theme.textTertiary} />
          <Text style={styles.emptyText}>No promotional products available</Text>
          <Text style={styles.emptySubtext}>Check back later for great deals!</Text>
        </View>
      ) : (
        <FlatList
          data={products}
          renderItem={renderProduct}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={styles.listContainer}
          columnWrapperStyle={styles.columnWrapper}
        />
      )}
    </SafeAreaView>
  );
}

const createStyles = (theme: any) =>
  StyleSheet.create({
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
      backgroundColor: theme.headerBackground,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    backButton: {
      padding: 4,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.text,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 32,
    },
    emptyText: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.text,
      marginTop: 16,
    },
    emptySubtext: {
      fontSize: 14,
      color: theme.textSecondary,
      marginTop: 8,
    },
    listContainer: {
      padding: 12,
    },
    columnWrapper: {
      justifyContent: 'space-between',
    },
    productCard: {
      width: '48%',
      backgroundColor: theme.card,
      borderRadius: 12,
      marginBottom: 16,
      overflow: 'hidden',
      elevation: 2,
      shadowColor: theme.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    productImage: {
      width: '100%',
      height: 140,
      backgroundColor: theme.inputBackground,
    },
    discountBadge: {
      position: 'absolute',
      top: 8,
      right: 8,
      backgroundColor: '#ef4444',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
    },
    discountText: {
      color: '#fff',
      fontSize: 12,
      fontWeight: '700',
    },
    productInfo: {
      padding: 12,
    },
    productName: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.text,
      marginBottom: 8,
      height: 36,
    },
    priceContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 4,
    },
    originalPrice: {
      fontSize: 12,
      color: theme.textTertiary,
      textDecorationLine: 'line-through',
      marginRight: 6,
    },
    discountedPrice: {
      fontSize: 16,
      fontWeight: '700',
      color: theme.success,
    },
    brandText: {
      fontSize: 12,
      color: theme.textSecondary,
      marginBottom: 6,
    },
    savingsContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 4,
    },
    savingsText: {
      fontSize: 12,
      color: theme.success,
      fontWeight: '600',
      marginLeft: 4,
    },
    cartActionRow: {
      marginTop: 10,
      alignItems: 'flex-end',
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
