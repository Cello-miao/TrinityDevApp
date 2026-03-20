import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ImageBackground,
  StatusBar,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { login } from "../lib/auth";
import { showAppAlert } from "../lib/styledAlert";

export default function LoginScreen({ navigation }: any) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const clearOldData = async () => {
      try {
        await AsyncStorage.multiRemove(["user", "token", "cart"]);
      } catch {}
    };
    clearOldData();
  }, []);

  const handleLogin = async () => {
    if (!email || !password) {
      showAppAlert("Error", "Please fill in all fields");
      return;
    }
    setLoading(true);
    const user = await login(email, password);
    setLoading(false);
    if (user) {
      navigation.replace(user.role === "admin" ? "AdminDashboard" : "Main");
    } else {
      showAppAlert("Error", "Invalid email or password");
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
        translucent
        backgroundColor="transparent"
      />

      <ImageBackground
        source={{
          uri: "https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=800",
        }}
        style={styles.bg}
      >
        <LinearGradient
          colors={["rgba(0,0,0,0.1)", "rgba(0,0,0,0.82)"]}
          style={styles.gradient}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.inner}
          >
            <View style={styles.logoArea}>
              <View style={styles.logoBox}>
                <Ionicons name="cart" size={28} color="#fff" />
              </View>
              <Text style={styles.appName}>FreshCart</Text>
              <Text style={styles.tagline}>
                Fresh groceries, delivered fast.
              </Text>
            </View>

            <View style={styles.form}>
              <View style={styles.inputRow}>
                <Ionicons
                  name="mail-outline"
                  size={18}
                  color="rgba(255,255,255,0.6)"
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Email address"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  placeholderTextColor="rgba(255,255,255,0.5)"
                />
              </View>

              <View style={styles.inputRow}>
                <Ionicons
                  name="lock-closed-outline"
                  size={18}
                  color="rgba(255,255,255,0.6)"
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Password"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  placeholderTextColor="rgba(255,255,255,0.5)"
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeBtn}
                >
                  <Ionicons
                    name={showPassword ? "eye-off-outline" : "eye-outline"}
                    size={18}
                    color="rgba(255,255,255,0.6)"
                  />
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={[styles.signInBtn, loading && { opacity: 0.7 }]}
                onPress={handleLogin}
                disabled={loading}
                activeOpacity={0.85}
              >
                {loading ? (
                  <ActivityIndicator color="#1e293b" />
                ) : (
                  <Text style={styles.signInText}>Sign In</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => navigation.navigate("Register")}
                style={styles.registerBtn}
              >
                <Text style={styles.registerText}>
                  Don't have an account?{" "}
                  <Text style={styles.registerBold}>Sign Up</Text>
                </Text>
              </TouchableOpacity>

              <View style={styles.adminHint}>
                <Ionicons
                  name="information-circle-outline"
                  size={13}
                  color="rgba(255,255,255,0.5)"
                />
                <Text style={styles.adminHintText}>
                  Admin: admin@trinity.com / admin123
                </Text>
              </View>
            </View>
          </KeyboardAvoidingView>
        </LinearGradient>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  bg: { flex: 1 },
  gradient: { flex: 1 },
  inner: {
    flex: 1,
    justifyContent: "flex-end",
    paddingHorizontal: 24,
    paddingBottom: Platform.OS === "ios" ? 48 : 32,
  },

  logoArea: { marginBottom: 40 },
  logoBox: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  appName: {
    fontSize: 38,
    fontWeight: "900",
    color: "#fff",
    letterSpacing: -1,
    marginBottom: 4,
  },
  tagline: {
    fontSize: 15,
    color: "rgba(255,255,255,0.75)",
  },

  form: { gap: 12 },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.12)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 52,
  },
  inputIcon: { marginRight: 10 },
  input: {
    flex: 1,
    fontSize: 15,
    color: "#fff",
  },
  eyeBtn: { padding: 4 },

  signInBtn: {
    backgroundColor: "#fff",
    borderRadius: 14,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  signInText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#1e293b",
  },

  registerBtn: { alignItems: "center", marginTop: 4 },
  registerText: { fontSize: 14, color: "rgba(255,255,255,0.7)" },
  registerBold: { color: "#fff", fontWeight: "700" },

  adminHint: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 8,
    justifyContent: "center",
  },
  adminHintText: { fontSize: 12, color: "rgba(255,255,255,0.45)" },
});
