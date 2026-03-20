import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  ImageBackground,
  ActivityIndicator,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Product } from "../types";
import { productAPI, cartAPI, orderAPI } from "../lib/api";
import { useTheme } from "../lib/theme";

const { width } = Dimensions.get("window");
const CARD_WIDTH = (width - 48) / 2;

const PROMO_IMAGES = [
  "https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=800", // colorful fruits
  "https://images.unsplash.com/photo-1542838132-92c53300491e?w=800", // grocery store
  "https://images.unsplash.com/photo-1608686207856-001b95cf60ca?w=800", // fresh vegetables
];

export default function HomeScreen({ navigation }: any) {
  const theme = useTheme();
  const styles = createStyles(theme);
  const [products, setProducts] = useState<Product[]>([]);
  const [dynamicCategories, setDynamicCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("");
  const [recommendedProducts, setRecommendedProducts] = useState<Product[]>([]);
  const [discountedProducts, setDiscountedProducts] = useState<Product[]>([]);
  const [cartItems, setCartItems] = useState<Record<string, number>>({});
  const [cartItemIds, setCartItemIds] = useState<Record<string, string>>({});
  const [isLoadingRecommendations, setIsLoadingRecommendations] =
    useState(false);

  useFocusEffect(
    useCallback(() => {
      const load = async () => {
        await loadProducts();
        await loadUserName();
        await loadCart();
      };
      load();
    }, []),
  );

  useEffect(() => {
    if (products.length > 0) {
      if (recommendedProducts.length === 0) loadRecommendations();
      loadDiscountedProducts();
      generateDynamicCategories();
    }
  }, [products]);

  const CATEGORY_META: Record<string, { image: string }> = {
    "Fresh Produce": {
      image:
        "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=300",
    },
    Bakery: {
      image:
        "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=300",
    },
    "Dairy & Eggs": {
      image:
        "https://images.unsplash.com/photo-1628088062854-d1870b4553da?w=300",
    },
    "Meat & Seafood": {
      image:
        "https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=300",
    },
    Beverages: {
      image: "https://images.unsplash.com/photo-1546171753-97d7676e4602?w=300",
    },
    Snacks: {
      image:
        "https://images.unsplash.com/photo-1621939514649-280e2ee25f60?w=300",
    },
    Household: {
      image:
        "https://images.unsplash.com/photo-1584820927498-cafe5c152964?w=300",
    },
    Frozen: {
      image:
        "https://images.unsplash.com/photo-1588964895597-cfccd6e2a009?w=300",
    },
    Pantry: {
      image:
        "https://images.unsplash.com/photo-1606859191214-25806e8e2423?w=300",
    },
    Chocolates: {
      image: "https://images.unsplash.com/photo-1549007994-cb92caebd54b?w=300",
    },
    Groceries: {
      image: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=300",
    },
    "Beverages and beverages preparations": {
      image: "https://images.unsplash.com/photo-1546171753-97d7676e4602?w=300",
    },
    "Petit-déjeuners": {
      image:
        "https://images.unsplash.com/photo-1506084868230-bb9d95c24759?w=300",
    },
    Other: {
      image: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=300",
    },
  };

  const generateDynamicCategories = () => {
    const categoryMap = new Map();
    products.forEach((p) => {
      if (p.category && !categoryMap.has(p.category)) {
        const meta = CATEGORY_META[p.category] || {
          image:
            p.image ||
            "https://images.unsplash.com/photo-1542838132-92c53300491e?w=300",
        };
        categoryMap.set(p.category, { name: p.category, ...meta });
      }
    });
    setDynamicCategories(Array.from(categoryMap.values()));
  };

  const loadUserName = async () => {
    try {
      const userStr = await AsyncStorage.getItem("user");
      if (userStr) {
        const user = JSON.parse(userStr);
        setUserName(
          user.first_name || user.name || user.email?.split("@")[0] || "",
        );
      }
    } catch {}
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
            cartMap[productId] =
              (cartMap[productId] || 0) + (item.quantity || 0);
            cartIds[productId] = cartItemId;
          }
        });
      }
      setCartItems(cartMap);
      setCartItemIds(cartIds);
    } catch {
      setCartItems({});
      setCartItemIds({});
    }
  };

  const loadProducts = async () => {
    try {
      setLoading(true);
      const data = await productAPI.getAllProducts();
      setProducts(data);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  const loadDiscountedProducts = async () => {
    try {
      const discounted = await productAPI.getDiscountedProducts();
      if (discounted.length > 0) {
        setDiscountedProducts(discounted.slice(0, 10));
        return;
      }
    } catch {}
    setDiscountedProducts(
      products.filter((p) => Number(p.discount) > 0).slice(0, 10),
    );
  };

  const loadRecommendations = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (token) {
        try {
          const recs = await productAPI.getRecommendations(6);
          if (recs.length > 0) {
            setRecommendedProducts(recs);
            return;
          }
        } catch {}
        try {
          const orders = await orderAPI.getMyOrders();
          if (orders.length > 0) {
            const cats = new Set<string>();
            const ids = new Set<string>();
            orders.forEach((o: any) =>
              o.items?.forEach((i: any) => {
                if (i.product) {
                  cats.add(i.product.category);
                  ids.add(i.product.id);
                }
              }),
            );
            const recs = products.filter(
              (p) => cats.has(p.category) && !ids.has(p.id),
            );
            if (recs.length >= 4) {
              setRecommendedProducts(recs.slice(0, 6));
              return;
            }
          }
        } catch {}
      }
      setRecommendedProducts(
        [...products].sort((a, b) => a.stock - b.stock).slice(0, 6),
      );
    } catch {
      setRecommendedProducts(products.slice(0, 6));
    }
  };

  const refreshRecommendations = async () => {
    setIsLoadingRecommendations(true);
    await loadRecommendations();
    setIsLoadingRecommendations(false);
  };

  const handleAddToCart = async (product: Product) => {
    try {
      await cartAPI.addToCart(product.id, 1);
      await loadCart();
    } catch {}
  };

  const handleDecreaseQuantity = async (product: Product) => {
    try {
      const qty = cartItems[product.id] || 0;
      const id = cartItemIds[product.id];
      if (qty <= 1) {
        if (id) await cartAPI.removeFromCart(id);
      } else {
        if (id) await cartAPI.updateCartItem(id, qty - 1);
      }
      await loadCart();
    } catch {}
  };

  const cartTotal = Object.values(cartItems).reduce((a, b) => a + b, 0);

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 18) return "Good afternoon";
    return "Good evening";
  };

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* Header */}
        <LinearGradient
          colors={[theme.primary, theme.primaryDark]}
          style={styles.header}
        >
          <View style={styles.headerLeft}>
            <Text style={styles.greeting}>
              {getGreeting()}
              {userName ? `, ${userName}` : ""}
            </Text>
            <Text style={styles.headerSub}>What would you like today?</Text>
          </View>
          <TouchableOpacity
            style={styles.cartBtn}
            onPress={() => navigation.navigate("Cart")}
          >
            <Ionicons name="cart-outline" size={22} color="#fff" />
            {cartTotal > 0 && (
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>{cartTotal}</Text>
              </View>
            )}
          </TouchableOpacity>
        </LinearGradient>

        {/* Promo Banner */}
        <View style={styles.px}>
          <TouchableOpacity
            activeOpacity={0.92}
            onPress={() => navigation.navigate("PromoProducts")}
          >
            <ImageBackground
              source={{
                uri: "https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=800",
              }}
              style={styles.promoBanner}
              imageStyle={styles.promoBannerImg}
            >
              <LinearGradient
                colors={["transparent", "rgba(0,0,0,0.72)"]}
                style={styles.promoGrad}
              >
                <View style={styles.promoTagRow}>
                  <View style={styles.promoTag}>
                    <Ionicons name="flash" size={11} color="#fff" />
                    <Text style={styles.promoTagText}>DEALS OF THE DAY</Text>
                  </View>
                </View>
                <Text style={styles.promoTitle}>Fresh Savings</Text>
                <Text style={styles.promoSub}>
                  Up to 50% off on selected items
                </Text>
                <View style={styles.promoShopBtn}>
                  <Text style={styles.promoShopText}>Explore Offers →</Text>
                </View>
              </LinearGradient>
            </ImageBackground>
          </TouchableOpacity>
        </View>

        {/* On Sale Now */}
        {discountedProducts.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionRow}>
              <View style={styles.sectionLeft}>
                <View
                  style={[styles.sectionAccent, { backgroundColor: "#ef4444" }]}
                />
                <Text style={styles.sectionTitle}>On Sale Now</Text>
              </View>
              <TouchableOpacity
                onPress={() => navigation.navigate("PromoProducts")}
              >
                <Text style={styles.seeAll}>See all</Text>
              </TouchableOpacity>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{ marginHorizontal: -16 }}
              contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}
            >
              {discountedProducts.map((p) => (
                <TouchableOpacity
                  key={p.id}
                  style={styles.saleCard}
                  onPress={() =>
                    navigation.navigate("ProductDetail", { product: p })
                  }
                  activeOpacity={0.88}
                >
                  <View style={styles.saleBadge}>
                    <Text style={styles.saleBadgeText}>
                      -{Math.round(Number(p.discount))}%
                    </Text>
                  </View>
                  <Image
                    source={{ uri: p.image }}
                    style={styles.saleImg}
                    resizeMode="cover"
                  />
                  <View style={styles.saleBody}>
                    <Text style={styles.saleName} numberOfLines={1}>
                      {p.name}
                    </Text>
                    <Text style={styles.saleOld}>€{p.price.toFixed(2)}</Text>
                    <Text style={styles.saleNew}>
                      €
                      {(
                        p.price *
                        (1 - (Number(p.discount) || 0) / 100)
                      ).toFixed(2)}
                    </Text>
                    <TouchableOpacity
                      style={styles.saleAddBtn}
                      onPress={() => handleAddToCart(p)}
                    >
                      <Ionicons name="add" size={16} color="#fff" />
                      <Text style={styles.saleAddText}>Add</Text>
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Categories */}
        {dynamicCategories.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionRow}>
              <View style={styles.sectionLeft}>
                <View
                  style={[styles.sectionAccent, { backgroundColor: "#10b981" }]}
                />
                <Text style={styles.sectionTitle}>Shop by Category</Text>
              </View>
              <TouchableOpacity onPress={() => navigation.navigate("Search")}>
                <Text style={styles.seeAll}>See all</Text>
              </TouchableOpacity>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{ marginHorizontal: -16 }}
              contentContainerStyle={{ paddingHorizontal: 16, gap: 10 }}
            >
              {dynamicCategories.map((cat, i) => (
                <TouchableOpacity
                  key={i}
                  style={styles.catCard}
                  onPress={() =>
                    navigation.navigate("CategoryProducts", { category: cat })
                  }
                  activeOpacity={0.88}
                >
                  <ImageBackground
                    source={{ uri: cat.image }}
                    style={styles.catBg}
                    imageStyle={{ borderRadius: 14 }}
                  >
                    <LinearGradient
                      colors={["transparent", "rgba(0,0,0,0.6)"]}
                      style={styles.catGrad}
                    >
                      <Text style={styles.catName} numberOfLines={2}>
                        {cat.name}
                      </Text>
                    </LinearGradient>
                  </ImageBackground>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Recommended */}
        <View style={styles.section}>
          <View style={styles.sectionRow}>
            <View style={styles.sectionLeft}>
              <View
                style={[styles.sectionAccent, { backgroundColor: "#f59e0b" }]}
              />
              <Text style={styles.sectionTitle}>Picked for You</Text>
            </View>
            <TouchableOpacity
              onPress={refreshRecommendations}
              disabled={isLoadingRecommendations}
            >
              <Ionicons
                name="refresh"
                size={20}
                color={
                  isLoadingRecommendations ? theme.border : theme.textSecondary
                }
              />
            </TouchableOpacity>
          </View>

          {isLoadingRecommendations ? (
            <ActivityIndicator
              color={theme.primary}
              style={{ marginVertical: 32 }}
            />
          ) : (
            <View style={styles.grid}>
              {recommendedProducts.map((p) => (
                <TouchableOpacity
                  key={p.id}
                  style={styles.productCard}
                  onPress={() =>
                    navigation.navigate("ProductDetail", { product: p })
                  }
                  activeOpacity={0.88}
                >
                  {Number(p.discount) > 0 && (
                    <View style={styles.discBadge}>
                      <Text style={styles.discText}>
                        -{Math.round(Number(p.discount))}%
                      </Text>
                    </View>
                  )}
                  {p.stock < 20 && (
                    <View style={styles.hotBadge}>
                      <Text style={styles.hotText}></Text>
                    </View>
                  )}
                  <Image
                    source={{ uri: p.image }}
                    style={styles.productImg}
                    resizeMode="cover"
                  />
                  <View style={styles.productBody}>
                    <Text style={styles.productName} numberOfLines={2}>
                      {p.name}
                    </Text>
                    <Text style={styles.productCat}>{p.category}</Text>
                    <View style={styles.productFooter}>
                      <View>
                        {Number(p.discount) > 0 ? (
                          <>
                            <Text style={styles.oldPrice}>
                              €{p.price.toFixed(2)}
                            </Text>
                            <Text style={styles.newPrice}>
                              €
                              {(
                                p.price *
                                (1 - (Number(p.discount) || 0) / 100)
                              ).toFixed(2)}
                            </Text>
                          </>
                        ) : (
                          <Text style={styles.newPrice}>
                            €{p.price.toFixed(2)}
                          </Text>
                        )}
                      </View>
                      {cartItems[p.id] ? (
                        <View style={styles.qtyRow}>
                          <TouchableOpacity
                            style={styles.qtyBtn}
                            onPress={() => handleDecreaseQuantity(p)}
                          >
                            <Ionicons
                              name="remove"
                              size={13}
                              color={theme.text}
                            />
                          </TouchableOpacity>
                          <Text style={styles.qtyNum}>{cartItems[p.id]}</Text>
                          <TouchableOpacity
                            style={styles.qtyBtn}
                            onPress={() => handleAddToCart(p)}
                          >
                            <Ionicons name="add" size={13} color={theme.text} />
                          </TouchableOpacity>
                        </View>
                      ) : (
                        <TouchableOpacity
                          style={styles.addBtn}
                          onPress={() => handleAddToCart(p)}
                        >
                          <Ionicons name="add" size={18} color="#fff" />
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const createStyles = (theme: any) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background },
    px: { paddingHorizontal: 16 },

    // Header
    header: {
      paddingTop: Platform.OS === "ios" ? 56 : 40,
      paddingBottom: 24,
      paddingHorizontal: 20,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      borderBottomLeftRadius: 24,
      borderBottomRightRadius: 24,
      marginBottom: 20,
    },
    headerLeft: { flex: 1 },
    greeting: {
      fontSize: 20,
      fontWeight: "800",
      color: "#fff",
      marginBottom: 2,
    },
    headerSub: { fontSize: 13, color: "rgba(255,255,255,0.75)" },
    cartBtn: {
      width: 42,
      height: 42,
      borderRadius: 21,
      backgroundColor: "rgba(255,255,255,0.18)",
      alignItems: "center",
      justifyContent: "center",
    },
    cartBadge: {
      position: "absolute",
      top: -3,
      right: -3,
      backgroundColor: "#ef4444",
      borderRadius: 9,
      minWidth: 18,
      height: 18,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 4,
    },
    cartBadgeText: { color: "#fff", fontSize: 10, fontWeight: "800" },

    // Promo
    promoBanner: { height: 190, marginBottom: 4 },
    promoBannerImg: { borderRadius: 20 },
    promoGrad: {
      flex: 1,
      borderRadius: 20,
      padding: 18,
      justifyContent: "flex-end",
    },
    promoTagRow: { marginBottom: 8 },
    promoTag: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      backgroundColor: "#ef4444",
      alignSelf: "flex-start",
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 20,
    },
    promoTagText: {
      color: "#fff",
      fontSize: 10,
      fontWeight: "800",
      letterSpacing: 0.8,
    },
    promoTitle: {
      color: "#fff",
      fontSize: 24,
      fontWeight: "900",
      marginBottom: 2,
    },
    promoSub: {
      color: "rgba(255,255,255,0.85)",
      fontSize: 13,
      marginBottom: 12,
    },
    promoShopBtn: {
      backgroundColor: "#fff",
      alignSelf: "flex-start",
      paddingHorizontal: 14,
      paddingVertical: 7,
      borderRadius: 20,
    },
    promoShopText: { color: "#1e293b", fontSize: 13, fontWeight: "700" },

    // Section
    section: { marginTop: 24, paddingHorizontal: 16 },
    sectionRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 14,
    },
    sectionLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
    sectionAccent: { width: 4, height: 20, borderRadius: 2 },
    sectionTitle: { fontSize: 17, fontWeight: "800", color: theme.text },
    seeAll: { fontSize: 13, color: theme.primary, fontWeight: "600" },

    // Sale Cards
    saleCard: {
      width: 140,
      backgroundColor: theme.card,
      borderRadius: 16,
      overflow: "hidden",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 6,
      elevation: 3,
    },
    saleBadge: {
      position: "absolute",
      top: 8,
      left: 8,
      backgroundColor: "#ef4444",
      borderRadius: 8,
      paddingHorizontal: 7,
      paddingVertical: 3,
      zIndex: 10,
    },
    saleBadgeText: { color: "#fff", fontSize: 11, fontWeight: "800" },
    saleImg: { width: "100%", height: 110 },
    saleBody: { padding: 10 },
    saleName: {
      fontSize: 13,
      fontWeight: "700",
      color: theme.text,
      marginBottom: 3,
    },
    saleOld: {
      fontSize: 11,
      color: theme.textTertiary,
      textDecorationLine: "line-through",
    },
    saleNew: {
      fontSize: 15,
      fontWeight: "800",
      color: "#ef4444",
      marginBottom: 8,
    },
    saleAddBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.primary,
      borderRadius: 8,
      paddingVertical: 6,
      gap: 4,
    },
    saleAddText: { color: "#fff", fontSize: 12, fontWeight: "700" },

    // Category Cards
    catCard: { width: 100, height: 75, borderRadius: 14, overflow: "hidden" },
    catBg: { flex: 1 },
    catGrad: {
      flex: 1,
      borderRadius: 14,
      justifyContent: "flex-end",
      padding: 7,
    },
    catName: {
      color: "#fff",
      fontSize: 11,
      fontWeight: "700",
      textAlign: "center",
    },

    // Product Grid
    grid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
    productCard: {
      width: CARD_WIDTH,
      backgroundColor: theme.card,
      borderRadius: 18,
      overflow: "hidden",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.07,
      shadowRadius: 8,
      elevation: 3,
    },
    discBadge: {
      position: "absolute",
      top: 10,
      left: 10,
      backgroundColor: "#ef4444",
      borderRadius: 8,
      paddingHorizontal: 7,
      paddingVertical: 3,
      zIndex: 10,
    },
    discText: { color: "#fff", fontSize: 10, fontWeight: "800" },
    hotBadge: { position: "absolute", top: 8, right: 10, zIndex: 10 },
    hotText: { fontSize: 16 },
    productImg: { width: "100%", height: 148 },
    productBody: { padding: 12 },
    productName: {
      fontSize: 14,
      fontWeight: "700",
      color: theme.text,
      marginBottom: 2,
      lineHeight: 19,
    },
    productCat: {
      fontSize: 11,
      color: theme.textTertiary,
      marginBottom: 10,
      textTransform: "uppercase",
      letterSpacing: 0.4,
    },
    productFooter: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    oldPrice: {
      fontSize: 11,
      color: theme.textTertiary,
      textDecorationLine: "line-through",
    },
    newPrice: { fontSize: 16, fontWeight: "900", color: theme.text },
    addBtn: {
      width: 34,
      height: 34,
      borderRadius: 17,
      backgroundColor: theme.primary,
      alignItems: "center",
      justifyContent: "center",
    },
    qtyRow: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: theme.searchBackground,
      borderRadius: 20,
      paddingHorizontal: 4,
      gap: 2,
    },
    qtyBtn: {
      width: 26,
      height: 26,
      borderRadius: 13,
      alignItems: "center",
      justifyContent: "center",
    },
    qtyNum: {
      fontSize: 13,
      fontWeight: "800",
      color: theme.text,
      minWidth: 18,
      textAlign: "center",
    },
  });
