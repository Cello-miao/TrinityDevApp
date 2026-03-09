import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Image,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Product } from '../types';
import { cartAPI } from '../lib/api';
import { useTheme } from '../lib/theme';

export default function ProductDetailScreen({ route, navigation }: any) {
  const theme = useTheme();
  const styles = createStyles(theme);
  const { product } = route.params as { product: Product };
  const [quantity, setQuantity] = useState(1);
  const [isFavorite, setIsFavorite] = useState(false);
  const [cartQuantity, setCartQuantity] = useState(0);
  const [cartItemId, setCartItemId] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      checkFavoriteStatus();
      loadCartQuantity();
    }, [product.id])
  );

  const checkFavoriteStatus = async () => {
    try {
      const favoritesStr = await AsyncStorage.getItem('favorites');
      if (favoritesStr) {
        const favorites = JSON.parse(favoritesStr);
        setIsFavorite(favorites.some((p: Product) => p.id === product.id));
      }
    } catch (error) {
      console.error('Error checking favorite status:', error);
    }
  };

  const loadCartQuantity = async () => {
    try {
      const cartData = await cartAPI.getCart();
      if (Array.isArray(cartData)) {
        const cartItem = cartData.find((item: any) => 
          item.product_id?.toString() === product.id.toString()
        );
        if (cartItem) {
          const qty = cartItem.quantity || 0;
          setCartQuantity(qty);
          setQuantity(qty); // Set the quantity picker to cart quantity
          setCartItemId(cartItem.id?.toString() || null);
        } else {
          setCartQuantity(0);
          setQuantity(1); // Reset to 1 if not in cart
          setCartItemId(null);
        }
      }
    } catch (error) {
      console.error('Error loading cart quantity:', error);
      setCartQuantity(0);
      setQuantity(1);
      setCartItemId(null);
    }
  };

  const toggleFavorite = async () => {
    try {
      const favoritesStr = await AsyncStorage.getItem('favorites');
      let favorites = favoritesStr ? JSON.parse(favoritesStr) : [];
      
      if (isFavorite) {
        favorites = favorites.filter((p: Product) => p.id !== product.id);
      } else {
        favorites.push(product);
      }
      
      await AsyncStorage.setItem('favorites', JSON.stringify(favorites));
      setIsFavorite(!isFavorite);
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const handleAddToCart = async () => {
    try {
      if (cartItemId) {
        // Update existing cart item quantity
        await cartAPI.updateCartItem(cartItemId, quantity);
      } else {
        // Add new item to cart
        await cartAPI.addToCart(product.id, quantity);
      }
      await loadCartQuantity();
    } catch (error) {
      console.error('Failed to add to cart:', error);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView>
        <View style={styles.imageContainer}>
          <Image source={{ uri: product.image }} style={styles.image} />
          <TouchableOpacity 
            style={styles.favoriteButton}
            onPress={toggleFavorite}
          >
            <Ionicons 
              name={isFavorite ? "heart" : "heart-outline"} 
              size={28} 
              color={isFavorite ? "#ef4444" : "#1e293b"} 
            />
          </TouchableOpacity>
        </View>
        
        <View style={styles.content}>
          <Text style={styles.name}>{product.name}</Text>
          <Text style={styles.category}>{product.category}</Text>
          
          <View style={styles.priceContainer}>
            <Text style={styles.price}>€{product.price.toFixed(2)}</Text>
            {product.discount && (
              <View style={styles.discountBadge}>
                <Text style={styles.discountText}>-{product.discount}%</Text>
              </View>
            )}
          </View>

          <View style={styles.stockContainer}>
            <Ionicons
              name={product.stock > 0 ? 'checkmark-circle' : 'close-circle'}
              size={20}
              color={product.stock > 0 ? '#22c55e' : '#ef4444'}
            />
            <Text style={[
              styles.stockText,
              { color: product.stock > 0 ? '#22c55e' : '#ef4444' }
            ]}>
              {product.stock > 0 ? `In Stock: ${product.stock}` : 'Out of Stock'}
            </Text>
          </View>

          <View style={styles.divider} />

          <Text style={styles.sectionTitle}>Product Description</Text>
          <Text style={styles.description}>{product.description}</Text>

          {product.brand && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Brand:</Text>
              <Text style={styles.infoValue}>{product.brand}</Text>
            </View>
          )}

          {product.nutritionalInfo && (
            <>
              <View style={styles.divider} />
              <Text style={styles.sectionTitle}>Nutritional Information</Text>
              {product.nutritionalInfo.nutriscore_grade && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Nutri-Score:</Text>
                  <Text style={[styles.infoValue, { textTransform: 'uppercase', fontWeight: 'bold' }]}>
                    {product.nutritionalInfo.nutriscore_grade}
                  </Text>
                </View>
              )}
              {product.nutritionalInfo.energy_100g && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Energy (100g):</Text>
                  <Text style={styles.infoValue}>{product.nutritionalInfo.energy_100g} kcal</Text>
                </View>
              )}
            </>
          )}

          {product.barcode && (
            <>
              <View style={styles.divider} />
              <View style={styles.barcodeContainer}>
                <Ionicons name="barcode-outline" size={20} color="#64748b" />
                <Text style={styles.barcode}>Barcode: {product.barcode}</Text>
              </View>
            </>
          )}
        </View>
      </ScrollView>

      {/* Bottom Actions */}
      <View style={styles.bottomBar}>
        <View style={styles.quantityContainer}>
          <TouchableOpacity
            style={styles.quantityButton}
            onPress={() => setQuantity(Math.max(1, quantity - 1))}
          >
            <Ionicons name="remove" size={20} color="#475569" />
          </TouchableOpacity>
          <Text style={styles.quantity}>{quantity}</Text>
          <TouchableOpacity
            style={styles.quantityButton}
            onPress={() => setQuantity(Math.min(product.stock, quantity + 1))}
          >
            <Ionicons name="add" size={20} color="#475569" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.addButton, product.stock === 0 && styles.addButtonDisabled]}
          onPress={handleAddToCart}
          disabled={product.stock === 0}
        >
          <Ionicons name="cart" size={20} color="#fff" />
          <Text style={styles.addButtonText}>Add to Cart</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.surface,
  },
  imageContainer: {
    position: 'relative',
  },
  image: {
    width: '100%',
    height: 300,
    backgroundColor: theme.inputBackground,
  },
  favoriteButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  content: {
    padding: 20,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.text,
    marginBottom: 8,
  },
  category: {
    fontSize: 14,
    color: theme.textSecondary,
    marginBottom: 16,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  price: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.primary,
    marginRight: 12,
  },
  discountBadge: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  discountText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  stockContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  stockText: {
    fontSize: 14,
    marginLeft: 8,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: theme.border,
    marginVertical: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.text,
    marginBottom: 12,
  },
  description: {
    fontSize: 15,
    color: theme.textSecondary,
    lineHeight: 24,
  },
  barcodeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  barcode: {
    fontSize: 14,
    color: theme.textSecondary,
    marginLeft: 8,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  infoLabel: {
    fontSize: 14,
    color: theme.textSecondary,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 14,
    color: theme.text,
  },
  bottomBar: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: theme.border,
    backgroundColor: theme.surface,
    gap: 12,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.searchBackground,
    borderRadius: 12,
    padding: 4,
  },
  quantityButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.surface,
    borderRadius: 8,
  },
  quantity: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.text,
    paddingHorizontal: 16,
  },
  addButton: {
    flex: 1,
    backgroundColor: theme.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    gap: 8,
  },
  addButtonDisabled: {
    backgroundColor: theme.textSecondary,
  },
  addButtonText: {
    color: theme.buttonText,
    fontSize: 16,
    fontWeight: 'bold',
  },
});
