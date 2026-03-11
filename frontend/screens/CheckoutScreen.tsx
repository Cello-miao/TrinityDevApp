import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { orderAPI, userAPI, API_BASE_URL } from "../lib/api";
import { CartItem, User } from "../types";
import { useTheme } from "../lib/theme";
import { showAppAlert } from "../lib/styledAlert";

let PayPalScriptProvider: any = null;
let PayPalButtons: any = null;
if (Platform?.OS === "web") {
  try {
    const paypalModule = require("@paypal/react-paypal-js");
    PayPalScriptProvider = paypalModule.PayPalScriptProvider;
    PayPalButtons = paypalModule.PayPalButtons;
  } catch (e) {}
}

const PAYPAL_CLIENT_ID =
  "AciX0ZVUI754jWR2tMxO0Jjwv-bv1wvoIeAzOf_avDsiklbReunu7U3YF80iehGZuhALz5aPE5Gnoiq3";

export default function CheckoutScreen({ route, navigation }: any) {
  const { cartItems, total } = route.params as {
    cartItems: CartItem[];
    total: number;
  };

  const theme = useTheme();
  const styles = createStyles(theme);
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
  const [formValid, setFormValid] = useState(false);

  useEffect(() => {
    loadUserProfile();
  }, []);

  useEffect(() => {
    setFormValid(
      firstName.trim() !== "" &&
        lastName.trim() !== "" &&
        email.trim().includes("@") &&
        streetAddress.trim() !== "" &&
        postalCode.trim() !== "" &&
        city.trim() !== "",
    );
  }, [firstName, lastName, email, streetAddress, postalCode, city]);

  const loadUserProfile = async () => {
    try {
      const profile = await userAPI.getProfile();
      setUserProfile(profile);
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
      showAppAlert("Validation Error", "Please enter your first name");
      return false;
    }
    if (!lastName.trim()) {
      showAppAlert("Validation Error", "Please enter your last name");
      return false;
    }
    if (!email.trim() || !email.includes("@")) {
      showAppAlert("Validation Error", "Please enter a valid email address");
      return false;
    }
    if (!streetAddress.trim()) {
      showAppAlert("Validation Error", "Please enter your street address");
      return false;
    }
    if (!postalCode.trim()) {
      showAppAlert("Validation Error", "Please enter your postal code");
      return false;
    }
    if (!city.trim()) {
      showAppAlert("Validation Error", "Please enter your city");
      return false;
    }
    if (!paymentMethod) {
      showAppAlert("Validation Error", "Please select a payment method");
      return false;
    }
    return true;
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
        } catch (saveError) {
          console.error("Failed to save user address", saveError);
        }
      }

      await AsyncStorage.setItem("cart", JSON.stringify([]));
      setIsProcessing(false);

      const orderLabel =
        orderResponse?.order?.order_number || orderResponse?.order?.id || "N/A";

      showAppAlert(
        "Order Successful!",
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
      showAppAlert("Error", "Failed to place order, please try again");
    }
  };

  const capturePayPalOrder = async (orderId: string) => {
    const token = await AsyncStorage.getItem("token");
    const baseUrl = API_BASE_URL.replace("/api", "");
    const captureResponse = await fetch(`${baseUrl}/api/paypal/capture-order`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ orderId }),
    });
    return await captureResponse.json();
  };

  const finalizePayPalOrder = async (orderId: string) => {
    const captureData = await capturePayPalOrder(orderId);
    if (captureData.status === "COMPLETED") {
      await completeOrder("PayPal");
      return true;
    }
    return false;
  };

  const wait = (ms: number) =>
    new Promise((resolve) => {
      setTimeout(resolve, ms);
    });

  const retryFinalizePayPalOrder = async (
    orderId: string,
    attempts = 6,
    delayMs = 1500,
  ) => {
    for (let i = 0; i < attempts; i += 1) {
      const ok = await finalizePayPalOrder(orderId);
      if (ok) {
        return true;
      }
      if (i < attempts - 1) {
        await wait(delayMs);
      }
    }
    return false;
  };

  const processMobilePayPal = async () => {
    try {
      setIsProcessing(true);
      const token = await AsyncStorage.getItem("token");
      const baseUrl = API_BASE_URL.replace("/api", "");
      const { createURL, addEventListener } = require("expo-linking");

      // In Expo Go, createURL generates an exp:// callback URL that can return
      // to the app correctly. In native builds, it uses the configured scheme.
      const returnUrl = createURL("payment-success");
      const cancelUrl = createURL("payment-cancel");

      const createResponse = await fetch(`${baseUrl}/api/paypal/create-order`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          amount: orderTotal,
          returnUrl,
          cancelUrl,
        }),
      });

      const { orderId, approvalUrl } = await createResponse.json();

      if (!approvalUrl) {
        showAppAlert("Error", "Failed to create PayPal order");
        setIsProcessing(false);
        return;
      }

      const { openAuthSessionAsync, warmUpAsync, coolDownAsync } =
        require("expo-web-browser");

      let handled = false;

      const finalizeFromCapture = async () => await finalizePayPalOrder(orderId);

      const subscription = addEventListener?.(
        "url",
        async ({ url }: { url: string }) => {
          if (handled) return;
          subscription?.remove?.();
          handled = true;
          if (url.includes("payment-success")) {
            const ok = await finalizeFromCapture();
            if (!ok) {
              showAppAlert("Payment Failed", "PayPal payment was not completed");
              setIsProcessing(false);
            }
          } else {
            showAppAlert("Cancelled", "PayPal payment was cancelled");
            setIsProcessing(false);
          }
        },
      );

      await warmUpAsync?.();
      const result = await openAuthSessionAsync(approvalUrl, returnUrl);
      await coolDownAsync?.();

      if (!handled) {
        subscription?.remove?.();
        if (
          result.type === "success" &&
          typeof result.url === "string" &&
          result.url.includes("payment-success")
        ) {
          handled = true;
          const ok = await finalizeFromCapture();
          if (!ok) {
            showAppAlert("Payment Failed", "PayPal payment was not completed");
            setIsProcessing(false);
          }
        } else {
          // Fallback for Expo Go/Android devices where PayPal cannot deep-link
          // back reliably: after user dismisses browser manually, retry capture.
          showAppAlert(
            "Confirming Payment",
            "We are confirming your PayPal payment. If PayPal keeps spinning, press back once and wait a few seconds.",
          );
          const ok = await retryFinalizePayPalOrder(orderId);
          if (!ok) {
            showAppAlert(
              "Payment Pending",
              "PayPal confirmation is delayed. Please return to Orders and refresh in a few seconds.",
            );
            setIsProcessing(false);
          }
        }
      }
    } catch (error) {
      console.error("PayPal payment error", error);
      showAppAlert("Payment Error", "Failed to process PayPal payment");
      setIsProcessing(false);
    }
  };

  const handlePlaceOrder = async () => {
    if (!validateForm()) return;
    if (paymentMethod === "paypal" && Platform.OS !== "web") {
      await processMobilePayPal();
    } else if (paymentMethod === "card") {
      showAppAlert(
        "Card Payment",
        "Card payment integration coming soon. Please use PayPal",
        [{ text: "OK" }],
      );
    }
  };

  const WebPayPalButtons = () => {
    if (!formValid) {
      return (
        <View style={styles.paypalDisabled}>
          <Text style={styles.paypalDisabledText}>
            Please fill in all required fields above to enable PayPal
          </Text>
        </View>
      );
    }

    return (
      <PayPalScriptProvider
        options={{ "client-id": PAYPAL_CLIENT_ID, currency: "EUR" }}
      >
        <PayPalButtons
          style={{
            layout: "vertical",
            color: "gold",
            shape: "rect",
            label: "paypal",
            height: 45,
          }}
          fundingSource="paypal"
          createOrder={async () => {
            const token = await AsyncStorage.getItem("token");
            const baseUrl = API_BASE_URL.replace("/api", "");
            const response = await fetch(`${baseUrl}/api/paypal/create-order`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({ amount: orderTotal }),
            });
            const { orderId } = await response.json();
            return orderId;
          }}
          onApprove={async (data: any) => {
            const captureData = await capturePayPalOrder(data.orderID);
            if (captureData.status === "COMPLETED") {
              await completeOrder("PayPal");
            } else {
              showAppAlert("Payment Failed", "PayPal payment was not completed");
            }
          }}
          onError={(err: any) => {
            console.error("PayPal error", err);
            showAppAlert("PayPal Error", "Something went wrong with PayPal");
          }}
        />
      </PayPalScriptProvider>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
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
        {/* Billing Information */}
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
            <Text style={styles.label}>Phone Number</Text>
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

        {/* Delivery Address */}
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

        {/* Payment Method */}
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

          {paymentMethod === "paypal" && Platform.OS === "web" && (
            <View style={styles.paypalButtonsContainer}>
              <WebPayPalButtons />
            </View>
          )}

          {paymentMethod === "paypal" && Platform.OS !== "web" && (
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

        {/* Order Summary */}
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

      {(Platform.OS !== "web" || paymentMethod === "card") && (
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
                  {paymentMethod === "paypal"
                    ? "Pay with PayPal"
                    : "Place Order"}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const createStyles = (theme: any) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      paddingVertical: 16,
      backgroundColor: theme.card,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    backButton: { padding: 4 },
    headerTitle: { fontSize: 18, fontWeight: "600", color: theme.text },
    scrollView: { flex: 1 },
    section: {
      backgroundColor: theme.card,
      marginHorizontal: 16,
      marginTop: 16,
      padding: 16,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.border,
    },
    sectionHeader: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 20,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: "600",
      color: theme.text,
      marginLeft: 8,
    },
    formGroup: { marginBottom: 16 },
    label: {
      fontSize: 14,
      fontWeight: "500",
      color: theme.text,
      marginBottom: 8,
    },
    input: {
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 8,
      paddingHorizontal: 16,
      paddingVertical: 12,
      fontSize: 15,
      color: theme.text,
    },
    inputContainer: { position: "relative" },
    inputWithIcon: { paddingLeft: 44 },
    inputIcon: { position: "absolute", left: 16, top: 14, zIndex: 1 },
    textArea: { minHeight: 60, textAlignVertical: "top" },
    rowInputs: { flexDirection: "row" },
    selectContainer: { position: "relative" },
    selectInput: { paddingRight: 40 },
    selectIcon: { position: "absolute", right: 16, top: 14 },
    summaryTitle: {
      fontSize: 16,
      fontWeight: "700",
      color: theme.text,
      marginBottom: 16,
    },
    summaryItem: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 12,
    },
    summaryItemText: { fontSize: 14, color: theme.primary, flex: 1 },
    summaryItemPrice: { fontSize: 14, fontWeight: "500", color: theme.text },
    divider: { height: 1, backgroundColor: theme.border, marginVertical: 12 },
    summaryRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 8,
    },
    summaryLabel: { fontSize: 14, color: theme.textSecondary },
    summaryValue: { fontSize: 14, fontWeight: "500", color: theme.text },
    totalRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginTop: 4,
    },
    totalLabel: { fontSize: 16, fontWeight: "700", color: theme.text },
    totalValue: { fontSize: 22, fontWeight: "bold", color: theme.text },
    footer: {
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: theme.card,
      borderTopWidth: 1,
      borderTopColor: theme.border,
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    placeOrderButton: {
      backgroundColor: theme.primary,
      paddingVertical: 16,
      borderRadius: 12,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
    },
    placeOrderButtonDisabled: { backgroundColor: theme.textTertiary },
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
      borderColor: theme.border,
      borderRadius: 12,
      marginBottom: 12,
    },
    paymentOptionSelected: {
      borderColor: theme.success,
      backgroundColor: "#f0fdf4",
    },
    paymentOptionLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
    paymentOptionText: { fontSize: 15, fontWeight: "500", color: theme.text },
    radioButton: {
      width: 24,
      height: 24,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: theme.textTertiary,
      alignItems: "center",
      justifyContent: "center",
    },
    radioButtonSelected: { borderColor: theme.success },
    radioButtonInner: {
      width: 12,
      height: 12,
      borderRadius: 6,
      backgroundColor: theme.success,
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
    paypalButtonsContainer: { marginTop: 12 },
    paypalDisabled: {
      padding: 16,
      backgroundColor: theme.border,
      borderRadius: 8,
      marginTop: 8,
    },
    paypalDisabledText: {
      fontSize: 13,
      color: theme.textSecondary,
      textAlign: "center",
    },
  });

