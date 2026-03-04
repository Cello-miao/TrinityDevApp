import React, { useState, useEffect } from "react";
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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { orderAPI, userAPI } from "../lib/api";
import { CartItem, User } from "../types";
import { API_BASE_URL } from "../lib/api";

export default function CheckoutScreen({ route, navigation }: any) {
  const { cartItems, total } = route.params as {
    cartItems: CartItem[];
    total: number;
  };

  // Billing Information (required fields)
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [streetAddress, setStreetAddress] = useState("");
  const [city, setCity] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [country, setCountry] = useState("France");

  const [paymentMethod, setPaymentMethod] = useState<"paypal" | "card" | null>(
    null,
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const [userProfile, setUserProfile] = useState<User | null>(null);

  // Load user profile on mount
  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      const profile = await userAPI.getProfile();
      setUserProfile(profile);

      // Auto-fill form with saved information
      if (profile.first_name) setFirstName(profile.first_name);
      if (profile.last_name) setLastName(profile.last_name);
      if (profile.email) setEmail(profile.email);
      if (profile.phone_number) setPhone(profile.phone_number);
      if (profile.billing_address) setStreetAddress(profile.billing_address);
      if (profile.billing_city) setCity(profile.billing_city);
      if (profile.billing_zip_code) setPostalCode(profile.billing_zip_code);
      if (profile.billing_country) setCountry(profile.billing_country);
    } catch (error) {
      console.error("Failed to load user profile:", error);
      // Continue without auto-fill
    }
  };

  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0,
  );
  const deliveryFee = 5.0;
  const orderTotal = subtotal + deliveryFee;

  const validateForm = () => {
    if (!firstName.trim()) {
      Alert.alert("Validation Error", "Please enter your first name");
      return false;
    }
    if (!lastName.trim()) {
      Alert.alert("Validation Error", "Please enter your last name");
      return false;
    }
    if (!email.trim() || !email.includes("@")) {
      Alert.alert("Validation Error", "Please enter a valid email address");
      return false;
    }
    if (!streetAddress.trim()) {
      Alert.alert("Validation Error", "Please enter your street address");
      return false;
    }
    if (!postalCode.trim()) {
      Alert.alert("Validation Error", "Please enter your postal code");
      return false;
    }
    if (!city.trim()) {
      Alert.alert("Validation Error", "Please enter your city");
      return false;
    }
    if (!paymentMethod) {
      Alert.alert("Validation Error", "Please select a payment method");
      return false;
    }
    return true;
  };

  const processPayPalPayment = async () => {
    try {
      setIsProcessing(true);

      const token = await AsyncStorage.getItem("token");
      const baseUrl = API_BASE_URL.replace("/api", "");

      const createResponse = await fetch(`${baseUrl}/api/paypal/create-order`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ amount: orderTotal }),
      });

      const { orderId, approvalUrl } = await createResponse.json();

      if (!approvalUrl) {
        Alert.alert("Error", "Failed to create PayPal order");
        setIsProcessing(false);
        return;
      }

      Alert.alert(
        "PayPal Payment",
        "You will be redirected to PayPal to complete your payment",
        [
          {
            text: "Cancel",
            style: "cancel",
            onPress: () => setIsProcessing(false),
          },
          {
            text: "Continue",
            onPress: async () => {
              await Linking.openURL(approvalUrl);

              const captureResponse = await fetch(
                `${baseUrl}/api/paypal/capture-order`,
                {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                  },
                  body: JSON.stringify({ orderId }),
                },
              );

              const captureData = await captureResponse.json();

              if (captureData.status === "COMPLETED") {
                await completeOrder("PayPal");
              } else {
                Alert.alert(
                  "Payment Pending",
                  "Please complete your payment on PayPal",
                );
                setIsProcessing(false);
              }
            },
          },
        ],
      );
    } catch (error) {
      console.error("PayPal payment error:", error);
      Alert.alert("Payment Error", "Failed to process PayPal payment");
      setIsProcessing(false);
    }
  };

  const completeOrder = async (method: string) => {
    try {
      const orderResponse = await orderAPI.createOrder({
        items: cartItems.map((item) => ({
          product_id: Number(item.product.id),
          quantity: item.quantity,
        })),
        payment_method: method.toLowerCase(),
        delivery_address: `${streetAddress}, ${city}, ${postalCode}, ${country}`,
        customer_name: `${firstName} ${lastName}`,
        customer_email: email,
        shipping_fee: deliveryFee,
        tax_rate: 0,
        tax_amount: 0,
      });

      // Save user address if not already saved
      if (userProfile && !userProfile.billing_address) {
        try {
          await userAPI.updateProfile({
            first_name: firstName.trim(),
            last_name: lastName.trim(),
            phone_number: phone.trim(),
            billing_address: streetAddress.trim(),
            billing_zip_code: postalCode.trim(),
            billing_city: city.trim(),
            billing_country: country.trim(),
          });
          console.log("User address saved for future orders");
        } catch (saveError) {
          console.error("Failed to save user address:", saveError);
          // Don't block order completion if address save fails
        }
      }

      // Clear local cart cache (server cart is cleared by backend after order creation)
      await AsyncStorage.setItem("cart", JSON.stringify([]));

      setIsProcessing(false);

      const orderLabel =
        orderResponse?.order?.order_number || orderResponse?.order?.id || "N/A";

      Alert.alert(
        "Order Successful! 🎉",
        `Your order #${orderLabel} has been placed successfully!\n\nPayment Method: ${method}\nTotal: €${orderTotal.toFixed(2)}`,
        [
          {
            text: "View Orders",
            onPress: () => navigation.navigate("Main", { screen: "Orders" }),
          },
        ],
      );
    } catch (error) {
      console.error("Failed to create order:", error);
      setIsProcessing(false);
      Alert.alert("Error", "Failed to place order, please try again");
    }
  };

  const handlePlaceOrder = async () => {
    if (!validateForm()) {
      return;
    }

    if (paymentMethod === "paypal") {
      await processPayPalPayment();
    } else if (paymentMethod === "card") {
      // For card payment, you would integrate Stripe or another payment processor
      Alert.alert(
        "Card Payment",
        "Card payment integration coming soon. Please use PayPal.",
        [{ text: "OK" }],
      );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#1e293b" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Checkout</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
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
              <Ionicons
                name="mail-outline"
                size={18}
                color="#94a3b8"
                style={styles.inputIcon}
              />
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
              <Ionicons
                name="call-outline"
                size={18}
                color="#94a3b8"
                style={styles.inputIcon}
              />
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
              paymentMethod === "paypal" && styles.paymentOptionSelected,
            ]}
            onPress={() => setPaymentMethod("paypal")}
          >
            <View style={styles.paymentOptionLeft}>
              <View
                style={[
                  styles.radioButton,
                  paymentMethod === "paypal" && styles.radioButtonSelected,
                ]}
              >
                {paymentMethod === "paypal" && (
                  <View style={styles.radioButtonInner} />
                )}
              </View>
              <Ionicons name="logo-paypal" size={24} color="#0070ba" />
              <Text style={styles.paymentOptionText}>PayPal</Text>
            </View>
            {paymentMethod === "paypal" && (
              <Ionicons name="checkmark-circle" size={24} color="#10b981" />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.paymentOption,
              paymentMethod === "card" && styles.paymentOptionSelected,
            ]}
            onPress={() => setPaymentMethod("card")}
          >
            <View style={styles.paymentOptionLeft}>
              <View
                style={[
                  styles.radioButton,
                  paymentMethod === "card" && styles.radioButtonSelected,
                ]}
              >
                {paymentMethod === "card" && (
                  <View style={styles.radioButtonInner} />
                )}
              </View>
              <Ionicons name="card-outline" size={24} color="#475569" />
              <Text style={styles.paymentOptionText}>Credit/Debit Card</Text>
            </View>
            {paymentMethod === "card" && (
              <Ionicons name="checkmark-circle" size={24} color="#10b981" />
            )}
          </TouchableOpacity>

          {paymentMethod === "paypal" && (
            <View style={styles.paymentInfo}>
              <Ionicons
                name="information-circle-outline"
                size={18}
                color="#0070ba"
              />
              <Text style={styles.paymentInfoText}>
                You will be redirected to PayPal to complete your payment
                securely.
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
          style={[
            styles.placeOrderButton,
            isProcessing && styles.placeOrderButtonDisabled,
          ]}
          onPress={handlePlaceOrder}
          disabled={isProcessing}
        >
          {isProcessing ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={20} color="#fff" />
              <Text style={styles.placeOrderText}>
                {paymentMethod === "paypal" ? "Pay with PayPal" : "Place Order"}
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
    backgroundColor: "#f8fafc",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1e293b",
  },
  scrollView: {
    flex: 1,
  },
  section: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1e293b",
    marginLeft: 8,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    color: "#1e293b",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: "#1e293b",
  },
  inputContainer: {
    position: "relative",
  },
  inputWithIcon: {
    paddingLeft: 44,
  },
  inputIcon: {
    position: "absolute",
    left: 16,
    top: 14,
    zIndex: 1,
  },
  textArea: {
    minHeight: 60,
    textAlignVertical: "top",
  },
  rowInputs: {
    flexDirection: "row",
  },
  selectContainer: {
    position: "relative",
  },
  selectInput: {
    paddingRight: 40,
  },
  selectIcon: {
    position: "absolute",
    right: 16,
    top: 14,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1e293b",
    marginBottom: 16,
  },
  summaryItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  summaryItemText: {
    fontSize: 14,
    color: "#475569",
    flex: 1,
  },
  summaryItemPrice: {
    fontSize: 14,
    fontWeight: "500",
    color: "#1e293b",
  },
  divider: {
    height: 1,
    backgroundColor: "#e2e8f0",
    marginVertical: 12,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: "#64748b",
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: "500",
    color: "#1e293b",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 4,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1e293b",
  },
  totalValue: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#1e293b",
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  placeOrderButton: {
    backgroundColor: "#475569",
    paddingVertical: 16,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  placeOrderButtonDisabled: {
    backgroundColor: "#94a3b8",
  },
  placeOrderText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    marginLeft: 8,
  },
  paymentOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderWidth: 2,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    marginBottom: 12,
  },
  paymentOptionSelected: {
    borderColor: "#10b981",
    backgroundColor: "#f0fdf4",
  },
  paymentOptionLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  paymentOptionText: {
    fontSize: 15,
    fontWeight: "500",
    color: "#1e293b",
  },
  radioButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#cbd5e1",
    alignItems: "center",
    justifyContent: "center",
  },
  radioButtonSelected: {
    borderColor: "#10b981",
  },
  radioButtonInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#10b981",
  },
  paymentInfo: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#eff6ff",
    padding: 12,
    borderRadius: 8,
    marginTop: 4,
    gap: 8,
  },
  paymentInfoText: {
    flex: 1,
    fontSize: 13,
    color: "#1e40af",
    lineHeight: 18,
  },
});
