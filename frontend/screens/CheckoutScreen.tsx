import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CartItem, Order } from '../types';

export default function CheckoutScreen({ route, navigation }: any) {
  const { cartItems, total } = route.params as { cartItems: CartItem[]; total: number };
  
  // Billing Information (required fields)
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [streetAddress, setStreetAddress] = useState('');
  const [city, setCity] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [country, setCountry] = useState('France');
  
  const [paymentMethod, setPaymentMethod] = useState<'paypal' | 'card' | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const subtotal = cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const deliveryFee = 5.0;
  const orderTotal = subtotal + deliveryFee;

  const validateForm = () => {
    if (!firstName.trim()) {
      Alert.alert('Validation Error', 'Please enter your first name');
      return false;
    }
    if (!lastName.trim()) {
      Alert.alert('Validation Error', 'Please enter your last name');
      return false;
    }
    if (!email.trim() || !email.includes('@')) {
      Alert.alert('Validation Error', 'Please enter a valid email address');
      return false;
    }
    if (!streetAddress.trim()) {
      Alert.alert('Validation Error', 'Please enter your street address');
      return false;
    }
    if (!postalCode.trim()) {
      Alert.alert('Validation Error', 'Please enter your postal code');
      return false;
    }
    if (!city.trim()) {
      Alert.alert('Validation Error', 'Please enter your city');
      return false;
    }
    if (!paymentMethod) {
      Alert.alert('Validation Error', 'Please select a payment method');
      return false;
    }
    return true;
  };

  const processPayPalPayment = async () => {
    // PayPal Integration
    // In production, you would:
    // 1. Create PayPal order via backend API
    // 2. Get approval URL
    // 3. Open PayPal web checkout
    // 4. Handle redirect and capture payment
    
    try {
      setIsProcessing(true);
      
      // Simulate PayPal API call
      // In real implementation, call your backend endpoint that integrates with PayPal API
      const paypalOrderData = {
        amount: orderTotal.toFixed(2),
        currency: 'EUR',
        description: `Trinity Shop Order - ${cartItems.length} items`,
        return_url: 'trinityshop://payment-success',
        cancel_url: 'trinityshop://payment-cancel',
      };

      console.log('PayPal Order Data:', paypalOrderData);
      
      // For demonstration, use PayPal sandbox URL
      // In production, replace with your backend API endpoint
      const paypalUrl = `https://www.sandbox.paypal.com/checkoutnow?amount=${orderTotal.toFixed(2)}&currency=EUR`;
      
      Alert.alert(
        'PayPal Payment',
        'You will be redirected to PayPal to complete your payment.',
        [
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => setIsProcessing(false),
          },
          {
            text: 'Continue',
            onPress: async () => {
              // Open PayPal checkout
              const supported = await Linking.canOpenURL(paypalUrl);
              if (supported) {
                await Linking.openURL(paypalUrl);
                // Simulate successful payment for demo
                setTimeout(() => completeOrder('PayPal'), 3000);
              } else {
                Alert.alert('Error', 'Unable to open PayPal');
                setIsProcessing(false);
              }
            },
          },
        ]
      );
    } catch (error) {
      console.error('PayPal payment error:', error);
      Alert.alert('Payment Error', 'Failed to process PayPal payment');
      setIsProcessing(false);
    }
  };

  const completeOrder = async (method: string) => {
    try {
      const userStr = await AsyncStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;

      const order: Order = {
        id: `ORD${Date.now()}`,
        userId: user?.id || 'guest',
        items: cartItems,
        total: orderTotal,
        status: 'completed',
        createdAt: new Date().toISOString(),
        deliveryAddress: `${streetAddress}, ${city}, ${postalCode}, ${country}`,
        paymentMethod: method,
        customerName: `${firstName} ${lastName}`,
        customerEmail: email,
      };

      // Save order
      const ordersStr = await AsyncStorage.getItem('orders');
      const orders: Order[] = ordersStr ? JSON.parse(ordersStr) : [];
      orders.push(order);
      await AsyncStorage.setItem('orders', JSON.stringify(orders));

      // Clear cart
      await AsyncStorage.setItem('cart', JSON.stringify([]));

      setIsProcessing(false);

      Alert.alert(
        'Order Successful! 🎉',
        `Your order #${order.id} has been placed successfully!\n\nPayment Method: ${method}\nTotal: €${orderTotal.toFixed(2)}`,
        [
          {
            text: 'View Orders',
            onPress: () => navigation.navigate('Main', { screen: 'Orders' }),
          },
        ]
      );
    } catch (error) {
      setIsProcessing(false);
      Alert.alert('Error', 'Failed to place order, please try again');
    }
  };

  const handlePlaceOrder = async () => {
    if (!validateForm()) {
      return;
    }

    if (paymentMethod === 'paypal') {
      await processPayPalPayment();
    } else if (paymentMethod === 'card') {
      // For card payment, you would integrate Stripe or another payment processor
      Alert.alert(
        'Card Payment',
        'Card payment integration coming soon. Please use PayPal.',
        [{ text: 'OK' }]
      );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1e293b" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Checkout</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Billing Information Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="document-text-outline" size={20} color="#1e293b" />
            <Text style={styles.sectionTitle}>Billing Information</Text>
          </View>

          <View style={styles.rowInputs}>
            <View style={[styles.formGroup, { flex: 1, marginRight: 12 }]}>
              <Text style={styles.label}>First Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="John"
                value={firstName}
                onChangeText={setFirstName}
                placeholderTextColor="#94a3b8"
              />
            </View>

            <View style={[styles.formGroup, { flex: 1 }]}>
              <Text style={styles.label}>Last Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="Doe"
                value={lastName}
                onChangeText={setLastName}
                placeholderTextColor="#94a3b8"
              />
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Email Address *</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="mail-outline" size={18} color="#94a3b8" style={styles.inputIcon} />
              <TextInput
                style={[styles.input, styles.inputWithIcon]}
                placeholder="john.doe@example.com"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholderTextColor="#94a3b8"
              />
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Phone Number *</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="call-outline" size={18} color="#94a3b8" style={styles.inputIcon} />
              <TextInput
                style={[styles.input, styles.inputWithIcon]}
                placeholder="+33 1 23 45 67 89"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                placeholderTextColor="#94a3b8"
              />
            </View>
          </View>
        </View>

        {/* Delivery Address Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="location-outline" size={20} color="#1e293b" />
            <Text style={styles.sectionTitle}>Delivery Address</Text>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Street Address *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="123 Main Street, Apt 4B"
              value={streetAddress}
              onChangeText={setStreetAddress}
              multiline
              numberOfLines={2}
              placeholderTextColor="#94a3b8"
            />
          </View>

          <View style={styles.rowInputs}>
            <View style={[styles.formGroup, { flex: 1, marginRight: 12 }]}>
              <Text style={styles.label}>Postal Code *</Text>
              <TextInput
                style={styles.input}
                placeholder="75001"
                value={postalCode}
                onChangeText={setPostalCode}
                keyboardType="numeric"
                placeholderTextColor="#94a3b8"
              />
            </View>

            <View style={[styles.formGroup, { flex: 1 }]}>
              <Text style={styles.label}>City *</Text>
              <TextInput
                style={styles.input}
                placeholder="Paris"
                value={city}
                onChangeText={setCity}
                placeholderTextColor="#94a3b8"
              />
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Country *</Text>
            <TextInput
              style={styles.input}
              placeholder="France"
              value={country}
              onChangeText={setCountry}
              placeholderTextColor="#94a3b8"
            />
          </View>
        </View>

        {/* Payment Method Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="card-outline" size={20} color="#1e293b" />
            <Text style={styles.sectionTitle}>Payment Method *</Text>
          </View>

          <TouchableOpacity
            style={[
              styles.paymentOption,
              paymentMethod === 'paypal' && styles.paymentOptionSelected,
            ]}
            onPress={() => setPaymentMethod('paypal')}
          >
            <View style={styles.paymentOptionLeft}>
              <View style={[
                styles.radioButton,
                paymentMethod === 'paypal' && styles.radioButtonSelected,
              ]}>
                {paymentMethod === 'paypal' && <View style={styles.radioButtonInner} />}
              </View>
              <Ionicons name="logo-paypal" size={24} color="#0070ba" />
              <Text style={styles.paymentOptionText}>PayPal</Text>
            </View>
            {paymentMethod === 'paypal' && (
              <Ionicons name="checkmark-circle" size={24} color="#10b981" />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.paymentOption,
              paymentMethod === 'card' && styles.paymentOptionSelected,
            ]}
            onPress={() => setPaymentMethod('card')}
          >
            <View style={styles.paymentOptionLeft}>
              <View style={[
                styles.radioButton,
                paymentMethod === 'card' && styles.radioButtonSelected,
              ]}>
                {paymentMethod === 'card' && <View style={styles.radioButtonInner} />}
              </View>
              <Ionicons name="card-outline" size={24} color="#475569" />
              <Text style={styles.paymentOptionText}>Credit/Debit Card</Text>
            </View>
            {paymentMethod === 'card' && (
              <Ionicons name="checkmark-circle" size={24} color="#10b981" />
            )}
          </TouchableOpacity>

          {paymentMethod === 'paypal' && (
            <View style={styles.paymentInfo}>
              <Ionicons name="information-circle-outline" size={18} color="#0070ba" />
              <Text style={styles.paymentInfoText}>
                You will be redirected to PayPal to complete your payment securely.
              </Text>
            </View>
          )}
        </View>

        {/* Order Summary Section */}
        <View style={styles.section}>
          <Text style={styles.summaryTitle}>Order Summary</Text>
          
          {cartItems.map((item) => (
            <View key={item.product.id} style={styles.summaryItem}>
              <Text style={styles.summaryItemText}>
                {item.product.name} × {item.quantity}
              </Text>
              <Text style={styles.summaryItemPrice}>
                €{(item.product.price * item.quantity).toFixed(2)}
              </Text>
            </View>
          ))}

          <View style={styles.divider} />

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryValue}>€{subtotal.toFixed(2)}</Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Delivery Fee</Text>
            <Text style={styles.summaryValue}>€{deliveryFee.toFixed(2)}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>€{orderTotal.toFixed(2)}</Text>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Place Order Button */}
      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.placeOrderButton, isProcessing && styles.placeOrderButtonDisabled]} 
          onPress={handlePlaceOrder}
          disabled={isProcessing}
        >
          {isProcessing ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={20} color="#fff" />
              <Text style={styles.placeOrderText}>
                {paymentMethod === 'paypal' ? 'Pay with PayPal' : 'Place Order'}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
  },
  scrollView: {
    flex: 1,
  },
  section: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginLeft: 8,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1e293b',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: '#1e293b',
  },
  inputContainer: {
    position: 'relative',
  },
  inputWithIcon: {
    paddingLeft: 44,
  },
  inputIcon: {
    position: 'absolute',
    left: 16,
    top: 14,
    zIndex: 1,
  },
  textArea: {
    minHeight: 60,
    textAlignVertical: 'top',
  },
  rowInputs: {
    flexDirection: 'row',
  },
  selectContainer: {
    position: 'relative',
  },
  selectInput: {
    paddingRight: 40,
  },
  selectIcon: {
    position: 'absolute',
    right: 16,
    top: 14,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 16,
  },
  summaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryItemText: {
    fontSize: 14,
    color: '#475569',
    flex: 1,
  },
  summaryItemPrice: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1e293b',
  },
  divider: {
    height: 1,
    backgroundColor: '#e2e8f0',
    marginVertical: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#64748b',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1e293b',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
  },
  totalValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  footer: {
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
  placeOrderButton: {
    backgroundColor: '#475569',
    paddingVertical: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  placeOrderButtonDisabled: {
    backgroundColor: '#94a3b8',
  },
  placeOrderText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    marginBottom: 12,
  },
  paymentOptionSelected: {
    borderColor: '#10b981',
    backgroundColor: '#f0fdf4',
  },
  paymentOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  paymentOptionText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1e293b',
  },
  radioButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#cbd5e1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioButtonSelected: {
    borderColor: '#10b981',
  },
  radioButtonInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#10b981',
  },
  paymentInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#eff6ff',
    padding: 12,
    borderRadius: 8,
    marginTop: 4,
    gap: 8,
  },
  paymentInfoText: {
    flex: 1,
    fontSize: 13,
    color: '#1e40af',
    lineHeight: 18,
  },
});
