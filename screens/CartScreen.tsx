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
import { CartItem } from '../types';
import { useFocusEffect } from '@react-navigation/native';

const DELIVERY_FEE = 10.0;
const FREE_DELIVERY_THRESHOLD = 100.0;
const DISCOUNT_THRESHOLD = 100.0;
const DISCOUNT_AMOUNT = 15.0;

export default function CartScreen({ navigation }: any) {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  const loadCart = async () => {
    try {
      const cartStr = await AsyncStorage.getItem('cart');
      if (cartStr) {
        setCartItems(JSON.parse(cartStr));
      }
    } catch (error) {
      console.error('Failed to load cart:', error);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      loadCart();
    }, [])
  );

  const updateQuantity = async (productId: string, newQuantity: number) => {
    const updatedCart = cartItems.map(item =>
      item.product.id === productId
        ? { ...item, quantity: newQuantity }
        : item
    ).filter(item => item.quantity > 0);

    setCartItems(updatedCart);
    await AsyncStorage.setItem('cart', JSON.stringify(updatedCart));
  };

  const removeItem = async (productId: string) => {
    const updatedCart = cartItems.filter(
      item => item.product.id !== productId
    );
    setCartItems(updatedCart);
    await AsyncStorage.setItem('cart', JSON.stringify(updatedCart));
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
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1e293b" />
        </TouchableOpacity>
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
        {cartItems.map((item) => (
          <View key={item.product.id} style={styles.cartItem}>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
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
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  emptyText: {
    fontSize: 18,
    color: '#64748b',
    marginTop: 16,
    marginBottom: 24,
  },
  shopButton: {
    backgroundColor: '#2c3e50',
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
    borderBottomColor: '#f1f5f9',
  },
  productImage: {
    width: 90,
    height: 90,
    borderRadius: 8,
    backgroundColor: '#f8fafc',
  },
  productInfo: {
    flex: 1,
    marginLeft: 16,
    justifyContent: 'flex-start',
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  productVendor: {
    fontSize: 13,
    color: '#64748b',
    marginBottom: 8,
  },
  productPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
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
    borderColor: '#e2e8f0',
    borderRadius: 8,
    backgroundColor: '#fff',
    overflow: 'hidden',
    marginTop: 4,
  },
  quantityButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#475569',
  },
  quantity: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
    paddingHorizontal: 16,
    minWidth: 36,
    textAlign: 'center',
  },
  priceSection: {
    marginHorizontal: 16,
    marginTop: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  priceSectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 16,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  priceLabel: {
    fontSize: 15,
    color: '#64748b',
  },
  priceValue: {
    fontSize: 15,
    color: '#1e293b',
    fontWeight: '500',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
  },
  totalValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  specialOffersSection: {
    marginHorizontal: 16,
    marginTop: 24,
  },
  specialOffersTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 12,
  },
  offerText: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 8,
    lineHeight: 20,
  },  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  checkoutButton: {
    backgroundColor: '#475569',
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
