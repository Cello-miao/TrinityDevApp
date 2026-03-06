import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CartItem, Product } from '../types';
import { useFocusEffect } from '@react-navigation/native';
import { cartAPI } from '../lib/api';
import { useTheme } from '../lib/theme';

const DELIVERY_FEE = 10.0;
const FREE_DELIVERY_THRESHOLD = 100.0;
const DISCOUNT_THRESHOLD = 100.0;
const DISCOUNT_AMOUNT = 15.0;

export default function CartScreen({ navigation }: any) {
  const theme = useTheme();
  const styles = createStyles(theme);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);

  const loadCart = async () => {
    setLoading(true);
    try {
      // Try to load from backend API first
      const backendCart = await cartAPI.getCart();
      console.log('Backend cart loaded:', backendCart);
      
      if (backendCart && Array.isArray(backendCart) && backendCart.length > 0) {
        // Transform backend cart to CartItem format
        const transformedCart: CartItem[] = backendCart.map((item: any) => ({
          cartItemId: item.id, // Store cart item ID for deletion
          quantity: item.quantity,
          product: {
            id: item.product_id?.toString() || '',
            name: item.name || 'Unknown Product',
            price: parseFloat(item.price) || 0,
            image: item.picture || '',
            category: '',
            description: '',
            stock: 0,
          }
        }));
        
        // Remove duplicates based on cartItemId
        const uniqueCart = transformedCart.filter((item, index, self) => 
          index === self.findIndex((t) => t.cartItemId === item.cartItemId)
        );
        
        console.log('Transformed and deduplicated cart:', uniqueCart);
        setCartItems(uniqueCart);
        // Sync to local storage
        await AsyncStorage.setItem('cart', JSON.stringify(uniqueCart));
      } else {
        // Backend cart is empty, clear local storage too
        setCartItems([]);
        await AsyncStorage.setItem('cart', JSON.stringify([]));
      }
    } catch (error) {
      console.error('Failed to load cart from backend:', error);
      // On error, clear cart to avoid inconsistency
      setCartItems([]);
      await AsyncStorage.setItem('cart', JSON.stringify([]));
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      loadCart();
    }, [])
  );

  const updateQuantity = async (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      // If quantity is 0 or less, remove the item
      await removeItem(productId);
      return;
    }

    try {
      const item = cartItems.find(i => i.product.id === productId);
      if (item && item.cartItemId) {
        // Update in backend
        await cartAPI.updateCartItem(item.cartItemId.toString(), newQuantity);
      }
      
      const updatedCart = cartItems.map(item =>
        item.product.id === productId
          ? { ...item, quantity: newQuantity }
          : item
      );

      setCartItems(updatedCart);
      await AsyncStorage.setItem('cart', JSON.stringify(updatedCart));
    } catch (error: any) {
      console.error('Failed to update quantity:', error);
      console.error('Error details:', error.message);
      
      // Reload cart from backend on error
      try {
        await loadCart();
      } catch (reloadError) {
        console.error('Failed to reload cart:', reloadError);
      }
      
      Alert.alert('Error', `Failed to update quantity: ${error.message || 'Please try again.'}`);
    }
  };

  const removeItem = async (productId: string) => {
    try {
      const item = cartItems.find(i => i.product.id === productId);
      if (item && item.cartItemId) {
        // Remove from backend
        await cartAPI.removeFromCart(item.cartItemId.toString());
      }
      
      const updatedCart = cartItems.filter(
        item => item.product.id !== productId
      );
      setCartItems(updatedCart);
      await AsyncStorage.setItem('cart', JSON.stringify(updatedCart));
    } catch (error) {
      console.error('Failed to remove item:', error);
      
      // Reload cart from backend on error
      try {
        await loadCart();
      } catch (reloadError) {
        console.error('Failed to reload cart:', reloadError);
      }
      
      Alert.alert('Error', 'Failed to remove item from cart');
    }
  };

  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );

  const deliveryFee = subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_FEE;
  const total = subtotal + deliveryFee;
  const itemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const amountNeededForFreeDelivery = FREE_DELIVERY_THRESHOLD - subtotal;

  if (cartItems.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyContainer}>
          <Ionicons name="cart-outline" size={80} color="#cbd5e1" />
          <Text style={styles.emptyText}>Your cart is empty</Text>
          <TouchableOpacity
            style={styles.shopButton}
            onPress={() => navigation.navigate('Home')}
          >
            <Text style={styles.shopButtonText}>Start Shopping</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={{ width: 24 }} />
        <Text style={styles.headerTitle}>Shopping Cart ({itemCount} items)</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Delivery Banner */}
        {amountNeededForFreeDelivery > 0 && (
          <View style={styles.deliveryBanner}>
            <Text style={styles.deliveryBannerText}>
              Add €{amountNeededForFreeDelivery.toFixed(2)} more to enjoy free delivery and discounts!
            </Text>
          </View>
        )}

        {/* Cart Items */}
        {cartItems.map((item, index) => (
          <View key={item.cartItemId || `${item.product.id}-${index}`} style={styles.cartItem}>
            <Image
              source={{ uri: item.product.image }}
              style={styles.productImage}
            />
            <View style={styles.productInfo}>
              <Text style={styles.productName}>{item.product.name}</Text>
              <Text style={styles.productVendor}>Artisan Bakery</Text>
              <Text style={styles.productPrice}>
                €{item.product.price.toFixed(2)}
              </Text>
              
              {/* Quantity Controls */}
              <View style={styles.quantityContainer}>
                <TouchableOpacity
                  style={styles.quantityButton}
                  onPress={() => updateQuantity(item.product.id, item.quantity - 1)}
                >
                  <Ionicons name="remove" size={16} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.quantity}>{item.quantity}</Text>
                <TouchableOpacity
                  style={styles.quantityButton}
                  onPress={() => updateQuantity(item.product.id, item.quantity + 1)}
                >
                  <Ionicons name="add" size={16} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>
            
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => removeItem(item.product.id)}
            >
              <Ionicons name="trash-outline" size={22} color="#94a3b8" />
            </TouchableOpacity>
          </View>
        ))}

        {/* Price Details */}
        <View style={styles.priceSection}>
          <Text style={styles.priceSectionTitle}>Price Details</Text>
          
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Subtotal</Text>
            <Text style={styles.priceValue}>€{subtotal.toFixed(2)}</Text>
          </View>
          
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Delivery Fee</Text>
            <Text style={styles.priceValue}>€{deliveryFee.toFixed(2)}</Text>
          </View>
          
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>€{total.toFixed(2)}</Text>
          </View>
        </View>

        {/* Special Offers */}
        <View style={styles.specialOffersSection}>
          <Text style={styles.specialOffersTitle}>Special Offers</Text>
          <Text style={styles.offerText}>• Free delivery on orders over €{FREE_DELIVERY_THRESHOLD.toFixed(0)}</Text>
          <Text style={styles.offerText}>• €{DISCOUNT_AMOUNT.toFixed(0)} off on orders over €{DISCOUNT_THRESHOLD.toFixed(0)}</Text>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Checkout Button */}
      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.checkoutButton}
          onPress={() => navigation.navigate('Checkout', { cartItems, total })}
        >
          <Text style={styles.checkoutButtonText}>Proceed to Checkout</Text>
          <Text style={styles.checkoutButtonPrice}>€{total.toFixed(2)}</Text>
        </TouchableOpacity>
      </View>
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
    fontSize: 18,
    fontWeight: '600',
    color: theme.text,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.background,
  },
  emptyText: {
    fontSize: 18,
    color: theme.textSecondary,
    marginTop: 16,
    marginBottom: 24,
  },
  shopButton: {
    backgroundColor: theme.primaryDark,
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
  },
  shopButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  deliveryBanner: {
    backgroundColor: '#fef3c7',
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fbbf24',
  },
  deliveryBannerText: {
    color: '#92400e',
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
  },
  cartItem: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  productImage: {
    width: 90,
    height: 90,
    borderRadius: 8,
    backgroundColor: theme.inputBackground,
  },
  productInfo: {
    flex: 1,
    marginLeft: 16,
    justifyContent: 'flex-start',
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.text,
    marginBottom: 4,
  },
  productVendor: {
    fontSize: 13,
    color: theme.textSecondary,
    marginBottom: 8,
  },
  productPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.text,
    marginBottom: 8,
  },
  deleteButton: {
    padding: 8,
    alignSelf: 'flex-start',
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 8,
    backgroundColor: theme.surface,
    overflow: 'hidden',
    marginTop: 4,
  },
  quantityButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.primary,
  },
  quantity: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.text,
    paddingHorizontal: 16,
    minWidth: 36,
    textAlign: 'center',
  },
  priceSection: {
    marginHorizontal: 16,
    marginTop: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  priceSectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.text,
    marginBottom: 16,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  priceLabel: {
    fontSize: 15,
    color: theme.textSecondary,
  },
  priceValue: {
    fontSize: 15,
    color: theme.text,
    fontWeight: '500',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: theme.border,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.text,
  },
  totalValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: theme.text,
  },
  specialOffersSection: {
    marginHorizontal: 16,
    marginTop: 24,
  },
  specialOffersTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.text,
    marginBottom: 12,
  },
  offerText: {
    fontSize: 14,
    color: theme.textSecondary,
    marginBottom: 8,
    lineHeight: 20,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: theme.card,
    borderTopWidth: 1,
    borderTopColor: theme.border,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  checkoutButton: {
    backgroundColor: theme.primary,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  checkoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  checkoutButtonPrice: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },});
